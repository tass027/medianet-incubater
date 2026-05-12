// scripts/seedAllData.js
// Seed : applications (par programme), jury, mentors
//
// Usage : node scripts/seedAllData.js

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medianet_db';

// ─── HELPERS ────────────────────────────────────────────────────
const rnd    = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pastDate = (daysAgo) => new Date(Date.now() - daysAgo * 86400000);

// ─── JURY ───────────────────────────────────────────────────────
const juryData = [
  {
    name:        'Karim Ghorbel',
    email:       'karim.ghorbel@jury.medianet.tn',
    role:        'jury',
    isActive:    true,
    isApproved:  true,
    isEmailVerified: true,
    expertise:   ['FinTech', 'Venture Capital', 'Banque digitale'],
    bio:         "Directeur associé chez Tunisia Ventures. 15 ans d'expérience en capital-risque et fintech africaine.",
    company:     'Tunisia Ventures',
    linkedin:    'https://linkedin.com/in/karimghorbel',
    assignedProgrammes: ['Programme FinTech 2026'],
    evaluationsCount: 0,
    createdAt:   new Date('2026-01-10'),
  },
  {
    name:        'Omar Trabelsi',
    email:       'omar.trabelsi@jury.medianet.tn',
    role:        'jury',
    isActive:    true,
    isApproved:  true,
    isEmailVerified: true,
    expertise:   ['FinTech', 'Paiements mobiles', 'Régulation BCT'],
    bio:         'Ex-directeur stratégie à la Banque Centrale de Tunisie. Expert en inclusion financière.',
    company:     'BCT Consulting',
    linkedin:    'https://linkedin.com/in/omartrabelsi',
    assignedProgrammes: ['Programme FinTech 2026'],
    evaluationsCount: 0,
    createdAt:   new Date('2026-01-12'),
  },
  {
    name:        'Sonia Mrad',
    email:       'sonia.mrad@jury.medianet.tn',
    role:        'jury',
    isActive:    true,
    isApproved:  true,
    isEmailVerified: true,
    expertise:   ['EdTech', 'Pédagogie numérique', 'Impact social'],
    bio:         "Fondatrice de EduImpact, plateforme e-learning déployée dans 6 pays africains.",
    company:     'EduImpact',
    linkedin:    'https://linkedin.com/in/soniamrad',
    assignedProgrammes: ['Programme EdTech 2026'],
    evaluationsCount: 0,
    createdAt:   new Date('2026-01-15'),
  },
  {
    name:        'Yassine Ben Salah',
    email:       'yassine.bensalah@jury.medianet.tn',
    role:        'jury',
    isActive:    true,
    isApproved:  true,
    isEmailVerified: true,
    expertise:   ['AgriTech', 'CleanTech', 'Développement durable'],
    bio:         "Ingénieur agronome et entrepreneur. Co-fondateur de GreenSeed Afrique.",
    company:     'GreenSeed Afrique',
    linkedin:    'https://linkedin.com/in/yassinebensalah',
    assignedProgrammes: ['Programme AgriTech 2026', 'Programme CleanTech 2026'],
    evaluationsCount: 0,
    createdAt:   new Date('2026-01-18'),
  },
  {
    name:        'Amira Hamdani',
    email:       'amira.hamdani@jury.medianet.tn',
    role:        'jury',
    isActive:    true,
    isApproved:  true,
    isEmailVerified: true,
    expertise:   ['HealthTech', 'Télémédecine', 'MedTech'],
    bio:         "Médecin et co-fondatrice de DoctorConnect. Pionnière de la téléconsultation en Tunisie.",
    company:     'DoctorConnect',
    linkedin:    'https://linkedin.com/in/amirahamdani',
    assignedProgrammes: ['Programme HealthTech 2025'],
    evaluationsCount: 0,
    createdAt:   new Date('2025-04-05'),
  },
];

