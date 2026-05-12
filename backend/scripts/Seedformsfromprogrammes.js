// scripts/seedFormsFromProgrammes.js
// Creates one form per existing programme (read from DB) and links them bidirectionally.
// Also creates / updates the base "Formulaire de Base" for spontaneous candidatures.
//
// Usage: node scripts/seedFormsFromProgrammes.js

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/medianet_db';

// ─── SECTOR → ACCENT COLOR ───────────────────────────────────────────────────
const SECTOR_ACCENT = {
  FinTech:        '#0EA5E9',
  HealthTech:     '#10B981',
  AgriTech:       '#F59E0B',
  EdTech:         '#8B5CF6',
  CleanTech:      '#059669',
  'E-Commerce':   '#F97316',
  'AI/ML':        '#EC4899',
  Cybersécurité:  '#EF4444',
  Logistique:     '#06B6D4',
  'RH/Future of Work': '#6366F1',
  FoodTech:       '#F59E0B',
  'Tous secteurs': '#006d94',
};

const accentFor = (sector) => SECTOR_ACCENT[sector] || '#006d94';

// ─── QUESTION HELPERS ────────────────────────────────────────────────────────
const q = (id, type, title, opts = {}) => ({
  id,
  type,
  title,
  label: title,
  description: opts.description || '',
  required: opts.required !== false,
  options: opts.options || [],
  rows: opts.rows || [],
  scaleMin: opts.scaleMin || 1,
  scaleMax: opts.scaleMax || 5,
  scaleMinLabel: opts.scaleMinLabel || '',
  scaleMaxLabel: opts.scaleMaxLabel || '',
});

// ─── BASE QUESTIONS (shared by all forms) ────────────────────────────────────
const BASE_QUESTIONS = [
  q('q1', 'short',    "Nom de la startup"),
  q('q2', 'short',    "Fondateur(s)"),
  q('q3', 'radio',    "Stade de développement", {
    options: ["Idée / pré-prototype", "Prototype", "MVP", "Premiers clients", "Croissance", "Expansion"],
  }),
  q('q4', 'short',    "Année de fondation"),
  q('q5', 'short',    "Taille de l'équipe", { required: false }),
  q('q6', 'short',    "Pays / Ville d'opération", { required: false }),
  q('q7', 'radio',    "Stade de financement actuel", {
    options: ["Pré-seed / Bootstrapped", "Seed", "Série A", "Série B+"],
  }),
  q('q8', 'long',     "Décrivez le problème que vous résolvez (2–3 phrases)"),
  q('q9', 'long',     "Décrivez votre solution et sa différenciation"),
  q('q10','radio',    "Comment avez-vous entendu parler de nous ?", {
    required: false,
    options: ["Partenaire / Référence", "LinkedIn", "Site web Medianet", "Réseaux sociaux", "Conférence / Événement", "Autre"],
  }),
];

