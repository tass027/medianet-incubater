// scripts/seedComplete.js
// Seed COMPLET et COHÉRENT : programmes, forms, applications, formResponses, jury, evaluations
// ✅ ENRICHI : champs imbriqués project/team/economy + formResponses détaillés par secteur
// pour scoring IA basé sur les vraies réponses de candidature
//
// Usage : node scripts/seedComplete.js

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medianet_db';

// ─── HELPERS ────────────────────────────────────────────────────
const rnd    = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pastDate = (daysAgo) => new Date(Date.now() - daysAgo * 86400000);

// ════════════════════════════════════════════════════════════════
// 1. PROGRAMMES
// ════════════════════════════════════════════════════════════════
const buildProgrammes = () => [
  {
    _id: new ObjectId(),
    titre: 'Programme FinTech 2026',
    description: 'Accélération de startups dans le domaine de la finance digitale, paiements mobiles et inclusion financière.',
    sector: 'FinTech', status: 'published',
    dateDebut: new Date('2026-04-01'), dateFin: new Date('2026-06-30'),
    quota: 10,
    jury: ['Karim Ghorbel', 'Omar Trabelsi'],
    objectives: ['Accompagner 10 startups FinTech à fort potentiel', 'Favoriser les partenariats bancaires'],
    criteria: ['Innovation technologique démontrée', 'Modèle économique viable', 'Équipe complémentaire'],
    createdAt: new Date('2026-02-15'), updatedAt: new Date(),
  },
  {
    _id: new ObjectId(),
    titre: 'Programme EdTech 2026',
    description: "Programme dédié aux solutions innovantes dans l'éducation, formation en ligne et compétences numériques.",
    sector: 'EdTech', status: 'published',
    dateDebut: new Date('2026-04-15'), dateFin: new Date('2026-07-15'),
    quota: 8,
    jury: ['Sonia Mrad'],
    objectives: ['Accompagner 8 startups EdTech', 'Démocratiser accès au savoir en Tunisie'],
    criteria: ['Impact pédagogique mesurable', 'Scalabilité sur marché MENA'],
    createdAt: new Date('2026-02-20'), updatedAt: new Date(),
  },
  {
    _id: new ObjectId(),
    titre: 'Programme AgriTech 2026',
    description: "Soutien aux startups transformant l'agriculture africaine grâce au digital, IoT et data.",
    sector: 'AgriTech', status: 'draft',
    dateDebut: new Date('2026-05-01'), dateFin: new Date('2026-08-31'),
    quota: 6,
    jury: ['Yassine Ben Salah'],
    scheduledPublish: new Date('2026-04-10'),
    objectives: [], criteria: [],
    createdAt: new Date('2026-03-01'), updatedAt: new Date(),
  },
  {
    _id: new ObjectId(),
    titre: 'Programme CleanTech 2026',
    description: 'Accélération de solutions durables : énergie renouvelable, gestion des déchets et mobilité verte.',
    sector: 'CleanTech', status: 'scheduled',
    dateDebut: new Date('2026-06-01'), dateFin: new Date('2026-09-30'),
    quota: 5,
    jury: ['Yassine Ben Salah'],
    scheduledPublish: new Date('2026-05-01'),
    objectives: [], criteria: [],
    createdAt: new Date('2026-03-10'), updatedAt: new Date(),
  },
  {
    _id: new ObjectId(),
    titre: 'Candidatures Spontanées',
    description: 'Formulaire de base pour toutes les candidatures hors programme défini. Ouvert en permanence.',
    sector: 'Tous secteurs', status: 'published',
    dateDebut: new Date('2026-01-01'), dateFin: new Date('2026-12-31'),
    quota: null,
    jury: [],
    objectives: [], criteria: [],
    createdAt: new Date('2026-01-01'), updatedAt: new Date(),
  },
  {
    _id: new ObjectId(),
    titre: 'Programme HealthTech 2025',
    description: 'Programme passé — santé numérique, télémédecine et dispositifs médicaux connectés.',
    sector: 'HealthTech', status: 'closed',
    dateDebut: new Date('2025-06-01'), dateFin: new Date('2025-09-30'),
    quota: 8,
    jury: ['Amira Hamdani'],
    objectives: [], criteria: [],
    createdAt: new Date('2025-04-01'), updatedAt: new Date(),
  },
];

// ════════════════════════════════════════════════════════════════
// 2. JURY
// ════════════════════════════════════════════════════════════════
const buildJury = () => [
  {
    _id: new ObjectId(),
    name: 'Karim Ghorbel',
    email: 'karim.ghorbel@jury.medianet.tn',
    post: 'CFO', company: 'Medianet',
    status: 'active',
    expertise: ['FinTech', 'E-Commerce', 'Venture Capital'],
    bio: "Directeur associé chez Tunisia Ventures. 15 ans d'expérience en capital-risque et fintech africaine.",
    linkedin: 'https://linkedin.com/in/karimghorbel',
    assignedProgrammes: ['Programme FinTech 2026'],
    evaluationsCount: 0, evaluations: [],
    createdAt: new Date('2026-01-10'), updatedAt: new Date(),
  },
  {
    _id: new ObjectId(),
    name: 'Omar Trabelsi',
    email: 'omar.trabelsi@jury.medianet.tn',
    post: 'Head of Digital', company: 'Attijari Bank',
    status: 'active',
    expertise: ['FinTech', 'Paiements mobiles', 'Régulation BCT'],
    bio: 'Ex-directeur stratégie à la Banque Centrale de Tunisie. Expert en inclusion financière.',
    linkedin: 'https://linkedin.com/in/omartrabelsi',
    assignedProgrammes: ['Programme FinTech 2026'],
    evaluationsCount: 0, evaluations: [],
    createdAt: new Date('2026-01-12'), updatedAt: new Date(),
  },
  {
    _id: new ObjectId(),
    name: 'Sonia Mrad',
    email: 'sonia.mrad@jury.medianet.tn',
    post: 'Dir. Innovation', company: 'Tunisie Telecom',
    status: 'active',
    expertise: ['EdTech', 'AI/ML', 'Pédagogie numérique'],
    bio: "Fondatrice de EduImpact, plateforme e-learning déployée dans 6 pays africains.",
    linkedin: 'https://linkedin.com/in/soniamrad',
    assignedProgrammes: ['Programme EdTech 2026'],
    evaluationsCount: 0, evaluations: [],
    createdAt: new Date('2026-01-15'), updatedAt: new Date(),
  },
  {
    _id: new ObjectId(),
    name: 'Yassine Ben Salah',
    email: 'yassine.bensalah@jury.medianet.tn',
    post: 'Partner', company: 'AfricaVentures',
    status: 'active',
    expertise: ['AgriTech', 'CleanTech', 'Développement durable'],
    bio: "Ingénieur agronome et entrepreneur. Co-fondateur de GreenSeed Afrique.",
    linkedin: 'https://linkedin.com/in/yassinebensalah',
    assignedProgrammes: ['Programme AgriTech 2026', 'Programme CleanTech 2026'],
    evaluationsCount: 0, evaluations: [],
    createdAt: new Date('2026-01-18'), updatedAt: new Date(),
  },
  {
    _id: new ObjectId(),
    name: 'Amira Hamdani',
    email: 'amira.hamdani@jury.medianet.tn',
    post: 'CEO', company: 'HealthBridge Africa',
    status: 'invited',
    expertise: ['HealthTech', 'Télémédecine', 'MedTech'],
    bio: "Médecin et co-fondatrice de DoctorConnect. Pionnière de la téléconsultation en Tunisie.",
    linkedin: 'https://linkedin.com/in/amirahamdani',
    assignedProgrammes: ['Programme HealthTech 2025'],
    evaluationsCount: 0, evaluations: [],
    createdAt: new Date('2025-04-05'), updatedAt: new Date(),
  },
];

