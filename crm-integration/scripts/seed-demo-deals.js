/**
 * Seeds 100 realistic demo deals into Attio across all 16 pipeline stages.
 *
 * Every record is tagged so it can be cleanly removed later:
 *   - Companies: is_demo = true
 *   - Deals:     is_demo = true
 *   - People:    lead_source = "Demo Data"
 *
 * No Slack, no Sheets, no Turnstile — hits the Attio API directly.
 * The webhook is subscribed to record.updated only, so creating new deals
 * (even at "Context Call - Scheduled") will not reassign owner to Chaky.
 *
 * Idempotent on companies/people (upsert-by-domain / upsert-by-email).
 * Deals are created fresh each run — re-running will duplicate them, so
 * run cleanup-demo-data.js before re-seeding.
 *
 * Usage:
 *   ATTIO_API_KEY=$(grep ATTIO_API_KEY .dev.vars | cut -d= -f2) \
 *     node crm-integration/scripts/seed-demo-deals.js
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

// ── Demo dataset ──────────────────────────────────────────────────────
//
// 100 deals. Each entry is fully specified — no random generation at
// runtime, so the seed is deterministic and reviewable.
//
// Stage counts: Lead 14, Qualifying Call Booked 12, Call Cancelled 4,
// Call Complete - Good Fit 9, Not a Good Fit 5, Sent ICP Elevation 5,
// Follow Up Later 6, Context Call - Scheduled 7, Context Call - Cancelled 3,
// Context Call - Complete 6, Growth Strategy Sent 8, Key Findings Booked 5,
// Key Findings Cancelled 2, Followup 7, Won 4, Lost 3.

const DEMO = [
  // ── Lead (14) ──────────────────────────────────────────────────────
  { stage: 'Lead', company: 'Wildroot Botanicals', domain: 'wildrootbotanicals.com', first: 'Maya', last: 'Hellstrom', role: 'Founder & CEO', email_pattern: 'first', revenue: '$3M – $5M', city: 'Boulder', region: 'Colorado', country: 'US', tz: 'America/Denver', area: '720', utm_source: 'facebook', utm_medium: 'paid_social', utm_campaign: 'q1-creator-collab' },
  { stage: 'Lead', company: 'Tidemark Coffee Roasters', domain: 'tidemarkroasters.com', first: 'Caleb', last: 'Reinholt', role: 'Co-Founder', email_pattern: 'first', revenue: '$1M – $3M', city: 'Portland', region: 'Oregon', country: 'US', tz: 'America/Los_Angeles', area: '503', utm_source: 'google', utm_medium: 'organic', utm_campaign: '' },
  { stage: 'Lead', company: 'Northbound Apothecary', domain: 'northboundapothecary.co', first: 'Ines', last: 'Vasquez-Mora', role: 'Marketing Lead', email_pattern: 'first', revenue: '$500K – $1M', city: 'Brooklyn', region: 'New York', country: 'US', tz: 'America/New_York', area: '347', utm_source: 'instagram', utm_medium: 'paid_social', utm_campaign: 'spring-launch' },
  { stage: 'Lead', company: 'Salt & Cedar Home', domain: 'saltandcedar.shop', first: 'Brennan', last: 'McCallister', role: 'Founder', email_pattern: 'founder', revenue: '$1M – $3M', city: 'Charleston', region: 'South Carolina', country: 'US', tz: 'America/New_York', area: '843', utm_source: 'pinterest', utm_medium: 'paid_social', utm_campaign: 'home-decor-q2' },
  { stage: 'Lead', company: 'Kestrel Knitwear', domain: 'kestrelknitwear.co.uk', first: 'Imogen', last: 'Pemberton', role: 'Director', email_pattern: 'first', revenue: '$500K – $1M', city: 'Edinburgh', region: 'Scotland', country: 'GB', tz: 'Europe/London', area: '0131', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'merino-uk-search', gclid: 'EAIaIQobChMIa3jK7n_demo-Aw0BAEAUYAyAA' },
  { stage: 'Lead', company: 'Harlow & Finch', domain: 'harlowandfinch.com', first: 'Priya', last: 'Ramaswamy', role: 'Head of Ecommerce', email_pattern: 'first', revenue: '$1M – $3M', city: 'Austin', region: 'Texas', country: 'US', tz: 'America/Chicago', area: '512', utm_source: 'tiktok', utm_medium: 'paid_social', utm_campaign: 'ugc-test-batch-3' },
  { stage: 'Lead', company: 'Iron Loon Outdoors', domain: 'ironloonoutdoors.com', first: 'Dawson', last: 'Beaupre', role: 'Founder', email_pattern: 'founder', revenue: '$3M – $5M', city: 'Vancouver', region: 'British Columbia', country: 'CA', tz: 'America/Vancouver', area: '604', utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'agency-roundup-aug' },
  { stage: 'Lead', company: 'Olea Tallow Co.', domain: 'oleatallow.com', first: 'Aviva', last: 'Stenmark', role: 'Founder & Formulator', email_pattern: 'first', revenue: '$500K – $1M', city: 'Nashville', region: 'Tennessee', country: 'US', tz: 'America/Chicago', area: '615', utm_source: 'instagram', utm_medium: 'organic', utm_campaign: '' },
  { stage: 'Lead', company: 'Northcape Provisions', domain: 'northcapeprovisions.com', first: 'Tomasz', last: 'Wojciechowski', role: 'CMO', email_pattern: 'firstlast', revenue: '$5M – $10M', city: 'Toronto', region: 'Ontario', country: 'CA', tz: 'America/Toronto', area: '416', utm_source: 'linkedin', utm_medium: 'social', utm_campaign: 'thought-leader-q1' },
  { stage: 'Lead', company: 'Lumen & Lark', domain: 'lumenandlark.shop', first: 'Yara', last: 'Abdelrahman', role: 'Founder', email_pattern: 'first', revenue: '$1M – $3M', city: 'Miami', region: 'Florida', country: 'US', tz: 'America/New_York', area: '305', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'jewelry-prospecting', gclid: 'EAIaIQobChMI4kP_demo7HzAhVAEAYAAUYBSAA' },
  { stage: 'Lead', company: 'Saltwater & Sage', domain: 'saltwatersage.com.au', first: 'Eliana', last: 'Petrides', role: 'Co-Founder', email_pattern: 'first', revenue: '$3M – $5M', city: 'Perth', region: 'Western Australia', country: 'AU', tz: 'Australia/Perth', area: '08', utm_source: 'podcast', utm_medium: 'audio', utm_campaign: 'female-founder-show' },
  { stage: 'Lead', company: 'Mossbrook Bath Co.', domain: 'mossbrookbath.com', first: 'Hollis', last: 'Cartwright', role: 'Founder', email_pattern: 'founder', revenue: '$500K – $1M', city: 'Asheville', region: 'North Carolina', country: 'US', tz: 'America/New_York', area: '828', utm_source: 'pinterest', utm_medium: 'organic', utm_campaign: '' },
  { stage: 'Lead', company: 'Ravenwood Coffee', domain: 'ravenwoodcoffee.co', first: 'Soren', last: 'Linnankoski', role: 'Owner', email_pattern: 'first', revenue: 'Under $500K', city: 'Minneapolis', region: 'Minnesota', country: 'US', tz: 'America/Chicago', area: '612', utm_source: 'google', utm_medium: 'organic', utm_campaign: '' },
  { stage: 'Lead', company: 'Grit & Grain Goods', domain: 'gritandgraingoods.com', first: 'Marisol', last: 'Quintero-Ng', role: 'Director of Growth', email_pattern: 'firstlast', revenue: '$5M – $10M', city: 'Los Angeles', region: 'California', country: 'US', tz: 'America/Los_Angeles', area: '213', utm_source: 'facebook', utm_medium: 'paid_social', utm_campaign: 'aov-test-may' },

  // ── Qualifying Call Booked (12) ────────────────────────────────────
  { stage: 'Qualifying Call Booked', company: 'Halcyon Surf Co.', domain: 'halcyonsurf.co', first: 'Jarrah', last: 'Whitcombe', role: 'Head of Growth', email_pattern: 'first', revenue: '$10M – $25M', city: 'Byron Bay', region: 'New South Wales', country: 'AU', tz: 'Australia/Sydney', area: '02', utm_source: 'podcast', utm_medium: 'audio', utm_campaign: 'dtc-pod-ep142', utm_content: 'mid-roll-read' },
  { stage: 'Qualifying Call Booked', company: 'Bright Hollow Pet', domain: 'brighthollowpet.com', first: 'Camille', last: 'Devereaux', role: 'Founder & CEO', email_pattern: 'first', revenue: '$3M – $5M', city: 'Atlanta', region: 'Georgia', country: 'US', tz: 'America/New_York', area: '404', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'pet-supplements-search', gclid: 'EAIaIQobChMIxK7P9_demo-Bw0BAEAUYAS-AB' },
  { stage: 'Qualifying Call Booked', company: 'Stonecourt Cycling', domain: 'stonecourtcycling.com', first: 'Roman', last: 'Vasiliev', role: 'CMO', email_pattern: 'first', revenue: '$10M – $25M', city: 'Denver', region: 'Colorado', country: 'US', tz: 'America/Denver', area: '303', utm_source: 'youtube', utm_medium: 'video', utm_campaign: 'review-sponsorship-q2' },
  { stage: 'Qualifying Call Booked', company: 'Foxtail Linen Co.', domain: 'foxtaillinen.com', first: 'Sloane', last: 'Mortensen', role: 'Co-Founder', email_pattern: 'first', revenue: '$1M – $3M', city: 'Sydney', region: 'New South Wales', country: 'AU', tz: 'Australia/Sydney', area: '02', utm_source: 'meta', utm_medium: 'paid_social', utm_campaign: 'bedding-prospect-au' },
  { stage: 'Qualifying Call Booked', company: 'Driftless Snacks', domain: 'driftlesssnacks.com', first: 'Ezra', last: 'Klingenberg', role: 'Founder', email_pattern: 'founder', revenue: '$3M – $5M', city: 'Madison', region: 'Wisconsin', country: 'US', tz: 'America/Chicago', area: '608', utm_source: 'newsletter', utm_medium: 'email', utm_campaign: '2pm-newsletter-aug' },
  { stage: 'Qualifying Call Booked', company: 'Verity Skincare', domain: 'verityskincare.co', first: 'Naomi', last: 'Chen-Whitfield', role: 'Brand Director', email_pattern: 'firstlast', revenue: '$5M – $10M', city: 'Toronto', region: 'Ontario', country: 'CA', tz: 'America/Toronto', area: '647', utm_source: 'instagram', utm_medium: 'paid_social', utm_campaign: 'creator-whitelist-jul' },
  { stage: 'Qualifying Call Booked', company: 'Arden Tea Trading', domain: 'ardenteatrading.com', first: 'Beatrix', last: 'Halloway', role: 'Founder', email_pattern: 'first', revenue: '$1M – $3M', city: 'London', region: 'England', country: 'GB', tz: 'Europe/London', area: '020', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'loose-leaf-uk', gclid: 'EAIaIQobChMI8H7n2_demo-Az8BAEAUYASAA' },
  { stage: 'Qualifying Call Booked', company: 'Northbeam Tools', domain: 'northbeamtools.com', first: 'Garrett', last: 'Holcombe', role: 'Director of Marketing', email_pattern: 'firstlast', revenue: '$5M – $10M', city: 'Milwaukee', region: 'Wisconsin', country: 'US', tz: 'America/Chicago', area: '414', utm_source: 'referral', utm_medium: 'word_of_mouth', utm_campaign: 'agency-referral' },
  { stage: 'Qualifying Call Booked', company: 'Coral & Coast', domain: 'coralandcoast.shop', first: 'Tiana', last: 'Achebe', role: 'Founder', email_pattern: 'first', revenue: '$1M – $3M', city: 'Honolulu', region: 'Hawaii', country: 'US', tz: 'Pacific/Honolulu', area: '808', utm_source: 'tiktok', utm_medium: 'paid_social', utm_campaign: 'swimwear-summer' },
  { stage: 'Qualifying Call Booked', company: 'Larkspur Stationery', domain: 'larkspurstationery.com', first: 'Maeve', last: 'Donnellan', role: 'Owner', email_pattern: 'first', revenue: 'Under $500K', city: 'Dublin', region: 'Leinster', country: 'IE', tz: 'Europe/Dublin', area: '01', utm_source: 'pinterest', utm_medium: 'organic', utm_campaign: '' },
  { stage: 'Qualifying Call Booked', company: 'Riverside Hot Sauce Co.', domain: 'riversidehotsauce.com', first: 'Mateo', last: 'Salgado', role: 'Founder', email_pattern: 'founder', revenue: '$1M – $3M', city: 'San Antonio', region: 'Texas', country: 'US', tz: 'America/Chicago', area: '210', utm_source: 'instagram', utm_medium: 'paid_social', utm_campaign: 'foodie-creators' },
  { stage: 'Qualifying Call Booked', company: 'Birchwood Baby', domain: 'birchwoodbaby.com', first: 'Anika', last: 'Lindqvist', role: 'Co-Founder', email_pattern: 'first', revenue: '$3M – $5M', city: 'Seattle', region: 'Washington', country: 'US', tz: 'America/Los_Angeles', area: '206', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'baby-essentials-prospect', gclid: 'EAIaIQobChMI3Hp_demo-7Bw0BAEAUYASCD' },

  // ── Call Cancelled (4) ────────────────────────────────────────────
  { stage: 'Call Cancelled', company: 'Hawthorn Activewear', domain: 'hawthornactive.com', first: 'Jules', last: 'Brockman', role: 'Marketing Director', email_pattern: 'first', revenue: '$3M – $5M', city: 'San Diego', region: 'California', country: 'US', tz: 'America/Los_Angeles', area: '619', utm_source: 'meta', utm_medium: 'paid_social', utm_campaign: 'activewear-fall' },
  { stage: 'Call Cancelled', company: 'Glacier & Pine', domain: 'glacierandpine.co', first: 'Cordelia', last: 'Marchetti', role: 'Founder', email_pattern: 'first', revenue: '$500K – $1M', city: 'Banff', region: 'Alberta', country: 'CA', tz: 'America/Edmonton', area: '403', utm_source: 'google', utm_medium: 'organic', utm_campaign: '' },
  { stage: 'Call Cancelled', company: 'Ember & Ash Candles', domain: 'emberashcandles.com', first: 'Reece', last: 'Talanoa', role: 'Owner', email_pattern: 'first', revenue: 'Under $500K', city: 'Auckland', region: 'Auckland', country: 'NZ', tz: 'Pacific/Auckland', area: '09', utm_source: 'instagram', utm_medium: 'organic', utm_campaign: '' },
  { stage: 'Call Cancelled', company: 'Northwind Cookware', domain: 'northwindcookware.com', first: 'Sebastian', last: 'Halversen', role: 'Head of Growth', email_pattern: 'firstlast', revenue: '$10M – $25M', city: 'Boston', region: 'Massachusetts', country: 'US', tz: 'America/New_York', area: '617', utm_source: 'linkedin', utm_medium: 'social', utm_campaign: 'b2b-leadership' },

  // ── Call Complete - Good Fit (9) ──────────────────────────────────
  { stage: 'Call Complete - Good Fit', company: 'Marlow & Wren', domain: 'marlowandwren.com', first: 'Olivia', last: 'Ashworth', role: 'CMO', email_pattern: 'first', revenue: '$5M – $10M', city: 'Nashville', region: 'Tennessee', country: 'US', tz: 'America/Chicago', area: '615', utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'morning-brew-aug' },
  { stage: 'Call Complete - Good Fit', company: 'Cinder & Spruce', domain: 'cinderandspruce.com', first: 'Dax', last: 'Renkenberger', role: 'Founder', email_pattern: 'founder', revenue: '$3M – $5M', city: 'Bend', region: 'Oregon', country: 'US', tz: 'America/Los_Angeles', area: '541', utm_source: 'podcast', utm_medium: 'audio', utm_campaign: 'shopify-masters-ep' },
  { stage: 'Call Complete - Good Fit', company: 'Belmont Bagged Tea', domain: 'belmontbaggedtea.com', first: 'Aurelia', last: 'Schoenwald', role: 'Founder', email_pattern: 'first', revenue: '$1M – $3M', city: 'Berkeley', region: 'California', country: 'US', tz: 'America/Los_Angeles', area: '510', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'tea-prospect', gclid: 'EAIaIQobChMI8KP_demo-Tw0BAEAUYBQAB' },
  { stage: 'Call Complete - Good Fit', company: 'Hatch & Henley', domain: 'hatchandhenley.shop', first: 'Margaux', last: 'Llewellyn', role: 'Co-Founder & CEO', email_pattern: 'first', revenue: '$5M – $10M', city: 'Melbourne', region: 'Victoria', country: 'AU', tz: 'Australia/Melbourne', area: '03', utm_source: 'instagram', utm_medium: 'paid_social', utm_campaign: 'creator-collab-au' },
  { stage: 'Call Complete - Good Fit', company: 'Forge & Fern', domain: 'forgeandfern.co', first: 'Theodore', last: 'Okonkwo', role: 'Director of Ecommerce', email_pattern: 'firstlast', revenue: '$5M – $10M', city: 'Houston', region: 'Texas', country: 'US', tz: 'America/Chicago', area: '713', utm_source: 'meta', utm_medium: 'paid_social', utm_campaign: 'home-fragrance-q3' },
  { stage: 'Call Complete - Good Fit', company: 'Kindred Goods Co.', domain: 'kindredgoods.shop', first: 'Sienna', last: 'Wakefield', role: 'Founder', email_pattern: 'founder', revenue: '$1M – $3M', city: 'Brooklyn', region: 'New York', country: 'US', tz: 'America/New_York', area: '718', utm_source: 'tiktok', utm_medium: 'paid_social', utm_campaign: 'gift-guide-holiday' },
  { stage: 'Call Complete - Good Fit', company: 'Coastline Coffee Trade', domain: 'coastlinecoffee.co', first: 'Magnus', last: 'Eriksen', role: 'Founder', email_pattern: 'first', revenue: '$3M – $5M', city: 'Halifax', region: 'Nova Scotia', country: 'CA', tz: 'America/Halifax', area: '902', utm_source: 'google', utm_medium: 'organic', utm_campaign: '' },
  { stage: 'Call Complete - Good Fit', company: 'Solstice Supply Co.', domain: 'solsticesupply.com', first: 'Indira', last: 'Bhattacharya', role: 'Head of Marketing', email_pattern: 'first', revenue: '$10M – $25M', city: 'San Francisco', region: 'California', country: 'US', tz: 'America/Los_Angeles', area: '415', utm_source: 'linkedin', utm_medium: 'social', utm_campaign: 'agency-comparison' },
  { stage: 'Call Complete - Good Fit', company: 'Pavilion Print Shop', domain: 'pavilionprint.com', first: 'Jasper', last: 'Vinterberg', role: 'Owner', email_pattern: 'first', revenue: '$1M – $3M', city: 'Copenhagen', region: 'Capital Region', country: 'DK', tz: 'Europe/Copenhagen', area: '03', utm_source: 'pinterest', utm_medium: 'organic', utm_campaign: '' },

  // ── Call Complete - Not a Good Fit (5) ────────────────────────────
  { stage: 'Call Complete - Not a Good Fit', company: 'Fernhill Florals', domain: 'fernhillflorals.com', first: 'Genevieve', last: 'Ostrowski', role: 'Owner', email_pattern: 'first', revenue: 'Under $500K', city: 'Pittsburgh', region: 'Pennsylvania', country: 'US', tz: 'America/New_York', area: '412', utm_source: 'google', utm_medium: 'organic', utm_campaign: '' },
  { stage: 'Call Complete - Not a Good Fit', company: 'Brookrun Brewing', domain: 'brookrunbrewing.com', first: 'Hank', last: 'Mulholland', role: 'Co-Founder', email_pattern: 'first', revenue: 'Under $500K', city: 'Burlington', region: 'Vermont', country: 'US', tz: 'America/New_York', area: '802', utm_source: 'facebook', utm_medium: 'paid_social', utm_campaign: 'craft-brew-local' },
  { stage: 'Call Complete - Not a Good Fit', company: 'Saplings & Co.', domain: 'saplingskidsco.com', first: 'Lila', last: 'Hwang', role: 'Founder', email_pattern: 'first', revenue: '$25M+', city: 'Singapore', region: 'Central', country: 'SG', tz: 'Asia/Singapore', area: '06', utm_source: 'linkedin', utm_medium: 'social', utm_campaign: 'enterprise-marketing' },
  { stage: 'Call Complete - Not a Good Fit', company: 'Grayport Hardware', domain: 'grayporthardware.com', first: 'Otto', last: 'Klimkowski', role: 'Marketing Manager', email_pattern: 'firstlast', revenue: 'Under $500K', city: 'Cleveland', region: 'Ohio', country: 'US', tz: 'America/New_York', area: '216', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'tools-search', gclid: 'EAIaIQobChMI2Pq_demo-Cv0BAEAUYASAB' },
  { stage: 'Call Complete - Not a Good Fit', company: 'Highmark Surf Wax', domain: 'highmarksurfwax.com', first: 'Reef', last: 'Donnachadh', role: 'Owner', email_pattern: 'first', revenue: 'Under $500K', city: 'Cornwall', region: 'England', country: 'GB', tz: 'Europe/London', area: '01872', utm_source: 'instagram', utm_medium: 'organic', utm_campaign: '' },

  // ── Call Complete - Sent ICP Elevation (5) ────────────────────────
  { stage: 'Call Complete - Sent ICP Elevation', company: 'Quill & Quartz', domain: 'quillandquartz.com', first: 'Astrid', last: 'Berenger', role: 'Founder', email_pattern: 'first', revenue: '$500K – $1M', city: 'Santa Fe', region: 'New Mexico', country: 'US', tz: 'America/Denver', area: '505', utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'jewelry-roundup' },
  { stage: 'Call Complete - Sent ICP Elevation', company: 'Mossvale Bakery', domain: 'mossvalebakery.com', first: 'Lachlan', last: 'McAvinney', role: 'Co-Founder', email_pattern: 'first', revenue: '$500K – $1M', city: 'Edinburgh', region: 'Scotland', country: 'GB', tz: 'Europe/London', area: '0131', utm_source: 'google', utm_medium: 'organic', utm_campaign: '' },
  { stage: 'Call Complete - Sent ICP Elevation', company: 'Auburn Saddlery', domain: 'auburnsaddlery.com', first: 'Wren', last: 'Pickering', role: 'Owner', email_pattern: 'first', revenue: '$500K – $1M', city: 'Lexington', region: 'Kentucky', country: 'US', tz: 'America/New_York', area: '859', utm_source: 'pinterest', utm_medium: 'organic', utm_campaign: '' },
  { stage: 'Call Complete - Sent ICP Elevation', company: 'Tinder & Tide', domain: 'tinderandtide.shop', first: 'Solange', last: 'Bellerose', role: 'Founder', email_pattern: 'first', revenue: 'Under $500K', city: 'Montreal', region: 'Quebec', country: 'CA', tz: 'America/Toronto', area: '514', utm_source: 'instagram', utm_medium: 'paid_social', utm_campaign: 'fragrance-test' },
  { stage: 'Call Complete - Sent ICP Elevation', company: 'Marbleline Goods', domain: 'marblelinegoods.com', first: 'Iris', last: 'Stankovic', role: 'Founder & CEO', email_pattern: 'first', revenue: '$500K – $1M', city: 'Kansas City', region: 'Missouri', country: 'US', tz: 'America/Chicago', area: '816', utm_source: 'tiktok', utm_medium: 'paid_social', utm_campaign: 'cookware-launch' },

  // ── Call Complete - Follow Up Later (6) ───────────────────────────
  { stage: 'Call Complete - Follow Up Later', company: 'Sundial Coffee Co.', domain: 'sundialcoffeeco.com', first: 'Calla', last: 'Vermeulen', role: 'Founder', email_pattern: 'first', revenue: '$1M – $3M', city: 'Phoenix', region: 'Arizona', country: 'US', tz: 'America/Phoenix', area: '602', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'coffee-subscription', gclid: 'EAIaIQobChMI4Tw_demo-Gv0BAEAUYAAA9' },
  { stage: 'Call Complete - Follow Up Later', company: 'Wildermark Pet', domain: 'wildermarkpet.com', first: 'Quentin', last: 'Albright', role: 'Marketing Director', email_pattern: 'firstlast', revenue: '$3M – $5M', city: 'Raleigh', region: 'North Carolina', country: 'US', tz: 'America/New_York', area: '919', utm_source: 'meta', utm_medium: 'paid_social', utm_campaign: 'pet-food-prospect' },
  { stage: 'Call Complete - Follow Up Later', company: 'Foundry & Frost', domain: 'foundryandfrost.com', first: 'Rosalind', last: 'Castellanos', role: 'Co-Founder', email_pattern: 'first', revenue: '$1M – $3M', city: 'Detroit', region: 'Michigan', country: 'US', tz: 'America/Detroit', area: '313', utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'home-brand-roundup' },
  { stage: 'Call Complete - Follow Up Later', company: 'Heritage Hop Brewing', domain: 'heritagehopbrewing.com', first: 'Kieran', last: 'Mathiesen', role: 'Owner', email_pattern: 'founder', revenue: '$3M – $5M', city: 'Asheville', region: 'North Carolina', country: 'US', tz: 'America/New_York', area: '828', utm_source: 'instagram', utm_medium: 'paid_social', utm_campaign: 'craft-bev-local' },
  { stage: 'Call Complete - Follow Up Later', company: 'Linnea Skincare', domain: 'linneaskincare.com', first: 'Saskia', last: 'Rasmussen', role: 'Founder', email_pattern: 'first', revenue: '$1M – $3M', city: 'Stockholm', region: 'Stockholm', country: 'SE', tz: 'Europe/Stockholm', area: '08', utm_source: 'pinterest', utm_medium: 'organic', utm_campaign: '' },
  { stage: 'Call Complete - Follow Up Later', company: 'Northbeach Apparel', domain: 'northbeachapparel.com.au', first: 'Indigo', last: 'Pemberton', role: 'Head of Ecomm', email_pattern: 'first', revenue: '$3M – $5M', city: 'Gold Coast', region: 'Queensland', country: 'AU', tz: 'Australia/Brisbane', area: '07', utm_source: 'tiktok', utm_medium: 'paid_social', utm_campaign: 'aus-summer-launch' },

  // ── Context Call - Scheduled (7) ──────────────────────────────────
  { stage: 'Context Call - Scheduled', company: 'Birchgrove Botanicals', domain: 'birchgrovebotanicals.com', first: 'Esme', last: 'Vandercroft', role: 'Founder', email_pattern: 'first', revenue: '$3M – $5M', city: 'Eugene', region: 'Oregon', country: 'US', tz: 'America/Los_Angeles', area: '541', utm_source: 'meta', utm_medium: 'paid_social', utm_campaign: 'wellness-prospect-q3' },
  { stage: 'Context Call - Scheduled', company: 'Caspian Tea Trading', domain: 'caspianteatrading.com', first: 'Darius', last: 'Mehrabian', role: 'CMO', email_pattern: 'first', revenue: '$10M – $25M', city: 'Los Angeles', region: 'California', country: 'US', tz: 'America/Los_Angeles', area: '310', utm_source: 'podcast', utm_medium: 'audio', utm_campaign: 'cmo-coffee-talk' },
  { stage: 'Context Call - Scheduled', company: 'Wren & Wool', domain: 'wrenandwool.shop', first: 'Mira', last: 'Halloway', role: 'Founder', email_pattern: 'first', revenue: '$1M – $3M', city: 'Reykjavík', region: 'Capital Region', country: 'IS', tz: 'Atlantic/Reykjavik', area: '05', utm_source: 'instagram', utm_medium: 'paid_social', utm_campaign: 'knitwear-winter' },
  { stage: 'Context Call - Scheduled', company: 'Halestone Outdoors', domain: 'halestoneoutdoors.com', first: 'Beckett', last: 'Donavan', role: 'Director of Growth', email_pattern: 'firstlast', revenue: '$5M – $10M', city: 'Salt Lake City', region: 'Utah', country: 'US', tz: 'America/Denver', area: '801', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'camping-prospect', gclid: 'EAIaIQobChMI4Lp_demo-Hv0BAEAUYBSAA' },
  { stage: 'Context Call - Scheduled', company: 'Pacific Knot Co.', domain: 'pacificknotco.com', first: 'Hana', last: 'Yoshikawa', role: 'Founder', email_pattern: 'first', revenue: '$3M – $5M', city: 'Vancouver', region: 'British Columbia', country: 'CA', tz: 'America/Vancouver', area: '778', utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'agency-pick-list' },
  { stage: 'Context Call - Scheduled', company: 'Moonbridge Co.', domain: 'moonbridgeco.shop', first: 'Renata', last: 'Castellanos', role: 'Co-Founder', email_pattern: 'first', revenue: '$1M – $3M', city: 'Mexico City', region: 'CDMX', country: 'MX', tz: 'America/Mexico_City', area: '55', utm_source: 'tiktok', utm_medium: 'paid_social', utm_campaign: 'jewelry-launch' },
  { stage: 'Context Call - Scheduled', company: 'Saltbrush Skincare', domain: 'saltbrushskincare.com.au', first: 'Acacia', last: 'Whitlam', role: 'Founder', email_pattern: 'first', revenue: '$3M – $5M', city: 'Brisbane', region: 'Queensland', country: 'AU', tz: 'Australia/Brisbane', area: '07', utm_source: 'instagram', utm_medium: 'paid_social', utm_campaign: 'au-clean-beauty' },

  // ── Context Call - Cancelled (3) ──────────────────────────────────
  { stage: 'Context Call - Cancelled', company: 'Ridgeline Snacks', domain: 'ridgelinesnacks.com', first: 'Felix', last: 'Hawthorne', role: 'Founder', email_pattern: 'founder', revenue: '$1M – $3M', city: 'Boise', region: 'Idaho', country: 'US', tz: 'America/Boise', area: '208', utm_source: 'meta', utm_medium: 'paid_social', utm_campaign: 'snack-prospect' },
  { stage: 'Context Call - Cancelled', company: 'Larkfield Beauty', domain: 'larkfieldbeauty.co', first: 'Cosima', last: 'DeAngelis', role: 'Brand Director', email_pattern: 'first', revenue: '$3M – $5M', city: 'Manchester', region: 'England', country: 'GB', tz: 'Europe/London', area: '0161', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'beauty-uk', gclid: 'EAIaIQobChMI3R_demo-Hg0BAEAUYBSAA' },
  { stage: 'Context Call - Cancelled', company: 'Driftwood Surf Club', domain: 'driftwoodsurfclub.com', first: 'Tane', last: 'Whareaitu', role: 'Founder', email_pattern: 'first', revenue: '$500K – $1M', city: 'Wellington', region: 'Wellington', country: 'NZ', tz: 'Pacific/Auckland', area: '04', utm_source: 'instagram', utm_medium: 'organic', utm_campaign: '' },

  // ── Context Call - Complete (6) ───────────────────────────────────
  { stage: 'Context Call - Complete', company: 'Bramble & Bone', domain: 'brambleandbone.shop', first: 'Devon', last: 'Okafor', role: 'Marketing Director', email_pattern: 'first', revenue: '$5M – $10M', city: 'Chicago', region: 'Illinois', country: 'US', tz: 'America/Chicago', area: '312', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'branded-search-us', utm_term: 'dog supplements premium', gclid: 'EAIaIQobChMIxK7P9_demo-Cv0BAEAUYASAB' },
  { stage: 'Context Call - Complete', company: 'Anvil & Acre', domain: 'anvilandacre.com', first: 'Tobias', last: 'Hellquist', role: 'Co-Founder', email_pattern: 'first', revenue: '$3M – $5M', city: 'Portland', region: 'Maine', country: 'US', tz: 'America/New_York', area: '207', utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'maker-brands-roundup' },
  { stage: 'Context Call - Complete', company: 'Lyra Athletics', domain: 'lyraathletics.com', first: 'Camryn', last: 'Westergaard', role: 'Head of Growth', email_pattern: 'first', revenue: '$10M – $25M', city: 'Austin', region: 'Texas', country: 'US', tz: 'America/Chicago', area: '737', utm_source: 'meta', utm_medium: 'paid_social', utm_campaign: 'activewear-scaleout' },
  { stage: 'Context Call - Complete', company: 'Halewood Home', domain: 'halewoodhome.com', first: 'Florence', last: 'Bramwell', role: 'CMO', email_pattern: 'first', revenue: '$10M – $25M', city: 'Bristol', region: 'England', country: 'GB', tz: 'Europe/London', area: '0117', utm_source: 'linkedin', utm_medium: 'social', utm_campaign: 'agency-shortlist' },
  { stage: 'Context Call - Complete', company: 'Mariner & Pine', domain: 'marinerandpine.co', first: 'Niko', last: 'Theodorou', role: 'Founder', email_pattern: 'first', revenue: '$3M – $5M', city: 'Sydney', region: 'New South Wales', country: 'AU', tz: 'Australia/Sydney', area: '02', utm_source: 'podcast', utm_medium: 'audio', utm_campaign: 'aus-dtc-show' },
  { stage: 'Context Call - Complete', company: 'Nightowl Coffee Co.', domain: 'nightowlcoffeeco.com', first: 'Esther', last: 'Klimowicz', role: 'Founder & CEO', email_pattern: 'first', revenue: '$3M – $5M', city: 'Pittsburgh', region: 'Pennsylvania', country: 'US', tz: 'America/New_York', area: '412', utm_source: 'tiktok', utm_medium: 'paid_social', utm_campaign: 'coffee-creators' },

  // ── Growth Strategy Sent (8) ──────────────────────────────────────
  { stage: 'Growth Strategy Sent', company: 'Foxglove & Fern', domain: 'foxgloveandfern.com', first: 'Vivienne', last: 'Carrington', role: 'Founder', email_pattern: 'first', revenue: '$5M – $10M', city: 'Charleston', region: 'South Carolina', country: 'US', tz: 'America/New_York', area: '843', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'home-fragrance-search', gclid: 'EAIaIQobChMI8XQ_demo-Hv0BAEAUYAAAR' },
  { stage: 'Growth Strategy Sent', company: 'Eastpoint Apparel Co.', domain: 'eastpointapparel.com', first: 'Lincoln', last: 'Vanderberg', role: 'Director of Marketing', email_pattern: 'firstlast', revenue: '$10M – $25M', city: 'Brooklyn', region: 'New York', country: 'US', tz: 'America/New_York', area: '929', utm_source: 'meta', utm_medium: 'paid_social', utm_campaign: 'menswear-q3' },
  { stage: 'Growth Strategy Sent', company: 'Coppermill Cookware', domain: 'coppermillcookware.com', first: 'Adelaide', last: 'Strathmore', role: 'Co-Founder', email_pattern: 'first', revenue: '$5M – $10M', city: 'Calgary', region: 'Alberta', country: 'CA', tz: 'America/Edmonton', area: '587', utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'kitchen-roundup' },
  { stage: 'Growth Strategy Sent', company: 'Sailmaker Supplies', domain: 'sailmakersupplies.com', first: 'Flynn', last: 'Holmgren', role: 'Owner', email_pattern: 'first', revenue: '$1M – $3M', city: 'Newport', region: 'Rhode Island', country: 'US', tz: 'America/New_York', area: '401', utm_source: 'referral', utm_medium: 'word_of_mouth', utm_campaign: 'industry-referral' },
  { stage: 'Growth Strategy Sent', company: 'Verve & Vine', domain: 'verveandvine.shop', first: 'Tatiana', last: 'Brzezinski', role: 'Founder', email_pattern: 'first', revenue: '$3M – $5M', city: 'Warsaw', region: 'Mazovia', country: 'PL', tz: 'Europe/Warsaw', area: '022', utm_source: 'instagram', utm_medium: 'paid_social', utm_campaign: 'eu-launch-q4' },
  { stage: 'Growth Strategy Sent', company: 'Pebblebrook Pet', domain: 'pebblebrookpet.com', first: 'Auggie', last: 'Marshfield', role: 'Founder', email_pattern: 'founder', revenue: '$5M – $10M', city: 'Charlotte', region: 'North Carolina', country: 'US', tz: 'America/New_York', area: '704', utm_source: 'youtube', utm_medium: 'video', utm_campaign: 'creator-sponsorship' },
  { stage: 'Growth Strategy Sent', company: 'Heatherly & Sons', domain: 'heatherlyandsons.co.uk', first: 'Edmund', last: 'Heatherly', role: 'Director', email_pattern: 'firstlast', revenue: '$3M – $5M', city: 'Bath', region: 'England', country: 'GB', tz: 'Europe/London', area: '01225', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'mens-grooming-uk', gclid: 'EAIaIQobChMI8KQ_demo-Hv0BAEAUYBSAB' },
  { stage: 'Growth Strategy Sent', company: 'Alpine Fern', domain: 'alpinefern.co', first: 'Linnea', last: 'Norgaard', role: 'Brand Director', email_pattern: 'first', revenue: '$10M – $25M', city: 'Denver', region: 'Colorado', country: 'US', tz: 'America/Denver', area: '720', utm_source: 'linkedin', utm_medium: 'social', utm_campaign: 'cmo-thought-leadership' },

  // ── Key Findings - Call Booked (5) ────────────────────────────────
  { stage: 'Key Findings - Call Booked', company: 'Wayfare Watch Co.', domain: 'wayfarewatchco.com', first: 'Atticus', last: 'Pemberton', role: 'Co-Founder', email_pattern: 'first', revenue: '$5M – $10M', city: 'Geneva', region: 'Geneva', country: 'CH', tz: 'Europe/Zurich', area: '022', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'watches-cpc', gclid: 'EAIaIQobChMI8KP_demo-Mw0BAEAUYBSAB' },
  { stage: 'Key Findings - Call Booked', company: 'Brimwood & Co.', domain: 'brimwoodco.shop', first: 'Rosaline', last: 'Dvoracek', role: 'Founder', email_pattern: 'first', revenue: '$3M – $5M', city: 'Prague', region: 'Prague', country: 'CZ', tz: 'Europe/Prague', area: '0220', utm_source: 'meta', utm_medium: 'paid_social', utm_campaign: 'eu-prospect' },
  { stage: 'Key Findings - Call Booked', company: 'Riverstone Bath Co.', domain: 'riverstonebath.com', first: 'Annika', last: 'Holmberg', role: 'Founder', email_pattern: 'first', revenue: '$3M – $5M', city: 'Salt Lake City', region: 'Utah', country: 'US', tz: 'America/Denver', area: '385', utm_source: 'pinterest', utm_medium: 'organic', utm_campaign: '' },
  { stage: 'Key Findings - Call Booked', company: 'Pinegrove Pet Co.', domain: 'pinegrovepet.com', first: 'Cyrus', last: 'Larkin', role: 'Marketing Director', email_pattern: 'firstlast', revenue: '$5M – $10M', city: 'Indianapolis', region: 'Indiana', country: 'US', tz: 'America/Indianapolis', area: '317', utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'pet-newsletter-jul' },
  { stage: 'Key Findings - Call Booked', company: 'Marigold Bakehouse', domain: 'marigoldbakehouse.com', first: 'Penelope', last: 'Rothwell', role: 'Owner', email_pattern: 'first', revenue: '$1M – $3M', city: 'Ottawa', region: 'Ontario', country: 'CA', tz: 'America/Toronto', area: '613', utm_source: 'instagram', utm_medium: 'paid_social', utm_campaign: 'baked-goods-fall' },

  // ── Key Findings - Call Cancelled (2) ─────────────────────────────
  { stage: 'Key Findings - Call Cancelled', company: 'Hartwood & Cane', domain: 'hartwoodandcane.com', first: 'Mariana', last: 'Salamanca', role: 'Co-Founder', email_pattern: 'first', revenue: '$3M – $5M', city: 'Madrid', region: 'Madrid', country: 'ES', tz: 'Europe/Madrid', area: '091', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'home-eu-cpc', gclid: 'EAIaIQobChMI3HX_demo-7Bw0BAEAUYBQAB' },
  { stage: 'Key Findings - Call Cancelled', company: 'Westvale Athletics', domain: 'westvaleathletics.com', first: 'Spencer', last: 'Holderman', role: 'Director of Growth', email_pattern: 'firstlast', revenue: '$10M – $25M', city: 'San Diego', region: 'California', country: 'US', tz: 'America/Los_Angeles', area: '858', utm_source: 'meta', utm_medium: 'paid_social', utm_campaign: 'activewear-scaleout' },

  // ── Followup (7) ──────────────────────────────────────────────────
  { stage: 'Followup', company: 'Atlas & Anchor', domain: 'atlasandanchor.shop', first: 'Beau', last: 'Rasmussen', role: 'Founder', email_pattern: 'first', revenue: '$3M – $5M', city: 'Newport Beach', region: 'California', country: 'US', tz: 'America/Los_Angeles', area: '949', utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'lifestyle-roundup' },
  { stage: 'Followup', company: 'Hollyhock Skincare', domain: 'hollyhockskincare.com', first: 'Cassandra', last: 'Vukovich', role: 'Founder & Formulator', email_pattern: 'first', revenue: '$1M – $3M', city: 'Tampa', region: 'Florida', country: 'US', tz: 'America/New_York', area: '813', utm_source: 'tiktok', utm_medium: 'paid_social', utm_campaign: 'skincare-creator-test' },
  { stage: 'Followup', company: 'Cobblestone Coffee', domain: 'cobblestonecoffeeco.com', first: 'Theodora', last: 'Lindgren', role: 'Co-Founder', email_pattern: 'first', revenue: '$1M – $3M', city: 'Boston', region: 'Massachusetts', country: 'US', tz: 'America/New_York', area: '857', utm_source: 'instagram', utm_medium: 'organic', utm_campaign: '' },
  { stage: 'Followup', company: 'Peakridge Pet', domain: 'peakridgepet.com', first: 'Jonas', last: 'Bertelsen', role: 'CMO', email_pattern: 'first', revenue: '$5M – $10M', city: 'Aarhus', region: 'Central Denmark', country: 'DK', tz: 'Europe/Copenhagen', area: '086', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'pet-eu-cpc', gclid: 'EAIaIQobChMI8XR_demo-Aw0BAEAUYAAA-' },
  { stage: 'Followup', company: 'Whitepine Provisions', domain: 'whitepineprovisions.com', first: 'Ruby', last: 'Mansfield', role: 'Founder', email_pattern: 'first', revenue: '$1M – $3M', city: 'Burlington', region: 'Vermont', country: 'US', tz: 'America/New_York', area: '802', utm_source: 'pinterest', utm_medium: 'organic', utm_campaign: '' },
  { stage: 'Followup', company: 'Northrun Knitwear', domain: 'northrunknitwear.com.au', first: 'Asha', last: 'Whittaker', role: 'Owner', email_pattern: 'first', revenue: '$500K – $1M', city: 'Hobart', region: 'Tasmania', country: 'AU', tz: 'Australia/Hobart', area: '03', utm_source: 'instagram', utm_medium: 'organic', utm_campaign: '' },
  { stage: 'Followup', company: 'Westmark Cookware Co.', domain: 'westmarkcookware.com', first: 'Holland', last: 'Brzezinski', role: 'Brand Director', email_pattern: 'first', revenue: '$5M – $10M', city: 'Phoenix', region: 'Arizona', country: 'US', tz: 'America/Phoenix', area: '480', utm_source: 'meta', utm_medium: 'paid_social', utm_campaign: 'cookware-prospect' },

  // ── Won (4) ───────────────────────────────────────────────────────
  { stage: 'Won 🎉', company: 'Brookline Botanicals', domain: 'brooklinebotanicals.com', first: 'Adelaide', last: 'Karaitiana', role: 'Founder & CEO', email_pattern: 'first', revenue: '$5M – $10M', city: 'Wellington', region: 'Wellington', country: 'NZ', tz: 'Pacific/Auckland', area: '04', utm_source: 'podcast', utm_medium: 'audio', utm_campaign: 'female-founders-pod' },
  { stage: 'Won 🎉', company: 'Halberd & Holm', domain: 'halberdandholm.com', first: 'Fenton', last: 'Vanstrom', role: 'Co-Founder', email_pattern: 'first', revenue: '$10M – $25M', city: 'Minneapolis', region: 'Minnesota', country: 'US', tz: 'America/Chicago', area: '763', utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'agency-shortlist' },
  { stage: 'Won 🎉', company: 'Saltgrove Skincare', domain: 'saltgroveskincare.com.au', first: 'Marigold', last: 'Whittaker', role: 'Founder', email_pattern: 'first', revenue: '$5M – $10M', city: 'Adelaide', region: 'South Australia', country: 'AU', tz: 'Australia/Adelaide', area: '08', utm_source: 'instagram', utm_medium: 'paid_social', utm_campaign: 'aus-clean-beauty-q2' },
  { stage: 'Won 🎉', company: 'Cedarvale Coffee', domain: 'cedarvalecoffee.com', first: 'Nathaniel', last: 'Korsgaard', role: 'Founder', email_pattern: 'founder', revenue: '$3M – $5M', city: 'Seattle', region: 'Washington', country: 'US', tz: 'America/Los_Angeles', area: '425', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'coffee-subscription-cpc', gclid: 'EAIaIQobChMI8XQ_demo-Hg0BAEAUYAAA-' },

  // ── Lost (3) ──────────────────────────────────────────────────────
  { stage: 'Lost', company: 'Pemberton Pottery', domain: 'pembertonpottery.com', first: 'Daphne', last: 'Calloway', role: 'Owner', email_pattern: 'first', revenue: 'Under $500K', city: 'Asheville', region: 'North Carolina', country: 'US', tz: 'America/New_York', area: '828', utm_source: 'pinterest', utm_medium: 'organic', utm_campaign: '' },
  { stage: 'Lost', company: 'Briarcliff Bakery Co.', domain: 'briarcliffbakery.com', first: 'Otis', last: 'Halvorsen', role: 'Co-Founder', email_pattern: 'first', revenue: '$500K – $1M', city: 'Charleston', region: 'South Carolina', country: 'US', tz: 'America/New_York', area: '843', utm_source: 'facebook', utm_medium: 'paid_social', utm_campaign: 'bakery-prospect' },
  { stage: 'Lost', company: 'Maritime Mercantile', domain: 'maritimemercantile.com', first: 'Sterling', last: 'Whitcombe', role: 'CMO', email_pattern: 'firstlast', revenue: '$10M – $25M', city: 'Halifax', region: 'Nova Scotia', country: 'CA', tz: 'America/Halifax', area: '902', utm_source: 'linkedin', utm_medium: 'social', utm_campaign: 'enterprise-marketing' },
];

// ── Helpers ────────────────────────────────────────────────────────────

function emailFor(p) {
  const f = p.first.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const l = p.last.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
  if (p.email_pattern === 'founder') return `founder@${p.domain}`;
  if (p.email_pattern === 'firstlast') return `${f}.${l}@${p.domain}`;
  return `${f}@${p.domain}`;
}

// Reserved fictional phone-number ranges by country.
//   US/CA: 555-01XX (NANPA reserved for fictional use)
//   AU:    NSC + 5550 XXXX
//   GB:    +44 area 7946 XXXX (Ofcom drama range — adapted across area codes)
//   Others: +CC 5550 XXXX as a best-effort fictional pattern
function phoneFor(p, idx) {
  const last4 = String(100 + (idx % 9899)).padStart(4, '0').slice(-4);
  const last2 = String((idx % 99)).padStart(2, '0');
  if (p.country === 'US' || p.country === 'CA') {
    return `+1 ${p.area}-555-01${last2}`;
  }
  if (p.country === 'AU') {
    return `+61 ${p.area} 5550 ${last4}`;
  }
  if (p.country === 'GB') {
    return `+44 ${p.area} 7946 ${last4}`;
  }
  if (p.country === 'NZ') return `+64 ${p.area} 5550 ${last4}`;
  if (p.country === 'IE') return `+353 ${p.area} 555 ${last4}`;
  if (p.country === 'DK') return `+45 5550 ${last4}`;
  if (p.country === 'SE') return `+46 ${p.area} 5550 ${last4}`;
  if (p.country === 'CH') return `+41 ${p.area} 555 ${last4}`;
  if (p.country === 'CZ') return `+420 ${p.area} 555 ${last4}`;
  if (p.country === 'PL') return `+48 ${p.area} 5550 ${last4}`;
  if (p.country === 'ES') return `+34 ${p.area} 555 ${last4}`;
  if (p.country === 'IS') return `+354 555 ${last4}`;
  if (p.country === 'SG') return `+65 5550 ${last4}`;
  if (p.country === 'MX') return `+52 ${p.area} 5550 ${last4}`;
  return `+1 555-01${last2}`;
}

// Documentation IPs (RFC 5737 / IANA reserved): 192.0.2.x, 198.51.100.x, 203.0.113.x
function ipFor(idx) {
  const blocks = ['192.0.2', '198.51.100', '203.0.113'];
  return `${blocks[idx % 3]}.${(idx % 250) + 2}`;
}

// Deal value sized to the prospect's revenue tier, with a deterministic
// spread by index so the pipeline shows a natural distribution rather than
// every $5M brand at the same number. Rounded to look like a real CRM
// estimate, not a calculated value. Range covers $50k → $50M.
function valueFor(revenue, idx) {
  const ranges = {
    'Under $500K':   [50000, 120000, 5000],
    '$500K – $1M':   [80000, 200000, 5000],
    '$1M – $3M':     [120000, 400000, 10000],
    '$3M – $5M':     [250000, 700000, 25000],
    '$5M – $10M':    [500000, 1800000, 50000],
    '$10M – $25M':   [1500000, 6000000, 100000],
    '$25M+':         [4000000, 50000000, 500000],
  };
  const r = ranges[revenue] || ranges['$1M – $3M'];
  const [min, max, step] = r;
  const span = max - min;
  // Deterministic spread using a small hash on idx
  const hash = ((idx * 2654435761) >>> 0) % 1000;
  const raw = min + Math.floor((span * hash) / 1000);
  return Math.round(raw / step) * step;
}

// ── Attio API ──────────────────────────────────────────────────────────

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
  if (!res.ok) throw new Error(`Company upsert (${domain}) failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.data?.id?.record_id;
}

async function upsertPerson(p, idx, companyId) {
  const email = emailFor(p);
  const phone = phoneFor(p, idx);
  const ip = ipFor(idx);

  const values = {
    name: [{ first_name: p.first, last_name: p.last, full_name: `${p.first} ${p.last}` }],
    email_addresses: [{ email_address: email }],
    phone_numbers: [{ original_phone_number: phone }],
    revenue_range: [{ option: p.revenue }],
    lead_source: [{ value: 'Demo Data' }],
    geo_city: [{ value: p.city }],
    geo_region: [{ value: p.region }],
    geo_country: [{ value: p.country }],
    geo_timezone: [{ value: p.tz }],
    ip_address: [{ value: ip }],
    company: [{ target_object: 'companies', target_record_id: companyId }],
  };
  if (p.utm_source) values.utm_source = [{ value: p.utm_source }];
  if (p.utm_medium) values.utm_medium = [{ value: p.utm_medium }];
  if (p.utm_campaign) values.utm_campaign = [{ value: p.utm_campaign }];
  if (p.utm_content) values.utm_content = [{ value: p.utm_content }];
  if (p.utm_term) values.utm_term = [{ value: p.utm_term }];
  if (p.gclid) values.gclid = [{ value: p.gclid }];

  let res = await fetch(`${BASE_URL}/objects/people/records?matching_attribute=email_addresses`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ data: { values } }),
  });

  // Attio uses libphonenumber and rejects some country/area-code combos that
  // don't match real dialing patterns (e.g. UK 0131 + 7946). Retry without
  // the phone field — the rest of the record is still valuable.
  if (!res.ok) {
    const errText = await res.text();
    if (errText.includes('phone_numbers') || errText.includes('phone number')) {
      delete values.phone_numbers;
      res = await fetch(`${BASE_URL}/objects/people/records?matching_attribute=email_addresses`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ data: { values } }),
      });
      if (!res.ok) throw new Error(`Person upsert (${email}, no phone) failed: ${res.status} ${await res.text()}`);
    } else {
      throw new Error(`Person upsert (${email}) failed: ${res.status} ${errText}`);
    }
  }

  const data = await res.json();
  return data.data?.id?.record_id;
}

async function createDeal(p, idx, personId, companyId) {
  const dealName = `${p.first} ${p.last} — ${p.domain}`;
  const values = {
    name: [{ value: dealName }],
    stage: [{ status: p.stage }],
    value: [{ currency_value: valueFor(p.revenue, idx) }],
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
  if (!res.ok) throw new Error(`Deal create (${dealName}) failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.data?.id?.record_id;
}

async function main() {
  console.log(`Seeding ${DEMO.length} demo deals into Attio…\n`);

  const ids = loadIds();
  let created = 0;
  let failed = 0;

  for (let i = 0; i < DEMO.length; i++) {
    const p = DEMO[i];
    const label = `[${i + 1}/${DEMO.length}] ${p.first} ${p.last} — ${p.domain} (${p.stage})`;
    try {
      const companyId = await upsertCompany(p.domain, p.company);
      const personId = await upsertPerson(p, i, companyId);
      const dealId = await createDeal(p, i, personId, companyId);

      if (!ids.companies.includes(companyId)) ids.companies.push(companyId);
      if (!ids.people.includes(personId)) ids.people.push(personId);
      ids.deals.push(dealId);
      saveIds(ids);

      console.log(`  ✓ ${label}`);
      created++;
    } catch (err) {
      console.error(`  ✗ ${label}\n      ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. Created ${created} deals, ${failed} failures.`);
  console.log(`IDs saved to ${IDS_FILE}`);
}

main().catch((err) => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
