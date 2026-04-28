/**
 * Cloudflare Worker — Stale Deal Checker
 *
 * Runs daily on a cron trigger. Identifies deals that have been sitting in a
 * configured "stale" stage for more than N days, then for each one:
 *   1. Creates an Attio Task on the deal, assigned to the deal's current owner
 *   2. Posts a message to the configured Slack channel via the existing webhook
 *   3. Stamps the deal's `stale_alert_sent_at` attribute to dedupe future runs
 *
 * Required secrets (set via `wrangler secret put`):
 *   ATTIO_API_KEY         — read-write Attio token
 *   SLACK_WEBHOOK_URL     — Slack incoming webhook (#sales)
 *   MANUAL_TRIGGER_TOKEN  — required token for HTTP testing
 *
 * Required vars (in wrangler.toml [vars]):
 *   TARGET_STAGE, STALE_DAYS, COOLDOWN_DAYS, EMAIL_TEMPLATE_NAME, ATTIO_WORKSPACE_SLUG
 *
 * Manual test:
 *   GET https://<worker-url>/?token=<MANUAL_TRIGGER_TOKEN>&dryRun=true
 */

const ATTIO_BASE = 'https://api.attio.com/v2';
const PAGE_SIZE = 500;
const DAY_MS = 24 * 60 * 60 * 1000;

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(checkStaleDeals(env, { source: 'cron', dryRun: false }));
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    if (!env.MANUAL_TRIGGER_TOKEN || token !== env.MANUAL_TRIGGER_TOKEN) {
      return new Response('Not authorized', { status: 401 });
    }
    const dryRun = url.searchParams.get('dryRun') === 'true';
    const result = await checkStaleDeals(env, { source: 'manual', dryRun });
    return Response.json(result);
  },
};

async function checkStaleDeals(env, { source, dryRun }) {
  const startedAt = new Date().toISOString();
  const targetStage = env.TARGET_STAGE;
  const staleDays = parseInt(env.STALE_DAYS, 10);
  const cooldownDays = parseInt(env.COOLDOWN_DAYS, 10);
  const templateName = env.EMAIL_TEMPLATE_NAME;
  const workspaceSlug = env.ATTIO_WORKSPACE_SLUG;

  console.log(`[${startedAt}] start source=${source} dryRun=${dryRun} targetStage="${targetStage}" staleDays=${staleDays}`);

  const allDeals = await fetchAllDeals(env.ATTIO_API_KEY);
  const dealsInStage = allDeals.filter((d) => currentStageTitle(d) === targetStage);
  console.log(`Examined ${allDeals.length} deals; ${dealsInStage.length} are in "${targetStage}"`);

  const now = Date.now();
  const staleMs = staleDays * DAY_MS;
  const cooldownMs = cooldownDays * DAY_MS;

  const alerts = [];
  const skipped = [];

  for (const deal of dealsInStage) {
    const dealId = deal.id.record_id;
    const dealName = deal.values.name?.[0]?.value || 'Untitled deal';

    const enteredAtIso = currentStageActiveFrom(deal);
    if (!enteredAtIso) {
      skipped.push({ dealId, reason: 'no active_from on current stage' });
      continue;
    }
    const enteredAt = new Date(enteredAtIso).getTime();
    const daysInStage = Math.floor((now - enteredAt) / DAY_MS);

    if (now - enteredAt < staleMs) {
      skipped.push({ dealId, reason: `only ${daysInStage}d in stage` });
      continue;
    }

    const lastAlertIso = deal.values.stale_alert_sent_at?.[0]?.value;
    if (lastAlertIso && now - new Date(lastAlertIso).getTime() < cooldownMs) {
      skipped.push({ dealId, reason: `alerted recently (${lastAlertIso})` });
      continue;
    }

    const ownerActorId = deal.values.owner?.[0]?.referenced_actor_id || null;

    if (dryRun) {
      alerts.push({ dealId, dealName, daysInStage, ownerActorId, dryRun: true });
      continue;
    }

    const ownerName = await fetchOwnerFirstName(env.ATTIO_API_KEY, ownerActorId);

    const taskOk = await createAttioTask(env.ATTIO_API_KEY, {
      dealId,
      dealName,
      ownerActorId,
      daysInStage,
      targetStage,
      templateName,
    });

    const slackOk = await postSlackAlert(env.SLACK_WEBHOOK_URL, {
      dealId,
      dealName,
      daysInStage,
      ownerName,
      targetStage,
      templateName,
      workspaceSlug,
    });

    if (taskOk || slackOk) {
      await markAlertSent(env.ATTIO_API_KEY, dealId, new Date(now).toISOString());
    }

    alerts.push({ dealId, dealName, daysInStage, taskOk, slackOk });
  }

  const summary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    source,
    dryRun,
    dealsExamined: allDeals.length,
    dealsInStage: dealsInStage.length,
    alerted: alerts.length,
    skipped: skipped.length,
    alerts,
    skippedDetails: skipped,
  };
  console.log(`done alerted=${alerts.length} skipped=${skipped.length}`);
  return summary;
}

