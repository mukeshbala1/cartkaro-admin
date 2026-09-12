// src/firebase/partnerService.js
//
// All Firestore reads/writes for the Partner Hub module live here.
//
// DATA SCHEMA NOTE
// ─────────────────
// The Partner app writes business registrations to the "registration_drafts"
// collection using a flat schema (restaurantName, ownerName, lat, lng, etc.).
// This service normalises that flat schema into the nested shape that the
// admin UI components expect (businessDetails, ownerDetails, legalDocuments, …).
//
// The "partners" collection stores delivery-rider profiles (fullName, kycStatus,
// vehicleDetails, …) which belong to a different module, not handled here.
//
// COLLECTION:  registration_drafts
// DOC ID FORMAT:  {uid}_{businessType}   e.g. "abc123_restaurant"

import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseConfig';
import { mockPartners, mockUpdateRequests } from '../data/mockPartners';

// ---------------------------------------------------------------------------
// Schema normaliser — flat registration_drafts → nested admin UI shape
// ---------------------------------------------------------------------------
function detectBusinessType(raw) {
  if (raw.restaurantName) return 'restaurant';
  if (raw.pharmacyName || raw.drugLicenseNumber) return 'medical';
  return 'grocery';
}

function normaliseDraft(raw, docId) {
  const businessType = raw.businessType || detectBusinessType(raw);

  // Business name — field name varies by type in the partner app
  const businessName =
    raw.businessName ||
    raw.restaurantName ||
    raw.pharmacyName ||
    raw.groceryName ||
    raw.storeName ||
    '';

  return {
    // ── Identity ────────────────────────────────────────────────────────
    id: docId,
    uid: raw.uid || raw.ownerUid || docId.split('_')[0],

    // ── Status fields (admin writes these, partner app reads them) ──────
    verificationStatus: raw.verificationStatus || 'pending',
    isActive: raw.isActive || false,
    canEditApplication: raw.canEditApplication ?? false,
    rejectReason: raw.rejectReason || '',
    verificationFeedback: raw.verificationFeedback || null,

    // ── Timestamps ──────────────────────────────────────────────────────
    createdAt: raw.createdAt || raw.submittedAt || null,
    reviewedAt: raw.reviewedAt || null,

    // ── Owner Details ───────────────────────────────────────────────────
    ownerDetails: {
      ownerName: raw.ownerName || '',
      mobile: raw.mobile || raw.mobileNumber || raw.phone || '',
      altMobile: raw.altMobile || '',
      altCountryCode: raw.altCountryCode || '+91',
      email: raw.email || '',
    },

    // ── Business Details ────────────────────────────────────────────────
    businessDetails: {
      businessType,
      businessName,
      address: raw.restaurantAddress || raw.address || raw.businessAddress || '',
      area: raw.area || '',
      city: raw.city || '',
      state: raw.state || '',
      pinCode: raw.pincode || raw.pinCode || '',
      latitude: parseFloat(raw.lat || raw.latitude) || null,
      longitude: parseFloat(raw.lng || raw.longitude) || null,
      logo:
        raw.restaurantLogoPath ||
        raw.logoPath ||
        raw.businessLogo ||
        raw.logo ||
        '',
      banner:
        raw.restaurantBannerPath ||
        raw.bannerPath ||
        raw.businessBanner ||
        raw.banner ||
        '',
      businessPhotos: raw.restaurantPhotos || raw.businessPhotos || [],
      gstin: raw.gstNumber || '',
    },

    // ── Categories ──────────────────────────────────────────────────────
    categories: raw.selectedCategories || raw.categories || [],

    // ── Business Timings ─────────────────────────────────────────────────
    businessTiming: {
      openingTime: raw.openingTime || '',
      closingTime: raw.closingTime || '',
      workingDays: raw.workingDays || [],
      acceptOnlineOrders: raw.acceptOnlineOrders ?? false,
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
      fssaiNumber: raw.fssaiNumber || '',
      fssaiCertUrl: raw.fssaiCertUrl || raw.fssaiCertPath || '',
      // GST
      gstNumber: raw.gstNumber || '',
      gstCertUrl: raw.gstCertUrl || raw.gstCertPath || '',
      // Trade License
      tradeLicenseNumber: raw.tradeLicense || raw.tradeLicenseNumber || '',
      tradeLicenseUrl: raw.tradeLicenseUrl || raw.tradeLicensePath || '',
      // PAN
      panNumber: raw.pan || raw.panNumber || '',
      panCardUrl: raw.panCardUrl || raw.panDocPath || '',
      // Aadhaar
      aadhaarNumber: raw.aadhaar || raw.aadhaarNumber || '',
      aadhaarCardUrl: raw.aadhaarCardUrl || raw.aadhaarDocPath || '',
      // Drug license (medical)
      drugLicenseNumber: raw.drugLicenseNumber || '',
      drugLicenseUrl: raw.drugLicenseUrl || raw.drugLicensePath || '',
      // Pharmacist cert (medical)
      pharmacistRegNumber: raw.pharmacistRegNumber || '',
      pharmacistCertUrl: raw.pharmacistCertUrl || raw.pharmacistCertPath || '',
      // Review statuses set by admin
      reviewStatus: raw.documentReviewStatus || raw.legalDocuments?.reviewStatus || {},
    },

    // ── Bank Details ─────────────────────────────────────────────────────
    bankDetails: {
      accountHolderName: raw.accountHolder || raw.accountHolderName || '',
      bankName: raw.selectedBank || raw.bankName || '',
      accountNumber: raw.accountNumber || '',
      ifscCode: raw.ifsc || raw.ifscCode || '',
      upiId: raw.upi || raw.upiId || '',
      cancelledChequeUrl: raw.cancelledChequeUrl || raw.cancelledChequePath || '',
      verified: raw.bankDetails?.verified ?? raw.bankVerified ?? false,
    },

    // ── Delivery Settings ────────────────────────────────────────────────
    deliverySettings: {
      provider: raw.deliveryOption || raw.provider || 'cartkaro',
      // restaurant
      preparationTime: raw.preparationTime || '',
      costForTwo: raw.costForTwo || '',
      packagingCharge: raw.packagingCharge || '',
      // grocery
      minimumOrderAmount: raw.minimumOrderAmount || '',
      estimatedDeliveryTime: raw.estimatedDeliveryTime || '',
      // medical
      prescriptionRequired: raw.prescriptionRequired ?? false,
      sameDayDelivery: raw.sameDayDelivery ?? false,
      emergencyDelivery: raw.emergencyDelivery ?? false,
    },

    // ── Agreement ────────────────────────────────────────────────────────
    agreement: {
      accepted: raw.agreementAccepted ?? raw.agreement?.accepted ?? false,
      acceptedAt: raw.agreementAcceptedAt || raw.agreement?.acceptedAt || null,
    },

    // Keep raw data accessible for debugging
    _raw: raw,
  };
}

