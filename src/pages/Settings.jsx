// src/pages/Settings.jsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Database,
  LogOut,
  Wifi,
  WifiOff,
  UserPlus,
  Users,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import Layout from '../components/Layout';
import { ConfirmDialog } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../firebase/firebaseConfig';
import {
  createAdminAccount,
  deleteAdminAccount,
  subscribeToAdminUsers,
} from '../firebase/adminService';
import { formatDate } from '../utils/dateUtils';

const ROLE_LABELS = {
  superAdmin: 'Super Admin',
  admin: 'Admin',
  customerSupport: 'Customer Support',
};

const ROLE_BADGES = {
  superAdmin: 'bg-gold-100 text-gold-800 ring-gold-300',
  admin: 'bg-navy-50 text-navy-800 ring-navy-200',
  customerSupport: 'bg-blue-50 text-blue-700 ring-blue-200',
};

export default function Settings() {
  const { adminName, adminEmail, role, isSuperAdmin, logout } = useAuth();
  const [form, setForm] = useState({ displayName: '', email: '', password: '', role: 'admin' });
  const [inviteState, setInviteState] = useState({ loading: false, error: '', success: '' });
  const [adminUsers, setAdminUsers] = useState([]);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const unsub = subscribeToAdminUsers((users) => {
      setAdminUsers(users);
    });
    return unsub;
  }, []);

  async function handleCreateAdmin(event) {
    event.preventDefault();
    setInviteState({ loading: true, error: '', success: '' });
    try {
      await createAdminAccount(form);
      setForm({ displayName: '', email: '', password: '', role: 'admin' });
      setInviteState({ loading: false, error: '', success: 'Admin account created successfully.' });
    } catch (error) {
      setInviteState({
        loading: false,
        success: '',
        error: error.message || 'Unable to create the admin account.',
      });
    }
  }

  async function handleDeleteUserConfirm() {
    if (!userToDelete) return;
    setDeletingUser(true);
    setDeleteError('');
    try {
      await deleteAdminAccount(userToDelete.id);
      setUserToDelete(null);
    } catch (err) {
      setDeleteError(err.message || 'Unable to delete admin account.');
    } finally {
      setDeletingUser(false);
    }
  }

  return (
    <Layout title="Settings" subtitle="Admin profile & team management">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-xl2 ring-1 ring-ink-100 shadow-card p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <span className="w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center text-navy-900 font-display font-bold text-lg shadow-xs">
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
            Verified Firebase administrative privileges.
          </div>
          <button
            onClick={logout}
            className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-danger-600 bg-danger-50 hover:bg-danger-100 transition-colors"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </motion.div>

        {/* Database Connection Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="bg-white rounded-xl2 ring-1 ring-ink-100 shadow-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Database size={18} className="text-navy-700" />
            <p className="font-display font-bold text-navy-900">Firebase Status</p>
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
              ? 'Connected to CartKaro Firebase project.'
              : 'Demo mode — showing sample data.'}
          </div>

          {!isFirebaseConfigured && (
            <p className="text-xs text-ink-500 mt-3 leading-relaxed">
              Add your Firebase project keys to a <code className="bg-ink-100 px-1 py-0.5 rounded">.env</code> file
              to connect this panel to live collections.
            </p>
          )}

          <div className="mt-4 p-3.5 bg-ink-50 rounded-xl text-xs text-ink-600 space-y-1">
            <p><strong>Cloud Functions Region:</strong> asia-south1 (Mumbai)</p>
            <p><strong>Firestore Rules:</strong> RBAC Enabled (Super Admin & Admin)</p>
          </div>
        </motion.div>
      </div>

      {/* Admin Team Members Table */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="bg-white rounded-xl2 ring-1 ring-ink-100 shadow-card p-6 mb-6"
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-navy-700" />
            <div>
              <p className="font-display font-bold text-navy-900">Administrator Team</p>
              <p className="text-xs text-ink-500">Active administrative users with access to CartKaro Admin</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-navy-50 text-navy-800">
            {adminUsers.length} Users
          </span>
        </div>

        {deleteError && (
          <div className="mb-4 p-3 bg-danger-50 text-danger-700 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle size={14} />
            {deleteError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-left text-ink-500 rounded-lg">
              <tr>
                <th className="p-3.5 font-semibold">User</th>
                <th className="p-3.5 font-semibold">Role</th>
                <th className="p-3.5 font-semibold">Added On</th>
                {isSuperAdmin && <th className="p-3.5 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {adminUsers.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 4 : 3} className="p-6 text-center text-ink-400 text-xs">
                    No administrative accounts registered yet.
                  </td>
                </tr>
              ) : (
                adminUsers.map((u) => {
                  const roleKey = u.role || 'admin';
                  const isCurrentAdmin = u.email === adminEmail;

                  return (
                    <tr key={u.id} className="hover:bg-ink-50/50 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-navy-100 text-navy-800 font-display font-bold flex items-center justify-center text-xs">
                            {u.displayName ? u.displayName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-navy-900 flex items-center gap-1.5">
                              {u.displayName || 'Admin'}
                              {isCurrentAdmin && (
                                <span className="text-[10px] bg-ink-200 text-ink-700 px-1.5 py-0.2 rounded font-normal">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-ink-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 ${ROLE_BADGES[roleKey] || ROLE_BADGES.admin}`}>
                          {ROLE_LABELS[roleKey] || 'Admin'}
                        </span>
                      </td>
                      <td className="p-3.5 text-xs text-ink-500">
                        {u.createdAt ? formatDate(u.createdAt) : '—'}
                      </td>
                      {isSuperAdmin && (
                        <td className="p-3.5 text-right">
                          {!isCurrentAdmin && u.role !== 'superAdmin' && (
                            <button
                              onClick={() => { setDeleteError(''); setUserToDelete(u); }}
                              title="Revoke admin account"
                              className="p-1.5 text-ink-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Admin Provisioning Form (Super Admin Only) */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.16 }}
        className="bg-white rounded-xl2 ring-1 ring-ink-100 shadow-card p-6"
      >
        <div className="flex items-center gap-2 mb-2">
          <UserPlus size={18} className="text-navy-700" />
          <p className="font-display font-bold text-navy-900">Create Administrator Account</p>
        </div>
        {isSuperAdmin ? (
          <>
            <p className="text-sm text-ink-500 mb-5">
              Create a secure account and assign role-based permissions for a new team member.
            </p>
            <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                required
                value={form.displayName}
                onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                placeholder="Full Name"
                className="rounded-xl px-3 py-2.5 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-gold-400 outline-none"
              />
              <input
                required
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="email@cartkaro.com"
                className="rounded-xl px-3 py-2.5 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-gold-400 outline-none"
              />
              <input
                required
                type="password"
                minLength="8"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="Password (8+ chars)"
                className="rounded-xl px-3 py-2.5 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-gold-400 outline-none"
              />
              <select
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
                className="rounded-xl px-3 py-2.5 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-gold-400 outline-none bg-white"
              >
                <option value="admin">Admin</option>
                <option value="customerSupport">Customer Support</option>
                <option value="superAdmin">Super Admin</option>
              </select>
              <div className="md:col-span-4 flex flex-wrap items-center gap-3 mt-2">
                <button
                  type="submit"
                  disabled={inviteState.loading}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-navy-900 bg-gold-gradient disabled:opacity-60 shadow-xs"
                >
                  {inviteState.loading ? 'Creating Account…' : 'Create Admin Account'}
                </button>
                <AnimatePresence>
                  {inviteState.error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-danger-600">
                      {inviteState.error}
                    </motion.p>
                  )}
                  {inviteState.success && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-success-600">
                      {inviteState.success}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </>
        ) : (
          <p className="text-sm text-ink-500">
            Admin accounts are invite-only. Contact a Super Admin if you need to add or modify administrator access.
          </p>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(userToDelete)}
        title="Revoke Admin Access?"
        description={`Are you sure you want to delete ${userToDelete?.displayName || userToDelete?.email}? They will immediately lose access to this admin dashboard.`}
        confirmLabel={deletingUser ? 'Revoking…' : 'Yes, Revoke Access'}
        danger
        onConfirm={handleDeleteUserConfirm}
        onCancel={() => setUserToDelete(null)}
      />
    </Layout>
  );
}