// ─── MENTORS ────────────────────────────────────────────────────
const mentorsData = [
  {
    name:        'Mehdi Charfeddine',
    email:       'mehdi.charfeddine@mentor.medianet.tn',
    role:        'mentor',
    isActive:    true,
    isApproved:  true,
    isEmailVerified: true,
    expertise:   ['FinTech', 'Levée de fonds', 'Pitch investor'],
    bio:         "Entrepreneur en série, 3 exits réussis. Mentor chez Flat6Labs et Seedstars.",
    company:     'Charfeddine Ventures',
    linkedin:    'https://linkedin.com/in/mehdicharfeddine',
    availability: 'weekends',
    maxMentees:   4,
    currentMentees: ['startup_fondateur@test.tn'],
    sessionsCount: 12,
    rating:       4.9,
    createdAt:   new Date('2026-01-05'),
  },
  {
    name:        'Lina Oueslati',
    email:       'lina.oueslati@mentor.medianet.tn',
    role:        'mentor',
    isActive:    true,
    isApproved:  true,
    isEmailVerified: true,
    expertise:   ['Marketing digital', 'Growth hacking', 'B2C SaaS'],
    bio:         "Ex-CMO chez Jumia Tunisie. Spécialiste de la croissance organique pour les startups early-stage.",
    company:     'GrowthLab TN',
    linkedin:    'https://linkedin.com/in/linaoueslati',
    availability: 'weekdays',
    maxMentees:   5,
    currentMentees: [],
    sessionsCount: 8,
    rating:       4.7,
    createdAt:   new Date('2026-01-08'),
  },
  {
    name:        'Samir Khelifi',
    email:       'samir.khelifi@mentor.medianet.tn',
    role:        'mentor',
    isActive:    true,
    isApproved:  true,
    isEmailVerified: true,
    expertise:   ['Tech & CTO', 'Architecture SaaS', 'DevOps', 'IA appliquée'],
    bio:         "CTO de TechBridge, 10 ans d'expérience en développement de plateformes SaaS scalables.",
    company:     'TechBridge',
    linkedin:    'https://linkedin.com/in/samirkhelifi',
    availability: 'flexible',
    maxMentees:   3,
    currentMentees: ['startup_candidat@test.tn'],
    sessionsCount: 20,
    rating:       4.8,
    createdAt:   new Date('2026-01-10'),
  },
  {
    name:        'Fatma Zitouni',
    email:       'fatma.zitouni@mentor.medianet.tn',
    role:        'mentor',
    isActive:    true,
    isApproved:  true,
    isEmailVerified: true,
    expertise:   ['Juridique startup', 'Propriété intellectuelle', 'Levée de fonds'],
    bio:         "Avocate d'affaires spécialisée en droit des startups, capital-risque et contrats internationaux.",
    company:     'Cabinet Zitouni & Associés',
    linkedin:    'https://linkedin.com/in/fatmazitouni',
    availability: 'weekdays',
    maxMentees:   6,
    currentMentees: [],
    sessionsCount: 5,
    rating:       4.6,
    createdAt:   new Date('2026-01-20'),
  },
  {
    name:        'Riadh Mansouri',
    email:       'riadh.mansouri@mentor.medianet.tn',
    role:        'mentor',
    isActive:    true,
    isApproved:  true,
    isEmailVerified: true,
    expertise:   ['EdTech', 'Impact social', 'Business model canvas'],
    bio:         "Ancien directeur de l'UNESCO Tunisie. Consultant en innovation éducative et entrepreneuriat social.",
    company:     'ImpactEdu',
    linkedin:    'https://linkedin.com/in/riadhmansouri',
    availability: 'weekends',
    maxMentees:   4,
    currentMentees: [],
    sessionsCount: 3,
    rating:       4.5,
    createdAt:   new Date('2026-02-01'),
  },
  {
    name:        'Mentor Test MEDIANET',
    email:       'mentor_test@medianet.tn',
    role:        'mentor',
    isActive:    true,
    isApproved:  true,
    isEmailVerified: true,
    expertise:   ['Généraliste', 'Accompagnement startup'],
    bio:         'Compte de test pour le portail MEDIANET Incubator.',
    company:     'MEDIANET',
    availability: 'flexible',
    maxMentees:   10,
    currentMentees: [],
    sessionsCount: 0,
    rating:       null,
    createdAt:   new Date('2026-01-01'),
  },
];

// ─── DONNÉES STARTUPS ────────────────────────────────────────────
const fundRanges = ['< 50k', '50k-200k', '200k-500k', '500k+'];
const teamSizes  = ['1-2', '3-5', '6-10', '10+'];
const cities     = ['Tunis', 'Sfax', 'Sousse', 'Monastir', 'Nabeul', 'Bizerte'];

