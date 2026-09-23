// src/components/DocumentCard.jsx
import { useState } from 'react';
import { FileText, ExternalLink, Check, X, Eye, CheckCircle2, XCircle, Smartphone } from 'lucide-react';
import ImageLightbox from './ImageLightbox';

function isWebUrl(url) {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:');
}

function isImageUrl(url) {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp|svg)/i.test(url.split('?')[0]);
}

function getFileName(url) {
  if (!url) return '';
  const parts = url.split('/');
  return parts[parts.length - 1] || url;
}

export default function DocumentCard({ label, number, url, status, onApprove, onReject }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const isImg = isImageUrl(url);
  const isWeb = isWebUrl(url);

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

        {/* Image thumbnail / File indicator */}
        {url && isImg && isWeb && !imgError && (
          <div
            className="relative group cursor-pointer rounded-lg overflow-hidden ring-1 ring-ink-100"
            onClick={() => setLightboxOpen(true)}
          >
            <img
              src={url}
              alt={label}
              onError={() => setImgError(true)}
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

        {url && (!isWeb || imgError) && (
          <div className="bg-ink-50 rounded-lg p-2.5 ring-1 ring-ink-100 flex items-center gap-2 text-xs text-ink-600">
            <Smartphone size={14} className="text-navy-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-navy-900 truncate">{getFileName(url)}</p>
              <p className="text-[10px] text-ink-400">Uploaded via Partner Mobile App</p>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2">
          {url ? (
            isWeb && isImg && !imgError ? (
              <button
                onClick={() => setLightboxOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 hover:text-gold-600 transition-colors"
              >
                <Eye size={12} /> Preview
              </button>
            ) : isWeb ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 hover:text-gold-600 transition-colors"
              >
                View Document <ExternalLink size={12} />
              </a>
            ) : (
              <span className="text-[11px] text-ink-500 font-medium truncate max-w-[160px]" title={url}>
                {getFileName(url)}
              </span>
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

      {isWeb && (
        <ImageLightbox
          open={lightboxOpen}
          url={url}
          label={label}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
