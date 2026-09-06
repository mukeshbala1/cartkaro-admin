import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();

// Only a Super Admin can create another admin. Custom claims are assigned here
// on the server, never in React/browser code.
export const createAdmin = onCall({ region: 'asia-south1' }, async (request) => {
  if (request.auth?.token?.superAdmin !== true) {
    throw new HttpsError('permission-denied', 'Only a Super Admin can create admin accounts.');
  }

  const { email, password, displayName } = request.data || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw new HttpsError('invalid-argument', 'Enter a valid email address.');
  }
  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpsError('invalid-argument', 'Password must contain at least 8 characters.');
  }
  if (typeof displayName !== 'string' || !displayName.trim()) {
    throw new HttpsError('invalid-argument', 'Enter the admin name.');
  }

  let user;
  try {
    user = await getAuth().createUser({
      email: normalizedEmail,
      password,
      displayName: displayName.trim(),
    });
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'An account already exists for this email address.');
    }
    throw new HttpsError('internal', 'Could not create the admin account.');
  }

  await getAuth().setCustomUserClaims(user.uid, { admin: true });
  await getFirestore().collection('admins').doc(user.uid).set({
    email: normalizedEmail,
    displayName: displayName.trim(),
    role: 'admin',
    createdAt: FieldValue.serverTimestamp(),
    createdBy: request.auth.uid,
  });

  return { uid: user.uid, email: normalizedEmail };
});
