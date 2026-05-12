// scripts/seedBesoinsAndFixes.js
// Seed besoins (needs) for accepted startups + fix status to 'accepted'
// Usage: node scripts/seedBesoinsAndFixes.js

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/medianet_db';

// ─── Besoins par secteur ─────────────────────────────────────────────────────
const BESOINS_PAR_SECTEUR = {
  FinTech: [
    {
      category: 'financier',
      priority: 'critique',
      title: 'Accès financement Seed Round (200k-500k TND)',
      description:
        'Besoin urgent de capital pour accélérer le développement produit et l\'acquisition client. Ciblons les VCs spécialisés FinTech MENA.',
      status: 'ouvert',
      tags: ['financement', 'seed', 'VC'],
    },
    {
      category: 'legal',
      priority: 'haute',
      title: 'Conformité réglementaire BCT et licences paiement',
      description:
        'Obtenir la licence Établissement de Paiement auprès de la Banque Centrale de Tunisie. Accompagnement juridique spécialisé fintech requis.',
      status: 'en_cours',
      tags: ['BCT', 'régulation', 'licence'],
    },
    {
      category: 'technique',
      priority: 'haute',
      title: 'Intégration APIs bancaires (Attijari, BIAT, STB)',
      description:
        'Développement des connecteurs API pour les 3 principales banques tunisiennes. Besoin d\'un développeur backend senior spécialisé fintech.',
      status: 'ouvert',
      tags: ['API', 'intégration', 'banque'],
    },
    {
      category: 'commercial',
      priority: 'moyenne',
      title: 'Développement réseau de commerçants partenaires',
      description:
        'Acquisition de 500 commerçants actifs d\'ici Q3 2026. Besoin d\'une force de vente terrain et d\'un programme de fidélisation.',
      status: 'en_cours',
      tags: ['sales', 'B2B', 'partenariat'],
    },
    {
      category: 'rh',
      priority: 'moyenne',
      title: 'Recrutement CTO / Lead Developer',
      description:
        'Profil recherché : 5+ ans expérience systèmes de paiement, maîtrise Node.js / microservices. Budget 3500-5000 TND/mois.',
      status: 'ouvert',
      tags: ['recrutement', 'tech', 'CTO'],
    },
  ],

  HealthTech: [
    {
      category: 'legal',
      priority: 'critique',
      title: 'Certification et conformité dispositifs médicaux',
      description:
        'Obtention des certifications sanitaires ANCSEP et homologation Ministère de la Santé pour opérer la plateforme télémédicine.',
      status: 'en_cours',
      tags: ['certification', 'santé', 'réglementation'],
    },
    {
      category: 'financier',
      priority: 'critique',
      title: 'Levée de fonds Série A (500k-1.5M TND)',
      description:
        'Financement pour expansion nationale et recrutement équipe médicale. Ciblage des fonds spécialisés HealthTech Afrique.',
      status: 'ouvert',
      tags: ['financement', 'série A', 'expansion'],
    },
    {
      category: 'partenariat',
      priority: 'haute',
      title: 'Partenariats avec hôpitaux publics et cliniques privées',
      description:
        'Développer des accords de partenariat avec au moins 5 établissements de santé en Tunisie pour intégration plateforme.',
      status: 'ouvert',
      tags: ['hôpital', 'clinique', 'B2B'],
    },
    {
      category: 'technique',
      priority: 'haute',
      title: 'Infrastructure RGPD et sécurité données médicales',
      description:
        'Mise en conformité RGPD, chiffrement bout-en-bout des dossiers patients, audit de sécurité indépendant.',
      status: 'en_cours',
      tags: ['RGPD', 'cybersécurité', 'données médicales'],
    },
    {
      category: 'marketing',
      priority: 'moyenne',
      title: 'Acquisition médecins et spécialistes (objectif: 500 médecins)',
      description:
        'Programme d\'onboarding médecins avec démo gratuite 3 mois. Ciblage spécialistes via Ordre des Médecins de Tunisie.',
      status: 'ouvert',
      tags: ['acquisition', 'médecins', 'growth'],
    },
  ],

  AgriTech: [
    {
      category: 'technique',
      priority: 'critique',
      title: 'Développement capteurs IoT adaptés climat tunisien',
      description:
        'R&D capteurs humidité/température résistants chaleur extrême (45°C+). Partenariat avec écoles d\'ingénieurs pour prototype V2.',
      status: 'en_cours',
      tags: ['IoT', 'hardware', 'R&D'],
    },
    {
      category: 'partenariat',
      priority: 'haute',
      title: 'Accord-cadre Ministère de l\'Agriculture Tunisie',
      description:
        'Convention avec le Ministère pour déploiement pilote national sur 1000 exploitations. Accès au réseau des coopératives agricoles.',
      status: 'ouvert',
      tags: ['gouvernement', 'pilote', 'agriculture'],
    },
    {
      category: 'financier',
      priority: 'haute',
      title: 'Accès fonds FIPA et aides secteur agricole',
      description:
        'Dossier de demande de subvention auprès du Fonds d\'Investissement et de Promotion Agricole. Accompagnement conseil spécialisé.',
      status: 'ouvert',
      tags: ['subvention', 'FIPA', 'aide publique'],
    },
    {
      category: 'commercial',
      priority: 'moyenne',
      title: 'Réseau de distribution via coopératives agricoles',
      description:
        'Ciblage des 200 coopératives agricoles pour distribution capteurs. Programme de formation agriculteurs à la solution digitale.',
      status: 'ouvert',
      tags: ['distribution', 'coopératives', 'formation'],
    },
    {
      category: 'rh',
      priority: 'faible',
      title: 'Recrutement agronome data scientist',
      description:
        'Profil rare : agronome avec compétences data science et ML pour améliorer les algorithmes de recommandation d\'irrigation.',
      status: 'ouvert',
      tags: ['recrutement', 'data science', 'agronomie'],
    },
  ],

  EdTech: [
    {
      category: 'partenariat',
      priority: 'critique',
      title: 'Homologation contenu par Ministère de l\'Éducation',
      description:
        'Alignement officiel du contenu sur le curriculum national tunisien. Convention MEN pour déploiement dans établissements publics.',
      status: 'en_cours',
      tags: ['MEN', 'curriculum', 'homologation'],
    },
    {
      category: 'technique',
      priority: 'haute',
      title: 'IA adaptative pour personnalisation apprentissage',
      description:
        'Développement moteur de recommandation basé ML pour adapter les parcours selon le profil de chaque élève. Dataset labellisé requis.',
      status: 'en_cours',
      tags: ['IA', 'ML', 'personnalisation'],
    },
    {
      category: 'financier',
      priority: 'haute',
      title: 'Financement Seed pour expansion MENA (100k-300k TND)',
      description:
        'Capital requis pour localisation contenu (Algérie, Maroc) et marketing digital. Ciblage investisseurs EdTech impact.',
      status: 'ouvert',
      tags: ['seed', 'expansion', 'MENA'],
    },
    {
      category: 'marketing',
      priority: 'moyenne',
      title: 'Stratégie acquisition parents et établissements scolaires',
      description:
        'Programme ambassadeurs étudiants, partenariats avec associations de parents d\'élèves, présence salons éducation.',
      status: 'ouvert',
      tags: ['B2C', 'B2B', 'acquisition'],
    },
    {
      category: 'commercial',
      priority: 'moyenne',
      title: 'Développement offre B2B pour lycées privés',
      description:
        'Package licensing pour établissements privés (abonnement annuel par classe). Ciblage 50 lycées privés tunisiens en priorité.',
      status: 'ouvert',
      tags: ['B2B', 'licences', 'établissements'],
    },
  ],

  CleanTech: [
    {
      category: 'financier',
      priority: 'critique',
      title: 'Financement Green Bond ou dette verte (500k+ TND)',
      description:
        'Accès aux instruments de financement vert (BERD, AFD, BEI) pour financer le parc d\'équipements solaires. Dossier ESG requis.',
      status: 'ouvert',
      tags: ['green bond', 'BERD', 'financement vert'],
    },
    {
      category: 'legal',
      priority: 'haute',
      title: 'Cadre réglementaire PPA et licences STEG',
      description:
        'Obtention des agréments STEG pour les contrats Power Purchase Agreement. Accompagnement juridique spécialisé énergie.',
      status: 'en_cours',
      tags: ['STEG', 'PPA', 'licence énergie'],
    },
    {
      category: 'partenariat',
      priority: 'haute',
      title: 'Partenariat fournisseurs panneaux et équipements',
      description:
        'Négociation accords-cadres avec fabricants panneaux solaires pour tarifs préférentiels. Ciblage Huawei, LONGi, JinkoSolar.',
      status: 'ouvert',
      tags: ['fournisseurs', 'panneaux', 'tarif'],
    },
    {
      category: 'technique',
      priority: 'moyenne',
      title: 'Plateforme monitoring IoT production solaire',
      description:
        'Dashboard temps réel pour suivi production kWc, ROI client, alertes maintenance. Développement application mobile propriétaire.',
      status: 'en_cours',
      tags: ['IoT', 'monitoring', 'dashboard'],
    },
    {
      category: 'commercial',
      priority: 'moyenne',
      title: 'Pipeline PME industrielles ciblées (50 prospects qualifiés)',
      description:
        'Construction base de données PME avec facture STEG >2000 TND/mois. Campagne cold outreach et salon Industry Tunisia.',
      status: 'ouvert',
      tags: ['PME', 'prospection', 'B2B'],
    },
  ],

  Logistics: [
    {
      category: 'technique',
      priority: 'haute',
      title: 'Système tracking GPS temps réel multi-transporteurs',
      description:
        'Intégration APIs de 5 transporteurs locaux (Aramex, Chronopost, Tunisie Express...) dans une plateforme unifiée de suivi.',
      status: 'en_cours',
      tags: ['GPS', 'tracking', 'API'],
    },
    {
      category: 'partenariat',
      priority: 'haute',
      title: 'Partenariats transporteurs premium et e-commerçants',
      description:
        'Négociation accords exclusifs avec top 3 transporteurs tunisiens. Programme d\'intégration pour e-commerçants à fort volume.',
      status: 'ouvert',
      tags: ['transporteur', 'e-commerce', 'B2B'],
    },
    {
      category: 'financier',
      priority: 'critique',
      title: 'Série A pour expansion régionale (MENA)',
      description:
        'Levée 1-2M TND pour couvrir Libye, Algérie et Maroc. Développement réseau d\'entrepôts cross-border et équipes locales.',
      status: 'ouvert',
      tags: ['série A', 'expansion', 'MENA'],
    },
    {
      category: 'commercial',
      priority: 'moyenne',
      title: 'Acquisition grands comptes e-commerce (Jumia, Mytek)',
      description:
        'Développement offre enterprise pour marketplaces majeurs. Tarification volume et SLAs garantis pour >1000 colis/jour.',
      status: 'ouvert',
      tags: ['grands comptes', 'enterprise', 'volume'],
    },
    {
      category: 'rh',
      priority: 'faible',
      title: 'Recrutement responsable expansion internationale',
      description:
        'Profil bilingue arabe/français, expérience logistique cross-border MENA. Gestion des opérations dans 3 pays.',
      status: 'ouvert',
      tags: ['recrutement', 'international', 'logistique'],
    },
  ],

  SaaS: [
    {
      category: 'commercial',
      priority: 'critique',
      title: 'Stratégie Go-to-Market et premiers 100 clients',
      description:
        'Définition ICP (Ideal Customer Profile), pipeline de vente structuré, onboarding automatisé. Objectif MRR 50k TND en 6 mois.',
      status: 'ouvert',
      tags: ['GTM', 'sales', 'MRR'],
    },
    {
      category: 'technique',
      priority: 'haute',
      title: 'Scalabilité infrastructure cloud (AWS / Azure)',
      description:
        'Migration vers architecture microservices, auto-scaling, monitoring Datadog. Préparation à 10x la charge actuelle.',
      status: 'en_cours',
      tags: ['cloud', 'scalabilité', 'infrastructure'],
    },
    {
      category: 'financier',
      priority: 'haute',
      title: 'Financement BFR et croissance commerciale',
      description:
        'Besoin de trésorerie pour financer l\'équipe commerciale et les coûts d\'acquisition avant atteinte du break-even.',
      status: 'ouvert',
      tags: ['BFR', 'financement', 'bridge'],
    },
  ],

  'E-commerce': [
    {
      category: 'technique',
      priority: 'haute',
      title: 'Intégration paiement (Flouci, Paymee, Paiement à la livraison)',
      description:
        'Intégration native des principales solutions de paiement tunisiennes. Réduction friction checkout pour augmenter conversion.',
      status: 'en_cours',
      tags: ['paiement', 'checkout', 'conversion'],
    },
    {
      category: 'partenariat',
      priority: 'haute',
      title: 'Partenariats livraison (Aramex, Tunisie Express)',
      description:
        'Accords préférentiels avec 3 transporteurs pour tarifs réduits. API tracking intégré, réclamations automatisées.',
      status: 'ouvert',
      tags: ['livraison', 'logistique', 'partenariat'],
    },
    {
      category: 'commercial',
      priority: 'critique',
      title: 'Acquisition marchands (objectif 10 000 boutiques actives)',
      description:
        'Campagne digitale ciblée commerçants Facebook, partenariats avec associations professionnelles, offre freemium.',
      status: 'en_cours',
      tags: ['marchands', 'acquisition', 'freemium'],
    },
    {
      category: 'marketing',
      priority: 'moyenne',
      title: 'Stratégie SEO et contenu en arabe tunisien',
      description:
        'Production de contenu éducatif pour commerçants (tutoriels, webinaires). Optimisation pour recherches en dialecte tunisien.',
      status: 'ouvert',
      tags: ['SEO', 'contenu', 'arabe'],
    },
  ],

  'AI/ML': [
    {
      category: 'technique',
      priority: 'critique',
      title: 'Constitution dataset labellisé marché tunisien/africain',
      description:
        'Collecte et annotation de 50k+ exemples de données locales pour fine-tuning modèles IA. Partenariat université requis.',
      status: 'en_cours',
      tags: ['dataset', 'annotation', 'fine-tuning'],
    },
    {
      category: 'financier',
      priority: 'haute',
      title: 'Accès GPU computing et infrastructure ML',
      description:
        'Financement infrastructure cloud GPU (AWS SageMaker, Google Cloud AI). Budget estimé 15-30k TND/mois en phase d\'entraînement.',
      status: 'ouvert',
      tags: ['GPU', 'cloud', 'infrastructure ML'],
    },
    {
      category: 'rh',
      priority: 'haute',
      title: 'Recrutement ML Engineers et Data Scientists',
      description:
        'Profils : PhD ou Bac+5 ML, expérience NLP/Computer Vision. Marché très concurrentiel - politique de rémunération attractive.',
      status: 'ouvert',
      tags: ['ML engineer', 'data scientist', 'recrutement'],
    },
  ],
};