const startupsMock = [
  { name: 'PayLink',     sector: 'FinTech',    founderName: 'Aziz Chabbi',     founderEmail: 'aziz@paylink.tn',     stage: 'mvp',            revenue: 28000,  customers: 120  },
  { name: 'NeoBank TN',  sector: 'FinTech',    founderName: 'Rim Jelassi',     founderEmail: 'rim@neobank.tn',      stage: 'early_traction', revenue: 65000,  customers: 340  },
  { name: 'CryptoSouk',  sector: 'FinTech',    founderName: 'Walid Baccouche', founderEmail: 'walid@cryptosouk.tn', stage: 'prototype',      revenue: 0,      customers: 0    },
  { name: 'InsurBot',    sector: 'FinTech',    founderName: 'Ines Ferchichi',  founderEmail: 'ines@insurbot.tn',    stage: 'mvp',            revenue: 15000,  customers: 80   },
  { name: 'LearnPath',   sector: 'EdTech',     founderName: 'Nour Hamdi',      founderEmail: 'nour@learnpath.tn',   stage: 'mvp',            revenue: 9000,   customers: 500  },
  { name: 'SkillUp Pro', sector: 'EdTech',     founderName: 'Malek Sfaxi',     founderEmail: 'malek@skillup.tn',    stage: 'early_traction', revenue: 22000,  customers: 800  },
  { name: 'EduKids',     sector: 'EdTech',     founderName: 'Safa Bouzid',     founderEmail: 'safa@edukids.tn',     stage: 'prototype',      revenue: 3000,   customers: 200  },
  { name: 'AgroSense',   sector: 'AgriTech',   founderName: 'Chaker Moussa',   founderEmail: 'chaker@agrosense.tn', stage: 'prototype',      revenue: 5000,   customers: 30   },
  { name: 'FarmData',    sector: 'AgriTech',   founderName: 'Houda Jlassi',    founderEmail: 'houda@farmdata.tn',   stage: 'idea',           revenue: 0,      customers: 0    },
  { name: 'SolarMesh',   sector: 'CleanTech',  founderName: 'Bilel Triki',     founderEmail: 'bilel@solarmesh.tn',  stage: 'mvp',            revenue: 18000,  customers: 15   },
  { name: 'WaterAI',     sector: 'CleanTech',  founderName: 'Asma Dridi',      founderEmail: 'asma@waterai.tn',     stage: 'prototype',      revenue: 0,      customers: 0    },
  { name: 'MediQuick',   sector: 'HealthTech', founderName: 'Sami Ben Amor',   founderEmail: 'sami@mediquick.tn',   stage: 'scaling',        revenue: 90000,  customers: 1200 },
  { name: 'NutriTrack',  sector: 'HealthTech', founderName: 'Dorra Krichen',   founderEmail: 'dorra@nutritrack.tn', stage: 'early_traction', revenue: 31000,  customers: 420  },
  { name: 'CartMax',     sector: 'E-commerce', founderName: 'Rami Dhahri',     founderEmail: 'rami@cartmax.tn',     stage: 'scaling',        revenue: 140000, customers: 5000 },
  { name: 'DelivFast',   sector: 'Logistique', founderName: 'Tarek Zouaoui',   founderEmail: 'tarek@delivfast.tn',  stage: 'early_traction', revenue: 47000,  customers: 320  },
];

// ── Score AI ──────────────────────────────────────────────────────
function buildAiScore(startup) {
  const base = startup.revenue > 50000 ? 75 : startup.revenue > 10000 ? 60 : 40;
  const scores = {
    problem:  rndInt(Math.max(0, base - 5),  Math.min(20, base)),
    market:   rndInt(Math.max(0, base - 5),  Math.min(20, base)),
    team:     rndInt(Math.max(0, base - 8),  Math.min(20, base + 5)),
    solution: rndInt(Math.max(0, base - 5),  Math.min(20, base)),
    traction: rndInt(Math.max(0, base - 10), Math.min(20, base)),
  };
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  return {
    scores,
    total,
    summary:    startup.revenue > 50000
      ? 'Forte traction, équipe solide et marché bien adressé.'
      : 'Concept prometteur mais traction limitée à ce stade.',
    strengths:  ['Vision claire du marché', 'Équipe complémentaire'],
    weaknesses: startup.revenue < 10000
      ? ['Traction insuffisante', 'Revenu à prouver']
      : ['Concurrence internationale'],
    generatedAt: pastDate(rndInt(10, 40)),
    model:       'claude-sonnet-4-20250514',
  };
}

