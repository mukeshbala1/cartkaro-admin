// src/pages/Settings.jsx
import { motion } from 'framer-motion';
import { ShieldCheck, Database, LogOut, Wifi, WifiOff } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../firebase/firebaseConfig';

export default function Settings() {
  const { adminName, logout } = useAuth();

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
              <p className="text-xs text-ink-500">Super Admin · CartKaro</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-600 bg-navy-50 rounded-xl px-4 py-3">
            <ShieldCheck size={16} className="text-navy-700" />
            Full access to all active admin modules.
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
      </div>
    </Layout>
  );
}