// Besoins génériques si secteur non mappé
const BESOINS_GENERIQUES = [
  {
    category: 'financier',
    priority: 'haute',
    title: 'Accès au financement (Seed / Série A)',
    description:
      'Identification et approche d\'investisseurs alignés avec le secteur et le stade de développement de la startup.',
    status: 'ouvert',
    tags: ['financement', 'investisseurs'],
  },
  {
    category: 'commercial',
    priority: 'critique',
    title: 'Développement commercial et acquisition clients',
    description:
      'Structuration du pipeline de vente, identification des canaux d\'acquisition prioritaires, recrutement commercial.',
    status: 'en_cours',
    tags: ['sales', 'acquisition', 'pipeline'],
  },
  {
    category: 'technique',
    priority: 'haute',
    title: 'Scalabilité technique et architecture produit',
    description:
      'Audit architecture, plan de montée en charge, dette technique à résorber pour accueillir la croissance.',
    status: 'ouvert',
    tags: ['technique', 'scalabilité', 'architecture'],
  },
  {
    category: 'rh',
    priority: 'moyenne',
    title: 'Recrutement équipe clé (Tech / Commercial)',
    description:
      'Définition des postes prioritaires, job descriptions, sourcing candidats, politique de rémunération compétitive.',
    status: 'ouvert',
    tags: ['recrutement', 'équipe', 'RH'],
  },
  {
    category: 'marketing',
    priority: 'moyenne',
    title: 'Stratégie marketing et notoriété de marque',
    description:
      'Définition de la proposition de valeur, identité visuelle, stratégie content marketing et présence digitale.',
    status: 'ouvert',
    tags: ['marketing', 'branding', 'digital'],
  },
];

