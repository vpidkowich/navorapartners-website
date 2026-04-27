/**
 * Google Apps Script — paste this into Extensions → Apps Script in your Google Sheet.
 *
 * Setup:
 * 1. Create a Google Sheet with these column headers in row 1:
 *    Timestamp | First Name | Last Name | Email | Phone | Revenue | Website |
 *    UTM Source | UTM Medium | UTM Campaign | UTM Content | UTM Term | GCLID |
 *    IP | City | Region | Country | Timezone
 *
 * 2. Extensions → Apps Script → paste this code → Save
 * 3. Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the web app URL → set as GOOGLE_SHEET_WEBHOOK_URL in Cloudflare Pages env vars
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    var row = [
      data.timestamp || new Date().toISOString(),
      data.first_name || '',
      data.last_name || '',
      data.email || '',
      data.phone || '',
      data.revenue || '',
      data.website_url || '',
      data.utm_source || '',
      data.utm_medium || '',
      data.utm_campaign || '',
      data.utm_content || '',
      data.utm_term || '',
      data.gclid || '',
      data.ip || '',
      data.city || '',
      data.region || '',
      data.country || '',
      data.timezone || '',
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
