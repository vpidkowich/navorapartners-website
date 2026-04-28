# Navora Growth Strategy Form — System Documentation

> **This README documents a sub-project within the larger Navora Partners website repo.**
> It covers ONLY the lead capture form system — the form itself, the backend that processes submissions, the Attio CRM integration, the Slack notifications, the Google Sheets backup, and the deal-stage-change webhook. **It does not cover the rest of the marketing website** (homepage sections, case studies, team pages, design system, etc.).

---

## Relationship to the parent project

This repo (`vpidkowich/navorapartners-website`) contains two distinct layers that share a single deploy pipeline:

### Layer 1 — The Marketing Website
- Static HTML/CSS/JS for navorapartners.com
- Homepage, about page, case studies, careers page, sitemap, etc.
- Documented in `CLAUDE.md` (project overview, design system, section maps, spacing tokens, responsive breakpoints, hosting notes)
- Lives primarily in `public/` (minus the form-specific files)

### Layer 2 — The Lead Capture System *(this README)*
- Form UI rendered as a lightbox on top of any website page
- Cloudflare Pages Functions that handle form submissions and Attio webhooks
- One-time setup scripts for Attio CRM configuration
- Slack + Google Sheets integrations
- Documented here in `FORM-SYSTEM-README.md`

**Why one repo?** Cloudflare Pages Functions must live in the same repo as the site they serve — that's a technical constraint of the platform. Splitting would require rebuilding the backend as a separate Cloudflare Worker with its own domain and cross-origin calls, adding complexity for zero benefit.

### How to tell which files belong to which layer

| Layer | Files / folders |
|-------|----------------|
| **Website (Layer 1)** | `public/index.html`, `public/about.html`, `public/careers.html`, `public/case-studies.html`, `public/case-studies/**/*.html`, `public/sitemap.html`, `public/css/variables.css`, `public/css/layout.css`, `public/images/`, `public/fonts/`, `designs/`, `instructions/`, `references/`, `seo/` |
| **Form system (Layer 2, this README)** | `public/js/form-lightbox.js`, `public/lead-confirmed.html`, `public/css/lead-confirmed.css`, the form-related section of `public/css/components.css`, `functions/api/submit-form.js`, `functions/api/attio-webhook.js`, `functions/api/submit-resume.js`, `crm-integration/crm-integration/scripts/setup-attio-attributes.js`, `crm-integration/crm-integration/scripts/setup-attio-deal-stages.js`, `crm-integration/crm-integration/scripts/setup-attio-talent-attributes.js`, `crm-integration/crm-integration/scripts/setup-attio-talent-list.js`, `crm-integration/crm-integration/scripts/google-sheets-appscript.js`, `crm-integration/crm-integration/scripts/google-sheets-talent-appscript.js`, `public/images/grinning-slackbot.png`, `crm-integration/FORM-SYSTEM-README.md` |
| **Shared** | `public/css/components.css` (contains both website components AND form lightbox styles), all 16 HTML pages (each loads `form-lightbox.js` so the form can open from any page) |

### Filtering commit history by layer

```bash
# Form system changes only
git log -- functions/ crm-integration/ public/js/form-lightbox.js public/lead-confirmed.html public/css/lead-confirmed.css

# Website changes only (excluding form system)
git log -- public/ ':(exclude)public/js/form-lightbox.js' ':(exclude)public/lead-confirmed.html' ':(exclude)public/css/lead-confirmed.css'
```

### Commit message conventions

Form-system commits should start with a prefix that makes the layer obvious, e.g.:
- `Form lightbox: ...`
- `Attio custom fields: ...`
- `Webhook: ...`
- `Slack notification: ...`
- `Deal stages: ...`

Website commits use prefixes like:
- `Homepage: ...`
- `Case study — <name>: ...`
- `Careers: ...`
- `Design system: ...`

---

## High-level overview

When a visitor fills out the Growth Strategy form on any page, the system:

1. Validates the form in the browser
2. Sends it to a Cloudflare Pages Function (serverless proxy)
3. Creates records in Attio CRM (Person + Company + Deal)
4. Sends a Slack notification
5. Logs a backup row to a Google Sheet
6. Redirects the user to a confirmation page

Separately, when anyone moves a deal in Attio to the **"Context Call - Scheduled"** stage, a webhook automatically:

1. Switches the deal owner from Victor to Chaky
2. Posts an @-mention to Chaky in Slack with the deal/person/company details

---

## Architecture

