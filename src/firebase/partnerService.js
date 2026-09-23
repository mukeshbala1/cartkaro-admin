// src/firebase/partnerService.js
//
// All Firestore reads/writes for the Partner Hub module live here.
//
// DATA SCHEMA NOTE
// ─────────────────
// The CartKaro Partner app writes business registrations to the "businesses"
// collection (and historically/drafts to "registration_drafts").
// This service queries the "businesses" collection as primary (with fallback
// support for "registration_drafts"), normalising the flat & nested fields
// into the clean structure expected by the admin UI components.
//
// When admins approve, reject, return for changes, or review individual
// documents, this service writes the exact status fields back to Firestore
// so the partner mobile app updates instantly in real time.

import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseConfig';
import { mockPartners, mockUpdateRequests } from '../data/mockPartners';

// ---------------------------------------------------------------------------
// Schema normaliser — Firestore doc → nested admin UI shape
// ---------------------------------------------------------------------------
function detectBusinessType(raw, docId = '') {
  if (raw.businessType) return raw.businessType.toLowerCase();
  if (raw.category) return raw.category.toLowerCase();
  if (raw.type) return raw.type.toLowerCase();
  if (raw.restaurantName || (docId && docId.endsWith('_restaurant'))) return 'restaurant';
  if (raw.pharmacyName || raw.drugLicenseNumber || (docId && docId.endsWith('_medical'))) return 'medical';
  if (raw.groceryName || raw.storeName || (docId && docId.endsWith('_grocery'))) return 'grocery';
  return 'grocery';
}

function resolveVerificationStatus(raw) {
  if (raw.verificationStatus) return raw.verificationStatus.toLowerCase();
  if (raw.isApproved === true || raw.status === 'approved' || raw.approvalStatus === 'approved') {
    return 'approved';
  }
  if (raw.status === 'rejected' || raw.approvalStatus === 'rejected') {
    return 'rejected';
  }
  if (raw.status === 'pending' || raw.approvalStatus === 'pending') {
    return 'pending';
  }
  return 'pending';
}

