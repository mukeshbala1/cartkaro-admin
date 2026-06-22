// src/pages/Dashboard.jsx
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Store, Bike, Lock, ArrowUpRight } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const modules = [
  {
    key: 'customer',
    title: 'Customer Management',
    description: 'Manage CartKaro Customer App users, orders, and support.',
    icon: Users,
    status: 'soon',
    to: '/customer-management',
  },
  {
    key: 'partner',
    title: 'Partner Hub Management',
    description: 'Verify partners, review documents, and manage the Partner Hub App.',
    icon: Store,
    status: 'active',
    to: '/partner-hub',
  },
  {
    key: 'delivery',
    title: 'Delivery Partner Management',
    description: 'Manage CartKaro Delivery Partner App riders and assignments.',
    icon: Bike,
    status: 'soon',
    to: '/delivery-management',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { adminName } = useAuth();

  return (
    <Layout title="Admin Dashboard" subtitle="CartKaro ecosystem control center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-7"
      >
        <h2 className="font-display font-bold text-xl text-navy-900">
          Welcome back, {adminName ? adminName.split('@')[0] : 'Admin'} 👋
        </h2>
        <p className="text-ink-500 text-sm mt-1">
          Here's an overview of every application this panel controls.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((m, i) => {
          const Icon = m.icon;
          const isActive = m.status === 'active';
          return (
            <motion.button
              key={m.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              onClick={() => isActive && navigate(m.to)}
              disabled={!isActive}
              className={`relative text-left rounded-xl2 p-6 overflow-hidden ring-1 transition-all duration-300 ${
                isActive
                  ? 'bg-navy-gradient ring-gold-400/30 shadow-glow-gold hover:-translate-y-1 cursor-pointer'
                  : 'bg-white ring-ink-100 shadow-card cursor-not-allowed opacity-90'
              }`}
            >
              {isActive && (
                <>
                  <div className="absolute inset-0 bg-aurora pointer-events-none" />
                  <motion.div
                    className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-gold-500/20 blur-2xl"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </>
              )}

              <div className="relative z-10 flex items-start justify-between">
                <div
                  className={`p-3 rounded-xl ${
                    isActive ? 'bg-white/10 ring-1 ring-gold-300/30' : 'bg-navy-50'
                  }`}
                >
                  <Icon
                    size={24}
                    strokeWidth={2}
                    className={isActive ? 'text-gold-300' : 'text-navy-700'}
                  />
                </div>

                {isActive ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide bg-gold-500/15 text-gold-300 ring-1 ring-gold-400/30 px-2.5 py-1 rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide bg-ink-100 text-ink-500 px-2.5 py-1 rounded-full">
                    <Lock size={10} />
                    Coming Soon
                  </span>
                )}
              </div>

              <h3
                className={`relative z-10 font-display font-bold text-lg mt-5 ${
                  isActive ? 'text-white' : 'text-navy-900'
                }`}
              >
                {m.title}
              </h3>
              <p
                className={`relative z-10 text-sm mt-2 leading-relaxed ${
                  isActive ? 'text-ink-200/85' : 'text-ink-500'
                }`}
              >
                {m.description}
              </p>

              {isActive && (
                <div className="relative z-10 flex items-center gap-1.5 text-gold-300 text-sm font-semibold mt-5">
                  Open module
                  <ArrowUpRight size={15} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </Layout>
  );
}
