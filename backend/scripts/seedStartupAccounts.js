// scripts/seedStartupAccounts.js
// Usage: node scripts/seedStartupAccounts.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User        = require('../src/models/User');
const Application = require('../src/models/Application');
const Programme   = require('../src/models/Programme');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/medianet_db';

// ─── STAGE MAPPER ─────────────────────────────────────────────────────────────
// Enum exact du modèle User : ['idea', 'mvp', 'launched', 'scaling']
const STAGE_MAP = {
  'idea':           'idea',
  'ideation':       'idea',
  'prototype':      'idea',
  'pre_seed':       'idea',
  'mvp':            'mvp',
  'early_stage':    'mvp',
  'early_traction': 'launched',
  'launched':       'launched',
  'seed':           'launched',
  'gtm':            'launched',
  'scaling':        'scaling',
  'growth':         'scaling',
  'expansion':      'scaling',
  'series_a':       'scaling',
  'graduation':     'scaling',
};

function normalizeStage(stage) {
  return STAGE_MAP[stage] || 'idea';
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function mapDocuments(docs = []) {
  const docTypeMap = {
    'business_plan.pdf':   'businessPlan',
    'pitch_deck.pptx':     'pitchDeck',
    'financials.xlsx':     'financials',
    'technical_specs.pdf': 'other',
  };
  return docs.map(filename => ({
    name:       filename,
    docType:    docTypeMap[filename] || 'other',
    filename,
    url:        `/uploads/${filename}`,
    uploadedAt: new Date(),
    status:     'approved',
  }));
}

// ─── STARTUPS DATA ──────────────────────────────────────────────────────────
const STARTUPS = [
  {
    founder:     'Imen Ben Ammar',
    email:       'imen@paytunis.tn',
    password:    'Startup2026!',
    phone:       '+216 55 000 001',
    startupName: 'PayTunis',
    location:    'Tunis, Tunisia',
    sector:      'FinTech',
    stage:       'mvp',
    website:     'https://paytunis.tn',
    description: 'Mobile payment solution for merchants enabling seamless transactions across Tunisia.',
    programmeName: 'Programme FinTech 2026',
    status: 'accepted',
    timelinePhase: 'development', timelineProgress: 45,
    timelineNotes: 'MVP launched, working on payment gateway integrations.',
    kpis: { mrr: 12000, users: 340, growth: '+28%' },
    aiScore: {
      scores: { problem: 15, market: 17, team: 16, solution: 18, traction: 17 },
      total: 83,
      summary: 'Solution de paiement mobile bien positionnée sur le marché tunisien.',
      strengths: ['Forte demande marché', 'Intégration banques locales'],
      weaknesses: ['Compétition régionale forte', 'Modèle de revenus à affiner'],
      generatedAt: new Date('2026-02-10'), model: 'claude-sonnet-4-20250514',
    },
    documents: ['business_plan.pdf', 'pitch_deck.pptx'],
    formResponses: {
      startupName: 'PayTunis', sector: 'FinTech', stage: 'mvp',
      description: 'Paiement mobile B2C pour les marchands tunisiens.',
      founderName: 'Imen Ben Ammar', founderEmail: 'imen@paytunis.tn',
      founderPhone: '+216 55 000 001', teamSize: '3-5',
      businessModel: 'Commission sur transactions + abonnement mensuel commerçants.',
      targetMarket: 'PME et commerçants tunisiens indépendants.',
      fundingNeeded: '50k-200k',
      usp: 'Intégration native avec les banques tunisiennes.',
      revenue: '12000', customers: '340',
    },
  },
  {
    founder:     'Hela Ghariani',
    email:       'hela@dabadoc.ma',
    password:    'Startup2026!',
    phone:       '+212 6 00 00 00 01',
    startupName: 'DabaDoc',
    location:    'Casablanca, Morocco',
    sector:      'HealthTech',
    stage:       'scaling',
    website:     'https://dabadoc.ma',
    description: 'Telemedicine platform connecting patients with doctors across North Africa.',
    programmeName: 'HealthTech Boost',
    status: 'accepted',
    timelinePhase: 'gtm', timelineProgress: 72,
    timelineNotes: 'Partnership with 3 hospitals confirmed. Scaling marketing.',
    kpis: { mrr: 45000, users: 2100, growth: '+61%' },
    aiScore: {
      scores: { problem: 19, market: 19, team: 18, solution: 19, traction: 19 },
      total: 94,
      summary: 'Plateforme télémédicine leader en Afrique du Nord avec forte traction.',
      strengths: ['Traction exceptionnelle', 'Équipe médicale qualifiée', 'Marché porteur'],
      weaknesses: ['Régulation santé complexe', 'Besoin de capitaux importants'],
      generatedAt: new Date('2026-02-15'), model: 'claude-sonnet-4-20250514',
    },
    documents: ['business_plan.pdf', 'pitch_deck.pptx', 'financials.xlsx'],
    formResponses: {
      startupName: 'DabaDoc', sector: 'HealthTech', stage: 'scaling',
      description: 'Télémédecine connectant patients et médecins en Afrique du Nord.',
      founderName: 'Hela Ghariani', founderEmail: 'hela@dabadoc.ma',
      founderPhone: '+212 6 00 00 00 01', teamSize: '10+',
      businessModel: 'Abonnement médecins + commission consultations.',
      targetMarket: '200M personnes en Afrique du Nord.',
      fundingNeeded: '500k+',
      usp: 'Seule plateforme certifiée dans 4 pays africains.',
      revenue: '45000', customers: '2100',
      achievements: 'Partenariat avec 3 CHU au Maroc et en Tunisie.',
    },
  },
  {
    founder:     'Ibrahim Diallo',
    email:       'ibrahim@agrismart.ci',
    password:    'Startup2026!',
    phone:       '+225 00 00 00 01',
    startupName: 'AgriSmart',
    location:    "Abidjan, Côte d'Ivoire",
    sector:      'AgriTech',
    stage:       'prototype',
    website:     'https://agrismart.ci',
    description: 'IoT sensors for smart agriculture and crop yield optimization.',
    programmeName: null,
    status: 'accepted',
    timelinePhase: 'ideation', timelineProgress: 30,
    timelineNotes: 'Prototype tested on 5 farms. Refining hardware design.',
    kpis: { mrr: 3200, users: 85, growth: '+12%' },
    aiScore: {
      scores: { problem: 16, market: 15, team: 15, solution: 16, traction: 14 },
      total: 76,
      summary: 'Solution IoT agricole prometteuse sur un marché sous-équipé.',
      strengths: ['Problème réel et urgent', 'Technologie différenciante'],
      weaknesses: ['Traction encore faible', 'Coût hardware élevé'],
      generatedAt: new Date('2026-02-20'), model: 'claude-sonnet-4-20250514',
    },
    documents: ['business_plan.pdf'],
    formResponses: {
      startupName: 'AgriSmart', sector: 'AgriTech', stage: 'prototype',
      description: 'Capteurs IoT pour agriculture intelligente.',
      founderName: 'Ibrahim Diallo', founderEmail: 'ibrahim@agrismart.ci',
      founderPhone: '+225 00 00 00 01', teamSize: '3-5',
      businessModel: "Vente matériel + abonnement plateforme analytics.",
      targetMarket: "Exploitants agricoles Afrique de l'Ouest.",
      fundingNeeded: '50k-200k',
      usp: 'Capteurs adaptés aux conditions climatiques africaines.',
      revenue: '3200', customers: '85',
    },
  },
  {
    founder:     'Sara Ben Ali',
    email:       'sara@edulearn.tn',
    password:    'Startup2026!',
    phone:       '+216 98 000 001',
    startupName: 'EduLearn TN',
    location:    'Sfax, Tunisia',
    sector:      'EdTech',
    stage:       'mvp',
    website:     'https://edulearn.tn',
    description: 'Adaptive learning platform for K-12 students using AI.',
    programmeName: null,
    status: 'accepted',
    timelinePhase: 'development', timelineProgress: 55,
    timelineNotes: 'On hold pending curriculum compliance review.',
    kpis: { mrr: 8500, users: 620, growth: '+7%' },
    aiScore: {
      scores: { problem: 16, market: 16, team: 16, solution: 16, traction: 16 },
      total: 80,
      summary: 'Plateforme EdTech adaptative avec un bon potentiel sur le marché tunisien.',
      strengths: ['IA pédagogique différenciante', 'Besoin fort post-COVID'],
      weaknesses: ['Croissance modérée', 'Conformité curriculum complexe'],
      generatedAt: new Date('2026-01-05'), model: 'claude-sonnet-4-20250514',
    },
    documents: ['business_plan.pdf', 'pitch_deck.pptx'],
    formResponses: {
      startupName: 'EduLearn TN', sector: 'EdTech', stage: 'mvp',
      description: 'Apprentissage adaptatif IA pour élèves K-12.',
      founderName: 'Sara Ben Ali', founderEmail: 'sara@edulearn.tn',
      founderPhone: '+216 98 000 001', teamSize: '3-5',
      businessModel: 'Abonnement mensuel familles + licences écoles.',
      targetMarket: '1.2M élèves tunisiens.',
      fundingNeeded: '50k-200k',
      usp: 'IA pédagogique alignée sur curriculum tunisien officiel.',
      revenue: '8500', customers: '620',
    },
  },
  {
    founder:     'Mohamed Khemiri',
    email:       'mohamed@solartech.tn',
    password:    'Startup2026!',
    phone:       '+216 22 000 001',
    startupName: 'SolarTech',
    location:    'Tunis, Tunisia',
    sector:      'CleanTech',
    stage:       'mvp',
    website:     'https://solartech.tn',
    description: 'Solar energy optimization and smart grid solutions for residential use.',
    programmeName: 'GreenTech Africa',
    status: 'accepted',
    timelinePhase: 'gtm', timelineProgress: 68,
    timelineNotes: 'First 10 residential installations complete. B2B pipeline building.',
    kpis: { mrr: 18000, users: 130, growth: '+34%' },
    aiScore: {
      scores: { problem: 15, market: 16, team: 14, solution: 15, traction: 15 },
      total: 75,
      summary: 'Solution CleanTech bien positionnée sur la transition énergétique tunisienne.',
      strengths: ['Subventions gouvernementales disponibles', 'Marché résidentiel croissant'],
      weaknesses: ['Équipe technique à renforcer', 'Capital intensif'],
      generatedAt: new Date('2026-02-25'), model: 'claude-sonnet-4-20250514',
    },
    documents: ['business_plan.pdf', 'technical_specs.pdf'],
    formResponses: {
      startupName: 'SolarTech', sector: 'CleanTech', stage: 'mvp',
      description: 'Optimisation énergie solaire et smart grid résidentiel.',
      founderName: 'Mohamed Khemiri', founderEmail: 'mohamed@solartech.tn',
      founderPhone: '+216 22 000 001', teamSize: '3-5',
      businessModel: 'Vente installation + maintenance + monitoring SaaS.',
      targetMarket: 'Résidents tunisiens et entreprises PME.',
      fundingNeeded: '200k-500k',
      usp: 'ROI garanti en 36 mois sur installation solaire.',
      revenue: '18000', customers: '130',
    },
  },
  {
    founder:     'Anis Bouaziz',
    email:       'anis@logitrack.tn',
    password:    'Startup2026!',
    phone:       '+216 71 000 001',
    startupName: 'LogiTrack',
    location:    'Tunis, Tunisia',
    sector:      'Logistics',
    stage:       'scaling',
    website:     'https://logitrack.tn',
    description: 'Real-time freight and last-mile delivery tracking for MENA markets.',
    programmeName: 'Programme FinTech 2026',
    status: 'accepted',
    timelinePhase: 'graduation', timelineProgress: 100,
    timelineNotes: 'Successfully graduated. Series A closing.',
    kpis: { mrr: 52000, users: 890, growth: '+45%' },
    aiScore: {
      scores: { problem: 18, market: 18, team: 17, solution: 18, traction: 17 },
      total: 88,
      summary: 'Leader logistique MENA avec traction solide et équipe expérimentée.',
      strengths: ['Forte traction', 'Équipe ops expérimentée', 'MRR élevé'],
      weaknesses: ['Expansion internationale coûteuse'],
      generatedAt: new Date('2025-08-15'), model: 'claude-sonnet-4-20250514',
    },
    documents: ['business_plan.pdf', 'financials.xlsx', 'pitch_deck.pptx'],
    formResponses: {
      startupName: 'LogiTrack', sector: 'Logistics', stage: 'scaling',
      description: 'Tracking fret et last-mile en temps réel pour le marché MENA.',
      founderName: 'Anis Bouaziz', founderEmail: 'anis@logitrack.tn',
      founderPhone: '+216 71 000 001', teamSize: '10+',
      businessModel: 'SaaS mensuel transporteurs + commission par livraison.',
      targetMarket: 'Transporteurs et e-commerçants MENA.',
      fundingNeeded: '500k+',
      usp: 'Seul acteur avec couverture temps réel Tunisie-Libye-Algérie.',
      revenue: '52000', customers: '890',
      achievements: 'Partenariat DHL Tunisie. Finaliste Startup Tunisia 2025.',
    },
  },
];

// ─── ADDITIONAL TEST ACCOUNTS ────────────────────────────────────────────────
const EXTRA_ACCOUNTS = [
  {
    name: 'Mentor Test MEDIANET',
    email: 'mentor_test@medianet.tn',
    password: 'Test@1234!',
    role: 'mentor',
    isActive: true, isApproved: true, isEmailVerified: true,
  },
  {
    name: 'Diva Candidat',
    email: 'startup_candidat@test.tn',
    password: 'Test@1234!',
    role: 'applicant',
    isActive: true, isApproved: true, isEmailVerified: true,
  },
];

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅  MongoDB connecté :', MONGO_URI);
    console.log('');

    // ── 1. Comptes supplémentaires ──────────────────────────────────────────
    console.log('── Comptes supplémentaires ────────────────────────────────');
    for (const acc of EXTRA_ACCOUNTS) {
      const exists = await User.findOne({ email: acc.email });
      if (exists) { console.log(`   [IGNORE] ${acc.email}`); continue; }
      const { password, ...rest } = acc;
      const passwordHash = await bcrypt.hash(password, 12);
      await User.create({ ...rest, passwordHash });
      console.log(`   [CRÉÉ]   ${acc.email}  (${acc.role})`);
    }
    console.log('');

    // ── 2. Startups ──────────────────────────────────────────────────────────
    console.log('── Startups ────────────────────────────────────────────────');
    for (const s of STARTUPS) {

      // 2a. Stage normalisé → enum User ['idea','mvp','launched','scaling']
      const stageForUser = normalizeStage(s.stage);

      // 2b. Programme
      let programmeId   = null;
      let programmeName = s.programmeName || '';
      if (s.programmeName) {
        const prog = await Programme.findOne({
          $or: [
            { titre: new RegExp(s.programmeName, 'i') },
            { name:  new RegExp(s.programmeName, 'i') },
          ]
        });
        if (prog) {
          programmeId   = prog._id;
          programmeName = prog.titre || prog.name;
          console.log(`   [PROG]   ${s.programmeName} → trouvé : ${programmeName}`);
        } else {
          console.log(`   [PROG]   ${s.programmeName} → non trouvé (sera sauvé comme string)`);
        }
      }

      // 2c. User fondateur
      let user = await User.findOne({ email: s.email });
      if (!user) {
        const passwordHash = await bcrypt.hash(s.password, 12);
        user = await User.create({
          name:            s.founder,
          email:           s.email,
          passwordHash,
          role:            'applicant',
          phone:           s.phone,
          isActive:        true,
          isApproved:      true,
          isEmailVerified: true,
          startupProfile: {
            startupName:  s.startupName,
            sector:       s.sector,
            stage:        stageForUser,     // ← 'idea'|'mvp'|'launched'|'scaling'
            website:      s.website,
            description:  s.description,
            location:     s.location,
            teamSize:     5,
            foundedYear:  2024,
          },
        });
        console.log(`   [CRÉÉ user]     ${s.founder} <${s.email}>  stage=${stageForUser}`);
      } else {
        await User.findByIdAndUpdate(user._id, {
          'startupProfile.stage': stageForUser,
        });
        console.log(`   [EXISTE user]   ${s.founder}  stage→${stageForUser}`);
      }

      // 2d. Application dans la collection applications
      let app = await Application.findOne({ applicant: user._id });
      if (!app) {
        app = await Application.create({
          applicant: user._id,
          project: {
            startupName: s.startupName,
            sector:      s.sector,
            stage:       s.stage,
            location:    s.location,
            description: s.description,
            website:     s.website,
          },
          team: {
            founderName:  s.founder,
            founderEmail: s.email,
            founderRole:  'CEO & Co-founder',
            teamSize:     s.formResponses.teamSize || '3-5',
          },
          economy: {
            businessModel:  s.formResponses.businessModel || 'SaaS',
            fundingGoal:    s.formResponses.fundingNeeded  || '50k-200k',
            monthlyRevenue: s.formResponses.revenue        || '0',
            customers:      s.kpis.users,
            growthRate:     s.kpis.growth,
          },
          status:           s.status,
          programmeName,
          programmeId,
          kpis:             s.kpis,
          aiScore:          s.aiScore,
          totalScore:       s.aiScore.total,
          timelinePhase:    s.timelinePhase,
          timelineProgress: s.timelineProgress,
          timelineNotes:    s.timelineNotes,
          formResponses:    s.formResponses,
          documents:        mapDocuments(s.documents),
        });
        console.log(`   [CRÉÉ app]      ${s.startupName}  [${s.status}]  score=${s.aiScore.total}`);
      } else {
        await Application.findByIdAndUpdate(app._id, {
          kpis:             s.kpis,
          aiScore:          s.aiScore,
          totalScore:       s.aiScore.total,
          timelinePhase:    s.timelinePhase,
          timelineProgress: s.timelineProgress,
          timelineNotes:    s.timelineNotes,
          formResponses:    s.formResponses,
          'project.website':     s.website,
          'project.description': s.description,
          documents:             mapDocuments(s.documents),
        });
        console.log(`   [MIS À JOUR]    ${s.startupName}`);
      }
    }

    // ── Résumé ───────────────────────────────────────────────────────────────
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  COMPTES DE TEST — STARTUPS');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  Email                          Mot de passe     Rôle');
    console.log('  ──────────────────────────────────────────────────────────────');
    for (const s of STARTUPS) {
      console.log(`  ${s.email.padEnd(32)} Startup2026!     applicant`);
    }
    for (const a of EXTRA_ACCOUNTS) {
      console.log(`  ${a.email.padEnd(32)} Test@1234!       ${a.role}`);
    }
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅  Seed terminé avec succès');

  } catch (err) {
    console.error('❌  Erreur seed :', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('    MongoDB inaccessible. Vérifiez que le serveur tourne.');
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('  🔌  MongoDB déconnecté.');
  }
}

seed();