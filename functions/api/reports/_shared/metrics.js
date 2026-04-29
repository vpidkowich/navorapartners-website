/**
 * Sales pipeline metrics. Pure functions over Attio deal records.
 *
 * Cancelled-stage rule (per user decision): TRANSIENT.
 *   "Eventual conversion" treats cancelled detours as not-disqualifying.
 *   Sankey forward edges still surface the detour visually so the rate of
 *   cancellations is observable; the headline conversion math ignores them.
 */

import { stageHistory, currentStage, dealId, dealName, dealValue, dealOwnerName } from './attio.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// ── Stat helpers ────────────────────────────────────────────────────

function median(nums) {
  const arr = nums.filter((n) => Number.isFinite(n)).slice().sort((a, b) => a - b);
  if (arr.length === 0) return null;
  const mid = arr.length >> 1;
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

function percentile(nums, p) {
  const arr = nums.filter((n) => Number.isFinite(n)).slice().sort((a, b) => a - b);
  if (arr.length === 0) return null;
  const idx = Math.min(arr.length - 1, Math.floor(arr.length * p));
  return arr[idx];
}

function days(ms) {
  return ms == null ? null : ms / DAY_MS;
}

function inWindow(date, start, end) {
  if (!date) return false;
  const t = date.getTime();
  return t >= start.getTime() && t < end.getTime();
}

function firstEntry(history, title) {
  return history.find((s) => s.title === title) || null;
}

function everEntered(history, title) {
  return history.some((s) => s.title === title);
}

// ── Core extraction ─────────────────────────────────────────────────

/**
 * Normalize raw Attio deals into the shape every downstream metric uses.
 */
export function normalizeDeals(rawDeals) {
  return rawDeals.map((d) => {
    const history = stageHistory(d);
    return {
      id: dealId(d),
      name: dealName(d),
      value: dealValue(d),
      owner: dealOwnerName(d),
      current: currentStage(d),
      history,
      // Convenience: set of stage titles ever entered (drops duplicates).
      everSet: new Set(history.map((s) => s.title)),
    };
  });
}

// ── Sankey-style forward edges (visualizes branches incl. cancelled) ─

/**
 * For every adjacent (A → B) transition observed across all deals,
 * count deals and median time-in-A before transition.
 *
 * Returns: [{ from, to, count, medianDaysInSource }]
 */
export function forwardEdges(deals) {
  const edgeMap = new Map();
  for (const deal of deals) {
    for (let i = 0; i < deal.history.length - 1; i++) {
      const a = deal.history[i];
      const b = deal.history[i + 1];
      if (!a.title || !b.title || a.title === b.title) continue;
      const key = `${a.title}__${b.title}`;
      let edge = edgeMap.get(key);
      if (!edge) {
        edge = { from: a.title, to: b.title, count: 0, durationsDays: [] };
        edgeMap.set(key, edge);
      }
      edge.count += 1;
      if (a.until && a.from) edge.durationsDays.push(days(a.until - a.from));
    }
  }
  return [...edgeMap.values()].map((e) => ({
    from: e.from,
    to: e.to,
    count: e.count,
    medianDaysInSource: median(e.durationsDays),
  }));
}

// ── Stage entry counts ──────────────────────────────────────────────

export function stageEntryCounts(deals, pipelineShape) {
  const result = {};
  for (const stage of pipelineShape.stages) {
    result[stage.title] = 0;
  }
  for (const deal of deals) {
    for (const title of deal.everSet) {
      if (result[title] != null) result[title] += 1;
    }
  }
  return result;
}

// ── Time-in-stage distributions ─────────────────────────────────────

/**
 * Per-stage median + p75 days spent in that stage (across all completed
 * stage entries — i.e. those with active_until set).
 */
export function timeInStage(deals, pipelineShape) {
  const buckets = new Map();
  for (const stage of pipelineShape.stages) buckets.set(stage.title, []);

  for (const deal of deals) {
    for (const entry of deal.history) {
      if (!entry.until || !entry.from) continue;
      const arr = buckets.get(entry.title);
      if (arr) arr.push(days(entry.until - entry.from));
    }
  }

  const result = {};
  for (const [title, arr] of buckets.entries()) {
    result[title] = {
      sampleSize: arr.length,
      medianDays: median(arr),
      p75Days: percentile(arr, 0.75),
    };
  }
  return result;
}

// ── Eventual (transient-cancelled) conversion along happy path ──────

/**
 * For each adjacent pair (A_i, A_{i+1}) on the canonical happy path,
 * compute "of deals that ever entered A_i, what % later entered A_{i+1}"
 * (cancelled detours allowed).
 */
export function happyPathConversion(deals, pipelineShape) {
  const result = [];
  const path = pipelineShape.happyPath;
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];

    let entered = 0;
    let progressed = 0;
    let strictNext = 0;

    for (const deal of deals) {
      const fromIdx = deal.history.findIndex((s) => s.title === from);
      if (fromIdx === -1) continue;
      entered += 1;

      // Eventual: did the deal reach `to` at any point after first entering `from`?
      const reached = deal.history.slice(fromIdx + 1).some((s) => s.title === to);
      if (reached) progressed += 1;

      // Strict: was `to` the immediate next stage (no detour)?
      const next = deal.history[fromIdx + 1];
      if (next && next.title === to) strictNext += 1;
    }

    result.push({
      from,
      to,
      entered,
      eventualConversion: entered ? progressed / entered : null,
      strictConversion: entered ? strictNext / entered : null,
    });
  }
  return result;
}

