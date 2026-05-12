/**
 * Script de seed — Catalogue d'investisseurs
 * Données en dinars tunisiens (TND)
 * Usage : node scripts/seedInvestors.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Investor = require('../src/models/Investor');

const INVESTORS = [
  {
    nom: 'Samia Belhadj',
    entreprise: 'AfriCInvest',
    email: 'samia.belhadj@africinvest.com',
    telephone: '+216 71 000 001',
    localisation: 'Tunis, Tunisie',
    type: 'VC',
    bio: "Fonds panafricain leader spécialisé dans les PME à forte croissance à travers le continent africain. Présence dans plus de 25 pays avec un portefeuille diversifié.",
    siteWeb: 'https://africinvest.com',
    secteurs: ['FinTech', 'HealthTech', 'AgriTech'],
    stades: ['Amorçage', 'Série A'],
    ticketMin: 150000,    // ~50K USD en TND
    ticketMax: 1500000,   // ~500K USD en TND
    portfolio: 12,
    totalInvesti: 12600000,
    matches: [
      { nom: 'PayTunis', score: 92, statut: 'validé' },
      { nom: 'DabaDoc TN', score: 78, statut: 'en_attente' },
      { nom: 'AgriSmart', score: 85, statut: 'en_attente' },
    ],
  },
  {
    nom: 'Mehdi Gharbi',
    entreprise: 'BVMT Capital',
    email: 'mehdi.gharbi@bvmt.com.tn',
    telephone: '+216 70 000 002',
    localisation: 'Tunis, Tunisie',
    type: 'Business Angel',
    bio: "Entrepreneur en série et investisseur providentiel spécialisé dans les startups technologiques en phase d'amorçage en Afrique du Nord.",
    siteWeb: 'https://bvmt.com.tn',
    secteurs: ['EdTech', 'SaaS', 'E-commerce'],
    stades: ['Pré-amorçage', 'Amorçage'],
    ticketMin: 30000,
    ticketMax: 300000,
    portfolio: 7,
    totalInvesti: 2550000,
    matches: [
      { nom: 'EduLearn TN', score: 88, statut: 'validé' },
      { nom: 'SolarTech', score: 65, statut: 'rejeté' },
    ],
  },
  {
    nom: 'Leila Mansouri',
    entreprise: 'Flat6Labs Tunis',
    email: 'leila.mansouri@flat6labs.com',
    telephone: '+216 73 000 003',
    localisation: 'Tunis, Tunisie',
    type: 'Accélérateur',
    bio: "Accélérateur et investisseur en phase d'amorçage axé sur la région MENA, accompagnant des fondateurs ambitieux avec du capital et du mentorat.",
    siteWeb: 'https://flat6labs.com',
    secteurs: ['FinTech', 'CleanTech', 'Mobilité'],
    stades: ['Pré-amorçage', 'Amorçage'],
    ticketMin: 75000,
    ticketMax: 450000,
    portfolio: 24,
    totalInvesti: 9300000,
    matches: [
      { nom: 'SolarTech', score: 91, statut: 'en_attente' },
      { nom: 'AgriSmart', score: 74, statut: 'en_attente' },
      { nom: 'PayTunis', score: 80, statut: 'validé' },
    ],
  },
  {
    nom: 'Karim Oueslati',
    entreprise: 'Sawari Ventures',
    email: 'karim@sawariventures.com',
    telephone: '+216 71 000 004',
    localisation: 'Tunis, Tunisie',
    type: 'VC',
    bio: "Fonds VC panafricain axé sur les entreprises technologiques et les startups innovantes en cours d'expansion à travers l'Afrique.",
    siteWeb: 'https://sawariventures.com',
    secteurs: ['HealthTech', 'BioTech'],
    stades: ['Série A', 'Série B'],
    ticketMin: 1500000,
    ticketMax: 15000000,
    portfolio: 18,
    totalInvesti: 66000000,
    matches: [
      { nom: 'DabaDoc TN', score: 95, statut: 'en_attente' },
    ],
  },
  {
    nom: 'Fatima Zahra Alaoui',
    entreprise: 'Fonds National de Financement',
    email: 'fz.alaoui@fnf.tn',
    telephone: '+216 71 000 005',
    localisation: 'Tunis, Tunisie',
    type: 'Fonds Public',
    bio: "Fonds national dédié à l'innovation numérique et à l'entrepreneuriat technologique, soutenant l'écosystème startup tunisien depuis 2010.",
    siteWeb: 'https://fnf.tn',
    secteurs: ['AgriTech', 'CleanTech'],
    stades: ['Amorçage', 'Série A'],
    ticketMin: 300000,
    ticketMax: 3000000,
    portfolio: 9,
    totalInvesti: 19500000,
    matches: [
      { nom: 'AgriSmart', score: 89, statut: 'en_attente' },
      { nom: 'SolarTech', score: 82, statut: 'en_attente' },
    ],
  },
  {
    nom: 'Nabil Khemir',
    entreprise: 'SICAR Tunisie',
    email: 'nabil.khemir@sicar.tn',
    telephone: '+216 71 000 006',
    localisation: 'Tunis, Tunisie',
    type: 'Corporate VC',
    bio: "Société d'investissement en capital à risque tunisienne accompagnant les PME innovantes à travers des prises de participation minoritaires.",
    siteWeb: 'https://sicar.tn',
    secteurs: ['FinTech', 'Logistique', 'SaaS'],
    stades: ['Série A', 'Série B'],
    ticketMin: 500000,
    ticketMax: 5000000,
    portfolio: 15,
    totalInvesti: 35000000,
    matches: [
      { nom: 'PayTunis', score: 87, statut: 'en_attente' },
      { nom: 'LogiTrack', score: 93, statut: 'validé' },
    ],
  },
  {
    nom: 'Sonia Ben Romdhane',
    entreprise: 'Réseau Entreprendre Tunisie',
    email: 'sonia.benromdhane@ret.tn',
    telephone: '+216 72 000 007',
    localisation: 'Sfax, Tunisie',
    type: 'Business Angel',
    bio: "Réseau de chefs d'entreprise engagés qui accompagnent et financent les créateurs d'entreprise à potentiel en Tunisie.",
    siteWeb: 'https://ret.tn',
    secteurs: ['Industrie', 'AgriTech', 'E-commerce'],
    stades: ['Pré-amorçage', 'Amorçage'],
    ticketMin: 20000,
    ticketMax: 150000,
    portfolio: 22,
    totalInvesti: 4400000,
    matches: [],
  },
  {
    nom: 'Tarek Mzabi',
    entreprise: 'Carthage Business Angels',
    email: 'tarek.mzabi@cba.tn',
    telephone: '+216 71 000 008',
    localisation: 'Tunis, Tunisie',
    type: 'Business Angel',
    bio: "Premier réseau de business angels en Tunisie, réunissant des investisseurs privés qui financent et accompagnent les startups en phase précoce.",
    siteWeb: 'https://cba.tn',
    secteurs: ['FinTech', 'EdTech', 'HealthTech', 'SaaS'],
    stades: ['Pré-amorçage', 'Amorçage'],
    ticketMin: 15000,
    ticketMax: 200000,
    portfolio: 31,
    totalInvesti: 7750000,
    matches: [
      { nom: 'TechnoLearn', score: 76, statut: 'en_attente' },
    ],
  },
  {
    nom: 'Ines Jebali',
    entreprise: 'BERD Tunisie',
    email: 'ines.jebali@berd.tn',
    telephone: '+216 71 000 009',
    localisation: 'Tunis, Tunisie',
    type: 'Fonds Public',
    bio: "Banque Européenne pour la Reconstruction et le Développement — bureau Tunisie. Financement des entreprises innovantes à impact social et environnemental.",
    siteWeb: 'https://ebrd.com',
    secteurs: ['CleanTech', 'Industrie', 'FinTech'],
    stades: ['Série A', 'Série B'],
    ticketMin: 3000000,
    ticketMax: 30000000,
    portfolio: 6,
    totalInvesti: 90000000,
    matches: [],
  },
  {
    nom: 'Mounir Ferchichi',
    entreprise: 'StartupTunisia Fund',
    email: 'mounir.ferchichi@startuptunisia.tn',
    telephone: '+216 71 000 010',
    localisation: 'Tunis, Tunisie',
    type: 'Accélérateur',
    bio: "Programme gouvernemental d'accélération et de financement des startups tunisiennes innovantes, en partenariat avec le ministère des Technologies.",
    siteWeb: 'https://startuptunisia.tn',
    secteurs: ['FinTech', 'AgriTech', 'HealthTech', 'EdTech', 'CleanTech'],
    stades: ['Pré-amorçage', 'Amorçage'],
    ticketMin: 60000,
    ticketMax: 600000,
    portfolio: 45,
    totalInvesti: 27000000,
    matches: [
      { nom: 'AgriSmart', score: 90, statut: 'en_attente' },
      { nom: 'PayTunis', score: 84, statut: 'validé' },
      { nom: 'EcoTech', score: 71, statut: 'en_attente' },
    ],
  },
];

async function seedInvestors() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medianet_db');
    console.log('✅ Connecté à MongoDB');

    // Suppression des données existantes
    await Investor.deleteMany({});
    console.log('🗑️  Données existantes supprimées');

    // Insertion des nouveaux investisseurs
    const created = await Investor.insertMany(INVESTORS);
    console.log(`✅ ${created.length} investisseurs créés avec succès`);

    // Résumé
    const stats = {
      total: created.length,
      totalInvesti: created.reduce((s, i) => s + i.totalInvesti, 0),
      totalMatches: created.reduce((s, i) => s + i.matches.length, 0),
    };
    console.log('\n📊 Résumé du catalogue :');
    console.log(`   • Investisseurs : ${stats.total}`);
    console.log(`   • Capital total : ${stats.totalInvesti.toLocaleString('fr-TN')} TND`);
    console.log(`   • Matches totaux : ${stats.totalMatches}`);
    console.log('\n🎉 Seed terminé avec succès !');

  } catch (err) {
    console.error('❌ Erreur lors du seed :', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

seedInvestors();