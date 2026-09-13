// src/pages/PartnerHub/UpdateRequests.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileClock, ArrowRight, Check, X, ArrowLeft } from 'lucide-react';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import { Loader, EmptyState, ConfirmDialog } from '../../components/Feedback';
import { subscribeToUpdateRequests, decideUpdateRequest } from '../../firebase/partnerService';
import { formatDateTime } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';

const tabs = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function UpdateRequests() {
  const navigate = useNavigate();
  const { adminEmail } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [confirm, setConfirm] = useState(null); // { request, decision }

  useEffect(() => {
    const unsub = subscribeToUpdateRequests((data) => {
      setRequests(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = useMemo(() => requests.filter((r) => r.status === tab), [requests, tab]);

  async function handleDecision() {
    if (!confirm) return;
    await decideUpdateRequest(confirm.request.id, confirm.decision, adminEmail, confirm.request);
    setRequests((prev) =>
      prev.map((r) => (r.id === confirm.request.id ? { ...r, status: confirm.decision } : r))
    );
    setConfirm(null);
  }

  return (
    <Layout title="Update Requests" subtitle="Partner Hub settings change approvals">
      <button
        onClick={() => navigate('/partner-hub')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-navy-800 transition-colors mb-5"
      >
        <ArrowLeft size={15} />
        Back to Partner Hub
      </button>

      <div className="flex items-center gap-1.5 mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
              tab === t.key ? 'bg-navy-800 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader label="Loading update requests…" />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl2 ring-1 ring-ink-100 shadow-card">
          <EmptyState
            icon={FileClock}
            title={`No ${tab} requests`}
            description="Update requests submitted from the Partner Hub App will appear here."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="bg-white rounded-xl2 ring-1 ring-ink-100 shadow-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <p className="font-display font-bold text-navy-900">{r.type}</p>
                  <p className="text-sm text-ink-500 mt-0.5">
                    {r.partnerName} · {formatDateTime(r.requestedAt)}
                  </p>
                </div>
                <StatusBadge status={r.status === 'approved' ? 'approved' : r.status === 'rejected' ? 'rejected' : 'pending'} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DataPanel title="Current Data" data={r.oldData} tone="old" />
                <DataPanel title="Requested Change" data={r.newData} tone="new" />
              </div>

              {r.status === 'pending' && (
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => setConfirm({ request: r, decision: 'approved' })}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-success-50 hover:bg-success-100 text-success-600 font-semibold text-sm py-2.5 rounded-xl transition-colors"
                  >
                    <Check size={15} />
                    Approve Update
                  </button>
                  <button
                    onClick={() => setConfirm({ request: r, decision: 'rejected' })}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-danger-50 hover:bg-danger-100 text-danger-600 font-semibold text-sm py-2.5 rounded-xl transition-colors"
                  >
                    <X size={15} />
                    Reject Update
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.decision === 'approved' ? 'Approve this update?' : 'Reject this update?'}
        description={
          confirm?.decision === 'approved'
            ? 'The partner record will be updated with the new data shown.'
            : 'The partner will keep their current data unchanged.'
        }
        confirmLabel={confirm?.decision === 'approved' ? 'Approve' : 'Reject'}
        danger={confirm?.decision === 'rejected'}
        onConfirm={handleDecision}
        onCancel={() => setConfirm(null)}
      />
    </Layout>
  );
}

function DataPanel({ title, data, tone }) {
  return (
    <div
      className={`rounded-xl p-4 ring-1 ${
        tone === 'new' ? 'bg-gold-50/60 ring-gold-200' : 'bg-ink-50 ring-ink-100'
      }`}
    >
      <p
        className={`text-[11px] font-semibold uppercase tracking-wide mb-2.5 flex items-center gap-1 ${
          tone === 'new' ? 'text-gold-700' : 'text-ink-500'
        }`}
      >
        {tone === 'new' && <ArrowRight size={11} />}
        {title}
      </p>
      <div className="space-y-1.5">
        {Object.entries(data || {}).map(([key, value]) => (
          <div key={key} className="flex items-start justify-between gap-3 text-sm">
            <span className="text-ink-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
            <span className="font-medium text-navy-900 text-right">
              {Array.isArray(value) ? value.join(', ') : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
