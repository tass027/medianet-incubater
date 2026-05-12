require('dotenv').config();
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/medianet_db';

const args = process.argv.slice(2);
const ONLY_SESSIONS      = args.includes('--only-sessions');
const ONLY_NOTIFICATIONS = args.includes('--only-notifications');
const CLEAR              = args.includes('--clear');
const RUN_ALL            = !ONLY_SESSIONS && !ONLY_NOTIFICATIONS;

// ─── Helpers date ──────────────────────────────────────────────────────────
const future = (days, h = 10, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(h, m, 0, 0);
  return d;
};
const past = (days, h = 10, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(h, m, 0, 0);
  return d;
};

// ─── Logger ───────────────────────────────────────────────────────────────
const log = {
  info:    (msg) => console.log(`  \x1b[36mℹ\x1b[0m  ${msg}`),
  success: (msg) => console.log(`  \x1b[32m✓\x1b[0m  ${msg}`),
  warn:    (msg) => console.log(`  \x1b[33m⚠\x1b[0m  ${msg}`),
  error:   (msg) => console.log(`  \x1b[31m✗\x1b[0m  ${msg}`),
  section: (msg) => console.log(`\n\x1b[1m\x1b[34m── ${msg} ──\x1b[0m`),
  table:   (rows) => rows.forEach(([k, v]) => console.log(`     ${String(k).padEnd(24)} ${v}`)),
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
async function seed() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  log.success(`Connecté : ${MONGO_URI}`);

  // ── Récupérer les vrais IDs ──────────────────────────────────────────────
  const mentors  = await db.collection('users').find({ role: 'mentor'  }).toArray();
  const startups = await db.collection('applications').find({
    status: { $in: ['accepted', 'approved'] },
  }).toArray();
  const admins   = await db.collection('users').find({ role: 'admin'   }).toArray();

  log.info(`Mentors trouvés    : ${mentors.length}`);
  log.info(`Startups trouvées  : ${startups.length}`);
  log.info(`Admins trouvés     : ${admins.length}`);

  const getMentor  = (n) => mentors[n  % Math.max(mentors.length,  1)]?._id || new ObjectId();
  const getStartup = (n) => startups[n % Math.max(startups.length, 1)]?._id || new ObjectId();
  const getAdmin   = ()  => admins[0]?._id || new ObjectId();

  const now = new Date();

  // ══════════════════════════════════════════════════════════════════════════
  // 1. SESSIONS (collection unifiée)
  // ══════════════════════════════════════════════════════════════════════════
  if (RUN_ALL || ONLY_SESSIONS) {
    log.section('SESSIONS');

    // Référence vers des IDs de session pour lier les notifications
    const sessionIds = {
      pitchClinic:    new ObjectId(),
      workshopFinance: new ObjectId(),
      masterclassMarketing: new ObjectId(),
      conferenceLegal: new ObjectId(),
      fundraisingConf: new ObjectId(),
      mentoratFintech1: new ObjectId(),
      one2oneAgritech: new ObjectId(),
      onboardingWS:   new ObjectId(),
      mockPitch:      new ObjectId(),
      // Sessions créées par mentors dans leur espace
      mentorSessionRS1: new ObjectId(),
      mentorSessionYK1: new ObjectId(),
      mentorSessionAH1: new ObjectId(),
    };

    const SESSIONS = [
      // ── ADMIN — Pitching ──────────────────────────────────────────────
      {
        _id:         sessionIds.pitchClinic,
        type:        'pitch',
        title:       'Pitch Clinic — Panel Investisseurs Seed',
        domain:      'Fundraising',
        description: 'Session intensive de feedback pitch face à un panel de 3 investisseurs. 8 min pitch + 12 min Q&R par startup.',
        date:        future(8, 14, 0),
        time:        '14:00',
        duration:    120,
        isOnline:    true,
        meetLink:    'https://meet.google.com/pitch-clinic-001',
        calendarLink:'',
        location:    '',
        capacity:    12,
        enrolled:    7,
        status:      'upcoming',
        targetMode:  'all',
        selectedProgrammes: [],
        selectedStartups:   [],
        speakers: [
          { name: 'Karim Oueslati', email: 'k.oueslati@sawari.com',     role: 'Venture Capital',  linkedin: 'https://linkedin.com/in/koueslati' },
          { name: 'Samia Belhadj',  email: 's.belhadj@africinvest.com', role: 'Investisseur',      linkedin: '' },
        ],
        createdBy:   'admin',
        createdByRole: 'admin',
        notifyStartup: true,
        notifyMentor:  false,
        customNotificationBody: '',
        createdAt:   now,
        updatedAt:   now,
      },

      // ── ADMIN — Workshop Finance ──────────────────────────────────────
      {
        _id:         sessionIds.workshopFinance,
        type:        'workshop',
        title:       'Financial Modelling — Unit Economics & Burn Rate',
        domain:      'Finance',
        description: 'Atelier pratique : construction du modèle financier sur 3 ans, P&L, cash burn et unit economics.',
        date:        future(12, 10, 0),
        time:        '10:00',
        duration:    180,
        isOnline:    false,
        meetLink:    '',
        calendarLink:'',
        location:    'Incubateur MEDIANET, Lac 2, Tunis — Salle Innovation B',
        capacity:    20,
        enrolled:    14,
        status:      'upcoming',
        targetMode:  'programme',
        selectedProgrammes: ['Programme FinTech 2026'],
        selectedStartups:   [],
        speakers: [
          { name: 'Amira Hamdani', email: 'a.hamdani@finlab.tn', role: 'CFO Advisor', linkedin: '' },
        ],
        createdBy:   'admin',
        createdByRole: 'admin',
        notifyStartup: true,
        notifyMentor:  false,
        customNotificationBody: 'Merci de préparer votre modèle financier en amont.',
        createdAt:   now,
        updatedAt:   now,
      },

      // ── ADMIN — Formation / Masterclass ───────────────────────────────
      {
        _id:         sessionIds.masterclassMarketing,
        type:        'formation',
        title:       'Growth Hacking Masterclass — Acquisition & Rétention',
        domain:      'Marketing',
        description: 'Acquisition organique, paid media (Meta + Google), SEO, lifecycle marketing et boucles de rétention.',
        date:        future(18, 9, 30),
        time:        '09:30',
        duration:    240,
        isOnline:    true,
        meetLink:    'https://meet.google.com/growth-masterclass-2026',
        calendarLink:'https://calendar.google.com/event/growth-2026',
        location:    '',
        capacity:    35,
        enrolled:    22,
        status:      'upcoming',
        targetMode:  'all',
        selectedProgrammes: [],
        selectedStartups:   [],
        speakers: [
          { name: 'Rania Souissi', email: 'r.souissi@growthlab.tn', role: 'Growth Lead', linkedin: 'https://linkedin.com/in/rsouissi' },
        ],
        createdBy:   'admin',
        createdByRole: 'admin',
        notifyStartup: true,
        notifyMentor:  true,
        customNotificationBody: '',
        createdAt:   now,
        updatedAt:   now,
      },

      // ── ADMIN — Conférence Juridique ──────────────────────────────────
      {
        _id:         sessionIds.conferenceLegal,
        type:        'conference',
        title:       'Legal Essentials — GDPR, Term Sheets & Cap Table',
        domain:      'Juridique',
        description: 'Fondamentaux juridiques : protection données, structuration cap table, lecture term sheet.',
        date:        future(22, 11, 0),
        time:        '11:00',
        duration:    90,
        isOnline:    false,
        meetLink:    '',
        calendarLink:'',
        location:    'MEDIANET HQ, Avenue Kheireddine Pacha, Tunis — Amphi A',
        capacity:    50,
        enrolled:    31,
        status:      'upcoming',
        targetMode:  'all',
        selectedProgrammes: [],
        selectedStartups:   [],
        speakers: [
          { name: 'Sonia Trabelsi', email: 's.trabelsi@legalstartup.tn', role: 'Avocate', linkedin: '' },
        ],
        createdBy:   'admin',
        createdByRole: 'admin',
        notifyStartup: true,
        notifyMentor:  false,
        customNotificationBody: '',
        createdAt:   now,
        updatedAt:   now,
      },

      // ── ADMIN — Conférence Fundraising ────────────────────────────────
      {
        _id:         sessionIds.fundraisingConf,
        type:        'conference',
        title:       'Fundraising Strategy — Seed to Series A',
        domain:      'Fundraising',
        description: 'Valorisation startup, construction data room, stratégie de closing investisseurs régionaux et internationaux.',
        date:        future(30, 15, 0),
        time:        '15:00',
        duration:    150,
        isOnline:    true,
        meetLink:    'https://meet.google.com/fundraising-series-a',
        calendarLink:'',
        location:    '',
        capacity:    60,
        enrolled:    41,
        status:      'upcoming',
        targetMode:  'all',
        selectedProgrammes: [],
        selectedStartups:   [],
        speakers: [
          { name: 'Karim Oueslati', email: 'k.oueslati@sawari.com',  role: 'Venture Capital', linkedin: 'https://linkedin.com/in/koueslati' },
          { name: 'David Nkosi',    email: 'd.nkosi@partech.vc',     role: 'Partner',          linkedin: '' },
        ],
        createdBy:   'admin',
        createdByRole: 'admin',
        notifyStartup: true,
        notifyMentor:  true,
        customNotificationBody: '',
        createdAt:   now,
        updatedAt:   now,
      },

      // ── ADMIN — Mentorat one-to-one (créé par admin, assigné) ─────────
      {
        _id:         sessionIds.mentoratFintech1,
        type:        'mentoring',
        title:       'Session Mentorat — Stratégie FinTech',
        domain:      'FinTech',
        description: 'Focus sur stratégie go-to-market et préparation seed round.',
        date:        future(5, 10, 30),
        time:        '10:30',
        duration:    60,
        isOnline:    true,
        meetLink:    'https://meet.google.com/mentor-session-001',
        calendarLink:'',
        location:    '',
        capacity:    1,
        enrolled:    1,
        status:      'upcoming',
        targetMode:  'specific',
        selectedProgrammes: [],
        selectedStartups:   [getStartup(0)],
        speakers:    [],
        mentorId:    getMentor(0),
        startupId:   getStartup(0),
        notifyMentor:  true,
        notifyStartup: true,
        mentorStatus:  'accepted',
        mentorNote:    'Focus sur stratégie go-to-market et préparation seed round.',
        customNotificationBody: 'Merci de confirmer votre disponibilité via le lien Meet ci-joint.',
        createdBy:   'admin',
        createdByRole: 'admin',
        createdAt:   now,
        updatedAt:   now,
      },

      // ── ADMIN — One-to-One en attente ─────────────────────────────────
      {
        _id:         sessionIds.one2oneAgritech,
        type:        'mentoring',
        title:       'One-to-One — Stratégie Croissance AgriTech',
        domain:      'AgriTech',
        description: 'Évaluation du prototype et conseils hardware scaling.',
        date:        future(9, 14, 0),
        time:        '14:00',
        duration:    45,
        isOnline:    true,
        meetLink:    'https://meet.google.com/mentor-session-002',
        calendarLink:'',
        location:    '',
        capacity:    1,
        enrolled:    1,
        status:      'pending',
        targetMode:  'specific',
        selectedProgrammes: [],
        selectedStartups:   [getStartup(1)],
        speakers:    [],
        mentorId:    getMentor(1),
        startupId:   getStartup(1),
        notifyMentor:  true,
        notifyStartup: true,
        mentorStatus:  'pending',
        mentorNote:    '',
        customNotificationBody: '',
        createdBy:   'admin',
        createdByRole: 'admin',
        createdAt:   now,
        updatedAt:   now,
      },

      // ── MENTOR — Sessions créées depuis l'espace mentor ───────────────
      // (ces sessions ont createdByRole = 'mentor' et un mentorId fixé)
      {
        _id:         sessionIds.mentorSessionRS1,
        type:        'mentoring',
        title:       'Suivi mensuel — Croissance & Acquisition',
        domain:      'Marketing',
        description: 'Revue des métriques d\'acquisition, ajustement de la stratégie growth.',
        date:        future(3, 11, 0),
        time:        '11:00',
        duration:    60,
        isOnline:    true,
        meetLink:    'https://meet.google.com/rs-mentoring-003',
        calendarLink:'',
        location:    '',
        capacity:    1,
        enrolled:    1,
        status:      'upcoming',
        targetMode:  'specific',
        selectedProgrammes: [],
        selectedStartups:   [getStartup(2)],
        speakers:    [],
        mentorId:    getMentor(0),
        startupId:   getStartup(2),
        notifyMentor:  false,
        notifyStartup: true,
        mentorStatus:  'accepted',
        mentorNote:    'Préparer un rapport de croissance hebdomadaire.',
        customNotificationBody: 'Votre mentor Rania Souissi a planifié une session de suivi.',
        createdBy:   getMentor(0),
        createdByRole: 'mentor',
        createdAt:   past(1),
        updatedAt:   past(1),
      },
      {
        _id:         sessionIds.mentorSessionYK1,
        type:        'mentoring',
        title:       'Review Technique — Architecture & Scalabilité',
        domain:      'Technologie',
        description: 'Audit de l\'architecture existante et recommandations pour passer à l\'échelle.',
        date:        future(6, 14, 30),
        time:        '14:30',
        duration:    90,
        isOnline:    false,
        meetLink:    '',
        calendarLink:'',
        location:    'Incubateur MEDIANET, Lac 2 — Bureau Mentor 3',
        capacity:    1,
        enrolled:    1,
        status:      'upcoming',
        targetMode:  'specific',
        selectedProgrammes: [],
        selectedStartups:   [getStartup(0)],
        speakers:    [],
        mentorId:    getMentor(1),
        startupId:   getStartup(0),
        notifyMentor:  false,
        notifyStartup: true,
        mentorStatus:  'accepted',
        mentorNote:    '',
        customNotificationBody: 'Session en présentiel — merci d\'apporter vos schémas d\'architecture.',
        createdBy:   getMentor(1),
        createdByRole: 'mentor',
        createdAt:   past(2),
        updatedAt:   past(2),
      },
      {
        _id:         sessionIds.mentorSessionAH1,
        type:        'mentoring',
        title:       'Préparation Due Diligence — Dossier Financier',
        domain:      'Finance',
        description: 'Construction du dossier financier pour la levée de fonds Series A.',
        date:        future(14, 9, 0),
        time:        '09:00',
        duration:    120,
        isOnline:    true,
        meetLink:    'https://meet.google.com/ah-finance-dd',
        calendarLink:'https://calendar.google.com/event/ah-dd-2026',
        location:    '',
        capacity:    1,
        enrolled:    1,
        status:      'upcoming',
        targetMode:  'specific',
        selectedProgrammes: [],
        selectedStartups:   [getStartup(3)],
        speakers:    [],
        mentorId:    getMentor(2),
        startupId:   getStartup(3),
        notifyMentor:  false,
        notifyStartup: true,
        mentorStatus:  'accepted',
        mentorNote:    'Apporter le cap table et les projections N+3.',
        customNotificationBody: 'Votre mentor Amira Hamdani a planifié une session de préparation due diligence.',
        createdBy:   getMentor(2),
        createdByRole: 'mentor',
        createdAt:   past(3),
        updatedAt:   past(3),
      },

      // ── Sessions terminées ────────────────────────────────────────────
      {
        _id:         sessionIds.onboardingWS,
        type:        'workshop',
        title:       'Onboarding Incubateur — Cohorte FinTech 2026',
        domain:      'Opérations',
        description: 'Présentation du programme, règlement intérieur, accès ressources et outils collaboration.',
        date:        past(14, 9, 0),
        time:        '09:00',
        duration:    180,
        isOnline:    false,
        meetLink:    '',
        calendarLink:'',
        location:    'Incubateur MEDIANET, Lac 2, Tunis — Grande Salle',
        capacity:    30,
        enrolled:    28,
        status:      'done',
        targetMode:  'programme',
        selectedProgrammes: ['Programme FinTech 2026'],
        selectedStartups:   [],
        speakers: [
          { name: 'Direction MEDIANET', email: 'direction@medianet.tn', role: 'Management', linkedin: '' },
        ],
        createdBy:   'admin',
        createdByRole: 'admin',
        notifyStartup: true,
        notifyMentor:  true,
        customNotificationBody: '',
        createdAt:   past(20),
        updatedAt:   past(14),
      },
      {
        _id:         sessionIds.mockPitch,
        type:        'pitch',
        title:       'Mock Pitch — Session Préparatoire',
        domain:      'Fundraising',
        description: "Session d'entraînement au pitch dans un cadre bienveillant avec feedback constructif des pairs.",
        date:        past(7, 15, 0),
        time:        '15:00',
        duration:    90,
        isOnline:    true,
        meetLink:    '',
        calendarLink:'',
        location:    '',
        capacity:    10,
        enrolled:    10,
        status:      'done',
        targetMode:  'all',
        selectedProgrammes: [],
        selectedStartups:   [],
        speakers: [
          { name: 'Yassine Khelif', email: 'y.khelif@techbridge.tn', role: 'Product Director', linkedin: '' },
        ],
        createdBy:   'admin',
        createdByRole: 'admin',
        notifyStartup: true,
        notifyMentor:  false,
        customNotificationBody: '',
        createdAt:   past(10),
        updatedAt:   past(7),
      },
    ];

    if (CLEAR) {
      await db.collection('sessions').deleteMany({});
      log.warn('Collection sessions vidée.');
    }

    const result = await db.collection('sessions').insertMany(SESSIONS);
    log.success(`Sessions insérées : ${result.insertedCount}`);

    // Stats
    const byType   = {};
    const byStatus = {};
    const byCreator = {};
    SESSIONS.forEach(s => {
      byType[s.type]           = (byType[s.type]           || 0) + 1;
      byStatus[s.status]       = (byStatus[s.status]       || 0) + 1;
      byCreator[s.createdByRole] = (byCreator[s.createdByRole] || 0) + 1;
    });

    console.log('\n  Par type :');
    log.table(Object.entries(byType).map(([k, v]) => [k, v]));
    console.log('\n  Par statut :');
    log.table(Object.entries(byStatus).map(([k, v]) => [k, v]));
    console.log('\n  Par créateur :');
    log.table(Object.entries(byCreator).map(([k, v]) => [k, v]));

    // Exporter les IDs pour les notifications
    global._sessionIds = sessionIds;
    global._mentors    = mentors;
    global._startups   = startups;
    global._admins     = admins;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 2. NOTIFICATIONS temps réel
  // ══════════════════════════════════════════════════════════════════════════
  if (RUN_ALL || ONLY_NOTIFICATIONS) {
    log.section('NOTIFICATIONS');

    const sessionIds = global._sessionIds || {};
    const mentors2   = global._mentors    || mentors;
    const startups2  = global._startups   || startups;
    const admins2    = global._admins     || admins;

    const getMentor2  = (n) => mentors2[n  % Math.max(mentors2.length,  1)]?._id || new ObjectId();
    const getStartup2 = (n) => startups2[n % Math.max(startups2.length, 1)]?._id || new ObjectId();
    const getAdmin2   = ()  => admins2[0]?._id || new ObjectId();

    /**
     * Structure d'une notification :
     * {
     *   recipientId   : ObjectId   — userId du destinataire
     *   recipientRole : String     — 'mentor' | 'startup' | 'admin'
     *   type          : String     — voir NOTIFICATION_TYPES
     *   title         : String
     *   body          : String
     *   link          : String     — route frontend relative
     *   read          : Boolean
     *   readAt        : Date|null
     *   data          : Object     — payload spécifique (sessionId, startupId…)
     *   createdAt     : Date
     * }
     */

    const NOTIFICATIONS = [

      // ── Pour les MENTORS ───────────────────────────────────────────────

      // Nouvelle session mentorat assignée par l'admin
      {
        recipientId:   getMentor2(0),
        recipientRole: 'mentor',
        type:          'session_assigned',
        title:         'Nouvelle session de mentorat',
        body:          "L'administrateur vous a assigné une session de mentorat avec une startup FinTech. Date : dans 5 jours à 10h30.",
        link:          '/dashboard/mentor/sessions',
        read:          false,
        readAt:        null,
        data: {
          sessionId:   sessionIds.mentoratFintech1 || null,
          sessionType: 'mentoring',
          domain:      'FinTech',
        },
        createdAt:     past(0, 9, 0),
        updatedAt:     past(0, 9, 0),
      },

      // Confirmation acceptation par le mentor
      {
        recipientId:   getMentor2(0),
        recipientRole: 'mentor',
        type:          'session_confirmed',
        title:         'Session confirmée',
        body:          'Votre session "Stratégie FinTech" du 28 avril à 10h30 est confirmée. Lien Meet disponible.',
        link:          '/dashboard/mentor/sessions',
        read:          true,
        readAt:        past(0, 10, 0),
        data: {
          sessionId:   sessionIds.mentoratFintech1 || null,
          meetLink:    'https://meet.google.com/mentor-session-001',
        },
        createdAt:     past(1, 16, 0),
        updatedAt:     past(1, 16, 0),
      },

      // Nouvelle session de mentorat en attente d'acceptation
      {
        recipientId:   getMentor2(1),
        recipientRole: 'mentor',
        type:          'session_pending',
        title:         'Session en attente de confirmation',
        body:          "Une session One-to-One AgriTech a été planifiée pour vous. Merci de confirmer votre disponibilité.",
        link:          '/dashboard/mentor/sessions',
        read:          false,
        readAt:        null,
        data: {
          sessionId:   sessionIds.one2oneAgritech || null,
          sessionType: 'mentoring',
          domain:      'AgriTech',
          requiresAction: true,
        },
        createdAt:     past(0, 11, 0),
        updatedAt:     past(0, 11, 0),
      },

      // Rappel session dans 24h
      {
        recipientId:   getMentor2(0),
        recipientRole: 'mentor',
        type:          'session_reminder',
        title:         'Rappel — Session demain',
        body:          'Rappel : votre session de mentorat "Stratégie FinTech" a lieu demain à 10h30.',
        link:          '/dashboard/mentor/sessions',
        read:          false,
        readAt:        null,
        data: {
          sessionId:   sessionIds.mentoratFintech1 || null,
          hoursUntil:  24,
        },
        createdAt:     past(0, 8, 0),
        updatedAt:     past(0, 8, 0),
      },

      // Feedback demandé après session terminée
      {
        recipientId:   getMentor2(0),
        recipientRole: 'mentor',
        type:          'feedback_requested',
        title:         'Feedback de session demandé',
        body:          'La session "Mock Pitch — Session Préparatoire" est terminée. Merci de soumettre votre rapport de mentorat.',
        link:          '/dashboard/mentor/reports/new',
        read:          false,
        readAt:        null,
        data: {
          sessionId:   sessionIds.mockPitch || null,
          deadline:    future(7),
        },
        createdAt:     past(7, 16, 0),
        updatedAt:     past(7, 16, 0),
      },

      // Nouvelle startup assignée au mentor
      {
        recipientId:   getMentor2(1),
        recipientRole: 'mentor',
        type:          'startup_assigned',
        title:         'Nouvelle startup assignée',
        body:          "Une nouvelle startup vous a été assignée pour le suivi de mentorat. Prenez contact dès que possible.",
        link:          '/dashboard/mentor/startups',
        read:          true,
        readAt:        past(3, 10, 0),
        data: {
          startupId:   getStartup2(0),
        },
        createdAt:     past(5, 14, 0),
        updatedAt:     past(5, 14, 0),
      },

      // Formation disponible (notif admin → mentors)
      {
        recipientId:   getMentor2(0),
        recipientRole: 'mentor',
        type:          'session_new',
        title:         'Nouvelle formation disponible',
        body:          'Une nouvelle formation "Growth Hacking Masterclass" est disponible. Date : dans 18 jours à 09h30.',
        link:          '/dashboard/mentor/sessions',
        read:          false,
        readAt:        null,
        data: {
          sessionId:   sessionIds.masterclassMarketing || null,
          sessionType: 'formation',
        },
        createdAt:     past(0, 7, 0),
        updatedAt:     past(0, 7, 0),
      },

      // ── Pour les STARTUPS ──────────────────────────────────────────────

      // Session mentorat assignée
      {
        recipientId:   getStartup2(0),
        recipientRole: 'startup',
        type:          'session_assigned',
        title:         'Session de mentorat planifiée',
        body:          "Une session de mentorat a été planifiée avec votre mentor attitré. Date : dans 5 jours à 10h30. Lien Meet disponible.",
        link:          '/dashboard/startup/sessions',
        read:          false,
        readAt:        null,
        data: {
          sessionId:   sessionIds.mentoratFintech1 || null,
          sessionType: 'mentoring',
          mentorId:    getMentor2(0),
          meetLink:    'https://meet.google.com/mentor-session-001',
        },
        createdAt:     past(0, 9, 5),
        updatedAt:     past(0, 9, 5),
      },

      // Workshop inscrit
      {
        recipientId:   getStartup2(0),
        recipientRole: 'startup',
        type:          'session_new',
        title:         'Nouveau workshop disponible',
        body:          'Le workshop "Financial Modelling" est maintenant disponible. Inscrivez-vous pour réserver votre place.',
        link:          '/dashboard/startup/sessions',
        read:          true,
        readAt:        past(2, 11, 0),
        data: {
          sessionId:   sessionIds.workshopFinance || null,
          sessionType: 'workshop',
        },
        createdAt:     past(3, 10, 0),
        updatedAt:     past(3, 10, 0),
      },

      // Rappel pitch
      {
        recipientId:   getStartup2(1),
        recipientRole: 'startup',
        type:          'session_reminder',
        title:         'Pitch Clinic dans 2 jours',
        body:          'Rappel : la session "Pitch Clinic — Panel Investisseurs Seed" a lieu dans 2 jours. Préparez votre deck.',
        link:          '/dashboard/startup/sessions',
        read:          false,
        readAt:        null,
        data: {
          sessionId:   sessionIds.pitchClinic || null,
          daysUntil:   2,
        },
        createdAt:     past(0, 12, 0),
        updatedAt:     past(0, 12, 0),
      },

      // KPI update demandé par mentor
      {
        recipientId:   getStartup2(2),
        recipientRole: 'startup',
        type:          'kpi_update_requested',
        title:         'Mise à jour KPIs requise',
        body:          'Votre mentor vous demande de mettre à jour vos KPIs avant la prochaine session. Deadline : dans 3 jours.',
        link:          '/dashboard/startup/kpis',
        read:          false,
        readAt:        null,
        data: {
          mentorId:   getMentor2(0),
          deadline:   future(3),
          requiresAction: true,
        },
        createdAt:     past(0, 10, 0),
        updatedAt:     past(0, 10, 0),
      },

      // Formation inscrite confirmée
      {
        recipientId:   getStartup2(0),
        recipientRole: 'startup',
        type:          'session_confirmed',
        title:         'Inscription confirmée',
        body:          'Votre inscription à la "Growth Hacking Masterclass" est confirmée. Lien de connexion disponible 30 min avant.',
        link:          '/dashboard/startup/sessions',
        read:          true,
        readAt:        past(1, 15, 0),
        data: {
          sessionId:   sessionIds.masterclassMarketing || null,
          meetLink:    'https://meet.google.com/growth-masterclass-2026',
        },
        createdAt:     past(2, 14, 0),
        updatedAt:     past(2, 14, 0),
      },

      // Session one-to-one créée par mentor (notif startup)
      {
        recipientId:   getStartup2(2),
        recipientRole: 'startup',
        type:          'session_assigned',
        title:         'Session planifiée par votre mentor',
        body:          'Votre mentor Rania Souissi a planifié une session de suivi mensuel pour dans 3 jours à 11h00.',
        link:          '/dashboard/startup/sessions',
        read:          false,
        readAt:        null,
        data: {
          sessionId:   sessionIds.mentorSessionRS1 || null,
          sessionType: 'mentoring',
          mentorId:    getMentor2(0),
          createdByMentor: true,
        },
        createdAt:     past(1, 9, 0),
        updatedAt:     past(1, 9, 0),
      },

      // ── Pour les ADMINS ────────────────────────────────────────────────

      // Mentor a accepté une session
      {
        recipientId:   getAdmin2(),
        recipientRole: 'admin',
        type:          'mentor_accepted',
        title:         'Mentor a accepté la session',
        body:          'Le mentor a confirmé sa disponibilité pour la session "Stratégie FinTech" du 28 avril.',
        link:          '/dashboard/admin/startups',
        read:          false,
        readAt:        null,
        data: {
          sessionId:   sessionIds.mentoratFintech1 || null,
          mentorId:    getMentor2(0),
        },
        createdAt:     past(0, 10, 30),
        updatedAt:     past(0, 10, 30),
      },

      // Mentor a créé une session depuis son espace
      {
        recipientId:   getAdmin2(),
        recipientRole: 'admin',
        type:          'mentor_session_created',
        title:         'Nouvelle session créée par un mentor',
        body:          'Le mentor Yassine Khelif a planifié une session "Review Technique" en présentiel dans 6 jours.',
        link:          '/dashboard/admin/startups',
        read:          false,
        readAt:        null,
        data: {
          sessionId:   sessionIds.mentorSessionYK1 || null,
          mentorId:    getMentor2(1),
          startupId:   getStartup2(0),
        },
        createdAt:     past(2, 14, 0),
        updatedAt:     past(2, 14, 0),
      },

      // Session terminée — récap admin
      {
        recipientId:   getAdmin2(),
        recipientRole: 'admin',
        type:          'session_completed',
        title:         'Session terminée',
        body:          'La session "Mock Pitch — Session Préparatoire" s\'est tenue avec 10/10 participants. Feedback disponible.',
        link:          '/dashboard/admin/startups',
        read:          true,
        readAt:        past(7, 18, 0),
        data: {
          sessionId:   sessionIds.mockPitch || null,
          attendees:   10,
          capacity:    10,
        },
        createdAt:     past(7, 17, 0),
        updatedAt:     past(7, 17, 0),
      },
    ];

    if (CLEAR) {
      await db.collection('notifications').deleteMany({});
      log.warn('Collection notifications vidée.');
    }

    const resultNotif = await db.collection('notifications').insertMany(NOTIFICATIONS);
    log.success(`Notifications insérées : ${resultNotif.insertedCount}`);

    // Stats
    const byType   = {};
    const byRole   = {};
    const unread   = NOTIFICATIONS.filter(n => !n.read).length;
    NOTIFICATIONS.forEach(n => {
      byType[n.type]           = (byType[n.type]           || 0) + 1;
      byRole[n.recipientRole]  = (byRole[n.recipientRole]  || 0) + 1;
    });

    console.log('\n  Par type :');
    log.table(Object.entries(byType).map(([k, v]) => [k, v]));
    console.log('\n  Par destinataire :');
    log.table(Object.entries(byRole).map(([k, v]) => [k, v]));
    log.info(`Non lues : ${unread} / ${NOTIFICATIONS.length}`);
  }

  // ── Résumé global ──────────────────────────────────────────────────────
  console.log(`
\x1b[1m\x1b[32m
══════════════════════════════════════════════════════
  SEED COMPLET — RÉSUMÉ FINAL
══════════════════════════════════════════════════════\x1b[0m`);

  const counts = {
    sessions:      await db.collection('sessions').countDocuments(),
    notifications: await db.collection('notifications').countDocuments(),
    mentors:       await db.collection('users').countDocuments({ role: 'mentor' }),
    startups:      await db.collection('applications').countDocuments({ status: { $in: ['accepted', 'approved'] } }),
  };

  log.table([
    ['sessions',      counts.sessions],
    ['notifications', counts.notifications],
    ['mentors',       counts.mentors],
    ['startups (accepted)', counts.startups],
  ]);

  await mongoose.disconnect();
  log.success('Déconnexion MongoDB.\n');
}

seed().catch(err => {
  log.error(`Erreur : ${err.message}`);
  console.error(err);
  process.exit(1);
});