/**
 * One-time setup script: creates custom attributes in Attio for form data.
 *
 * Usage:
 *   ATTIO_API_KEY=your_key node scripts/setup-attio-attributes.js
 *
 * Idempotent — safe to run multiple times. Checks if each attribute
 * exists before creating it.
 */

const API_KEY = process.env.ATTIO_API_KEY;
if (!API_KEY) {
  console.error('Missing ATTIO_API_KEY environment variable.');
  console.error('Usage: ATTIO_API_KEY=your_key node scripts/setup-attio-attributes.js');
  process.exit(1);
}

const BASE_URL = 'https://api.attio.com/v2';

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Attributes to create on the People object
const PEOPLE_ATTRIBUTES = [
  {
    api_slug: 'revenue_range',
    title: 'Revenue Range',
    type: 'select',
    config: {
      choices: [
        { title: 'Under $500K' },
        { title: '$500K – $1M' },
        { title: '$1M – $3M' },
        { title: '$3M – $5M' },
        { title: '$5M – $10M' },
        { title: '$10M – $25M' },
        { title: '$25M+' },
      ],
    },
  },
  { api_slug: 'utm_source', title: 'UTM Source', type: 'text' },
  { api_slug: 'utm_medium', title: 'UTM Medium', type: 'text' },
  { api_slug: 'utm_campaign', title: 'UTM Campaign', type: 'text' },
  { api_slug: 'utm_content', title: 'UTM Content', type: 'text' },
  { api_slug: 'utm_term', title: 'UTM Term', type: 'text' },
  { api_slug: 'gclid', title: 'GCLID', type: 'text' },
  { api_slug: 'lead_source', title: 'Lead Source', type: 'text' },
  { api_slug: 'ip_address', title: 'IP Address', type: 'text' },
  { api_slug: 'geo_city', title: 'Geo City', type: 'text' },
  { api_slug: 'geo_region', title: 'Geo Region', type: 'text' },
  { api_slug: 'geo_country', title: 'Geo Country', type: 'text' },
  { api_slug: 'geo_timezone', title: 'Geo Timezone', type: 'text' },
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
    is_multiselect: attr.type === 'select' ? false : false,
  };

  // Config is required by the API; populate per type
  if (attr.type === 'select' && attr.config?.choices) {
    body.config = { choices: attr.config.choices };
  } else {
    body.config = {};
  }

  const res = await fetch(`${BASE_URL}/objects/${objectSlug}/attributes`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data: body }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create attribute "${attr.api_slug}" on ${objectSlug}: ${res.status} ${text}`);
  }

  return await res.json();
}

async function main() {
  console.log('Fetching existing People attributes...');
  const existing = await getExistingAttributes('people');
  console.log(`Found ${existing.size} existing attributes.\n`);

  for (const attr of PEOPLE_ATTRIBUTES) {
    if (existing.has(attr.api_slug)) {
      console.log(`  ✓ "${attr.title}" (${attr.api_slug}) already exists — skipping`);
    } else {
      await createAttribute('people', attr);
      console.log(`  + "${attr.title}" (${attr.api_slug}) created`);
    }
  }

  console.log('\nDone. All custom attributes are set up.');
}

main().catch((err) => {
  console.error('\nError:', err.message);
  process.exit(1);
});
