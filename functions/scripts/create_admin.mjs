// functions/scripts/create_admin.mjs
// Creates or updates an Admin account in Firebase Auth & Firestore.
// Usage:
//   node functions/scripts/create_admin.mjs <email> <password> "<displayName>" [role]
//
// Roles: superAdmin | admin | customerSupport (default: admin)
// Example:
//   node functions/scripts/create_admin.mjs admin@cartkaro.com password123 "Main Admin" superAdmin

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const saPath = join(__dirname, '../service-account.json');

if (!existsSync(saPath)) {
  console.error('Error: functions/service-account.json not found.');
  process.exit(1);
}

const sa = JSON.parse(readFileSync(saPath, 'utf8'));
initializeApp({ credential: cert(sa) });

const auth = getAuth();
const db = getFirestore();

const [emailArg, passwordArg, nameArg, roleArg] = process.argv.slice(2);

if (!emailArg) {
  console.log(`
Usage:
  node functions/scripts/create_admin.mjs <email> <password> "<displayName>" [role]

Arguments:
  email        User email address (e.g. admin@cartkaro.com)
  password     User password (min 8 chars)
  displayName  Full Name (e.g. "Operations Manager")
  role         superAdmin | admin | customerSupport (default: admin)

Examples:
  node functions/scripts/create_admin.mjs superadmin@cartkaro.com pass12345 "Super Admin" superAdmin
  node functions/scripts/create_admin.mjs support@cartkaro.com pass12345 "Support Staff" customerSupport
`);
  process.exit(0);
}

const email = emailArg.trim().toLowerCase();
const password = passwordArg || 'Admin@123456';
const displayName = nameArg || email.split('@')[0];
const targetRole = ['superAdmin', 'admin', 'customerSupport'].includes(roleArg) ? roleArg : 'admin';

async function main() {
  console.log(`\n=== Provisioning Admin Account ===`);
  console.log(`Email:       ${email}`);
  console.log(`Name:        ${displayName}`);
  console.log(`Role:        ${targetRole}`);

  let user;
  try {
    user = await auth.getUserByEmail(email);
    console.log(`\nExisting user found (UID: ${user.uid}). Updating account...`);
    if (passwordArg) {
      await auth.updateUser(user.uid, { password, displayName });
    }
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.log(`\nCreating new user in Firebase Authentication...`);
      user = await auth.createUser({
        email,
        password,
        displayName,
      });
      console.log(`Created Auth user (UID: ${user.uid}).`);
    } else {
      throw err;
    }
  }

  // Set Custom Claims for RBAC
  const customClaims = {
    admin: targetRole === 'admin' || targetRole === 'superAdmin',
    superAdmin: targetRole === 'superAdmin',
    customerSupport: targetRole === 'customerSupport',
  };

  await auth.setCustomUserClaims(user.uid, customClaims);
  console.log(`Assigned Custom Claims:`, customClaims);

  // Write to Firestore /admins/{uid}
  await db.collection('admins').doc(user.uid).set(
    {
      email,
      displayName,
      role: targetRole,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`Saved admin document to Firestore (/admins/${user.uid}).`);
  console.log(`\nSUCCESS: Admin account ready! You can now log in at http://localhost:5173\n`);
}

main().catch((err) => {
  console.error('\nError provisioning admin:', err.message);
  process.exit(1);
});