```
┌──────────────┐       ┌────────────────────┐       ┌─────────────────┐
│   Visitor    │──────▶│  /api/submit-form  │──────▶│     Attio       │
│  (browser)   │  POST │  (Pages Function)  │       │  Person+Company │
└──────────────┘       │                    │       │     +Deal       │
                       │  Verifies          │       └─────────────────┘
                       │  Turnstile,        │       ┌─────────────────┐
                       │  sanitizes,        │──────▶│      Slack      │
                       │  orchestrates:     │       └─────────────────┘
                       │                    │       ┌─────────────────┐
                       │                    │──────▶│  Google Sheet   │
                       └────────────────────┘       └─────────────────┘
                                │
                                │ redirect
                                ▼
                       ┌────────────────────┐
                       │ /lead-confirmed.html│
                       └────────────────────┘

┌──────────────┐       ┌────────────────────┐
│    Attio     │──────▶│ /api/attio-webhook │──────▶ Updates deal owner
│  (any deal   │  POST │  (Pages Function)  │        + Slack notification
│  stage edit) │       └────────────────────┘
└──────────────┘
```

---

## File map

### Frontend (client-side)

| File | Purpose |
|------|---------|
| `public/js/form-lightbox.js` | Injects the form HTML, handles validation, intl-tel-input, Turnstile, submission |
| `public/css/components.css` | Form lightbox styles (navy background, gold focus, responsive) |
| `public/lead-confirmed.html` | Thank-you page shown after successful submission |
| `public/css/lead-confirmed.css` | Styles for the thank-you page |
| 16× `public/**/*.html` | Every page loads `form-lightbox.js` and wires up "growth strategy" CTAs |

### Backend (Cloudflare Pages Functions)

| File | Endpoint | Purpose |
|------|----------|---------|
| `functions/api/submit-form.js` | `POST /api/submit-form` | Receives form data, verifies Turnstile, creates Attio records, sends Slack + Google Sheets |
| `functions/api/attio-webhook.js` | `POST /api/attio-webhook` | Receives Attio webhook events, handles deal-stage-change automations |

### Cloudflare Workers (separate from Pages, scheduled via cron)

| Worker | Trigger | Purpose |
|--------|---------|---------|
| `crm-integration/workers/stale-deal-checker/` | Cron `0 9 * * *` (daily 09:00 UTC) | Finds deals stuck in "Growth Strategy Sent" for > 7 days; creates an Attio Task on the deal owner referencing the "5b. TEMPLATE - Followup Email if Sales Call not Booked" template, and posts to Slack #sales. Dedupes via the `stale_alert_sent_at` Deal attribute (6-day cooldown). |

### One-time setup scripts (run locally)

| File | Purpose |
|------|---------|
| `crm-integration/scripts/setup-attio-attributes.js` | Creates 13 custom People attributes in Attio (revenue_range, utm_*, gclid, geo_*, ip_address, lead_source) |
| `crm-integration/scripts/setup-attio-deal-attributes.js` | Creates custom Deal attributes (currently `stale_alert_sent_at`, used by the stale-deal-checker worker for dedupe) |
| `crm-integration/scripts/setup-attio-deal-stages.js` | Creates the 16 custom deal stages and archives Attio's defaults |
| `crm-integration/scripts/setup-demo-marker.js` | Adds an `is_demo` (checkbox, title "Demo Data") attribute to Companies and Deals. Used by the seed/cleanup scripts below to tag and bulk-clean demo records |
| `crm-integration/scripts/seed-demo-deals.js` | Seeds 100 realistic demo deals across all 16 pipeline stages (varied verticals, geos, traffic sources, revenue tiers, deal values $50K–$50M). Tags every record with `is_demo = true` (Deals/Companies) and `lead_source = "Demo Data"` (People). Hits the Attio API directly — bypasses Turnstile, Slack, and Google Sheets. Tracks created record IDs in `.demo-data-ids.json` (gitignored) |
| `crm-integration/scripts/cleanup-demo-data.js` | Deletes everything created by `seed-demo-deals.js`, in dependency order (deals → people → companies). Uses `.demo-data-ids.json` by default; pass `--full-sweep` to also query Attio for any tagged records the IDs file may have missed |
| `crm-integration/scripts/google-sheets-appscript.js` | Google Apps Script code (paste into Apps Script editor) that accepts POST requests and appends rows to the backup sheet |

---

## Form submission flow (detailed)

### 1. Browser → form-lightbox.js

When any page loads:
- `form-lightbox.js` captures UTM params + gclid from the URL and stores them in `sessionStorage`
- The form HTML is dynamically injected into the page as `<div class="form-lightbox">...</div>`
- `intl-tel-input` is initialized on the phone field (country selector with search, divider after preferred countries)
- All "growth strategy" CTA buttons/links get a click listener that opens the lightbox

When the user clicks a CTA:
- Lightbox becomes visible (`.active` class)
- First name field auto-focuses
- Cloudflare Turnstile widget renders invisibly into a hidden container when the form opens. The challenge runs in the background — no UI is shown to the user.
- Hidden UTM fields are populated from session storage
- Client timezone captured via `Intl.DateTimeFormat().resolvedOptions().timeZone`

