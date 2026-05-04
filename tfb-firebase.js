// Firebase configuration
// Replace the placeholder values below with your actual Firebase project config.
// Firebase Console → Project Settings → Your apps → Config

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyBW8icr5Yc79KfE5sHspX7d1orKjKuPiCI",
  authDomain:        "tfb-the-football-blueprint.firebaseapp.com",
  projectId:         "tfb-the-football-blueprint",
  storageBucket:     "tfb-the-football-blueprint.firebasestorage.app",
  messagingSenderId: "1079285625356",
  appId:             "1:1079285625356:web:fcac80becf73708ae0f429"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export { app, auth, db };
