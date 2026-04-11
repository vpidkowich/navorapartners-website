/**
 * Cloudflare Pages Function — POST /api/attio-webhook
 *
 * Receives webhook events from Attio. Currently handles:
 *   - Deal stage change to "Context Call - Scheduled":
 *     1. Updates deal owner to Chaky
 *     2. Sends Slack notification to sales channel mentioning Chaky
 *
 * Required env vars:
 *   ATTIO_API_KEY     — Attio API token (already set)
 *   SLACK_WEBHOOK_URL — Slack incoming webhook (already set, reused)
 */

const CHAKY_EMAIL = 'chaky@navorapartners.com';
const CHAKY_SLACK_MEMBER_ID = 'U0AQGTTAWCS';
const TARGET_STAGE = 'Context Call - Scheduled';

// ── Slack notification ────────────────────────────────────────────

async function notifySlack(webhookUrl, dealName, personName, companyName) {
  if (!webhookUrl) return;

  const mention = `<@${CHAKY_SLACK_MEMBER_ID}>`;
  const text = `${mention} A context call has been scheduled with *${personName}* from *${companyName}*. You're now the deal owner for "${dealName}".`;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      username: 'Sales Bot 9000',
      icon_url: 'https://emoji.slack-edge.com/T0AQDFSGMBP/grinning-slackbot/bd9842ae45549e05.png',
    }),
  }).catch((err) => console.error('Slack notify failed:', err));
}

// ── Attio API helpers ─────────────────────────────────────────────

async function fetchDeal(dealId, apiKey) {
  const res = await fetch(`https://api.attio.com/v2/objects/deals/records/${dealId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    console.error('fetchDeal failed:', res.status, await res.text());
    return null;
  }
  const json = await res.json();
  return json.data || null;
}

async function fetchPerson(personId, apiKey) {
  const res = await fetch(`https://api.attio.com/v2/objects/people/records/${personId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

async function fetchCompany(companyId, apiKey) {
  const res = await fetch(`https://api.attio.com/v2/objects/companies/records/${companyId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

async function updateDealOwner(dealId, ownerEmail, apiKey) {
  const res = await fetch(`https://api.attio.com/v2/objects/deals/records/${dealId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        values: {
          owner: [{ workspace_member_email_address: ownerEmail }],
        },
      },
    }),
  });
  if (!res.ok) {
    console.error('updateDealOwner failed:', res.status, await res.text());
    return false;
  }
  return true;
}

const CHAKY_WORKSPACE_MEMBER_ID = '039b82bf-8126-4d2c-97a4-7f61b9f10d71';

// Recursively find all strings that look like UUIDs in an object
function findRecordIds(obj, found = new Set()) {
  if (!obj) return found;
  if (typeof obj === 'string') {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(obj)) {
      found.add(obj);
    }
    return found;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item) => findRecordIds(item, found));
    return found;
  }
  if (typeof obj === 'object') {
    Object.values(obj).forEach((v) => findRecordIds(v, found));
  }
  return found;
}

async function processDealUpdate(dealId, env) {
  const deal = await fetchDeal(dealId, env.ATTIO_API_KEY);
  if (!deal) return false;

  const currentStage = deal.values.stage?.[0]?.status?.title || '';
  if (currentStage !== TARGET_STAGE) return false;

  // Avoid infinite loop: skip if owner is already Chaky
  const currentOwner = deal.values.owner?.[0]?.referenced_actor_id;
  if (currentOwner === CHAKY_WORKSPACE_MEMBER_ID) return false;

  // Switch owner to Chaky
  const updated = await updateDealOwner(dealId, CHAKY_EMAIL, env.ATTIO_API_KEY);
  if (!updated) return false;

  // Gather deal/person/company info for the Slack message
  const dealName = deal.values.name?.[0]?.value || 'Unnamed deal';
  let personName = 'Unknown person';
  let companyName = 'Unknown company';

  const personRef = deal.values.associated_people?.[0]?.target_record_id;
  if (personRef) {
    const person = await fetchPerson(personRef, env.ATTIO_API_KEY);
    if (person) {
      const n = person.values.name?.[0];
      if (n) personName = n.full_name || `${n.first_name || ''} ${n.last_name || ''}`.trim();
    }
  }

  const companyRef = deal.values.associated_company?.[0]?.target_record_id;
  if (companyRef) {
    const company = await fetchCompany(companyRef, env.ATTIO_API_KEY);
    if (company) {
      companyName = company.values.name?.[0]?.value || companyName;
    }
  }

  await notifySlack(env.SLACK_WEBHOOK_URL, dealName, personName, companyName);
  return true;
}

// ── Main handler ──────────────────────────────────────────────────

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Extract all UUIDs from the payload and try each as a deal ID.
  // fetchDeal returns null for non-deal IDs, so this is safe.
  const candidateIds = Array.from(findRecordIds(body));

  let processedAny = false;
  for (const id of candidateIds) {
    const didProcess = await processDealUpdate(id, env);
    if (didProcess) {
      processedAny = true;
      break; // only process one deal per event payload
    }
  }

  return new Response(JSON.stringify({ ok: true, processed: processedAny }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