// ════════════════════════════════════════════════════════════════
// 3. FORMULAIRES
// ════════════════════════════════════════════════════════════════
const buildForms = (programmes) => {
  const findProg = (titre) => programmes.find(p => p.titre === titre);

  const makeQ = (id, type, title, options = [], required = true, scaleMax = 5) => ({
    id, type, title,
    label: title,
    description: '',
    required, options,
    rows: [], scaleMin: 1, scaleMax, scaleMinLabel: '', scaleMaxLabel: '',
  });

  const fintech  = findProg('Programme FinTech 2026');
  const edtech   = findProg('Programme EdTech 2026');
  const agritech = findProg('Programme AgriTech 2026');
  const health25 = findProg('Programme HealthTech 2025');
  const spontane = findProg('Candidatures Spontanées');

  return [
    {
      _id: new ObjectId(),
      title: 'Formulaire de Base',
      subtitle: 'Formulaire standard pour candidatures spontanées.',
      description: 'Formulaire standard envoyé à tous les candidats sans programme défini.',
      type: 'basic', status: 'published',
      accent: '#006d94',
      programme: spontane?._id?.toString() || null,
      programmeName: 'Candidatures Spontanées',
      isInherited: false,
      fields: 8, responses: 0, sentTo: 0, sentToNames: [],
      completionRate: 0,
      createdAt: new Date('2026-01-15'), updatedAt: new Date(),
      questions: [
        makeQ('q1', 'short',    'Nom de la startup'),
        makeQ('q2', 'dropdown', 'Secteur', ['FinTech','HealthTech','AgriTech','EdTech','CleanTech','Logistique','Autre']),
        makeQ('q3', 'short',    "Année de fondation"),
        makeQ('q4', 'short',    "Taille de l'équipe", [], false),
        makeQ('q5', 'short',    "Pays d'opération", [], false),
        makeQ('q6', 'radio',    'Stade de financement', ['Pré-seed','Seed','Série A','Série B+']),
        makeQ('q7', 'long',     'Description du projet (2-3 phrases)'),
        makeQ('q8', 'radio',    'Comment avez-vous entendu parler de nous ?', ['Partenaire','LinkedIn','Site web','Réseaux sociaux','Conférence','Autre'], false),
      ],
    },
    {
      _id: new ObjectId(),
      title: 'Formulaire FinTech 2026',
      subtitle: 'Formulaire de candidature pour le programme FinTech 2026.',
      description: 'Évaluation approfondie pour les startups FinTech entrant en phase de sélection.',
      type: 'custom', status: 'published',
      accent: '#0EA5E9',
      programme: fintech?._id?.toString() || null,
      programmeName: 'Programme FinTech 2026',
      isInherited: true,
      fields: 12, responses: 0, sentTo: 0, sentToNames: [],
      completionRate: 0,
      createdAt: new Date('2026-02-01'), updatedAt: new Date(),
      questions: [
        makeQ('q1',  'short',    'Nom de la startup'),
        makeQ('q2',  'short',    'Fondateur(s)'),
        makeQ('q3',  'radio',    'Stade de développement', ['Idée','Prototype','MVP','Croissance','Expansion']),
        makeQ('q4',  'radio',    'Modèle de revenus', ['Abonnement','Commission sur transaction','Freemium','Marketplace','Autre']),
        makeQ('q5',  'short',    'Revenu mensuel récurrent (TND)', [], false),
        makeQ('q6',  'radio',    'Conformité réglementaire', ['Conforme','En cours','Non démarré']),
        makeQ('q7',  'long',     'Partenariats bancaires existants', [], false),
        makeQ('q8',  'short',    'Nombre de clients actifs', [], false),
        makeQ('q9',  'long',     'Problème résolu et solution proposée'),
        makeQ('q10', 'short',    'Marché cible'),
        makeQ('q11', 'radio',    'Montant levé à ce jour', ['0','< 50k TND','50k-200k TND','200k-500k TND','500k+ TND'], false),
        makeQ('q12', 'long',     'Pourquoi rejoindre MEDIANET Accelerator ?'),
      ],
    },
    {
      _id: new ObjectId(),
      title: 'Formulaire EdTech 2026',
      subtitle: 'Formulaire de candidature pour le programme EdTech 2026.',
      description: 'Évaluation des startups EdTech pour le programme 2026.',
      type: 'custom', status: 'published',
      accent: '#8B5CF6',
      programme: edtech?._id?.toString() || null,
      programmeName: 'Programme EdTech 2026',
      isInherited: true,
      fields: 10, responses: 0, sentTo: 0, sentToNames: [],
      completionRate: 0,
      createdAt: new Date('2026-02-10'), updatedAt: new Date(),
      questions: [
        makeQ('q1',  'short',    'Nom de la startup'),
        makeQ('q2',  'short',    'Fondateur(s)'),
        makeQ('q3',  'radio',    'Stade de développement', ['Idée','Prototype','MVP','Croissance']),
        makeQ('q4',  'short',    'Technologie principale utilisée'),
        makeQ('q5',  'long',     'Description de la solution éducative'),
        makeQ('q6',  'short',    'Public cible (élèves, étudiants, pros...)'),
        makeQ('q7',  'short',    "Nombre d'utilisateurs actifs", [], false),
        makeQ('q8',  'radio',    'Modèle économique', ['B2C','B2B Établissements','B2B Entreprises','Mixte']),
        makeQ('q9',  'scale',    'Impact pédagogique estimé (1-10)', [], false, 10),
        makeQ('q10', 'long',     'Stratégie de déploiement en Tunisie et Afrique'),
      ],
    },
    {
      _id: new ObjectId(),
      title: 'Formulaire AgriTech 2026',
      subtitle: 'Formulaire de candidature pour le programme AgriTech 2026.',
      description: 'Validation marché et adéquation produit pour startups AgriTech.',
      type: 'custom', status: 'draft',
      accent: '#D97706',
      programme: agritech?._id?.toString() || null,
      programmeName: 'Programme AgriTech 2026',
      isInherited: false,
      fields: 8, responses: 0, sentTo: 0, sentToNames: [],
      completionRate: 0,
      createdAt: new Date('2026-02-08'), updatedAt: new Date(),
      questions: [
        makeQ('q1', 'short',  'Nom de la startup'),
        makeQ('q2', 'short',  'Fondateur(s)'),
        makeQ('q3', 'short',  'Client cible (agriculteur, coopérative, distributeur...)'),
        makeQ('q4', 'long',   'Problème résolu'),
        makeQ('q5', 'long',   'Solution proposée et technologie utilisée'),
        makeQ('q6', 'short',  'Région géographique cible'),
        makeQ('q7', 'short',  'Nombre de clients/utilisateurs actuels', [], false),
        makeQ('q8', 'scale',  'Adéquation produit-marché estimée (1-10)', [], false, 10),
      ],
    },
    {
      _id: new ObjectId(),
      title: 'Formulaire HealthTech 2025',
      subtitle: 'Formulaire de retour après pitchs — programme 2025.',
      description: 'Formulaire de feedback structuré distribué après les présentations de pitchs.',
      type: 'custom', status: 'archived',
      accent: '#9D174D',
      programme: health25?._id?.toString() || null,
      programmeName: 'Programme HealthTech 2025',
      isInherited: false,
      fields: 7, responses: 0, sentTo: 0, sentToNames: [],
      completionRate: 0,
      createdAt: new Date('2025-05-01'), updatedAt: new Date(),
      questions: [
        makeQ('q1', 'short',  'Nom de la startup'),
        makeQ('q2', 'short',  'Fondateur(s)'),
        makeQ('q3', 'long',   'Description de la solution de santé numérique'),
        makeQ('q4', 'radio',  'Segment', ['Télémédecine','Diagnostics','Dossier patient','Pharmacie','Autre']),
        makeQ('q5', 'scale',  'Clarté de la vision (1-5)', [], true, 5),
        makeQ('q6', 'scale',  "Crédibilité de l'équipe (1-5)", [], true, 5),
        makeQ('q7', 'long',   'Impression générale et feedback'),
      ],
    },
  ];
};

