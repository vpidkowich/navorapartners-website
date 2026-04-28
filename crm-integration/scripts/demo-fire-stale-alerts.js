/**
 * One-off demo: simulates a stale-deal-checker run against exactly 4
 * demo deals in "Growth Strategy Sent". Mimics the worker's side effects
 * end-to-end so you can showcase the alert flow without waiting 8 days
 * (Attio's API doesn't allow backdating stage active_from).
 *
 * For each picked deal it:
 *   1. Creates an Attio Task on the deal, assigned to the deal's owner,
 *      with content saying "in stage for 8 days" + the email template name.
 *   2. Posts a Slack alert mirroring the real worker's wording.
 *   3. Stamps `stale_alert_sent_at = now` on the deal so the live cron
 *      worker won't re-alert these for the next COOLDOWN_DAYS.
 *
 * Usage:
 *   ATTIO_API_KEY=$(grep ATTIO_API_KEY .dev.vars | cut -d= -f2) \
 *   SLACK_WEBHOOK_URL=$(grep SLACK_WEBHOOK_URL .dev.vars | cut -d= -f2) \
 *     node crm-integration/scripts/demo-fire-stale-alerts.js
 */

const ATTIO_BASE = 'https://api.attio.com/v2';
const TARGET_STAGE = 'Growth Strategy Sent';
const TEMPLATE = '5b. TEMPLATE - Followup Email if Sales Call not Booked';
const WORKSPACE_SLUG = 'navora-partners';
const DAYS_IN_STAGE = 8;
const PICK = 4;
const DAY_MS = 24 * 60 * 60 * 1000;

const API_KEY = process.env.ATTIO_API_KEY;
const SLACK = process.env.SLACK_WEBHOOK_URL;
if (!API_KEY) { console.error('Missing ATTIO_API_KEY'); process.exit(1); }
if (!SLACK)   { console.error('Missing SLACK_WEBHOOK_URL'); process.exit(1); }

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

async function fetchOwnerFirstName(actorId) {
  if (!actorId) return null;
  const r = await fetch(`${ATTIO_BASE}/workspace_members/${actorId}`, { headers });
  if (!r.ok) return null;
  const j = await r.json();
  return j.data?.first_name || null;
}

async function createAttioTask({ dealId, dealName, ownerActorId }) {
  const content =
    `"${dealName}" has been in "${TARGET_STAGE}" for ${DAYS_IN_STAGE} days. ` +
    `Send the "${TEMPLATE}" email template to follow up.`;
  const r = await fetch(`${ATTIO_BASE}/tasks`, {
    method: 'POST', headers,
    body: JSON.stringify({
      data: {
        content,
        format: 'plaintext',
        deadline_at: new Date(Date.now() + DAY_MS).toISOString(),
        is_completed: false,
        linked_records: [{ target_object: 'deals', target_record_id: dealId }],
        assignees: ownerActorId
          ? [{ referenced_actor_type: 'workspace-member', referenced_actor_id: ownerActorId }]
          : [],
      },
    }),
  });
  if (!r.ok) console.error(`task fail ${dealId}: ${r.status} ${await r.text()}`);
  return r.ok;
}

async function postSlackAlert({ dealId, dealName, ownerName }) {
  const ownerLabel = ownerName ? `*${ownerName}*` : '_unowned_';
  const dealUrl = `https://app.attio.com/${WORKSPACE_SLUG}/deals/record/${dealId}`;
  const text =
    `:hourglass_flowing_sand: *Stale deal:* \`${dealName}\` — owner: ${ownerLabel} — ` +
    `*${DAYS_IN_STAGE} days* in *${TARGET_STAGE}*. ` +
    `Send the *${TEMPLATE}* template. <${dealUrl}|Open in Attio>`;
  const r = await fetch(SLACK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      username: 'Sales Bot 9000',
      icon_url: 'https://emoji.slack-edge.com/T0AQDFSGMBP/grinning-slackbot/bd9842ae45549e05.png',
    }),
  });
  if (!r.ok) console.error(`slack fail ${dealId}: ${r.status} ${await r.text()}`);
  return r.ok;
}

async function markAlertSent(dealId) {
  const r = await fetch(`${ATTIO_BASE}/objects/deals/records/${dealId}`, {
    method: 'PATCH', headers,
    body: JSON.stringify({
      data: { values: { stale_alert_sent_at: [{ value: new Date().toISOString() }] } },
    }),
  });
  if (!r.ok) console.error(`mark fail ${dealId}: ${r.status} ${await r.text()}`);
  return r.ok;
}

async function main() {
  // Find demo deals currently in Growth Strategy Sent
  const q = await fetch(`${ATTIO_BASE}/objects/deals/records/query`, {
    method: 'POST', headers,
    body: JSON.stringify({ filter: { is_demo: true }, limit: 500 }),
  });
  const all = (await q.json()).data || [];
  const inStage = all.filter((d) => {
    const s = d.values.stage?.find((v) => v.active_until === null) || d.values.stage?.[0];
    return s?.status?.title === TARGET_STAGE;
  });
  const picks = inStage.slice(0, PICK);

  console.log(`Found ${inStage.length} demo deals in "${TARGET_STAGE}"; firing on ${picks.length}.\n`);

  for (const d of picks) {
    const dealId = d.id.record_id;
    const dealName = d.values.name?.[0]?.value || 'Untitled';
    const ownerActorId = d.values.owner?.[0]?.referenced_actor_id || null;
    const ownerName = await fetchOwnerFirstName(ownerActorId);

    const taskOk = await createAttioTask({ dealId, dealName, ownerActorId });
    const slackOk = await postSlackAlert({ dealId, dealName, ownerName });
    const markOk = (taskOk || slackOk) ? await markAlertSent(dealId) : false;

    console.log(`  ${taskOk ? '✓' : '✗'} task   ${slackOk ? '✓' : '✗'} slack  ${markOk ? '✓' : '·'} mark   ${dealName}`);
  }
  console.log('\nDone. Check Slack #sales and the 4 deals in Attio (Tasks tab + stale_alert_sent_at field).');
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
