# CRM Integration — File Map

This repo contains three layers (see [CLAUDE.md](CLAUDE.md) for the full project context):

1. **Marketing website** — the static site at navorapartners.com.
2. **CRM integration** — lead capture forms, Attio CRM sync, Slack notifications, Google Sheets backup, deal-stage webhook.
3. **Reports / BI Hub** — internal dashboard at `/reports/` that reads from Attio (the CRM). Documented in [CLAUDE.md](CLAUDE.md) under "Reports / BI Hub".

This file is a **signpost** for layer 2 and includes the Attio-reading endpoints from layer 3. The complete documentation for layer 2 lives in [crm-integration/FORM-SYSTEM-README.md](crm-integration/FORM-SYSTEM-README.md). Use the map below to find any CRM-related file at a glance.

---

## File map

CRM-related code is split across three locations because Cloudflare Pages enforces a fixed directory structure for Functions and the public site root. Files marked **(deploy-bound)** must stay where they are; everything else lives under `crm-integration/`.

### `crm-integration/` — owned by this layer
| Path | Purpose |
|------|---------|
| [crm-integration/FORM-SYSTEM-README.md](crm-integration/FORM-SYSTEM-README.md) | Source-of-truth documentation for the entire CRM/form system |
| [crm-integration/scripts/setup-attio-attributes.js](crm-integration/scripts/setup-attio-attributes.js) | One-time setup: creates custom People attributes in Attio (revenue, UTM, geo, etc.) |
| [crm-integration/scripts/setup-attio-deal-stages.js](crm-integration/scripts/setup-attio-deal-stages.js) | One-time setup: creates the 15 custom Growth Strategy deal stages |
| [crm-integration/scripts/setup-attio-talent-attributes.js](crm-integration/scripts/setup-attio-talent-attributes.js) | One-time setup: creates People + Deals attributes for the Talent pipeline |
| [crm-integration/scripts/setup-attio-talent-list.js](crm-integration/scripts/setup-attio-talent-list.js) | One-time setup: creates the "Talent" List on Deals plus its 9 stages |
| [crm-integration/scripts/google-sheets-appscript.js](crm-integration/scripts/google-sheets-appscript.js) | Apps Script for the Growth Strategy Sheets backup |
| [crm-integration/scripts/google-sheets-talent-appscript.js](crm-integration/scripts/google-sheets-talent-appscript.js) | Apps Script for the Talent Submissions Sheets backup |

### `functions/api/` — Cloudflare Pages Functions (deploy-bound)
| Path | Purpose |
|------|---------|
| [functions/api/submit-form.js](functions/api/submit-form.js) | Receives Growth Strategy form submissions, writes to Attio, fires Slack + Sheets |
| [functions/api/attio-webhook.js](functions/api/attio-webhook.js) | Receives Attio deal-stage-change webhooks, fires Slack |
| [functions/api/submit-resume.js](functions/api/submit-resume.js) | Receives Talent (careers) form submissions, writes to Attio Talent List, fires Slack + Sheets |
| [functions/api/reports/_middleware.js](functions/api/reports/_middleware.js) | Cloudflare Access JWT verification for all `/api/reports/*` endpoints (Reports layer) |
| [functions/api/reports/sales-pipeline.js](functions/api/reports/sales-pipeline.js) | Reads all deals from Attio, returns aggregated pipeline metrics for the dashboard (Reports layer) |
| [functions/api/reports/_shared/attio.js](functions/api/reports/_shared/attio.js) | Paginated Attio deals client + deal helpers (Reports layer) |
| [functions/api/reports/_shared/metrics.js](functions/api/reports/_shared/metrics.js) | Pure stage-history math: conversion, time-in-stage, cycle length, velocity (Reports layer) |
| [functions/api/reports/_shared/pipeline-shape.json](functions/api/reports/_shared/pipeline-shape.json) | Canonical 16-stage Navora pipeline definition; titles must match Attio (Reports layer) |
| [functions/api/reports/_shared/benchmarks.json](functions/api/reports/_shared/benchmarks.json) | HubSpot/Pavilion B2B benchmarks with cited sources (Reports layer) |

### `public/` — site assets the form depends on (deploy-bound)
| Path | Purpose |
|------|---------|
| [public/js/form-lightbox.js](public/js/form-lightbox.js) | Renders the Growth Strategy form lightbox on every page |
| [public/lead-confirmed.html](public/lead-confirmed.html) | Post-submit confirmation page |
| [public/css/lead-confirmed.css](public/css/lead-confirmed.css) | Confirmation page styling |
| [public/css/components.css](public/css/components.css) | Contains the form lightbox styles (mixed with site components) |
| [public/images/grinning-slackbot.png](public/images/grinning-slackbot.png) | Slack notification icon |
| [public/reports/index.html](public/reports/index.html) | Reports BI hub home (Reports layer) |
| [public/reports/sales-pipeline/index.html](public/reports/sales-pipeline/index.html) | Sales pipeline analytics dashboard (Reports layer) |
| [public/reports/css/reports.css](public/reports/css/reports.css) | Dashboard styles (Reports layer) |
| [public/reports/js/reports-shared.js](public/reports/js/reports-shared.js) | Shared frontend utilities for reports (Reports layer) |
| [public/reports/js/sales-pipeline.js](public/reports/js/sales-pipeline.js) | Sales pipeline page logic + ECharts configs (Reports layer) |

---

## Why the split?

Cloudflare Pages requires:
- Serverless functions to live at `functions/api/*` exactly.
- The deployed site to be served from `public/`.

The `public/js/form-lightbox.js` and `public/lead-confirmed.html` files have to live in `public/` because they're loaded by the live site. Everything else — setup scripts, Apps Script source, documentation — has no deploy constraint and lives under `crm-integration/` for clarity.

If you're new here and want to understand the system end-to-end, start with [crm-integration/FORM-SYSTEM-README.md](crm-integration/FORM-SYSTEM-README.md).
