/**
 * Google Apps Script — paste this into Extensions → Apps Script in your
 * Talent Submissions Google Sheet.
 *
 * Setup:
 * 1. Create a new Google Sheet titled "Talent Submissions" with these
 *    column headers in row 1 (in this exact order):
 *
 *    Timestamp | First Name | Last Name | Email | LinkedIn URL |
 *    Resume URL | Role Applied For | Source Page |
 *    IP | City | Region | Country | Timezone
 *
 * 2. Extensions → Apps Script → paste this code → Save
 * 3. Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the web app URL → set as TALENT_SHEET_WEBHOOK_URL in
 *    Cloudflare Pages env vars
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
      data.linkedin_url || '',
      data.resume_url || '',
      data.role_applied_for || '',
      data.source_page || '',
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