// ─── Sessions historique par stade ────────────────────────────────────────────
function buildSessionHistory(startup, mentorNames) {
  const stages = {
    prototype: ['onboarding'],
    mvp: ['onboarding', 'ideation'],
    early_traction: ['onboarding', 'ideation', 'development'],
    scaling: ['onboarding', 'ideation', 'development', 'gtm'],
    graduated: ['onboarding', 'ideation', 'development', 'gtm', 'fundraising'],
  };
  const phasesDone = stages[startup.stage] || ['onboarding'];

  const sessionTemplates = [
    {
      phase: 'onboarding',
      sessions: [
        {
          type: 'workshop',
          title: 'Session Onboarding — Présentation programme',
          domain: 'Opérations',
          duration: 180,
          isOnline: false,
          location: 'Incubateur MEDIANET, Lac 2, Tunis — Grande Salle',
          daysAgo: 90,
          outcome: 'Présentation complète du programme, outils collaboration, règlement intérieur. Objectifs définis.',
          notes: 'Startup bien préparée, fondateur motivé.',
        },
        {
          type: 'mentoring',
          title: 'Session mentorat — Cadrage stratégique initial',
          domain: 'Stratégie',
          duration: 60,
          isOnline: true,
          daysAgo: 85,
          outcome: 'Vision produit alignée, premières priorités définies.',
          notes: 'Focus sur validation problem/solution fit.',
        },
      ],
    },
    {
      phase: 'ideation',
      sessions: [
        {
          type: 'workshop',
          title: 'Workshop — Business Model Canvas & Value Proposition',
          domain: 'Stratégie',
          duration: 120,
          isOnline: true,
          daysAgo: 75,
          outcome: 'Business Model Canvas complété, ICP défini, canaux de distribution identifiés.',
          notes: 'Modèle économique solide pour le secteur.',
        },
        {
          type: 'mentoring',
          title: 'Session mentorat — Validation marché et interviews clients',
          domain: 'Commercial',
          duration: 60,
          isOnline: true,
          daysAgo: 65,
          outcome: '20 interviews clients planifiées, grille d\'entretien préparée.',
          notes: 'Approche lean startup bien assimilée.',
        },
      ],
    },
    {
      phase: 'development',
      sessions: [
        {
          type: 'formation',
          title: 'Formation — Architecture technique et scalabilité produit',
          domain: 'Technologie',
          duration: 180,
          isOnline: true,
          daysAgo: 55,
          outcome: 'Architecture microservices définie, roadmap produit sur 6 mois établie.',
          notes: 'Équipe technique compétente, bonne progression.',
        },
        {
          type: 'mentoring',
          title: 'Revue mensuelle KPIs — Suivi progression',
          domain: 'Finance',
          duration: 60,
          isOnline: true,
          daysAgo: 45,
          outcome: 'KPIs suivis : MRR, CAC, LTV, churn. Actions correctives définies.',
          notes: 'Bonne maîtrise des métriques.',
        },
      ],
    },
    {
      phase: 'gtm',
      sessions: [
        {
          type: 'workshop',
          title: 'Masterclass — Growth Hacking & Acquisition clients',
          domain: 'Marketing',
          duration: 240,
          isOnline: true,
          daysAgo: 35,
          outcome: 'Stratégie acquisition multicanal définie, budget marketing alloué, premières campagnes lancées.',
          notes: 'Startup prête pour accélération commerciale.',
        },
        {
          type: 'pitch',
          title: 'Pitch Clinic — Préparation investisseurs',
          domain: 'Fundraising',
          duration: 120,
          isOnline: false,
          location: 'Incubateur MEDIANET — Salle Pitch',
          daysAgo: 25,
          outcome: 'Pitch deck finalisé, storytelling amélioré, Q&A préparé pour les questions difficiles.',
          notes: 'Pitch convaincant, équipe prête pour les meetings investisseurs.',
        },
      ],
    },
    {
      phase: 'fundraising',
      sessions: [
        {
          type: 'conference',
          title: 'Conférence — Due Diligence et négociation term sheet',
          domain: 'Fundraising',
          duration: 150,
          isOnline: true,
          daysAgo: 15,
          outcome: 'Process due diligence maîtrisé, data room préparée, term sheet négocié.',
          notes: 'Startup en bonne position pour closing.',
        },
        {
          type: 'mentoring',
          title: 'Session stratégie cap table et closing investisseurs',
          domain: 'Finance',
          duration: 90,
          isOnline: true,
          daysAgo: 8,
          outcome: 'Cap table structuré, ESOP défini, conditions closing négociées.',
          notes: 'Accompagnement juridique recommandé pour la phase de closing.',
        },
      ],
    },
  ];

  const history = [];
  const now = new Date();

  for (const phase of phasesDone) {
    const template = sessionTemplates.find((t) => t.phase === phase);
    if (!template) continue;

    for (const s of template.sessions) {
      const sessionDate = new Date(now);
      sessionDate.setDate(sessionDate.getDate() - s.daysAgo);

      const participants = [];
      if (mentorNames && mentorNames.length > 0) {
        participants.push(mentorNames[0]);
      }

      history.push({
        _id: new ObjectId(),
        type: s.type,
        title: s.title,
        domain: s.domain,
        description: s.outcome,
        date: sessionDate,
        time: '10:00',
        duration: s.duration,
        isOnline: s.isOnline !== false,
        location: s.location || '',
        meetLink: s.isOnline !== false ? 'https://meet.google.com/session-archive' : '',
        status: 'done',
        notes: s.notes,
        outcome: s.outcome,
        participants: participants.join(', '),
        createdAt: sessionDate,
        updatedAt: sessionDate,
      });
    }
  }

  return history;
}

