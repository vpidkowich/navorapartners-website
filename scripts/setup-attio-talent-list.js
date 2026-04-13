/**
 * One-time setup script: creates the "Talent" List on the Deals object,
 * plus its list-level custom attributes and pipeline stages.
 *
 * Usage:
 *   ATTIO_API_KEY=your_key node scripts/setup-attio-talent-list.js
 *
 * Creates:
 *   1. A List called "Talent" whose parent_object is Deals
 *   2. List-level custom attributes:
 *      - resume_url          (text — URL the candidate pastes from Google Drive / Dropbox / personal site)
 *      - role_applied_for    (text)
 *      - applied_at          (timestamp)
 *   3. The 9 Talent pipeline stages on the list's built-in `stage` attribute
 *
 * At the end, prints the Talent List ID — add this to Cloudflare Pages
 * env vars as TALENT_LIST_ID so submit-resume.js can reference it.
 *
 * IMPORTANT: Run scripts/setup-attio-talent-attributes.js FIRST to create
 * the object-level attributes on People and Deals.
 *
 * Idempotent — safe to run multiple times. Checks each resource before
 * creating. If Attio's API rejects list-level stage creation for any
 * reason, the script prints manual UI setup instructions and exits 0.
 */

const API_KEY = process.env.ATTIO_API_KEY;
if (!API_KEY) {
  console.error('Missing ATTIO_API_KEY environment variable.');
  console.error('Usage: ATTIO_API_KEY=your_key node scripts/setup-attio-talent-list.js');
  process.exit(1);
}

const BASE_URL = 'https://api.attio.com/v2';

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

const LIST_NAME = 'Talent';
const LIST_API_SLUG = 'talent';
const PARENT_OBJECT = 'deals';

// List-level custom attributes (NOT including the built-in stage)
const LIST_ATTRIBUTES = [
  {
    api_slug: 'resume_url',
    title: 'Resume URL',
    type: 'text',
    description: 'URL the candidate pasted pointing to their resume (Google Drive, Dropbox, personal site, etc. with viewing permissions). Click to open the resume in its source platform.',
  },
  {
    api_slug: 'role_applied_for',
    title: 'Role Applied For',
    type: 'text',
    description: 'Position the candidate applied to (free-form for Phase 1).',
  },
  {
    api_slug: 'applied_at',
    title: 'Applied At',
    type: 'timestamp',
    description: 'When the candidate submitted the application form.',
  },
];

// Pipeline stages in order. The first entry is the default for new entries.
const TALENT_STAGES = [
  { title: 'Applications' },
  { title: 'Send Request to Interview' },
  { title: 'Interview 1 Booked' },
  { title: 'Send Invite/Instructions to Assessment' },
  { title: 'Assessment In Progress' },
  { title: 'Assessment Ready for Review' },
  { title: 'Interview 2' },
  { title: 'Interview 2 Complete' },
  { title: 'Offer Sent' },
];

