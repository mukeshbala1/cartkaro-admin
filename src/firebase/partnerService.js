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
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseConfig';
import { mockPartners, mockUpdateRequests } from '../data/mockPartners';

// ---------------------------------------------------------------------------
// Schema normaliser — flat registration_drafts → nested admin UI shape
// ---------------------------------------------------------------------------
function detectBusinessType(raw, docId = '') {
  if (raw.businessType) return raw.businessType.toLowerCase();
  if (raw.restaurantName || (docId && docId.endsWith('_restaurant'))) return 'restaurant';
  if (raw.pharmacyName || raw.drugLicenseNumber || (docId && docId.endsWith('_medical'))) return 'medical';
  if (raw.groceryName || raw.storeName || (docId && docId.endsWith('_grocery'))) return 'grocery';
  return 'grocery';
}

function normaliseDraft(raw, docId = '') {
  const businessType = detectBusinessType(raw, docId);
  const typeLabel = businessType.charAt(0).toUpperCase() + businessType.slice(1);

  // Business name — field name varies by type in the partner app
  const rawName =
    raw.businessName ||
    raw.restaurantName ||
    raw.pharmacyName ||
    raw.groceryName ||
    raw.storeName ||
    '';

  const businessName = rawName.trim() || (raw.ownerName ? `${raw.ownerName.trim()}'s ${typeLabel}` : `${typeLabel} Partner`);

  // Handle categories whether array or Firestore map {0: '...', 1: '...'}
  let categories = [];
  if (Array.isArray(raw.selectedCategories)) {
    categories = raw.selectedCategories;
  } else if (raw.selectedCategories && typeof raw.selectedCategories === 'object') {
    categories = Object.values(raw.selectedCategories);
  } else if (Array.isArray(raw.categories)) {
    categories = raw.categories;
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
  const rawPhotos = raw.restaurantPhotos || raw.storePhotos || raw.businessPhotos || [];
  if (Array.isArray(rawPhotos)) {
    businessPhotos = rawPhotos.filter(Boolean);
  } else if (rawPhotos && typeof rawPhotos === 'object') {
    businessPhotos = Object.values(rawPhotos).filter(Boolean);
  }

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
    createdAt: raw.createdAt || raw.submittedAt || raw.updatedAt || null,
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
      address: raw.restaurantAddress || raw.storeAddress || raw.address || raw.businessAddress || '',
      area: raw.area || '',
      city: raw.city || '',
      state: raw.state || '',
      pinCode: raw.pincode || raw.pinCode || '',
      latitude: parseFloat(raw.lat || raw.latitude) || null,
      longitude: parseFloat(raw.lng || raw.longitude) || null,
      logo:
        raw.restaurantLogoPath ||
        raw.storeLogoPath ||
        raw.logoPath ||
        raw.businessLogo ||
        raw.logo ||
        '',
      banner:
        raw.restaurantBannerPath ||
        raw.storeBannerPath ||
        raw.bannerPath ||
        raw.businessBanner ||
        raw.banner ||
        '',
      businessPhotos,
      gstin: raw.gstNumber || raw.gstin || '',
    },

    // ── Categories ──────────────────────────────────────────────────────
    categories,

    // ── Business Timings ─────────────────────────────────────────────────
    businessTiming: {
      openingTime: raw.openingTime || '',
      closingTime: raw.closingTime || '',
      workingDays,
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
      estimatedDeliveryTime: raw.estimatedDeliveryTime || raw.estDelivery || '',
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
// ONE-TIME READS
// ---------------------------------------------------------------------------

export async function fetchPartners() {
  if (!isFirebaseConfigured || !db) {
    return Promise.resolve(demoPartners);
  }
  try {
    const snap = await getDocs(collection(db, 'registration_drafts'));
    const items = snap.docs.map((d) => normaliseDraft(d.data(), d.id));
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
  const ref = doc(db, 'registration_drafts', partnerId);
  const snap = await getDoc(ref);
  return snap.exists() ? normaliseDraft(snap.data(), snap.id) : null;
}

// ---------------------------------------------------------------------------
// REAL-TIME LISTENERS (onSnapshot)
// ---------------------------------------------------------------------------

export function subscribeToPartners(callback) {
  if (!isFirebaseConfigured || !db) {
    callback(demoPartners);
    return () => {};
  }

  const colRef = collection(db, 'registration_drafts');
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => normaliseDraft(d.data(), d.id));
      items.sort((a, b) => extractDocTime(b) - extractDocTime(a));
      callback(items);
    },
    (err) => {
      console.error('[partnerService] subscribeToPartners error:', err);
      callback([]);
    }
  );
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

/**
 * Direct Partner Profile Editing (Super Admin / Admin Override)
 */
export async function updatePartnerDetails(partnerId, fields, adminEmail = '') {
  const docFields = {
    businessName: fields.businessName || '',
    restaurantName: fields.businessName || '',
    storeName: fields.businessName || '',
    groceryName: fields.businessName || '',
    medicalName: fields.businessName || '',
    ownerName: fields.ownerName || '',
    mobile: fields.mobile || '',
    mobileNumber: fields.mobile || '',
    phone: fields.mobile || '',
    altMobile: fields.altMobile || '',
    email: fields.email || '',
    address: fields.address || '',
    restaurantAddress: fields.address || '',
    businessAddress: fields.address || '',
    city: fields.city || '',
    state: fields.state || '',
    pincode: fields.pinCode || fields.pincode || '',
    pinCode: fields.pinCode || fields.pincode || '',
    gstNumber: fields.gstin || fields.gstNumber || '',
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

  if (!isFirebaseConfigured) {
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

  const ref = doc(db, 'registration_drafts', partnerId);
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
  if (!isFirebaseConfigured) {
    demoPartners = demoPartners.map((p) => {
      if (p.id !== partnerId) return p;
      const reviewStatus = { ...(p.legalDocuments?.reviewStatus || {}), [docKey]: status };
      return { ...p, legalDocuments: { ...p.legalDocuments, reviewStatus } };
    });
    return Promise.resolve();
  }
  const ref = doc(db, 'registration_drafts', partnerId);
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

export function subscribeToAdminNotes(partnerId, callback) {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  const notesCol = collection(db, 'registration_drafts', partnerId, 'adminActivity');
  return onSnapshot(
    notesCol,
    (snap) => {
      const notes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      notes.sort((a, b) => {
        const ta = a.createdAt?.seconds || 0;
        const tb = b.createdAt?.seconds || 0;
        return tb - ta;
      });
      callback(notes);
    },
    (err) => {
      console.warn('[partnerService] subscribeToAdminNotes error:', err.message);
      callback([]);
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
  if (!isFirebaseConfigured) {
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
      const partnerRef = doc(db, 'registration_drafts', requestData.partnerId);
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

