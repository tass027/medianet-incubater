// scripts/seedCandidateFormResponses.js
// Ajoute des réponses de formulaire complètes pour TOUS les candidats
// dans TOUS les programmes — utilisé si les réponses manquent en BD.
//
// Usage: node scripts/seedCandidateFormResponses.js

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/medianet_db';

// ─── Questions de base communes à tous les programmes ─────────────────────────
const BASE_ANSWERS = (app) => ({
  'Nom de la startup':         app.startupName || app.companyName || 'N/A',
  'Fondateur(s)':              app.founder || app.founderName || 'N/A',
  'Stade de développement':    app.stage || 'MVP',
  'Année de fondation':        app.foundedYear || '2023',
  "Taille de l'équipe":        app.teamSize || '4',
  "Pays / Ville d'opération":  app.location || 'Tunis, Tunisie',
  'Stade de financement actuel': app.fundingStage || 'Pre-seed / Bootstrapped',
  'Décrivez le problème que vous résolvez': app.problemStatement || app.description || 'Problème non renseigné.',
  'Décrivez votre solution et sa différenciation': app.solution || app.description || 'Solution non renseignée.',
  'Comment avez-vous entendu parler de nous ?': 'LinkedIn',
  "Montant de financement recherché": app.amount || '< 200 000 TND',
  "Qu'attendez-vous de l'incubateur Medianet ?": "Un accompagnement structuré, accès aux investisseurs et un réseau d'experts.",
  'Site web ou lien démo': app.website || 'https://example.com',
  "Modèle économique et sources de revenus envisagés": app.revenueModel || 'Abonnement SaaS + commissions sur transactions.',
  "Secteur d'activité principal": app.sector || 'Autre',
});