async function findExistingList() {
  const res = await fetch(`${BASE_URL}/lists`, { headers });
  if (!res.ok) {
    throw new Error(`Failed to list Attio lists: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const lists = data.data || [];
  return lists.find(
    (l) => l.api_slug === LIST_API_SLUG || l.name === LIST_NAME
  );
}

async function createList() {
  const body = {
    data: {
      name: LIST_NAME,
      api_slug: LIST_API_SLUG,
      parent_object: PARENT_OBJECT,
      workspace_access: 'full-access',
      workspace_member_access: [],
    },
  };
  const res = await fetch(`${BASE_URL}/lists`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Failed to create Talent list: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

async function getListAttributes(listId) {
  const res = await fetch(`${BASE_URL}/lists/${listId}/attributes`, { headers });
  if (!res.ok) {
    throw new Error(`Failed to list attributes for list ${listId}: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.data || [];
}

async function createListAttribute(listId, attr) {
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

  const res = await fetch(`${BASE_URL}/lists/${listId}/attributes`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data: body }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create list attribute "${attr.api_slug}": ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

async function listListStages(listId) {
  // Lists have a built-in stage attribute. The statuses endpoint is:
  // GET /v2/lists/{list_id}/attributes/stage/statuses
  const res = await fetch(`${BASE_URL}/lists/${listId}/attributes/stage/statuses`, { headers });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Failed to list list stages: ${res.status} ${text}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return data.data || [];
}

async function createListStage(listId, title) {
  const body = { data: { title } };
  const res = await fetch(`${BASE_URL}/lists/${listId}/attributes/stage/statuses`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Failed to create list stage "${title}": ${res.status} ${text}`);
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

function printManualStageInstructions() {
  console.log('\n───────────────────────────────────────────────────────────');
  console.log('  MANUAL SETUP REQUIRED: Talent List Stages');
  console.log('───────────────────────────────────────────────────────────');
  console.log('  Attio\'s API rejected programmatic stage creation on this');
  console.log('  List. Add the stages manually via the Attio UI:');
  console.log('');
  console.log('  1. Open the Talent list in Attio');
  console.log('  2. Open Settings → Pipeline / Kanban view');
  console.log('  3. Add these stages in order:');
  TALENT_STAGES.forEach((s, i) => {
    console.log(`     ${i + 1}. ${s.title}`);
  });
  console.log('');
  console.log('  The first stage (Applications) must be the default for');
  console.log('  new entries added via the API.');
  console.log('───────────────────────────────────────────────────────────\n');
}

async function main() {
  // 1. Find or create the Talent list
  console.log(`Checking for existing "${LIST_NAME}" list...`);
  let list = await findExistingList();

  if (list) {
    console.log(`  ✓ List "${LIST_NAME}" already exists (id: ${list.id?.list_id || list.id})`);
  } else {
    console.log(`  + Creating list "${LIST_NAME}" on ${PARENT_OBJECT}...`);
    const created = await createList();
    list = created.data;
    console.log(`  ✓ Created (id: ${list.id?.list_id || list.id})`);
  }

  const listId = list.id?.list_id || list.id;
  if (!listId) {
    throw new Error('Could not determine list ID from Attio response. Check the response shape and update this script.');
  }

  // 2. Create list-level custom attributes
  console.log(`\nFetching existing list attributes...`);
  const existingAttrs = await getListAttributes(listId);
  const existingSlugs = new Set(existingAttrs.map((a) => a.api_slug));
  console.log(`Found ${existingAttrs.length} existing attributes on the list.`);

  for (const attr of LIST_ATTRIBUTES) {
    if (existingSlugs.has(attr.api_slug)) {
      console.log(`  ✓ "${attr.title}" (${attr.api_slug}) already exists — skipping`);
    } else {
      await createListAttribute(listId, attr);
      console.log(`  + "${attr.title}" (${attr.api_slug}) created`);
    }
  }

  // 3. Create the Talent stages on the list
  console.log(`\nFetching existing list stages...`);
  let stagesSupported = true;
  let existingStages = [];
  try {
    existingStages = await listListStages(listId);
    console.log(`Found ${existingStages.length} existing stages on the list.`);
  } catch (err) {
    console.log(`  ⚠ Could not fetch list stages via API: ${err.message}`);
    stagesSupported = false;
  }

  if (stagesSupported) {
    const existingStageTitles = new Set(
      existingStages.filter((s) => !s.is_archived).map((s) => s.title)
    );
    let anyStageFailed = false;
    for (const stage of TALENT_STAGES) {
      if (existingStageTitles.has(stage.title)) {
        console.log(`  ✓ "${stage.title}" already exists — skipping`);
      } else {
        try {
          await createListStage(listId, stage.title);
          console.log(`  + "${stage.title}" created`);
        } catch (err) {
          console.log(`  ⚠ Failed to create "${stage.title}": ${err.message}`);
          anyStageFailed = true;
          break;
        }
      }
    }
    if (anyStageFailed) {
      printManualStageInstructions();
    }
  } else {
    printManualStageInstructions();
  }

  // 4. Print summary
  console.log('\n───────────────────────────────────────────────────────────');
  console.log('  Talent List setup complete');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`  List ID:   ${listId}`);
  console.log(`  API slug:  ${LIST_API_SLUG}`);
  console.log(`  Parent:    ${PARENT_OBJECT}`);
  console.log('');
  console.log('  NEXT STEP: Add the list ID to Cloudflare Pages env vars:');
  console.log('    Settings → Environment variables → Add variable');
  console.log(`    Name:  TALENT_LIST_ID`);
  console.log(`    Value: ${listId}`);
  console.log('───────────────────────────────────────────────────────────\n');
}

main().catch((err) => {
  console.error('\nError:', err.message);
  process.exit(1);
});
