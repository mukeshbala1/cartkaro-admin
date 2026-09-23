// src/components/ImageLightbox.jsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Smartphone,
  FileImage,
  Info,
} from 'lucide-react';

function isWebUrl(url) {
  if (!url) return false;
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  );
}

function isImageUrl(url) {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)/i.test(url.split('?')[0]);
}

function getFileName(url) {
  if (!url) return '';
  const parts = url.split('/');
  return parts[parts.length - 1] || url;
}

/**
 * Full-screen document & media viewer overlay with zoom, pan, rotate, and local file info.
 */
export default function ImageLightbox({ open, url, label, onClose }) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imgError, setImgError] = useState(false);

  // Reset transform on open or URL change
  useEffect(() => {
    if (open) {
      setScale(1);
      setRotation(0);
      setImgError(false);
    }
  }, [open, url]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent background scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const isWeb = isWebUrl(url);
  const isImg = isImageUrl(url);
  const isPdf = url && /\.pdf/i.test(url.split('?')[0]);
  const fileName = getFileName(url);

  function handleZoomIn() {
    setScale((s) => Math.min(s + 0.3, 3));
  }

  function handleZoomOut() {
    setScale((s) => Math.max(s - 0.3, 0.5));
  }

  function handleRotate() {
    setRotation((r) => (r + 90) % 360);
  }

  function handleReset() {
    setScale(1);
    setRotation(0);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] flex flex-col bg-navy-950/95 backdrop-blur-md"
        onClick={onClose}
      >
        {/* ── Toolbar ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-white/10 shrink-0 bg-navy-950/80"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-white/10 text-gold-300 shrink-0">
              <FileImage size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {label || fileName || 'Image Preview'}
              </p>
              <p className="text-[11px] text-ink-400 mt-0.5 truncate max-w-sm">
                {fileName || url}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Zoom & Rotate controls (for web images) */}
            {isWeb && isImg && !imgError && (
              <>
                <button
                  onClick={handleZoomIn}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-ink-200 hover:text-white transition-colors"
                  title="Zoom In (+)"
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-ink-200 hover:text-white transition-colors"
                  title="Zoom Out (-)"
                >
                  <ZoomOut size={15} />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-ink-200 hover:text-white transition-colors"
                  title="Rotate (90°)"
                >
                  <RotateCw size={15} />
                </button>
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-ink-200 hover:text-white transition-colors"
                  title="Reset Zoom"
                >
                  {Math.round(scale * 100)}%
                </button>
                <div className="w-px h-5 bg-white/15 mx-1" />
              </>
            )}

            {isWeb && (
              <>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink size={13} />
                  Open
                </a>
                <a
                  href={url}
                  download={fileName || 'document'}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download size={13} />
                  Download
                </a>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-danger-500/30 text-ink-200 hover:text-danger-300 transition-colors ml-1"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>

        {/* ── Main Viewport ────────────────────────────────────────── */}
        <div
          className="flex-1 overflow-auto flex items-center justify-center p-6 relative select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {isWeb && isImg && !imgError ? (
            <motion.div
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transition: 'transform 0.18s ease-out',
              }}
              className="max-w-full max-h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
            >
              <img
                src={url}
                alt={label}
                onError={() => setImgError(true)}
                className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
              />
            </motion.div>
          ) : isWeb && isPdf ? (
            <iframe
              src={url}
              title={label}
              className="w-full h-full rounded-xl bg-white shadow-2xl"
              style={{ minHeight: '80vh' }}
            />
          ) : (
            /* Local device path or offline fallback info card */
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-navy-900 border border-white/15 rounded-2xl p-7 max-w-lg w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/10 text-gold-300 flex items-center justify-center mx-auto mb-4 ring-1 ring-white/20">
                <Smartphone size={32} />
              </div>
              <h3 className="font-display font-bold text-lg text-white mb-1">
                {label || 'Mobile Uploaded Media'}
              </h3>
              <p className="text-xs text-gold-300 font-mono bg-white/5 py-1.5 px-3 rounded-lg inline-block max-w-full truncate mb-4 ring-1 ring-white/10">
                {url || 'No path available'}
              </p>

              <div className="bg-white/5 rounded-xl p-4 text-left space-y-2 mb-5 text-xs text-ink-300 ring-1 ring-white/10">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-gold-300 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-white">Mobile Device File Path:</strong>
                    <p className="text-ink-400 mt-0.5">
                      This photo/document was selected inside the CartKaro Partner mobile app.
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-ink-400">File Name:</span>
                  <span className="font-mono text-ink-200 text-[11px] truncate max-w-[200px]">
                    {fileName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-400">Storage Location:</span>
                  <span className="text-emerald-400 font-semibold">Partner App Cache</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