// ─── Réponses spécifiques par secteur ────────────────────────────────────────
const SECTOR_ANSWERS = {
  FinTech: (app) => ({
    'Modèle de revenus principal': 'Commission sur transaction',
    'Revenu mensuel récurrent actuel (TND)': '45 000',
    'Conformité réglementaire BCT': 'En cours',
    'Partenariats bancaires existants ou en discussion': 'Discussion en cours avec BNA et Attijari Bank pour l\'intégration API.',
    'Nombre de clients / transactions actifs': '1 200 transactions / mois',
    'Pourquoi rejoindre le programme FinTech Medianet ?': `Nous cherchons à accélérer notre conformité BCT et à accéder au réseau de banques partenaires de Medianet pour déployer ${app.startupName || 'notre solution'} à grande échelle.`,
  }),
  HealthTech: (app) => ({
    'Segment HealthTech': 'Télémédecine',
    'Conformité normes médicales': 'En cours de certification',
    "Nombre d'établissements de santé partenaires ou en pilote": '2 cliniques privées à Tunis',
    "Impact mesurable sur la qualité des soins ou l'accès à la santé": 'Réduction du temps d\'attente de 60% et accès aux soins pour patients ruraux.',
    'Pourquoi rejoindre le programme HealthTech Medianet ?': `${app.startupName || 'Notre startup'} a besoin d\'un accompagnement sur la certification CE et d\'un accès aux hôpitaux partenaires.`,
  }),
  AgriTech: (app) => ({
    'Sous-secteur AgriTech': 'Agriculture de précision / IoT',
    'Région géographique cible (gouvernorat / pays)': 'Béja, Siliana, Jendouba — Tunisie Nord',
    'Nombre d\'agriculteurs / coopératives en pilote ou clients': '3 coopératives, 45 agriculteurs',
    "Impact mesurable : rendement, économie d'eau, réduction pertes post-récolte": 'Économie d\'eau de 35%, augmentation rendement de 22% sur cultures pilotes.',
    'Pourquoi rejoindre le programme AgriTech Medianet ?': `${app.startupName || 'Notre solution'} IoT a besoin d\'un accès aux coopératives partenaires et d\'un financement vert pour déploiement national.`,
  }),
  EdTech: (app) => ({
    'Modèle économique EdTech': 'B2B (établissements scolaires)',
    'Technologie principale utilisée (IA, LMS, VR...)': 'IA adaptative + LMS personnalisé',
    "Public cible (tranche d'âge, niveau scolaire...)": 'Lycéens 15-18 ans, curriculum tunisien',
    "Nombre d'utilisateurs actifs": '850 étudiants actifs, 12 lycées',
    'Impact pédagogique estimé (1 = faible, 10 = transformationnel)': '8',
    'Stratégie de déploiement en Tunisie et expansion MENA': 'Partenariat avec le Ministère de l\'Education, puis expansion Algérie et Maroc en 2027.',
  }),
  CleanTech: (app) => ({
    'Sous-secteur CleanTech': 'Énergie solaire / renouvelable',
    'Impact environnemental quantifiable (CO2 évité, eau économisée...)': '450 tonnes CO2 évitées / an sur les installations pilotes',
    'Certifications environnementales': 'En cours',
    'Nombre de clients / projets pilotes actifs': '4 entreprises industrielles',
    'Pourquoi rejoindre le programme CleanTech Medianet ?': `Accéder aux fonds verts SUNREF et aux partenariats municipaux pour ${app.startupName || 'notre solution'} de transition énergétique.`,
  }),
  FoodTech: (app) => ({
    'Sous-secteur FoodTech': 'Food services / restauration',
    'Nombre de restaurants / clients professionnels partenaires': '28 restaurants partenaires à Tunis',
    'Describe your traction and key milestones to date': '6 mois de pilote, 28 restaurants, 4 200 commandes traitées, taux satisfaction 94%.',
    'Why do you want to join the FoodStart programme ?': `${app.startupName || 'Our startup'} needs access to the FoodStart network of 350+ restaurant partners and the mentoring to scale our B2B model across Tunisia.`,
  }),
  'AI/ML': (app) => ({
    "Type d'IA développée": 'NLP / LLM',
    'Stack technique principal (frameworks, cloud...)': 'PyTorch, Hugging Face, AWS SageMaker, FastAPI',
    'Décrivez votre modèle propriétaire et son avantage compétitif': 'Modèle NLP fine-tuné sur données arabes dialectaux tunisiens, surpasse GPT-4 de 18% sur benchmark Darija.',
    'Métriques de performance du modèle (F1, AUC, précision...)': 'F1-Score: 0.87, Précision: 89%, Recall: 85%',
    'Pourquoi rejoindre le programme AI/ML Medianet ?': `Accéder aux datasets exclusifs partenaires et aux ressources GPU pour accélérer l\'entraînement du modèle de ${app.startupName || 'notre startup'}.`,
  }),
  'Tous secteurs': (app) => ({
    "Secteur d'activité principal": app.sector || 'Autre',
    'Site web ou lien démo': app.website || 'https://example.com',
    "Modèle économique et sources de revenus envisagés": 'Abonnement SaaS mensuel + services professionnels.',
    "Montant de financement recherché": app.amount || '100 000 – 500 000 TND',
    "Qu'attendez-vous de l'incubateur Medianet ?": 'Mentorat, réseau investisseurs et accès aux marchés régionaux.',
  }),
};

const getSectorAnswers = (sector, app) => {
  const fn = SECTOR_ANSWERS[sector];
  if (fn) return fn(app);
  return {};
};

