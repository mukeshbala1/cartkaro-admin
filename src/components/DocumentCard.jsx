// src/components/DocumentCard.jsx
import { useState } from 'react';
import { FileText, ExternalLink, Check, X, Eye, CheckCircle2, XCircle } from 'lucide-react';
import ImageLightbox from './ImageLightbox';

function isImageUrl(url) {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp|svg)/i.test(url.split('?')[0]);
}

export default function DocumentCard({ label, number, url, status, onApprove, onReject }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isImg = isImageUrl(url);

  return (
    <>
      <div
        className={`rounded-xl ring-1 p-4 flex flex-col gap-3 transition-all duration-200 ${
          status === 'approved'
            ? 'ring-success-300 bg-success-50/40'
            : status === 'rejected'
            ? 'ring-danger-300 bg-danger-50/40'
            : 'ring-ink-100 bg-white'
        }`}
      >
        {/* Doc header */}
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              status === 'approved'
                ? 'bg-success-100 text-success-600'
                : status === 'rejected'
                ? 'bg-danger-100 text-danger-600'
                : 'bg-navy-50 text-navy-700'
            }`}
          >
            <FileText size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-navy-900">{label}</p>
            <p className="text-xs text-ink-500 mt-0.5 break-all">{number || 'Not provided'}</p>
          </div>
          {/* Status pill */}
          {status === 'approved' && (
            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-success-700 bg-success-100 px-2 py-0.5 rounded-full">
              <CheckCircle2 size={11} /> Approved
            </span>
          )}
          {status === 'rejected' && (
            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-danger-700 bg-danger-100 px-2 py-0.5 rounded-full">
              <XCircle size={11} /> Rejected
            </span>
          )}
        </div>

        {/* Image thumbnail */}
        {url && isImg && (
          <div
            className="relative group cursor-pointer rounded-lg overflow-hidden ring-1 ring-ink-100"
            onClick={() => setLightboxOpen(true)}
          >
            <img
              src={url}
              alt={label}
              className="w-full h-28 object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-navy-950/0 group-hover:bg-navy-950/40 transition-colors flex items-center justify-center">
              <Eye
                size={22}
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2">
          {url ? (
            isImg ? (
              <button
                onClick={() => setLightboxOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 hover:text-gold-600 transition-colors"
              >
                <Eye size={12} /> Preview
              </button>
            ) : (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 hover:text-gold-600 transition-colors"
              >
                View Document <ExternalLink size={12} />
              </a>
            )
          ) : (
            <span className="text-xs text-ink-400">No file uploaded</span>
          )}

          {/* Approve / Reject buttons — hidden once a decision is made */}
          {!status && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onApprove}
                title="Approve document"
                className="p-1.5 rounded-lg bg-success-50 text-success-600 hover:bg-success-100 transition-colors"
              >
                <Check size={13} />
              </button>
              <button
                onClick={onReject}
                title="Reject document"
                className="p-1.5 rounded-lg bg-danger-50 text-danger-600 hover:bg-danger-100 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Allow re-review even after a decision */}
          {status && (
            <div className="flex items-center gap-1.5">
              {status !== 'approved' && (
                <button
                  onClick={onApprove}
                  title="Mark as approved"
                  className="p-1.5 rounded-lg bg-success-50 text-success-600 hover:bg-success-100 transition-colors"
                >
                  <Check size={13} />
                </button>
              )}
              {status !== 'rejected' && (
                <button
                  onClick={onReject}
                  title="Mark as rejected"
                  className="p-1.5 rounded-lg bg-danger-50 text-danger-600 hover:bg-danger-100 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <ImageLightbox
        open={lightboxOpen}
        url={url}
        label={label}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