// ---------------------------------------------------------------------------
// Inverse normaliser — write admin decisions back to the flat doc shape
// ---------------------------------------------------------------------------
function buildAdminUpdate(fields) {
  // The registration_drafts doc stores admin fields at root level
  return fields;
}

// ---------------------------------------------------------------------------
// In-memory fallback (demo mode)
// ---------------------------------------------------------------------------
let demoPartners = mockPartners.map((p) => ({ ...p }));
let demoUpdateRequests = mockUpdateRequests.map((r) => ({ ...r }));

// ---------------------------------------------------------------------------
// ONE-TIME READS
// ---------------------------------------------------------------------------

export async function fetchPartners() {
  if (!isFirebaseConfigured) {
    return Promise.resolve(demoPartners);
  }
  try {
    const snap = await getDocs(
      query(collection(db, 'registration_drafts'), orderBy('createdAt', 'desc'))
    );
    if (!snap.empty) {
      return snap.docs.map((d) => normaliseDraft(d.data(), d.id));
    }
    // Fallback: try without orderBy (no createdAt index required)
    const snap2 = await getDocs(collection(db, 'registration_drafts'));
    return snap2.docs.map((d) => normaliseDraft(d.data(), d.id));
  } catch (e) {
    console.warn('[partnerService] fetchPartners error — trying without orderBy:', e.message);
    const snap = await getDocs(collection(db, 'registration_drafts'));
    return snap.docs.map((d) => normaliseDraft(d.data(), d.id));
  }
}

