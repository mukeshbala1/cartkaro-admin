// Quick Firestore diagnostics — lists all top-level collections and docs
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, '../service-account.json'), 'utf8'));

initializeApp({ credential: cert(sa) });
const db = getFirestore();

async function main() {
  console.log('\n=== Firestore Collection Discovery ===\n');

  // List all root-level collections
  const collections = await db.listCollections();
  console.log('Root collections found:', collections.map(c => c.id));

  // For each collection, show the first 5 docs with field names
  for (const colRef of collections) {
    console.log(`\n--- Collection: "${colRef.id}" ---`);
    const snap = await colRef.limit(5).get();
    if (snap.empty) {
      console.log('  (empty)');
      continue;
    }
    for (const doc of snap.docs) {
      const data = doc.data();
      console.log(`\n  Doc ID: ${doc.id}`);
      console.log('  Top-level fields:', Object.keys(data));
      // Show sub-objects
      for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === 'object' && !v._seconds) {
          console.log(`    ${k}: { ${Object.keys(v).join(', ')} }`);
        } else {
          const display = v?._seconds ? `Timestamp(${new Date(v._seconds * 1000).toISOString()})` : String(v).slice(0, 80);
          console.log(`    ${k}: ${display}`);
        }
      }
    }
  }

  console.log('\n=== Done ===\n');
}

main().catch(console.error);
