// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { ADMIN_USERNAME, ADMIN_PASSWORD } from '../firebase/authConfig';

const AuthContext = createContext(null);
const SESSION_KEY = 'cartkaro_admin_session';

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setIsAuthenticated(true);
        setAdminName(parsed.username || 'Admin');
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setCheckingSession(false);
  }, []);

  function login(username, password) {
    if (username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
      setIsAuthenticated(true);
      setAdminName(username);
      return { success: true };
    }
    return { success: false, error: 'Invalid username or password.' };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setAdminName('');
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, adminName, checkingSession, login, logout }}
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