// ─── SECTOR-SPECIFIC EXTRA QUESTIONS ─────────────────────────────────────────
const EXTRA_BY_SECTOR = {
  FinTech: [
    q('qf1', 'radio',  "Modèle de revenus principal", {
      options: ["Commission sur transaction", "Abonnement SaaS", "Freemium", "Marketplace", "Autre"],
    }),
    q('qf2', 'short',  "Revenu mensuel récurrent actuel (TND)", { required: false }),
    q('qf3', 'radio',  "Conformité réglementaire BCT", {
      options: ["Conforme", "En cours", "Non démarré"],
    }),
    q('qf4', 'long',   "Partenariats bancaires existants ou en discussion", { required: false }),
    q('qf5', 'short',  "Nombre de clients / transactions actifs", { required: false }),
    q('qf6', 'long',   "Pourquoi rejoindre le programme FinTech Medianet ?"),
  ],
  HealthTech: [
    q('qh1', 'radio',  "Segment HealthTech", {
      options: ["Télémédecine", "Diagnostics IA", "Dispositifs médicaux", "Dossier patient numérique", "Pharmacie / MedTech", "Santé mentale", "Autre"],
    }),
    q('qh2', 'radio',  "Conformité normes médicales", {
      options: ["Certifié CE / ISO 13485", "En cours de certification", "Non démarré"],
    }),
    q('qh3', 'short',  "Nombre d'établissements de santé partenaires ou en pilote", { required: false }),
    q('qh4', 'long',   "Impact mesurable sur la qualité des soins ou l'accès à la santé", { required: false }),
    q('qh5', 'long',   "Pourquoi rejoindre le programme HealthTech Medianet ?"),
  ],
  AgriTech: [
    q('qa1', 'radio',  "Sous-secteur AgriTech", {
      options: ["Agriculture de précision / IoT", "Gestion de l'eau / irrigation", "Marketplace agricole", "Agroalimentaire / transformation", "Chaîne froide / logistique", "Autre"],
    }),
    q('qa2', 'short',  "Région géographique cible (gouvernorat / pays)"),
    q('qa3', 'short',  "Nombre d'agriculteurs / coopératives en pilote ou clients", { required: false }),
    q('qa4', 'long',   "Impact mesurable : rendement, économie d'eau, réduction pertes post-récolte", { required: false }),
    q('qa5', 'long',   "Pourquoi rejoindre le programme AgriTech Medianet ?"),
  ],
  EdTech: [
    q('qe1', 'radio',  "Modèle économique EdTech", {
      options: ["B2C (élèves / familles)", "B2B (établissements scolaires)", "B2B (entreprises / formation pro)", "Modèle mixte"],
    }),
    q('qe2', 'short',  "Technologie principale utilisée (IA, LMS, VR…)"),
    q('qe3', 'short',  "Public cible (tranche d'âge, niveau scolaire…)"),
    q('qe4', 'short',  "Nombre d'utilisateurs actifs", { required: false }),
    q('qe5', 'scale',  "Impact pédagogique estimé (1 = faible, 10 = transformationnel)", {
      required: false, scaleMin: 1, scaleMax: 10,
      scaleMinLabel: "Faible impact", scaleMaxLabel: "Impact transformationnel",
    }),
    q('qe6', 'long',   "Stratégie de déploiement en Tunisie et expansion MENA"),
  ],
  CleanTech: [
    q('qc1', 'radio',  "Sous-secteur CleanTech", {
      options: ["Énergie solaire / renouvelable", "Efficacité énergétique", "Gestion des déchets", "Eau et assainissement", "Mobilité verte", "Autre"],
    }),
    q('qc2', 'short',  "Impact environnemental quantifiable (CO₂ évité, eau économisée…)", { required: false }),
    q('qc3', 'radio',  "Certifications environnementales", {
      required: false,
      options: ["ISO 14001 / certifié", "En cours", "Non démarré"],
    }),
    q('qc4', 'short',  "Nombre de clients / projets pilotes actifs", { required: false }),
    q('qc5', 'long',   "Pourquoi rejoindre le programme CleanTech Medianet ?"),
  ],
  FoodTech: [
    q('qft1', 'radio', "Sous-secteur FoodTech", {
      options: ["Agritech", "Food services / restauration", "Livraison", "Science de l'alimentation", "Chaîne d'approvisionnement", "Consumer tech alimentaire", "Autre"],
    }),
    q('qft2', 'short', "Nombre de restaurants / clients professionnels partenaires", { required: false }),
    q('qft3', 'long',  "Describe your traction and key milestones to date", { required: false }),
    q('qft4', 'long',  "Why do you want to join the FoodStart programme ?"),
  ],
  'AI/ML': [
    q('qai1', 'radio', "Type d'IA développée", {
      options: ["Computer Vision", "NLP / LLM", "Predictive Analytics / ML", "MLOps / infrastructure", "IA générative", "Autre"],
    }),
    q('qai2', 'short', "Stack technique principal (frameworks, cloud…)"),
    q('qai3', 'long',  "Décrivez votre modèle propriétaire et son avantage compétitif"),
    q('qai4', 'short', "Métriques de performance du modèle (F1, AUC, précision…)", { required: false }),
    q('qai5', 'long',  "Pourquoi rejoindre le programme AI/ML Medianet ?"),
  ],
};

const getExtraQuestions = (sector) => EXTRA_BY_SECTOR[sector] || [];

// ─── BUILD FORM DOCUMENT FOR A PROGRAMME ─────────────────────────────────────
function buildFormForProgramme(programme) {
  const sector = programme.sector || 'Tous secteurs';
  const extras = getExtraQuestions(sector);
  const allQuestions = [...BASE_QUESTIONS, ...extras];

  return {
    title:         `Formulaire — ${programme.titre}`,
    subtitle:      programme.description
      ? programme.description.substring(0, 120) + (programme.description.length > 120 ? '…' : '')
      : `Formulaire de candidature pour ${programme.titre}`,
    description:   programme.description || `Formulaire de candidature pour le programme ${programme.titre}.`,
    type:          'custom',
    status:        programme.status === 'closed' ? 'archived'
                 : programme.status === 'draft'   ? 'draft'
                 : 'published',
    accent:        accentFor(sector),
    programmeId:   programme._id,
    programme:     programme._id.toString(),
    programmeName: programme.titre,
    programmeSector: sector,
    isInherited:   true,
    questions:     allQuestions,
    fields:        allQuestions.length,
    sentTo:        programme.candidatures || 0,
    sentToNames:   [],
    responses:     0,
    completionRate:0,
    createdAt:     new Date(),
    updatedAt:     new Date(),
  };
}

