// TFB Cloud Functions — Stripe billing + webhooks
// Deploy: firebase deploy --only functions
//
// Required environment variables (set via Firebase CLI):
//   firebase functions:secrets:set STRIPE_SECRET_KEY
//   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
//
// Or for v1 config:
//   firebase functions:config:set stripe.secret="sk_live_..." stripe.webhook_secret="whsec_..."

const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const stripe    = require('stripe');

admin.initializeApp();
const db = admin.firestore();

// ── Helper: get Stripe instance ───────────────────────────────────────────
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
    || functions.config().stripe?.secret;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return stripe(key);
}

// ── Price IDs — update these with your real Stripe price IDs ─────────────
const PRICE_IDS = {
  starter_monthly: 'price_starter_monthly',
  starter_yearly:  'price_starter_yearly',
  pro_monthly:     'price_pro_monthly',
  pro_yearly:      'price_pro_yearly',
  club_monthly:    'price_club_monthly',
  club_yearly:     'price_club_yearly',
};

// ── createCheckoutSession ─────────────────────────────────────────────────
// Called from tfb-billing.html to start a Stripe Checkout session.
// Expects: { planId, interval, clubId, successUrl, cancelUrl }
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');

  const { planId, interval = 'monthly', clubId, successUrl, cancelUrl } = data;
  const uid = context.auth.uid;

  const s = getStripe();

  // Get or create Stripe customer
  const clubDoc = await db.collection('clubs').doc(clubId).get();
  let customerId = clubDoc.exists ? clubDoc.data().stripeCustomerId : null;

  if (!customerId) {
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data() || {};
    const customer = await s.customers.create({
      email:    context.auth.token.email,
      name:     userData.name || '',
      metadata: { uid, clubId },
    });
    customerId = customer.id;
    await db.collection('clubs').doc(clubId).set(
      { stripeCustomerId: customerId },
      { merge: true }
    );
  }

  const priceKey = `${planId}_${interval}`;
  const priceId  = PRICE_IDS[priceKey];
  if (!priceId) throw new functions.https.HttpsError('invalid-argument', `Unknown plan: ${priceKey}`);

  const session = await s.checkout.sessions.create({
    customer:    customerId,
    mode:        'subscription',
    line_items:  [{ price: priceId, quantity: 1 }],
    // 14-day free trial
    subscription_data: {
      trial_period_days: 14,
      metadata: { uid, clubId, planId },
    },
    success_url: successUrl || `${functions.config().app?.url || 'https://your-project.web.app'}/tfb-billing.html?session_id={CHECKOUT_SESSION_ID}&status=success`,
    cancel_url:  cancelUrl  || `${functions.config().app?.url || 'https://your-project.web.app'}/tfb-billing.html?status=cancelled`,
    metadata:    { uid, clubId, planId },
  });

  return { url: session.url, sessionId: session.id };
});

// ── createBillingPortalSession ────────────────────────────────────────────
// Opens the Stripe billing portal for an existing customer.
exports.createBillingPortalSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');

  const { clubId, returnUrl } = data;
  const s = getStripe();

  const clubDoc = await db.collection('clubs').doc(clubId).get();
  if (!clubDoc.exists) throw new functions.https.HttpsError('not-found', 'Club not found');

  const { stripeCustomerId } = clubDoc.data();
  if (!stripeCustomerId) throw new functions.https.HttpsError('failed-precondition', 'No billing account found');

  const session = await s.billingPortal.sessions.create({
    customer:   stripeCustomerId,
    return_url: returnUrl || `${functions.config().app?.url || 'https://your-project.web.app'}/tfb-billing.html`,
  });

  return { url: session.url };
});

// ── stripeWebhook ─────────────────────────────────────────────────────────
// Receives Stripe webhook events and updates Firestore.
// Register this URL in Stripe Dashboard → Webhooks:
//   https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/stripeWebhook
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    || functions.config().stripe?.webhook_secret;
  const s = getStripe();

  let event;
  try {
    event = s.webhooks.constructEvent(
      req.rawBody,
      req.headers['stripe-signature'],
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const ts = admin.firestore.FieldValue.serverTimestamp();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { clubId, planId, uid } = session.metadata || {};
      if (clubId) {
        await db.collection('clubs').doc(clubId).set({
          subscriptionTier:   planId,
          subscriptionStatus: 'trialing',
          stripeSubscriptionId: session.subscription,
          updatedAt: ts,
        }, { merge: true });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const customer = await s.customers.retrieve(sub.customer);
      const clubId = customer.metadata?.clubId;
      if (clubId) {
        // Map Stripe price to plan ID
        const priceId = sub.items.data[0]?.price?.id;
        const planId  = Object.entries(PRICE_IDS).find(([, v]) => v === priceId)?.[0]?.split('_')[0];
        await db.collection('clubs').doc(clubId).set({
          subscriptionTier:   planId || 'unknown',
          subscriptionStatus: sub.status,
          currentPeriodEnd:   new Date(sub.current_period_end * 1000).toISOString(),
          updatedAt: ts,
        }, { merge: true });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const customer = await s.customers.retrieve(sub.customer);
      const clubId = customer.metadata?.clubId;
      if (clubId) {
        await db.collection('clubs').doc(clubId).set({
          subscriptionTier:   'free',
          subscriptionStatus: 'cancelled',
          updatedAt: ts,
        }, { merge: true });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice  = event.data.object;
      const customer = await s.customers.retrieve(invoice.customer);
      const clubId   = customer.metadata?.clubId;
      if (clubId) {
        await db.collection('clubs').doc(clubId).set({
          subscriptionStatus: 'past_due',
          updatedAt: ts,
        }, { merge: true });
      }
      break;
    }
  }

  res.json({ received: true });
});
