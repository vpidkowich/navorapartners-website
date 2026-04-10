/**
 * Cloudflare Pages Function — POST /api/attio-webhook
 *
 * Receives webhook events from Attio. Currently handles:
 *   - Deal stage change to "Context Call - Scheduled":
 *     1. Updates deal owner to Chaky
 *     2. Sends Slack notification to sales channel mentioning Chaky
 *
 * Required env vars:
 *   ATTIO_API_KEY                      — Attio API token (already set)
 *   SLACK_SALES_WEBHOOK_URL            — Slack incoming webhook for #sales channel
 *   SLACK_CHAKY_MEMBER_ID              — Chaky's Slack member ID (for @-mention)
 *   ATTIO_WEBHOOK_SIGNING_SECRET       — Attio webhook signing secret (for verification)
 */

const CHAKY_EMAIL = 'chaky@navorapartners.com';
const TARGET_STAGE = 'Context Call - Scheduled';

// ── Slack notification ────────────────────────────────────────────

async function notifySlack(webhookUrl, chakyMemberId, dealName, personName, companyName) {
  if (!webhookUrl) return;

  const mention = chakyMemberId ? `<@${chakyMemberId}>` : '@chaky';
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

  // Attio sends events as an array
  const events = body.events || [body];

  for (const event of events) {
    // We care about deal stage updates
    if (event.event_type !== 'record-updated') continue;

    const objectSlug = event.parent_object_slug || event.id?.object_slug;
    if (objectSlug !== 'deals') continue;

    // Check if the stage attribute was the one that changed
    const updatedAttrs = event.actor_changes || event.changed_attributes || [];
    const stageChanged = Array.isArray(updatedAttrs)
      ? updatedAttrs.some((a) => a === 'stage' || a?.api_slug === 'stage')
      : true; // fallback: process anyway

    if (!stageChanged) continue;

    const dealId = event.id?.record_id || event.parent_record_id;
    if (!dealId) continue;

    // Fetch the deal to verify the current stage
    const deal = await fetchDeal(dealId, env.ATTIO_API_KEY);
    if (!deal) continue;

    const currentStage = deal.values.stage?.[0]?.status?.title || '';
    if (currentStage !== TARGET_STAGE) continue;

    // Switch owner to Chaky
    const updated = await updateDealOwner(dealId, CHAKY_EMAIL, env.ATTIO_API_KEY);
    if (!updated) continue;

    // Gather person + company info for the Slack message
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

    // Send Slack notification
    await notifySlack(
      env.SLACK_SALES_WEBHOOK_URL,
      env.SLACK_CHAKY_MEMBER_ID,
      dealName,
      personName,
      companyName
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