function normaliseDraft(raw, docId = '', sourceCollection = 'businesses') {
  const businessType = detectBusinessType(raw, docId);
  const typeLabel = businessType.charAt(0).toUpperCase() + businessType.slice(1);

  // Business name — field name varies by type / app version
  const rawName =
    raw.businessName ||
    raw.storeName ||
    raw.displayName ||
    raw.name ||
    raw.restaurantName ||
    raw.pharmacyName ||
    raw.groceryName ||
    '';

  const businessName =
    rawName.trim() ||
    (raw.ownerName ? `${raw.ownerName.trim()}'s ${typeLabel}` : `${typeLabel} Partner`);

  // Handle categories whether array or Firestore map {0: '...', 1: '...'}
  let categories = [];
  if (Array.isArray(raw.selectedCategories)) {
    categories = raw.selectedCategories;
  } else if (raw.selectedCategories && typeof raw.selectedCategories === 'object') {
    categories = Object.values(raw.selectedCategories);
  } else if (Array.isArray(raw.categories)) {
    categories = raw.categories;
  } else if (raw.categories && typeof raw.categories === 'object') {
    categories = Object.values(raw.categories);
  }

  // Handle working days whether array or Firestore map
  let workingDays = [];
  if (Array.isArray(raw.workingDays)) {
    workingDays = raw.workingDays;
  } else if (raw.workingDays && typeof raw.workingDays === 'object') {
    workingDays = Object.values(raw.workingDays);
  }

  // Handle business photos whether array or Firestore map
  let businessPhotos = [];
  const rawPhotos = raw.photos || raw.images || raw.storePhotos || raw.restaurantPhotos || raw.businessPhotos || [];
  if (Array.isArray(rawPhotos)) {
    businessPhotos = rawPhotos.filter(Boolean);
  } else if (rawPhotos && typeof rawPhotos === 'object') {
    businessPhotos = Object.values(rawPhotos).filter(Boolean);
  }

  // Verification status resolution
  const verificationStatus = resolveVerificationStatus(raw);
  const isApproved = verificationStatus === 'approved' || raw.isApproved === true;
  const isActive = raw.isActive !== undefined ? Boolean(raw.isActive) : isApproved;
  const isLive = raw.isLive !== undefined ? Boolean(raw.isLive) : isApproved;

  // Documents map handling (e.g. raw.documents.fssai = { number, url, status })
  const rawDocs = raw.documents || {};
  const docReviewStatus = {
    ...(raw.documentReviewStatus || {}),
    ...(raw.legalDocuments?.reviewStatus || {}),
  };

  // Populate individual doc review statuses from documents map if present
  ['fssai', 'gst', 'tradeLicense', 'pan', 'aadhaar', 'cancelledCheque', 'drugLicense', 'pharmacist'].forEach((key) => {
    if (rawDocs[key]?.status && !docReviewStatus[key]) {
      docReviewStatus[key] = rawDocs[key].status;
    }
  });

  // Bank details extraction
  const bankRaw = raw.bankDetails || {};
  const isBankVerified = Boolean(
    bankRaw.isVerified ?? bankRaw.verified ?? raw.isBankVerified ?? raw.bankVerified ?? false
  );

  return {
    // ── Identity & Collection metadata ──────────────────────────────────
    id: docId,
    _collection: sourceCollection,
    uid: raw.userId || raw.ownerUid || raw.uid || (docId ? docId.split('_')[0] : ''),

    // ── Status fields ───────────────────────────────────────────────────
    verificationStatus,
    isActive,
    isLive,
    isApproved,
    canEditApplication:
      raw.canEditApplication !== undefined
        ? Boolean(raw.canEditApplication)
        : verificationStatus !== 'approved',
    rejectReason: raw.rejectReason || '',
    verificationFeedback: raw.verificationFeedback || (raw.rejectReason ? {
      status: 'rejected',
      reason: raw.rejectReason,
      actionRequired: true,
      action: 'edit_and_resubmit',
      reviewedBy: raw.reviewedBy || '',
    } : null),

    // ── Timestamps ──────────────────────────────────────────────────────
    createdAt: raw.createdAt || raw.submittedAt || raw.publishedAt || raw.registrationDate || raw.createdDate || raw.updatedAt || null,
    reviewedAt: raw.reviewedAt || raw.approvedAt || null,
    reviewedBy: raw.reviewedBy || '',

    // ── Owner Details ───────────────────────────────────────────────────
    ownerDetails: {
      ownerName: raw.ownerName || bankRaw.accountHolder || raw.bankRegisteredName || raw.accountHolder || '',
      mobile: raw.ownerPhone || raw.mobile || raw.registeredMobile || raw.phoneNumber || raw.contactNumber || raw.mobileNumber || raw.phone || '',
      altMobile: raw.altMobile || '',
      altCountryCode: raw.altCountryCode || '+91',
      email: raw.ownerEmail || raw.email || '',
      profilePhoto:
        raw.profilePhotoUrl ||
        raw.avatarUrl ||
        raw.profilePhoto ||
        raw.profilePhotoPath ||
        raw.ownerPhoto ||
        '',
    },

    // ── Business Details ────────────────────────────────────────────────
    businessDetails: {
      businessType,
      businessName,
      address:
        raw.location?.address ||
        raw.fullAddress ||
        raw.storeAddress ||
        raw.address ||
        raw.restaurantAddress ||
        raw.businessAddress ||
        '',
      area: raw.location?.area || raw.area || '',
      city: raw.location?.city || raw.city || '',
      state: raw.location?.state || raw.state || '',
      pinCode: raw.location?.pincode || raw.pinCode || raw.pincode || raw.zipCode || '',
      latitude: parseFloat(raw.location?.lat || raw.latitude || raw.lat) || null,
      longitude: parseFloat(raw.location?.lng || raw.longitude || raw.lng) || null,
      logo:
        raw.storeLogo ||
        raw.storeLogoPath ||
        raw.logoUrl ||
        raw.logo ||
        raw.restaurantLogoPath ||
        raw.logoPath ||
        raw.businessLogo ||
        '',
      banner:
        raw.storeBanner ||
        raw.storeBannerPath ||
        raw.bannerUrl ||
        raw.banner ||
        raw.restaurantBannerPath ||
        raw.bannerPath ||
        raw.businessBanner ||
        '',
      businessPhotos,
      gstin: raw.gstNumber || raw.gst || raw.gstin || rawDocs.gst?.number || '',
    },

    // ── Categories ──────────────────────────────────────────────────────
    categories,

    // ── Business Timings ─────────────────────────────────────────────────
    businessTiming: {
      openingTime: raw.openingTime || '',
      closingTime: raw.closingTime || '',
      workingDays,
      acceptOnlineOrders: raw.acceptOnlineOrders ?? raw.isOpen ?? true,
      // restaurant
      acceptTableOrders: raw.acceptTableOrders ?? false,
      dineInAvailable: raw.dineInAvailable ?? false,
      // medical
      is24Hours: raw.is24Hours ?? false,
      emergencyMedicineAvailable: raw.emergencyMedicineAvailable ?? false,
    },

    // ── Legal Documents ─────────────────────────────────────────────────
    legalDocuments: {
      // FSSAI
      fssaiNumber: rawDocs.fssai?.number || raw.fssaiNumber || raw.fssai || '',
      fssaiCertUrl:
        rawDocs.fssai?.url ||
        raw.fssaiUrl ||
        raw.fssaiCertificate ||
        raw.fssaiCertUrl ||
        raw.fssaiDocPath ||
        raw.fssaiCertPath ||
        '',
      // GST
      gstNumber: rawDocs.gst?.number || raw.gstNumber || raw.gst || '',
      gstCertUrl:
        rawDocs.gst?.url ||
        raw.gstUrl ||
        raw.gstCertificate ||
        raw.gstCertUrl ||
        raw.gstDocPath ||
        raw.gstCertPath ||
        '',
      // Trade License
      tradeLicenseNumber:
        rawDocs.tradeLicense?.number ||
        raw.tradeLicense ||
        raw.tradeLicenseNumber ||
        '',
      tradeLicenseUrl:
        rawDocs.tradeLicense?.url ||
        raw.tradeLicenseUrl ||
        raw.tradeLicensePath ||
        raw.tradeLicenseDocPath ||
        '',
      // PAN
      panNumber: rawDocs.pan?.number || raw.pan || raw.panNumber || '',
      panCardUrl:
        rawDocs.pan?.url ||
        raw.panUrl ||
        raw.panCardUrl ||
        raw.panDocPath ||
        '',
      // Aadhaar
      aadhaarNumber: rawDocs.aadhaar?.number || raw.aadhaar || raw.aadhaarNumber || '',
      aadhaarCardUrl:
        rawDocs.aadhaar?.url ||
        raw.aadhaarUrl ||
        raw.aadhaarCardUrl ||
        raw.aadhaarDocPath ||
        '',
      // Drug license (medical)
      drugLicenseNumber: rawDocs.drugLicense?.number || raw.drugLicenseNumber || '',
      drugLicenseUrl: rawDocs.drugLicense?.url || raw.drugLicenseUrl || raw.drugLicensePath || '',
      // Pharmacist cert (medical)
      pharmacistRegNumber: rawDocs.pharmacist?.number || raw.pharmacistRegNumber || '',
      pharmacistCertUrl: rawDocs.pharmacist?.url || raw.pharmacistCertUrl || raw.pharmacistCertPath || '',
      // Cancelled Cheque
      cancelledChequeUrl:
        rawDocs.cancelledCheque?.url ||
        bankRaw.cancelledCheque ||
        raw.cancelledChequeUrl ||
        raw.cancelledChequePath ||
        '',
      // Review statuses set by admin
      reviewStatus: docReviewStatus,
    },

    // ── Bank Details ─────────────────────────────────────────────────────
    bankDetails: {
      accountHolderName:
        bankRaw.accountHolder ||
        bankRaw.accountHolderName ||
        bankRaw.registeredName ||
        raw.bankRegisteredName ||
        raw.accountHolder ||
        raw.accountHolderName ||
        '',
      bankName: bankRaw.bank || bankRaw.bankName || raw.bankName || raw.selectedBank || '',
      accountNumber: bankRaw.accountNumber || raw.bankAccountNumber || raw.accountNumber || '',
      ifscCode: bankRaw.ifsc || bankRaw.ifscCode || raw.ifscCode || raw.ifsc || '',
      branch: bankRaw.branch || raw.bankBranch || '',
      upiId: bankRaw.upiId || raw.upi || raw.upiId || '',
      cancelledChequeUrl:
        bankRaw.cancelledCheque ||
        raw.cancelledChequeUrl ||
        raw.cancelledChequePath ||
        rawDocs.cancelledCheque?.url ||
        '',
      verified: isBankVerified,
      verificationMethod: bankRaw.verificationMethod || raw.bankVerificationMethod || '',
      verificationId: bankRaw.verificationId || raw.bankVerificationId || '',
      verificationAmount: bankRaw.verificationAmount || raw.bankVerificationAmount || 1,
      verificationMessage: bankRaw.verificationMessage || raw.bankVerificationMessage || '',
    },

    // ── Delivery Settings ────────────────────────────────────────────────
    deliverySettings: {
      provider: raw.deliveryOption || raw.deliveryType || raw.provider || 'cartkaro',
      minimumOrderAmount: raw.minimumOrderAmount || raw.minOrderAmount || raw.minOrder || '',
      estimatedDeliveryTime: raw.estimatedDeliveryTime || raw.estDeliveryTime || raw.estDelivery || '',
      // restaurant
      preparationTime: raw.preparationTime || '',
      costForTwo: raw.costForTwo || '',
      packagingCharge: raw.packagingCharge || '',
      // medical
      prescriptionRequired: raw.prescriptionRequired ?? false,
      sameDayDelivery: raw.sameDayDelivery ?? false,
      emergencyDelivery: raw.emergencyDelivery ?? false,
    },

    // ── Agreement ────────────────────────────────────────────────────────
    agreement: {
      accepted: raw.agreementAccepted ?? raw.termsAccepted ?? (raw.agreementStatus === 'accepted') ?? false,
      acceptedAt: raw.agreementAcceptedAt || raw.agreement?.acceptedAt || raw.createdAt || null,
    },

    // Keep raw data accessible for debugging
    _raw: raw,
  };
}

