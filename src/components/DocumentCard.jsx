// src/components/DocumentCard.jsx
import { FileText, ExternalLink, Check, X } from 'lucide-react';

export default function DocumentCard({ label, number, url, status, onApprove, onReject }) {
  return (
    <div className="rounded-xl ring-1 ring-ink-100 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-navy-50 text-navy-700 shrink-0">
          <FileText size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy-900">{label}</p>
          <p className="text-xs text-ink-500 mt-0.5 break-all">{number || 'Not provided'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 hover:text-gold-600 transition-colors"
          >
            View Document
            <ExternalLink size={12} />
          </a>
        ) : (
          <span className="text-xs text-ink-400">No file uploaded</span>
        )}

        {status === 'approved' ? (
          <span className="text-[11px] font-semibold text-success-600 bg-success-50 px-2 py-0.5 rounded-full">
            Approved
          </span>
        ) : status === 'rejected' ? (
          <span className="text-[11px] font-semibold text-danger-600 bg-danger-50 px-2 py-0.5 rounded-full">
            Rejected
          </span>
        ) : (
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
      </div>
    </div>
  );
}