When the user submits:
- Client-side validation runs:
  - First/last name required
  - Email required, TLD checked against list of ~100 valid TLDs
  - Phone required, must have ≥7 digits
  - Revenue required (dropdown)
  - Website required, TLD checked, whitespace rejected
- Honeypot field `company_name` is collected (if bots fill it, the server silently returns success)
- Turnstile token is read from the rendered widget via `turnstile.getResponse()`. Because the widget is invisible, the user may experience a 1–3 second "Submitting..." delay while the background challenge completes — this is normal and expected.
- Website URL is normalized (prepends `https://` if missing)
- Data POSTed to `/api/submit-form`

On response:
- **Success** → `window.location.href = '/lead-confirmed'`
- **Error** → Orange error banner shown inside the lightbox, Turnstile resets for retry

### 2. Cloudflare Pages Function → `functions/api/submit-form.js`

Steps:

1. **Parse and validate JSON body**
2. **Honeypot check** — if `company_name` is non-empty, return `{ success: true }` silently (bots get no error signal)
3. **Verify Turnstile token** via `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`
4. **Sanitize inputs** — strip HTML tags, trim whitespace
5. **Validate required fields** — first_name, last_name, email + email format regex
6. **Collect Cloudflare geo data** from `request.cf`:
   - IP: `CF-Connecting-IP` header
   - Timezone: `request.cf.timezone`
   - City: `request.cf.city`
   - Region: `request.cf.region`
   - Country: `request.cf.country`
7. **Upsert Company in Attio** by `domains` attribute (extracted from website URL). Returns the company record ID.
8. **Upsert Person in Attio** by `email_addresses` attribute. Includes all custom fields:
   - `name` (first/last/full)
   - `email_addresses`
   - `phone_numbers`
   - `company` relationship (linked to the Company record)
   - `revenue_range` (select)
   - `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid` (text)
   - `lead_source` = "Growth Strategy Form"
   - `ip_address`, `geo_city`, `geo_region`, `geo_country`, `geo_timezone` (text)
   - Fallback: if the upsert with custom fields fails (e.g., attribute not yet created), retries with core fields only so the record still gets created.
9. **Create Deal in Attio**:
   - Name: `{First} {Last} — {domain}` (e.g., "Marty McFly — hoverboardsupreme.com")
   - Stage: `Lead`
   - Owner: `victor@navorapartners.com`
   - `associated_people` → linked to the Person record
   - `associated_company` → linked to the Company record
10. **Send Slack notification** (non-blocking) — posts to `SLACK_WEBHOOK_URL` with Sales Bot 9000 avatar
11. **Log to Google Sheet** (non-blocking) — POSTs all form + geo data to the Apps Script web app URL which appends a row
12. Returns `{ success: true }` (or an error with status code)

### 3. Confirmation page → `public/lead-confirmed.html`

- Has `<meta name="robots" content="noindex, nofollow">` (post-conversion, no SEO value)
- Same header + footer as all other pages (uses shared design system)
- "You're One Step Away" headline + subtitle
- Placeholder for a video embed
- Placeholder for a Cal.com booking embed

---

## Deal stage change flow (Attio webhook)

When anyone updates a deal in Attio (via UI or API), Attio fires a `record.updated` webhook to `/api/attio-webhook`.

### 1. Attio → `functions/api/attio-webhook.js`

Steps:

1. **Parse the event payload**
2. **Scan the entire payload for UUID strings** (defensive: we don't rely on a specific Attio payload shape, we just look for record IDs anywhere in the body)
3. **For each candidate UUID, try to fetch it as a deal**:
   - `GET /v2/objects/deals/records/{id}` — if 404, it's not a deal, skip
   - If it's a deal, check:
     - Current stage = `Context Call - Scheduled`?
     - Current owner ≠ Chaky? (prevents infinite loop — the owner PATCH below triggers another webhook)
4. **If both checks pass**:
   - PATCH the deal to set `owner` to `chaky@navorapartners.com`
   - Fetch the associated Person record to get the full name
   - Fetch the associated Company record to get the name
   - Send a Slack notification to the main channel:
     ```
     @Chaky A context call has been scheduled with *Marty McFly* from *hoverboardsupreme.com*.
     You're now the deal owner for "Marty McFly — hoverboardsupreme.com".
     ```
5. **Only process one deal per payload** (break after first match)
6. Always returns `{ ok: true }` so Attio doesn't retry

### 2. Webhook subscription

Registered in Attio via the API:
- Endpoint: `https://navorapartners.com/api/attio-webhook`
- Event: `record.updated`
- Filter: `$and: []` (empty — subscribes to ALL record updates; handler filters inside)
- Status: `active`

---

## Stale deal alerting (Cloudflare Worker, daily cron)

Separate from the Pages app, a standalone Cloudflare Worker at `crm-integration/workers/stale-deal-checker/` runs once a day and surfaces deals that have gone cold.

### What it does

Cron fires at `0 9 * * *` (09:00 UTC daily). The worker:

1. Queries every active deal from Attio (paginated 500/page).
2. Filters to deals whose **current** stage entry has `status.title === "Growth Strategy Sent"` (configurable via `TARGET_STAGE` var in `wrangler.toml`).
3. Computes `daysInStage = now − stage.active_from`. If less than `STALE_DAYS` (default 7), skips.
4. Reads the deal's `stale_alert_sent_at` attribute. If it was set within the last `COOLDOWN_DAYS` (default 6), skips — prevents re-alerting every day for the same stuck deal.
5. For each deal that survives the filters:
   - **Creates an Attio Task** linked to the deal, assigned to the deal's current owner, due in 24h, content: *"`<deal name>` has been in `Growth Strategy Sent` for N days. Send the `5b. TEMPLATE - Followup Email if Sales Call not Booked` email template to follow up."*
   - **Posts a Slack message** to `#sales` via `SLACK_WEBHOOK_URL` (reused from Pages), formatted as: *":hourglass_flowing_sand: *Stale deal:* `<deal name>` — owner: *<owner first name>* — *N days* in *Growth Strategy Sent*. Send the *5b. TEMPLATE - Followup Email if Sales Call not Booked* template. <link to deal in Attio>"*
   - **Stamps `stale_alert_sent_at`** on the deal with the current timestamp (the dedupe attribute).

### Manual testing

The worker also exposes a `fetch` handler for manual invocation, gated by a shared secret:

```
GET https://<worker-url>/?token=<MANUAL_TRIGGER_TOKEN>&dryRun=true
```

`dryRun=true` reports what would be alerted without actually creating tasks, posting Slack, or stamping the dedupe attribute. Drop `dryRun` to do a real run on demand.

### Deploy

See **Setup → 6. Deploy stale-deal-checker worker** below.

### Tuning

Constants live in `wrangler.toml [vars]` — change `TARGET_STAGE`, `STALE_DAYS`, `COOLDOWN_DAYS`, or `EMAIL_TEMPLATE_NAME` and re-deploy. To monitor multiple stages, the worker would need a small refactor (currently single-stage).

---

## Environment variables (Cloudflare Pages)

Set in **Cloudflare Dashboard → Workers & Pages → navorapartners-website → Settings → Variables and Secrets**:

| Variable | Type | Purpose |
|----------|------|---------|
| `ATTIO_API_KEY` | Secret | Bearer token for Attio API |
| `TURNSTILE_SECRET_KEY` | Secret | Server-side Turnstile verification |
| `SLACK_WEBHOOK_URL` | Secret | Slack incoming webhook for notifications |
| `GOOGLE_SHEET_WEBHOOK_URL` | Secret | Google Apps Script web app URL for backup logging |

Also hardcoded in `public/js/form-lightbox.js`:
- `TURNSTILE_SITE_KEY` — public, not a secret

---

## Initial setup (one-time, already completed)

### 1. Run Attio attribute setup

Creates the 13 custom People attributes (revenue_range, UTMs, gclid, geo_*, ip_address, lead_source):

```bash
ATTIO_API_KEY=your_key node crm-integration/scripts/setup-attio-attributes.js
```

**Important**: The `revenue_range` select attribute is created empty. Run the revenue options creation one-off (already done) or manually add options in Attio matching the form's dropdown values:
- Under $500K, $500K – $1M, $1M – $3M, $3M – $5M, $5M – $10M, $10M – $25M, $25M+
- The dash must be the en-dash (U+2013, `–`), not a regular hyphen

### 2. Run deal stages setup

Creates the 16 custom deal stages and archives Attio's defaults:

```bash
ATTIO_API_KEY=your_key node crm-integration/scripts/setup-attio-deal-stages.js
```

Stages (in funnel order — display order is controlled by dragging in the Attio UI):
1. Lead *(default for new deals)*
2. Qualifying Call Booked
3. Call Cancelled
4. Call Complete - Good Fit
5. Call Complete - Not a Good Fit
6. Call Complete - Sent ICP Elevation
7. Call Complete - Follow Up Later
8. **Context Call - Scheduled** *(celebration enabled; triggers owner switch to Chaky)*
9. Context Call - Cancelled
10. Context Call - Complete *(celebration enabled)*
11. Growth Strategy Sent *(celebration enabled)*
12. Key Findings - Call Booked
13. Key Findings - Call Cancelled
14. Followup
15. Won 🎉 *(celebration enabled)*
16. Lost

### 3. Register the Attio webhook

Only needs to happen once. The current webhook ID is stored in Attio (view via `GET https://api.attio.com/v2/webhooks`). If you ever need to recreate it:

```bash
ATTIO_API_KEY=your_key node -e "
(async () => {
  const res = await fetch('https://api.attio.com/v2/webhooks', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.ATTIO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        target_url: 'https://navorapartners.com/api/attio-webhook',
        subscriptions: [
          { event_type: 'record.updated', filter: { \$and: [] } }
        ]
      }
    }),
  });
  console.log(await res.text());
})();
"
```

### 4. Set up Google Sheet backup

1. Create a Google Sheet with headers: `Timestamp | First Name | Last Name | Email | Phone | Revenue | Website | UTM Source | UTM Medium | UTM Campaign | UTM Content | UTM Term | GCLID | IP | City | Region | Country | Timezone`
2. Extensions → Apps Script → paste contents of `crm-integration/scripts/google-sheets-appscript.js`
3. Deploy → New Deployment → Web App → Execute as: Me, Access: Anyone
4. Copy the web app URL → set as `GOOGLE_SHEET_WEBHOOK_URL` in Cloudflare env vars

### 5. Set up Slack webhook

1. Go to api.slack.com/apps → Create New App → From Scratch → name "Sales Bot 9000" or similar
2. Features → Incoming Webhooks → Activate → Add New Webhook to Workspace → select target channel
3. Copy webhook URL → set as `SLACK_WEBHOOK_URL` in Cloudflare env vars
4. The bot uses `icon_url` pointing at the Slack emoji image URL for `:grinning-slackbot:` (hardcoded in the function)

### 6. Deploy stale-deal-checker worker

A separate Cloudflare Worker (not part of the Pages project) runs the daily stale-deal alerting (see "Stale deal alerting" section above for what it does). Deploy steps:

```bash
# One-time on the local machine
npm install -g wrangler
wrangler login   # opens a browser to authorize Cloudflare

# One-time: create the Attio dedupe attribute
ATTIO_API_KEY=your_key node crm-integration/scripts/setup-attio-deal-attributes.js

# Move into the worker directory
cd crm-integration/workers/stale-deal-checker

# Set secrets (will prompt for value, never written to disk)
wrangler secret put ATTIO_API_KEY            # paste the same Attio token
wrangler secret put SLACK_WEBHOOK_URL        # paste the existing #sales webhook URL
wrangler secret put MANUAL_TRIGGER_TOKEN     # paste any random string (used for manual HTTP testing)

# Deploy
wrangler deploy
```

The worker URL is printed at the end of `wrangler deploy`. Test with:

```bash
curl "https://<worker-url>/?token=<MANUAL_TRIGGER_TOKEN>&dryRun=true"
```

The cron is configured in `wrangler.toml` (`crons = ["0 9 * * *"]`) — it begins firing automatically after the first deploy. Logs are visible via `wrangler tail` while it's running, or in Cloudflare Dashboard → Workers & Pages → `navora-stale-deal-checker` → Logs.

### 7. Set up Cloudflare Turnstile

The widget is configured in **Invisible** mode at the dashboard level — no visible CAPTCHA UI is shown to users. The challenge runs in the background when the form opens, and the token is collected on submit.

1. Cloudflare Dashboard → Turnstile → Add Site
2. Domain: `navorapartners.com`, `*.navorapartners.com`, `localhost`
3. Widget Mode: **Invisible** (no visible CAPTCHA UI; runs in background)
4. Copy site key → replace `TURNSTILE_SITE_KEY` in `public/js/form-lightbox.js`
5. Copy secret key → set as `TURNSTILE_SECRET_KEY` in Cloudflare env vars

The current site key is `0x4AAAAAAC3KURli7VfZzOC7`.

---

## Deployment

The site auto-deploys to Cloudflare Pages on every push to `master`. Pages Functions in the `functions/` directory are picked up automatically and deployed alongside the static site.

**Deploy typically takes 1–2 minutes** after `git push`.

Verify the latest deploy:
```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" -X POST https://navorapartners.com/api/submit-form -H "Content-Type: application/json" -d '{}'
# Should return HTTP 400 (validation error) — confirms the function is live
```

---

## Testing

### End-to-end form submission test

1. Visit any page on navorapartners.com
2. Click "Get Free Growth Strategy"
3. Fill in the form with valid data
4. Click submit
5. Verify:
   - Redirected to `/lead-confirmed`
   - Person record appears in Attio with all custom fields populated
   - Company record appears and is linked to the person
   - Deal record appears in the "Lead" stage with Victor as owner
   - Slack notification arrives from "Sales Bot 9000"
   - Row appended to the backup Google Sheet

### Deal stage change test

1. In Attio, move any deal to "Context Call - Scheduled"
2. Within ~5 seconds:
   - Deal owner should change to Chaky automatically
   - Slack notification should arrive @-mentioning Chaky

### Direct API test (from terminal)

Test the submit-form endpoint (will fail on Turnstile verification):
```bash
curl -X POST https://navorapartners.com/api/submit-form \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test","last_name":"User","email":"test@example.com","phone":"+12015550123","revenue":"$5M – $10M","website_url":"https://example.com","turnstile_token":"invalid"}'
```

Test the Attio webhook handler directly (bypasses Attio):
```bash
curl -X POST https://navorapartners.com/api/attio-webhook \
  -H "Content-Type: application/json" \
  -d '{"events":[{"id":{"record_id":"<DEAL_UUID>"}}]}'
```

---

## Troubleshooting

### Form submission hangs at "Submitting..."

A 1–3 second delay between clicking Submit and the redirect is **normal** — the invisible Turnstile challenge needs a moment to complete in the background. If it takes longer than ~10 seconds:

- Open browser DevTools → Network tab → click Submit
- Check the `/api/submit-form` request for the response body
- Common causes:
  - Turnstile verification failed → response has `error: "Security verification failed"`
  - Turnstile token never generated → response has `error: "Security verification required"` (could mean the Turnstile script failed to load, the site key is wrong, or the domain isn't whitelisted in the Turnstile widget settings)
  - Attio API validation error → response has `error: "Failed to create contact record"` with a `detail` field
  - Network error → shown in console

### Webhook not firing after deal stage change

- Check the webhook status: `GET https://api.attio.com/v2/webhooks`
- Should show `status: "active"`
- If missing, re-register via the command in the "Register the Attio webhook" section
- Test the handler directly via the curl command above — if that works, the issue is with Attio delivery

### Custom fields not populating in Attio

- Confirm the custom attributes exist: `GET https://api.attio.com/v2/objects/people/attributes`
- Confirm the `revenue_range` select has options: `GET https://api.attio.com/v2/objects/people/attributes/revenue_range/options`
- Check that the values sent from the form exactly match the option titles (character encoding matters — use en-dash, not hyphen)

### Slack notifications not arriving

- Test the webhook URL directly: `curl -X POST <SLACK_WEBHOOK_URL> -H "Content-Type: application/json" -d '{"text":"test"}'`
- Verify `SLACK_WEBHOOK_URL` env var is set in Cloudflare
- Check the Slack app's OAuth permissions — needs `incoming-webhook` scope

---

## Security measures in place

1. **Attio API key** — server-side only, in Cloudflare encrypted env vars
2. **Cloudflare Turnstile** — invisible widget runs background challenge on form open, token verified server-side on submit
3. **Honeypot field** — hidden `company_name` input, if filled, server silently succeeds (bots get no error signal)
4. **Server-side input validation + HTML sanitization** — strips tags, trims whitespace
5. **Client-side validation** — UX only, never the only layer of defense
6. **TLD validation** — rejects invalid email/website TLDs and whitespace
7. **CORS headers** — explicit on all JSON responses
8. **Origin-bound webhook secrets** — Turnstile secret, Slack webhook, Google Sheet webhook all in env vars
9. **No client-side credentials** — the browser never sees any API keys

---

## Current owners and IDs reference

- **Victor**: `8e0563de-b606-4d08-942a-e0a7ae123480` / `victor@navorapartners.com`
- **Chaky**: `039b82bf-8126-4d2c-97a4-7f61b9f10d71` / `chaky@navorapartners.com`
- **Chaky's Slack member ID** (for @-mention): `U0AQGTTAWCS`
- **Attio workspace ID**: `d6635828-00eb-41f4-9b55-b05f6e911eb6`
- **Attio Deals object ID**: `b263383e-c2dd-42a8-9a65-16d6e000e47b`
- **Attio People object ID**: `36a8eabd-6ee5-4fcd-b8c8-0886f6cb227c`

---

# Talent Pipeline (Careers Resume Form)

The Talent pipeline is a sibling flow to the Growth Strategy form: a separate Cloudflare Pages Function that handles careers resume submissions and routes candidates into a dedicated Attio List that lives on top of the Deals object. This avoids the free-plan's 3-custom-object cap while keeping Talent reports/filters cleanly separated from Growth Strategy deals.

**No file hosting — URL-based resume model.** Candidates paste a link to their resume (Google Drive, Dropbox, personal site, etc. with viewing permissions enabled) rather than uploading a file. This eliminates hosting costs, storage concerns, malware-scanning ToS issues, and keeps the resume in the candidate's own control. Recruiters click the URL in Attio to open the resume in its source platform, where the native preview handles rendering.

## Architecture at a glance

```
careers.html
  │  (JSON POST: name, email, linkedin_url, resume_url + turnstile token)
  ▼
/api/submit-resume (functions/api/submit-resume.js)
  │
  ├─ Turnstile verify (reuses pattern from submit-form.js)
  ├─ Field validation (email regex, LinkedIn host check, resume URL format)
  ├─ Attio upsertPerson (lead_type = "Talent")
  ├─ Attio createDeal (pipeline_type = "Talent", stage = "Lead")
  ├─ Attio addDealToTalentList
  │     (list-level stage = "Applications", resume_url, role, applied_at)
  ├─ Slack notification ("First Last applied for {role}. Resume: {url}")
  └─ Google Sheets log (Talent Submissions sheet)
       │
       ▼
  /application-received.html
```

## File map (Talent-specific)

**Backend:**
- `functions/api/submit-resume.js` — Cloudflare Pages Function handling the JSON POST end-to-end

**Setup scripts (one-time, idempotent):**
- `crm-integration/scripts/setup-attio-talent-attributes.js` — creates object-level attrs on People (`linkedin_url`, `source_page`, `lead_type`) and Deals (`pipeline_type`)
- `crm-integration/scripts/setup-attio-talent-list.js` — creates the "Talent" List on Deals, its list-level custom attributes, and the 9 pipeline stages. Prints manual UI instructions if the API rejects programmatic stage creation
- `crm-integration/scripts/google-sheets-talent-appscript.js` — Apps Script template for the Talent Submissions Sheet

**Frontend:**
- `public/careers.html` — contains the resume lightbox (reuses `.form-lightbox` / `.form-field` styles from `components.css`)
- `public/application-received.html` — thank-you page after successful submission

## Attio data model

The Talent pipeline does **not** use a new custom Object (free plan caps custom Objects at 3). Instead it uses Attio's native **Lists** feature:

- **Existing Deals object** stays as-is for Growth Strategy — no existing stages touched
- **New "Talent" List** on the Deals object, with its own 9-stage pipeline (list-level stage attribute, independent of the Deals object's built-in stage)
- **Person.lead_type** (`Client` | `Talent`) — tag that distinguishes candidates from prospects
- **Deal.pipeline_type** (`Growth Strategy` | `Talent`) — filter-friendly discriminator for object-level reports

### Object-level custom attributes added by `setup-attio-talent-attributes.js`

**People:**
- `linkedin_url` (text) — LinkedIn profile URL
- `source_page` (text) — page path the candidate submitted from
- `lead_type` (select: `Client` | `Talent`)

**Deals:**
- `pipeline_type` (select: `Growth Strategy` | `Talent`)

### List-level custom attributes on the Talent list

Created by `setup-attio-talent-list.js`:
- `resume_url` (text) — URL the candidate pasted pointing to their resume (Google Drive, Dropbox, personal site, etc. with viewing permissions). Attio renders it as a clickable link — one click opens the native preview in the source platform
- `role_applied_for` (text) — free-form for Phase 1 (Phase 2 will link to Google Doc JDs)
- `applied_at` (timestamp)

### Talent pipeline stages (list-level, 9 stages)

1. **Applications** — entry stage, where form submissions land
2. **Send Request to Interview** — auto-sends email + calendar link *(automation = Phase 3)*
3. **Interview 1 Booked** — triggered by calendar webhook *(automation = Phase 3)*
4. **Send Invite/Instructions to Assessment** — auto-sends email *(automation = Phase 3)*
5. **Assessment In Progress** — manual move when candidate accepted
6. **Assessment Ready for Review** — manual move when assessment submitted
7. **Interview 2** — auto-sends calendar link *(automation = Phase 3)*
8. **Interview 2 Complete**
9. **Offer Sent** — manual; accept/decline happens inside this stage

*Accept/decline are manual sub-actions on the "Offer Sent" stage, not separate terminal stages. Dedicated Hired/Declined stages can be added later if reporting needs them.*

## Environment variables (new for Talent)

Added to Cloudflare Pages → Settings → Environment variables:

- `TALENT_SHEET_WEBHOOK_URL` — Apps Script web app URL for the Talent Submissions sheet
- `TALENT_LIST_ID` — Attio List ID of the Talent list (captured after running `setup-attio-talent-list.js`)

**Reused from Growth Strategy:** `ATTIO_API_KEY`, `TURNSTILE_SECRET_KEY`, `SLACK_WEBHOOK_URL`

## Why URL-based instead of file upload

The original design had candidates upload a PDF/Word file which would be stored in Cloudflare R2 and scanned with VirusTotal. Two problems killed that approach:

1. **VirusTotal's free-tier ToS forbids commercial use.** Navora Partners is a commercial business, so using the free public API on a live form would violate their terms the moment a single real candidate submitted.
2. **Every alternative had a cost** — either financial (commercial scanning SaaS, VirusTotal Premium), operational (self-hosted ClamAV microservice ~$5/month), or security (defer scanning entirely and rely only on extension/MIME gates).

**The pivot:** ask candidates to paste a URL to their resume instead. Google Drive, Dropbox, OneDrive, Notion, personal websites — everyone hosts resumes somewhere already, and every one of those platforms already has its own virus scanning and native preview. We're pushing the file-handling problem to services that have already solved it, and we never touch the file ourselves.

**Tradeoffs we accepted:**
- **No inline preview in Attio.** Recruiters see a clickable URL in the Talent list entry; one click opens the resume in its source platform where the native preview renders. Attio doesn't render OpenGraph cards or iframed previews for URL attributes.
- **Candidate must have cloud-hosted resume.** Some candidates may not know how to create a view-only Google Drive share link. The form placeholder and help text guide them (`Resume link (Google Drive, Dropbox, or personal site)`), and the error message on invalid URL explicitly mentions "viewing permissions enabled."
- **Link rot.** If a candidate later revokes access to their Google Drive file, the link in Attio becomes dead. This is acceptable — resumes are reviewed within days of submission, and recruiters can always fall back to the LinkedIn profile we also capture.

**What we gain:** zero hosting cost, zero storage cost, zero malware-scanning ToS risk, no R2 bucket to provision, no file upload infrastructure, and much simpler code.

## Initial setup (one-time)

Follow these steps in order the first time you bring up the Talent pipeline:

1. **Create the Talent Submissions Google Sheet** with the column headers listed in `crm-integration/scripts/google-sheets-talent-appscript.js`. Extensions → Apps Script → paste the script → Deploy as Web App (Execute as: Me, Access: Anyone). Copy the web app URL and add to Cloudflare Pages as `TALENT_SHEET_WEBHOOK_URL`.
2. **Run object-level attribute setup:**
   ```bash
   ATTIO_API_KEY=your_key node crm-integration/scripts/setup-attio-talent-attributes.js
   ```
   Creates `linkedin_url`, `source_page`, `lead_type` on People and `pipeline_type` on Deals. Idempotent.
3. **Run Talent List setup:**
   ```bash
   ATTIO_API_KEY=your_key node crm-integration/scripts/setup-attio-talent-list.js
   ```
   Creates the Talent list, its 3 list-level custom attributes (`resume_url`, `role_applied_for`, `applied_at`), and the 9 stages. If the Attio API rejects programmatic list-level stage creation for any reason, the script prints clear manual UI instructions and exits cleanly.
4. **Capture the Talent List ID** from the script output (printed at the end). Add to Cloudflare Pages as `TALENT_LIST_ID`.
5. **Deploy** (`git push` triggers Cloudflare Pages auto-deploy). Wait ~1-2 minutes.
6. **Test end-to-end** — see Testing section below.

## Testing (Talent form)

- **Submit a valid form:** open `https://navorapartners.com/careers.html`, click "Send Us Your Resume", fill all fields with a real Google Drive share link (viewing permissions), submit. Expect redirect to `/application-received.html`.
- **Verify Attio:**
  - Open the Talent List in Attio UI. New entry at stage "Applications" with `resume_url`, `role_applied_for`, `applied_at` populated. The `resume_url` should render as a clickable link — click it to confirm it opens the resume in Google Drive's native preview
  - Open the linked Person record. Confirm `linkedin_url`, `source_page`, `lead_type = Talent`, `lead_source = Talent Form`
  - Open the Deal. Confirm `pipeline_type = Talent`. Confirm it does NOT appear in Growth Strategy reports filtered by `pipeline_type = Growth Strategy`
- **Verify Slack:** expect message `"First Last applied for {role}. Resume: {url}"` from `Talent Bot`
- **Verify Sheet:** new row appears in the Talent Submissions sheet with all 13 columns populated
- **Turnstile test:** bypass the widget by submitting without the token → expect 400 `"Security verification required"`
- **Invalid resume URL test:** try submitting with a non-URL string or an `http://` link with no TLD → expect 400 `"A valid resume URL is required"`
- **Invalid LinkedIn test:** try submitting with a non-LinkedIn URL → expect 400 `"A valid LinkedIn profile URL is required"`

## Phase 3 (deferred automation)

- **Stage automation emails** for stages 2, 4, 7 (calendar invites, assessment instructions, interview 2 booking link) — requires email templates + a transactional email provider
- **Calendar webhook integration** to auto-move to stage 3 (Interview 1 Booked) and 7 (Interview 2) when the candidate books via Cal.com or Calendly
- **Per-position Apply Now buttons** that link to Google Doc job descriptions with role pre-filled into the form
- **Rate limiting** on `/api/submit-resume` (per-IP counter via Cloudflare KV)
- **Dedicated terminal stages** (Hired / Declined) if Offer Sent sub-actions become a reporting bottleneck
- **Domain allow-list for resume URLs** — if phishing/spam links become an issue, add a server-side check that resume_url hosts match a known list (drive.google.com, dropbox.com, onedrive.live.com, notion.so, etc.) or flag submissions with exotic domains for manual review