function extractDocTime(docData) {
  const t = docData.createdAt || docData.submittedAt || docData.updatedAt;
  if (!t) return 0;
  if (t.seconds) return t.seconds * 1000;
  if (t._seconds) return t._seconds * 1000;
  const parsed = new Date(t).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

// ---------------------------------------------------------------------------
// In-memory fallback (demo mode)
// ---------------------------------------------------------------------------
let demoPartners = mockPartners.map((p) => ({ ...p }));
let demoUpdateRequests = mockUpdateRequests.map((r) => ({ ...r }));

// ---------------------------------------------------------------------------
// Helper: Resolve collection for a partner doc (businesses or registration_drafts)
// ---------------------------------------------------------------------------
async function getPartnerDocRef(partnerId) {
  if (!db) return { ref: null, snap: null, collection: 'businesses' };
  // Check businesses first
  const bRef = doc(db, 'businesses', partnerId);
  const bSnap = await getDoc(bRef);
  if (bSnap.exists()) {
    return { ref: bRef, snap: bSnap, collection: 'businesses' };
  }
  // Check registration_drafts
  const dRef = doc(db, 'registration_drafts', partnerId);
  const dSnap = await getDoc(dRef);
  if (dSnap.exists()) {
    return { ref: dRef, snap: dSnap, collection: 'registration_drafts' };
  }
  // Default to businesses
  return { ref: bRef, snap: null, collection: 'businesses' };
}

// ---------------------------------------------------------------------------
// ONE-TIME READS
// ---------------------------------------------------------------------------

export async function fetchPartners() {
  if (!isFirebaseConfigured || !db) {
    return Promise.resolve(demoPartners);
  }
  try {
    const itemsMap = new Map();

    // Query businesses collection (primary)
    try {
      const bSnap = await getDocs(collection(db, 'businesses'));
      bSnap.docs.forEach((d) => {
        itemsMap.set(d.id, normaliseDraft(d.data(), d.id, 'businesses'));
      });
    } catch (err) {
      console.warn('[partnerService] fetchPartners businesses error:', err.message);
    }

    // Query registration_drafts (fallback / legacy)
    try {
      const dSnap = await getDocs(collection(db, 'registration_drafts'));
      dSnap.docs.forEach((d) => {
        if (!itemsMap.has(d.id)) {
          itemsMap.set(d.id, normaliseDraft(d.data(), d.id, 'registration_drafts'));
        }
      });
    } catch (err) {
      console.warn('[partnerService] fetchPartners registration_drafts error:', err.message);
    }

    const items = Array.from(itemsMap.values());
    items.sort((a, b) => extractDocTime(b) - extractDocTime(a));
    return items;
  } catch (e) {
    console.error('[partnerService] fetchPartners error:', e);
    return [];
  }
}

export async function fetchPartnerById(partnerId) {
  if (!isFirebaseConfigured || !db) {
    return Promise.resolve(demoPartners.find((p) => p.id === partnerId) || null);
  }
  try {
    const { snap, collection: col } = await getPartnerDocRef(partnerId);
    if (snap && snap.exists()) {
      return normaliseDraft(snap.data(), snap.id, col);
    }
    return null;
  } catch (err) {
    console.error('[partnerService] fetchPartnerById error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// REAL-TIME LISTENERS (onSnapshot)
// ---------------------------------------------------------------------------

export function subscribeToPartners(callback) {
  if (!isFirebaseConfigured || !db) {
    callback(demoPartners);
    return () => {};
  }

  const partnersMap = new Map();

  function emit() {
    const items = Array.from(partnersMap.values());
    items.sort((a, b) => extractDocTime(b) - extractDocTime(a));
    callback(items);
  }

  // Listen to businesses collection
  const unsubBusinesses = onSnapshot(
    collection(db, 'businesses'),
    (snap) => {
      snap.docs.forEach((d) => {
        partnersMap.set(d.id, normaliseDraft(d.data(), d.id, 'businesses'));
      });
      snap.docChanges().forEach((change) => {
        if (change.type === 'removed') {
          partnersMap.delete(change.doc.id);
        }
      });
      emit();
    },
    (err) => {
      console.error('[partnerService] subscribeToPartners (businesses) error:', err);
    }
  );

  // Listen to registration_drafts collection
  const unsubDrafts = onSnapshot(
    collection(db, 'registration_drafts'),
    (snap) => {
      snap.docs.forEach((d) => {
        if (!partnersMap.has(d.id)) {
          partnersMap.set(d.id, normaliseDraft(d.data(), d.id, 'registration_drafts'));
        }
      });
      emit();
    },
    (err) => {
      console.warn('[partnerService] subscribeToPartners (registration_drafts) warning:', err.message);
    }
  );

  return () => {
    unsubBusinesses();
    unsubDrafts();
  };
}

export function subscribeToPartner(partnerId, callback) {
  if (!isFirebaseConfigured || !db) {
    const partner = demoPartners.find((p) => p.id === partnerId) || null;
    callback(partner);
    return () => {};
  }

  // Listen to businesses doc first
  const bRef = doc(db, 'businesses', partnerId);
  let unsubDraft = null;

  const unsubBusiness = onSnapshot(
    bRef,
    (snap) => {
      if (snap.exists()) {
        callback(normaliseDraft(snap.data(), snap.id, 'businesses'));
      } else {
        // Fallback to registration_drafts if businesses doc doesn't exist
        if (!unsubDraft) {
          const dRef = doc(db, 'registration_drafts', partnerId);
          unsubDraft = onSnapshot(
            dRef,
            (dSnap) => {
              callback(dSnap.exists() ? normaliseDraft(dSnap.data(), dSnap.id, 'registration_drafts') : null);
            },
            (err) => {
              console.warn('[partnerService] subscribeToPartner (draft) error:', err.message);
              callback(null);
            }
          );
        }
      }
    },
    (err) => {
      console.error('[partnerService] subscribeToPartner error:', err);
      callback(null);
    }
  );

  return () => {
    unsubBusiness();
    if (unsubDraft) unsubDraft();
  };
}

// ---------------------------------------------------------------------------
// ADMIN ACTIONS — write decisions back to Firestore
// ---------------------------------------------------------------------------

export async function approvePartner(partnerId, reviewedBy = '') {
  const update = {
    status: 'approved',
    approvalStatus: 'approved',
    verificationStatus: 'approved',
    isApproved: true,
    isActive: true,
    isLive: true,
    isVerified: true,
    canEditApplication: false,
    rejectReason: '',
    reviewedBy: reviewedBy || '',
    verificationFeedback: {
      status: 'approved',
      reason: '',
      actionRequired: false,
      action: null,
      reviewedBy: reviewedBy || '',
    },
  };

  if (!isFirebaseConfigured || !db) {
    demoPartners = demoPartners.map((p) =>
      p.id === partnerId ? { ...p, ...update } : p
    );
    return Promise.resolve();
  }

  const { ref } = await getPartnerDocRef(partnerId);
  return updateDoc(ref, {
    ...update,
    'verificationFeedback.updatedAt': serverTimestamp(),
    reviewedAt: serverTimestamp(),
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function setPartnerVerification(partnerId, status, reason, reviewedBy = '') {
  if (!['pending', 'rejected'].includes(status)) {
    throw new Error('Unsupported verification status.');
  }
  const cleanReason = (reason || '').trim();
  if (!cleanReason) {
    throw new Error('A reason is required before returning or rejecting an application.');
  }

  const update = {
    status: status,
    approvalStatus: status,
    verificationStatus: status,
    isApproved: false,
    isLive: false,
    canEditApplication: true,
    rejectReason: status === 'rejected' ? cleanReason : '',
    reviewedBy: reviewedBy || '',
    verificationFeedback: {
      status,
      reason: cleanReason,
      actionRequired: true,
      action: 'edit_and_resubmit',
      reviewedBy: reviewedBy || '',
    },
  };

  if (!isFirebaseConfigured || !db) {
    demoPartners = demoPartners.map((p) =>
      p.id === partnerId ? { ...p, ...update } : p
    );
    return Promise.resolve();
  }

  const { ref } = await getPartnerDocRef(partnerId);
  return updateDoc(ref, {
    ...update,
    'verificationFeedback.updatedAt': serverTimestamp(),
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function rejectPartner(partnerId, rejectReason, reviewedBy) {
  return setPartnerVerification(partnerId, 'rejected', rejectReason, reviewedBy);
}

export function returnPartnerForChanges(partnerId, reason, reviewedBy) {
  return setPartnerVerification(partnerId, 'pending', reason, reviewedBy);
}

/**
 * Direct Partner Profile Editing (Super Admin / Admin Override)
 */
export async function updatePartnerDetails(partnerId, fields, adminEmail = '') {
  const docFields = {
    businessName: fields.businessName || '',
    restaurantName: fields.businessName || '',
    storeName: fields.businessName || '',
    displayName: fields.businessName || '',
    name: fields.businessName || '',
    groceryName: fields.businessName || '',
    medicalName: fields.businessName || '',
    ownerName: fields.ownerName || '',
    mobile: fields.mobile || '',
    ownerPhone: fields.mobile || '',
    registeredMobile: fields.mobile || '',
    mobileNumber: fields.mobile || '',
    phoneNumber: fields.mobile || '',
    contactNumber: fields.mobile || '',
    phone: fields.mobile || '',
    altMobile: fields.altMobile || '',
    email: fields.email || '',
    ownerEmail: fields.email || '',
    address: fields.address || '',
    fullAddress: fields.address || '',
    storeAddress: fields.address || '',
    restaurantAddress: fields.address || '',
    businessAddress: fields.address || '',
    city: fields.city || '',
    state: fields.state || '',
    pincode: fields.pinCode || fields.pincode || '',
    pinCode: fields.pinCode || fields.pincode || '',
    gstNumber: fields.gstin || fields.gstNumber || '',
    gst: fields.gstin || fields.gstNumber || '',
    commissionRate: fields.commissionRate !== undefined ? Number(fields.commissionRate) : undefined,
    'businessTiming.openingTime': fields.openingTime || undefined,
    'businessTiming.closingTime': fields.closingTime || undefined,
    openingTime: fields.openingTime || undefined,
    closingTime: fields.closingTime || undefined,
  };

  // Clean undefined fields
  const payload = {};
  Object.entries(docFields).forEach(([k, v]) => {
    if (v !== undefined) payload[k] = v;
  });

  if (!isFirebaseConfigured || !db) {
    demoPartners = demoPartners.map((p) => {
      if (p.id !== partnerId) return p;
      return {
        ...p,
        businessDetails: {
          ...p.businessDetails,
          businessName: fields.businessName || p.businessDetails.businessName,
          address: fields.address || p.businessDetails.address,
          city: fields.city || p.businessDetails.city,
          state: fields.state || p.businessDetails.state,
          pinCode: fields.pinCode || p.businessDetails.pinCode,
          gstin: fields.gstin || p.businessDetails.gstin,
        },
        ownerDetails: {
          ...p.ownerDetails,
          ownerName: fields.ownerName || p.ownerDetails.ownerName,
          mobile: fields.mobile || p.ownerDetails.mobile,
          altMobile: fields.altMobile || p.ownerDetails.altMobile,
          email: fields.email || p.ownerDetails.email,
        },
      };
    });
    return Promise.resolve();
  }

  const { ref } = await getPartnerDocRef(partnerId);
  await updateDoc(ref, {
    ...payload,
    lastModifiedByAdmin: adminEmail,
    updatedAt: serverTimestamp(),
  });

  await addAdminNote(
    partnerId,
    'details_edited',
    `Partner details updated directly by ${adminEmail || 'admin'}.`,
    adminEmail
  );
}

// ---------------------------------------------------------------------------
// DOCUMENT & BANK VERIFICATION
// ---------------------------------------------------------------------------

export async function setDocumentReviewStatus(partnerId, docKey, status) {
  if (!isFirebaseConfigured || !db) {
    demoPartners = demoPartners.map((p) => {
      if (p.id !== partnerId) return p;
      const reviewStatus = { ...(p.legalDocuments?.reviewStatus || {}), [docKey]: status };
      return { ...p, legalDocuments: { ...p.legalDocuments, reviewStatus } };
    });
    return Promise.resolve();
  }

  const { ref, snap } = await getPartnerDocRef(partnerId);
  const data = snap ? snap.data() : {};
  const existingDocReview = data?.documentReviewStatus || {};

  return updateDoc(ref, {
    [`documentReviewStatus.${docKey}`]: status,
    [`documents.${docKey}.status`]: status,
    updatedAt: serverTimestamp(),
  });
}

export async function verifyBankDetails(partnerId) {
  if (!isFirebaseConfigured || !db) {
    demoPartners = demoPartners.map((p) =>
      p.id === partnerId
        ? { ...p, bankDetails: { ...p.bankDetails, verified: true } }
        : p
    );
    return Promise.resolve();
  }

  const { ref } = await getPartnerDocRef(partnerId);
  return updateDoc(ref, {
    'bankDetails.isVerified': true,
    isBankVerified: true,
    bankVerified: true,
    bankVerifiedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// ADMIN ACTIVITY LOG
// ---------------------------------------------------------------------------

export async function addAdminNote(partnerId, action, note, adminEmail) {
  if (!isFirebaseConfigured || !db) return Promise.resolve();
  const { collection: col } = await getPartnerDocRef(partnerId);
  const notesCol = collection(db, col, partnerId, 'adminActivity');
  return addDoc(notesCol, {
    action,
    note,
    adminEmail,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToAdminNotes(partnerId, callback) {
  if (!isFirebaseConfigured || !db) {
    callback([]);
    return () => {};
  }

  // Listen to businesses/{partnerId}/adminActivity by default
  const notesCol = collection(db, 'businesses', partnerId, 'adminActivity');
  return onSnapshot(
    notesCol,
    (snap) => {
      const notes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      notes.sort((a, b) => {
        const ta = a.createdAt?.seconds || a.createdAt?._seconds || 0;
        const tb = b.createdAt?.seconds || b.createdAt?._seconds || 0;
        return tb - ta;
      });
      callback(notes);
    },
    (err) => {
      // If error or empty, try registration_drafts fallback
      const fallbackCol = collection(db, 'registration_drafts', partnerId, 'adminActivity');
      onSnapshot(
        fallbackCol,
        (fSnap) => {
          const notes = fSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          notes.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          callback(notes);
        },
        () => callback([])
      );
    }
  );
}

// ---------------------------------------------------------------------------
// UPDATE REQUESTS
// ---------------------------------------------------------------------------

export async function fetchUpdateRequests() {
  if (!isFirebaseConfigured || !db) {
    return Promise.resolve(demoUpdateRequests);
  }
  try {
    const snap = await getDocs(collection(db, 'partnerUpdateRequests'));
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => extractDocTime(b) - extractDocTime(a));
    return items;
  } catch (err) {
    console.warn('[partnerService] fetchUpdateRequests error:', err.message);
    return [];
  }
}

export function subscribeToUpdateRequests(callback) {
  if (!isFirebaseConfigured || !db) {
    callback(demoUpdateRequests);
    return () => {};
  }
  const ref = collection(db, 'partnerUpdateRequests');
  return onSnapshot(
    ref,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => extractDocTime(b) - extractDocTime(a));
      callback(items);
    },
    (err) => {
      console.warn('[partnerService] subscribeToUpdateRequests error:', err.message);
      callback([]);
    }
  );
}

export async function decideUpdateRequest(requestId, decision, adminEmail = '', requestData = null) {
  if (!isFirebaseConfigured || !db) {
    demoUpdateRequests = demoUpdateRequests.map((r) =>
      r.id === requestId ? { ...r, status: decision } : r
    );
    return Promise.resolve();
  }

  const ref = doc(db, 'partnerUpdateRequests', requestId);
  await updateDoc(ref, {
    status: decision,
    decidedAt: serverTimestamp(),
    decidedBy: adminEmail,
  });

  // If approved and request has target partner + new data, apply updates to the partner doc
  if (decision === 'approved' && requestData?.partnerId && requestData?.newData) {
    try {
      const { ref: partnerRef } = await getPartnerDocRef(requestData.partnerId);
      await updateDoc(partnerRef, {
        ...requestData.newData,
        updatedAt: serverTimestamp(),
        lastUpdateAppliedAt: serverTimestamp(),
      });
      await addAdminNote(
        requestData.partnerId,
        'update_request_approved',
        `Approved ${requestData.type || 'profile'} update request.`,
        adminEmail
      );
    } catch (err) {
      console.warn('[partnerService] Error applying update request to partner doc:', err.message);
    }
  } else if (decision === 'rejected' && requestData?.partnerId) {
    await addAdminNote(
      requestData.partnerId,
      'update_request_rejected',
      `Rejected ${requestData.type || 'profile'} update request.`,
      adminEmail
    );
  }
}