// ════════════════════════════════════════════════════════════════
// 4. DONNÉES STARTUPS
// ════════════════════════════════════════════════════════════════
const STARTUPS = {
  fintech: [
    {
      name: 'PayLink',
      founderName: 'Aziz Chabbi',
      founderBio: "Ingénieur en informatique, 7 ans d'expérience dans les systèmes de paiement. Ancien développeur senior chez Vermeg. Co-fondateur de 2 projets tech précédents.",
      email: 'aziz@paylink.tn',
      stage: 'mvp',
      revenue: 28000,
      customers: 120,
      city: 'Tunis',
      amount: '50k-200k TND',
      teamSize: '3-5',
      foundedYear: 2024,
      problem: "Les PME tunisiennes et les commerçants indépendants n'ont pas accès à des solutions de paiement mobile simples, abordables et conformes à la réglementation BCT. Les terminaux POS traditionnels coûtent cher et excluent le secteur informel.",
      solution: "PayLink propose un QR code de paiement universel lié à n'importe quel compte bancaire tunisien. Zero hardware, zéro frais d'installation. Le commerçant scanne, le client paie via son appli bancaire. Commission de 0.8% par transaction.",
      businessModel: "Commission sur transaction (0.8%) + abonnement mensuel premium 29 TND pour fonctionnalités analytics et multi-caisse.",
      targetMarket: "120 000 commerçants indépendants en Tunisie non équipés de POS. Marché adressable total : 45M TND/an.",
      competitors: "Flouci, Paymee, systèmes POS bancaires traditionnels. Différenciation : zéro hardware, onboarding 5 minutes, compatible tous opérateurs.",
      traction: "120 commerçants actifs à Tunis et Sfax. 2 800 transactions traitées en mars 2026. Partenariat en discussion avec Attijari Bank. Croissance MoM : +23%.",
      regulatory: "En cours",
      bankPartners: "Discussions avancées avec Attijari Bank et BIAT pour intégration API directe. Convention signée avec CIB pour pilote Q2 2026.",
      whyMedianet: "MEDIANET nous apportera le réseau bancaire et la crédibilité réglementaire nécessaires pour accélérer notre déploiement national. Nous ciblons 5 000 commerçants d'ici fin 2026.",
    },
    {
      name: 'NeoBank TN',
      founderName: 'Rim Jelassi',
      founderBio: "MBA Finance HEC Paris, 10 ans en banque d'investissement (Société Générale, BNA). Expertise en produits bancaires digitaux et inclusion financière MENA.",
      email: 'rim@neobank.tn',
      stage: 'early_traction',
      revenue: 65000,
      customers: 340,
      city: 'Sfax',
      amount: '200k-500k TND',
      teamSize: '6-10',
      foundedYear: 2023,
      problem: "40% des Tunisiens sont non-bancarisés ou sous-bancarisés. Les banques traditionnelles imposent des frais élevés, des agences éloignées et des procédures kafkaïennes pour l'ouverture de compte. Les freelances et auto-entrepreneurs sont particulièrement exclus du système.",
      solution: "NeoBank TN est la première néo-banque tunisienne 100% mobile, avec compte en 10 minutes, IBAN tunisien, carte Visa prépayée, virement international et tableau de bord finances personnelles. Licenciée sous statut Établissement de Paiement BCT.",
      businessModel: "Freemium : compte gratuit + carte 15 TND/mois premium. Revenus additionnels : interchange (0.3%), change de devises (1.2% marge), prêts personnels en partenariat avec institutions de microfinance.",
      targetMarket: "1.8M de freelances, auto-entrepreneurs et travailleurs informels tunisiens. Diaspora tunisienne pour virements internationaux. TAM : 120M TND.",
      competitors: "Aucune néobanque locale. Concurrence indirecte : PostalPay, Orange Money. Avantage concurrentiel : seul acteur licencié BCT avec IBAN complet.",
      traction: "340 clients actifs, 65 000 TND de revenus cumulés. App Note 4.6/5 sur Google Play (180 avis). Partenariat MFI Enda Tamweel pour produits de crédit. Levée Seed 200k TND en janvier 2026.",
      regulatory: "Conforme",
      bankPartners: "Licenciée BCT (Établissement de Paiement). Partenariat Enda Tamweel pour microcrédits. Accord de principe avec Western Union pour transferts internationaux.",
      whyMedianet: "MEDIANET peut nous connecter aux grands partenaires corporate et institutions financières pour accélérer notre croissance B2B. Nous visons 5 000 clients et le break-even en Q4 2026.",
    },
    {
      name: 'CryptoSouk',
      founderName: 'Walid Baccouche',
      founderBio: "Développeur blockchain autodidacte. Passionné de crypto depuis 2017. Participe à des hackathons internationaux. Première startup.",
      email: 'walid@cryptosouk.tn',
      stage: 'prototype',
      revenue: 0,
      customers: 0,
      city: 'Tunis',
      amount: '< 50k TND',
      teamSize: '1-2',
      foundedYear: 2025,
      problem: "Les Tunisiens ne peuvent pas accéder légalement aux cryptomonnaies ni transférer de l'argent à l'international de manière simple et économique. Le marché noir des devises est florissant mais risqué.",
      solution: "Plateforme d'échange de cryptomonnaies peer-to-peer adaptée au contexte tunisien, avec conversion TND/USDT via virement bancaire local. Interface simplifiée pour non-techniciens.",
      businessModel: "Commission 1.5% sur chaque transaction. Pas encore de revenus réels.",
      targetMarket: "Jeunes tunisiens 18-35 ans intéressés par les cryptos. Diaspora pour envoi de fonds. Marché estimé non formellement documenté.",
      competitors: "Binance (international, non accessible légalement), marché informel local. Différenciation : légalité, interface arabe, TND natif.",
      traction: "Prototype fonctionnel. 0 client réel. 50 inscrits sur liste d'attente. Aucun revenu.",
      regulatory: "Non démarré",
      bankPartners: "Aucun partenariat bancaire. Flou réglementaire total sur les crypto en Tunisie.",
      whyMedianet: "Rejoindre MEDIANET pour mieux comprendre le cadre réglementaire et trouver des partenaires bancaires ouverts à l'innovation.",
    },
    {
      name: 'InsurBot',
      founderName: 'Ines Ferchichi',
      founderBio: "Actuaire diplômée ISFA Lyon, 5 ans chez STAR Assurances en gestion des risques. Expertise en produits d'assurance et digital.",
      email: 'ines@insurbot.tn',
      stage: 'mvp',
      revenue: 15000,
      customers: 80,
      city: 'Sousse',
      amount: '50k-200k TND',
      teamSize: '3-5',
      foundedYear: 2024,
      problem: "Le taux de pénétration de l'assurance en Tunisie est de 2% vs 8% en Europe. Le processus de souscription est complexe, les agences physiques peu accessibles, et les sinistres difficiles à déclarer. 80% des Tunisiens n'ont aucune assurance vie ou santé complémentaire.",
      solution: "InsurBot est un chatbot WhatsApp d'assurance qui permet de souscrire, déclarer un sinistre et suivre sa police en 5 minutes via messages. Produits simplifiés : assurance accident, hospitalisation, mobile, voyage. Partenariat de distribution avec 3 compagnies d'assurance agréées.",
      businessModel: "Commission de distribution 12-18% sur primes vendues + frais de service SaaS mensuel aux compagnies partenaires (450 TND/mois).",
      targetMarket: "4M de Tunisiens actifs sans assurance complémentaire. Distribution via WhatsApp (10M utilisateurs en Tunisie). Commerçants et livreurs comme priorité.",
      competitors: "Assurances traditionnelles en agence, Assur.tn (online basique). Différenciation : canal WhatsApp, simplicité, souscription instantanée.",
      traction: "80 polices actives, 15 000 TND primes encaissées. 3 compagnies partenaires (STAR, Lloyd's, Maghrebia). Taux de renouvellement 78%. Sinistres réglés sous 48h.",
      regulatory: "Conforme",
      bankPartners: "Partenariat distribution signé avec STAR Assurances, Maghrebia et Lloyd's Tunisie.",
      whyMedianet: "MEDIANET nous apportera visibilité et accès aux grands comptes corporate pour développer notre offre B2B assurance groupe.",
    },
    {
      name: 'TradePay',
      founderName: 'Mehdi Gharbi',
      founderBio: "Expert en commerce international, 8 ans chez Cofacé Tunisie en financement du commerce. Master Finance ESSEC Tunis.",
      email: 'mehdi@tradepay.tn',
      stage: 'early_traction',
      revenue: 42000,
      customers: 200,
      city: 'Monastir',
      amount: '200k-500k TND',
      teamSize: '6-10',
      foundedYear: 2024,
      problem: "Les PME exportatrices tunisiennes attendent en moyenne 90 jours le paiement de leurs factures clients étrangers. Ce délai tue leur trésorerie et limite leur croissance. L'affacturage bancaire est coûteux et réservé aux grandes entreprises.",
      solution: "TradePay est une plateforme de financement de factures export en ligne. Les PME uploadent leurs factures validées, TradePay les cède à des investisseurs institutionnels pour financement immédiat à 85% de la valeur. Remboursement automatique à l'encaissement.",
      businessModel: "Frais de financement 2.5%/mois sur le montant avancé + commission plateforme 1.2% par transaction. Modèle marketplace entre PME exportatrices et investisseurs.",
      targetMarket: "8 500 PME exportatrices tunisiennes. Volume factures export annuel : 12 Mds TND. Part adressable : 5% = 600M TND. TAM estimé : 15M TND de revenus.",
      competitors: "Banques (affacturage coûteux), Cofacé (grands comptes), aucun concurrent digital local. Avantage : digital, rapide, PME-friendly.",
      traction: "200 PME clientes, 42 000 TND de commissions perçues. 3.2M TND de factures financées depuis lancement. Partenariat avec 2 fonds d'investissement tunisiens. Pipeline de 50 nouvelles PME.",
      regulatory: "En cours",
      bankPartners: "Convention de refinancement avec UIB. Discussions avec BVMT pour accès marché obligataire. Accord fonds de garantie SOTUGAR pour couverture risques.",
      whyMedianet: "L'accélérateur MEDIANET nous apportera crédibilité, connexions bancaires et aide à la levée de fonds Série A que nous préparons pour Q3 2026.",
    },
  ],
  edtech: [
    {
      name: 'LearnPath',
      founderName: 'Nour Hamdi',
      founderBio: "Professeure d'informatique reconvertie en edtech entrepreneur. Master Sciences de l'éducation Université de Tunis. 8 ans d'enseignement au lycée et université.",
      email: 'nour@learnpath.tn',
      stage: 'mvp',
      revenue: 9000,
      customers: 500,
      city: 'Tunis',
      amount: '< 50k TND',
      teamSize: '3-5',
      foundedYear: 2025,
      technology: 'IA adaptative, machine learning, NLP arabe',
      educationalSolution: "LearnPath est une plateforme d'apprentissage adaptatif pour lycéens tunisiens (Bac 1ère et Terminale) qui personnalise le parcours selon le niveau et le style d'apprentissage de chaque élève. Contenu aligné sur le programme officiel tunisien en arabe et français. Quiz interactifs, vidéos courtes, fiches de révision générées par IA.",
      targetAudience: "Lycéens tunisiens 15-19 ans, parents souhaitant un soutien scolaire abordable (vs cours particuliers 50-100 TND/h).",
      deploymentStrategy: "Déploiement B2C direct via réseaux sociaux (TikTok, Instagram). Phase 2 : partenariats avec lycées privés (B2B). Phase 3 : expansion Algérie et Maroc avec localisation contenu. Ambassadeurs étudiants dans 50 lycées.",
      businessModel: "B2C",
      users: 500,
      impactScore: 8,
      traction: "500 élèves actifs, 9 000 TND revenus abonnements mensuels. Taux de rétention 72% (vs 40% moyenne edtech). Score moyen Bac simulacres +15% vs témoins. Partenariat pilote avec 3 lycées privés Tunis.",
      competitors: "Cours particuliers, YouTube, Mathway. Différenciation : IA adaptative en arabe tunisien, contenu programme tunisien officiel, prix 15 TND/mois vs 200 TND/h cours particuliers.",
    },
    {
      name: 'SkillUp Pro',
      founderName: 'Malek Sfaxi',
      founderBio: "Ancien responsable formation chez Ooredoo Tunisie, co-fondateur de 2 startups EdTech. Expert en LMS et digital learning. MBA spécialisation EdTech HEC Montréal.",
      email: 'malek@skillup.tn',
      stage: 'early_traction',
      revenue: 22000,
      customers: 800,
      city: 'Sfax',
      amount: '50k-200k TND',
      teamSize: '6-10',
      foundedYear: 2024,
      technology: "LMS propriétaire, React Native, intégration Zoom, certification blockchain",
      educationalSolution: "SkillUp Pro est un LMS B2B qui permet aux entreprises tunisiennes de former leurs employés en ligne avec des parcours certifiants. Bibliothèque de 200 cours professionnels (soft skills, tech, management) + outil de création de cours custom. Certification vérifiable sur blockchain.",
      targetAudience: "Responsables RH et formation dans les entreprises tunisiennes de 50-500 employés. Secteurs prioritaires : BPO, industrie, banque.",
      deploymentStrategy: "Vente directe aux DRH via force commerciale. Programme partenaires revendeurs (cabinets de conseil, organismes de formation). International : Sénégal, Côte d'Ivoire via distributeurs locaux en 2027.",
      businessModel: "B2B Entreprises",
      users: 800,
      impactScore: 7,
      traction: "800 utilisateurs actifs dans 15 entreprises clientes. 22 000 TND MRR. Contrats annuels avec Ooredoo, Tunisie Telecom, Poulina Group. Taux completion cours 68%. Certifications émises : 340.",
      competitors: "Moodle (complexe), LinkedIn Learning (anglais), Coursera for Business (cher). Différenciation : français/arabe, prix 30% moins cher, support local, contenu marché tunisien.",
    },
    {
      name: 'EduKids',
      founderName: 'Safa Bouzid',
      founderBio: "Institutrice de maternelle passionnée de pédagogie Montessori. Licence en sciences de l'éducation. Mère de 2 enfants. Première expérience entrepreneuriale.",
      email: 'safa@edukids.tn',
      stage: 'prototype',
      revenue: 3000,
      customers: 200,
      city: 'Tunis',
      amount: '< 50k TND',
      teamSize: '1-2',
      foundedYear: 2025,
      technology: "Développement React Native externalisé, gamification simple, animations 2D",
      educationalSolution: "EduKids est une application mobile éducative pour enfants 3-8 ans qui enseigne l'arabe, le français et les maths via des jeux interactifs et histoires animées. Approche Montessori adaptée au numérique. Contenu créé par des instituteurs certifiés tunisiens.",
      targetAudience: "Parents tunisiens de jeunes enfants 3-8 ans, crèches et maternelles privées. Parents de la diaspora souhaitant maintenir l'arabe.",
      deploymentStrategy: "B2C via app stores. Partenariats avec crèches et maternelles privées (B2B). Évolution vers abonnement famille. Marché diaspora arabophone en France et Canada.",
      businessModel: "B2C",
      users: 200,
      impactScore: 6,
      traction: "200 familles abonnées, 3 000 TND de revenus en 3 mois d'existence. App disponible iOS et Android. Note 4.4/5. 5 crèches partenaires en discussion. Aucune levée de fonds.",
      competitors: "Khan Academy Kids (anglais), YouTube Kids (non éducatif), Duolingo (ados+). Différenciation : contenu arabe tunisien pour tout-petits, approche Montessori, prix 9 TND/mois.",
    },
  ],
  spontaneous: [
    {
      name: 'AgroSense',
      founderName: 'Chaker Moussa',
      email: 'chaker@agrosense.tn',
      sector: 'AgriTech',
      stage: 'prototype',
      revenue: 5000,
      customers: 30,
      city: 'Bizerte',
      amount: '< 50k TND',
      teamSize: '3-5',
      problem: "Les agriculteurs tunisiens perdent 30 à 40% de leurs récoltes faute de données précises sur l'humidité du sol, les ravageurs et les besoins en irrigation. Les solutions IoT existantes sont importées, coûteuses et non adaptées aux conditions locales.",
      solution: "Capteurs IoT low-cost (fabrication locale) connectés à une app mobile qui analyse en temps réel l'humidité, la température et les nutriments du sol. Alertes intelligentes et recommandations d'irrigation personnalisées. Prix : 150 TND le capteur vs 800 TND importé.",
      businessModel: "Vente de capteurs + abonnement app 25 TND/mois par exploitation. Futur : data-as-a-service pour assureurs agricoles.",
      targetMarket: "45 000 exploitations agricoles tunisiennes de taille moyenne (5-50 ha). Gouvernorats Bizerte, Béja, Jendouba en priorité.",
      traction: "30 agriculteurs pilotes, 5 000 TND revenus. Réduction consommation eau prouvée : -32%. Partenariat en discussion avec Ministère de l'Agriculture pour programme national.",
    },
    {
      name: 'SolarMesh',
      founderName: 'Bilel Triki',
      email: 'bilel@solarmesh.tn',
      sector: 'CleanTech',
      stage: 'mvp',
      revenue: 18000,
      customers: 15,
      city: 'Sfax',
      amount: '50k-200k TND',
      teamSize: '3-5',
      problem: "Les PME industrielles tunisiennes paient des factures STEG très élevées et n'ont pas les moyens d'installer des panneaux solaires (investissement initial 50-200k TND). Les offres existantes de leasing solaire sont rigides et inadaptées aux petites structures.",
      solution: "SolarMesh finance et installe des systèmes solaires photovoltaïques pour PME en contrat Power Purchase Agreement (PPA) : zéro investissement initial, PME paie seulement l'électricité produite à prix fixe inférieur au tarif STEG. SolarMesh possède et maintient l'installation.",
      businessModel: "Revenus récurrents via PPA : PME paie 0.12 TND/kWh vs 0.18 TND/kWh STEG. SolarMesh conserve la différence + RECs. Rentabilité installation sur 7 ans.",
      targetMarket: "12 000 PME industrielles tunisiennes avec facture STEG > 2 000 TND/mois. Secteurs : textile, agroalimentaire, plasturgie. TAM : 200M TND.",
      traction: "15 PME clientes, 18 000 TND revenus mensuels récurrents. 450 kWc installés. CO2 évité : 280 tonnes/an. Financement de la BERD (50k EUR). Délai ROI prouvé : 8 mois.",
    },
    {
      name: 'MediQuick',
      founderName: 'Sami Ben Amor',
      email: 'sami@mediquick.tn',
      sector: 'HealthTech',
      stage: 'scaling',
      revenue: 90000,
      customers: 1200,
      city: 'Tunis',
      amount: '500k+ TND',
      teamSize: '10+',
      problem: "En Tunisie, obtenir un rendez-vous avec un spécialiste prend en moyenne 3 semaines. Les patients passent des heures en salle d'attente sans information. 40% des rendez-vous ne sont pas honorés, gaspillant le temps des médecins.",
      solution: "MediQuick est une plateforme de prise de RDV médical en ligne avec confirmation instantanée, rappels SMS automatiques, dossier patient numérique partagé et téléconsultation vidéo intégrée. Disponible web et app mobile.",
      businessModel: "Abonnement mensuel médecins et cliniques (99-499 TND/mois selon taille). Commission 5% sur téléconsultations. Modules premium : analytics, prescription numérique.",
      targetMarket: "8 500 médecins privés et 200 cliniques en Tunisie. Marché adressable : 35M TND/an. Patients : 12M Tunisiens ayant recours aux soins privés.",
      traction: "1 200 professionnels de santé inscrits. 90 000 TND MRR. 85 000 RDV pris via la plateforme. Note patients 4.7/5. Levée Seed 500k TND. Partenariat Tunisie Telecom pour distribution.",
    },
    {
      name: 'CartMax',
      founderName: 'Rami Dhahri',
      email: 'rami@cartmax.tn',
      sector: 'E-Commerce',
      stage: 'scaling',
      revenue: 140000,
      customers: 5000,
      city: 'Tunis',
      amount: '500k+ TND',
      teamSize: '10+',
      problem: "Les commerçants tunisiens n'ont pas d'outil simple pour créer une boutique en ligne. Les solutions existantes (Shopify, WooCommerce) sont en anglais, chères et non intégrées aux modes de paiement et livraison locaux.",
      solution: "CartMax est un builder de boutique en ligne no-code 100% tunisien, intégrant nativement Flouci/Paymee (paiement), Aramex/Tunisie Express (livraison), et le paiement à la livraison. Interface en arabe et français. Prix 39 TND/mois.",
      businessModel: "Abonnement SaaS 39-149 TND/mois selon fonctionnalités. Commission 1% sur ventes via CartMax Marketplace. Revenus services additionnels (logo, photos produits).",
      targetMarket: "350 000 commerçants tunisiens actifs sur Facebook sans site web. Marché adressable : 14M TND/an. Expansion Algérie et Libye prévue.",
      traction: "5 000 boutiques actives, 140 000 TND MRR. GMV mensuel traité : 2.8M TND. Partenariat Aramax livraison. Levée Série A 1.2M TND en cours. Croissance MoM : 18%.",
    },
    {
      name: 'DelivFast',
      founderName: 'Tarek Zouaoui',
      email: 'tarek@delivfast.tn',
      sector: 'Logistique',
      stage: 'early_traction',
      revenue: 47000,
      customers: 320,
      city: 'Sousse',
      amount: '200k-500k TND',
      teamSize: '6-10',
      problem: "Les e-commerçants tunisiens souffrent d'un taux de retour colis de 35-45% à cause des livraisons non honorées et du manque de suivi en temps réel. Les transporteurs traditionnels ne donnent aucune visibilité et les délais sont imprévisibles.",
      solution: "DelivFast est une plateforme de livraison last-mile qui agrège 5 transporteurs locaux et garantit la meilleure offre prix/délai pour chaque colis. Suivi GPS temps réel, signature électronique, relance SMS automatique et tableau de bord analytics pour e-commerçants.",
      businessModel: "Commission 8% sur le montant livraison facturé par les transporteurs + abonnement dashboard analytics 99 TND/mois.",
      targetMarket: "3 200 boutiques en ligne actives en Tunisie. Volume colis mensuel estimé : 800 000 unités. TAM : 40M TND de commissions potentielles.",
      traction: "320 e-commerçants clients, 47 000 TND MRR. 28 000 colis traités/mois. Taux de livraison réussie : 89% vs 65% marché. Partenariats avec Aramex, Chronopost TN, Tunisie Express.",
    },
    {
      name: 'WaterAI',
      founderName: 'Asma Dridi',
      email: 'asma@waterai.tn',
      sector: 'CleanTech',
      stage: 'prototype',
      revenue: 0,
      customers: 0,
      city: 'Bizerte',
      amount: '< 50k TND',
      teamSize: '1-2',
      problem: "La Tunisie perd 40% de son eau potable via des fuites dans les réseaux de distribution vieillissants. La SONEDE n'a pas les outils pour détecter ces fuites de manière proactive, résultant en pertes de 350M TND/an.",
      solution: "WaterAI utilise des capteurs acoustiques low-cost et l'IA pour détecter en temps réel les fuites d'eau dans les canalisations. Les données sont analysées sur le cloud et les équipes de maintenance alertées avec localisation GPS précise des fuites.",
      businessModel: "B2G : contrat SaaS avec SONEDE et collectivités locales. Modèle à l'économie réalisée : WaterAI prend 15% des économies générées.",
      targetMarket: "SONEDE (réseau national 9 500 km), 264 communes tunisiennes. Puis export Maroc, Algérie, Afrique subsaharienne.",
      traction: "Prototype fonctionnel en laboratoire. 0 client réel. Participation Hackathon GovTech Tunisia (2ème place). Lettre d'intention de la SONEDE pour pilote 2026. Aucun revenu.",
    },
  ],
};

