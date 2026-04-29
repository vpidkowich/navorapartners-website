/* ================================================================
   SALES PIPELINE REPORT — page logic
   Loads /api/reports/sales-pipeline and renders the dashboard.
   ================================================================ */

import {
  fmt,
  fetchReport,
  getParams,
  setParams,
  STAGE_TAG_COLORS,
  deltaClass,
  deltaArrow,
} from '../js/reports-shared.js';

const ENDPOINT = '/api/reports/sales-pipeline';

const charts = {};  // ECharts instances, keyed by element id

function $(id) { return document.getElementById(id); }

// ── Boot ────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const params = getParams({ window: '90d', compare: 'prior-period' });
  $('windowPicker').value = params.window;
  $('comparePicker').value = params.compare;

  $('windowPicker').addEventListener('change', () => loadAndRender(true));
  $('comparePicker').addEventListener('change', () => loadAndRender(true));
  $('refreshBtn').addEventListener('click', () => loadAndRender(true));
  window.addEventListener('resize', resizeAllCharts);

  // ECharts is loaded via <script defer>; wait for it to be available.
  whenEChartsReady(() => loadAndRender(false));
});

function whenEChartsReady(cb) {
  if (window.echarts) return cb();
  const interval = setInterval(() => {
    if (window.echarts) {
      clearInterval(interval);
      cb();
    }
  }, 50);
}

async function loadAndRender(updateUrl) {
  const windowVal = $('windowPicker').value;
  const compareVal = $('comparePicker').value;

  if (updateUrl) setParams({ window: windowVal, compare: compareVal });

  showLoading();
  try {
    const data = await fetchReport(ENDPOINT, { window: windowVal, compare: compareVal });
    hideLoading();
    render(data);
  } catch (err) {
    hideLoading();
    showError(err.message);
  }
}

function showLoading() {
  $('loadingState').style.display = '';
  $('errorState').style.display = 'none';
  $('reportContent').style.display = 'none';
  $('refreshBtn').disabled = true;
}

function hideLoading() {
  $('loadingState').style.display = 'none';
  $('refreshBtn').disabled = false;
}

function showError(msg) {
  $('errorState').textContent = `Failed to load report: ${msg}`;
  $('errorState').style.display = '';
  $('reportContent').style.display = 'none';
}

function render(data) {
  $('errorState').style.display = 'none';
  $('reportContent').style.display = '';
  $('lastRefreshed').textContent = `Refreshed ${fmt.timeAgo(data.generatedAt)}`;

  renderKpis(data);
  renderFunnel(data);
  renderStageTable(data);
  renderTrends(data);
  renderStuckDeals(data);
}

// ── KPI tiles ───────────────────────────────────────────────────

function renderKpis(data) {
  const k = data.kpis;

  // Win rate (down delta is bad)
  setKpi('kpiWinRate', {
    value: fmt.pct(k.winRate.current.winRate),
    delta: k.winRate.delta,
    invertDelta: false,
    bench: k.winRate.benchmark,
    benchFormat: (b) => `Industry: ${b.label}`,
    sparkData: data.trends.rolling.map((p) => p.winRate),
    sparkColor: STAGE_TAG_COLORS.progression,
    sparkPctMode: true,
  });

  // Pipeline velocity ($ / day)
  setKpi('kpiVelocity', {
    value: fmt.currencyPerDay(k.pipelineVelocity.value),
    delta: null,
    bench: null,
    sparkData: null,
  });

  // Median sales cycle (down delta is good — invert visual)
  setKpi('kpiCycle', {
    value: fmt.days(k.medianCycleDays.current.medianDays),
    delta: k.medianCycleDays.delta,
    invertDelta: true,
    bench: k.medianCycleDays.benchmark,
    benchFormat: (b) => `Industry: ${b.label}`,
    sparkData: data.trends.rolling.map((p) => p.medianCycleDays),
    sparkColor: STAGE_TAG_COLORS.progression,
  });

  // Open deal count
  setKpi('kpiOpen', {
    value: fmt.number(k.openDealCount),
    delta: null,
    bench: null,
    sparkData: null,
  });

  // Total open pipeline value
  setKpi('kpiPipeline', {
    value: fmt.currency(k.totalOpenPipelineValue),
    delta: null,
    bench: null,
    sparkData: null,
  });
}

function setKpi(id, opts) {
  const tile = $(id);
  if (!tile) return;
  tile.querySelector('.kpi-value').textContent = opts.value;

  const deltaEl = tile.querySelector('.kpi-delta');
  if (opts.delta == null) {
    deltaEl.textContent = '';
    deltaEl.className = 'kpi-delta flat';
  } else {
    deltaEl.textContent = `${deltaArrow(opts.delta)} ${fmt.pctDelta(Math.abs(opts.delta))}`;
    deltaEl.className = `kpi-delta ${deltaClass(opts.delta, opts.invertDelta)}`;
  }

  const benchEl = tile.querySelector('.kpi-bench');
  if (opts.bench && opts.benchFormat) {
    benchEl.textContent = opts.benchFormat(opts.bench);
    benchEl.title = `${opts.bench.source} — ${opts.bench.note || ''}`;
    benchEl.style.display = '';
  } else {
    benchEl.textContent = '';
    benchEl.style.display = 'none';
  }

  const sparkEl = tile.querySelector('.kpi-spark');
  if (opts.sparkData && opts.sparkData.some((v) => v != null)) {
    drawSparkline(sparkEl, opts.sparkData, opts.sparkColor || STAGE_TAG_COLORS.progression, !!opts.sparkPctMode);
  } else {
    sparkEl.style.display = 'none';
  }
}

