import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();

// Only a Super Admin can create another admin. Custom claims are assigned here
// on the server, never in React/browser code.
export const createAdmin = onCall({ region: 'asia-south1', cors: true }, async (request) => {
  if (request.auth?.token?.superAdmin !== true) {
    throw new HttpsError('permission-denied', 'Only a Super Admin can create admin accounts.');
  }

  const { email, password, displayName, role = 'admin' } = request.data || {};
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

  const validRoles = ['superAdmin', 'admin', 'customerSupport'];
  const targetRole = validRoles.includes(role) ? role : 'admin';

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

  const customClaims = {
    admin: targetRole === 'admin' || targetRole === 'superAdmin',
    superAdmin: targetRole === 'superAdmin',
    customerSupport: targetRole === 'customerSupport',
  };

  await getAuth().setCustomUserClaims(user.uid, customClaims);
  await getFirestore().collection('admins').doc(user.uid).set({
    email: normalizedEmail,
    displayName: displayName.trim(),
    role: targetRole,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: request.auth.uid,
  });

  return { uid: user.uid, email: normalizedEmail, role: targetRole };
});

export const deleteAdmin = onCall({ region: 'asia-south1', cors: true }, async (request) => {
  if (request.auth?.token?.superAdmin !== true) {
    throw new HttpsError('permission-denied', 'Only a Super Admin can delete admin accounts.');
  }

  const { adminUid } = request.data || {};
  if (!adminUid || typeof adminUid !== 'string') {
    throw new HttpsError('invalid-argument', 'Admin UID is required.');
  }

  if (adminUid === request.auth.uid) {
    throw new HttpsError('failed-precondition', 'You cannot delete your own Super Admin account.');
  }

  try {
    await getAuth().deleteUser(adminUid);
  } catch (err) {
    console.warn('Could not delete auth user or user already removed:', err);
  }

  await getFirestore().collection('admins').doc(adminUid).delete();

  return { success: true, deletedUid: adminUid };
});

