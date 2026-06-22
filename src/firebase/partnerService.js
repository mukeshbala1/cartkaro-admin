// src/firebase/partnerService.js
//
// All Firestore reads/writes for the Partner Hub module live here.
// If Firebase isn't configured yet (no .env values), every function
// falls back to the in-memory mock dataset so the UI keeps working.

import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseConfig';
import { mockPartners, mockUpdateRequests } from '../data/mockPartners';

// Simple in-memory mutation layer so demo mode "feels" live during a session.
let demoPartners = mockPartners.map((p) => ({ ...p }));
let demoUpdateRequests = mockUpdateRequests.map((r) => ({ ...r }));

export async function fetchPartners() {
  if (!isFirebaseConfigured) {
    return Promise.resolve(demoPartners);
  }
  const snap = await getDocs(
    query(collection(db, 'partners'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchPartnerById(partnerId) {
  if (!isFirebaseConfigured) {
    return Promise.resolve(demoPartners.find((p) => p.id === partnerId) || null);
  }
  const ref = doc(db, 'partners', partnerId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function approvePartner(partnerId) {
  if (!isFirebaseConfigured) {
    demoPartners = demoPartners.map((p) =>
      p.id === partnerId ? { ...p, verificationStatus: 'approved', isActive: true } : p
    );
    return Promise.resolve();
  }
  const ref = doc(db, 'partners', partnerId);
  return updateDoc(ref, { verificationStatus: 'approved', isActive: true });
}

export async function rejectPartner(partnerId, rejectReason) {
  if (!isFirebaseConfigured) {
    demoPartners = demoPartners.map((p) =>
      p.id === partnerId
        ? { ...p, verificationStatus: 'rejected', isActive: false, rejectReason }
        : p
    );
    return Promise.resolve();
  }
  const ref = doc(db, 'partners', partnerId);
  return updateDoc(ref, { verificationStatus: 'rejected', isActive: false, rejectReason });
}

export async function setDocumentReviewStatus(partnerId, docKey, status) {
  if (!isFirebaseConfigured) {
    demoPartners = demoPartners.map((p) => {
      if (p.id !== partnerId) return p;
      const reviewStatus = { ...(p.legalDocuments?.reviewStatus || {}), [docKey]: status };
      return { ...p, legalDocuments: { ...p.legalDocuments, reviewStatus } };
    });
    return Promise.resolve();
  }
  const ref = doc(db, 'partners', partnerId);
  const partner = await fetchPartnerById(partnerId);
  const reviewStatus = { ...(partner?.legalDocuments?.reviewStatus || {}), [docKey]: status };
  return updateDoc(ref, { 'legalDocuments.reviewStatus': reviewStatus });
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
  const ref = doc(db, 'partners', partnerId);
  return updateDoc(ref, { 'bankDetails.verified': true });
}

export async function fetchUpdateRequests() {
  if (!isFirebaseConfigured) {
    return Promise.resolve(demoUpdateRequests);
  }
  const snap = await getDocs(
    query(collection(db, 'partnerUpdateRequests'), orderBy('requestedAt', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