// ─── BASE FORM (spontaneous / generic) ───────────────────────────────────────
function buildBaseForm(spontaneProg) {
  const questions = [
    ...BASE_QUESTIONS,
    q('qb1', 'radio', "Secteur d'activité principal", {
      options: ["FinTech", "HealthTech", "AgriTech", "EdTech", "CleanTech", "E-Commerce", "AI/ML", "Logistique", "FoodTech", "Autre"],
    }),
    q('qb2', 'short', "Site web ou lien démo", { required: false }),
    q('qb3', 'long',  "Modèle économique et sources de revenus envisagés"),
    q('qb4', 'radio', "Montant de financement recherché", {
      required: false,
      options: ["< 50 000 TND", "50 000 – 200 000 TND", "200 000 – 500 000 TND", "500 000 TND et +"],
    }),
    q('qb5', 'long',  "Qu'attendez-vous de l'incubateur Medianet ?"),
  ];

  return {
    title:         "Formulaire de Base — Candidature Spontanée",
    subtitle:      "Formulaire standard ouvert à toutes les innovations, quel que soit le secteur.",
    description:   "Formulaire de base pour toutes les candidatures hors programme sectoriel défini. Ouvert en permanence.",
    type:          'basic',
    status:        'published',
    accent:        '#006d94',
    programmeId:   spontaneProg?._id || null,
    programme:     spontaneProg?._id?.toString() || null,
    programmeName: spontaneProg?.titre || 'Candidatures Spontanées',
    programmeSector:'Tous secteurs',
    isInherited:   false,
    questions,
    fields:        questions.length,
    sentTo:        0,
    sentToNames:   [],
    responses:     0,
    completionRate:0,
    createdAt:     new Date(),
    updatedAt:     new Date(),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════
async function seed() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const dbName = MONGO_URI.split('/').pop().split('?')[0];
    const db = client.db(dbName);
    console.log(`\n✅  MongoDB connecté : ${dbName}\n`);

    // ── 1. Fetch all programmes ───────────────────────────────────────────────
    const programmes = await db.collection('programmes').find({}).toArray();
    if (!programmes.length) {
      console.error('❌  Aucun programme trouvé. Lancez d\'abord seedProgrammes.js');
      process.exit(1);
    }
    console.log(`📋  ${programmes.length} programmes trouvés :`);
    programmes.forEach(p => console.log(`    • [${p.status.padEnd(9)}] ${p.sector.padEnd(14)} — ${p.titre}`));
    console.log('');

    // ── 2. Drop existing seeded forms (keep manually-created ones) ────────────
    await db.collection('forms').deleteMany({ isInherited: { $in: [true, false] }, _seededByScript: true });
    console.log('🗑   Anciens formulaires seedés supprimés\n');

    // ── 3. Build one form per programme ──────────────────────────────────────
    const formsToInsert = [];
    const spontaneProg = programmes.find(p =>
      p.sector === 'Tous secteurs' || p.titre.toLowerCase().includes('spontan')
    );

    // Base form first
    const baseForm = buildBaseForm(spontaneProg);
    baseForm._seededByScript = true;
    formsToInsert.push(baseForm);

    // One form per non-"Tous secteurs" programme
    for (const prog of programmes) {
      if (prog.sector === 'Tous secteurs') continue; // base form covers this
      const form = buildFormForProgramme(prog);
      form._seededByScript = true;
      formsToInsert.push(form);
    }

    const result = await db.collection('forms').insertMany(formsToInsert);
    const insertedIds = Object.values(result.insertedIds);
    console.log(`✅  ${result.insertedCount} formulaires insérés\n`);

    // ── 4. Link each form back to its programme (formulaire field) ────────────
    let linkedCount = 0;
    for (let i = 0; i < formsToInsert.length; i++) {
      const form = formsToInsert[i];
      const formId = insertedIds[i];
      if (!form.programmeId) continue;

      await db.collection('programmes').updateOne(
        { _id: form.programmeId },
        { $set: { formulaire: form.title, formulaireId: formId, updatedAt: new Date() } }
      );
      linkedCount++;
    }
    console.log(`🔗  ${linkedCount} programmes liés à leur formulaire\n`);

    // ── 5. Summary ────────────────────────────────────────────────────────────
    console.log('══════════════════════════════════════════════════════════════════════');
    console.log('  FORMULAIRES CRÉÉS');
    console.log('══════════════════════════════════════════════════════════════════════');
    console.log(`  ${'Titre'.padEnd(48)} ${'Status'.padEnd(10)} Questions`);
    console.log('  ' + '─'.repeat(68));
    formsToInsert.forEach(f => {
      const short = f.title.length > 46 ? f.title.substring(0, 45) + '…' : f.title;
      console.log(`  ${short.padEnd(48)} ${f.status.padEnd(10)} ${f.questions.length}`);
    });
    console.log('══════════════════════════════════════════════════════════════════════');
    console.log(`\n  ✅  Seed terminé — ${result.insertedCount} formulaires, ${linkedCount} liens programme↔formulaire`);
    console.log('\n  💡  Les formulaires sont maintenant disponibles dans :\n');
    console.log('       GET /api/forms              → liste complète');
    console.log('       GET /api/forms?programme=<id> → filtre par programme');
    console.log('       GET /api/admin/programmes   → chaque programme a formulaire + formulaireId');
    console.log('');

  } catch (err) {
    console.error('\n❌  ERREUR :', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.close();
    console.log('  🔌  MongoDB déconnecté.\n');
    process.exit(0);
  }
}

seed();