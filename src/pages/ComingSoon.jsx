// src/pages/ComingSoon.jsx
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import Layout from '../components/Layout';

export default function ComingSoon({ title, description, icon: Icon }) {
  return (
    <Layout title={title} subtitle="This module isn't available yet">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col items-center justify-center text-center py-24 px-6 rounded-xl2 bg-white ring-1 ring-ink-100 shadow-card"
      >
        <div className="relative w-20 h-20 rounded-2xl bg-navy-gradient flex items-center justify-center mb-6 shadow-glow-gold">
          <div className="absolute inset-0 rounded-2xl bg-aurora" />
          <Icon size={32} className="relative z-10 text-gold-300" strokeWidth={2} />
          <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-gold-gradient flex items-center justify-center ring-2 ring-white">
            <Lock size={13} className="text-navy-900" />
          </span>
        </div>
        <h2 className="font-display font-bold text-xl text-navy-900">{title}</h2>
        <p className="text-ink-500 text-sm mt-2 max-w-md leading-relaxed">{description}</p>
        <span className="mt-6 text-[11px] font-semibold uppercase tracking-wide bg-ink-100 text-ink-500 px-3 py-1.5 rounded-full">
          Coming Soon
        </span>
      </motion.div>
    </Layout>
  );
}
