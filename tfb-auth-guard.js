import { auth } from './tfb-firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

export function requireAuth() {
  const root = document.getElementById('root');
  root.style.display = 'none';

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.replace('tfb-login.html');
    } else {
      window.__tfbUser = user;
      root.style.display = '';
    }
  });
}
