import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigFallback from '../../firebase-applet-config.json';

// Use active applet configuration from firebase-applet-config.json with support for custom Netlify production env vars
const activeConfig = firebaseConfigFallback;

const firebaseConfig = {
  apiKey: activeConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: activeConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: activeConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: activeConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: activeConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: activeConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID,
};

const databaseId =
  activeConfig.firestoreDatabaseId ||
  import.meta.env.VITE_FIREBASE_DATABASE_ID ||
  '(default)';

// Initialize Firebase App singleton
export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore (support custom databaseId if configured)
export const db =
  databaseId && databaseId !== '(default)'
    ? getFirestore(firebaseApp, databaseId)
    : getFirestore(firebaseApp);
