import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
  firebaseConfig,
  db,
  auth,
  functions,
  isFirebaseConfigured,
} from './firebaseConfig';

export async function createAdminAccount({ email, password, displayName, role = 'admin' }) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }

  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const trimmedName = typeof displayName === 'string' ? displayName.trim() : '';

  if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw new Error('Please enter a valid email address.');
  }
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }
  if (!trimmedName) {
    throw new Error('Please enter a name for the administrator.');
  }

  // 1. Try Cloud Function first (if deployed on Blaze plan)
  if (functions) {
    try {
      const createAdminFn = httpsCallable(functions, 'createAdmin');
      const result = await createAdminFn({
        email: normalizedEmail,
        password,
        displayName: trimmedName,
        role,
      });
      return result.data;
    } catch (cfErr) {
      console.warn('[adminService] Cloud Function unavailable, using direct Auth/Firestore creation:', cfErr.message);
    }
  }

  // 2. Direct Auth & Firestore creation (works on Free/Spark plan without Cloud Functions)
  const tempAppName = `TempAdmin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  const tempAuth = getAuth(tempApp);

  try {
    const cred = await createUserWithEmailAndPassword(tempAuth, normalizedEmail, password);
    if (trimmedName) {
      await updateProfile(cred.user, { displayName: trimmedName });
    }
    await signOut(tempAuth);

    // Save admin role record directly in Firestore
    await setDoc(doc(db, 'admins', cred.user.uid), {
      email: normalizedEmail,
      displayName: trimmedName,
      role: role || 'admin',
      createdAt: serverTimestamp(),
      createdBy: auth?.currentUser?.uid || 'superAdmin',
    });

    return { uid: cred.user.uid, email: normalizedEmail, role };
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account already exists with this email address.', { cause: error });
    }
    if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use at least 8 characters.', { cause: error });
    }
    throw error;
  } finally {
    try {
      await deleteApp(tempApp);
    } catch {
      // ignore cleanup errors
    }
  }
}

export async function deleteAdminAccount(adminUid) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }

  if (auth?.currentUser?.uid === adminUid) {
    throw new Error('You cannot delete your own Super Admin account.');
  }

  // 1. Try Cloud Function if deployed
  if (functions) {
    try {
      const deleteAdminFn = httpsCallable(functions, 'deleteAdmin');
      return await deleteAdminFn({ adminUid });
    } catch {
      // fallback to direct Firestore delete
    }
  }

  // 2. Remove from Firestore admins collection
  await deleteDoc(doc(db, 'admins', adminUid));
  return { success: true, deletedUid: adminUid };
}

export async function fetchAdminUsers() {
  if (!isFirebaseConfigured || !db) {
    return [];
  }
  try {
    const q = query(collection(db, 'admins'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('[adminService] fetchAdminUsers fallback without orderBy:', err.message);
    const snap = await getDocs(collection(db, 'admins'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}

export function subscribeToAdminUsers(callback) {
  if (!isFirebaseConfigured || !db) {
    callback([]);
    return () => {};
  }
  const ref = collection(db, 'admins');
  return onSnapshot(
    ref,
    (snap) => {
      const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      users.sort((a, b) => {
        const ta = a.createdAt?.seconds || 0;
        const tb = b.createdAt?.seconds || 0;
        return tb - ta;
      });
      callback(users);
    },
    (err) => {
      console.warn('[adminService] subscribeToAdminUsers error:', err.message);
      callback([]);
    }
  );
}