function drawSparkline(el, values, color, pctMode) {
  const id = el.id || `spark-${Math.random().toString(36).slice(2, 8)}`;
  el.id = id;
  const chart = echarts.init(el);
  chart.setOption({
    grid: { left: 0, right: 0, top: 4, bottom: 4 },
    xAxis: { type: 'category', show: false, data: values.map((_, i) => i) },
    yAxis: { type: 'value', show: false, scale: true },
    series: [{
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { color, width: 1.5 },
      areaStyle: { color: color + '22' },
      data: values.map((v) => (v == null ? null : pctMode ? v * 100 : v)),
      connectNulls: true,
    }],
    tooltip: { show: false },
  });
  charts[id] = chart;
}

// ── Funnel (Sankey) ─────────────────────────────────────────────

function renderFunnel(data) {
  const { pipelineShape } = data.config;
  const orderByTitle = new Map(pipelineShape.stages.map((s) => [s.title, s.order]));
  const tagByTitle = new Map(pipelineShape.stages.map((s) => [s.title, s.tag]));
  const counts = data.funnel.entryCounts;

  const nodes = pipelineShape.stages
    .filter((s) => (counts[s.title] || 0) > 0)
    .map((s) => ({
      name: s.title,
      itemStyle: { color: STAGE_TAG_COLORS[s.tag] || '#888' },
      label: { color: '#181a1d', fontSize: 11, fontFamily: 'Satoshi' },
    }));

  // Filter out back-edges (cycles) — Sankey requires a DAG. Forward edges only.
  const edges = data.funnel.forwardEdges.filter((e) => {
    const so = orderByTitle.get(e.from);
    const to = orderByTitle.get(e.to);
    return so != null && to != null && so < to && e.count > 0;
  });

  const links = edges.map((e) => {
    const sourceTag = tagByTitle.get(e.from) || 'progression';
    const targetTag = tagByTitle.get(e.to) || 'progression';
    // Edge inherits the target's tag color so cancelled/lost destinations are visually obvious.
    const color = STAGE_TAG_COLORS[targetTag] || '#999';
    return {
      source: e.from,
      target: e.to,
      value: e.count,
      lineStyle: { color, opacity: 0.45, curveness: 0.55 },
      medianDays: e.medianDaysInSource,
    };
  });

  const el = $('funnelChart');
  const chart = charts.funnel || (charts.funnel = echarts.init(el));
  chart.setOption({
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(2, 71, 66, 0.95)',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontFamily: 'Satoshi', fontSize: 12 },
      formatter: (p) => {
        if (p.dataType === 'edge') {
          const days = p.data.medianDays != null ? `<br/>Median ${Math.round(p.data.medianDays)}d in source` : '';
          return `<b>${p.data.source}</b> → <b>${p.data.target}</b><br/>${p.data.value} deals${days}`;
        }
        return `<b>${p.name}</b><br/>${p.value || 0} deals entered`;
      },
    },
    series: [{
      type: 'sankey',
      orient: 'horizontal',
      nodeAlign: 'left',
      nodeGap: 12,
      nodeWidth: 14,
      emphasis: { focus: 'adjacency' },
      lineStyle: { curveness: 0.55 },
      label: { color: '#181a1d', fontSize: 11 },
      data: nodes,
      links,
      layoutIterations: 64,
    }],
  });
}

// ── Stage table ─────────────────────────────────────────────────

function renderStageTable(data) {
  const { pipelineShape } = data.config;
  const tisByTitle = data.funnel.timeInStage;
  const counts = data.funnel.entryCounts;
  const conv = data.funnel.happyPathConversion;
  const convByFrom = new Map(conv.map((c) => [c.from, c]));

  const tbody = $('stageTableBody');
  tbody.innerHTML = '';

  for (const stage of pipelineShape.stages) {
    const tis = tisByTitle[stage.title] || {};
    const c = convByFrom.get(stage.title);
    const tr = document.createElement('tr');

    let benchCell = '<span class="bench-delta absent">—</span>';
    if (c && c.benchmark && c.eventualConversion != null) {
      const delta = c.eventualConversion - c.benchmark.value;
      const cls = delta >= 0 ? 'above' : 'below';
      const sign = delta >= 0 ? '+' : '';
      benchCell = `<span class="bench-delta ${cls}" title="${c.benchmark.source}">${sign}${(delta * 100).toFixed(1)} pts vs ${c.benchmark.label}</span>`;
    }

    const convCell = c
      ? `${fmt.pct(c.eventualConversion)} <span style="opacity:.5;font-size:.85em" title="Strict (next-stage-only) conversion">(${fmt.pct(c.strictConversion)} strict)</span>`
      : '—';

    tr.innerHTML = `
      <td>
        <span class="stage-tag ${stage.tag}"></span>${stage.title}
      </td>
      <td class="num">${fmt.number(counts[stage.title] || 0)}</td>
      <td>${convCell}</td>
      <td class="num">${fmt.days(tis.medianDays)}</td>
      <td class="num">${fmt.days(tis.p75Days)}</td>
      <td>${benchCell}</td>
    `;
    tbody.appendChild(tr);
  }
}