// ── Win rate and cycle length ───────────────────────────────────────

/**
 * Window-bound: a deal counts as "closed in window" if its first entry to
 * the won or lost stage falls within [windowStart, windowEnd).
 */
export function winRateInWindow(deals, pipelineShape, windowStart, windowEnd) {
  let won = 0;
  let lost = 0;
  for (const deal of deals) {
    const w = firstEntry(deal.history, pipelineShape.wonStage);
    const l = firstEntry(deal.history, pipelineShape.lostStage);
    if (w && inWindow(w.from, windowStart, windowEnd)) won += 1;
    else if (l && inWindow(l.from, windowStart, windowEnd)) lost += 1;
  }
  const total = won + lost;
  return {
    won,
    lost,
    total,
    winRate: total ? won / total : null,
  };
}

/**
 * Median sales cycle (Lead → Won) for deals that closed-won in window.
 */
export function medianCycleLengthInWindow(deals, pipelineShape, windowStart, windowEnd) {
  const samples = [];
  for (const deal of deals) {
    const lead = firstEntry(deal.history, pipelineShape.entryStage);
    const won = firstEntry(deal.history, pipelineShape.wonStage);
    if (!lead || !won) continue;
    if (!inWindow(won.from, windowStart, windowEnd)) continue;
    samples.push(days(won.from - lead.from));
  }
  return {
    sampleSize: samples.length,
    medianDays: median(samples),
    p75Days: percentile(samples, 0.75),
  };
}

// ── Open pipeline snapshot ──────────────────────────────────────────

export function openPipelineSnapshot(deals, pipelineShape, asOf) {
  const terminalTags = new Set(['won', 'lost']);
  const tagByTitle = new Map(pipelineShape.stages.map((s) => [s.title, s.tag]));

  let count = 0;
  let totalValue = 0;
  const byStage = {};

  for (const deal of deals) {
    const tag = tagByTitle.get(deal.current);
    if (!tag || terminalTags.has(tag)) continue;
    count += 1;
    totalValue += deal.value || 0;
    byStage[deal.current] = (byStage[deal.current] || 0) + 1;
  }
  return { asOf: asOf.toISOString(), count, totalValue, byStage };
}

// ── Currently stuck deals (top N by days in current stage) ──────────

export function stuckDeals(deals, pipelineShape, now, limit = 20) {
  const terminalTags = new Set(['won', 'lost']);
  const tagByTitle = new Map(pipelineShape.stages.map((s) => [s.title, s.tag]));
  const rows = [];

  for (const deal of deals) {
    const tag = tagByTitle.get(deal.current);
    if (!tag || terminalTags.has(tag)) continue;
    const open = deal.history.find((s) => s.until === null);
    if (!open) continue;
    rows.push({
      id: deal.id,
      name: deal.name,
      stage: deal.current,
      stageTag: tag,
      owner: deal.owner,
      value: deal.value,
      daysInStage: Math.floor(days(now - open.from)),
    });
  }
  rows.sort((a, b) => b.daysInStage - a.daysInStage);
  return rows.slice(0, limit);
}

// ── Monthly stage-entry trend (last N months) ───────────────────────

/**
 * For each stage and each calendar month over the last `months` months,
 * count distinct deals that first entered that stage in that month.
 *
 * Returns: { months: [{label, start, end}], series: { stageTitle: number[] } }
 */
