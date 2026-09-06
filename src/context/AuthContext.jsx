// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/firebaseConfig';

const AuthContext = createContext(null);

function readableAuthError(error) {
  if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password') {
    return 'Incorrect email address or password.';
  }
  if (error?.code === 'auth/user-not-found') return 'No account exists for this email address.';
  if (error?.code === 'auth/too-many-requests') return 'Too many attempts. Please try again later.';
  if (error?.code === 'auth/network-request-failed') return 'Network error. Check your connection and try again.';
  return 'Unable to sign in. Please try again.';
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [role, setRole] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setCheckingSession(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthenticated(false);
        setAdminName('');
        setAdminEmail('');
        setRole('');
        setCheckingSession(false);
        return;
      }

      try {
        const token = await user.getIdTokenResult();
        const isAdmin = token.claims.admin === true;
        const isCustomerSupport = token.claims.customerSupport === true;
        if (isAdmin || isCustomerSupport) {
          setIsAuthenticated(true);
          setAdminName(user.displayName || user.email || 'User');
          setAdminEmail(user.email || '');
          setRole(
            token.claims.superAdmin === true
              ? 'Super Admin'
              : isAdmin
                ? 'Admin'
                : 'Customer Support',
          );
        } else {
          await signOut(auth);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setCheckingSession(false);
      }
    });

    return unsubscribe;
  }, []);

  async function login(email, password) {
    if (!isFirebaseConfigured || !auth) {
      return { success: false, error: 'Firebase is not configured. Add your Firebase values to .env and restart the app.' };
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const token = await credential.user.getIdTokenResult(true);
      const isAdmin = token.claims.admin === true;
      const isCustomerSupport = token.claims.customerSupport === true;
      if (!isAdmin && !isCustomerSupport) {
        await signOut(auth);
        return { success: false, error: 'This account is not authorised to access the admin panel.' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: readableAuthError(error) };
    }
  }

  async function logout() {
    if (auth) await signOut(auth);
    setIsAuthenticated(false);
    setAdminName('');
    setAdminEmail('');
    setRole('');
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        adminName,
        adminEmail,
        role,
        isSuperAdmin: role === 'Super Admin',
        isCustomerSupport: role === 'Customer Support',
        checkingSession,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