// ── Trend charts ────────────────────────────────────────────────

function renderTrends(data) {
  renderVolumeTrend(data);
  renderRollingTrend(data);
}

function renderVolumeTrend(data) {
  const { pipelineShape } = data.config;
  const monthly = data.trends.monthlyEntries;
  const labels = monthly.months.map(fmt.monthLabel);
  const leadSeries = monthly.series[pipelineShape.entryStage] || [];
  const wonSeries = monthly.series[pipelineShape.wonStage] || [];
  const lostSeries = monthly.series[pipelineShape.lostStage] || [];

  const el = $('volumeChart');
  const chart = charts.volume || (charts.volume = echarts.init(el));
  chart.setOption({
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(2, 71, 66, 0.95)', textStyle: { color: '#fff' } },
    legend: { top: 0, textStyle: { fontFamily: 'Satoshi', fontSize: 11 } },
    grid: { left: 32, right: 12, top: 36, bottom: 24 },
    xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 10 } },
    series: [
      { name: 'New Leads', type: 'line', smooth: true, data: leadSeries, itemStyle: { color: STAGE_TAG_COLORS.progression }, areaStyle: { color: 'rgba(2, 71, 66, 0.10)' } },
      { name: 'Won',       type: 'line', smooth: true, data: wonSeries,  itemStyle: { color: STAGE_TAG_COLORS.won } },
      { name: 'Lost',      type: 'line', smooth: true, data: lostSeries, itemStyle: { color: STAGE_TAG_COLORS.lost } },
    ],
  });
}

function renderRollingTrend(data) {
  const points = data.trends.rolling;
  const labels = points.map((p) => fmt.monthLabel(p.label));
  const winSeries = points.map((p) => (p.winRate == null ? null : (p.winRate * 100).toFixed(1)));
  const cycleSeries = points.map((p) => p.medianCycleDays != null ? Math.round(p.medianCycleDays) : null);

  const el = $('rollingChart');
  const chart = charts.rolling || (charts.rolling = echarts.init(el));
  chart.setOption({
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(2, 71, 66, 0.95)', textStyle: { color: '#fff' } },
    legend: { top: 0, textStyle: { fontFamily: 'Satoshi', fontSize: 11 } },
    grid: { left: 40, right: 40, top: 36, bottom: 24 },
    xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 10 } },
    yAxis: [
      { type: 'value', name: 'Win %', position: 'left', axisLabel: { formatter: '{value}%', fontSize: 10 } },
      { type: 'value', name: 'Cycle (d)', position: 'right', axisLabel: { formatter: '{value}d', fontSize: 10 } },
    ],
    series: [
      { name: 'Rolling 90d Win %', type: 'line', smooth: true, yAxisIndex: 0, data: winSeries, itemStyle: { color: STAGE_TAG_COLORS.progression }, connectNulls: true },
      { name: 'Rolling 90d Cycle', type: 'line', smooth: true, yAxisIndex: 1, data: cycleSeries, itemStyle: { color: STAGE_TAG_COLORS.parked }, lineStyle: { type: 'dashed' }, connectNulls: true },
    ],
  });
}

// ── Stuck deals table ───────────────────────────────────────────

function renderStuckDeals(data) {
  const tbody = $('stuckTableBody');
  tbody.innerHTML = '';
  const rows = data.diagnostics.stuckDeals || [];

  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;opacity:0.5;padding:24px">No open deals — pipeline is empty.</td></tr>';
    return;
  }

  for (const r of rows) {
    const days = r.daysInStage;
    const pillClass = days >= 30 ? 'bad' : days >= 14 ? 'warn' : 'ok';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><a href="${r.attioUrl}" target="_blank" rel="noopener" class="deal-link">${escapeHtml(r.name)}</a></td>
      <td><span class="stage-tag ${r.stageTag}"></span>${escapeHtml(r.stage)}</td>
      <td><span class="days-pill ${pillClass}">${days}d</span></td>
      <td>${r.owner ? escapeHtml(r.owner) : '<span style="opacity:.5">—</span>'}</td>
      <td class="num">${r.value ? fmt.currency(r.value) : '<span style="opacity:.5">—</span>'}</td>
    `;
    tbody.appendChild(tr);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function resizeAllCharts() {
  for (const c of Object.values(charts)) {
    if (c && typeof c.resize === 'function') c.resize();
  }
}
