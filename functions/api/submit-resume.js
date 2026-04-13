/**
 * Cloudflare Pages Function — POST /api/submit-resume
 *
 * Receives a JSON resume submission from the careers page, verifies
 * Turnstile, creates records in Attio (Person + Deal + Talent list
 * entry), sends Slack notification, and logs to Google Sheets.
 *
 * Candidates submit a URL to their resume (Google Drive, Dropbox,
 * personal site, etc.) rather than uploading a file. This eliminates
 * hosting, storage, and malware-scanning concerns — the resume lives
 * in the candidate's own storage with viewing permissions set.
 *
 * Required env vars (set in Cloudflare Pages dashboard):
 *   ATTIO_API_KEY, TURNSTILE_SECRET_KEY, SLACK_WEBHOOK_URL,
 *   TALENT_SHEET_WEBHOOK_URL, TALENT_LIST_ID
 */

// ── Helpers ──────────────────────────────────────────────────────

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidLinkedIn(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && /(^|\.)linkedin\.com$/i.test(url.hostname);
  } catch {
    return false;
  }
}

function isValidResumeUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    // Require http(s) and a hostname with at least one dot
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    if (!url.hostname || url.hostname.indexOf('.') === -1) return false;
    return true;
  } catch {
    return false;
  }
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

// ── Attio: Person upsert ─────────────────────────────────────────

async function upsertPerson(formData, geoData, apiKey) {
  const values = {
    name: [{
      first_name: formData.first_name,
      last_name: formData.last_name,
      full_name: `${formData.first_name} ${formData.last_name}`,
    }],
    email_addresses: [{ email_address: formData.email }],
  };

  // Text custom attributes — formatted as [{ value: "..." }]
  const textFields = {
    linkedin_url: formData.linkedin_url || null,
    source_page: formData.source_page || null,
    lead_source: 'Talent Form',
    ip_address: geoData.ip || null,
    geo_city: geoData.city || null,
    geo_region: geoData.region || null,
    geo_country: geoData.country || null,
    geo_timezone: geoData.timezone || null,
  };
  for (const [key, value] of Object.entries(textFields)) {
    if (value) {
      values[key] = [{ value: value }];
    }
  }

  // Select attributes — formatted as [{ option: "title" }]
  values.lead_type = [{ option: 'Talent' }];

  // First try with all fields (including custom attributes)
  let res = await fetch('https://api.attio.com/v2/objects/people/records?matching_attribute=email_addresses', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: { values } }),
  });

  if (res.ok) {
    const data = await res.json();
    return { ok: true, recordId: data.data?.id?.record_id || null };
  }

  // Fallback to core fields only if custom attrs aren't set up yet
  const firstError = await res.text();
  console.error('Attio upsert person (with custom fields) failed:', res.status, firstError);
  const coreValues = {
    name: values.name,
    email_addresses: values.email_addresses,
  };

  res = await fetch('https://api.attio.com/v2/objects/people/records?matching_attribute=email_addresses', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: { values: coreValues } }),
  });

  if (!res.ok) {
    const secondError = await res.text();
    console.error('Attio upsert person (core only) failed:', res.status, secondError);
    return { ok: false, error: secondError };
  }

  const data = await res.json();
  return { ok: true, recordId: data.data?.id?.record_id || null };
}

// ── Attio: Deal create ───────────────────────────────────────────

async function createTalentDeal(formData, personRecordId, apiKey) {
  const dealName = `${formData.first_name} ${formData.last_name} \u2014 ${formData.role_applied_for || 'Open Application'}`;

  const values = {
    name: [{ value: dealName }],
    stage: [{ status: 'Lead' }],
    pipeline_type: [{ option: 'Talent' }],
  };

  if (personRecordId) {
    values.associated_people = [{ target_object: 'people', target_record_id: personRecordId }];
  }

  let res = await fetch('https://api.attio.com/v2/objects/deals/records', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: { values } }),
  });

  if (res.ok) {
    const data = await res.json();
    return data.data?.id?.record_id || null;
  }

  // Retry without pipeline_type if that custom attr isn't set up yet
  const firstError = await res.text();
  console.error('Attio create talent deal (with pipeline_type) failed:', res.status, firstError);
  delete values.pipeline_type;

  res = await fetch('https://api.attio.com/v2/objects/deals/records', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: { values } }),
  });

  if (!res.ok) {
    console.error('Attio create talent deal (core only) failed:', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.data?.id?.record_id || null;
}

// ── Attio: add entry to Talent list ──────────────────────────────

async function addDealToTalentList(listId, dealRecordId, entryValues, apiKey) {
  if (!listId) {
    console.error('TALENT_LIST_ID missing — cannot add entry to Talent list');
    return null;
  }

  const body = {
    data: {
      parent_object: 'deals',
      parent_record_id: dealRecordId,
      entry_values: {
        stage: [{ status: 'Applications' }],
        resume_url: [{ value: entryValues.resume_url }],
        role_applied_for: [{ value: entryValues.role_applied_for || 'Open Application' }],
        applied_at: [{ value: entryValues.applied_at }],
      },
    },
  };

  const res = await fetch(`https://api.attio.com/v2/lists/${listId}/entries`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Attio add to talent list failed:', res.status, text);
    return null;
  }

  const data = await res.json();
  return data.data?.id?.entry_id || null;
}

// ── Slack notification ───────────────────────────────────────────

async function sendTalentSlackNotification(firstName, lastName, role, resumeUrl, webhookUrl) {
  if (!webhookUrl) return;

  const text = `${firstName} ${lastName} just applied${role ? ` for ${role}` : ''}. Resume: ${resumeUrl}`;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      icon_url: 'https://emoji.slack-edge.com/T0AQDFSGMBP/briefcase/f0d8f4b7b3e0a7f1.png',
      username: 'Talent Bot',
    }),
  }).catch((err) => console.error('Talent Slack notification failed:', err));
}

