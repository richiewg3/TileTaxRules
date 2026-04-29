import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  initializeAuth,
  indexedDBLocalPersistence,
  browserPopupRedirectResolver,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// When the app is served from a host other than localhost or the default
// firebaseapp.com helper domain, route the Firebase Auth helper through the
// app's own origin (see vercel.json rewrites for /__/auth/*). This makes the
// sign-in iframe/popup load same-origin, which avoids the third-party storage
// partitioning that breaks the redirect/popup flow on Vercel preview/prod
// deployments and leaves the user stuck on the login screen.
function resolveAuthDomain(defaultDomain: string): string {
  if (typeof window === 'undefined') return defaultDomain;
  const host = window.location.hostname;
  if (!host) return defaultDomain;
  if (host === 'localhost' || host === '127.0.0.1') return defaultDomain;
  if (host.endsWith('.firebaseapp.com') || host.endsWith('.web.app')) {
    return defaultDomain;
  }
  return host;
}

const resolvedConfig = {
  ...firebaseConfig,
  authDomain: resolveAuthDomain(firebaseConfig.authDomain),
};

const app = initializeApp(resolvedConfig);

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
