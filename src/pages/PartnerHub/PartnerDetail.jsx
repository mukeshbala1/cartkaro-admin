// src/pages/PartnerHub/PartnerDetail.jsx
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  ExternalLink,
  User,
  Store,
  Tags,
  Clock,
  FileCheck2,
  Landmark,
  Truck,
  FileSignature,
  ListChecks,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Image as ImageIcon,
  AlertTriangle,
  RotateCcw,
  BadgeCheck,
  Info,
  Pencil,
  ClipboardList,
  RefreshCw,
} from 'lucide-react';
import Layout from '../../components/Layout';
import SectionCard, { InfoItem, InfoGrid } from '../../components/SectionCard';
import DocumentCard from '../../components/DocumentCard';
import StatusBadge from '../../components/StatusBadge';
import { Loader, EmptyState, ConfirmDialog } from '../../components/Feedback';
import {
  subscribeToPartner,
  approvePartner,
  rejectPartner,
  returnPartnerForChanges,
  setDocumentReviewStatus,
  verifyBankDetails,
  addAdminNote,
} from '../../firebase/partnerService';
import { formatDateTime, formatDate, BUSINESS_TYPE_LABELS } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';

// ---------------------------------------------------------------------------
// Document sets per business type
// ---------------------------------------------------------------------------
const DOC_SETS = {
  grocery: [
    { key: 'fssai', label: 'FSSAI Certificate', numberKey: 'fssaiNumber', urlKey: 'fssaiCertUrl' },
    { key: 'gst', label: 'GST Certificate', numberKey: 'gstNumber', urlKey: 'gstCertUrl' },
    { key: 'tradeLicense', label: 'Trade License', numberKey: 'tradeLicenseNumber', urlKey: 'tradeLicenseUrl' },
    { key: 'pan', label: 'PAN Card', numberKey: 'panNumber', urlKey: 'panCardUrl' },
    { key: 'aadhaar', label: 'Aadhaar Card', numberKey: 'aadhaarNumber', urlKey: 'aadhaarCardUrl' },
  ],
  restaurant: [
    { key: 'fssai', label: 'FSSAI Certificate', numberKey: 'fssaiNumber', urlKey: 'fssaiCertUrl' },
    { key: 'gst', label: 'GST Certificate', numberKey: 'gstNumber', urlKey: 'gstCertUrl' },
    { key: 'tradeLicense', label: 'Trade License', numberKey: 'tradeLicenseNumber', urlKey: 'tradeLicenseUrl' },
    { key: 'pan', label: 'PAN Card', numberKey: 'panNumber', urlKey: 'panCardUrl' },
    { key: 'aadhaar', label: 'Aadhaar Card', numberKey: 'aadhaarNumber', urlKey: 'aadhaarCardUrl' },
  ],
  medical: [
    { key: 'drugLicense', label: 'Drug License Certificate', numberKey: 'drugLicenseNumber', urlKey: 'drugLicenseUrl' },
    { key: 'pharmacist', label: 'Pharmacist Certificate', numberKey: 'pharmacistRegNumber', urlKey: 'pharmacistCertUrl' },
    { key: 'gst', label: 'GST Certificate', numberKey: 'gstNumber', urlKey: 'gstCertUrl' },
    { key: 'tradeLicense', label: 'Trade License', numberKey: 'tradeLicenseNumber', urlKey: 'tradeLicenseUrl' },
    { key: 'pan', label: 'PAN Card', numberKey: 'panNumber', urlKey: 'panCardUrl' },
    { key: 'aadhaar', label: 'Aadhaar Card', numberKey: 'aadhaarNumber', urlKey: 'aadhaarCardUrl' },
  ],
};

