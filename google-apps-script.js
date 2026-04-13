// ============================================================
// Google Apps Script — AI Innovation Challenge Backend
// ============================================================
// 
// HOW TO DEPLOY:
// 1. Go to https://script.google.com and create a new project
// 2. Paste this entire code into the Code.gs file
// 3. Click Deploy → New Deployment
// 4. Select type: "Web app"
// 5. Set "Execute as": Me (your email)
// 6. Set "Who has access": Anyone
// 7. Click Deploy and copy the Web App URL
// 8. Paste the URL into GOOGLE_SCRIPT_URL in your index.html
//
// This script will:
// - Save submissions to a Google Sheet (auto-created)
// - Send notification emails to all 4 judges
// - Send an acknowledgement email to the submitter
// ============================================================

const SHEET_NAME = 'AI Challenge Submissions';

// Judge/Notification Recipients
const JUDGES = [
  { name: 'Nitin Panwad',     email: 'nitin.panwad@vglgroup.com',     role: 'CFO' },
  { name: 'Aswini Agrawal',   email: 'aswini.agrawal@vglgroup.com',   role: 'Head of Supply Chain Management' },
  { name: 'Deepak Sachdeva',  email: 'deepak.sachdeva@vglgroup.com',  role: 'App Dev Delivery & Management Head' },
  { name: 'Sabaresh Thamatat', email: 'sabaresh@vglgroup.com',        role: 'CHRO' }
];

// ============================================================
// Web App Entry Points
// ============================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'newSubmission') {
      const sub = data.submission;
      
      // 1. Save to Google Sheet
      saveToSheet(sub);
      
      // 2. Send notification emails to judges
      sendJudgeNotifications(sub);
      
      // 3. Send acknowledgement to submitter
      sendAcknowledgement(sub);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Submission saved and emails sent'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'getSubmissions') {
      const submissions = getFromSheet();
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        submissions: submissions
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Unknown action'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'AI Challenge Backend is running'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// Google Sheets Database
// ============================================================

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create(SHEET_NAME);
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Add headers
    sheet.getRange(1, 1, 1, 11).setValues([[
      'ID', 'Full Name', 'Email', 'Department', 'Idea Title',
      'Description', 'AI Tools', 'Team Members', 'Prototype Link',
      'Submitted On', 'Status'
    ]]);
    // Format header row
    sheet.getRange(1, 1, 1, 11)
      .setFontWeight('bold')
      .setBackground('#1a56db')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    // Set column widths
    sheet.setColumnWidth(1, 50);   // ID
    sheet.setColumnWidth(2, 180);  // Name
    sheet.setColumnWidth(3, 250);  // Email
    sheet.setColumnWidth(4, 150);  // Dept
    sheet.setColumnWidth(5, 250);  // Title
    sheet.setColumnWidth(6, 400);  // Description
    sheet.setColumnWidth(7, 200);  // Tools
    sheet.setColumnWidth(8, 200);  // Team
    sheet.setColumnWidth(9, 300);  // Link
    sheet.setColumnWidth(10, 180); // Date
    sheet.setColumnWidth(11, 100); // Status
  }
  
  return sheet;
}

function saveToSheet(sub) {
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  const id = lastRow; // Row number as ID
  const timestamp = sub.timestamp || new Date().toISOString();
  
  sheet.appendRow([
    id,
    sub.name,
    sub.email,
    sub.department,
    sub.ideaTitle || '',
    sub.idea,
    sub.tools || '',
    sub.team || 'Solo',
    sub.link,
    new Date(timestamp).toLocaleString('en-IN'),
    'New'
  ]);
}

function getFromSheet() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

// ============================================================
// Email: Judge Notifications
// ============================================================

