import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'node:fs/promises';

const [serviceAccountPath, email] = process.argv.slice(2);

if (!serviceAccountPath || !email) {
  console.error('Usage: node functions/scripts/grant-super-admin.mjs <service-account.json> <admin-email>');
  process.exit(1);
}

const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });

const user = await getAuth().getUserByEmail(email.trim().toLowerCase());
await getAuth().setCustomUserClaims(user.uid, { admin: true, superAdmin: true });
await getFirestore().collection('admins').doc(user.uid).set(
  {
    email: user.email,
    displayName: user.displayName || '',
    role: 'superAdmin',
    createdAt: FieldValue.serverTimestamp(),
  },
  { merge: true },
);

console.log(`${user.email} is now a Super Admin. They must sign out and sign in again.`);