// ════════════════════════════════════════════════════════════════
// 5. BUILDER SCORES
// ════════════════════════════════════════════════════════════════
function buildDetailedScores(startup) {
  const revenue = startup.revenue || 0;
  const customers = startup.customers || 0;

  // Score basé sur les vraies données du startup
  const hasRevenue = revenue > 0;
  const hasTraction = customers > 0;
  const isEarlyStage = ['idea', 'prototype'].includes(startup.stage);
  const isGrowth = ['scaling', 'early_traction'].includes(startup.stage);

  const problemClarity = startup.problem ? (startup.problem.length > 100 ? 75 : 50) : 20;
  const solutionClarity = startup.solution ? (startup.solution.length > 100 ? 70 : 45) : 20;
  const teamScore = startup.founderBio ? (startup.founderBio.length > 80 ? 72 : 55) : 35;
  const revenueBonus = revenue > 50000 ? 25 : revenue > 10000 ? 15 : revenue > 0 ? 8 : 0;
  const customerBonus = customers > 500 ? 20 : customers > 50 ? 12 : customers > 0 ? 6 : 0;

  const s = {
    team:       Math.min(100, Math.round(teamScore + (isGrowth ? 15 : 0) + rndInt(-5, 8))),
    innovation: Math.min(100, Math.round(solutionClarity + rndInt(-5, 12))),
    market:     Math.min(100, Math.round(problemClarity + (startup.targetMarket ? 10 : 0) + rndInt(-5, 10))),
    business:   Math.min(100, Math.round(55 + revenueBonus + rndInt(-8, 10))),
    traction:   Math.min(100, Math.round(30 + revenueBonus + customerBonus + rndInt(-5, 8))),
  };

  if (isEarlyStage) {
    s.traction = Math.min(s.traction, 35);
    s.business = Math.min(s.business, 55);
  }

  const total = Math.round(
    s.team * 0.30 + s.innovation * 0.25 + s.market * 0.20 + s.business * 0.15 + s.traction * 0.10
  );
  return { scores: s, total };
}

