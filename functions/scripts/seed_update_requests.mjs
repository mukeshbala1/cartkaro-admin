// functions/scripts/seed_update_requests.mjs
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, '../service-account.json'), 'utf8'));

initializeApp({ credential: cert(sa) });
const db = getFirestore();

async function seed() {
  console.log('Seeding sample update requests into Firestore...');
  const requests = [
    {
      id: 'UR-101',
      partnerId: 'TQSKxVwF3kPW3IrKPEYM7bLUckJ2_restaurant',
      partnerName: 'mirch masala',
      type: 'Bank Account Change',
      status: 'pending',
      requestedAt: FieldValue.serverTimestamp(),
      oldData: {
        bankName: 'State Bank of India',
        accountNumber: '123456789',
        ifscCode: 'GBNR0001548',
        accountHolderName: 'hckyfiydy',
      },
      newData: {
        bankName: 'HDFC Bank',
        accountNumber: '50100987654321',
        ifscCode: 'HDFC0001234',
        accountHolderName: 'Mukesh Bala',
      },
    },
    {
      id: 'UR-102',
      partnerId: 'TQSKxVwF3kPW3IrKPEYM7bLUckJ2_restaurant',
      partnerName: 'mirch masala',
      type: 'Business Address Change',
      status: 'pending',
      requestedAt: FieldValue.serverTimestamp(),
      oldData: {
        address: 'Baharagora, East Singhbhum, Jharkhand, 832101',
        mobile: '+91 1234556677',
      },
      newData: {
        address: 'Main Market Road, Near Gandhi Chowk, Baharagora, Jharkhand, 832101',
        mobile: '+91 9876543210',
      },
    },
  ];

  for (const r of requests) {
    await db.collection('partnerUpdateRequests').doc(r.id).set(r);
    console.log(`✓ Created test update request: ${r.id} (${r.type})`);
  }
  console.log('Seeding completed successfully.');
}

seed().catch(console.error);
