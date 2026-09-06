// src/pages/Settings.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Database, LogOut, Wifi, WifiOff, UserPlus } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../firebase/firebaseConfig';
import { createAdminAccount } from '../firebase/adminService';

export default function Settings() {
  const { adminName, adminEmail, role, isSuperAdmin, logout } = useAuth();
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });
  const [inviteState, setInviteState] = useState({ loading: false, error: '', success: '' });

  async function handleCreateAdmin(event) {
    event.preventDefault();
    setInviteState({ loading: true, error: '', success: '' });
    try {
      await createAdminAccount(form);
      setForm({ displayName: '', email: '', password: '' });
      setInviteState({ loading: false, error: '', success: 'Admin account created successfully.' });
    } catch (error) {
      setInviteState({
        loading: false,
        success: '',
        error: error.message || 'Unable to create the admin account.',
      });
    }
  }

  return (
    <Layout title="Settings" subtitle="Admin profile & system status">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-xl2 ring-1 ring-ink-100 shadow-card p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <span className="w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center text-navy-900 font-display font-bold text-lg">
              {adminName ? adminName.charAt(0).toUpperCase() : 'A'}
            </span>
            <div>
              <p className="font-display font-bold text-navy-900">{adminName || 'Admin'}</p>
              <p className="text-xs text-ink-500">{role || 'Admin'} · CartKaro</p>
            </div>
          </div>
          {adminEmail && <p className="text-xs text-ink-500 -mt-3 mb-4">{adminEmail}</p>}
          <div className="flex items-center gap-2 text-sm text-ink-600 bg-navy-50 rounded-xl px-4 py-3">
            <ShieldCheck size={16} className="text-navy-700" />
            Verified Firebase admin access.
          </div>
          <button
            onClick={logout}
            className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-danger-600 bg-danger-50 hover:bg-danger-100 transition-colors"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="bg-white rounded-xl2 ring-1 ring-ink-100 shadow-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Database size={18} className="text-navy-700" />
            <p className="font-display font-bold text-navy-900">Firebase Connection</p>
          </div>

          <div
            className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium ${
              isFirebaseConfigured
                ? 'bg-success-50 text-success-600'
                : 'bg-warning-50 text-warning-600'
            }`}
          >
            {isFirebaseConfigured ? <Wifi size={16} /> : <WifiOff size={16} />}
            {isFirebaseConfigured
              ? 'Connected to your Firebase project.'
              : 'Demo mode — showing sample data.'}
          </div>

          {!isFirebaseConfigured && (
            <p className="text-xs text-ink-500 mt-3 leading-relaxed">
              Add your Firebase project keys to a <code className="bg-ink-100 px-1 py-0.5 rounded">.env</code> file
              (see <code className="bg-ink-100 px-1 py-0.5 rounded">.env.example</code>) to connect this panel to
              your <code className="bg-ink-100 px-1 py-0.5 rounded">partners</code> collection. Restart the dev
              server after adding it.
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          className="bg-white rounded-xl2 ring-1 ring-ink-100 shadow-card p-6 lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-2">
            <UserPlus size={18} className="text-navy-700" />
            <p className="font-display font-bold text-navy-900">Admin access</p>
          </div>
          {isSuperAdmin ? (
            <>
              <p className="text-sm text-ink-500 mb-5">
                Create an invite-only Firebase account for a new admin. They can sign in after receiving these credentials.
              </p>
              <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  required
                  value={form.displayName}
                  onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                  placeholder="Admin name"
                  className="rounded-xl px-3 py-2.5 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-gold-400 outline-none"
                />
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="admin@company.com"
                  className="rounded-xl px-3 py-2.5 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-gold-400 outline-none"
                />
                <input
                  required
                  type="password"
                  minLength="8"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="Temporary password (8+ characters)"
                  className="rounded-xl px-3 py-2.5 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-gold-400 outline-none"
                />
                <div className="md:col-span-3 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={inviteState.loading}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-navy-900 bg-gold-gradient disabled:opacity-60"
                  >
                    {inviteState.loading ? 'Creating…' : 'Create admin'}
                  </button>
                  {inviteState.error && <p className="text-sm text-danger-600">{inviteState.error}</p>}
                  {inviteState.success && <p className="text-sm text-success-600">{inviteState.success}</p>}
                </div>
              </form>
            </>
          ) : (
            <p className="text-sm text-ink-500">
              Admin accounts are invite-only. Contact a Super Admin if you need to add or remove an administrator.
            </p>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
