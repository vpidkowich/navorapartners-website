/**
 * Deletes every Attio record created by the seed-demo-* scripts.
 *
 * Sources of truth (in order of precedence):
 *   1. .demo-data-ids.json — exact record IDs we created
 *   2. (optional) `--full-sweep` flag — also queries Attio for any
 *      records that have is_demo = true (companies/deals) or
 *      lead_source = "Demo Data" (people) but aren't in the IDs file.
 *      Use this if the IDs file got out of sync.
 *
 * Order matters: deals first, then people, then companies. Deleting a
 * company that's still linked to people/deals would fail or orphan.
 *
 * Usage:
 *   ATTIO_API_KEY=$(grep ATTIO_API_KEY .dev.vars | cut -d= -f2) \
 *     node crm-integration/scripts/cleanup-demo-data.js
 *
 *   ATTIO_API_KEY=$(grep ATTIO_API_KEY .dev.vars | cut -d= -f2) \
 *     node crm-integration/scripts/cleanup-demo-data.js --full-sweep
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ATTIO_API_KEY;
if (!API_KEY) {
  console.error('Missing ATTIO_API_KEY environment variable.');
  process.exit(1);
}

const BASE_URL = 'https://api.attio.com/v2';
const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

const IDS_FILE = path.join(__dirname, '.demo-data-ids.json');
const FULL_SWEEP = process.argv.includes('--full-sweep');

function loadIds() {
  if (!fs.existsSync(IDS_FILE)) return { companies: [], people: [], deals: [] };
  return JSON.parse(fs.readFileSync(IDS_FILE, 'utf8'));
}

function saveIds(ids) {
  fs.writeFileSync(IDS_FILE, JSON.stringify(ids, null, 2));
}

async function deleteRecord(objectSlug, recordId) {
  const res = await fetch(`${BASE_URL}/objects/${objectSlug}/records/${recordId}`, {
    method: 'DELETE',
    headers,
  });
  if (res.status === 404) return 'missing';
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return 'deleted';
}

async function queryDemoRecords(objectSlug, filter) {
  // Attio query API with filter — paginated
  const all = [];
  let offset = 0;
  const limit = 500;
  while (true) {
    const res = await fetch(`${BASE_URL}/objects/${objectSlug}/records/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ filter, limit, offset }),
    });
    if (!res.ok) throw new Error(`Query ${objectSlug} failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const batch = data.data || [];
    all.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return all.map((r) => r.id?.record_id).filter(Boolean);
}

async function main() {
  const ids = loadIds();

  let dealIds = [...ids.deals];
  let personIds = [...ids.people];
  let companyIds = [...ids.companies];

  if (FULL_SWEEP) {
    console.log('Full sweep enabled — querying Attio for tagged records…');
    const sweptDeals = await queryDemoRecords('deals', { is_demo: true });
    const sweptCompanies = await queryDemoRecords('companies', { is_demo: true });
    const sweptPeople = await queryDemoRecords('people', { lead_source: 'Demo Data' });
    dealIds = Array.from(new Set([...dealIds, ...sweptDeals]));
    personIds = Array.from(new Set([...personIds, ...sweptPeople]));
    companyIds = Array.from(new Set([...companyIds, ...sweptCompanies]));
    console.log(`  Swept: ${sweptDeals.length} deals, ${sweptPeople.length} people, ${sweptCompanies.length} companies\n`);
  }

  console.log(`Deleting ${dealIds.length} deals, ${personIds.length} people, ${companyIds.length} companies…\n`);

  let deleted = 0;
  let missing = 0;
  let failed = 0;

  // Order matters: deals → people → companies
  const phases = [
    { label: 'deals', slug: 'deals', list: dealIds },
    { label: 'people', slug: 'people', list: personIds },
    { label: 'companies', slug: 'companies', list: companyIds },
  ];

  for (const phase of phases) {
    console.log(`--- ${phase.label} ---`);
    for (const id of phase.list) {
      try {
        const result = await deleteRecord(phase.slug, id);
        if (result === 'deleted') {
          deleted++;
          console.log(`  ✓ ${phase.slug}/${id}`);
        } else {
          missing++;
          console.log(`  · ${phase.slug}/${id} (already gone)`);
        }
      } catch (err) {
        failed++;
        console.error(`  ✗ ${phase.slug}/${id} — ${err.message}`);
      }
    }
  }

  // Reset the IDs file (only what we successfully deleted is gone)
  if (failed === 0) {
    saveIds({ companies: [], people: [], deals: [] });
    console.log(`\nReset ${IDS_FILE} (all clean).`);
  } else {
    console.log(`\n${IDS_FILE} left intact — ${failed} deletes failed; re-run to retry.`);
  }

  console.log(`\nDone. Deleted ${deleted}, already missing ${missing}, failed ${failed}.`);
}

main().catch((err) => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