function sendJudgeNotifications(sub) {
  const timestamp = new Date(sub.timestamp || new Date()).toLocaleString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short'
  });
  
  const subject = `🚀 New AI Challenge Submission: "${sub.ideaTitle || 'New Idea'}" by ${sub.name}`;
  
  const htmlBody = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto">
      <div style="background:linear-gradient(135deg,#1a56db,#7c3aed);padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;font-size:20px;margin:0">🤖 AI Innovation Challenge</h1>
        <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0">New Idea Submission Received</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px">
        <p style="color:#111827;font-size:15px;line-height:1.6;margin:0 0 20px">
          A new idea has been submitted to the AI Innovation Challenge. Here are the details:
        </p>
        
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr style="border-bottom:1px solid #f3f4f6">
            <td style="padding:10px 0;color:#6b7280;font-weight:600;width:140px;vertical-align:top">Submitted by</td>
            <td style="padding:10px 0;color:#111827"><strong>${sub.name}</strong></td>
          </tr>
          <tr style="border-bottom:1px solid #f3f4f6">
            <td style="padding:10px 0;color:#6b7280;font-weight:600;vertical-align:top">Email</td>
            <td style="padding:10px 0;color:#111827"><a href="mailto:${sub.email}" style="color:#1a56db">${sub.email}</a></td>
          </tr>
          <tr style="border-bottom:1px solid #f3f4f6">
            <td style="padding:10px 0;color:#6b7280;font-weight:600;vertical-align:top">Department</td>
            <td style="padding:10px 0;color:#111827">${sub.department}</td>
          </tr>
          <tr style="border-bottom:1px solid #f3f4f6">
            <td style="padding:10px 0;color:#6b7280;font-weight:600;vertical-align:top">Idea Title</td>
            <td style="padding:10px 0;color:#111827"><strong>${sub.ideaTitle || 'N/A'}</strong></td>
          </tr>
          <tr style="border-bottom:1px solid #f3f4f6">
            <td style="padding:10px 0;color:#6b7280;font-weight:600;vertical-align:top">Description</td>
            <td style="padding:10px 0;color:#111827;line-height:1.6">${sub.idea}</td>
          </tr>
          <tr style="border-bottom:1px solid #f3f4f6">
            <td style="padding:10px 0;color:#6b7280;font-weight:600;vertical-align:top">AI Tools Used</td>
            <td style="padding:10px 0;color:#111827">${sub.tools || 'Not specified'}</td>
          </tr>
          <tr style="border-bottom:1px solid #f3f4f6">
            <td style="padding:10px 0;color:#6b7280;font-weight:600;vertical-align:top">Team Members</td>
            <td style="padding:10px 0;color:#111827">${sub.team || 'Solo submission'}</td>
          </tr>
          <tr style="border-bottom:1px solid #f3f4f6">
            <td style="padding:10px 0;color:#6b7280;font-weight:600;vertical-align:top">Prototype</td>
            <td style="padding:10px 0"><a href="${sub.link}" style="color:#1a56db;text-decoration:none">${sub.link}</a></td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#6b7280;font-weight:600;vertical-align:top">Submitted</td>
            <td style="padding:10px 0;color:#111827">${timestamp}</td>
          </tr>
        </table>
        
        <div style="margin-top:24px;padding:16px;background:#f0f7ff;border-radius:8px;border-left:4px solid #1a56db">
          <p style="margin:0;font-size:13px;color:#1e40af">
            <strong>Action needed:</strong> Please review this submission before the judging deadline. 
            You can view the prototype by clicking the link above.
          </p>
        </div>
      </div>
      <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px">
        AI Innovation Challenge · VGL Group · This is an automated notification
      </p>
    </div>
  `;
  
  JUDGES.forEach(judge => {
    try {
      MailApp.sendEmail({
        to: judge.email,
        subject: subject,
        htmlBody: htmlBody,
        name: 'AI Innovation Challenge'
      });
    } catch (err) {
      console.error('Failed to send to ' + judge.email + ': ' + err);
    }
  });
}

// ============================================================
// Email: Acknowledgement to Submitter
// ============================================================

function sendAcknowledgement(sub) {
  const subject = `✅ Your AI Challenge submission has been received — "${sub.ideaTitle || 'Your Idea'}"`;
  
  const htmlBody = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto">
      <div style="background:linear-gradient(135deg,#059669,#10b981);padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;font-size:20px;margin:0">🎯 You're in the running!</h1>
        <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0">AI Innovation Challenge — Submission Confirmed</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:28px 32px;border-radius:0 0 12px 12px">
        <p style="color:#111827;font-size:15px;line-height:1.7;margin:0 0 16px">
          Hi <strong>${sub.name}</strong>,
        </p>
        <p style="color:#111827;font-size:15px;line-height:1.7;margin:0 0 16px">
          Thank you for submitting your idea to the AI Innovation Challenge! We've received your entry and it has been logged successfully.
        </p>
        
        <div style="background:#f9fafb;border-radius:10px;padding:20px;margin:20px 0">
          <h3 style="margin:0 0 12px;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Your Submission Summary</h3>
          <p style="margin:0 0 8px;font-size:14px"><strong>Idea:</strong> ${sub.ideaTitle || 'N/A'}</p>
          <p style="margin:0 0 8px;font-size:14px"><strong>Department:</strong> ${sub.department}</p>
          <p style="margin:0 0 8px;font-size:14px"><strong>Tools:</strong> ${sub.tools || 'N/A'}</p>
          <p style="margin:0;font-size:14px"><strong>Team:</strong> ${sub.team || 'Solo'}</p>
        </div>
        
        <h3 style="font-size:15px;color:#111827;margin:20px 0 10px">What happens next?</h3>
        <ol style="color:#374151;font-size:14px;line-height:1.8;padding-left:20px;margin:0">
          <li>Our judging panel will review all submissions after the deadline</li>
          <li>Each entry is evaluated on impact, feasibility, creativity, and demo clarity</li>
          <li>Winners will be announced at an exclusive award ceremony</li>
        </ol>
        
        <div style="margin-top:24px;padding:16px;background:#fef3c7;border-radius:8px;border-left:4px solid #d97706">
          <p style="margin:0;font-size:13px;color:#92400e">
            <strong>Pro tip:</strong> Make sure your prototype link is accessible and working. 
            Judges will use it during evaluation. You can submit up to 2 ideas total.
          </p>
        </div>
        
        <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:24px 0 0">
          Good luck — you've already done the hardest part! 🚀
        </p>
      </div>
      <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px">
        AI Innovation Challenge · VGL Group<br>
        Questions? Write to <a href="mailto:Sabaresh@vglgroup.com" style="color:#1a56db">Sabaresh@vglgroup.com</a>
      </p>
    </div>
  `;
  
  try {
    MailApp.sendEmail({
      to: sub.email,
      subject: subject,
      htmlBody: htmlBody,
      name: 'AI Innovation Challenge'
    });
  } catch (err) {
    console.error('Failed to send ack to ' + sub.email + ': ' + err);
  }
}

// ============================================================
// Test function (run manually to test)
// ============================================================
function testSubmission() {
  const testSub = {
    name: 'Test User',
    email: 'your-test-email@example.com', // Change to your email
    department: 'IT / Application Development',
    ideaTitle: 'AI-Powered Test Automation',
    idea: 'This is a test submission to verify the email and sheet integration is working correctly.',
    tools: 'Claude API, Python',
    team: '',
    link: 'https://example.com/demo',
    timestamp: new Date().toISOString(),
    status: 'new'
  };
  
  saveToSheet(testSub);
  sendJudgeNotifications(testSub);
  sendAcknowledgement(testSub);
  
  Logger.log('Test completed - check your email and sheet');
}