// ════════════════════════════════════════════════════════════════
// 6. BUILDER D'APPLICATION — champs imbriqués enrichis
// ════════════════════════════════════════════════════════════════
function buildFormResponsesByForm(startup, formTitle, sector) {
  const base = {
    q1: startup.name,
    q2: startup.founderName,
    startupName:   startup.name,
    founderName:   startup.founderName,
    founderEmail:  startup.email,
    founderPhone:  `+216 ${rndInt(20, 99)} ${rndInt(100, 999)} ${rndInt(100, 999)}`,
    sector,
    stage:         startup.stage,
    teamSize:      startup.teamSize || '3-5',
    foundedYear:   String(startup.foundedYear || 2024),
  };

  if (formTitle === 'Formulaire FinTech 2026') {
    return {
      ...base,
      q3:  startup.stage === 'early_traction' ? 'Croissance' : startup.stage === 'mvp' ? 'MVP' : 'Prototype',
      q4:  startup.businessModel?.includes('Abonnement') ? 'Abonnement' : 'Commission sur transaction',
      q5:  String(Math.round((startup.revenue || 0) / 12)) + ' TND/mois',
      q6:  startup.regulatory || 'En cours',
      q7:  startup.bankPartners || 'Aucun partenariat bancaire formalisé à ce stade.',
      q8:  String(startup.customers || 0),
      q9:  (startup.problem || '') + '\n\nSolution : ' + (startup.solution || ''),
      q10: startup.targetMarket || `PME tunisiennes secteur ${sector}`,
      q11: startup.amount,
      q12: startup.whyMedianet || `Rejoindre MEDIANET pour accélérer notre croissance et accéder au réseau bancaire.`,
      problem:       startup.problem,
      solution:      startup.solution,
      businessModel: startup.businessModel,
      targetMarket:  startup.targetMarket,
      competitors:   startup.competitors,
      traction:      startup.traction,
      bankPartners:  startup.bankPartners,
      regulatory:    startup.regulatory,
      revenue:       String(startup.revenue || 0),
      customers:     String(startup.customers || 0),
      fundingNeeded: startup.amount,
    };
  }

  if (formTitle === 'Formulaire EdTech 2026') {
    return {
      ...base,
      q3:  startup.stage === 'early_traction' ? 'Croissance' : startup.stage === 'mvp' ? 'MVP' : 'Prototype',
      q4:  startup.technology || 'Technologies web et mobile',
      q5:  startup.educationalSolution || startup.solution || `Solution éducative innovante pour le marché tunisien.`,
      q6:  startup.targetAudience || 'Élèves et étudiants tunisiens',
      q7:  String(startup.customers || 0) + ' utilisateurs actifs',
      q8:  startup.businessModel || 'B2C',
      q9:  String(startup.impactScore || 6),
      q10: startup.deploymentStrategy || `Déploiement progressif en Tunisie puis expansion MENA.`,
      problem:            `Manque de solutions éducatives adaptées au programme tunisien et accessibles.`,
      solution:           startup.educationalSolution || startup.solution,
      educationalSolution:startup.educationalSolution,
      technology:         startup.technology,
      targetAudience:     startup.targetAudience,
      businessModel:      startup.businessModel,
      deploymentStrategy: startup.deploymentStrategy,
      traction:           startup.traction,
      competitors:        startup.competitors,
      impactScore:        String(startup.impactScore || 6),
      revenue:            String(startup.revenue || 0),
      customers:          String(startup.customers || 0),
      fundingNeeded:      startup.amount,
    };
  }

  // Formulaire de base (spontanées)
  return {
    ...base,
    q3:  String(startup.foundedYear || 2024),
    q4:  startup.teamSize || '3-5',
    q5:  'Tunisie',
    q6:  startup.revenue > 50000 ? 'Seed' : startup.revenue > 0 ? 'Pré-seed' : 'Pré-seed',
    q7:  startup.problem
      ? `Problème : ${startup.problem.substring(0, 150)}... Solution : ${(startup.solution || '').substring(0, 100)}...`
      : `${startup.name} développe une solution innovante en ${sector} pour le marché tunisien.`,
    q8:  rnd(['Partenaire', 'LinkedIn', 'Site web', 'Réseaux sociaux', 'Conférence']),
    problem:       startup.problem,
    solution:      startup.solution,
    businessModel: startup.businessModel,
    targetMarket:  startup.targetMarket,
    traction:      startup.traction,
    revenue:       String(startup.revenue || 0),
    customers:     String(startup.customers || 0),
    fundingNeeded: startup.amount,
  };
}

