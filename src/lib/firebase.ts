import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  initializeAuth,
  indexedDBLocalPersistence,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Auth providers used here (Email/Password + Anonymous) do not perform any
// cross-origin OAuth handshake, so we don't need the popup/redirect resolver
// or a special same-origin authDomain rewrite. The session is written directly
// to this app's own origin via IndexedDB / localStorage and survives reloads.
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
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
