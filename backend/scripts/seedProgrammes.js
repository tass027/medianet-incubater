require('dotenv').config();
const { MongoClient } = require('mongodb');

const data = [
  /* ══════════════════════════════════════════════
     1. FINTECH 2026
  ══════════════════════════════════════════════ */
  {
    slug: 'fintech-2026',
    titre: 'Programme FinTech 2026',
    description: "Accélération de startups dans le domaine de la finance digitale, paiements mobiles et inclusion financière.\n\nLe programme FinTech 2026 rassemble 10 startups sélectionnées pour un accompagnement complet de 3 mois : mentorat expert, accès aux investisseurs, structuration juridique et Demo Day médiatisé. Il cible les néobanques, paiements digitaux, crédit alternatif, assurtech et solutions d'inclusion financière pour les populations non-bancarisées en Afrique du Nord.",
    sector: 'FinTech',
    status: 'published',
    dateDebut: new Date('2026-04-01'),
    dateFin:   new Date('2026-06-30'),
    quota: 10,
    formulaire: 'Formulaire FinTech Avancé',
    jury: ['Karim Ghorbel', 'Omar Trabelsi', 'Sonia Kahloul'],
    image: '/programmes/fintech-hero.jpg',
    logo:  '/programmes/fintech-logo.png',
    subSectors: ['Néobanque', 'Paiement mobile', 'Crédit alternatif', 'Assurtech', 'Inclusion financière'],
    objectives: [
      'Accompagner 10 startups FinTech à fort potentiel de croissance',
      "Faciliter l'accès au financement de 200K à 2M DT par startup",
      'Développer le réseau avec les banques et institutions financières partenaires',
      'Structurer les modèles économiques et la conformité réglementaire BCT',
      'Organiser un Demo Day avec 50+ investisseurs tunisiens et internationaux',
    ],
    criteria: [
      'Innovation technologique démontrée dans le secteur financier tunisien',
      'Modèle économique viable avec premiers clients ou MVP fonctionnel',
      'Équipe technique solide (min. CTO + CEO engagés à plein temps)',
      'Marché tunisien ou africain ciblé avec potentiel de croissance régionale',
      'Levée de fonds envisagée entre 100K et 2M DT dans les 18 mois',
    ],
    phases: [
      { label: 'Dépôt des candidatures', date: '01 Fév — 31 Mar 2026', done: true,  statut: 'done'    },
      { label: 'Sélection & entretiens', date: '01 — 15 Avr 2026',     done: false, statut: 'pending' },
      { label: 'Démarrage du programme', date: '01 Mai 2026',           done: false, statut: 'pending' },
      { label: 'Pitch investisseurs',    date: 'Mi-Juin 2026',          done: false, statut: 'pending' },
      { label: 'Demo Day FinTech',       date: '30 Jun 2026',           done: false, statut: 'pending' },
    ],
    benefits: [
      { label: 'Startup Village',         desc: 'Accès aux espaces co-working premium de Medianet Group à Menzah, Tunis — 2500m² dédiés' },
      { label: 'Mentor expert FinTech',   desc: '4h/semaine avec un expert bancaire ou fintech senior pendant toute la durée du programme' },
      { label: 'Réseau investisseurs',    desc: 'Mise en relation directe avec 45+ investisseurs : Africinvest, BFPME, fonds régionaux' },
      { label: 'Conformité réglementaire',desc: 'Accompagnement juridique BCT, SIJOUMI, cadre légal startups labellisées' },
      { label: 'Visibilité médiatique',   desc: 'Communication via les canaux Medianet Group et Demo Day public avec presse nationale' },
      { label: 'Accès aux partenaires',   desc: 'Connexion directe avec les 8 banques partenaires de Medianet Incubator' },
    ],
    stats: {
      startups:        12,
      labelStartup:    4,
      commercialisent: 9,
      leveesFonds:     3,
      sessions:        36,
    },
    testimonials: [
      {
        name:    'Mohamed Aziz Ben Youssef',
        company: 'PayTunisia',
        text:    "Medianet Incubator nous a ouvert des portes que nous n'aurions jamais pu franchir seuls. En 3 mois, nous avons structuré notre modèle, rencontré nos premiers investisseurs et signé un partenariat avec une banque de la place.",
      },
      {
        name:    'Rim Belhaj',
        company: 'MicroCredit+',
        text:    "Le programme FinTech 2025 a été un accélérateur exceptionnel. L'accompagnement sur la conformité réglementaire était exactement ce dont nous avions besoin pour convaincre nos partenaires bancaires.",
      },
    ],
    gallery: [
      '/programmes/fintech-gallery-1.jpg',
      '/programmes/fintech-gallery-2.jpg',
      '/programmes/fintech-gallery-3.jpg',
      '/programmes/fintech-gallery-4.jpg',
      '/programmes/fintech-gallery-5.jpg',
      '/programmes/fintech-gallery-6.jpg',
    ],
    partners: [
      { name: 'Banque de Tunisie',  logo: '/programmes/partner-bt.png'    },
      { name: 'Africinvest',        logo: '/programmes/partner-africinvest.png' },
      { name: 'BFPME',              logo: '/programmes/partner-bfpme.png'  },
      { name: 'Startup Village',    logo: '/programmes/partner-sv.png'     },
    ],
    createdAt: new Date('2026-02-15'),
    updatedAt: new Date(),
  },

  /* ══════════════════════════════════════════════
     2. EDTECH 2026
  ══════════════════════════════════════════════ */
  {
    slug: 'edtech-2026',
    titre: 'Programme EdTech 2026',
    description: "Programme dédié aux solutions innovantes dans l'éducation, la formation professionnelle en ligne et les compétences numériques pour l'Afrique.\n\nEn 3 mois intensifs, 8 startups EdTech bénéficient d'un accompagnement pédagogique, technologique et commercial pour scaler leurs solutions sur les marchés tunisien et africain. L'objectif : démocratiser l'accès à une éducation de qualité grâce à la technologie.",
    sector: 'EdTech',
    status: 'published',
    dateDebut: new Date('2026-04-15'),
    dateFin:   new Date('2026-07-15'),
    quota: 8,
    formulaire: 'Formulaire EdTech',
    jury: ['Sonia Mrad', 'Hichem Turki', 'Wafa Ben Amor'],
    image: '/programmes/edtech-hero.jpg',
    logo:  '/programmes/edtech-logo.png',
    subSectors: ['E-learning', 'Formation professionnelle', 'EdTech B2B', 'Compétences numériques', 'Plateforme LMS'],
    objectives: [
      'Accompagner 8 startups EdTech avec un impact pédagogique mesurable',
      "Connecter les startups avec 20+ établissements scolaires et universitaires partenaires",
      'Développer des solutions adaptées aux marchés francophones africains',
      'Structurer les modèles SaaS B2B et B2C pour l\'éducation',
      'Préparer un Demo Day avec les décideurs de l\'éducation nationale',
    ],
    criteria: [
      'Solution EdTech avec impact pédagogique démontré ou mesurable',
      'Prototype ou MVP fonctionnel avec premiers utilisateurs actifs',
      'Équipe fondatrice passionnée par l\'éducation et la technologie',
      'Potentiel de scalabilité vers les marchés africains francophones',
      'Modèle économique viable (SaaS, B2B, B2G ou B2C)',
    ],
    phases: [
      { label: 'Dépôt des candidatures',  date: '01 Fév — 31 Mar 2026', done: true,  statut: 'done'    },
      { label: 'Sélection & pitches',     date: '01 — 15 Avr 2026',     done: false, statut: 'pending' },
      { label: 'Démarrage programme',     date: '15 Avr 2026',          done: false, statut: 'pending' },
      { label: 'Sprint partenariats',     date: 'Juin 2026',            done: false, statut: 'pending' },
      { label: 'Demo Day EdTech',         date: '15 Jul 2026',          done: false, statut: 'pending' },
    ],
    benefits: [
      { label: 'Accès établissements',    desc: '20+ lycées, universités et centres de formation partenaires pour tester vos solutions' },
      { label: 'Mentor pédagogique',      desc: 'Expert en ingénierie pédagogique et conception de contenus numériques' },
      { label: 'Infrastructure tech',     desc: 'Crédits cloud AWS/Azure, outils LMS open source, API IA pour personnalisation' },
      { label: 'Réseau investisseurs',    desc: 'Fonds spécialisés EdTech Afrique, bailleurs de fonds internationaux (AFD, BM)' },
      { label: 'Startup Village',         desc: '2500m² d\'espaces co-working et salles de formation à Medianet Group' },
      { label: 'Visibilité',              desc: 'Partenariat médiatique avec TV Medianet, radio et presse nationale' },
    ],
    stats: {
      startups:        10,
      labelStartup:    3,
      commercialisent: 7,
      leveesFonds:     2,
      sessions:        28,
    },
    testimonials: [
      {
        name:    'Karim Mansouri',
        company: 'SkillUp Tunisia',
        text:    "Le programme EdTech nous a permis de passer de 200 à 5000 utilisateurs en 3 mois grâce aux partenariats avec les établissements scolaires. L'accompagnement commercial était exceptionnel.",
      },
      {
        name:    'Nour El Houda Selmi',
        company: 'LearnDari',
        text:    "Rejoindre l'incubateur Medianet a été un tournant. Nous avons structuré notre pédagogie, intégré l'IA dans notre plateforme et convaincu 3 universités partenaires en moins de 90 jours.",
      },
    ],
    gallery: [
      '/programmes/edtech-gallery-1.jpg',
      '/programmes/edtech-gallery-2.jpg',
      '/programmes/edtech-gallery-3.jpg',
      '/programmes/edtech-gallery-4.jpg',
    ],
    partners: [
      { name: 'Université de Tunis',  logo: '/programmes/partner-ut.png'  },
      { name: 'Microsoft Education',  logo: '/programmes/partner-ms.png'  },
      { name: 'Startup Village',      logo: '/programmes/partner-sv.png'  },
    ],
    createdAt: new Date('2026-02-20'),
    updatedAt: new Date(),
  },

  /* ══════════════════════════════════════════════
     3. AGRITECH 2026
  ══════════════════════════════════════════════ */
  {
    slug: 'agritech-2026',
    titre: 'Programme AgriTech 2026',
    description: "Programme d'accélération dédié aux startups qui transforment l'agriculture tunisienne et africaine grâce à la technologie.\n\nFace aux défis climatiques, hydriques et de productivité, l'AgriTech représente une opportunité stratégique majeure pour la Tunisie. Ce programme de 4 mois accompagne 6 startups innovantes dans les domaines de l'agriculture de précision, la gestion de l'eau, la chaîne d'approvisionnement agricole et les marchés numériques.",
    sector: 'AgriTech',
    status: 'published',
    dateDebut: new Date('2026-05-01'),
    dateFin:   new Date('2026-08-31'),
    quota: 6,
    formulaire: 'Formulaire AgriTech',
    jury: ['Yassine Ben Salah', 'Ahmed Khedher', 'Fatma Trabelsi'],
    image: '/programmes/agritech-hero.jpg',
    logo:  '/programmes/agritech-logo.png',
    subSectors: ['Agriculture de précision', 'Gestion de l\'eau', 'Marketplace agricole', 'Agroalimentaire', 'Chaîne froide'],
    objectives: [
      'Accompagner 6 startups AgriTech sur 4 mois en immersion terrain',
      'Connecter avec 30+ coopératives agricoles et GDA partenaires',
      'Développer des solutions adaptées aux petits agriculteurs tunisiens',
      'Faciliter l\'accès aux financements agricoles et fonds verts',
      'Organiser un Demo Day avec les acteurs institutionnels du secteur (MARHP, APIA)',
    ],
    criteria: [
      'Solution technologique appliquée à l\'agriculture ou à l\'agroalimentaire',
      'Prototype fonctionnel testé en conditions réelles (terrain ou laboratoire)',
      'Compréhension des enjeux agricoles tunisiens et africains',
      'Équipe pluridisciplinaire (tech + agronome ou expert terrain)',
      'Impact mesurable : rendement, économie d\'eau, réduction pertes post-récolte',
    ],
    phases: [
      { label: 'Appel à candidatures',    date: '01 Mar — 30 Avr 2026', done: false, statut: 'pending' },
      { label: 'Sélection & visites',     date: '01 — 20 Mai 2026',     done: false, statut: 'pending' },
      { label: 'Immersion terrain',       date: 'Juin 2026',            done: false, statut: 'pending' },
      { label: 'Développement & scale',   date: 'Juillet 2026',         done: false, statut: 'pending' },
      { label: 'Demo Day AgriTech',       date: '31 Août 2026',         done: false, statut: 'pending' },
    ],
    benefits: [
      { label: 'Accès terrain',           desc: '30+ coopératives et exploitations agricoles partenaires pour tester et déployer' },
      { label: 'Mentor agronome',         desc: 'Expert agronome + expert tech pour un accompagnement pluridisciplinaire' },
      { label: 'Financements verts',      desc: 'Accès aux fonds verts, FIDA, BM et financements spéciaux agriculture' },
      { label: 'Laboratoires test',       desc: 'Accès aux laboratoires INAT, INRAT et centres techniques agricoles' },
      { label: 'Réseau institutionnel',   desc: 'Connexion directe MARHP, APIA, CRDA et coopératives régionales' },
      { label: 'Startup Village',         desc: 'Bureaux équipés et salles de réunion au Startup Village Medianet' },
    ],
    stats: null,
    testimonials: [],
    gallery: [],
    partners: [
      { name: 'MARHP',          logo: '/programmes/partner-marhp.png' },
      { name: 'APIA',           logo: '/programmes/partner-apia.png'  },
      { name: 'Startup Village',logo: '/programmes/partner-sv.png'    },
    ],
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date(),
  },

  /* ══════════════════════════════════════════════
     4. CLEANTECH 2026
  ══════════════════════════════════════════════ */
  {
    slug: 'cleantech-2026',
    titre: 'Programme CleanTech 2026',
    description: "Programme d'accélération pour les startups qui développent des solutions durables : énergie renouvelable, efficacité énergétique, gestion des déchets et technologies vertes adaptées au contexte nord-africain.\n\nFace à l'urgence climatique et aux objectifs de transition énergétique de la Tunisie (PROSOL, ELMED), ce programme de 4 mois offre aux CleanTech un accompagnement technique, réglementaire et commercial pour scaler rapidement leurs solutions.",
    sector: 'CleanTech',
    status: 'published',
    dateDebut: new Date('2026-06-01'),
    dateFin:   new Date('2026-09-30'),
    quota: 6,
    formulaire: 'Formulaire CleanTech',
    jury: ['Yassine Ben Salah', 'Dr. Mounir Bouzaiane', 'Leila Hamrouni'],
    image: '/programmes/cleantech-hero.jpg',
    logo:  '/programmes/cleantech-logo.png',
    subSectors: ['Énergie solaire', 'Efficacité énergétique', 'Gestion des déchets', 'Eau et assainissement', 'Mobilité verte'],
    objectives: [
      'Accélérer 6 startups CleanTech à fort impact environnemental',
      'Faciliter les certifications et agréments réglementaires (ANME, ONAS)',
      'Connecter avec les bailleurs de fonds verts et investisseurs ESG',
      'Développer des pilotes avec les collectivités locales et entreprises partenaires',
      'Présenter les solutions au Demo Day Green Tech devant décideurs et médias',
    ],
    criteria: [
      'Solution CleanTech avec impact environnemental démontrable et quantifiable',
      'Prototype ou POC fonctionnel avec données de performance réelles',
      'Conformité aux normes environnementales tunisiennes et internationales',
      'Modèle économique viable avec potentiel d\'impact à l\'échelle',
      'Équipe engagée avec expertise technique ET sectorielle (énergie, eau, déchets)',
    ],
    phases: [
      { label: 'Appel à candidatures',    date: '01 Avr — 31 Mai 2026', done: false, statut: 'pending' },
      { label: 'Sélection & due diligence',date: '01 — 20 Jun 2026',    done: false, statut: 'pending' },
      { label: 'Démarrage programme',     date: '01 Jul 2026',          done: false, statut: 'pending' },
      { label: 'Pilotes terrain',         date: 'Juillet — Août 2026',  done: false, statut: 'pending' },
      { label: 'Demo Day Green',          date: '30 Sep 2026',          done: false, statut: 'pending' },
    ],
    benefits: [
      { label: 'Certifications & agréments', desc: 'Accompagnement ANME, ONAS, normes ISO 14001 et certifications environnementales' },
      { label: 'Financements verts',      desc: 'Accès SUNREF, Green Climate Fund, BEI et fonds verts spécialisés' },
      { label: 'Pilotes municipaux',      desc: 'Partenariats avec 5 municipalités et entreprises industrielles partenaires' },
      { label: 'Mentor CleanTech',        desc: 'Expert ingénieur en énergies renouvelables et consultant ESG senior' },
      { label: 'Startup Village',         desc: 'Espaces co-working et laboratoires de prototypage au Startup Village' },
      { label: 'Visibilité internationale', desc: 'Participation aux salons verts régionaux et conférences COP partenaires' },
    ],
    stats: null,
    testimonials: [],
    gallery: [],
    partners: [
      { name: 'ANME',           logo: '/programmes/partner-anme.png' },
      { name: 'Startup Village',logo: '/programmes/partner-sv.png'   },
    ],
    createdAt: new Date('2026-03-10'),
    updatedAt: new Date(),
  },

  /* ══════════════════════════════════════════════
     5. AI/ML 2026
  ══════════════════════════════════════════════ */
  {
    slug: 'aiml-2026',
    titre: 'Programme AI/ML 2026',
    description: "Programme d'accélération pour les startups qui utilisent l'intelligence artificielle et le machine learning pour résoudre des problèmes complexes à fort impact social et économique.\n\nL'IA représente une révolution industrielle. Ce programme de 4 mois accompagne 5 startups qui développent des algorithmes propriétaires, des modèles de données ou des applications IA dans des secteurs clés : santé, finance, agriculture, éducation ou industrie.",
    sector: 'AI/ML',
    status: 'published',
    dateDebut: new Date('2026-06-01'),
    dateFin:   new Date('2026-09-30'),
    quota: 5,
    formulaire: 'Formulaire AI/ML',
    jury: ['Dr. Nizar Rokbani', 'Emna Turki', 'Maher Ben Salem'],
    image: '/programmes/aiml-hero.jpg',
    logo:  '/programmes/aiml-logo.png',
    subSectors: ['Computer Vision', 'NLP / LLM', 'Predictive Analytics', 'MLOps', 'IA générative'],
    objectives: [
      'Accélérer 5 startups IA avec des cas d\'usage à fort impact réel',
      'Accompagner la production et le déploiement des modèles ML en production',
      'Connecter avec les grandes entreprises et ETI pour des projets pilotes',
      'Structurer la propriété intellectuelle et les modèles de licensing IA',
      'Préparer les startups pour des levées de fonds Seed ou Série A',
    ],
    criteria: [
      'Algorithme ou modèle ML propriétaire avec avantage compétitif démontrable',
      'Data scientist ou ML engineer senior dans l\'équipe fondatrice',
      'Cas d\'usage IA appliqué à un problème réel avec données disponibles',
      'Prototype fonctionnel avec métriques de performance documentées (F1, AUC...)',
      'Potentiel de passage à l\'échelle et déploiement cloud (AWS, GCP, Azure)',
    ],
    phases: [
      { label: 'Appel à candidatures',    date: '01 Avr — 31 Mai 2026', done: false, statut: 'pending' },
      { label: 'Sélection technique',     date: '01 — 20 Jun 2026',     done: false, statut: 'pending' },
      { label: 'Kickoff & sprints IA',    date: '01 Jul 2026',          done: false, statut: 'pending' },
      { label: 'Pilotes entreprises',     date: 'Juillet — Août 2026',  done: false, statut: 'pending' },
      { label: 'Demo Day AI/ML',          date: '30 Sep 2026',          done: false, statut: 'pending' },
    ],
    benefits: [
      { label: 'GPU Computing',           desc: 'Accès à des ressources GPU cloud pour entraîner vos modèles ML (crédits AWS/GCP)' },
      { label: 'Mentor IA senior',        desc: 'Chercheur en IA + CTO expérimenté pour 6h/semaine de coaching technique' },
      { label: 'Données partenaires',     desc: 'Accès à des datasets exclusifs via les entreprises partenaires du programme' },
      { label: 'Pilotes entreprises',     desc: 'Connexion directe avec 15+ entreprises cherchant des solutions IA' },
      { label: 'MLOps & déploiement',     desc: 'Formation aux meilleures pratiques MLOps, CI/CD pour modèles ML' },
      { label: 'Levée de fonds',          desc: 'Préparation pitch deck technique, data room et mise en relation investisseurs tech' },
    ],
    stats: null,
    testimonials: [],
    gallery: [],
    partners: [
      { name: 'Microsoft Azure',  logo: '/programmes/partner-azure.png' },
      { name: 'Startup Village',  logo: '/programmes/partner-sv.png'    },
    ],
    createdAt: new Date('2026-03-15'),
    updatedAt: new Date(),
  },

  /* ══════════════════════════════════════════════
     6. CANDIDATURES SPONTANÉES
  ══════════════════════════════════════════════ */
  {
    slug: 'candidatures-spontanees',
    titre: 'Candidatures Spontanées',
    description: "Votre projet innovant ne rentre dans aucun programme sectoriel actif ? Soumettez votre dossier en candidature spontanée. Notre équipe de sélection examine chaque dossier individuellement et vous recontacte sous 48h.\n\nNous acceptons toutes les innovations à fort potentiel, quel que soit le secteur. Si votre projet est convaincant, nous créons un parcours d'accompagnement sur-mesure adapté à vos besoins spécifiques.",
    sector: 'Tous secteurs',
    status: 'published',
    dateDebut: new Date('2026-01-01'),
    dateFin:   new Date('2026-12-31'),
    quota: null,
    formulaire: 'Formulaire de Base',
    jury: [],
    image: '/programmes/spontanee-hero.jpg',
    objectives: [
      'Évaluer chaque candidature avec attention et bienveillance sous 48h',
      'Proposer un parcours d\'accompagnement sur-mesure si le projet est retenu',
      'Connecter les porteurs de projets avec les bons mentors et ressources',
    ],
    criteria: [
      'Projet innovant avec potentiel de disruption sectorielle',
      'Équipe motivée et engagée dans la durée',
      'Vision claire du marché cible et du problème à résoudre',
    ],
    phases: [],
    benefits: [],
    stats: null,
    testimonials: [],
    gallery: [],
    partners: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date(),
  },

  /* ══════════════════════════════════════════════
     7. HEALTHTECH 2025 (clôturé)
  ══════════════════════════════════════════════ */
  {
    slug: 'healthtech-2025',
    titre: 'Programme HealthTech 2025',
    description: 'Programme passé — santé numérique, télémédecine et dispositifs médicaux connectés.\n\nLa cohorte 2025 a accompagné 8 startups HealthTech pendant 4 mois. Résultats remarquables : 3,2M DT de levées de fonds, 2 startups labellisées et 7 solutions déployées dans des établissements de santé partenaires.',
    sector: 'HealthTech',
    status: 'closed',
    dateDebut: new Date('2025-06-01'),
    dateFin:   new Date('2025-09-30'),
    quota: 8,
    formulaire: 'Formulaire HealthTech',
    jury: ['Amira Hamdani', 'Dr. Sami Boubaker'],
    image: '/programmes/healthtech-hero.jpg',
    logo:  '/programmes/healthtech-logo.png',
    subSectors: ['Télémédecine', 'Dispositifs médicaux', 'Santé numérique', 'Santé mentale', 'Pharmatech'],
    objectives: [
      'Accompagner 8 startups HealthTech à impact médical démontré',
      'Faciliter les certifications CE et agréments Ministère de la Santé',
      'Déployer des pilotes dans 5 établissements de santé partenaires',
      'Accélérer les levées de fonds Seed dans le secteur santé',
    ],
    criteria: [
      'Solution avec impact direct sur la qualité des soins ou l\'accès à la santé',
      'Conformité aux normes médicales (ISO 13485, CE marking)',
      'Équipe avec expertise médicale ET technologique',
    ],
    phases: [
      { label: 'Dépôt des candidatures', date: 'Avr — Mai 2025',       done: true, statut: 'done' },
      { label: 'Sélection',              date: 'Mai — Juin 2025',       done: true, statut: 'done' },
      { label: 'Programme intensif',     date: 'Jun — Sep 2025',        done: true, statut: 'done' },
      { label: 'Demo Day HealthTech',    date: '30 Sep 2025',           done: true, statut: 'done' },
    ],
    benefits: [
      { label: 'Accès cliniques',        desc: '5 cliniques et hôpitaux partenaires pour pilotes médicaux' },
      { label: 'Certifications médicales', desc: 'Accompagnement CE marking, ISO 13485 et agréments nationaux' },
      { label: 'Mentors médicaux',       desc: 'Médecins spécialistes et directeurs d\'établissements partenaires' },
    ],
    stats: {
      startups:        8,
      labelStartup:    2,
      commercialisent: 7,
      leveesFonds:     3,
      sessions:        32,
    },
    testimonials: [
      {
        name:    'Dr. Ines Mejri',
        company: 'TelemedTN',
        text:    "Le programme HealthTech nous a permis de déployer notre solution dans 3 cliniques en moins de 4 mois. L'accès aux professionnels de santé partenaires était inestimable pour valider notre produit.",
      },
    ],
    gallery: [
      '/programmes/healthtech-gallery-1.jpg',
      '/programmes/healthtech-gallery-2.jpg',
      '/programmes/healthtech-gallery-3.jpg',
    ],
    partners: [
      { name: 'Clinique Taoufik', logo: '/programmes/partner-taoufik.png' },
      { name: 'Startup Village',  logo: '/programmes/partner-sv.png'      },
    ],
    createdAt: new Date('2025-04-01'),
    updatedAt: new Date(),
  },

  /* ══════════════════════════════════════════════
     8. FOODSTART 2ÈME ÉDITION
  ══════════════════════════════════════════════ */
  {
    slug: 'foodstart-2',
    titre: 'FoodStart 2ème Édition',
    description: "Programme d'incubation FoodTech de 6 mois — Agritech, Food services, Livraison, Science de l'alimentation et Consumer tech. Transformez votre vision en réalité avec FoodStart.\n\nLe programme FoodStart est le premier programme d'incubation spécialisé FoodTech en Tunisie. En partenariat avec Medianet Incubator, il accompagne les startups qui réinventent la façon dont nous produisons, distribuons et consommons la nourriture en Afrique du Nord.",
    sector: 'FoodTech',
    status: 'published',
    dateDebut: new Date('2025-09-01'),
    dateFin:   new Date('2026-05-24'),
    quota: 8,
    formulaire: 'Formulaire FoodTech',
    jury: ['Experts FoodStart', 'Nabil Farhat', 'Sana Mejri'],
    image: '/programmes/foodstart-hero.jpg',
    logo:  '/programmes/foodstart-logo.jpg',
    subSectors: ['Agritech', 'Food services', 'Livraison', "Science de l'alimentation", "Chaine d'approvisionnement", 'Consumer tech'],
    objectives: [
      '8 startups FoodTech accompagnées sur 6 mois intensifs',
      'Demo Day public le 24 Mai 2026 avec 100+ invités',
      '10h de mentoring 1-to-1 par mois par startup',
      'Accès au Startup Village Medianet (2500m²)',
      'Déploiement dans 350+ restaurants et clients partenaires',
    ],
    criteria: [
      'Projet dans la FoodTech (Agritech, Food services, Livraison…)',
      'Équipe fondatrice engagée à temps plein sur le projet',
      'MVP ou prototype fonctionnel avec premiers retours clients',
      'Marché tunisien ou africain ciblé avec potentiel de croissance',
    ],
    phases: [
      { label: 'Sourcing',               date: 'Septembre 2025',             done: true,  statut: 'done'        },
      { label: 'Sélection candidatures', date: 'Octobre 2025',               done: true,  statut: 'done'        },
      { label: 'Pitch day',              date: 'Novembre 2025',              done: true,  statut: 'done'        },
      { label: 'Accompagnement 6 mois',  date: 'Décembre 2025 — Avril 2026', done: false, statut: 'in-progress' },
      { label: 'Demo Day FoodStart',     date: '24 Mai 2026',                done: false, statut: 'pending'     },
    ],
    benefits: [
      { label: 'Plateformes de test',      desc: 'Accès à des laboratoires de test culinaires, un restaurant et plus de 350 clients' },
      { label: 'Accès au marché',          desc: 'Les startups connectées avec des entreprises partenaires pour implémenter leurs solutions' },
      { label: 'Startup Village',          desc: "2500m² dédiés à l'innovation et à la création, accès gratuit" },
      { label: 'Programme de mentoring',   desc: '10h de sessions 1-to-1 par mois tout le long du programme' },
      { label: 'Expertise FoodTech',       desc: 'Commercialisation spécifique FoodTech, branding, dev produit, marketing' },
      { label: 'Accompagnement Prototype', desc: 'Les startups accompagnées dans la création et le test de leurs prototypes' },
    ],
    stats: {
      startups:        8,
      labelStartup:    2,
      commercialisent: 7,
      leveesFonds:     2,
      sessions:        22,
    },
    testimonials: [
      {
        name:    'Achref Mrabet',
        company: 'UKLA',
        photo:   '/programmes/testimonial-achref.jpg',
        text:    "The biggest advantage of being in the Medianet incubator is having direct access to people with 25 years of experience. You'll make real friendships with other entrepreneurs in Startup Village, it really feels like home.",
      },
      {
        name:    'Anis Ben Ghali',
        company: 'CHITELIX',
        photo:   '/programmes/testimonial-anis.jpg',
        text:    "Le programme FoodStart a été pour nous la révélation du potentiel de notre projet. La visibilité et la qualité de la formation reçue nous a permis de labéliser notre startup et d'accélérer notre levée de fond.",
      },
    ],
    gallery: [
      '/programmes/foodstart-gallery-1.jpg',
      '/programmes/foodstart-gallery-2.jpg',
      '/programmes/foodstart-gallery-3.jpg',
      '/programmes/foodstart-gallery-4.jpg',
      '/programmes/foodstart-gallery-5.jpg',
      '/programmes/foodstart-gallery-7.jpg',
      '/programmes/foodstart-gallery-8.jpg',
      '/programmes/foodstart-gallery-9.jpg',
      '/programmes/foodstart-gallery-10.jpg',
      '/programmes/foodstart-gallery-11.jpg',
      '/programmes/foodstart-gallery-12.jpg',
    ],
    partners: [
      { name: 'FFBD Consulting', logo: '/programmes/partner-ffbd.png'  },
      { name: 'Magic Hotels',    logo: '/programmes/partner-magic.png' },
      { name: 'Plan B',          logo: '/programmes/partner-planb.png' },
      { name: 'Startup Village', logo: '/programmes/partner-sv.png'    },
    ],
    createdAt: new Date('2025-08-01'),
    updatedAt: new Date(),
  },
];

async function seed() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const dbName = process.env.MONGO_URI.split('/').pop().split('?')[0];
  const db = client.db(dbName);

  await db.collection('programmes').deleteMany({});
  const result = await db.collection('programmes').insertMany(data);

  console.log(`\n✅ ${result.insertedCount} programmes insérés avec succès\n`);

  const inserted = await db.collection('programmes')
    .find({}, { projection: { slug: 1, titre: 1, sector: 1, status: 1, _id: 1 } })
    .toArray();

  inserted.forEach(p =>
    console.log(`  [${p.status.padEnd(10)}] ${p.sector.padEnd(14)} — ${p.titre}`)
  );

  await client.close();
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });