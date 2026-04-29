/**
 * Pages Function — GET /api/reports/sales-pipeline
 *
 * Aggregates the full Navora deals pipeline from Attio and returns a single
 * JSON payload that drives the entire sales-pipeline report page.
 *
 * Query params:
 *   window=30d|90d|365d|all   (default: 90d)
 *   compare=prior-period|prior-year   (default: prior-period)
 *
 * Caches the response at the edge for 5 minutes via the Cache API.
 */

import {
  fetchAllDeals,
  attioDealUrl,
} from './_shared/attio.js';
import {
  normalizeDeals,
  forwardEdges,
  stageEntryCounts,
  timeInStage,
  happyPathConversion,
  winRateInWindow,
  medianCycleLengthInWindow,
  openPipelineSnapshot,
  stuckDeals,
  monthlyStageEntries,
  rollingTrend,
  pipelineVelocity,
  resolveWindow,
  priorWindow,
  benchmarkForStagePair,
  benchmarkForMetric,
} from './_shared/metrics.js';
import pipelineShape from './_shared/pipeline-shape.json';
import benchmarks from './_shared/benchmarks.json';

const CACHE_TTL_SECONDS = 300;

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}${url.pathname}?${url.searchParams.toString()}`, {
    method: 'GET',
  });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  if (!env.ATTIO_API_KEY) {
    return jsonError(500, 'ATTIO_API_KEY not configured');
  }

  const windowParam = url.searchParams.get('window') || '90d';
  const compareParam = url.searchParams.get('compare') || 'prior-period';

  const now = new Date();
  const cur = resolveWindow(windowParam, now);
  const prev = priorWindow(cur, compareParam);

  let raw;
  try {
    raw = await fetchAllDeals(env.ATTIO_API_KEY);
  } catch (err) {
    return jsonError(502, `Attio query failed: ${err.message}`);
  }
  const deals = normalizeDeals(raw);

  const wsSlug = env.ATTIO_WORKSPACE_SLUG || 'navora-partners';

  // ── Current window aggregations ────────────────────────────────
  const winRate = winRateInWindow(deals, pipelineShape, cur.start, cur.end);
  const cycle = medianCycleLengthInWindow(deals, pipelineShape, cur.start, cur.end);
  const openSnapshot = openPipelineSnapshot(deals, pipelineShape, now);
  const velocity = pipelineVelocity(openSnapshot, winRate, cycle, deals);

  // ── Prior window for comparison ────────────────────────────────
  const winRatePrev = winRateInWindow(deals, pipelineShape, prev.start, prev.end);
  const cyclePrev = medianCycleLengthInWindow(deals, pipelineShape, prev.start, prev.end);

  // ── Stage-level math (uses full history; not window-bound) ─────
  const entries = stageEntryCounts(deals, pipelineShape);
  const tis = timeInStage(deals, pipelineShape);
  const conv = happyPathConversion(deals, pipelineShape);
  const edges = forwardEdges(deals);

  // ── Trends (12 months) ─────────────────────────────────────────
  const monthlyEntries = monthlyStageEntries(deals, pipelineShape, now, 12);
  const trend = rollingTrend(deals, pipelineShape, now, 12);

  // ── Stuck deals (action list) ──────────────────────────────────
  const stuck = stuckDeals(deals, pipelineShape, now, 20).map((d) => ({
    ...d,
    attioUrl: attioDealUrl(d.id, wsSlug),
  }));

  // ── Layer benchmarks onto conversion table ─────────────────────
  const conversionWithBenchmarks = conv.map((row) => ({
    ...row,
    benchmark: benchmarkForStagePair(benchmarks, row.from, row.to),
  }));

  const payload = {
    generatedAt: now.toISOString(),
    config: {
      pipelineShape,
      windowLabel: windowParam,
      compareMode: compareParam,
      window: { start: cur.start.toISOString(), end: cur.end.toISOString(), days: cur.days },
      prior:  { start: prev.start.toISOString(), end: prev.end.toISOString(), days: prev.days },
    },
    kpis: {
      winRate: {
        current: winRate,
        prior: winRatePrev,
        delta: deltaPct(winRate.winRate, winRatePrev.winRate),
        benchmark: benchmarkForMetric(benchmarks, 'winRate'),
      },
      medianCycleDays: {
        current: cycle,
        prior: cyclePrev,
        delta: deltaPct(cycle.medianDays, cyclePrev.medianDays),
        benchmark: benchmarkForMetric(benchmarks, 'medianSalesCycleDays'),
      },
      openDealCount: openSnapshot.count,
      totalOpenPipelineValue: openSnapshot.totalValue,
      pipelineVelocity: velocity,
    },
    funnel: {
      entryCounts: entries,
      timeInStage: tis,
      forwardEdges: edges,
      happyPathConversion: conversionWithBenchmarks,
    },
    trends: {
      monthlyEntries,
      rolling: trend,
    },
    diagnostics: {
      stuckDeals: stuck,
      totalDeals: deals.length,
    },
  };

  const body = JSON.stringify(payload);
  const response = new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `private, max-age=${CACHE_TTL_SECONDS}`,
      'X-Reports-Generated-At': payload.generatedAt,
    },
  });
  // Edge cache (mirrors max-age). Cache requires a cacheable Cache-Control;
  // we set `s-maxage` on the cached copy so cf cache respects it.
  const edgeCopy = new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, s-maxage=${CACHE_TTL_SECONDS}`,
      'X-Reports-Generated-At': payload.generatedAt,
    },
  });
  context.waitUntil(cache.put(cacheKey, edgeCopy));

  return response;
}

function deltaPct(curVal, prevVal) {
  if (curVal == null || prevVal == null || prevVal === 0) return null;
  return (curVal - prevVal) / prevVal;
}

function jsonError(status, error) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
