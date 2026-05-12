const nodemailer = require('nodemailer');
const crypto = require('crypto');

// ─── VALIDATION VARIABLES D'ENVIRONNEMENT ─────────────────────────────────────
const validateEnv = () => {
  const required = ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'ADMIN_EMAIL', 'CLIENT_URL'];
  const missing = required.filter(env => !process.env[env]);
  if (missing.length > 0) {
    console.warn(`⚠️ Missing env vars: ${missing.join(', ')}`);
  }
};

validateEnv();

// ─── CRÉATION DU TRANSPORTER ──────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const validateEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new Error(`Email invalide: ${email}`);
  }
};

const validateEnvVars = (vars) => {
  const missing = vars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Variables d'environnement manquantes: ${missing.join(', ')}`);
  }
};

// ─── Emails ──────────────────────────────────────────────────────────────────

exports.sendResetCode = async (toEmail, code, name) => {
  try {
    // Validation
    validateEmail(toEmail);
    if (!code || !name) {
      throw new Error('Code et name sont requis');
    }
    validateEnvVars(['GMAIL_USER']);

    const info = await transporter.sendMail({
      from:    `"MediaNet Platform" <${process.env.GMAIL_USER}>`,
      to:      toEmail,
      subject: 'Code de réinitialisation de votre mot de passe',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#0a1628;">Bonjour ${name},</h2>
          <p style="color:#334155;">Vous avez demandé à réinitialiser votre mot de passe.</p>
          <p style="color:#334155;">Votre code de vérification est :</p>
          <div style="text-align:center;margin:30px 0;">
            <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1d6af4;background:#eff6ff;padding:16px 32px;border-radius:8px;">
              ${code}
            </span>
          </div>
          <p style="color:#64748b;font-size:13px;">Ce code expire dans <strong>10 minutes</strong>.</p>
          <p style="color:#64748b;font-size:13px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
          <p style="color:#94a3b8;font-size:12px;text-align:center;">MediaNet Innovation Platform</p>
        </div>
      `,
    });
    
    console.log(`✅ Email envoyé (resetCode) à ${toEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Erreur sendResetCode pour ${toEmail}:`, error.message);
    throw error;
  }
};

exports.sendAdminApprovalRequest = async (user) => {
  try {
    // Validation
    if (!user || !user._id || !user.name || !user.email || !user.role) {
      throw new Error('User object invalide (manque _id, name, email ou role)');
    }
    validateEnvVars(['GMAIL_USER', 'ADMIN_EMAIL', 'APPROVAL_SECRET', 'COOKIE_SECRET', 'BACKEND_URL']);

    const secret = process.env.APPROVAL_SECRET || process.env.COOKIE_SECRET;
    if (!secret) {
      throw new Error('APPROVAL_SECRET ou COOKIE_SECRET non configuré');
    }

    const approvalToken = crypto
      .createHmac('sha256', secret)
      .update(user._id.toString())
      .digest('hex');
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const approveUrl = `${backendUrl}/auth/approve-direct/${user._id}/${approvalToken}`;
    const rejectUrl = `${backendUrl}/auth/reject-direct/${user._id}/${approvalToken}`;
    
    const info = await transporter.sendMail({
      from:    `"MediaNet Platform" <${process.env.GMAIL_USER}>`,
      to:      process.env.ADMIN_EMAIL,
      subject: `Nouveau compte ${user.role} à approuver - ${user.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#0a1628;">Nouveau compte en attente d'approbation</h2>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr><td style="padding:8px;color:#64748b;">Nom</td><td style="padding:8px;color:#334155;font-weight:600;">${user.name}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding:8px;color:#64748b;">Email</td><td style="padding:8px;color:#334155;">${user.email}</td></tr>
            <tr><td style="padding:8px;color:#64748b;">Rôle</td><td style="padding:8px;color:#1d6af4;font-weight:600;text-transform:uppercase;">${user.role}</td></tr>
            ${user.startupName ? `<tr style="background:#f8fafc;"><td style="padding:8px;color:#64748b;">Startup</td><td style="padding:8px;color:#334155;">${user.startupName}</td></tr>` : ''}
            ${user.experience ? `<tr><td style="padding:8px;color:#64748b;">Expérience</td><td style="padding:8px;color:#334155;">${user.experience}</td></tr>` : ''}
          </table>
          
          <div style="text-align:center;margin:24px 0;">
            <a href="${approveUrl}"
               style="background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-right:12px;display:inline-block;">
              Approuver le compte
            </a>
            <a href="${rejectUrl}"
               style="background:#ef4444;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
              Rejeter
            </a>
          </div>
          
          <p style="color:#64748b;font-size:12px;text-align:center;margin-top:20px;">
            Ce lien est sécurisé et expire dans 7 jours.
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
          <p style="color:#94a3b8;font-size:12px;text-align:center;">MediaNet Innovation Platform</p>
        </div>
      `,
    });

    console.log(`✅ Email approvalRequest envoyé à ${process.env.ADMIN_EMAIL}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur sendAdminApprovalRequest:', error.message);
    throw error;
  }
};

exports.sendAccountApproved = async (toEmail, name) => {
  try {
    validateEmail(toEmail);
    if (!name) throw new Error('Name est requis');
    validateEnvVars(['GMAIL_USER', 'CLIENT_URL']);

    const info = await transporter.sendMail({
      from:    `"MediaNet Platform" <${process.env.GMAIL_USER}>`,
      to:      toEmail,
      subject: 'Votre compte MediaNet a été approuvé',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#10b981;">Félicitations ${name} !</h2>
          <p style="color:#334155;">Votre compte MediaNet a été approuvé par notre équipe.</p>
          <p style="color:#334155;">Vous pouvez maintenant vous connecter et accéder à votre espace.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${process.env.CLIENT_URL}/login"
               style="background:#1d6af4;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
              Se connecter
            </a>
          </div>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
          <p style="color:#94a3b8;font-size:12px;text-align:center;">MediaNet Innovation Platform</p>
        </div>
      `,
    });

    console.log(`✅ Email approuvé envoyé à ${toEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Erreur sendAccountApproved pour ${toEmail}:`, error.message);
    throw error;
  }
};

exports.sendAccountRejected = async (toEmail, name) => {
  try {
    validateEmail(toEmail);
    if (!name) throw new Error('Name est requis');
    validateEnvVars(['GMAIL_USER', 'ADMIN_EMAIL']);

    const info = await transporter.sendMail({
      from:    `"MediaNet Platform" <${process.env.GMAIL_USER}>`,
      to:      toEmail,
      subject: 'Votre demande de compte MediaNet',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#0a1628;">Bonjour ${name},</h2>
          <p style="color:#334155;">Après examen de votre dossier, nous ne sommes pas en mesure d'approuver votre compte pour le moment.</p>
          <p style="color:#334155;">Pour plus d'informations, contactez-nous à <a href="mailto:${process.env.ADMIN_EMAIL}">${process.env.ADMIN_EMAIL}</a>.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
          <p style="color:#94a3b8;font-size:12px;text-align:center;">MediaNet Innovation Platform</p>
        </div>
      `,
    });

    console.log(`✅ Email rejeté envoyé à ${toEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Erreur sendAccountRejected pour ${toEmail}:`, error.message);
    throw error;
  }
};

exports.sendEmailVerification = async (toEmail, name, verifyUrl) => {
  try {
    validateEmail(toEmail);
    if (!name) throw new Error('Name est requis');
    if (!verifyUrl) throw new Error('VerifyUrl est requis');
    validateEnvVars(['GMAIL_USER']);

    const info = await transporter.sendMail({
      from:    `"MediaNet Platform" <${process.env.GMAIL_USER}>`,
      to:      toEmail,
      subject: 'Vérifiez votre adresse email - MediaNet',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#0a1628;">Bonjour ${name},</h2>
          <p style="color:#334155;">Merci de vous être inscrit sur MediaNet.</p>
          <p style="color:#334155;">Cliquez sur le bouton ci-dessous pour vérifier votre adresse email :</p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${verifyUrl}"
               style="background:#1d6af4;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
              Vérifier mon email
            </a>
          </div>
          <p style="color:#64748b;font-size:13px;">Ce lien expire dans <strong>24 heures</strong>.</p>
          <p style="color:#64748b;font-size:13px;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
          <p style="color:#94a3b8;font-size:12px;text-align:center;">MediaNet Innovation Platform</p>
        </div>
      `,
    });

    console.log(`✅ Email vérification envoyé à ${toEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Erreur sendEmailVerification pour ${toEmail}:`, error.message);
    throw error;
  }
};

exports.sendApplicationConfirmation = async (toEmail, name, startupName) => {
  try {
    validateEmail(toEmail);
    if (!name || !startupName) throw new Error('Name et startupName sont requis');
    validateEnvVars(['GMAIL_USER', 'ADMIN_EMAIL', 'CLIENT_URL']);

    const info = await transporter.sendMail({
      from:    `"MediaNet Platform" <${process.env.GMAIL_USER}>`,
      to:      toEmail,
      subject: `Candidature reçue - ${startupName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#0a1628;">Candidature reçue</h2>
          <p style="color:#334155;">Bonjour <strong>${name}</strong>,</p>
          <p style="color:#334155;">
            Nous avons bien reçu votre candidature pour <strong>${startupName}</strong> dans le cadre du programme d'incubation MEDIANET.
          </p>
          <div style="background:#f8fafc;border-left:4px solid #1d6af4;padding:16px;border-radius:0 8px 8px 0;margin:20px 0;">
            <p style="color:#334155;margin:0;font-size:14px;">
              <strong>Prochaines étapes :</strong><br>
              Notre comité examinera votre dossier sous <strong>5 à 7 jours ouvrables</strong>. 
              Vous serez notifié par email à chaque changement de statut.
            </p>
          </div>
          <div style="text-align:center;margin:24px 0;">
            <a href="${process.env.CLIENT_URL}/dashboard/applicant/status"
               style="background:#1d6af4;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
              Suivre ma candidature
            </a>
          </div>
          <p style="color:#64748b;font-size:13px;">
            Pour toute question, contactez-nous à 
            <a href="mailto:${process.env.ADMIN_EMAIL}" style="color:#1d6af4;">${process.env.ADMIN_EMAIL}</a>
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
          <p style="color:#94a3b8;font-size:12px;text-align:center;">MediaNet Innovation Platform</p>
        </div>
      `,
    });

    console.log(`✅ Email confirmation candidature envoyé à ${toEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Erreur sendApplicationConfirmation pour ${toEmail}:`, error.message);
    throw error;
  }
};

exports.sendStatusUpdate = async (toEmail, name, newStatus, startupName, notes) => {
  try {
    // Validation
    validateEmail(toEmail);
    if (!name || !newStatus || !startupName) {
      throw new Error('Name, newStatus et startupName sont requis');
    }
    validateEnvVars(['GMAIL_USER', 'CLIENT_URL']);

    const statusConfig = {
      reviewing: {
        title:   'Votre dossier est en cours d\'évaluation',
        color:   '#f59e0b',
        message: 'Notre comité analyse votre candidature en détail. Vous serez recontacté prochainement.',
        cta:     'Voir mon dossier',
      },
      interview: {
        title:   'Entretien programmé',
        color:   '#8b5cf6',
        message: 'Votre candidature a été présélectionnée. Un entretien va être organisé avec notre équipe.',
        cta:     'Voir les détails',
      },
      approved: {
        title:   'Candidature approuvée',
        color:   '#10b981',
        message: `Félicitations ! Votre startup ${startupName} a été retenue pour intégrer le programme d'incubation MEDIANET.`,
        cta:     'Voir mon espace',
      },
      accepted: {
        title:   'Bienvenue dans le programme MEDIANET',
        color:   '#10b981',
        message: `Vous faites officiellement partie de la prochaine cohorte MEDIANET. Notre équipe vous contactera pour les prochaines étapes.`,
        cta:     'Accéder à mon espace',
      },
      rejected: {
        title:   'Résultat de votre candidature',
        color:   '#64748b',
        message: `Après examen approfondi, votre candidature pour ${startupName} n'a pas été retenue cette fois. Nous vous encourageons à soumettre à nouveau lors de la prochaine session.`,
        cta:     'Voir le feedback',
      },
    };

    const cfg = statusConfig[newStatus];
    if (!cfg) {
      throw new Error(`Status invalide: '${newStatus}'. Valeurs acceptées: ${Object.keys(statusConfig).join(', ')}`);
    }

    const info = await transporter.sendMail({
      from:    `"MediaNet Platform" <${process.env.GMAIL_USER}>`,
      to:      toEmail,
      subject: `${cfg.title} - ${startupName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:${cfg.color};">${cfg.title}</h2>
          <p style="color:#334155;">Bonjour <strong>${name}</strong>,</p>
          <p style="color:#334155;">${cfg.message}</p>
          ${notes ? `
            <div style="background:#f8fafc;border-left:4px solid ${cfg.color};padding:16px;border-radius:0 8px 8px 0;margin:20px 0;">
              <p style="color:#334155;margin:0;font-size:14px;">"${notes}"</p>
            </div>
          ` : ''}
          <div style="text-align:center;margin:24px 0;">
            <a href="${process.env.CLIENT_URL}/dashboard/applicant/status"
               style="background:${cfg.color};color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
              ${cfg.cta}
            </a>
          </div>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
          <p style="color:#94a3b8;font-size:12px;text-align:center;">MediaNet Innovation Platform</p>
        </div>
      `,
    });

    console.log(`✅ Email statusUpdate (${newStatus}) envoyé à ${toEmail}`);
    return { success: true, messageId: info.messageId, status: newStatus };
  } catch (error) {
    console.error(`❌ Erreur sendStatusUpdate pour ${toEmail}:`, error.message);
    throw error;
  }
};