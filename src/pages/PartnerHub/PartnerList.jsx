// src/pages/PartnerHub/PartnerList.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, Store, Pencil, RefreshCw } from 'lucide-react';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import { Loader, EmptyState } from '../../components/Feedback';
import { subscribeToPartners } from '../../firebase/partnerService';
import { formatDate, BUSINESS_TYPE_LABELS } from '../../utils/dateUtils';

const typeFilters = [
  { key: 'all', label: 'All Types' },
  { key: 'grocery', label: 'Grocery' },
  { key: 'restaurant', label: 'Restaurant' },
  { key: 'medical', label: 'Medical' },
];

export default function PartnerList() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Real-time listener
  useEffect(() => {
    const unsub = subscribeToPartners((data) => {
      setPartners(data);
      setLoading(false);
      setLastUpdated(new Date());
    });
    return unsub;
  }, []);

  // Status counts for filter badges
  const counts = useMemo(() => {
    return {
      all: partners.length,
      pending: partners.filter((p) => p.verificationStatus === 'pending').length,
      approved: partners.filter((p) => p.verificationStatus === 'approved').length,
      rejected: partners.filter((p) => p.verificationStatus === 'rejected').length,
    };
  }, [partners]);

  const statusFilters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return partners.filter((p) => {
      if (status !== 'all' && p.verificationStatus !== status) return false;
      if (type !== 'all' && p.businessDetails?.businessType !== type) return false;
      if (q) {
        const haystack = [
          p.businessDetails?.businessName,
          p.ownerDetails?.ownerName,
          p.ownerDetails?.mobile,
          p.businessDetails?.city,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [partners, status, type, search]);

  return (
    <Layout title="Partners" subtitle="All registered Partner Hub businesses">
      <div className="bg-white rounded-xl2 ring-1 ring-ink-100 shadow-card overflow-hidden">

        {/* ── Filters ──────────────────────────────────────────────── */}
        <div className="p-5 border-b border-ink-100 flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search business, owner, city, or mobile…"
              className="w-full bg-ink-50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-navy-900 placeholder:text-ink-400 ring-1 ring-transparent focus:ring-navy-300 outline-none transition-all"
            />
          </div>

          {/* Status filters with count badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {statusFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatus(f.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  status === f.key
                    ? 'bg-navy-800 text-white'
                    : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                }`}
              >
                {f.label}
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                    status === f.key
                      ? 'bg-white/20 text-white'
                      : 'bg-ink-200 text-ink-500'
                  }`}
                >
                  {counts[f.key]}
                </span>
              </button>
            ))}
          </div>

          {/* Type filter */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-ink-50 rounded-xl px-3.5 py-2.5 text-sm text-navy-900 ring-1 ring-transparent focus:ring-navy-300 outline-none lg:ml-auto"
          >
            {typeFilters.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Live indicator ───────────────────────────────────────── */}
        {lastUpdated && (
          <div className="px-5 py-2 border-b border-ink-50 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
            <p className="text-[11px] text-ink-400 font-medium">
              Live · Last updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        )}

        {/* ── Content ──────────────────────────────────────────────── */}
        {loading ? (
          <Loader label="Connecting to Firebase…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No partners found"
            description="Try adjusting your filters or search keywords."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-500 text-xs uppercase tracking-wide border-b border-ink-100">
                    <th className="px-5 py-3 font-semibold">Business</th>
                    <th className="px-5 py-3 font-semibold">Owner</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">City</th>
                    <th className="px-5 py-3 font-semibold">Registered</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {filtered.map((p, i) => (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.02 }}
                        className="border-b border-ink-50 hover:bg-ink-50/70 transition-colors cursor-pointer"
                        onClick={() => navigate(`/partner-hub/partners/${p.id}`)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <LogoThumb logo={p.businessDetails?.logo} name={p.businessDetails?.businessName} />
                            <div>
                              <span className="font-semibold text-navy-900 block">
                                {p.businessDetails?.businessName || '—'}
                              </span>
                              {p.canEditApplication && !p.isActive && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-warning-600 mt-0.5">
                                  <Pencil size={9} /> Edit Mode
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-ink-600">{p.ownerDetails?.ownerName || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className="bg-navy-50 text-navy-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                            {BUSINESS_TYPE_LABELS[p.businessDetails?.businessType] || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-ink-600">{p.businessDetails?.city || '—'}</td>
                        <td className="px-5 py-3.5 text-ink-600">{formatDate(p.createdAt)}</td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={p.verificationStatus} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/partner-hub/partners/${p.id}`); }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 hover:text-gold-600 transition-colors"
                          >
                            View Details
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-ink-50">
              {filtered.map((p, i) => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  onClick={() => navigate(`/partner-hub/partners/${p.id}`)}
                  className="w-full text-left p-4 flex items-center gap-3 hover:bg-ink-50/70 transition-colors"
                >
                  <LogoThumb logo={p.businessDetails?.logo} name={p.businessDetails?.businessName} size={44} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-navy-900 truncate">{p.businessDetails?.businessName}</p>
                    <p className="text-xs text-ink-500 truncate">
                      {p.ownerDetails?.ownerName} · {p.businessDetails?.city}
                    </p>
                    {p.canEditApplication && !p.isActive && (
                      <p className="text-[10px] font-semibold text-warning-600 flex items-center gap-0.5 mt-0.5">
                        <Pencil size={9} /> Edit Mode
                      </p>
                    )}
                  </div>
                  <StatusBadge status={p.verificationStatus} size="sm" />
                  <ChevronRight size={16} className="text-ink-400 shrink-0" />
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-ink-50 flex items-center justify-between">
              <p className="text-xs text-ink-400">
                Showing <strong>{filtered.length}</strong> of <strong>{partners.length}</strong> partners
              </p>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function LogoThumb({ logo, name, size = 36 }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-lg object-cover ring-1 ring-ink-100 shrink-0"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center font-display font-bold text-sm shrink-0"
    >
      {name ? name.charAt(0).toUpperCase() : <Store size={16} />}
    </div>
  );
}