// ─── Formations historique ────────────────────────────────────────────────────
function buildFormationsHistory(startup) {
  const now = new Date();
  const formations = [
    {
      type: 'onboarding_formation',
      title: 'Formulaire Onboarding — Évaluation initiale',
      deadline: new Date(now.getTime() - 80 * 86400000).toISOString(),
      description: 'Évaluation initiale de la startup : état actuel, objectifs, besoins prioritaires.',
      status: 'completed',
      responses: 1,
      total: 1,
      sentAt: new Date(now.getTime() - 90 * 86400000).toISOString(),
    },
    {
      type: 'monthly_report',
      title: 'Rapport Mensuel — ' + new Date(now.getTime() - 60 * 86400000).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      deadline: new Date(now.getTime() - 55 * 86400000).toISOString(),
      description: 'Bilan mensuel : MRR, nouveaux clients, blocages, priorités.',
      status: 'completed',
      responses: 1,
      total: 1,
      sentAt: new Date(now.getTime() - 65 * 86400000).toISOString(),
    },
    {
      type: 'kpi_update',
      title: 'Mise à jour KPIs Q1 2026',
      deadline: new Date(now.getTime() - 30 * 86400000).toISOString(),
      description: 'Bilan trimestriel des indicateurs clés de performance.',
      status: startup.stage !== 'prototype' ? 'completed' : 'active',
      responses: startup.stage !== 'prototype' ? 1 : 0,
      total: 1,
      sentAt: new Date(now.getTime() - 35 * 86400000).toISOString(),
    },
  ];

  if (['early_traction', 'scaling', 'graduated'].includes(startup.stage)) {
    formations.push({
      type: 'investor_readiness',
      title: 'Investor Readiness — Évaluation préparation levée',
      deadline: new Date(now.getTime() - 10 * 86400000).toISOString(),
      description: 'Évaluation de la maturité investisseur : pitch deck, data room, cap table, KPIs.',
      status: 'active',
      responses: 0,
      total: 1,
      sentAt: new Date(now.getTime() - 15 * 86400000).toISOString(),
    });
  }

  return formations;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function seed() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const dbName = MONGO_URI.split('/').pop().split('?')[0];
    const db = client.db(dbName);
    console.log(`\n✅ MongoDB connecté : ${dbName}\n`);

    // ── 1. Récupérer les startups acceptées ──────────────────────────────────
    const acceptedStartups = await db.collection('applications').find({
      status: { $in: ['accepted', 'approved'] },
    }).toArray();

    console.log(`📋 ${acceptedStartups.length} startups acceptées trouvées\n`);

    if (acceptedStartups.length === 0) {
      console.log('⚠️  Aucune startup acceptée. Lance seedComplete.js ou seedAllData.js d\'abord.');
      process.exit(0);
    }

    // ── 2. Récupérer les mentors disponibles ────────────────────────────────
    const mentors = await db.collection('users').find({ role: 'mentor', isActive: true }).toArray();
    const mentorNames = mentors.map((m) => m.name);
    console.log(`👥 ${mentors.length} mentors trouvés\n`);

    let updated = 0;
    let errors = 0;

    for (const startup of acceptedStartups) {
      const name = startup.project?.startupName || startup.startupName || '?';
      const sector = startup.project?.sector || startup.sector || 'SaaS';

      try {
        // ── Récupérer les besoins pour ce secteur ──────────────────────────
        const besoinsSecteur = BESOINS_PAR_SECTEUR[sector] || BESOINS_GENERIQUES;

        // Construire la liste des besoins avec IDs et dates
        const besoins = besoinsSecteur.map((b, idx) => ({
          _id: new ObjectId(),
          ...b,
          createdAt: new Date(Date.now() - (30 - idx * 3) * 86400000),
          updatedAt: new Date(),
        }));

        // ── Construire l'historique des sessions ─────────────────────────
        const stageInfo = {
          stage: startup.project?.stage || startup.stage || 'mvp',
        };
        const sessionHistory = buildSessionHistory(stageInfo, mentorNames);
        const formationsHistory = buildFormationsHistory(stageInfo);

        // ── Mettre à jour l'application ─────────────────────────────────
        const updateResult = await db.collection('applications').updateOne(
          { _id: startup._id },
          {
            $set: {
              // Besoins identifiés (base pour le matching IA)
              besoins,

              // Historique sessions intégré dans l'application
              sessionHistory,

              // Formations spécifiques à la startup
              startupFormations: formationsHistory,

              // S'assurer que le statut est bien 'accepted'
              status: 'accepted',

              // Champs requis pour le matching IA
              'matching.status': startup.matching?.status || 'pending',

              updatedAt: new Date(),
            },
          }
        );

        if (updateResult.modifiedCount > 0) {
          updated++;
          console.log(`  ✅ ${name.padEnd(20)} | ${sector.padEnd(12)} | ${besoins.length} besoins | ${sessionHistory.length} sessions`);
        } else {
          console.log(`  ⏭  ${name.padEnd(20)} | Déjà à jour`);
        }

      } catch (err) {
        errors++;
        console.error(`  ❌ ${name} : ${err.message}`);
      }
    }

    // ── 3. Créer des sessions globales dans la collection sessions ──────────
    console.log('\n── Création sessions globales dans collection sessions ──');

    const globalSessions = [
      {
        _id: new ObjectId(),
        type: 'workshop',
        title: 'Workshop — Financial Modelling & Unit Economics',
        domain: 'Finance',
        description: 'Construction du modèle financier sur 3 ans : P&L, cash burn, unit economics.',
        date: new Date(Date.now() - 45 * 86400000),
        time: '10:00',
        duration: 180,
        isOnline: false,
        location: 'Incubateur MEDIANET, Lac 2, Tunis — Salle Innovation B',
        capacity: 20,
        enrolled: 14,
        status: 'done',
        targetMode: 'all',
        selectedProgrammes: [],
        selectedStartups: acceptedStartups.slice(0, 5).map((s) => s._id),
        speakers: [{ name: 'Amira Hamdani', email: 'a.hamdani@finlab.tn', role: 'CFO Advisor' }],
        createdBy: 'admin',
        createdByRole: 'admin',
        notifyStartup: true,
        notifyMentor: true,
        createdAt: new Date(Date.now() - 50 * 86400000),
        updatedAt: new Date(Date.now() - 45 * 86400000),
      },
      {
        _id: new ObjectId(),
        type: 'pitch',
        title: 'Pitch Clinic — Panel Investisseurs Seed',
        domain: 'Fundraising',
        description: '8 min pitch + 12 min Q&R par startup face à un panel de 3 investisseurs.',
        date: new Date(Date.now() - 20 * 86400000),
        time: '14:00',
        duration: 120,
        isOnline: true,
        meetLink: 'https://meet.google.com/pitch-clinic-archive',
        capacity: 12,
        enrolled: acceptedStartups.length,
        status: 'done',
        targetMode: 'all',
        selectedProgrammes: [],
        selectedStartups: acceptedStartups.map((s) => s._id),
        speakers: [
          { name: 'Karim Oueslati', email: 'k.oueslati@sawari.com', role: 'Venture Capital' },
          { name: 'Samia Belhadj', email: 's.belhadj@africinvest.com', role: 'Investisseur' },
        ],
        createdBy: 'admin',
        createdByRole: 'admin',
        notifyStartup: true,
        notifyMentor: true,
        createdAt: new Date(Date.now() - 25 * 86400000),
        updatedAt: new Date(Date.now() - 20 * 86400000),
      },
      {
        _id: new ObjectId(),
        type: 'formation',
        title: 'Growth Hacking Masterclass — Acquisition & Rétention',
        domain: 'Marketing',
        description: 'Acquisition organique, paid media, SEO, lifecycle marketing et boucles de rétention.',
        date: new Date(Date.now() + 18 * 86400000),
        time: '09:30',
        duration: 240,
        isOnline: true,
        meetLink: 'https://meet.google.com/growth-masterclass-2026',
        capacity: 35,
        enrolled: acceptedStartups.length,
        status: 'upcoming',
        targetMode: 'all',
        selectedProgrammes: [],
        selectedStartups: acceptedStartups.map((s) => s._id),
        speakers: [{ name: 'Rania Souissi', email: 'r.souissi@growthlab.tn', role: 'Growth Lead' }],
        createdBy: 'admin',
        createdByRole: 'admin',
        notifyStartup: true,
        notifyMentor: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        type: 'conference',
        title: 'Fundraising Strategy — Seed to Series A',
        domain: 'Fundraising',
        description: 'Valorisation, construction data room, stratégie de closing investisseurs.',
        date: new Date(Date.now() + 30 * 86400000),
        time: '15:00',
        duration: 150,
        isOnline: true,
        meetLink: 'https://meet.google.com/fundraising-series-a',
        capacity: 60,
        enrolled: acceptedStartups.length,
        status: 'upcoming',
        targetMode: 'all',
        selectedProgrammes: [],
        selectedStartups: acceptedStartups.map((s) => s._id),
        speakers: [
          { name: 'Karim Oueslati', email: 'k.oueslati@sawari.com', role: 'Venture Capital' },
          { name: 'David Nkosi', email: 'd.nkosi@partech.vc', role: 'Partner' },
        ],
        createdBy: 'admin',
        createdByRole: 'admin',
        notifyStartup: true,
        notifyMentor: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('sessions').insertMany(globalSessions);
    console.log(`✅ ${globalSessions.length} sessions globales créées\n`);

    // ── 4. Fix: s'assurer que tous les documents ont le bon format ──────────
    console.log('── Correction format documents (string → objet normalisé) ──');
    const appsWithDocs = await db.collection('applications').find({
      documents: { $exists: true, $ne: [] },
    }).toArray();

    let docsFixed = 0;
    for (const app of appsWithDocs) {
      const docs = app.documents || [];
      const needsFix = docs.some((d) => typeof d === 'string');

      if (needsFix) {
        const fixedDocs = docs.map((d) => {
          if (typeof d === 'string') {
            return {
              name: d,
              docType: d.includes('business_plan') ? 'businessPlan'
                : d.includes('pitch') ? 'pitchDeck'
                : d.includes('financials') ? 'financials'
                : 'other',
              filename: d,
              url: `/uploads/${d}`,
              uploadedAt: new Date(),
              status: 'approved',
            };
          }
          return d;
        });

        await db.collection('applications').updateOne(
          { _id: app._id },
          { $set: { documents: fixedDocs } }
        );
        docsFixed++;
      }
    }
    console.log(`✅ ${docsFixed} applications avec documents corrigés\n`);

    // ── Résumé ──────────────────────────────────────────────────────────────
    console.log('══════════════════════════════════════════════════════════════');
    console.log('RÉSUMÉ');
    console.log('══════════════════════════════════════════════════════════════');
    console.log(`  ✅ Startups mises à jour    : ${updated}`);
    console.log(`  ❌ Erreurs                  : ${errors}`);
    console.log(`  📋 Sessions globales créées : ${globalSessions.length}`);
    console.log(`  📄 Documents corrigés       : ${docsFixed}`);
    console.log('\n  → Lancez maintenant : node scripts/matchAllExisting.js');
    console.log('══════════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('\n❌ ERREUR :', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 MongoDB déconnecté.');
    process.exit(0);
  }
}

seed();