function currentStageTitle(deal) {
  const stageEntry = deal.values.stage?.find((s) => s.active_until === null) || deal.values.stage?.[0];
  return stageEntry?.status?.title || null;
}

function currentStageActiveFrom(deal) {
  const stageEntry = deal.values.stage?.find((s) => s.active_until === null) || deal.values.stage?.[0];
  return stageEntry?.active_from || null;
}

async function fetchAllDeals(apiKey) {
  const all = [];
  let offset = 0;
  while (true) {
    const res = await fetch(`${ATTIO_BASE}/objects/deals/records/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ limit: PAGE_SIZE, offset }),
    });
    if (!res.ok) {
      throw new Error(`fetchAllDeals failed at offset=${offset}: ${res.status} ${await res.text()}`);
    }
    const json = await res.json();
    const batch = json.data || [];
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

async function createAttioTask(apiKey, { dealId, dealName, ownerActorId, daysInStage, targetStage, templateName }) {
  const content =
    `"${dealName}" has been in "${targetStage}" for ${daysInStage} days. ` +
    `Send the "${templateName}" email template to follow up.`;

  const body = {
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
  };

  const res = await fetch(`${ATTIO_BASE}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error(`createAttioTask failed dealId=${dealId} status=${res.status} ${await res.text()}`);
    return false;
  }
  return true;
}

async function postSlackAlert(webhookUrl, { dealId, dealName, daysInStage, ownerName, targetStage, templateName, workspaceSlug }) {
  if (!webhookUrl) return false;
  const ownerLabel = ownerName ? `*${ownerName}*` : '_unowned_';
  const dealUrl = `https://app.attio.com/${workspaceSlug}/deals/record/${dealId}`;
  const text =
    `:hourglass_flowing_sand: *Stale deal:* \`${dealName}\` — owner: ${ownerLabel} — *${daysInStage} days* in *${targetStage}*. ` +
    `Send the *${templateName}* template. <${dealUrl}|Open in Attio>`;

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      username: 'Sales Bot 9000',
      icon_url: 'https://emoji.slack-edge.com/T0AQDFSGMBP/grinning-slackbot/bd9842ae45549e05.png',
    }),
  });
  if (!res.ok) {
    console.error(`postSlackAlert failed dealId=${dealId} status=${res.status} ${await res.text()}`);
    return false;
  }
  return true;
}

async function markAlertSent(apiKey, dealId, timestampIso) {
  const res = await fetch(`${ATTIO_BASE}/objects/deals/records/${dealId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        values: {
          stale_alert_sent_at: [{ value: timestampIso }],
        },
      },
    }),
  });
  if (!res.ok) {
    console.error(`markAlertSent failed dealId=${dealId} status=${res.status} ${await res.text()}`);
    return false;
  }
  return true;
}

async function fetchOwnerFirstName(apiKey, actorId) {
  if (!actorId) return null;
  const res = await fetch(`${ATTIO_BASE}/workspace_members/${actorId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data?.first_name || null;
}
