/**
 * Shared Attio client for the Reports BI hub.
 *
 * Lifts the paginated /deals/records/query pattern proven in
 * crm-integration/workers/stale-deal-checker/src/index.js.
 */

const ATTIO_BASE = 'https://api.attio.com/v2';
const PAGE_SIZE = 500;

export async function fetchAllDeals(apiKey) {
  if (!apiKey) throw new Error('fetchAllDeals: missing ATTIO_API_KEY');
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
      throw new Error(`fetchAllDeals offset=${offset} failed: ${res.status} ${await res.text()}`);
    }
    const json = await res.json();
    const batch = json.data || [];
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

export function dealId(deal) {
  return deal?.id?.record_id || null;
}

export function dealName(deal) {
  return deal?.values?.name?.[0]?.value || 'Untitled deal';
}

export function dealOwnerName(deal) {
  const owner = deal?.values?.owner?.[0];
  return owner?.referenced_actor_name || owner?.referenced_actor_id || null;
}

/**
 * Best-effort deal value extraction. Attio's default deals object has a `value`
 * attribute; some workspaces use a custom currency attribute. Returns 0 if absent.
 */
export function dealValue(deal) {
  const v = deal?.values?.value?.[0];
  if (v == null) return 0;
  if (typeof v.currency_value === 'number') return v.currency_value;
  if (typeof v.value === 'number') return v.value;
  if (typeof v.value === 'string') {
    const n = parseFloat(v.value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/**
 * Returns the deal's full stage history as an array of
 * { title, from: Date, until: Date|null }, sorted ascending by `from`.
 * `until: null` means the entry is the current stage.
 */
export function stageHistory(deal) {
  const raw = deal?.values?.stage || [];
  return raw
    .map((s) => ({
      title: s?.status?.title || null,
      from: s?.active_from ? new Date(s.active_from) : null,
      until: s?.active_until ? new Date(s.active_until) : null,
    }))
    .filter((s) => s.title && s.from)
    .sort((a, b) => a.from - b.from);
}

export function currentStage(deal) {
  const hist = stageHistory(deal);
  const open = hist.find((s) => s.until === null);
  return open?.title || hist[hist.length - 1]?.title || null;
}

export function attioDealUrl(dealId, workspaceSlug) {
  return `https://app.attio.com/${workspaceSlug || 'navora-partners'}/deals/record/${dealId}`;
}