export async function fetchPartnerById(partnerId) {
  if (!isFirebaseConfigured) {
    return Promise.resolve(demoPartners.find((p) => p.id === partnerId) || null);
  }
  const ref = doc(db, 'registration_drafts', partnerId);
  const snap = await getDoc(ref);
  return snap.exists() ? normaliseDraft(snap.data(), snap.id) : null;
}

// ---------------------------------------------------------------------------
// REAL-TIME LISTENERS (onSnapshot)
// ---------------------------------------------------------------------------

export function subscribeToPartners(callback) {
  if (!isFirebaseConfigured) {
    callback(demoPartners);
    return () => {};
  }

  // Try with orderBy first; if it fails (missing index), fall back to unordered.
  let unsubscribed = false;
  let unsub = () => {};

  const tryOrdered = () => {
    const q = query(collection(db, 'registration_drafts'), orderBy('createdAt', 'desc'));
    unsub = onSnapshot(
      q,
      (snap) => {
        callback(snap.docs.map((d) => normaliseDraft(d.data(), d.id)));
      },
      (err) => {
        console.warn('[partnerService] ordered snapshot failed, falling back:', err.message);
        if (!unsubscribed) tryUnordered();
      }
    );
  };

  const tryUnordered = () => {
    unsub = onSnapshot(
      collection(db, 'registration_drafts'),
      (snap) => {
        const items = snap.docs.map((d) => normaliseDraft(d.data(), d.id));
        // Sort by createdAt client-side
        items.sort((a, b) => {
          const ta = a.createdAt?._seconds || a.createdAt?.seconds || 0;
          const tb = b.createdAt?._seconds || b.createdAt?.seconds || 0;
          return tb - ta;
        });
        callback(items);
      },
      (err) => {
        console.error('[partnerService] unordered snapshot error:', err);
      }
    );
  };

  tryOrdered();

  return () => {
    unsubscribed = true;
    unsub();
  };
}

export function subscribeToPartner(partnerId, callback) {
  if (!isFirebaseConfigured) {
    const partner = demoPartners.find((p) => p.id === partnerId) || null;
    callback(partner);
    return () => {};
  }
  const ref = doc(db, 'registration_drafts', partnerId);
  return onSnapshot(
    ref,
    (snap) => {
      callback(snap.exists() ? normaliseDraft(snap.data(), snap.id) : null);
    },
    (err) => {
      console.error('[partnerService] subscribeToPartner error:', err);
      callback(null);
    }
  );
}

// ---------------------------------------------------------------------------
// ADMIN ACTIONS — write decisions back to registration_drafts doc
// ---------------------------------------------------------------------------

export async function approvePartner(partnerId, reviewedBy = '') {
  const update = {
    verificationStatus: 'approved',
    isActive: true,
    canEditApplication: false,
    verificationFeedback: {
      status: 'approved',
      reason: '',
      actionRequired: false,
      action: null,
      reviewedBy,
    },
  };
  if (!isFirebaseConfigured) {
    demoPartners = demoPartners.map((p) =>
      p.id === partnerId ? { ...p, ...update } : p
    );
    return Promise.resolve();
  }
  const ref = doc(db, 'registration_drafts', partnerId);
  return updateDoc(ref, {
    ...update,
    'verificationFeedback.updatedAt': serverTimestamp(),
    reviewedAt: serverTimestamp(),
  });
}