// ─── Construire les réponses complètes d'un candidat ─────────────────────────
function buildResponses(app, programmeSector) {
  const base = BASE_ANSWERS(app);
  const sector = getSectorAnswers(programmeSector || app.sector || 'Tous secteurs', app);
  return { ...base, ...sector };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function seed() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const dbName = MONGO_URI.split('/').pop().split('?')[0];
    const db = client.db(dbName);
    console.log(`\n✅  MongoDB connecté : ${dbName}\n`);

    // 1. Charger tous les programmes
    const programmes = await db.collection('programmes').find({}).toArray();
    const progMap = {};
    programmes.forEach(p => { progMap[p.titre || p.title] = p; });
    console.log(`📋  ${programmes.length} programmes chargés`);

    // 2. Charger toutes les candidatures
    const applications = await db.collection('applications').find({}).toArray();
    console.log(`📦  ${applications.length} candidatures trouvées\n`);

    if (applications.length === 0) {
      console.log('⚠️  Aucune candidature trouvée. Créez d\'abord des candidatures.');
      return;
    }

    let updated = 0, skipped = 0;

    for (const app of applications) {
      // Déterminer le secteur du programme lié
      let programmeSector = app.sector || 'Tous secteurs';
      if (app.programmeName && progMap[app.programmeName]) {
        programmeSector = progMap[app.programmeName].sector || programmeSector;
      }

      // Vérifier si les réponses existent déjà et sont complètes
      const existingResponses = app.formResponses || {};
      const hasResponses = Object.keys(existingResponses).length >= 5;

      if (hasResponses) {
        console.log(`   ⏩  ${(app.startupName || app.companyName || 'N/A').padEnd(25)} — réponses existantes (${Object.keys(existingResponses).length} champs)`);
        skipped++;
        continue;
      }

      // Construire les réponses
      const formResponses = buildResponses(app, programmeSector);

      // Mettre à jour la candidature
      await db.collection('applications').updateOne(
        { _id: app._id },
        {
          $set: {
            formResponses,
            formResponsesCompletedAt: new Date(),
            updatedAt: new Date(),
          }
        }
      );

      const name = (app.startupName || app.companyName || 'N/A').padEnd(25);
      const prog = (app.programmeName || 'Spontanée').padEnd(30);
      console.log(`   ✅  ${name} — ${prog} — ${Object.keys(formResponses).length} réponses ajoutées`);
      updated++;
    }

    // 3. Vérifier aussi dans la collection formresponses (si elle existe)
    const formResponsesCol = db.listCollections({ name: 'formresponses' });
    const frExists = await formResponsesCol.hasNext();
    
    if (frExists) {
      console.log('\n📊  Vérification collection formresponses...');
      let linkedCount = 0;
      
      for (const app of applications) {
        const startupName = app.startupName || app.companyName;
        const email = app.email || app.founderEmail;
        
        if (!email && !startupName) continue;
        
        const existing = await db.collection('formresponses').findOne({
          $or: [
            { email: email },
            { company: startupName },
          ].filter(Boolean)
        });
        
        if (!existing && email) {
          // Créer une entrée dans formresponses également
          const programmeSector = app.sector || 'Tous secteurs';
          const answers = buildResponses(app, programmeSector);
          
          await db.collection('formresponses').insertOne({
            _seededByScript: true,
            formId: null, // sera lié au bon formulaire si possible
            respondent: app.founder || app.founderName || startupName,
            email: email,
            company: startupName,
            sector: app.sector,
            status: app.status,
            amount: app.amount,
            answers,
            applicationId: app._id,
            programmeName: app.programmeName,
            submittedAt: app.submittedAt || app.appliedAt || new Date(),
            createdAt: new Date(),
          });
          linkedCount++;
        }
      }
      
      if (linkedCount > 0) {
        console.log(`   ✅  ${linkedCount} entrées créées dans formresponses`);
      }
    }

    // ─── Résumé ─────────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════════════════════════');
    console.log('  RÉSUMÉ');
    console.log('══════════════════════════════════════════════════════════════════');
    console.log(`  ✅  Candidatures mises à jour   : ${updated}`);
    console.log(`  ⏩  Candidatures ignorées       : ${skipped} (réponses déjà présentes)`);
    console.log(`  📊  Total traité                : ${applications.length}`);
    console.log('══════════════════════════════════════════════════════════════════');
    console.log('\n  💡  Les réponses sont maintenant disponibles dans :');
    console.log('       • Espace admin → Candidature → onglet Formulaires');
    console.log('       • Espace jury  → Candidature → section Réponses au formulaire');
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