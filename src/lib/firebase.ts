import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  initializeAuth,
  indexedDBLocalPersistence,
  browserPopupRedirectResolver,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// IMPORTANT: keep authDomain pointing at the Firebase-hosted helper
// (<project>.firebaseapp.com). That is the only redirect URI registered with
// Google's OAuth client by default; rewriting auth traffic through the
// deployment's own origin causes Google to reject the sign-in with
// `Error 400: redirect_uri_mismatch` because <vercel-host>/__/auth/handler is
// not on the OAuth client's authorized redirect URIs list.
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Use initializeAuth to pin persistence + the popup/redirect resolver before
// any auth call. browserLocal/IndexedDB ensure the session survives reloads;
// without an explicit resolver some bundlers tree-shake it and popup flows
// silently fail to write the session.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});

async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test_', 'check'));
    console.log('Firebase connection verified');
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.error('Please check your Firebase configuration or internet connection.');
    } else {
      console.log('Firebase initialized (connection check performed)');
    }
  }
}

testConnection();
