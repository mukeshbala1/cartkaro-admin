import { collection, getDocs, orderBy, query, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseConfig';

const demoOrders = [
  { id: 'CK-10482', customerName: 'Priya Nair', customerPhone: '9876543210', partnerName: 'Kannan Fresh Mart', total: 684, orderStatus: 'delivered', returnStatus: 'requested', returnReason: 'Damaged item received', createdAt: '2026-09-06T08:25:00Z' },
  { id: 'CK-10481', customerName: 'Arjun Kumar', customerPhone: '9123456780', partnerName: 'Beevi Biryani House', total: 429, orderStatus: 'out_for_delivery', returnStatus: 'none', createdAt: '2026-09-06T08:05:00Z' },
  { id: 'CK-10480', customerName: 'Meera Shah', customerPhone: '9012345678', partnerName: 'Pillai Pharmacy', total: 1150, orderStatus: 'delivered', returnStatus: 'approved', returnReason: 'Wrong product delivered', createdAt: '2026-09-06T07:44:00Z' },
];

export async function fetchOrders() {
  if (!isFirebaseConfigured) return demoOrders;
  const snapshot = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function decideReturn(orderId, decision, processedBy) {
  if (!isFirebaseConfigured) {
    const order = demoOrders.find((item) => item.id === orderId);
    if (order) order.returnStatus = decision;
    return;
  }
  return updateDoc(doc(db, 'orders', orderId), {
    returnStatus: decision,
    returnProcessedAt: serverTimestamp(),
    returnProcessedBy: processedBy,
  });
}