// ---------------------------------------------------------------------------
// Helper — Status Action Banner
// ---------------------------------------------------------------------------
function VerificationBanner({ partner }) {
  const fb = partner?.verificationFeedback;
  const status = partner?.verificationStatus;

  if (status === 'approved') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start gap-3 bg-success-50 border border-success-200 rounded-xl px-5 py-4"
      >
        <BadgeCheck className="text-success-600 mt-0.5 shrink-0" size={20} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-success-800">Partner Approved & Live</p>
          <p className="text-sm text-success-700 mt-0.5">
            This partner is active on the CartKaro app.
            {fb?.reviewedBy && (
              <span className="ml-1 text-success-600">
                Reviewed by <strong>{fb.reviewedBy}</strong>.
              </span>
            )}
          </p>
        </div>
      </motion.div>
    );
  }

  if (status === 'rejected' && fb?.reason) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start gap-3 bg-danger-50 border border-danger-200 rounded-xl px-5 py-4"
      >
        <XCircle className="text-danger-600 mt-0.5 shrink-0" size={20} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-semibold text-danger-800">Application Rejected</p>
            {partner.canEditApplication && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning-700 bg-warning-100 px-2 py-0.5 rounded-full">
                <Pencil size={10} /> Partner can edit &amp; resubmit
              </span>
            )}
          </div>
          <p className="text-sm text-danger-700">
            <span className="font-medium">Reason sent to partner: </span>
            {fb.reason}
          </p>
          {fb.reviewedBy && (
            <p className="text-xs text-danger-500 mt-1">
              By <strong>{fb.reviewedBy}</strong>
              {fb.updatedAt && (
                <> · {formatDateTime(fb.updatedAt)}</>
              )}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  // pending with a "return for changes" reason
  if (status === 'pending' && fb?.reason && fb?.actionRequired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start gap-3 bg-warning-50 border border-warning-200 rounded-xl px-5 py-4"
      >
        <RotateCcw className="text-warning-600 mt-0.5 shrink-0" size={20} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-semibold text-warning-800">Returned for Changes</p>
            {partner.canEditApplication && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning-700 bg-warning-100 px-2 py-0.5 rounded-full">
                <Pencil size={10} /> Partner can edit &amp; resubmit
              </span>
            )}
          </div>
          <p className="text-sm text-warning-700">
            <span className="font-medium">Feedback sent to partner: </span>
            {fb.reason}
          </p>
          {fb.reviewedBy && (
            <p className="text-xs text-warning-600 mt-1">
              By <strong>{fb.reviewedBy}</strong>
              {fb.updatedAt && (
                <> · {formatDateTime(fb.updatedAt)}</>
              )}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  // Fresh application — no decision yet
  if (status === 'pending' && !fb?.actionRequired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start gap-3 bg-navy-50 border border-navy-100 rounded-xl px-5 py-4"
      >
        <Info className="text-navy-600 mt-0.5 shrink-0" size={20} />
        <div>
          <p className="font-semibold text-navy-800">Awaiting First Review</p>
          <p className="text-sm text-navy-600 mt-0.5">
            This partner application has not been reviewed yet. Complete all verification checks
            below before approving.
          </p>
        </div>
      </motion.div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Checklist Progress
// ---------------------------------------------------------------------------
function ChecklistProgress({ checklist }) {
  const done = checklist.filter((c) => c.ok).length;
  const pct = checklist.length ? Math.round((done / checklist.length) * 100) : 0;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
          Verification Progress
        </span>
        <span
          className={`text-xs font-bold ${pct === 100 ? 'text-success-600' : 'text-warning-600'}`}
        >
          {done}/{checklist.length} complete
        </span>
      </div>
      <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${pct === 100 ? 'bg-success-500' : 'bg-gold-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PartnerDetail() {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { adminEmail } = useAuth();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApprove, setShowApprove] = useState(false);
  const [reviewAction, setReviewAction] = useState(null); // 'rejected' | 'pending' | null
  const [reviewReason, setReviewReason] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [savingAction, setSavingAction] = useState(false);

  // Real-time Firestore listener
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToPartner(partnerId, (data) => {
      setPartner(data);
      setLoading(false);
    });
    return unsub;
  }, [partnerId]);

  const businessType = partner?.businessDetails?.businessType;

  const docs = useMemo(() => {
    if (!businessType || !DOC_SETS[businessType]) return [];
    return DOC_SETS[businessType].map((d) => ({
      ...d,
      number: partner.legalDocuments?.[d.numberKey],
      url: partner.legalDocuments?.[d.urlKey],
      status: partner.legalDocuments?.reviewStatus?.[d.key],
    }));
  }, [partner, businessType]);

  const checklist = useMemo(() => {
    if (!partner) return [];
    const ownerOk = Boolean(
      partner.ownerDetails?.ownerName && partner.ownerDetails?.mobile && partner.ownerDetails?.email
    );
    const businessOk = Boolean(
      partner.businessDetails?.businessName &&
        partner.businessDetails?.address &&
        partner.businessDetails?.city &&
        partner.businessDetails?.pinCode
    );
    const locationOk = Boolean(partner.businessDetails?.latitude && partner.businessDetails?.longitude);
    const documentsOk = docs.length > 0 && docs.every((d) => d.status === 'approved');
    const bankOk = Boolean(partner.bankDetails?.verified);
    const imagesOk = Boolean(
      partner.businessDetails?.logo ||
        partner.businessDetails?.banner ||
        (partner.businessDetails?.businessPhotos || []).length
    );
    return [
      { label: 'Owner Details', ok: ownerOk },
      { label: 'Business Details', ok: businessOk },
      { label: 'Location', ok: locationOk },
      { label: 'Documents', ok: documentsOk },
      { label: 'Bank Details', ok: bankOk },
      { label: 'Images', ok: imagesOk },
    ];
  }, [partner, docs]);

  // ---------------------------------------------------------------------------
  // Action handlers
  // ---------------------------------------------------------------------------
  async function handleDocStatus(docKey, status) {
    await setDocumentReviewStatus(partner.id, docKey, status);
    // Real-time listener will update partner state automatically.
    // Optimistic local update for snappier feel:
    setPartner((prev) => ({
      ...prev,
      legalDocuments: {
        ...prev.legalDocuments,
        reviewStatus: { ...(prev.legalDocuments?.reviewStatus || {}), [docKey]: status },
      },
    }));
  }

  async function handleVerifyBank() {
    await verifyBankDetails(partner.id);
    setPartner((prev) => ({ ...prev, bankDetails: { ...prev.bankDetails, verified: true } }));
  }

  async function handleApprove() {
    if (checklist.some((item) => !item.ok)) {
      setActionError('Complete every verification check before approving this partner.');
      setShowApprove(false);
      return;
    }
    setSavingAction(true);
    try {
      await approvePartner(partner.id, adminEmail);
      await addAdminNote(partner.id, 'approved', 'Partner approved.', adminEmail);
      setActionSuccess(`${partner.businessDetails?.businessName || 'Partner'} has been approved and is now live on the app.`);
      setShowApprove(false);
      setActionError('');
    } catch (error) {
      setActionError(error.message || 'Could not approve this partner. Please try again.');
    } finally {
      setSavingAction(false);
    }
  }

  async function handleReviewAction() {
    if (!reviewReason.trim()) {
      setActionError('Enter a clear reason for the partner before continuing.');
      return;
    }
    setSavingAction(true);
    try {
      const isRejected = reviewAction === 'rejected';
      const reason = reviewReason.trim();
      if (isRejected) {
        await rejectPartner(partner.id, reason, adminEmail);
        await addAdminNote(partner.id, 'rejected', reason, adminEmail);
        setActionSuccess('Partner has been rejected. They will see your reason and an "Edit & Resubmit" button in the app.');
      } else {
        await returnPartnerForChanges(partner.id, reason, adminEmail);
        await addAdminNote(partner.id, 'returned_for_changes', reason, adminEmail);
        setActionSuccess('Application returned for changes. The partner can now edit and resubmit.');
      }
      setReviewAction(null);
      setReviewReason('');
      setActionError('');
    } catch (error) {
      setActionError(error.message || 'Could not save the verification decision. Please try again.');
    } finally {
      setSavingAction(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading / not-found states
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <Layout title="Partner Details" subtitle="Loading…">
        <Loader label="Loading partner record from Firebase…" />
      </Layout>
    );
  }

  if (!partner) {
    return (
      <Layout title="Partner Details">
        <EmptyState
          icon={Store}
          title="Partner not found"
          description="This partner record doesn't exist or may have been removed."
        />
      </Layout>
    );
  }

  const b = partner.businessDetails || {};
  const o = partner.ownerDetails || {};
  const t = partner.businessTiming || {};
  const bank = partner.bankDetails || {};
  const delivery = partner.deliverySettings || {};
  const mapUrl =
    b.latitude && b.longitude ? `https://www.google.com/maps?q=${b.latitude},${b.longitude}` : null;

  return (
    <Layout title="Partner Details" subtitle={`Partner ID: ${partner.id}`}>
      <button
        onClick={() => navigate('/partner-hub/partners')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-navy-800 transition-colors mb-5"
      >
        <ArrowLeft size={15} />
        Back to Partners
      </button>

      {/* ── Header card ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-navy-gradient relative overflow-hidden rounded-xl2 p-6 mb-6 shadow-card"
      >
        <div className="absolute inset-0 bg-aurora" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center font-display font-bold text-xl text-gold-300 overflow-hidden">
              {b.logo ? (
                <img src={b.logo} alt={b.businessName} className="w-full h-full object-cover" />
              ) : (
                b.businessName?.charAt(0).toUpperCase() || <Store size={22} />
              )}
            </div>
            <div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-white">{b.businessName}</h2>
              <p className="text-ink-300 text-sm mt-0.5">
                {BUSINESS_TYPE_LABELS[b.businessType]} · {b.city}
              </p>
              <p className="text-ink-400 text-xs mt-1">
                Registered: {formatDate(partner.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={partner.verificationStatus} />
            {partner.isActive && (
              <span className="text-[11px] font-semibold bg-success-500/15 text-success-400 ring-1 ring-success-500/30 px-2.5 py-1 rounded-full">
                Live on App
              </span>
            )}
            {partner.canEditApplication && !partner.isActive && (
              <span className="text-[11px] font-semibold bg-warning-500/15 text-warning-400 ring-1 ring-warning-500/30 px-2.5 py-1 rounded-full">
                <Pencil size={10} className="inline mr-1" />
                Edit Mode
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Verification status banner ───────────────────────────────── */}
      <VerificationBanner partner={partner} />

      {/* ── Success toast ────────────────────────────────────────────── */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6 flex items-center gap-3 bg-success-50 border border-success-200 rounded-xl px-5 py-3"
          >
            <CheckCircle2 className="text-success-600 shrink-0" size={18} />
            <p className="text-sm text-success-800 flex-1">{actionSuccess}</p>
            <button
              onClick={() => setActionSuccess('')}
              className="text-success-500 hover:text-success-700 text-lg leading-none"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* ── 01 Owner Details ──────────────────────────────────────── */}
        <SectionCard index={1} title="Owner Details" icon={User}>
          <InfoGrid>
            <InfoItem label="Owner Name" value={o.ownerName} />
            <InfoItem label="Registered Mobile" value={o.mobile} />
            <InfoItem
              label="Alternative Mobile"
              value={o.altMobile ? `${o.altCountryCode || ''} ${o.altMobile}` : '—'}
            />
            <InfoItem label="Email" value={o.email} />
            <InfoItem label="Partner ID" value={partner.id} />
            <InfoItem label="Registered On" value={formatDateTime(partner.createdAt)} />
          </InfoGrid>
        </SectionCard>

        {/* ── 02 Business Details ───────────────────────────────────── */}
        <SectionCard
          index={2}
          title="Business Details"
          icon={Store}
          actions={
            mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-700 bg-navy-50 hover:bg-navy-100 px-3 py-1.5 rounded-full transition-colors"
              >
                <MapPin size={13} />
                Open in Maps
              </a>
            )
          }
        >
          <InfoGrid>
            <InfoItem label="Business Name" value={b.businessName} />
            <InfoItem label="Business Type" value={BUSINESS_TYPE_LABELS[b.businessType]} />
            <InfoItem label="Address" value={b.address} />
            <InfoItem label="City" value={b.city} />
            <InfoItem label="State" value={b.state} />
            <InfoItem label="PIN Code" value={b.pinCode} />
            <InfoItem
              label="Coordinates"
              value={b.latitude && b.longitude ? `${b.latitude}, ${b.longitude}` : '—'}
            />
            {b.gstin && <InfoItem label="GSTIN" value={b.gstin} />}
          </InfoGrid>

          {(b.logo || b.banner || (b.businessPhotos || []).length > 0) && (
            <div className="flex items-center gap-3 mt-5 flex-wrap">
              {[b.logo, b.banner, ...(b.businessPhotos || [])].filter(Boolean).map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="Business"
                  className="w-20 h-20 rounded-xl object-cover ring-1 ring-ink-100 cursor-pointer hover:ring-navy-300 transition-all"
                />
              ))}
            </div>
          )}
          {!b.logo && !b.banner && !(b.businessPhotos || []).length && (
            <div className="flex items-center gap-2 text-ink-400 text-sm mt-4">
              <ImageIcon size={15} />
              No business images uploaded yet.
            </div>
          )}
        </SectionCard>

        {/* ── 03 Category Details ───────────────────────────────────── */}
        <SectionCard index={3} title="Category Details" icon={Tags}>
          {(partner.categories || []).length ? (
            <div className="flex flex-wrap gap-2">
              {partner.categories.map((c) => (
                <span
                  key={c}
                  className="text-xs font-semibold bg-gold-50 text-gold-700 ring-1 ring-gold-200 px-3 py-1.5 rounded-full"
                >
                  {c}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-400">No categories selected.</p>
          )}
        </SectionCard>

        {/* ── 04 Business Timings ───────────────────────────────────── */}
        <SectionCard index={4} title="Business Timings" icon={Clock}>
          <InfoGrid>
            <InfoItem label="Opening Time" value={t.openingTime} />
            <InfoItem label="Closing Time" value={t.closingTime} />
            <InfoItem label="Working Days" value={(t.workingDays || []).join(', ')} />
            <InfoItem label="Accept Online Orders" value={t.acceptOnlineOrders ? 'Yes' : 'No'} />
            {businessType === 'restaurant' && (
              <>
                <InfoItem label="Accept Table Orders" value={t.acceptTableOrders ? 'Yes' : 'No'} />
                <InfoItem label="Dine In Available" value={t.dineInAvailable ? 'Yes' : 'No'} />
              </>
            )}
            {businessType === 'medical' && (
              <>
                <InfoItem label="24 Hours Open" value={t.is24Hours ? 'Yes' : 'No'} />
                <InfoItem
                  label="Emergency Medicine Available"
                  value={t.emergencyMedicineAvailable ? 'Yes' : 'No'}
                />
              </>
            )}
          </InfoGrid>
        </SectionCard>

        {/* ── 05 Legal Documents ────────────────────────────────────── */}
        <SectionCard index={5} title="Legal Document Verification" icon={FileCheck2}>
          {docs.length ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-ink-500">
                  Review each document — approve or reject individually.
                </p>
                <span className="text-xs font-semibold text-ink-500">
                  {docs.filter((d) => d.status === 'approved').length}/{docs.length} approved
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map((d) => (
                  <DocumentCard
                    key={d.key}
                    label={d.label}
                    number={d.number}
                    url={d.url}
                    status={d.status}
                    onApprove={() => handleDocStatus(d.key, 'approved')}
                    onReject={() => handleDocStatus(d.key, 'rejected')}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-400">No business type set — documents unavailable.</p>
          )}
        </SectionCard>

        {/* ── 06 Bank Verification ──────────────────────────────────── */}
        <SectionCard
          index={6}
          title="Bank Verification"
          icon={Landmark}
          actions={
            !bank.verified && (
              <button
                onClick={handleVerifyBank}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-navy-800 hover:bg-navy-700 px-3.5 py-1.5 rounded-full transition-colors"
              >
                <ShieldCheck size={13} />
                Verify Bank
              </button>
            )
          }
        >
          <InfoGrid>
            <InfoItem label="Account Holder Name" value={bank.accountHolderName} />
            <InfoItem label="Bank Name" value={bank.bankName} />
            <InfoItem label="Account Number" value={bank.accountNumber} />
            <InfoItem label="IFSC Code" value={bank.ifscCode} />
            <InfoItem label="UPI ID" value={bank.upiId} />
            <InfoItem
              label="Cancelled Cheque"
              value={
                bank.cancelledChequeUrl ? (
                  <a
                    href={bank.cancelledChequeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-navy-700"
                  >
                    View Document <ExternalLink size={12} />
                  </a>
                ) : (
                  '—'
                )
              }
            />
          </InfoGrid>
          <div className="mt-4">
            {bank.verified ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success-600 bg-success-50 px-3 py-1.5 rounded-full">
                <CheckCircle2 size={13} /> Bank details verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning-600 bg-warning-50 px-3 py-1.5 rounded-full">
                Awaiting verification
              </span>
            )}
          </div>
        </SectionCard>

        {/* ── 07 Delivery Settings ──────────────────────────────────── */}
        <SectionCard index={7} title="Delivery Settings" icon={Truck}>
          <InfoGrid>
            <InfoItem label="Delivery Provider" value={delivery.provider || 'CartKaro Delivery'} />
            {businessType === 'grocery' && (
              <>
                <InfoItem
                  label="Minimum Order Amount"
                  value={delivery.minimumOrderAmount ? `₹${delivery.minimumOrderAmount}` : '—'}
                />
                <InfoItem label="Estimated Delivery Time" value={delivery.estimatedDeliveryTime} />
              </>
            )}
            {businessType === 'restaurant' && (
              <>
                <InfoItem label="Preparation Time" value={delivery.preparationTime} />
                <InfoItem
                  label="Cost For Two"
                  value={delivery.costForTwo ? `₹${delivery.costForTwo}` : '—'}
                />
                <InfoItem
                  label="Packaging Charge"
                  value={delivery.packagingCharge ? `₹${delivery.packagingCharge}` : '—'}
                />
              </>
            )}
            {businessType === 'medical' && (
              <>
                <InfoItem
                  label="Prescription Required"
                  value={delivery.prescriptionRequired ? 'Yes' : 'No'}
                />
                <InfoItem
                  label="Same Day Delivery"
                  value={delivery.sameDayDelivery ? 'Yes' : 'No'}
                />
                <InfoItem
                  label="Emergency Delivery"
                  value={delivery.emergencyDelivery ? 'Yes' : 'No'}
                />
              </>
            )}
          </InfoGrid>
        </SectionCard>

        {/* ── 08 Agreement ──────────────────────────────────────────── */}
        <SectionCard index={8} title="Agreement" icon={FileSignature}>
          {partner.agreement?.accepted ? (
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success-600 bg-success-50 px-3 py-1.5 rounded-full w-fit">
                <CheckCircle2 size={15} /> Agreement Accepted
              </span>
              {partner.agreement?.acceptedAt && (
                <p className="text-xs text-ink-400 ml-1 mt-1">
                  Accepted on {formatDateTime(partner.agreement.acceptedAt)}
                </p>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-danger-600 bg-danger-50 px-3 py-1.5 rounded-full">
              <XCircle size={15} /> Agreement Not Accepted
            </span>
          )}
        </SectionCard>

        {/* ── Final Verification ────────────────────────────────────── */}
        <SectionCard index={null} title="Final Verification" icon={ListChecks}>
          <ChecklistProgress checklist={checklist} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {checklist.map((c) => (
              <div
                key={c.label}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl ring-1 ${
                  c.ok
                    ? 'bg-success-50 ring-success-500/15 text-success-700'
                    : 'bg-ink-50 ring-ink-100 text-ink-500'
                }`}
              >
                {c.ok ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <XCircle size={16} className="text-ink-400" />
                )}
                <span className="text-sm font-medium">{c.label}</span>
              </div>
            ))}
          </div>

          {/* Error message */}
          <AnimatePresence>
            {actionError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-5 flex items-center gap-2.5 text-sm bg-danger-50 text-danger-700 rounded-xl px-4 py-3"
              >
                <AlertTriangle size={15} className="shrink-0" />
                {actionError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { setActionError(''); setActionSuccess(''); setShowApprove(true); }}
              disabled={
                partner.verificationStatus === 'approved' || checklist.some((item) => !item.ok)
              }
              className="flex-1 flex items-center justify-center gap-2 bg-success-500 hover:bg-success-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-display font-semibold py-3 rounded-xl shadow-soft transition-all"
            >
              <CheckCircle2 size={17} />
              Approve Partner
            </button>
            <button
              onClick={() => { setActionError(''); setActionSuccess(''); setReviewAction('pending'); }}
              disabled={partner.verificationStatus === 'approved'}
              className="flex-1 flex items-center justify-center gap-2 bg-warning-500 hover:bg-warning-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-display font-semibold py-3 rounded-xl shadow-soft transition-all"
            >
              <RotateCcw size={17} />
              Return for Changes
            </button>
            <button
              onClick={() => { setActionError(''); setActionSuccess(''); setReviewAction('rejected'); }}
              disabled={partner.verificationStatus === 'approved'}
              className="flex-1 flex items-center justify-center gap-2 bg-danger-500 hover:bg-danger-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-display font-semibold py-3 rounded-xl shadow-soft transition-all"
            >
              <XCircle size={17} />
              Reject Partner
            </button>
          </div>

          {checklist.some((item) => !item.ok) && partner.verificationStatus !== 'approved' && (
            <p className="text-xs text-ink-400 mt-3 text-center">
              Complete all verification checks to enable the Approve button.
            </p>
          )}
        </SectionCard>
      </div>

      {/* ── Approve confirm dialog ───────────────────────────────────── */}
      <ConfirmDialog
        open={showApprove}
        title="Approve this partner?"
        description={`${b.businessName} will go live on the CartKaro Partner Hub App. Make sure all checks are complete.`}
        confirmLabel={savingAction ? 'Approving…' : 'Yes, Approve'}
        onConfirm={handleApprove}
        onCancel={() => setShowApprove(false)}
      />

      {/* ── Reject / Return dialog ───────────────────────────────────── */}
      <ConfirmDialog
        open={reviewAction !== null}
        title={
          reviewAction === 'rejected'
            ? 'Reject this partner application?'
            : 'Return application for changes?'
        }
        description={
          reviewAction === 'rejected'
            ? 'The partner app will show your rejection reason and an "Edit & Resubmit" button so they can correct and reapply.'
            : 'The partner will see your feedback and can edit their application and resubmit for review.'
        }
        confirmLabel={
          savingAction
            ? 'Saving…'
            : reviewAction === 'rejected'
            ? 'Reject & Notify Partner'
            : 'Return & Notify Partner'
        }
        danger={reviewAction === 'rejected'}
        onConfirm={handleReviewAction}
        onCancel={() => {
          setReviewAction(null);
          setReviewReason('');
          setActionError('');
        }}
      >
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-ink-600 uppercase tracking-wide">
            Reason / Feedback for Partner *
          </label>
          <textarea
            value={reviewReason}
            onChange={(e) => setReviewReason(e.target.value)}
            rows={4}
            placeholder={
              reviewAction === 'rejected'
                ? 'e.g. "Your FSSAI certificate has expired. Please upload a valid certificate and resubmit."'
                : 'e.g. "The Aadhaar card image is blurry. Please re-upload a clear, high-resolution photo."'
            }
            className="w-full text-sm bg-ink-50 rounded-xl px-3.5 py-2.5 ring-1 ring-transparent focus:ring-navy-300 outline-none resize-none"
          />
          <p className="text-[11px] text-ink-400">
            This message will be shown exactly as typed in the partner app.
          </p>
          {actionError && (
            <p className="text-xs text-danger-600 flex items-center gap-1">
              <AlertTriangle size={12} /> {actionError}
            </p>
          )}
        </div>
      </ConfirmDialog>
    </Layout>
  );
}
