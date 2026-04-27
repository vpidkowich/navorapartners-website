/**
 * One-time setup script: creates object-level custom attributes in Attio
 * for the Talent pipeline.
 *
 * Usage:
 *   ATTIO_API_KEY=your_key node crm-integration/scripts/setup-attio-talent-attributes.js
 *
 * Creates:
 *   - People.linkedin_url (text)
 *   - People.source_page (text)
 *   - People.lead_type (select: Client | Talent)
 *   - Deals.pipeline_type (select: Growth Strategy | Talent)
 *
 * Idempotent — safe to run multiple times. Checks if each attribute
 * exists before creating it.
 *
 * Run this BEFORE crm-integration/scripts/setup-attio-talent-list.js.
 */

const API_KEY = process.env.ATTIO_API_KEY;
if (!API_KEY) {
  console.error('Missing ATTIO_API_KEY environment variable.');
  console.error('Usage: ATTIO_API_KEY=your_key node crm-integration/scripts/setup-attio-talent-attributes.js');
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
    api_slug: 'linkedin_url',
    title: 'LinkedIn URL',
    type: 'text',
    description: 'LinkedIn profile URL captured from the careers resume form.',
  },
  {
    api_slug: 'source_page',
    title: 'Source Page',
    type: 'text',
    description: 'Page path the person submitted their form from (e.g. /careers.html).',
  },
  {
    api_slug: 'lead_type',
    title: 'Lead Type',
    type: 'select',
    description: 'Distinguishes prospective clients from talent applicants.',
    config: {
      choices: [
        { title: 'Client' },
        { title: 'Talent' },
      ],
    },
  },
];

// Attributes to create on the Deals object
const DEAL_ATTRIBUTES = [
  {
    api_slug: 'pipeline_type',
    title: 'Pipeline Type',
    type: 'select',
    description: 'Distinguishes Growth Strategy deals from Talent applications. Used to filter reports.',
    config: {
      choices: [
        { title: 'Growth Strategy' },
        { title: 'Talent' },
      ],
    },
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
  };

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

async function syncObjectAttributes(objectSlug, attrs) {
  console.log(`\nFetching existing ${objectSlug} attributes...`);
  const existing = await getExistingAttributes(objectSlug);
  console.log(`Found ${existing.size} existing attributes on ${objectSlug}.`);

  for (const attr of attrs) {
    if (existing.has(attr.api_slug)) {
      console.log(`  ✓ "${attr.title}" (${attr.api_slug}) already exists — skipping`);
    } else {
      await createAttribute(objectSlug, attr);
      console.log(`  + "${attr.title}" (${attr.api_slug}) created`);
    }
  }
}

async function main() {
  await syncObjectAttributes('people', PEOPLE_ATTRIBUTES);
  await syncObjectAttributes('deals', DEAL_ATTRIBUTES);
  console.log('\nDone. Talent object-level attributes are set up.');
  console.log('\nNext: run crm-integration/scripts/setup-attio-talent-list.js to create the Talent List and its stages.');
}

main().catch((err) => {
  console.error('\nError:', err.message);
  process.exit(1);
});