// ── Google Sheets backup ─────────────────────────────────────────

async function logToTalentSheet(formData, geoData, sheetWebhookUrl) {
  if (!sheetWebhookUrl) return;

  await fetch(sheetWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      linkedin_url: formData.linkedin_url || '',
      resume_url: formData.resume_url || '',
      role_applied_for: formData.role_applied_for || '',
      source_page: formData.source_page || '',
      ip: geoData.ip || '',
      city: geoData.city || '',
      region: geoData.region || '',
      country: geoData.country || '',
      timezone: geoData.timezone || '',
    }),
  }).catch((err) => console.error('Talent Sheet log failed:', err));
}

// ── Main handler ─────────────────────────────────────────────────

export async function onRequestPost(context) {
  const { request, env } = context;

  // Parse JSON body
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Invalid JSON' }, 400);
  }

  // Honeypot check
  if (body.company_name) {
    return jsonResponse({ success: true });
  }

  // Turnstile verification
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const turnstileToken = body.turnstile_token;

  if (!turnstileToken) {
    return jsonResponse({ success: false, error: 'Security verification required' }, 400);
  }

  const turnstileValid = await verifyTurnstile(turnstileToken, ip, env.TURNSTILE_SECRET_KEY);
  if (!turnstileValid) {
    return jsonResponse({ success: false, error: 'Security verification failed' }, 403);
  }

  // Sanitize text fields
  const formData = {
    first_name: sanitize(body.first_name),
    last_name: sanitize(body.last_name),
    email: sanitize(body.email),
    linkedin_url: sanitize(body.linkedin_url),
    resume_url: sanitize(body.resume_url),
    role_applied_for: sanitize(body.role_applied_for),
    source_page: sanitize(body.source_page),
  };

  // Validate required text fields
  if (!formData.first_name || !formData.last_name) {
    return jsonResponse({ success: false, error: 'First and last name are required' }, 400);
  }
  if (!isValidEmail(formData.email)) {
    return jsonResponse({ success: false, error: 'A valid email address is required' }, 400);
  }
  if (!isValidLinkedIn(formData.linkedin_url)) {
    return jsonResponse({ success: false, error: 'A valid LinkedIn profile URL is required' }, 400);
  }
  if (!isValidResumeUrl(formData.resume_url)) {
    return jsonResponse({ success: false, error: 'A valid resume URL is required (e.g. Google Drive, Dropbox, or personal site)' }, 400);
  }

  // Geo data from Cloudflare
  const cf = request.cf || {};
  const geoData = {
    ip,
    timezone: cf.timezone || '',
    city: cf.city || '',
    region: cf.region || '',
    country: cf.country || '',
  };

  try {
    // Upsert Person in Attio
    const personResult = await upsertPerson(formData, geoData, env.ATTIO_API_KEY);
    if (!personResult.ok) {
      return jsonResponse({ success: false, error: 'Failed to create candidate record' }, 500);
    }

    // Create Deal (pipeline_type = Talent)
    const dealRecordId = await createTalentDeal(formData, personResult.recordId, env.ATTIO_API_KEY);

    // Add deal to Talent List at stage "Applications"
    if (dealRecordId) {
      await addDealToTalentList(env.TALENT_LIST_ID, dealRecordId, {
        resume_url: formData.resume_url,
        role_applied_for: formData.role_applied_for,
        applied_at: new Date().toISOString(),
      }, env.ATTIO_API_KEY);
    }

    // Slack + Google Sheets — fire and forget
    await Promise.allSettled([
      sendTalentSlackNotification(formData.first_name, formData.last_name, formData.role_applied_for, formData.resume_url, env.SLACK_WEBHOOK_URL),
      logToTalentSheet(formData, geoData, env.TALENT_SHEET_WEBHOOK_URL),
    ]);

    return jsonResponse({ success: true, redirect: '/application-received.html' });
  } catch (err) {
    console.error('Resume submission error:', err);
    return jsonResponse({ success: false, error: 'An unexpected error occurred' }, 500);
  }
}

// Handle OPTIONS for preflight
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
