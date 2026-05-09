import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type IntakeNotificationData = {
  type: 'intake';
  caseTitle?: string;
  plaintiffName?: string;
  proceduralStep?: string;
  fundingAmount?: string;
  caseType?: string;
  sheetUrl?: string;
  docUrl?: string;
};

type ContactNotificationData = {
  type: 'contact';
  name?: string;
  email?: string;
  message?: string;
  sheetUrl?: string;
};

type NotificationData = IntakeNotificationData | ContactNotificationData;

export async function sendSubmissionNotification(data: NotificationData) {
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  const to = process.env.NOTIFICATION_TO_EMAIL;

  if (!from || !to || !process.env.RESEND_API_KEY) {
    console.warn('[email] Missing email config; skipping notification.');
    return;
  }

  try {
    if (data.type === 'intake') {
      const subject = `New Henley AI intake: ${data.caseTitle || data.plaintiffName || 'Untitled case'}`;
      const html = `
        <h2>New intake submission</h2>
        <table style="border-collapse: collapse; font-family: sans-serif;">
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Plaintiff:</strong></td><td>${escapeHtml(data.plaintiffName)}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Case:</strong></td><td>${escapeHtml(data.caseTitle)}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Case type:</strong></td><td>${escapeHtml(data.caseType)}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Procedural step:</strong></td><td>${escapeHtml(data.proceduralStep)}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Funding requested:</strong></td><td>${escapeHtml(data.fundingAmount)}</td></tr>
        </table>
        <p style="margin-top: 16px;">
          ${data.sheetUrl ? `<a href="${data.sheetUrl}">View row in Google Sheet</a><br>` : ''}
          ${data.docUrl ? `<a href="${data.docUrl}">View case Doc</a>` : ''}
        </p>
      `;

      await resend.emails.send({ from, to, subject, html });
    } else {
      const subject = `New Henley AI contact: ${data.name || data.email || 'Anonymous'}`;
      const html = `
        <h2>New contact form submission</h2>
        <table style="border-collapse: collapse; font-family: sans-serif;">
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Name:</strong></td><td>${escapeHtml(data.name)}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0;"><strong>Email:</strong></td><td>${escapeHtml(data.email)}</td></tr>
        </table>
        <p style="margin-top: 16px;"><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${escapeHtml(data.message)}</p>
        ${data.sheetUrl ? `<p><a href="${data.sheetUrl}">View in Google Sheet</a></p>` : ''}
      `;

      await resend.emails.send({ from, to, subject, html });
    }
  } catch (err) {
    console.error('[email] Failed to send notification:', err);
  }
}

function escapeHtml(s?: string): string {
  if (!s) return '<em style="color:#888;">—</em>';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}