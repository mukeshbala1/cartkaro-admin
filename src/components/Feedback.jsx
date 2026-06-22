// src/components/Feedback.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, AlertTriangle } from 'lucide-react';

export function Loader({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-navy-100 border-t-gold-500 animate-spin" />
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', description, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-2xl bg-navy-50 text-navy-600 flex items-center justify-center mb-4">
        <Icon size={26} />
      </div>
      <p className="font-display font-semibold text-navy-900">{title}</p>
      {description && (
        <p className="text-sm text-ink-500 mt-1.5 max-w-sm">{description}</p>
      )}
    </div>
  );
}

export function ConfirmDialog({ open, title, description, danger, onConfirm, onCancel, confirmLabel = 'Confirm', children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-navy-950/55 flex items-center justify-center px-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl shadow-lift p-6"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${danger ? 'bg-danger-50 text-danger-600' : 'bg-success-50 text-success-600'}`}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-navy-900 text-lg">{title}</h3>
                {description && <p className="text-sm text-ink-500 mt-1">{description}</p>}
              </div>
            </div>
            {children && <div className="mt-4">{children}</div>}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-ink-600 hover:bg-ink-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02] ${
                  danger ? 'bg-danger-500 hover:bg-danger-600' : 'bg-success-500 hover:bg-success-600'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
