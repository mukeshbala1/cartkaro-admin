// src/components/ImageLightbox.jsx
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ExternalLink, ZoomIn } from 'lucide-react';

/**
 * Full-screen document / image viewer overlay.
 *
 * Props:
 *  - open        : boolean
 *  - url         : string  — the document / image URL
 *  - label       : string  — document label shown in the header
 *  - onClose     : () => void
 */
export default function ImageLightbox({ open, url, label, onClose }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent background scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isImage = url && /\.(jpg|jpeg|png|gif|webp|svg)/i.test(url.split('?')[0]);
  const isPdf   = url && /\.pdf/i.test(url.split('?')[0]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col bg-navy-950/92 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Toolbar */}
          <motion.div
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-white/10 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-navy-700 text-gold-300">
                <ZoomIn size={15} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">{label}</p>
                <p className="text-[11px] text-ink-400 mt-0.5">Document Preview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                title="Open in new tab"
              >
                <ExternalLink size={13} />
                Open
              </a>
              <a
                href={url}
                download
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                title="Download"
              >
                <Download size={13} />
                Download
              </a>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-ink-300 hover:text-white transition-colors"
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>

          {/* Content */}
          <div
            className="flex-1 overflow-auto flex items-center justify-center p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {isImage ? (
              <motion.img
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                transition={{ duration: 0.25 }}
                src={url}
                alt={label}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
              />
            ) : isPdf ? (
              <motion.iframe
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={url}
                title={label}
                className="w-full h-full rounded-xl"
                style={{ minHeight: '70vh' }}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <p className="text-ink-400 text-sm mb-4">
                  This file type cannot be previewed directly.
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gold-400 hover:text-gold-300 underline"
                >
                  <ExternalLink size={15} />
                  Open in new tab
                </a>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
