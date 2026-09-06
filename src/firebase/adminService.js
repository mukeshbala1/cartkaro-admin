import { httpsCallable } from 'firebase/functions';
import { functions, isFirebaseConfigured } from './firebaseConfig';

export async function createAdminAccount({ email, password, displayName }) {
  if (!isFirebaseConfigured || !functions) {
    throw new Error('Firebase is not configured.');
  }

  const createAdmin = httpsCallable(functions, 'createAdmin');
  await createAdmin({ email, password, displayName });
}
