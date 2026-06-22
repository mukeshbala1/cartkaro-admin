// src/pages/PartnerHub/PartnerDetail.jsx
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import Layout from '../../components/Layout';
import SectionCard, { InfoItem, InfoGrid } from '../../components/SectionCard';
import DocumentCard from '../../components/DocumentCard';
import StatusBadge from '../../components/StatusBadge';
import { Loader, EmptyState, ConfirmDialog } from '../../components/Feedback';
import {
  fetchPartnerById,
  approvePartner,
  rejectPartner,
  setDocumentReviewStatus,
  verifyBankDetails,
} from '../../firebase/partnerService';
import { formatDateTime, BUSINESS_TYPE_LABELS } from '../../utils/dateUtils';

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

export default function PartnerDetail() {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPartnerById(partnerId).then((data) => {
      if (!active) return;
      setPartner(data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
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

  async function handleDocStatus(docKey, status) {
    await setDocumentReviewStatus(partner.id, docKey, status);
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
    await approvePartner(partner.id);
    setPartner((prev) => ({ ...prev, verificationStatus: 'approved', isActive: true }));
    setShowApprove(false);
  }

  async function handleReject() {
    await rejectPartner(partner.id, rejectReason || 'Not specified');
    setPartner((prev) => ({
      ...prev,
      verificationStatus: 'rejected',
      isActive: false,
      rejectReason: rejectReason || 'Not specified',
    }));
    setShowReject(false);
    setRejectReason('');
  }

  if (loading) {
    return (
      <Layout title="Partner Details" subtitle="Loading…">
        <Loader label="Loading partner record…" />
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

      {/* Header */}
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
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={partner.verificationStatus} />
            {partner.isActive && (
              <span className="text-[11px] font-semibold bg-success-500/15 text-success-500 ring-1 ring-success-500/30 px-2.5 py-1 rounded-full">
                Live on App
              </span>
            )}
          </div>
        </div>
      </motion.div>

      <div className="space-y-6">
        {/* Section 1: Owner Details */}
        <SectionCard index={1} title="Owner Details" icon={User}>
          <InfoGrid>
            <InfoItem label="Owner Name" value={o.ownerName} />
            <InfoItem label="Registered Mobile" value={o.mobile} />
            <InfoItem label="Alternative Mobile" value={o.altMobile ? `${o.altCountryCode || ''} ${o.altMobile}` : '—'} />
            <InfoItem label="Email" value={o.email} />
            <InfoItem label="Partner ID" value={partner.id} />
            <InfoItem label="Registered On" value={formatDateTime(partner.createdAt)} />
          </InfoGrid>
        </SectionCard>

        {/* Section 2: Business Details */}
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
            <InfoItem label="Address" value={b.address} />
            <InfoItem label="City" value={b.city} />
            <InfoItem label="State" value={b.state} />
            <InfoItem label="PIN Code" value={b.pinCode} />
            <InfoItem label="Coordinates" value={b.latitude && b.longitude ? `${b.latitude}, ${b.longitude}` : '—'} />
          </InfoGrid>

          {(b.logo || b.banner || (b.businessPhotos || []).length > 0) && (
            <div className="flex items-center gap-3 mt-5 flex-wrap">
              {[b.logo, b.banner, ...(b.businessPhotos || [])].filter(Boolean).map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="Business"
                  className="w-20 h-20 rounded-xl object-cover ring-1 ring-ink-100"
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

        {/* Section 3: Category Details */}
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

        {/* Section 4: Business Timings */}
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
                <InfoItem label="Emergency Medicine Available" value={t.emergencyMedicineAvailable ? 'Yes' : 'No'} />
              </>
            )}
          </InfoGrid>
        </SectionCard>

        {/* Section 5: Legal Documents */}
        <SectionCard index={5} title="Legal Document Verification" icon={FileCheck2}>
          {docs.length ? (
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
          ) : (
            <p className="text-sm text-ink-400">No business type set — documents unavailable.</p>
          )}
        </SectionCard>

        {/* Section 6: Bank Verification */}
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
                  <a href={bank.cancelledChequeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-navy-700">
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

        {/* Section 7: Delivery Settings */}
        <SectionCard index={7} title="Delivery Settings" icon={Truck}>
          <InfoGrid>
            <InfoItem label="Delivery Provider" value={delivery.provider || 'CartKaro Delivery'} />
            {businessType === 'grocery' && (
              <>
                <InfoItem label="Minimum Order Amount" value={delivery.minimumOrderAmount ? `₹${delivery.minimumOrderAmount}` : '—'} />
                <InfoItem label="Estimated Delivery Time" value={delivery.estimatedDeliveryTime} />
              </>
            )}
            {businessType === 'restaurant' && (
              <>
                <InfoItem label="Preparation Time" value={delivery.preparationTime} />
                <InfoItem label="Cost For Two" value={delivery.costForTwo ? `₹${delivery.costForTwo}` : '—'} />
                <InfoItem label="Packaging Charge" value={delivery.packagingCharge ? `₹${delivery.packagingCharge}` : '—'} />
              </>
            )}
            {businessType === 'medical' && (
              <>
                <InfoItem label="Prescription Required" value={delivery.prescriptionRequired ? 'Yes' : 'No'} />
                <InfoItem label="Same Day Delivery" value={delivery.sameDayDelivery ? 'Yes' : 'No'} />
                <InfoItem label="Emergency Delivery" value={delivery.emergencyDelivery ? 'Yes' : 'No'} />
              </>
            )}
          </InfoGrid>
        </SectionCard>

        {/* Section 8: Agreement */}
        <SectionCard index={8} title="Agreement" icon={FileSignature}>
          {partner.agreement?.accepted ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success-600 bg-success-50 px-3 py-1.5 rounded-full">
              <CheckCircle2 size={15} /> Agreement Accepted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-danger-600 bg-danger-50 px-3 py-1.5 rounded-full">
              <XCircle size={15} /> Agreement Not Accepted
            </span>
          )}
        </SectionCard>

        {/* Final Verification */}
        <SectionCard index={null} title="Final Verification" icon={ListChecks}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {checklist.map((c) => (
              <div
                key={c.label}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl ring-1 ${
                  c.ok ? 'bg-success-50 ring-success-500/15 text-success-700' : 'bg-ink-50 ring-ink-100 text-ink-500'
                }`}
              >
                {c.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} className="text-ink-400" />}
                <span className="text-sm font-medium">{c.label}</span>
              </div>
            ))}
          </div>

          {partner.verificationStatus === 'rejected' && partner.rejectReason && (
            <div className="mb-5 text-sm bg-danger-50 text-danger-600 rounded-xl px-4 py-3">
              <span className="font-semibold">Rejection reason: </span>
              {partner.rejectReason}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowApprove(true)}
              disabled={partner.verificationStatus === 'approved'}
              className="flex-1 flex items-center justify-center gap-2 bg-success-500 hover:bg-success-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-display font-semibold py-3 rounded-xl shadow-soft transition-colors"
            >
              <CheckCircle2 size={17} />
              Approve Partner
            </button>
            <button
              onClick={() => setShowReject(true)}
              disabled={partner.verificationStatus === 'rejected'}
              className="flex-1 flex items-center justify-center gap-2 bg-danger-500 hover:bg-danger-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-display font-semibold py-3 rounded-xl shadow-soft transition-colors"
            >
              <XCircle size={17} />
              Reject Partner
            </button>
          </div>
        </SectionCard>
      </div>

      <ConfirmDialog
        open={showApprove}
        title="Approve this partner?"
        description={`${b.businessName} will go live on the CartKaro Partner Hub App.`}
        confirmLabel="Approve"
        onConfirm={handleApprove}
        onCancel={() => setShowApprove(false)}
      />

      <ConfirmDialog
        open={showReject}
        title="Reject this partner?"
        description="Enter a reason so the partner knows what to fix."
        confirmLabel="Reject"
        danger
        onConfirm={handleReject}
        onCancel={() => {
          setShowReject(false);
          setRejectReason('');
        }}
      >
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={3}
          placeholder="e.g. Drug license document is unreadable, please re-upload."
          className="w-full text-sm bg-ink-50 rounded-xl px-3.5 py-2.5 ring-1 ring-transparent focus:ring-navy-300 outline-none resize-none"
        />
      </ConfirmDialog>
    </Layout>
  );
}