function buildApplication({
  startup, sector, programmeName, programmeId, formId, formTitle,
  status, juryAssigned, juryIds, appliedAt,
}) {
  const { scores, total } = buildDetailedScores(startup);
  const formResponses = buildFormResponsesByForm(startup, formTitle, sector);

  // ── Champs imbriqués pour scoring IA ─────────────────────────
  const project = {
    startupName:  startup.name,
    sector,
    stage:        startup.stage,
    location:     startup.city,
    foundedYear:  String(startup.foundedYear || 2024),
    description:  startup.problem
      ? `${startup.name} résout le problème suivant : ${startup.problem.substring(0, 200)}`
      : `${startup.name} est une startup ${sector} en phase ${startup.stage}.`,
    problem:      startup.problem || `Les entreprises et particuliers du secteur ${sector} manquent de solutions digitales adaptées au marché tunisien.`,
    solution:     startup.solution || `${startup.name} propose une solution innovante qui adresse ce problème avec une approche centrée sur l'utilisateur local.`,
    competitors:  startup.competitors || `Concurrents traditionnels du secteur ${sector} en Tunisie.`,
    website:      `https://${startup.name.toLowerCase().replace(/\s/g, '')}.tn`,
  };

  const team = {
    founderName:  startup.founderName,
    founderRole:  'CEO & Co-fondateur',
    founderEmail: startup.email,
    founderBio:   startup.founderBio || `Entrepreneur passionné par le secteur ${sector}, avec une vision claire du marché tunisien et africain.`,
    teamSize:     startup.teamSize || (startup.revenue > 50000 ? '6-10' : startup.revenue > 10000 ? '3-5' : '1-2'),
    members:      [],
  };

  const economy = {
    businessModel:  startup.businessModel || `Modèle de revenus basé sur abonnement et/ou commissions dans le secteur ${sector}.`,
    fundingGoal:    startup.amount,
    fundingRaised:  startup.revenue > 50000 ? startup.amount : '< 50k TND',
    monthlyRevenue: String(Math.round((startup.revenue || 0) / 12)),
    annualRevenue:  String(startup.revenue || 0),
    customers:      startup.customers || 0,
    growthRate:     startup.revenue > 50000 ? '+18% mensuel' : startup.revenue > 10000 ? '+8% mensuel' : 'Pré-revenus',
    marketSize:     startup.targetMarket || `Marché ${sector} tunisien et MENA`,
    competitors:    startup.competitors || `Acteurs traditionnels du secteur ${sector}`,
    traction:       startup.traction || `${startup.customers || 0} clients actifs, ${startup.revenue || 0} TND de revenus.`,
  };

  const description = startup.problem
    ? `${startup.name} adresse le problème suivant : ${startup.problem.substring(0, 150)}... La solution proposée est : ${(startup.solution || '').substring(0, 100)}...`
    : `${startup.name} est une startup ${sector} en phase ${startup.stage} avec ${startup.customers || 0} clients actifs et ${startup.revenue || 0} TND de revenus.`;

  return {
    _id: new ObjectId(),

    // ── Liens programme & formulaire ──────────────────────────
    programmeId,
    programmeName,
    formId,
    formTitle,
    type: programmeName ? 'programme' : 'spontaneous',

    // ── Champs RACINE ─────────────────────────────────────────
    startupName:   startup.name,
    founder:       startup.founderName,
    email:         startup.email,
    sector,
    stage:         startup.stage,
    location:      startup.city,
    amount:        startup.amount,
    description,
    totalScore:    total,

    // Alias de compatibilité
    founderName:  startup.founderName,
    founderEmail: startup.email,

    // ── Champs imbriqués pour scoring IA ─────────────────────
    // Ces champs sont lus par le service de scoring pour générer
    // une analyse complète par critère (problème, marché, équipe, solution, traction)
    project,
    team,
    economy,

    // ── Scores détaillés ─────────────────────────────────────
    detailedScores: scores,
    adminRemarks:   {},
    adminDecisionRemark: '',
    aiScore: {
      scores: {
        problem:  scores.team,
        market:   scores.market,
        team:     scores.team,
        solution: scores.innovation,
        traction: scores.traction,
      },
      total,
      summary: total >= 75
        ? `${startup.name} présente un dossier solide avec une traction prouvée (${startup.customers || 0} clients, ${startup.revenue || 0} TND de revenus). L'équipe est expérimentée et le marché bien adressé.`
        : total >= 50
        ? `${startup.name} montre un potentiel intéressant mais doit encore valider sa traction commerciale et affiner son modèle économique.`
        : `${startup.name} est en phase très précoce. Le concept mérite attention mais manque de validation marché et de traction prouvée.`,
      strengths: total >= 70
        ? ['Vision claire du marché', 'Équipe expérimentée', startup.customers > 100 ? 'Traction commerciale prouvée' : 'Prototype fonctionnel']
        : ['Problème réel bien identifié', 'Approche innovante'],
      weaknesses: total < 60
        ? ['Traction commerciale à prouver', 'Modèle économique à valider', startup.customers === 0 ? 'Aucun client réel à ce stade' : 'Nombre de clients limité']
        : ['Concurrence internationale à adresser', 'Scalabilité à démontrer'],
      generatedAt: pastDate(rndInt(5, 20)),
      model: 'claude-sonnet-4-20250514',
    },

    // ── Réponses formulaire ───────────────────────────────────
    formResponses,

    // ── Statut & dates ────────────────────────────────────────
    status,
    submittedAt: appliedAt,
    appliedAt,
    lastUpdated: new Date(),
    decidedAt: ['accepted', 'rejected'].includes(status)
      ? new Date(appliedAt.getTime() + 12 * 86400000)
      : null,

    // ── Timeline ──────────────────────────────────────────────
    statusHistory: [
      { status: 'submitted', date: appliedAt, by: 'System' },
      ...(status !== 'pending' && status !== 'submitted'
        ? [{ status, date: new Date(appliedAt.getTime() + 5 * 86400000), by: 'Admin' }]
        : []),
    ],

    // ── Jury ──────────────────────────────────────────────────
    juryAssigned,
    juryIds,
    notified: false,
    notes: '',

    createdAt: appliedAt,
    updatedAt: new Date(),
  };
}

