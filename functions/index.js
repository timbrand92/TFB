const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp();
const db = admin.firestore();

const stripeSecretKey    = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

// ─── Price IDs ────────────────────────────────────────────────────────────────
// Replace these with your real Stripe price IDs.
// Stripe Dashboard → Products → (select product) → Prices → copy price ID
const PRICES = {
  starter_monthly:  "REPLACE_WITH_STARTER_MONTHLY_PRICE_ID",
  starter_annual:   "REPLACE_WITH_STARTER_ANNUAL_PRICE_ID",
  pro_monthly:      "REPLACE_WITH_PRO_MONTHLY_PRICE_ID",
  pro_annual:       "REPLACE_WITH_PRO_ANNUAL_PRICE_ID",
  club_monthly:     "REPLACE_WITH_CLUB_MONTHLY_PRICE_ID",
  club_annual:      "REPLACE_WITH_CLUB_ANNUAL_PRICE_ID",
  elite_monthly:    "REPLACE_WITH_ELITE_MONTHLY_PRICE_ID",
  elite_annual:     "REPLACE_WITH_ELITE_ANNUAL_PRICE_ID",
};

// ─── Create Stripe Checkout Session ───────────────────────────────────────────
exports.createCheckoutSession = onRequest(
  { secrets: [stripeSecretKey], cors: true },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

    const { priceKey, userId, userEmail, successUrl, cancelUrl } = req.body;

    if (!priceKey || !PRICES[priceKey]) {
      return res.status(400).json({ error: "Invalid price key" });
    }

    const stripe = Stripe(stripeSecretKey.value());

    try {
      let customerId;
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists && userDoc.data().stripeCustomerId) {
        customerId = userDoc.data().stripeCustomerId;
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { firebaseUserId: userId },
        });
        customerId = customer.id;
        await db.collection("users").doc(userId).set(
          { stripeCustomerId: customerId },
          { merge: true }
        );
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [{ price: PRICES[priceKey], quantity: 1 }],
        mode: "subscription",
        success_url: successUrl || "https://tfb-the-football-blueprint.web.app/billing?success=true",
        cancel_url:  cancelUrl  || "https://tfb-the-football-blueprint.web.app/billing?canceled=true",
        metadata: { firebaseUserId: userId },
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (err) {
      console.error("createCheckoutSession error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── Create Customer Portal Session ───────────────────────────────────────────
exports.createPortalSession = onRequest(
  { secrets: [stripeSecretKey], cors: true },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

    const { userId, returnUrl } = req.body;

    const stripe = Stripe(stripeSecretKey.value());

    try {
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists || !userDoc.data().stripeCustomerId) {
        return res.status(404).json({ error: "No billing account found" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: userDoc.data().stripeCustomerId,
        return_url: returnUrl || "https://tfb-the-football-blueprint.web.app/billing",
      });

      res.json({ url: session.url });
    } catch (err) {
      console.error("createPortalSession error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── Stripe Webhook ────────────────────────────────────────────────────────────
exports.stripeWebhook = onRequest(
  { secrets: [stripeSecretKey, stripeWebhookSecret], rawBody: true },
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const stripe = Stripe(stripeSecretKey.value());

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        stripeWebhookSecret.value()
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const data = event.data.object;

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const userId = data.metadata?.firebaseUserId;
          if (userId) {
            await db.collection("users").doc(userId).set(
              {
                subscriptionStatus:   "active",
                stripeSubscriptionId: data.subscription,
                updatedAt:            admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
          break;
        }

        case "customer.subscription.updated": {
          const customer = await Stripe(stripeSecretKey.value()).customers.retrieve(data.customer);
          const userId = customer.metadata?.firebaseUserId;
          if (userId) {
            await db.collection("users").doc(userId).set(
              {
                subscriptionStatus: data.status,
                stripePriceId:      data.items.data[0]?.price?.id,
                currentPeriodEnd:   data.current_period_end,
                updatedAt:          admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
          break;
        }

        case "customer.subscription.deleted": {
          const customer2 = await Stripe(stripeSecretKey.value()).customers.retrieve(data.customer);
          const userId = customer2.metadata?.firebaseUserId;
          if (userId) {
            await db.collection("users").doc(userId).set(
              {
                subscriptionStatus:   "canceled",
                stripeSubscriptionId: null,
                updatedAt:            admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
          break;
        }

        case "invoice.payment_failed": {
          const customer3 = await Stripe(stripeSecretKey.value()).customers.retrieve(data.customer);
          const userId = customer3.metadata?.firebaseUserId;
          if (userId) {
            await db.collection("users").doc(userId).set(
              {
                subscriptionStatus: "past_due",
                updatedAt:          admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Webhook handler error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);