export async function setPartnerVerification(partnerId, status, reason, reviewedBy = '') {
  if (!['pending', 'rejected'].includes(status)) {
    throw new Error('Unsupported verification status.');
  }
  const cleanReason = reason.trim();
  if (!cleanReason) {
    throw new Error('A reason is required before returning or rejecting an application.');
  }

  const update = {
    verificationStatus: status,
    isActive: false,
    canEditApplication: true,
    rejectReason: status === 'rejected' ? cleanReason : '',
    verificationFeedback: {
      status,
      reason: cleanReason,
      actionRequired: true,
      action: 'edit_and_resubmit',
      reviewedBy,
    },
  };
  if (!isFirebaseConfigured) {
    demoPartners = demoPartners.map((p) =>
      p.id === partnerId ? { ...p, ...update } : p
    );
    return Promise.resolve();
  }
  const ref = doc(db, 'registration_drafts', partnerId);
  return updateDoc(ref, {
    ...update,
    'verificationFeedback.updatedAt': serverTimestamp(),
    reviewedAt: serverTimestamp(),
  });
}

export function rejectPartner(partnerId, rejectReason, reviewedBy) {
  return setPartnerVerification(partnerId, 'rejected', rejectReason, reviewedBy);
}

export function returnPartnerForChanges(partnerId, reason, reviewedBy) {
  return setPartnerVerification(partnerId, 'pending', reason, reviewedBy);
}

// ---------------------------------------------------------------------------
// DOCUMENT & BANK VERIFICATION
// ---------------------------------------------------------------------------

export async function setDocumentReviewStatus(partnerId, docKey, status) {
  if (!isFirebaseConfigured) {
    demoPartners = demoPartners.map((p) => {
      if (p.id !== partnerId) return p;
      const reviewStatus = { ...(p.legalDocuments?.reviewStatus || {}), [docKey]: status };
      return { ...p, legalDocuments: { ...p.legalDocuments, reviewStatus } };
    });
    return Promise.resolve();
  }
  const ref = doc(db, 'registration_drafts', partnerId);
  // Read current reviewStatus from Firestore to merge
  const snap = await getDoc(ref);
  const existing = snap.data()?.documentReviewStatus || {};
  return updateDoc(ref, {
    documentReviewStatus: { ...existing, [docKey]: status },
  });
}

export async function verifyBankDetails(partnerId) {
  if (!isFirebaseConfigured) {
    demoPartners = demoPartners.map((p) =>
      p.id === partnerId
        ? { ...p, bankDetails: { ...p.bankDetails, verified: true } }
        : p
    );
    return Promise.resolve();
  }
  const ref = doc(db, 'registration_drafts', partnerId);
  return updateDoc(ref, { bankVerified: true });
}

// ---------------------------------------------------------------------------
// ADMIN ACTIVITY LOG
// ---------------------------------------------------------------------------

export async function addAdminNote(partnerId, action, note, adminEmail) {
  if (!isFirebaseConfigured) return Promise.resolve();
  const notesCol = collection(db, 'registration_drafts', partnerId, 'adminActivity');
  return addDoc(notesCol, {
    action,
    note,
    adminEmail,
    createdAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// UPDATE REQUESTS (unchanged)
// ---------------------------------------------------------------------------

export async function fetchUpdateRequests() {
  if (!isFirebaseConfigured) {
    return Promise.resolve(demoUpdateRequests);
  }
  try {
    const snap = await getDocs(
      query(collection(db, 'partnerUpdateRequests'), orderBy('requestedAt', 'desc'))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    const snap = await getDocs(collection(db, 'partnerUpdateRequests'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}

export async function decideUpdateRequest(requestId, decision) {
  if (!isFirebaseConfigured) {
    demoUpdateRequests = demoUpdateRequests.map((r) =>
      r.id === requestId ? { ...r, status: decision } : r
    );
    return Promise.resolve();
  }
  const ref = doc(db, 'partnerUpdateRequests', requestId);
  return updateDoc(ref, { status: decision });
}