// ── Timeline ──────────────────────────────────────────────────────
function buildTimeline(status, appliedAt) {
  const steps  = ['submitted', 'reviewing', 'interview', 'decision'];
  const labels = {
    submitted: 'Candidature soumise',
    reviewing: "En cours d'évaluation",
    interview: 'Entretien',
    decision:  'Décision finale',
  };
  const statusOrder = { pending: 0, reviewing: 1, interview: 2, accepted: 3, rejected: 3 };
  const reached = statusOrder[status] ?? 0;
  return steps.map((step, i) => ({
    step,
    label:  labels[step],
    status: i < reached ? 'done' : i === reached ? 'active' : 'pending',
    date:   i < reached ? new Date(appliedAt.getTime() + i * 7 * 86400000) : null,
  }));
}

// ─────────────────────────────────────────────────────────────────
// ✅ CONSTRUCTEUR COMMUN
// Tous les champs lus par le frontend sont présents à la RACINE
// ─────────────────────────────────────────────────────────────────
function buildApplication(s, { programme, type, status, appliedAt, juryAssigned, notes, businessModel, targetMarket, description }) {
  const score   = buildAiScore(s);
  const funding = rnd(fundRanges);

  return {
    // ── Programme ──────────────────────────────────────────────
    programmeName:  programme || null,
    type,

    // ── Statut & dates ─────────────────────────────────────────
    status,
    submittedAt:    appliedAt,        // ✅ lu par ApplicationCard (date affichée)
    appliedAt,
    lastUpdated:    new Date(),
    decidedAt:      ['accepted', 'rejected'].includes(status)
      ? new Date(appliedAt.getTime() + 15 * 86400000)
      : null,

    // ── Champs RACINE ── lus directement par le frontend ───────
    startupName:    s.name,
    founder:        s.founderName,    // ✅ modal Détails → "Fondateur"
    email:          s.founderEmail,   // ✅ modal Détails → "Email"
    sector:         s.sector,
    stage:          s.stage,
    location:       rnd(cities),
    amount:         funding,          // ✅ modal Détails → "Montant" + card
    description,                      // ✅ modal Détails → "Description"
    totalScore:     score.total,      // ✅ card → "Score AI"

    // Alias de compatibilité (conserve les anciens noms)
    founderName:    s.founderName,
    founderEmail:   s.founderEmail,

    // ── Scores détaillés ───────────────────────────────────────
    // ✅ SCORING_CRITERIA du frontend : team / innovation / market / business / traction
    detailedScores: {
      team:       score.scores.team,
      innovation: score.scores.solution,
      market:     score.scores.market,
      business:   score.scores.problem,
      traction:   score.scores.traction,
    },
    adminRemarks:       {},
    adminDecisionRemark:'',
    aiScore:            score,        // objet complet conservé

    // ── Réponses formulaire ────────────────────────────────────
    formResponses: {
      startupName:   s.name,
      sector:        s.sector,
      stage:         s.stage,
      description,
      founderName:   s.founderName,
      founderEmail:  s.founderEmail,
      founderPhone:  `+216 ${rndInt(20,99)} ${rndInt(100,999)} ${rndInt(100,999)}`,
      teamSize:      rnd(teamSizes),
      businessModel,
      targetMarket,
      fundingNeeded: funding,
      revenue:       String(s.revenue),
      customers:     String(s.customers),
      usp:           `Solution unique : ${s.name} sur le marché tunisien et africain.`,
    },

    // ── Timeline & jury ────────────────────────────────────────
    timelineSteps:  buildTimeline(status, appliedAt),
    statusHistory:  [
      { status: 'submitted', date: appliedAt, by: 'System' },
    ],
    juryAssigned,
    juryIds:        [],
    notified:       false,
    notes,

    // ── Méta ───────────────────────────────────────────────────
    createdAt:  appliedAt,
    updatedAt:  new Date(),
  };
}

// ── FinTech 2026 ──────────────────────────────────────────────────
function buildFinTechApplications() {
  const statuses = ['accepted', 'accepted', 'reviewing', 'pending', 'rejected'];
  return startupsMock
    .filter(s => s.sector === 'FinTech')
    .map((s, i) => buildApplication(s, {
      programme:    'Programme FinTech 2026',
      type:         'programme',
      status:       statuses[i] || 'pending',
      appliedAt:    pastDate(rndInt(20, 60)),
      juryAssigned: ['Karim Ghorbel', 'Omar Trabelsi'],
      notes:        statuses[i] === 'rejected' ? 'Modèle économique insuffisamment validé.' : '',
      businessModel:'SaaS / Commission sur transaction / Abonnement mensuel',
      targetMarket: 'PME tunisiennes et marché MENA',
      description:  `${s.name} est une startup FinTech en phase ${s.stage} qui révolutionne les paiements digitaux en Tunisie.`,
    }));
}

