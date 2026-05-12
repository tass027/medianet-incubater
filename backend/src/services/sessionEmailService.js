// src/services/sessionEmailService.js
// ✅ Replace with these 3 lines
const nodemailer = require('nodemailer');
const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});
/* ─── Google Calendar URL (sans OAuth) ──────────────────────── */
function buildGoogleCalendarUrl({ title, dateISO, durationMin, description, location }) {
  const pad = (n) => String(n).padStart(2, '0');
  const start = new Date(dateISO);
  const end   = new Date(start.getTime() + durationMin * 60_000);
  const fmt   = (d) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const params = new URLSearchParams({
    action:   'TEMPLATE',
    text:     title,
    dates:    `${fmt(start)}/${fmt(end)}`,
    details:  description || '',
    location: location    || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

function buildHtml({
  recipientName,
  mentorName,
  startupName,
  topic,
  date,
  duration,
  meetingLink,
  notes,
  customMessage,
  calendarUrl,
}) {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session de mentorat</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f6f8fa;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#0a1628;border-radius:8px 8px 0 0;padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.3px;">MediaNet</p>
                    <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">Incubator Platform</p>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;background-color:#1d4ed8;color:#ffffff;font-size:11px;font-weight:600;padding:5px 12px;border-radius:4px;letter-spacing:0.5px;text-transform:uppercase;">Session planifiee</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:36px 40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">

              <!-- Greeting -->
              <p style="margin:0 0 6px;color:#0f172a;font-size:16px;font-weight:600;">
                Bonjour${recipientName ? ' ' + recipientName : ''},
              </p>
              <p style="margin:0 0 28px;color:#475569;font-size:14px;line-height:1.7;">
                Une session de mentorat a ete planifiee sur la plateforme <strong style="color:#0f172a;">MediaNet Incubator</strong>.
                Vous trouverez ci-dessous les details de cette session.
              </p>

              <!-- Session Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px 12px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;color:#64748b;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
                      Details de la session
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">

                      <tr>
                        <td style="padding:7px 0;width:38%;vertical-align:top;">
                          <p style="margin:0;color:#64748b;font-size:13px;font-weight:600;">Date</p>
                        </td>
                        <td style="padding:7px 0;vertical-align:top;">
                          <p style="margin:0;color:#0f172a;font-size:13px;">${fmtDate(date)}</p>
                        </td>
                      </tr>

                      <tr style="border-top:1px solid #f1f5f9;">
                        <td style="padding:7px 0;vertical-align:top;">
                          <p style="margin:0;color:#64748b;font-size:13px;font-weight:600;">Heure</p>
                        </td>
                        <td style="padding:7px 0;vertical-align:top;">
                          <p style="margin:0;color:#0f172a;font-size:13px;">${fmtTime(date)}</p>
                        </td>
                      </tr>

                      <tr style="border-top:1px solid #f1f5f9;">
                        <td style="padding:7px 0;vertical-align:top;">
                          <p style="margin:0;color:#64748b;font-size:13px;font-weight:600;">Duree</p>
                        </td>
                        <td style="padding:7px 0;vertical-align:top;">
                          <p style="margin:0;color:#0f172a;font-size:13px;">${duration} minutes</p>
                        </td>
                      </tr>

                      <tr style="border-top:1px solid #f1f5f9;">
                        <td style="padding:7px 0;vertical-align:top;">
                          <p style="margin:0;color:#64748b;font-size:13px;font-weight:600;">Theme</p>
                        </td>
                        <td style="padding:7px 0;vertical-align:top;">
                          <p style="margin:0;color:#0f172a;font-size:13px;font-weight:500;">${topic}</p>
                        </td>
                      </tr>

                      <tr style="border-top:1px solid #f1f5f9;">
                        <td style="padding:7px 0;vertical-align:top;">
                          <p style="margin:0;color:#64748b;font-size:13px;font-weight:600;">Startup</p>
                        </td>
                        <td style="padding:7px 0;vertical-align:top;">
                          <p style="margin:0;color:#0f172a;font-size:13px;">${startupName}</p>
                        </td>
                      </tr>

                      <tr style="border-top:1px solid #f1f5f9;">
                        <td style="padding:7px 0;vertical-align:top;">
                          <p style="margin:0;color:#64748b;font-size:13px;font-weight:600;">Mentor</p>
                        </td>
                        <td style="padding:7px 0;vertical-align:top;">
                          <p style="margin:0;color:#0f172a;font-size:13px;">${mentorName}</p>
                        </td>
                      </tr>

                      ${meetingLink ? `
                      <tr style="border-top:1px solid #f1f5f9;">
                        <td style="padding:7px 0;vertical-align:top;">
                          <p style="margin:0;color:#64748b;font-size:13px;font-weight:600;">Lien reunion</p>
                        </td>
                        <td style="padding:7px 0;vertical-align:top;">
                          <a href="${meetingLink}" style="color:#1d4ed8;font-size:13px;text-decoration:none;font-weight:500;">
                            Rejoindre la reunion
                          </a>
                        </td>
                      </tr>
                      ` : ''}

                    </table>

                    ${notes ? `
                    <table width="100%" cellpadding="0" cellspacing="0" border="0"
                           style="margin-top:16px;border-top:1px solid #e2e8f0;padding-top:16px;">
                      <tr>
                        <td>
                          <p style="margin:0 0 6px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Notes</p>
                          <p style="margin:0;color:#374151;font-size:13px;line-height:1.7;">${notes}</p>
                        </td>
                      </tr>
                    </table>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <!-- Custom Message -->
              ${customMessage ? `
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="border-left:3px solid #1d4ed8;background-color:#eff6ff;border-radius:0 4px 4px 0;margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0 0 4px;color:#1e40af;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Message du mentor</p>
                    <p style="margin:0;color:#1e3a8a;font-size:13px;line-height:1.7;">${customMessage}</p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- CTA Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    ${calendarUrl ? `
                    <a href="${calendarUrl}"
                       style="display:inline-block;background-color:#1d4ed8;color:#ffffff;font-size:13px;font-weight:600;padding:11px 24px;border-radius:5px;text-decoration:none;margin:0 6px 10px;">
                      Ajouter a Google Agenda
                    </a>
                    ` : ''}
                    ${meetingLink ? `
                    <a href="${meetingLink}"
                       style="display:inline-block;background-color:#ffffff;color:#1d4ed8;font-size:13px;font-weight:600;padding:10px 24px;border-radius:5px;text-decoration:none;border:1.5px solid #1d4ed8;margin:0 6px 10px;">
                      Rejoindre la reunion
                    </a>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <!-- Sign-off -->
              <p style="margin:0 0 4px;color:#0f172a;font-size:13px;">Cordialement,</p>
              <p style="margin:0;color:#0f172a;font-size:13px;font-weight:600;">L'equipe MediaNet Incubator</p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;padding:18px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
                      Cet email a ete envoye automatiquement par la plateforme MediaNet Incubator.<br>
                      Si vous avez des questions, contactez <a href="mailto:${process.env.ADMIN_EMAIL || 'support@medianet.tn'}" style="color:#64748b;">${process.env.ADMIN_EMAIL || 'support@medianet.tn'}</a>
                    </p>
                  </td>
                  <td align="right" style="white-space:nowrap;">
                    <p style="margin:0;color:#cbd5e1;font-size:11px;">© ${year} MediaNet Group</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

async function sendSessionEmails({
  session,
  mentor,
  startup,
  notifyAdmin,
  notifyStartup,
  emailMessage,
  // Override recipient for testing
  testEmail,
}) {
  const FROM        = `"MediaNet Incubator" <${process.env.GMAIL_USER}>`;
  const mentorName  = mentor?.name || mentor?.fullName || 'Mentor';
  const startupName =
    startup?.projectName ||
    startup?.companyName ||
    startup?.startupName ||
    startup?.name ||
    'Startup';

  const founderEmail =
    testEmail ||  // <-- used for test override
    startup?.email ||
    startup?.contactEmail ||
    startup?.founder?.email ||
    startup?.team?.email ||
    null;

  const calendarUrl = buildGoogleCalendarUrl({
    title:       `Session mentorat - ${startupName} : ${session.topic}`,
    dateISO:     new Date(session.date).toISOString(),
    durationMin: session.duration || 60,
    description: [
      session.notes       && `Notes : ${session.notes}`,
      session.meetingLink && `Lien reunion : ${session.meetingLink}`,
      `Startup : ${startupName}`,
      `Mentor : ${mentorName}`,
    ].filter(Boolean).join('\n\n'),
    location: session.meetingLink || '',
  });

  const commonPayload = {
    mentorName,
    startupName,
    topic:         session.topic,
    date:          new Date(session.date),
    duration:      session.duration || 60,
    meetingLink:   session.meetingLink || null,
    notes:         session.notes       || null,
    customMessage: emailMessage        || null,
    calendarUrl,
  };

  const promises = [];

  if (notifyAdmin) {
    // In test mode, send to testEmail; otherwise use ADMIN_EMAIL
    const adminTo = testEmail || process.env.ADMIN_EMAIL;
    if (adminTo) {
      promises.push(
        mailer.sendMail({
          from:    FROM,
          to:      adminTo,
          subject: `Nouvelle session planifiee - ${startupName} : ${session.topic}`,
          html:    buildHtml({ recipientName: testEmail ? 'Test Admin' : 'Equipe Administration', ...commonPayload }),
        }).catch((err) => console.error('[SessionEmail] Admin failed:', err.message))
      );
    } else {
      console.warn('[SessionEmail] ADMIN_EMAIL non defini dans .env');
    }
  }

  if (notifyStartup) {
    if (founderEmail) {
      const founderName =
        startup?.founderName ||
        startup?.team?.founderName ||
        startup?.fullName ||
        '';
      promises.push(
        mailer.sendMail({
          from:    FROM,
          to:      founderEmail,
          subject: `Session de mentorat planifiee - ${session.topic}`,
          html:    buildHtml({ recipientName: founderName, ...commonPayload }),
        }).catch((err) => console.error('[SessionEmail] Startup failed:', err.message))
      );
    } else {
      console.warn('[SessionEmail] Email fondateur introuvable pour:', startupName);
    }
  }

  await Promise.all(promises);
}

module.exports = { sendSessionEmails, buildGoogleCalendarUrl };