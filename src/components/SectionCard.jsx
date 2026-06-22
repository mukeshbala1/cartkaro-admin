// src/components/SectionCard.jsx
import { motion } from 'framer-motion';

export default function SectionCard({ index, title, icon: Icon, children, actions }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl2 ring-1 ring-ink-100 shadow-card overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-ink-100">
        <div className="flex items-center gap-3">
          {typeof index === 'number' && (
            <span className="font-display font-bold text-xs text-gold-600 bg-gold-50 w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
              {String(index).padStart(2, '0')}
            </span>
          )}
          {Icon && <Icon size={17} className="text-navy-700 hidden sm:block" />}
          <h3 className="font-display font-bold text-navy-900">{title}</h3>
        </div>
        {actions}
      </div>
      <div className="px-5 sm:px-6 py-5">{children}</div>
    </motion.section>
  );
}

export function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-navy-900 mt-1 break-words">{value || '—'}</p>
    </div>
  );
}

export function InfoGrid({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{children}</div>;
}
