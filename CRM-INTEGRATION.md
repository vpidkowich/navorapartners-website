# CRM Integration — File Map

This repo contains two layers (see [CLAUDE.md](CLAUDE.md) for the full project context):

1. **Marketing website** — the static site at navorapartners.com.
2. **CRM integration** — lead capture forms, Attio CRM sync, Slack notifications, Google Sheets backup, deal-stage webhook.

This file is a **signpost** for layer 2. The complete documentation lives in [crm-integration/FORM-SYSTEM-README.md](crm-integration/FORM-SYSTEM-README.md). Use the map below to find any CRM-related file at a glance.

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

### `public/` — site assets the form depends on (deploy-bound)
| Path | Purpose |
|------|---------|
| [public/js/form-lightbox.js](public/js/form-lightbox.js) | Renders the Growth Strategy form lightbox on every page |
| [public/lead-confirmed.html](public/lead-confirmed.html) | Post-submit confirmation page |
| [public/css/lead-confirmed.css](public/css/lead-confirmed.css) | Confirmation page styling |
| [public/css/components.css](public/css/components.css) | Contains the form lightbox styles (mixed with site components) |
| [public/images/grinning-slackbot.png](public/images/grinning-slackbot.png) | Slack notification icon |

---

## Why the split?

Cloudflare Pages requires:
- Serverless functions to live at `functions/api/*` exactly.
- The deployed site to be served from `public/`.

The `public/js/form-lightbox.js` and `public/lead-confirmed.html` files have to live in `public/` because they're loaded by the live site. Everything else — setup scripts, Apps Script source, documentation — has no deploy constraint and lives under `crm-integration/` for clarity.

If you're new here and want to understand the system end-to-end, start with [crm-integration/FORM-SYSTEM-README.md](crm-integration/FORM-SYSTEM-README.md).
