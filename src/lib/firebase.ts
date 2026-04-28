import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); 
export const auth = getAuth(app);

// Validation check
async function testConnection() {
  try {
    // Attempt to read a dummy document to verify connection
    await getDocFromServer(doc(db, '_connection_test_', 'check'));
    console.log("Firebase connection verified");
  } catch (error: any) {
    if (error.message?.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    } else {
      // It's normal to get a "permission denied" if the doc doesn't exist or rules block it,
      // but if it's a network error, we want to know.
      console.log("Firebase initialized (connection check performed)");
    }
  }
}

testConnection();
