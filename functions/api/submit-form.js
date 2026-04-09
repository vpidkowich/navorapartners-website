/**
 * Cloudflare Pages Function — POST /api/submit-form
 *
 * Receives form data, verifies Turnstile, creates records in Attio CRM,
 * sends Slack notification, and logs to Google Sheets.
 *
 * Required env vars (set in Cloudflare Pages dashboard):
 *   ATTIO_API_KEY, TURNSTILE_SECRET_KEY, SLACK_WEBHOOK_URL, GOOGLE_SHEET_WEBHOOK_URL
 */

// ── Helpers ──────────────────────────────────────────────────────

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

function extractDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Turnstile verification ───────────────────────────────────────

async function verifyTurnstile(token, ip, secretKey) {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: secretKey,
      response: token,
      remoteip: ip,
    }),
  });
  const data = await res.json();
  return data.success === true;
}

// ── Attio API calls ──────────────────────────────────────────────

async function upsertCompany(domain, apiKey) {
  const res = await fetch('https://api.attio.com/v2/objects/companies/records?matching_attribute=domains', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        values: {
          domains: [domain],
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Attio upsert company failed:', res.status, text);
    return null;
  }

  const data = await res.json();
  return data.data?.id?.record_id || null;
}

async function upsertPerson(formData, geoData, companyRecordId, apiKey) {
  const values = {
    first_name: [{ first_name: formData.first_name, last_name: formData.last_name, full_name: `${formData.first_name} ${formData.last_name}` }],
    email_addresses: [formData.email],
  };

  if (formData.phone) {
    values.phone_numbers = [formData.phone];
  }

  // Custom attributes
  const customFields = {
    revenue_range: formData.revenue || null,
    utm_source: formData.utm_source || null,
    utm_medium: formData.utm_medium || null,
    utm_campaign: formData.utm_campaign || null,
    utm_content: formData.utm_content || null,
    utm_term: formData.utm_term || null,
    gclid: formData.gclid || null,
    lead_source: 'Growth Strategy Form',
    ip_address: geoData.ip || null,
    geo_city: geoData.city || null,
    geo_region: geoData.region || null,
    geo_country: geoData.country || null,
    geo_timezone: geoData.timezone || null,
  };

  for (const [key, value] of Object.entries(customFields)) {
    if (value) {
      values[key] = value;
    }
  }

  // Link to company if we have a record ID
  if (companyRecordId) {
    values.company = [{ target_record_id: companyRecordId }];
  }

  const res = await fetch('https://api.attio.com/v2/objects/people/records?matching_attribute=email_addresses', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: { values },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Attio upsert person failed:', res.status, text);
    return false;
  }

  return true;
}

// ── Slack notification ───────────────────────────────────────────

async function sendSlackNotification(firstName, lastName, webhookUrl) {
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `${firstName} ${lastName} just filled the form for a Growth Strategy.`,
    }),
  }).catch((err) => console.error('Slack notification failed:', err));
}

// ── Google Sheets backup ─────────────────────────────────────────

async function logToGoogleSheets(formData, geoData, sheetWebhookUrl) {
  if (!sheetWebhookUrl) return;

  await fetch(sheetWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone || '',
      revenue: formData.revenue || '',
      website_url: formData.website_url || '',
      utm_source: formData.utm_source || '',
      utm_medium: formData.utm_medium || '',
      utm_campaign: formData.utm_campaign || '',
      utm_content: formData.utm_content || '',
      utm_term: formData.utm_term || '',
      gclid: formData.gclid || '',
      ip: geoData.ip || '',
      city: geoData.city || '',
      region: geoData.region || '',
      country: geoData.country || '',
      timezone: geoData.timezone || '',
    }),
  }).catch((err) => console.error('Google Sheets log failed:', err));
}

// ── Main handler ─────────────────────────────────────────────────

export async function onRequestPost(context) {
  const { request, env } = context;

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Invalid JSON' }, 400);
  }

  // Honeypot check — bots fill this hidden field
  if (body.company_name) {
    return jsonResponse({ success: true });
  }

  // Verify Turnstile
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const turnstileToken = body.turnstile_token;

  if (!turnstileToken) {
    return jsonResponse({ success: false, error: 'Security verification required' }, 400);
  }

  const turnstileValid = await verifyTurnstile(turnstileToken, ip, env.TURNSTILE_SECRET_KEY);
  if (!turnstileValid) {
    return jsonResponse({ success: false, error: 'Security verification failed' }, 403);
  }

  // Sanitize inputs
  const formData = {
    first_name: sanitize(body.first_name),
    last_name: sanitize(body.last_name),
    email: sanitize(body.email),
    phone: sanitize(body.phone),
    revenue: sanitize(body.revenue),
    website_url: sanitize(body.website_url),
    utm_source: sanitize(body.utm_source),
    utm_medium: sanitize(body.utm_medium),
    utm_campaign: sanitize(body.utm_campaign),
    utm_content: sanitize(body.utm_content),
    utm_term: sanitize(body.utm_term),
    gclid: sanitize(body.gclid),
  };

  // Validate required fields
  if (!formData.first_name || !formData.last_name || !formData.email) {
    return jsonResponse({ success: false, error: 'First name, last name, and email are required' }, 400);
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    return jsonResponse({ success: false, error: 'Invalid email address' }, 400);
  }

  // Collect geo data from Cloudflare
  const cf = request.cf || {};
  const geoData = {
    ip,
    timezone: cf.timezone || body.client_timezone || '',
    city: cf.city || '',
    region: cf.region || '',
    country: cf.country || '',
  };

  try {
    // Step 1: Upsert Company (if website URL provided)
    let companyRecordId = null;
    if (formData.website_url) {
      const domain = extractDomain(formData.website_url);
      if (domain) {
        companyRecordId = await upsertCompany(domain, env.ATTIO_API_KEY);
      }
    }

    // Step 2: Upsert Person (linked to company)
    const personCreated = await upsertPerson(formData, geoData, companyRecordId, env.ATTIO_API_KEY);
    if (!personCreated) {
      return jsonResponse({ success: false, error: 'Failed to create contact record' }, 500);
    }

    // Step 3 & 4: Slack + Google Sheets (fire and forget — don't block response)
    await Promise.allSettled([
      sendSlackNotification(formData.first_name, formData.last_name, env.SLACK_WEBHOOK_URL),
      logToGoogleSheets(formData, geoData, env.GOOGLE_SHEET_WEBHOOK_URL),
    ]);

    return jsonResponse({ success: true });
  } catch (err) {
    console.error('Form submission error:', err);
    return jsonResponse({ success: false, error: 'An unexpected error occurred' }, 500);
  }
}

// Handle OPTIONS for preflight (defense-in-depth, same-origin shouldn't need it)
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://navorapartners.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
