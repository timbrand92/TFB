import { auth } from './tfb-firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

export function requireAuth() {
  const root = document.getElementById('root');
  root.style.display = 'none';

  // ?demo=true bypasses auth for preview/testing purposes
  if (new URLSearchParams(window.location.search).get('demo') === 'true') {
    window.__tfbUser = { uid: 'demo', email: 'demo@tfb.app', displayName: 'Demo User' };
    root.style.display = '';
    return;
  }

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.replace('tfb-login.html');
    } else {
      window.__tfbUser = user;
      root.style.display = '';
    }
  });
}