// ════════════════════════════════════════════════════════════════
// 7. FORM RESPONSES
// ════════════════════════════════════════════════════════════════
function buildFormResponse(application, form) {
  const answers = {};
  (form.questions || []).forEach((q) => {
    const fr = application.formResponses;
    answers[q.id] = fr[q.id] || fr[`q${q.id.replace('q', '')}`] || '';
  });

  return {
    _id: new ObjectId(),
    formId: form._id,
    applicationId: application._id,
    programmeId: application.programmeId,
    programmeName: application.programmeName,
    respondent: application.founder,
    email: application.email,
    company: application.startupName,
    sector: application.sector,
    answers,
    // Données enrichies copiées pour accès rapide
    project:  application.project,
    team:     application.team,
    economy:  application.economy,
    submittedAt: application.submittedAt,
    createdAt: application.submittedAt,
    updatedAt: new Date(),
  };
}

// ════════════════════════════════════════════════════════════════
// 8. JURY EVALUATIONS
// ════════════════════════════════════════════════════════════════
const EVAL_CRITERIA = [
  { criteriaId: 'team',       criteriaName: 'Équipe',            weight: 30 },
  { criteriaId: 'innovation', criteriaName: 'Innovation',        weight: 25 },
  { criteriaId: 'market',     criteriaName: 'Marché',            weight: 20 },
  { criteriaId: 'business',   criteriaName: 'Modèle économique', weight: 15 },
  { criteriaId: 'traction',   criteriaName: 'Traction',          weight: 10 },
];

function buildEvaluation(juryMember, application) {
  const base = application.totalScore || 60;
  const detScores = application.detailedScores || {};
  const scores = EVAL_CRITERIA.map((c) => ({
    criteriaId:   c.criteriaId,
    criteriaName: c.criteriaName,
    score:        detScores[c.criteriaId]
      ? Math.min(100, Math.round(detScores[c.criteriaId] + rndInt(-8, 8)))
      : rndInt(Math.max(0, base - 15), Math.min(100, base + 10)),
    remark: c.criteriaId === 'team'
      ? (application.team?.founderBio?.length > 80 ? "Équipe solide avec expérience sectorielle avérée." : "Équipe jeune, expérience à compléter.")
      : '',
  }));
  const totalScore = Math.round(
    scores.reduce((sum, s, i) => sum + s.score * (EVAL_CRITERIA[i].weight / 100), 0)
  );
  const recommendation = totalScore >= 75 ? 'accept' : totalScore >= 55 ? 'review' : 'reject';

  return {
    _id: new ObjectId(),
    applicationId:  application._id,
    juryId:         juryMember._id,
    juryName:       juryMember.name,
    startupName:    application.startupName,
    programmeName:  application.programmeName || '',
    programmeId:    application.programmeId || null,
    sector:         application.sector,
    scores,
    totalScore,
    globalRemark: totalScore >= 75
      ? `Dossier ${application.startupName} très solide. Traction prouvée (${application.economy?.customers || 0} clients), équipe expérimentée, marché bien adressé. À prioriser.`
      : totalScore >= 55
      ? `${application.startupName} montre du potentiel mais quelques points à consolider avant décision finale.`
      : `${application.startupName} en phase trop précoce pour ce programme. Manque de validation marché.`,
    recommendation,
    status:         'submitted',
    submittedAt:    pastDate(rndInt(2, 15)),
    createdAt:      pastDate(rndInt(3, 16)),
    updatedAt:      new Date(),
  };
}

