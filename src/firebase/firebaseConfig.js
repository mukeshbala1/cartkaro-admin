// src/firebase/firebaseConfig.js
//
// Fill in your Firebase project credentials in a `.env` file at the project
// root (copy `.env.example` to `.env`). These values come from:
// Firebase Console -> Project Settings -> General -> Your apps -> SDK setup.
//
// This file is safe to keep as-is even before you add real credentials —
// the app will detect a missing config and fall back to demo data so the
// UI is fully visible while you wire up your Firebase project.

import { initializeApp, getApps } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// True only once a real projectId has been provided.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.projectId && firebaseConfig.apiKey
);

let app = null;
let db = null;
let storage = null;
let auth = null;
let functions = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  try {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    db = getFirestore(app);
  }
  storage = getStorage(app);
  auth = getAuth(app);
  functions = getFunctions(app, 'asia-south1');
}

export { firebaseConfig, app, db, storage, auth, functions };
