/**
 * One-time setup script: configures custom deal stages in Attio.
 *
 * Usage:
 *   ATTIO_API_KEY=your_key node crm-integration/scripts/setup-attio-deal-stages.js
 *
 * This script:
 *   1. Lists existing stages on the Deals object's `stage` attribute
 *   2. Archives any default stages that aren't in our custom list
 *   3. Creates any missing custom stages
 *
 * Idempotent — safe to run multiple times.
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

// Custom deal stages in order. Each entry can have:
//   title:    The stage name
//   celebrate: true if it's a "won" celebration stage (optional)
const CUSTOM_STAGES = [
  { title: 'Lead' },
  { title: 'Qualifying Call Booked' },
  { title: 'Call Cancelled' },
  { title: 'Call Complete - Good Fit' },
  { title: 'Call Complete - Not a Good Fit' },
  { title: 'Call Complete - Follow Up' },
  { title: 'Context Call - Scheduled' },
  { title: 'Context Call - Cancelled' },
  { title: 'Context Call - Complete' },
  { title: 'Strategic Video Walkthrough Sent' },
  { title: 'Key Findings - Call Booked' },
  { title: 'Key Findings - Call Cancelled' },
  { title: 'Won \uD83C\uDF89', celebrate: true },
  { title: 'Lost' },
  { title: 'Followup' },
];

async function listStages() {
  const res = await fetch(`${BASE_URL}/objects/deals/attributes/stage/statuses`, { headers });
  if (!res.ok) {
    throw new Error(`Failed to list stages: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.data || [];
}

async function archiveStage(statusId) {
  const res = await fetch(`${BASE_URL}/objects/deals/attributes/stage/statuses/${statusId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ data: { is_archived: true } }),
  });
  if (!res.ok) {
    throw new Error(`Failed to archive stage ${statusId}: ${res.status} ${await res.text()}`);
  }
}

async function createStage(title, celebrate) {
  const body = { data: { title } };
  if (celebrate) body.data.celebration_enabled = true;
  const res = await fetch(`${BASE_URL}/objects/deals/attributes/stage/statuses`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Failed to create stage "${title}": ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

async function main() {
  console.log('Fetching existing deal stages...');
  const existing = await listStages();
  console.log(`Found ${existing.length} existing stages.\n`);

  const customTitles = new Set(CUSTOM_STAGES.map((s) => s.title));
  const existingByTitle = new Map();
  existing.forEach((s) => {
    if (!s.is_archived) existingByTitle.set(s.title, s);
  });

  // Archive any active stages that aren't in our custom list
  for (const stage of existing) {
    if (!stage.is_archived && !customTitles.has(stage.title)) {
      console.log(`  - Archiving "${stage.title}"`);
      await archiveStage(stage.id.status_id);
    }
  }

  // Create any custom stages that don't exist yet
  for (const stage of CUSTOM_STAGES) {
    if (existingByTitle.has(stage.title)) {
      console.log(`  ✓ "${stage.title}" already exists — skipping`);
    } else {
      await createStage(stage.title, stage.celebrate);
      console.log(`  + "${stage.title}" created`);
    }
  }

  console.log('\nDone. Custom deal stages are set up.');
}

main().catch((err) => {
  console.error('\nError:', err.message);
  process.exit(1);
});