// ── EdTech 2026 ───────────────────────────────────────────────────
function buildEdTechApplications() {
  const statuses = ['accepted', 'reviewing', 'pending'];
  return startupsMock
    .filter(s => s.sector === 'EdTech')
    .map((s, i) => buildApplication(s, {
      programme:    'Programme EdTech 2026',
      type:         'programme',
      status:       statuses[i] || 'pending',
      appliedAt:    pastDate(rndInt(10, 30)),
      juryAssigned: ['Sonia Mrad'],
      notes:        '',
      businessModel:"Abonnement B2C et licences B2B pour établissements scolaires.",
      targetMarket: "Élèves, étudiants et écoles privées en Tunisie.",
      description:  `${s.name} développe des solutions éducatives innovantes pour démocratiser l'accès au savoir.`,
    }));
}

// ── Spontanées ────────────────────────────────────────────────────
function buildSpontaneousApplications() {
  const spontaneousStatuses = ['pending', 'reviewing', 'accepted', 'rejected'];
  return startupsMock
    .filter(s => !['FinTech', 'EdTech'].includes(s.sector))
    .map(s => buildApplication(s, {
      programme:    null,
      type:         'spontaneous',
      status:       rnd(spontaneousStatuses),
      appliedAt:    pastDate(rndInt(5, 90)),
      juryAssigned: [],
      notes:        '',
      businessModel:'Modèle en cours de définition.',
      targetMarket: 'Marché tunisien et africain.',
      description:  `${s.name} est une startup ${s.sector} en phase ${s.stage} avec ${s.customers} clients actifs.`,
    }));
}

// ─── MAIN SEED ───────────────────────────────────────────────────
async function seed() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const dbName = MONGO_URI.split('/').pop().split('?')[0];
    const db     = client.db(dbName);
    console.log(`\n✅ MongoDB connecté : ${MONGO_URI}\n`);

    const fintech      = buildFinTechApplications();
    const edtech       = buildEdTechApplications();
    const spontaneous  = buildSpontaneousApplications();
    const applications = [...fintech, ...edtech, ...spontaneous];

    await db.collection('applications').deleteMany({});
    await db.collection('applications').insertMany(applications);

    await db.collection('jury').deleteMany({});
    await db.collection('jury').insertMany(juryData);

    await db.collection('mentors').deleteMany({});
    await db.collection('mentors').insertMany(mentorsData);

    // ── Résumé ────────────────────────────────────────────────────
    console.log('══════════════════════════════════════════════════════════════');
    console.log('RÉSUMÉ DU SEEDING');
    console.log('══════════════════════════════════════════════════════════════');
    console.log(`\nCandidatures : ${applications.length} documents`);
    console.log(`  FinTech 2026  : ${fintech.length}`);
    console.log(`  EdTech 2026   : ${edtech.length}`);
    console.log(`  Spontanées    : ${spontaneous.length}`);
    console.log(`  → acceptées   : ${applications.filter(a => a.status === 'accepted').length}`);
    console.log(`  → en attente  : ${applications.filter(a => a.status === 'pending').length}`);
    console.log(`  → en révision : ${applications.filter(a => a.status === 'reviewing').length}`);
    console.log(`  → rejetées    : ${applications.filter(a => a.status === 'rejected').length}`);

    // Vérification rapide du premier document
    const s = applications[0];
    console.log('\n── Champs racine (vérification) ──────────────────────────');
    console.log(`  startupName    : ${s.startupName}`);
    console.log(`  founder        : ${s.founder}`);
    console.log(`  email          : ${s.email}`);
    console.log(`  amount         : ${s.amount}`);
    console.log(`  totalScore     : ${s.totalScore}`);
    console.log(`  detailedScores : ${JSON.stringify(s.detailedScores)}`);
    console.log(`  description    : ${s.description?.substring(0, 60)}...`);

    console.log(`\nJury    : ${juryData.length} membres`);
    juryData.forEach(j => console.log(`  • ${j.name}`));
    console.log(`\nMentors : ${mentorsData.length}`);
    mentorsData.forEach(m => console.log(`  • ${m.name}`));
    console.log('\n══════════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('\n❌ ERREUR SEEDING :', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('→ MongoDB non disponible. Vérifiez que le service est actif.');
    }
    process.exit(1);
  } finally {
    await client.close();
    console.log('Déconnexion MongoDB.');
    process.exit(0);
  }
}

seed();