/**
 * Setup script: creates custom attributes on the Deals object in Attio.
 *
 * Usage:
 *   ATTIO_API_KEY=your_key node crm-integration/scripts/setup-attio-deal-attributes.js
 *
 * Currently creates:
 *   - stale_alert_sent_at (timestamp): used by the stale-deal-checker worker to
 *     dedupe alerts. When the worker fires an alert for a deal, it stamps this
 *     attribute with the current timestamp so subsequent runs (within the
 *     cooldown window) skip the deal.
 *
 * Idempotent — safe to run multiple times.
 */

const API_KEY = process.env.ATTIO_API_KEY;
if (!API_KEY) {
  console.error('Missing ATTIO_API_KEY environment variable.');
  console.error('Usage: ATTIO_API_KEY=your_key node crm-integration/scripts/setup-attio-deal-attributes.js');
  process.exit(1);
}

const BASE_URL = 'https://api.attio.com/v2';
const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

const DEAL_ATTRIBUTES = [
  {
    api_slug: 'stale_alert_sent_at',
    title: 'Stale Alert Sent At',
    type: 'timestamp',
    description: 'Set by the stale-deal-checker worker when it last alerted on this deal. Used to dedupe alerts within the cooldown window.',
  },
];

async function getExistingAttributes(objectSlug) {
  const res = await fetch(`${BASE_URL}/objects/${objectSlug}/attributes`, { headers });
  if (!res.ok) {
    throw new Error(`Failed to list attributes for ${objectSlug}: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return new Set(data.data.map((attr) => attr.api_slug));
}

async function createAttribute(objectSlug, attr) {
  const body = {
    api_slug: attr.api_slug,
    title: attr.title,
    type: attr.type,
    description: attr.description || '',
    is_required: false,
    is_unique: false,
    is_multiselect: false,
    config: {},
  };

  const res = await fetch(`${BASE_URL}/objects/${objectSlug}/attributes`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data: body }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create attribute "${attr.api_slug}" on ${objectSlug}: ${res.status} ${text}`);
  }
  return res.json();
}

async function main() {
  console.log('Fetching existing Deal attributes...');
  const existing = await getExistingAttributes('deals');
  console.log(`Found ${existing.size} existing attributes.\n`);

  for (const attr of DEAL_ATTRIBUTES) {
    if (existing.has(attr.api_slug)) {
      console.log(`  ✓ "${attr.api_slug}" already exists — skipping`);
    } else {
      await createAttribute('deals', attr);
      console.log(`  + "${attr.api_slug}" created`);
    }
  }

  console.log('\nDone. Custom Deal attributes are set up.');
}

main().catch((err) => {
  console.error('\nError:', err.message);
  process.exit(1);
});