export function monthlyStageEntries(deals, pipelineShape, asOf, months = 12) {
  const buckets = [];
  const start = new Date(asOf.getFullYear(), asOf.getMonth() - months + 1, 1);
  for (let i = 0; i < months; i++) {
    const s = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const e = new Date(start.getFullYear(), start.getMonth() + i + 1, 1);
    buckets.push({
      label: s.toISOString().slice(0, 7),
      start: s,
      end: e,
    });
  }

  const series = {};
  for (const stage of pipelineShape.stages) {
    series[stage.title] = new Array(months).fill(0);
  }

  for (const deal of deals) {
    const seenStages = new Set();
    for (const entry of deal.history) {
      if (seenStages.has(entry.title)) continue;
      seenStages.add(entry.title);
      for (let i = 0; i < buckets.length; i++) {
        if (inWindow(entry.from, buckets[i].start, buckets[i].end)) {
          if (series[entry.title]) series[entry.title][i] += 1;
          break;
        }
      }
    }
  }

  return {
    months: buckets.map((b) => b.label),
    series,
  };
}

// ── Rolling 90-day win rate and cycle length over last N months ─────

export function rollingTrend(deals, pipelineShape, asOf, months = 12) {
  const points = [];
  for (let i = months - 1; i >= 0; i--) {
    const end = new Date(asOf.getFullYear(), asOf.getMonth() - i + 1, 1);
    const start = new Date(end.getTime() - 90 * DAY_MS);
    const wr = winRateInWindow(deals, pipelineShape, start, end);
    const cl = medianCycleLengthInWindow(deals, pipelineShape, start, end);
    points.push({
      label: end.toISOString().slice(0, 7),
      end: end.toISOString(),
      winRate: wr.winRate,
      winSample: wr.total,
      medianCycleDays: cl.medianDays,
      cycleSample: cl.sampleSize,
    });
  }
  return points;
}

// ── Pipeline velocity ───────────────────────────────────────────────

/**
 * velocity = (open deals × win rate × median deal value) / median cycle days
 * Units: dollars per day. Standard B2B sales-leader metric.
 */
export function pipelineVelocity(openSnapshot, winRateData, cycleData, deals) {
  const valueSamples = deals.map((d) => d.value || 0).filter((v) => v > 0);
  const medianValue = median(valueSamples);
  if (
    !openSnapshot.count ||
    !winRateData.winRate ||
    !cycleData.medianDays ||
    !medianValue
  ) {
    return { value: null, perDay: null, inputs: { openCount: openSnapshot.count, winRate: winRateData.winRate, medianValue, medianCycleDays: cycleData.medianDays } };
  }
  const perDay =
    (openSnapshot.count * winRateData.winRate * medianValue) / cycleData.medianDays;
  return {
    value: perDay,
    perDay,
    inputs: {
      openCount: openSnapshot.count,
      winRate: winRateData.winRate,
      medianValue,
      medianCycleDays: cycleData.medianDays,
    },
  };
}

// ── Period helper ───────────────────────────────────────────────────

/**
 * Convert a window string ("30d", "90d", "365d", "all") into [start, end).
 */
export function resolveWindow(windowStr, now = new Date()) {
  const end = now;
  if (windowStr === 'all') {
    return { start: new Date(0), end, days: null };
  }
  const m = /^(\d+)d$/.exec(windowStr || '');
  const dayCount = m ? parseInt(m[1], 10) : 90;
  const start = new Date(end.getTime() - dayCount * DAY_MS);
  return { start, end, days: dayCount };
}

export function priorWindow({ start, end, days }, mode = 'prior-period') {
  if (days == null) return { start: new Date(0), end: start };
  if (mode === 'prior-year') {
    const ys = new Date(start);
    ys.setFullYear(ys.getFullYear() - 1);
    const ye = new Date(end);
    ye.setFullYear(ye.getFullYear() - 1);
    return { start: ys, end: ye, days };
  }
  // Prior period of same length, immediately preceding.
  return {
    start: new Date(start.getTime() - days * DAY_MS),
    end: new Date(start.getTime()),
    days,
  };
}

// ── Benchmarks layering ─────────────────────────────────────────────

export function benchmarkForStagePair(benchmarks, from, to) {
  const key = `${from}__${to}`;
  return benchmarks?.stagePairs?.[key] || null;
}

export function benchmarkForMetric(benchmarks, metricKey) {
  return benchmarks?.metrics?.[metricKey] || null;
}
