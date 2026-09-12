// Deep-dive diagnostic — show full document data for registration_drafts
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, '../service-account.json'), 'utf8'));

initializeApp({ credential: cert(sa) });
const db = getFirestore();

async function deepDive(colName) {
  console.log(`\n====== Collection: "${colName}" ======\n`);
  const snap = await db.collection(colName).get();
  if (snap.empty) { console.log('  (empty)'); return; }
  for (const doc of snap.docs) {
    console.log(`\n--- Doc ID: ${doc.id} ---`);
    console.log(JSON.stringify(doc.data(), null, 2));
  }
}

async function main() {
  await deepDive('registration_drafts');
  await deepDive('partners');
}

main().catch(console.error);