// ════════════════════════════════════════════════════════════════
// MAIN SEED
// ════════════════════════════════════════════════════════════════
async function seed() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const dbName = MONGO_URI.split('/').pop().split('?')[0];
    const db = client.db(dbName);
    console.log(`\n✅ MongoDB connecté : ${dbName}\n`);

    // ── 1. Programmes ──────────────────────────────────────────
    const programmes = buildProgrammes();
    await db.collection('programmes').deleteMany({});
    await db.collection('programmes').insertMany(programmes);
    console.log(`✅ ${programmes.length} programmes insérés`);

    // ── 2. Jury ────────────────────────────────────────────────
    const jury = buildJury();
    await db.collection('jury').deleteMany({});
    await db.collection('jury').insertMany(jury);
    console.log(`✅ ${jury.length} jurys insérés`);

    // ── 3. Formulaires ─────────────────────────────────────────
    const forms = buildForms(programmes);
    await db.collection('forms').deleteMany({});
    await db.collection('forms').insertMany(forms);
    console.log(`✅ ${forms.length} formulaires insérés`);

    const findForm = (progName) => forms.find(f => f.programmeName === progName) || forms[0];
    const findProg = (titre) => programmes.find(p => p.titre === titre);
    const juryByName = {};
    jury.forEach(j => { juryByName[j.name] = j; });

    // ── 4. Applications ────────────────────────────────────────
    const applications = [];

    // FinTech 2026
    const fintechProg = findProg('Programme FinTech 2026');
    const fintechForm = findForm('Programme FinTech 2026');
    const fintechStatuses = ['accepted', 'accepted', 'reviewing', 'pending', 'rejected'];
    const fintechJuryNames = ['Karim Ghorbel', 'Omar Trabelsi'];
    const fintechJuryIds = fintechJuryNames.map(n => juryByName[n]?._id).filter(Boolean);

    STARTUPS.fintech.forEach((s, i) => {
      applications.push(buildApplication({
        startup: s,
        sector: 'FinTech',
        programmeName: fintechProg.titre,
        programmeId: fintechProg._id,
        formId: fintechForm._id,
        formTitle: fintechForm.title,
        status: fintechStatuses[i] || 'pending',
        juryAssigned: fintechJuryNames,
        juryIds: fintechJuryIds,
        appliedAt: pastDate(rndInt(20, 55)),
      }));
    });

    // EdTech 2026
    const edtechProg = findProg('Programme EdTech 2026');
    const edtechForm = findForm('Programme EdTech 2026');
    const edtechStatuses = ['accepted', 'reviewing', 'pending'];
    const edtechJuryNames = ['Sonia Mrad'];
    const edtechJuryIds = edtechJuryNames.map(n => juryByName[n]?._id).filter(Boolean);

    STARTUPS.edtech.forEach((s, i) => {
      applications.push(buildApplication({
        startup: s,
        sector: 'EdTech',
        programmeName: edtechProg.titre,
        programmeId: edtechProg._id,
        formId: edtechForm._id,
        formTitle: edtechForm.title,
        status: edtechStatuses[i] || 'pending',
        juryAssigned: edtechJuryNames,
        juryIds: edtechJuryIds,
        appliedAt: pastDate(rndInt(10, 30)),
      }));
    });

    // Spontanées
    const spontaneProg = findProg('Candidatures Spontanées');
    const spontaneForm = findForm('Candidatures Spontanées');
    const spontaneStatuses = ['pending', 'reviewing', 'accepted', 'rejected', 'pending', 'reviewing'];

    STARTUPS.spontaneous.forEach((s, i) => {
      applications.push(buildApplication({
        startup: s,
        sector: s.sector,
        programmeName: null,
        programmeId: spontaneProg._id,
        formId: spontaneForm._id,
        formTitle: spontaneForm.title,
        status: spontaneStatuses[i] || 'pending',
        juryAssigned: [],
        juryIds: [],
        appliedAt: pastDate(rndInt(5, 90)),
      }));
    });

    await db.collection('applications').deleteMany({});
    await db.collection('applications').insertMany(applications);
    console.log(`✅ ${applications.length} candidatures insérées`);

    // ── 5. Liens form → programme ──────────────────────────────
    for (const form of forms) {
      const prog = programmes.find(p => p.titre === form.programmeName);
      if (prog) {
        await db.collection('forms').updateOne(
          { _id: form._id },
          { $set: { programmeId: prog._id } }
        );
      }
    }
    console.log('✅ Liens form→programme mis à jour');

    // ── 6. Réponses de formulaire ──────────────────────────────
    const formResponses = [];
    for (const app of applications) {
      const form = forms.find(f => f._id.toString() === app.formId?.toString());
      if (form) {
        formResponses.push(buildFormResponse(app, form));
      }
    }
    await db.collection('formresponses').deleteMany({});
    await db.collection('formresponses').insertMany(formResponses);
    console.log(`✅ ${formResponses.length} réponses de formulaire insérées`);

    // ── 7. Compteurs réponses ──────────────────────────────────
    for (const form of forms) {
      const count = formResponses.filter(r => r.formId.toString() === form._id.toString()).length;
      const sentTo = applications.filter(a => a.formId?.toString() === form._id.toString()).length;
      const completionRate = sentTo > 0 ? Math.round((count / sentTo) * 100) : 0;
      await db.collection('forms').updateOne(
        { _id: form._id },
        { $set: { responses: count, sentTo, completionRate } }
      );
    }
    console.log('✅ Compteurs de réponses mis à jour');

    // ── 8. Évaluations jury ────────────────────────────────────
    const evaluations = [];
    const acceptedOrReviewingApps = applications.filter(a =>
      ['accepted', 'reviewing', 'interview'].includes(a.status) && a.juryIds?.length > 0
    );

    for (const app of acceptedOrReviewingApps) {
      const appJuryIds = app.juryIds || [];
      for (const juryId of appJuryIds) {
        const juryMember = jury.find(j => j._id.toString() === juryId.toString());
        if (juryMember) {
          evaluations.push(buildEvaluation(juryMember, app));
        }
      }
    }

    await db.collection('juryevaluations').deleteMany({});
    if (evaluations.length > 0) {
      await db.collection('juryevaluations').insertMany(evaluations);
    }
    console.log(`✅ ${evaluations.length} évaluations jury insérées`);

    // ── 9. Mise à jour jury ────────────────────────────────────
    for (const juryMember of jury) {
      const juryEvals = evaluations.filter(e => e.juryId.toString() === juryMember._id.toString());
      const evalSummaries = juryEvals.map(e => ({
        evaluationId: e._id,
        candidature:  e.startupName,
        startupName:  e.startupName,
        programme:    e.programmeName,
        score:        Math.round(e.totalScore / 20),
        date:         e.submittedAt,
      }));
      await db.collection('jury').updateOne(
        { _id: juryMember._id },
        { $set: { evaluationsCount: juryEvals.length, evaluations: evalSummaries, updatedAt: new Date() } }
      );
    }
    console.log('✅ Jurys mis à jour avec évaluations');

    // ── 10. Nb candidatures par programme ─────────────────────
    for (const prog of programmes) {
      const count = applications.filter(a => a.programmeId?.toString() === prog._id.toString()).length;
      await db.collection('programmes').updateOne(
        { _id: prog._id },
        { $set: { candidatures: count, updatedAt: new Date() } }
      );
    }
    console.log('✅ Programmes mis à jour avec nb de candidatures');

    // ── RÉSUMÉ ─────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════════════════════');
    console.log('RÉSUMÉ DU SEED');
    console.log('══════════════════════════════════════════════════════════════');
    console.log(`\nProgrammes : ${programmes.length}`);
    programmes.forEach(p => {
      const count = applications.filter(a => a.programmeId?.toString() === p._id.toString()).length;
      const form  = forms.find(f => f.programmeName === p.titre);
      console.log(`  • ${p.titre} [${p.status}] — ${count} candidatures — form: "${form?.title || 'non lié'}"`);
    });

    console.log(`\nCandidatures : ${applications.length}`);
    const byStatus = {};
    applications.forEach(a => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });
    Object.entries(byStatus).forEach(([s, c]) => console.log(`  ${s}: ${c}`));

    console.log(`\nJury : ${jury.length} membres`);
    jury.forEach(j => {
      const count = evaluations.filter(e => e.juryId.toString() === j._id.toString()).length;
      console.log(`  • ${j.name} [${j.status}] — ${count} évaluation(s)`);
    });

    console.log(`\nÉvaluations : ${evaluations.length}`);
    console.log(`Réponses formulaires : ${formResponses.length}`);

    // Vérification champs imbriqués
    const sample = applications.find(a => a.startupName === 'EduKids') || applications[0];
    console.log('\n── Vérification EduKids (champs imbriqués pour scoring IA) ──');
    console.log(`  project.problem  : ${sample.project?.problem?.substring(0, 80)}...`);
    console.log(`  project.solution : ${sample.project?.solution?.substring(0, 80)}...`);
    console.log(`  team.founderBio  : ${sample.team?.founderBio?.substring(0, 80)}...`);
    console.log(`  economy.traction : ${sample.economy?.traction?.substring(0, 80)}...`);
    console.log(`  totalScore       : ${sample.totalScore}`);
    console.log(`  detailedScores   : ${JSON.stringify(sample.detailedScores)}`);

    const edukidsApp = applications.find(a => a.startupName === 'EduKids');
    if (edukidsApp) {
      console.log('\n── Scores attendus après re-score IA : EduKids ──');
      console.log(`  Stage: ${edukidsApp.stage} | Revenue: ${edukidsApp.economy?.annualRevenue} TND | Customers: ${edukidsApp.economy?.customers}`);
      console.log(`  → Score estimé post-IA : 45-60/100 (prototype, premiers revenus, equipe junior)`);
    }

    console.log('\n══════════════════════════════════════════════════════════════');
    console.log('✅ Seed terminé. Relancez le scoring IA pour chaque candidature.');
    console.log('   Les données project/team/economy sont maintenant renseignées.');
    console.log('══════════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('\n❌ ERREUR SEEDING :', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Déconnexion MongoDB.');
    process.exit(0);
  }
}

seed();