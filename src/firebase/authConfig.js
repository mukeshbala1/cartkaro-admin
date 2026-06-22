// src/firebase/authConfig.js
//
// Admin login currently checks against a fixed username/password below
// instead of Firebase Authentication, so you can log in immediately
// without creating a Firebase Auth user first.
//
// To switch to real Firebase Authentication later: replace the check
// inside `AuthContext.jsx`'s `login()` function with
// `signInWithEmailAndPassword(auth, email, password)` from
// `firebase/auth`, and point ADMIN_USERNAME at the admin's email.
//
// You can also override these via environment variables in `.env`
// (VITE_ADMIN_USERNAME / VITE_ADMIN_PASSWORD) without touching this file.

export const ADMIN_USERNAME =
  import.meta.env.VITE_ADMIN_USERNAME || 'MSS@2005';

export const ADMIN_PASSWORD =
  import.meta.env.VITE_ADMIN_PASSWORD || 'Cartkaro@132807';
