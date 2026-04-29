/* ================================================================
   NAVORA REPORTS — SHARED FRONTEND UTILITIES
   Formatters and fetch helpers used across all report pages.
   ================================================================ */

export const fmt = {
  pct(n, digits = 1) {
    if (n == null || !Number.isFinite(n)) return '—';
    return `${(n * 100).toFixed(digits)}%`;
  },

  pctDelta(n, digits = 1) {
    if (n == null || !Number.isFinite(n)) return '—';
    const sign = n > 0 ? '+' : '';
    return `${sign}${(n * 100).toFixed(digits)}%`;
  },

  number(n) {
    if (n == null || !Number.isFinite(n)) return '—';
    return Math.round(n).toLocaleString('en-US');
  },

  currency(n, opts = {}) {
    if (n == null || !Number.isFinite(n)) return '—';
    const compact = opts.compact !== false;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
      notation: compact && Math.abs(n) >= 10000 ? 'compact' : 'standard',
    }).format(n);
  },

  currencyPerDay(n) {
    if (n == null || !Number.isFinite(n)) return '—';
    return `${fmt.currency(n)}/day`;
  },

  days(n) {
    if (n == null || !Number.isFinite(n)) return '—';
    return `${Math.round(n)}d`;
  },

  monthLabel(s) {
    if (!s) return '';
    const [y, m] = s.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  },

  timeAgo(iso) {
    if (!iso) return '';
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  },
};

export async function fetchReport(endpoint, params = {}) {
  const url = new URL(endpoint, window.location.origin);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    let detail = txt;
    try { detail = JSON.parse(txt).error || txt; } catch {}
    throw new Error(`API ${res.status}: ${detail || res.statusText}`);
  }
  return await res.json();
}

/**
 * Read URL search params with defaults.
 */
export function getParams(defaults = {}) {
  const out = { ...defaults };
  const sp = new URL(window.location.href).searchParams;
  for (const k of Object.keys(defaults)) {
    const v = sp.get(k);
    if (v != null) out[k] = v;
  }
  return out;
}

export function setParams(params) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(params)) {
    if (v == null) url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  }
  window.history.replaceState({}, '', url.toString());
}

/**
 * Stage tag → CSS color (mirrors the .stage-tag.* classes in reports.css).
 * Used for ECharts node colors so the visual matches the table tags.
 */
export const STAGE_TAG_COLORS = {
  progression: '#024742',
  cancelled:   '#9aa3a8',
  parked:      '#d4a64a',
  won:         '#ffe174',
  lost:        '#b8242e',
};

export function deltaClass(n, invert = false) {
  if (n == null || !Number.isFinite(n) || Math.abs(n) < 0.005) return 'flat';
  const direction = n > 0 ? 'up' : 'down';
  return invert ? `${direction} invert` : direction;
}

export function deltaArrow(n) {
  if (n == null || !Number.isFinite(n) || Math.abs(n) < 0.005) return '–';
  return n > 0 ? '▲' : '▼';
}
