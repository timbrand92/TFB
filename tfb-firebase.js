// TFB Firebase — shared initialisation + data utilities
// Load order in HTML:
//   1. firebase-app-compat.js
//   2. firebase-auth-compat.js
//   3. firebase-firestore-compat.js
//   4. tfb-firebase.js   ← this file
//   5. tfb-plan.js (optional)
//   6. Babel/React scripts

(function () {
  // ── Config ────────────────────────────────────────────────────────────────
  // Replace these values with your Firebase project config.
  // Firebase Console → Project Settings → Your apps → Config
  const FIREBASE_CONFIG = {
    apiKey:            "REPLACE_WITH_YOUR_API_KEY",
    authDomain:        "REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com",
    projectId:         "REPLACE_WITH_YOUR_PROJECT_ID",
    storageBucket:     "REPLACE_WITH_YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
    appId:             "REPLACE_WITH_YOUR_APP_ID",
  };

  // ── Init (guard against double-init) ─────────────────────────────────────
  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }

  const auth = firebase.auth();
  const db   = firebase.firestore();

  // Enable offline persistence (silently fail in unsupported environments)
  db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

  // ── Auth state ────────────────────────────────────────────────────────────
  let _currentUser = undefined; // undefined = not yet resolved
  const _authCbs = [];

  auth.onAuthStateChanged(user => {
    _currentUser = user;
    _authCbs.forEach(cb => cb(user));
  });

  function onAuthStateChanged(cb) {
    _authCbs.push(cb);
    if (_currentUser !== undefined) cb(_currentUser);
    return () => { const i = _authCbs.indexOf(cb); if (i >= 0) _authCbs.splice(i, 1); };
  }

  // Redirect to login if not signed in, call callback if signed in
  function requireAuth(cb) {
    return onAuthStateChanged(user => {
      if (user === null) {
        // Not signed in — preserve intended destination
        const dest = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = 'tfb-login.html?next=' + dest;
      } else if (user) {
        cb(user);
      }
    });
  }

  // ── Auth actions ──────────────────────────────────────────────────────────
  async function signInEmail(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
  }

  async function signUpEmail(email, password) {
    return auth.createUserWithEmailAndPassword(email, password);
  }

  async function signInGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider);
  }

  async function sendPasswordReset(email) {
    return auth.sendPasswordResetEmail(email);
  }

  async function signOut() {
    await auth.signOut();
    window.location.href = 'tfb-login.html';
  }

  // ── User profiles ─────────────────────────────────────────────────────────
  async function getUserProfile(uid) {
    const doc = await db.collection('users').doc(uid).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  async function setUserProfile(uid, data) {
    await db.collection('users').doc(uid).set(
      { ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  // Returns { clubId, teamId, club, team, profile } for the active user context
  async function getActiveContext(uid) {
    const profile = await getUserProfile(uid);
    if (!profile) return null;

    const clubId  = profile.clubId;
    const teamId  = profile.activeTeamId || (profile.teamIds && profile.teamIds[0]);
    if (!clubId || !teamId) return { profile, clubId: null, teamId: null, club: null, team: null };

    const [clubSnap, teamSnap] = await Promise.all([
      db.collection('clubs').doc(clubId).get(),
      db.collection('clubs').doc(clubId).collection('teams').doc(teamId).get(),
    ]);

    return {
      profile,
      clubId,
      teamId,
      club:  clubSnap.exists  ? { id: clubSnap.id,  ...clubSnap.data()  } : null,
      team:  teamSnap.exists  ? { id: teamSnap.id,  ...teamSnap.data()  } : null,
    };
  }

  // ── Club + Team creation (onboarding) ─────────────────────────────────────
  async function createClubAndTeam(uid, clubData, teamData) {
    const clubRef = db.collection('clubs').doc();
    const teamRef = clubRef.collection('teams').doc();
    const ts = firebase.firestore.FieldValue.serverTimestamp();

    const batch = db.batch();
    batch.set(clubRef, { ...clubData, ownerUid: uid, createdAt: ts });
    batch.set(teamRef, { ...teamData, createdAt: ts });
    batch.set(db.collection('users').doc(uid), {
      clubId:       clubRef.id,
      activeTeamId: teamRef.id,
      teamIds:      [teamRef.id],
      updatedAt:    ts,
    }, { merge: true });

    await batch.commit();
    return { clubId: clubRef.id, teamId: teamRef.id };
  }

  // ── Sessions ──────────────────────────────────────────────────────────────
  function _sessionsRef(clubId, teamId) {
    return db.collection('clubs').doc(clubId).collection('teams').doc(teamId).collection('sessions');
  }

  async function getSessions(clubId, teamId, { limit = 30, upcoming = false } = {}) {
    let q = _sessionsRef(clubId, teamId).orderBy('date', upcoming ? 'asc' : 'desc');
    if (upcoming) q = q.where('date', '>=', new Date().toISOString().split('T')[0]);
    q = q.limit(limit);
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  function listenSessions(clubId, teamId, cb, { limit = 30 } = {}) {
    return _sessionsRef(clubId, teamId)
      .orderBy('date', 'desc')
      .limit(limit)
      .onSnapshot(snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }

  async function saveSession(clubId, teamId, data, sessionId = null) {
    const ts = firebase.firestore.FieldValue.serverTimestamp();
    const ref = sessionId
      ? _sessionsRef(clubId, teamId).doc(sessionId)
      : _sessionsRef(clubId, teamId).doc();
    await ref.set(
      { ...data, updatedAt: ts, ...(!sessionId && { createdAt: ts }) },
      { merge: true }
    );
    return ref.id;
  }

  async function deleteSession(clubId, teamId, sessionId) {
    await _sessionsRef(clubId, teamId).doc(sessionId).delete();
  }

  // ── Players ───────────────────────────────────────────────────────────────
  function _playersRef(clubId, teamId) {
    return db.collection('clubs').doc(clubId).collection('teams').doc(teamId).collection('players');
  }

  async function getPlayers(clubId, teamId) {
    const snap = await _playersRef(clubId, teamId).orderBy('number').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  function listenPlayers(clubId, teamId, cb) {
    return _playersRef(clubId, teamId)
      .orderBy('number')
      .onSnapshot(snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }

  async function savePlayer(clubId, teamId, data, playerId = null) {
    const ts = firebase.firestore.FieldValue.serverTimestamp();
    const ref = playerId
      ? _playersRef(clubId, teamId).doc(playerId)
      : _playersRef(clubId, teamId).doc();
    await ref.set(
      { ...data, updatedAt: ts, ...(!playerId && { createdAt: ts }) },
      { merge: true }
    );
    return ref.id;
  }

  async function deletePlayer(clubId, teamId, playerId) {
    await _playersRef(clubId, teamId).doc(playerId).delete();
  }

  // ── Wellness ──────────────────────────────────────────────────────────────
  function _wellnessRef(clubId, teamId, date) {
    return db.collection('clubs').doc(clubId)
      .collection('teams').doc(teamId)
      .collection('wellness').doc(date);
  }

  async function getWellness(clubId, teamId, date) {
    const doc = await _wellnessRef(clubId, teamId, date).get();
    return doc.exists ? doc.data().entries || [] : [];
  }

  async function saveWellnessEntry(clubId, teamId, date, playerId, entry) {
    const ref = _wellnessRef(clubId, teamId, date);
    const ts  = firebase.firestore.FieldValue.serverTimestamp();
    await db.runTransaction(async tx => {
      const doc     = await tx.get(ref);
      const entries = doc.exists ? (doc.data().entries || []) : [];
      const idx     = entries.findIndex(e => e.playerId === playerId);
      const record  = { playerId, ...entry, updatedAt: new Date().toISOString() };
      if (idx >= 0) entries[idx] = record;
      else entries.push(record);
      tx.set(ref, { entries, updatedAt: ts }, { merge: true });
    });
  }

  // ── Coaches Award ─────────────────────────────────────────────────────────
  function _awardRef(clubId, teamId, season) {
    return db.collection('clubs').doc(clubId)
      .collection('teams').doc(teamId)
      .collection('award').doc(String(season));
  }

  async function getAwardData(clubId, teamId, season) {
    const doc = await _awardRef(clubId, teamId, season).get();
    return doc.exists ? doc.data() : { rounds: [] };
  }

  async function saveAwardVotes(clubId, teamId, season, roundId, votes, voterUid) {
    const ref = _awardRef(clubId, teamId, season);
    const ts  = firebase.firestore.FieldValue.serverTimestamp();
    await db.runTransaction(async tx => {
      const doc    = await tx.get(ref);
      const rounds = doc.exists ? (doc.data().rounds || []) : [];
      const idx    = rounds.findIndex(r => r.id === roundId);
      const round  = idx >= 0 ? { ...rounds[idx] } : { id: roundId };
      if (!round.votes) round.votes = [];
      const vi = round.votes.findIndex(v => v.voterUid === voterUid);
      const record = { voterUid, votes, submittedAt: new Date().toISOString() };
      if (vi >= 0) round.votes[vi] = record;
      else round.votes.push(record);
      round.locked = true;
      if (idx >= 0) rounds[idx] = round;
      else rounds.push(round);
      tx.set(ref, { rounds, updatedAt: ts }, { merge: true });
    });
  }

  // ── RSVP ─────────────────────────────────────────────────────────────────
  async function submitRsvp(clubId, teamId, eventId, playerId, status) {
    const ref = db.collection('clubs').doc(clubId)
      .collection('teams').doc(teamId)
      .collection('rsvp').doc(eventId);
    await ref.set(
      { [`responses.${playerId}`]: { status, updatedAt: new Date().toISOString() } },
      { merge: true }
    );
  }

  // ── Expose globally ───────────────────────────────────────────────────────
  window.TFBApp = {
    // Core
    auth, db,
    firebase,
    getCurrentUser:    () => _currentUser,
    onAuthStateChanged,
    requireAuth,
    // Auth actions
    signInEmail, signUpEmail, signInGoogle, sendPasswordReset, signOut,
    // Profiles
    getUserProfile, setUserProfile, getActiveContext, createClubAndTeam,
    // Sessions
    getSessions, listenSessions, saveSession, deleteSession,
    // Players
    getPlayers, listenPlayers, savePlayer, deletePlayer,
    // Wellness
    getWellness, saveWellnessEntry,
    // Award
    getAwardData, saveAwardVotes,
    // RSVP
    submitRsvp,
    // Helpers
    serverTimestamp: () => firebase.firestore.FieldValue.serverTimestamp(),
    FieldValue:       firebase.firestore.FieldValue,
  };
})();
