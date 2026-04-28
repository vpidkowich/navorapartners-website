/**
 * One-off test: creates a single demo deal in Attio so we can verify the
 * data shape, marker, and end-to-end record linking before running the
 * full 100-deal seeder.
 *
 * Creates:
 *   - Company: example-shop.com (Example Shop)
 *   - Person:  John Doe <john@example-shop.com> with lead_source = "Demo Data"
 *   - Deal:    "John Doe — example-shop.com" at stage "Lead", owner Victor
 *
 * Writes the created record IDs to .demo-data-ids.json so the cleanup
 * script can target them later.
 *
 * Usage:
 *   ATTIO_API_KEY=$(grep ATTIO_API_KEY .dev.vars | cut -d= -f2) \
 *     node crm-integration/scripts/seed-demo-test.js
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ATTIO_API_KEY;
if (!API_KEY) {
  console.error('Missing ATTIO_API_KEY environment variable.');
  process.exit(1);
}

const BASE_URL = 'https://api.attio.com/v2';
const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

const IDS_FILE = path.join(__dirname, '.demo-data-ids.json');

function loadIds() {
  if (!fs.existsSync(IDS_FILE)) return { companies: [], people: [], deals: [] };
  return JSON.parse(fs.readFileSync(IDS_FILE, 'utf8'));
}

function saveIds(ids) {
  fs.writeFileSync(IDS_FILE, JSON.stringify(ids, null, 2));
}

async function upsertCompany(domain, name) {
  const res = await fetch(`${BASE_URL}/objects/companies/records?matching_attribute=domains`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      data: {
        values: {
          domains: [{ domain }],
          name: [{ value: name }],
          is_demo: [{ value: true }],
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`Company upsert failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.data?.id?.record_id;
}

async function upsertPerson(person, companyId) {
  const values = {
    name: [{
      first_name: person.first_name,
      last_name: person.last_name,
      full_name: `${person.first_name} ${person.last_name}`,
    }],
    email_addresses: [{ email_address: person.email }],
    phone_numbers: [{ original_phone_number: person.phone }],
    revenue_range: [{ option: person.revenue }],
    lead_source: [{ value: 'Demo Data' }],
    utm_source: [{ value: person.utm_source }],
    utm_medium: [{ value: person.utm_medium }],
    utm_campaign: [{ value: person.utm_campaign }],
    geo_city: [{ value: person.city }],
    geo_region: [{ value: person.region }],
    geo_country: [{ value: person.country }],
    geo_timezone: [{ value: person.timezone }],
    ip_address: [{ value: person.ip }],
    company: [{ target_object: 'companies', target_record_id: companyId }],
  };

  const res = await fetch(`${BASE_URL}/objects/people/records?matching_attribute=email_addresses`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ data: { values } }),
  });
  if (!res.ok) throw new Error(`Person upsert failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.data?.id?.record_id;
}

async function createDeal(name, stage, personId, companyId) {
  const values = {
    name: [{ value: name }],
    stage: [{ status: stage }],
    owner: [{ workspace_member_email_address: 'victor@navorapartners.com' }],
    associated_people: [{ target_object: 'people', target_record_id: personId }],
    associated_company: [{ target_object: 'companies', target_record_id: companyId }],
    is_demo: [{ value: true }],
  };
  const res = await fetch(`${BASE_URL}/objects/deals/records`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data: { values } }),
  });
  if (!res.ok) throw new Error(`Deal create failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.data?.id?.record_id;
}

async function main() {
  const company = { domain: 'example-shop.com', name: 'Example Shop' };
  const person = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example-shop.com',
    phone: '+12015550123',
    revenue: '$1M – $3M',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'demo-test',
    city: 'Austin',
    region: 'Texas',
    country: 'US',
    timezone: 'America/Chicago',
    ip: '203.0.113.42',
  };

  console.log('Upserting company…');
  const companyId = await upsertCompany(company.domain, company.name);
  console.log(`  company_id = ${companyId}`);

  console.log('Upserting person…');
  const personId = await upsertPerson(person, companyId);
  console.log(`  person_id  = ${personId}`);

  console.log('Creating deal…');
  const dealId = await createDeal(
    `${person.first_name} ${person.last_name} — ${company.domain}`,
    'Lead',
    personId,
    companyId,
  );
  console.log(`  deal_id    = ${dealId}`);

  const ids = loadIds();
  ids.companies.push(companyId);
  ids.people.push(personId);
  ids.deals.push(dealId);
  saveIds(ids);

  console.log(`\nDone. Saved IDs to ${IDS_FILE}`);
  console.log('Open Attio and check the new deal at stage "Lead".');
}

main().catch((err) => {
  console.error('\nError:', err.message);
  process.exit(1);
});
