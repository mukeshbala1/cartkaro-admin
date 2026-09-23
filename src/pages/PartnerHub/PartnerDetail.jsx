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
  History,
  MessageSquare,
  Send,
  X,
  Eye,
  Save,
  Smartphone,
  Check,
} from 'lucide-react';
import Layout from '../../components/Layout';
import SectionCard, { InfoItem, InfoGrid } from '../../components/SectionCard';
import DocumentCard from '../../components/DocumentCard';
import ImageLightbox from '../../components/ImageLightbox';
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
  subscribeToAdminNotes,
  updatePartnerDetails,
} from '../../firebase/partnerService';
import { formatDateTime, formatDate, BUSINESS_TYPE_LABELS } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';

function isWebUrl(url) {
  if (!url) return false;
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  );
}

function getFileName(url) {
  if (!url) return '';
  const parts = url.split('/');
  return parts[parts.length - 1] || url;
}

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
  const [adminNotes, setAdminNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [lightbox, setLightbox] = useState({ open: false, url: '', label: '' });
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    businessName: '',
    ownerName: '',
    mobile: '',
    altMobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    gstin: '',
    openingTime: '',
    closingTime: '',
  });

  // Real-time Firestore listener
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToPartner(partnerId, (data) => {
      setPartner(data);
      setLoading(false);
    });
    const unsubNotes = subscribeToAdminNotes(partnerId, (notes) => {
      setAdminNotes(notes);
    });
    return () => {
      unsub();
      unsubNotes();
    };
  }, [partnerId]);

  // Aggregate all uploaded media & legal documents into a unified list
  const allMediaList = useMemo(() => {
    if (!partner) return [];
    const list = [];
    const b = partner.businessDetails || {};
    const o = partner.ownerDetails || {};
    const docs = partner.legalDocuments || {};
    const bank = partner.bankDetails || {};

    if (o.profilePhoto) {
      list.push({
        type: 'profile',
        label: 'Owner Profile Photo',
        category: 'Owner Details',
        url: o.profilePhoto,
        details: o.ownerName,
      });
    }

    if (b.logo) {
      list.push({
        type: 'logo',
        label: 'Store Logo',
        category: 'Branding',
        url: b.logo,
        details: b.businessName,
      });
    }

    if (b.banner) {
      list.push({
        type: 'banner',
        label: 'Store Banner',
        category: 'Branding',
        url: b.banner,
        details: b.businessName,
      });
    }

    (b.businessPhotos || []).forEach((photoUrl, idx) => {
      if (photoUrl) {
        list.push({
          type: 'store_photo',
          label: `Store Photo ${idx + 1}`,
          category: 'Store Gallery',
          url: photoUrl,
          details: b.businessName,
        });
      }
    });

    if (docs.fssaiCertUrl) {
      list.push({
        type: 'fssai',
        label: 'FSSAI Certificate',
        category: 'Legal Document',
        url: docs.fssaiCertUrl,
        number: docs.fssaiNumber,
        status: docs.reviewStatus?.fssai,
      });
    }

    if (docs.gstCertUrl) {
      list.push({
        type: 'gst',
        label: 'GST Certificate',
        category: 'Legal Document',
        url: docs.gstCertUrl,
        number: docs.gstNumber,
        status: docs.reviewStatus?.gst,
      });
    }

    if (docs.tradeLicenseUrl) {
      list.push({
        type: 'tradeLicense',
        label: 'Trade License',
        category: 'Legal Document',
        url: docs.tradeLicenseUrl,
        number: docs.tradeLicenseNumber,
        status: docs.reviewStatus?.tradeLicense,
      });
    }

    if (docs.panCardUrl) {
      list.push({
        type: 'pan',
        label: 'PAN Card',
        category: 'Legal Document',
        url: docs.panCardUrl,
        number: docs.panNumber,
        status: docs.reviewStatus?.pan,
      });
    }

    if (docs.aadhaarCardUrl) {
      list.push({
        type: 'aadhaar',
        label: 'Aadhaar Card',
        category: 'Legal Document',
        url: docs.aadhaarCardUrl,
        number: docs.aadhaarNumber,
        status: docs.reviewStatus?.aadhaar,
      });
    }

    if (docs.drugLicenseUrl) {
      list.push({
        type: 'drugLicense',
        label: 'Drug License',
        category: 'Legal Document',
        url: docs.drugLicenseUrl,
        number: docs.drugLicenseNumber,
        status: docs.reviewStatus?.drugLicense,
      });
    }

    if (docs.pharmacistCertUrl) {
      list.push({
        type: 'pharmacist',
        label: 'Pharmacist Certificate',
        category: 'Legal Document',
        url: docs.pharmacistCertUrl,
        number: docs.pharmacistRegNumber,
        status: docs.reviewStatus?.pharmacist,
      });
    }

    if (bank.cancelledChequeUrl) {
      list.push({
        type: 'cancelledCheque',
        label: 'Cancelled Cheque / Passbook',
        category: 'Bank Verification',
        url: bank.cancelledChequeUrl,
        number: bank.accountNumber,
        verified: bank.verified,
      });
    }

    return list;
  }, [partner]);

  function handleOpenEdit() {
    if (!partner) return;
    setEditForm({
      businessName: partner.businessDetails?.businessName || '',
      ownerName: partner.ownerDetails?.ownerName || '',
      mobile: partner.ownerDetails?.mobile || '',
      altMobile: partner.ownerDetails?.altMobile || '',
      email: partner.ownerDetails?.email || '',
      address: partner.businessDetails?.address || '',
      city: partner.businessDetails?.city || '',
      state: partner.businessDetails?.state || '',
      pinCode: partner.businessDetails?.pinCode || '',
      gstin: partner.businessDetails?.gstin || '',
      openingTime: partner.businessTiming?.openingTime || '',
      closingTime: partner.businessTiming?.closingTime || '',
    });
    setEditError('');
    setIsEditOpen(true);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSavingEdit(true);
    setEditError('');
    try {
      await updatePartnerDetails(partner.id, editForm, adminEmail);
      setActionSuccess('Partner details updated successfully.');
      setIsEditOpen(false);
    } catch (err) {
      setEditError(err.message || 'Failed to update partner details.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleAddNoteSubmit(e) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await addAdminNote(partner.id, 'note', newNote.trim(), adminEmail);
      setNewNote('');
    } catch (err) {
      setActionError(err.message || 'Failed to add admin note.');
    } finally {
      setAddingNote(false);
    }
  }

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
            <div
              onClick={() => {
                if (b.logo) {
                  setLightbox({ open: true, url: b.logo, label: `${b.businessName} - Logo` });
                }
              }}
              className={`w-14 h-14 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center font-display font-bold text-xl text-gold-300 overflow-hidden shrink-0 ${b.logo ? 'cursor-pointer hover:ring-gold-300 transition-all' : ''}`}
              title={b.logo ? 'Click to enlarge logo' : undefined}
            >
              {b.logo && (b.logo.startsWith('http://') || b.logo.startsWith('https://') || b.logo.startsWith('data:') || b.logo.startsWith('blob:')) ? (
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
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setMediaModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gold-400/20 hover:bg-gold-400/30 text-gold-300 ring-1 ring-gold-400/40 transition-all shadow-xs"
            >
              <ImageIcon size={13} />
              All Media &amp; Docs ({allMediaList.length})
            </button>
            <button
              onClick={handleOpenEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/25 text-white ring-1 ring-white/30 transition-all shadow-xs"
            >
              <Pencil size={12} />
              Edit Details
            </button>
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
          {/* Owner Profile Photo / Avatar Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-ink-50/70 ring-1 ring-ink-100 mb-5">
            <div
              onClick={() => {
                if (o.profilePhoto) {
                  setLightbox({ open: true, url: o.profilePhoto, label: `${o.ownerName || 'Owner'} - Profile Photo` });
                }
              }}
              className={`relative group ${o.profilePhoto ? 'cursor-pointer hover:ring-navy-400' : ''} w-16 h-16 rounded-2xl ring-2 ring-navy-200 bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-xs transition-all`}
            >
              {o.profilePhoto && isWebUrl(o.profilePhoto) ? (
                <img src={o.profilePhoto} alt={o.ownerName} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              ) : o.profilePhoto ? (
                <div className="flex flex-col items-center justify-center text-center p-1">
                  <Smartphone size={20} className="text-navy-700" />
                  <span className="text-[8px] font-bold text-navy-600 uppercase mt-0.5">Photo</span>
                </div>
              ) : (
                <User size={26} className="text-navy-700" />
              )}
              {o.profilePhoto && (
                <div className="absolute inset-0 bg-navy-950/0 group-hover:bg-navy-950/40 transition-colors flex items-center justify-center">
                  <Eye size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display font-bold text-navy-900 text-base">{o.ownerName || 'Partner Owner'}</p>
                {o.profilePhoto ? (
                  <span className="text-[10px] font-semibold bg-success-50 text-success-700 px-2 py-0.5 rounded-full ring-1 ring-success-200">
                    Profile Photo Uploaded
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold bg-ink-100 text-ink-500 px-2 py-0.5 rounded-full">
                    No Photo Uploaded
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-500 mt-0.5 truncate">
                {o.mobile} {o.email ? `· ${o.email}` : ''}
              </p>
              {o.profilePhoto && (
                <button
                  onClick={() => setLightbox({ open: true, url: o.profilePhoto, label: `${o.ownerName || 'Owner'} - Profile Photo` })}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy-700 hover:text-gold-600 mt-1.5 transition-colors"
                >
                  <Eye size={12} /> Preview Profile Photo
                </button>
              )}
            </div>
          </div>

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

          {/* ── Business Visual Branding (Logo, Banner, Photos) ── */}
          {(b.logo || b.banner || (b.businessPhotos || []).length > 0) && (
            <div className="mt-5 pt-5 border-t border-ink-100 space-y-4">
              <p className="text-xs font-semibold text-ink-600 uppercase tracking-wide flex items-center gap-1.5">
                <ImageIcon size={13} /> Business Visuals &amp; Branding
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Store Logo Card */}
                {b.logo && (
                  <div
                    onClick={() => setLightbox({ open: true, url: b.logo, label: `${b.businessName} - Store Logo` })}
                    className="p-3.5 rounded-xl ring-1 ring-ink-100 bg-ink-50/50 hover:bg-ink-50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase text-navy-800">Store Logo</span>
                      <Eye size={13} className="text-ink-400 group-hover:text-navy-700 transition-colors" />
                    </div>
                    <div className="w-full h-28 rounded-lg bg-white ring-1 ring-ink-100 overflow-hidden flex items-center justify-center">
                      {isWebUrl(b.logo) ? (
                        <img src={b.logo} alt="Logo" className="w-full h-full object-contain p-2 transition-transform group-hover:scale-105" />
                      ) : (
                        <div className="p-2 text-center">
                          <Smartphone size={22} className="text-navy-700 mx-auto mb-1" />
                          <p className="text-[11px] font-medium text-navy-900 truncate max-w-[140px]">{getFileName(b.logo)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Store Banner Card */}
                {b.banner && (
                  <div
                    onClick={() => setLightbox({ open: true, url: b.banner, label: `${b.businessName} - Store Banner` })}
                    className="p-3.5 rounded-xl ring-1 ring-ink-100 bg-ink-50/50 hover:bg-ink-50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase text-navy-800">Store Banner</span>
                      <Eye size={13} className="text-ink-400 group-hover:text-navy-700 transition-colors" />
                    </div>
                    <div className="w-full h-28 rounded-lg bg-white ring-1 ring-ink-100 overflow-hidden flex items-center justify-center">
                      {isWebUrl(b.banner) ? (
                        <img src={b.banner} alt="Banner" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <div className="p-2 text-center">
                          <Smartphone size={22} className="text-navy-700 mx-auto mb-1" />
                          <p className="text-[11px] font-medium text-navy-900 truncate max-w-[140px]">{getFileName(b.banner)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Store Gallery Photos */}
                {(b.businessPhotos || []).length > 0 && (
                  <div className="p-3.5 rounded-xl ring-1 ring-ink-100 bg-ink-50/50 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase text-navy-800">
                        Store Photos ({(b.businessPhotos || []).length})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(b.businessPhotos || []).slice(0, 2).map((photoUrl, i) => (
                        <div
                          key={i}
                          onClick={() => setLightbox({ open: true, url: photoUrl, label: `${b.businessName} - Store Photo ${i + 1}` })}
                          className="relative group cursor-pointer h-24 rounded-lg bg-white ring-1 ring-ink-100 overflow-hidden flex items-center justify-center"
                        >
                          {isWebUrl(photoUrl) ? (
                            <img src={photoUrl} alt="Store" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          ) : (
                            <div className="p-1 text-center">
                              <Smartphone size={16} className="text-navy-700 mx-auto" />
                              <span className="text-[9px] font-medium text-navy-900 truncate block max-w-[70px]">{getFileName(photoUrl)}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-navy-950/0 group-hover:bg-navy-950/40 transition-colors flex items-center justify-center">
                            <Eye size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
          {/* Cancelled Cheque / Bank Passbook Preview Card */}
          {bank.cancelledChequeUrl && (
            <div className="mb-5 p-4 rounded-xl bg-ink-50/70 ring-1 ring-ink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  onClick={() => setLightbox({ open: true, url: bank.cancelledChequeUrl, label: 'Cancelled Cheque / Bank Passbook' })}
                  className="relative group cursor-pointer w-24 h-16 rounded-xl bg-white ring-1 ring-ink-200 overflow-hidden flex items-center justify-center shrink-0"
                >
                  {isWebUrl(bank.cancelledChequeUrl) ? (
                    <img src={bank.cancelledChequeUrl} alt="Cancelled Cheque" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="p-1 text-center">
                      <Smartphone size={18} className="text-navy-700 mx-auto" />
                      <span className="text-[9px] font-bold text-navy-600">Cheque</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-navy-950/0 group-hover:bg-navy-950/40 transition-colors flex items-center justify-center">
                    <Eye size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-navy-900">Cancelled Cheque / Passbook</p>
                    <span className="text-[10px] font-semibold bg-navy-50 text-navy-700 px-2 py-0.5 rounded-full ring-1 ring-navy-100">
                      Bank Document
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">Uploaded proof for bank account verification</p>
                  <button
                    onClick={() => setLightbox({ open: true, url: bank.cancelledChequeUrl, label: 'Cancelled Cheque / Bank Passbook' })}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy-700 hover:text-gold-600 mt-1 transition-colors"
                  >
                    <Eye size={12} /> Enlarge Cheque Document
                  </button>
                </div>
              </div>

              {bank.verified ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success-700 bg-success-100 px-3.5 py-1.5 rounded-full shrink-0">
                  <CheckCircle2 size={14} /> Bank Verified
                </span>
              ) : (
                <button
                  onClick={handleVerifyBank}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-navy-800 hover:bg-navy-700 px-4 py-2 rounded-xl transition-colors shrink-0"
                >
                  <ShieldCheck size={14} /> Mark Bank Verified
                </button>
              )}
            </div>
          )}

          <InfoGrid>
            <InfoItem label="Account Holder Name" value={bank.accountHolderName} />
            <InfoItem label="Bank Name" value={bank.bankName} />
            <InfoItem label="Account Number" value={bank.accountNumber} />
            <InfoItem label="IFSC Code" value={bank.ifscCode} />
            <InfoItem label="Branch" value={bank.branch || '—'} />
            <InfoItem label="UPI ID" value={bank.upiId || '—'} />
          </InfoGrid>

          {!bank.cancelledChequeUrl && (
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
          )}
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

        {/* ── 09 Admin Activity & Audit Trail ─────────────────────────── */}
        <SectionCard index={9} title="Admin Activity & Audit Trail" icon={History}>
          <div className="space-y-3 mb-6">
            {adminNotes.length === 0 ? (
              <p className="text-sm text-ink-400 py-1">No admin activity records or internal notes yet.</p>
            ) : (
              <div className="space-y-2.5">
                {adminNotes.map((entry) => {
                  const actionTone =
                    entry.action === 'approved'
                      ? 'bg-success-50 text-success-700 ring-success-200'
                      : entry.action === 'rejected'
                      ? 'bg-danger-50 text-danger-700 ring-danger-200'
                      : entry.action === 'returned_for_changes'
                      ? 'bg-warning-50 text-warning-700 ring-warning-200'
                      : entry.action === 'details_edited'
                      ? 'bg-navy-50 text-navy-700 ring-navy-200'
                      : entry.action === 'update_request_approved'
                      ? 'bg-success-50 text-success-700 ring-success-200'
                      : entry.action === 'update_request_rejected'
                      ? 'bg-danger-50 text-danger-700 ring-danger-200'
                      : 'bg-ink-50 text-ink-700 ring-ink-200';

                  return (
                    <div
                      key={entry.id}
                      className="p-3.5 rounded-xl ring-1 ring-ink-100 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ring-1 ${actionTone}`}>
                            {entry.action?.replaceAll('_', ' ') || 'Note'}
                          </span>
                          <span className="text-xs text-ink-500">
                            by <strong className="text-ink-700 font-medium">{entry.adminEmail || 'Admin'}</strong>
                          </span>
                        </div>
                        <p className="text-sm text-navy-900 font-medium">{entry.note}</p>
                      </div>
                      <span className="text-xs text-ink-400 shrink-0">
                        {entry.createdAt ? formatDateTime(entry.createdAt) : 'Just now'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add internal note form */}
          <form onSubmit={handleAddNoteSubmit} className="pt-4 border-t border-ink-100">
            <label className="block text-xs font-semibold text-ink-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <MessageSquare size={13} /> Add Internal Admin Note
            </label>
            <div className="flex gap-2.5">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add an internal note or observation for this partner..."
                className="flex-1 bg-ink-50 rounded-xl px-3.5 py-2.5 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-navy-700 outline-none"
              />
              <button
                type="submit"
                disabled={addingNote || !newNote.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-navy-800 hover:bg-navy-900 disabled:opacity-50 transition-colors shrink-0"
              >
                <Send size={13} />
                {addingNote ? 'Saving…' : 'Post Note'}
              </button>
            </div>
          </form>
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

      {/* ── Edit Partner Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl ring-1 ring-ink-100 shadow-modal w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 bg-navy-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-navy-100 text-navy-800 rounded-lg">
                    <Pencil size={16} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-navy-900">Edit Partner Profile</h3>
                    <p className="text-xs text-ink-500">Super Admin / Admin Override</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="p-1.5 text-ink-400 hover:text-navy-900 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {editError && (
                  <div className="p-3 bg-danger-50 text-danger-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    {editError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1">Business Name</label>
                    <input
                      required
                      type="text"
                      value={editForm.businessName}
                      onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                      className="w-full text-sm bg-ink-50 rounded-xl px-3 py-2 ring-1 ring-ink-200 focus:ring-2 focus:ring-gold-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1">GSTIN Number</label>
                    <input
                      type="text"
                      value={editForm.gstin}
                      onChange={(e) => setEditForm({ ...editForm, gstin: e.target.value })}
                      className="w-full text-sm bg-ink-50 rounded-xl px-3 py-2 ring-1 ring-ink-200 focus:ring-2 focus:ring-gold-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1">Owner Name</label>
                    <input
                      required
                      type="text"
                      value={editForm.ownerName}
                      onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                      className="w-full text-sm bg-ink-50 rounded-xl px-3 py-2 ring-1 ring-ink-200 focus:ring-2 focus:ring-gold-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1">Owner Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full text-sm bg-ink-50 rounded-xl px-3 py-2 ring-1 ring-ink-200 focus:ring-2 focus:ring-gold-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1">Mobile Number</label>
                    <input
                      required
                      type="tel"
                      value={editForm.mobile}
                      onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                      className="w-full text-sm bg-ink-50 rounded-xl px-3 py-2 ring-1 ring-ink-200 focus:ring-2 focus:ring-gold-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1">Alt Mobile Number</label>
                    <input
                      type="tel"
                      value={editForm.altMobile}
                      onChange={(e) => setEditForm({ ...editForm, altMobile: e.target.value })}
                      className="w-full text-sm bg-ink-50 rounded-xl px-3 py-2 ring-1 ring-ink-200 focus:ring-2 focus:ring-gold-400 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-ink-600 mb-1">Address</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full text-sm bg-ink-50 rounded-xl px-3 py-2 ring-1 ring-ink-200 focus:ring-2 focus:ring-gold-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1">City</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full text-sm bg-ink-50 rounded-xl px-3 py-2 ring-1 ring-ink-200 focus:ring-2 focus:ring-gold-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1">PIN Code</label>
                    <input
                      type="text"
                      value={editForm.pinCode}
                      onChange={(e) => setEditForm({ ...editForm, pinCode: e.target.value })}
                      className="w-full text-sm bg-ink-50 rounded-xl px-3 py-2 ring-1 ring-ink-200 focus:ring-2 focus:ring-gold-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1">Opening Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 09:00 AM"
                      value={editForm.openingTime}
                      onChange={(e) => setEditForm({ ...editForm, openingTime: e.target.value })}
                      className="w-full text-sm bg-ink-50 rounded-xl px-3 py-2 ring-1 ring-ink-200 focus:ring-2 focus:ring-gold-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1">Closing Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 10:00 PM"
                      value={editForm.closingTime}
                      onChange={(e) => setEditForm({ ...editForm, closingTime: e.target.value })}
                      className="w-full text-sm bg-ink-50 rounded-xl px-3 py-2 ring-1 ring-ink-200 focus:ring-2 focus:ring-gold-400 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-ink-100">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-ink-600 hover:bg-ink-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-navy-900 bg-gold-gradient disabled:opacity-60 shadow-xs"
                  >
                    <Save size={14} />
                    {savingEdit ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── All Uploaded Media & Documents Gallery Modal ─────────────── */}
      <AnimatePresence>
        {mediaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              className="bg-white rounded-2xl ring-1 ring-ink-100 shadow-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-ink-100 flex items-center justify-between bg-navy-900 text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/10 text-gold-300">
                    <ImageIcon size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-white">
                      All Uploaded Media &amp; Documents
                    </h3>
                    <p className="text-xs text-ink-300">
                      {b.businessName} · {allMediaList.length} total files registered
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMediaModalOpen(false)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body: Grid of all media */}
              <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allMediaList.map((item, idx) => {
                  const isWeb = isWebUrl(item.url);
                  return (
                    <div
                      key={idx}
                      className="rounded-xl ring-1 ring-ink-100 bg-white p-3.5 flex flex-col justify-between hover:shadow-card transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-navy-50 text-navy-700 px-2 py-0.5 rounded-full">
                            {item.category}
                          </span>
                          {item.status === 'approved' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-success-700 bg-success-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={10} /> Approved
                            </span>
                          )}
                          {item.status === 'rejected' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-danger-700 bg-danger-50 px-2 py-0.5 rounded-full">
                              <XCircle size={10} /> Rejected
                            </span>
                          )}
                          {item.verified && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-success-700 bg-success-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={10} /> Bank Verified
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-semibold text-navy-900 mb-0.5">{item.label}</p>
                        {item.number && (
                          <p className="text-xs text-ink-500 font-mono mb-2 truncate">
                            {item.number}
                          </p>
                        )}

                        {/* Thumbnail */}
                        <div
                          onClick={() => {
                            setLightbox({ open: true, url: item.url, label: item.label });
                          }}
                          className="relative group cursor-pointer w-full h-32 rounded-lg bg-ink-50 ring-1 ring-ink-100 overflow-hidden flex items-center justify-center my-2"
                        >
                          {isWeb ? (
                            <img
                              src={item.url}
                              alt={item.label}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                          ) : (
                            <div className="p-3 text-center">
                              <Smartphone size={24} className="text-navy-600 mx-auto mb-1" />
                              <p className="text-[11px] font-medium text-navy-900 truncate max-w-[180px]">
                                {getFileName(item.url)}
                              </p>
                              <p className="text-[9px] text-ink-400">Mobile Cache Path</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-navy-950/0 group-hover:bg-navy-950/40 transition-colors flex items-center justify-center">
                            <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-ink-50 flex items-center justify-between">
                        <button
                          onClick={() => setLightbox({ open: true, url: item.url, label: item.label })}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 hover:text-gold-600 transition-colors"
                        >
                          <Eye size={12} /> Full Preview
                        </button>
                        {item.type && item.type in (DOC_SETS[businessType]?.reduce((acc, d) => ({ ...acc, [d.key]: true }), {}) || {}) && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDocStatus(item.type, 'approved')}
                              title="Approve document"
                              className="p-1 rounded bg-success-50 text-success-600 hover:bg-success-100 transition-colors"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => handleDocStatus(item.type, 'rejected')}
                              title="Reject document"
                              className="p-1 rounded bg-danger-50 text-danger-600 hover:bg-danger-100 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Business Photo Lightbox ───────────────────────────────────── */}
      <ImageLightbox
        open={lightbox.open}
        url={lightbox.url}
        label={lightbox.label}
        onClose={() => setLightbox({ open: false, url: '', label: '' })}
      />

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
