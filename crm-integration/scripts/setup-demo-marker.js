/**
 * One-time setup: adds an `is_demo` checkbox attribute (title "Demo Data")
 * to the Companies and Deals objects in Attio so demo records are
 * filterable directly from the deal pipeline view and the companies list,
 * not just via the person's lead_source.
 *
 * Idempotent — safe to re-run.
 *
 * Usage:
 *   ATTIO_API_KEY=$(grep ATTIO_API_KEY .dev.vars | cut -d= -f2) \
 *     node crm-integration/scripts/setup-demo-marker.js
 */

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

const TARGETS = ['companies', 'deals'];

async function existingSlugs(objectSlug) {
  const res = await fetch(`${BASE_URL}/objects/${objectSlug}/attributes`, { headers });
  if (!res.ok) throw new Error(`List ${objectSlug} attrs failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return new Set(data.data.map((a) => a.api_slug));
}

async function createCheckbox(objectSlug) {
  const res = await fetch(`${BASE_URL}/objects/${objectSlug}/attributes`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      data: {
        api_slug: 'is_demo',
        title: 'Demo Data',
        type: 'checkbox',
        description: 'Marks records created by the demo seed script. Filter to bulk-clean.',
        is_required: false,
        is_unique: false,
        is_multiselect: false,
        config: {},
      },
    }),
  });
  if (!res.ok) throw new Error(`Create is_demo on ${objectSlug} failed: ${res.status} ${await res.text()}`);
}

async function main() {
  for (const obj of TARGETS) {
    const slugs = await existingSlugs(obj);
    if (slugs.has('is_demo')) {
      console.log(`  ✓ ${obj}.is_demo already exists — skipping`);
    } else {
      await createCheckbox(obj);
      console.log(`  + ${obj}.is_demo created`);
    }
  }
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('\nError:', err.message);
  process.exit(1);
});
