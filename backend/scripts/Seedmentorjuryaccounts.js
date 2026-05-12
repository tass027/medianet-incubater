// scripts/seedMentorJuryAccounts.js
// Usage: node scripts/seedMentorJuryAccounts.js
//
// Crée 3 types de comptes dans la base :
//   1. Mentor seul      → espace mentor uniquement
//   2. Jury seul        → espace jury uniquement
//   3. Mentor + Jury    → les deux espaces en même temps

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../src/models/User');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/medianet_db';

// ─────────────────────────────────────────────────────────────────────────────
// COMPTES À CRÉER
// ─────────────────────────────────────────────────────────────────────────────
const ACCOUNTS = [

  // ── 1. MENTOR SEUL ────────────────────────────────────────────────────────
  // Accès : /dashboard/mentor/dashboard uniquement
  // mentorRoles : ['mentor']  →  pas de lien Jury dans la sidebar
  {
    name:            'Ahmed Ben Ali',
    email:           'ahmed.mentor@medianet.tn',
    password:        'Mentor@2026!',
    role:            'mentor',
    mentorRoles:     ['mentor'],   // tableau avec 'mentor' seulement
    isActive:        true,
    isApproved:      true,
    isEmailVerified: true,
    label:           'MENTOR SEUL',
  },

  // ── 2. JURY SEUL ──────────────────────────────────────────────────────────
  // Accès : /dashboard/jury/dashboard uniquement
  // role='jury' → le middleware jurySpaceAccess l'autorise
  // Fiche jury dans collection 'jury' identifiée par email (assignée par admin)
  {
    name:            'Lina Oueslati',
    email:           'lina.jury@medianet.tn',
    password:        'Jury@2026!',
    role:            'jury',
    mentorRoles:     [],           // vide — pas d'espace mentor
    isActive:        true,
    isApproved:      true,
    isEmailVerified: true,
    label:           'JURY SEUL',
  },

  // ── 3. MENTOR + JURY (double rôle) ────────────────────────────────────────
  // Accès : /dashboard/mentor/dashboard (par défaut)
  //       + lien "Jury" dans la sidebar avec badge violet
  //       + /dashboard/jury/dashboard via le lien jury
  // mentorRoles : ['mentor', 'jury']  →  switcher visible dans le dashboard
  {
    name:            'Samir Khelifi',
    email:           'samir.mentor.jury@medianet.tn',
    password:        'MentorJury@2026!',
    role:            'mentor',
    mentorRoles:     ['mentor', 'jury'],  // les deux rôles actifs
    isActive:        true,
    isApproved:      true,
    isEmailVerified: true,
    label:           'MENTOR + JURY (double rôle)',
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// FICHE JURY dans la collection 'jury' (nécessaire pour lina.jury et samir)
// Sans cette fiche, l'espace jury s'affiche mais sans candidatures assignées
// ─────────────────────────────────────────────────────────────────────────────
const JURY_RECORDS = [
  {
    name:              'Lina Oueslati',
    email:             'lina.jury@medianet.tn',
    post:              'Directrice Innovation',
    company:           'MediaNet',
    expertise:         ['FinTech', 'EdTech'],
    status:            'active',
    assignedProgrammes: [],       // l'admin assignera les programmes
    assignedProgrammeIds: [],
    evaluationsCount:  0,
    evaluations:       [],
    isActive:          true,
    isApproved:        true,
    isEmailVerified:   true,
    role:              'jury',
    createdAt:         new Date(),
    updatedAt:         new Date(),
  },
  {
    name:              'Samir Khelifi',
    email:             'samir.mentor.jury@medianet.tn',
    post:              'Expert Senior',
    company:           'MediaNet',
    expertise:         ['SaaS', 'HealthTech', 'B2B'],
    status:            'active',
    assignedProgrammes: [],
    assignedProgrammeIds: [],
    evaluationsCount:  0,
    evaluations:       [],
    isActive:          true,
    isApproved:        true,
    isEmailVerified:   true,
    role:              'jury',
    createdAt:         new Date(),
    updatedAt:         new Date(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅  MongoDB connecté :', MONGO_URI);
    console.log('');
    console.log('── Création des comptes mentor / jury ──────────────────────');

    for (const acc of ACCOUNTS) {
      const { password, label, ...fields } = acc;

      // Vérifier si le compte existe déjà
      const existing = await User.findOne({ email: acc.email });

      if (existing) {
        // Mettre à jour mentorRoles si déjà existant
        await User.findByIdAndUpdate(existing._id, {
          mentorRoles: fields.mentorRoles,
          isActive:    true,
          isApproved:  true,
          isEmailVerified: true,
        });
        console.log(`   [MIS À JOUR]  ${acc.email.padEnd(36)} → ${label}`);
      } else {
        const passwordHash = await bcrypt.hash(password, 12);
        await User.create({ ...fields, passwordHash });
        console.log(`   [CRÉÉ]        ${acc.email.padEnd(36)} → ${label}`);
      }
    }

    console.log('');
    console.log('── Création des fiches jury (collection "jury") ────────────');

    const db = mongoose.connection;

    for (const record of JURY_RECORDS) {
      const existing = await db.collection('jury').findOne({ email: record.email });

      if (existing) {
        await db.collection('jury').updateOne(
          { email: record.email },
          { $set: { ...record, updatedAt: new Date() } }
        );
        console.log(`   [MIS À JOUR]  fiche jury pour ${record.email}`);
      } else {
        await db.collection('jury').insertOne(record);
        console.log(`   [CRÉÉE]       fiche jury pour ${record.email}`);
      }
    }

    // ── Résumé ───────────────────────────────────────────────────────────────
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('  COMPTES DE TEST — MENTOR / JURY');
    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('');
    console.log('  1. MENTOR SEUL');
    console.log('     Email    : ahmed.mentor@medianet.tn');
    console.log('     Password : Mentor@2026!');
    console.log('     Accès    : /dashboard/mentor/dashboard');
    console.log('     Sidebar  : Startups, Sessions, Feedback, Rapports, Ressources');
    console.log('     Jury     : NON (pas de lien Jury dans la sidebar)');
    console.log('');
    console.log('  2. JURY SEUL');
    console.log('     Email    : lina.jury@medianet.tn');
    console.log('     Password : Jury@2026!');
    console.log('     Accès    : /dashboard/jury/dashboard');
    console.log('     Sidebar  : Candidatures, Evaluations');
    console.log('     Mentor   : NON');
    console.log('     Note     : Fiche jury créée. Assigner des programmes via admin.');
    console.log('');
    console.log('  3. MENTOR + JURY (double rôle)');
    console.log('     Email    : samir.mentor.jury@medianet.tn');
    console.log('     Password : MentorJury@2026!');
    console.log('     Accès    : /dashboard/mentor/dashboard (par défaut)');
    console.log('     Sidebar  : Mentor items + lien "Jury" avec badge violet');
    console.log('     Jury     : OUI — lien jury visible dans sidebar');
    console.log('     Note     : Fiche jury créée. Assigner des programmes via admin.');
    console.log('');
    console.log('  CONNEXION : /internal/login  (portail interne MediaNet)');
    console.log('');
    console.log('  APRES CONNEXION — assignation via admin :');
    console.log('  → Aller sur /dashboard/admin/mentors');
    console.log('  → Assigner des startups à ahmed ou samir');
    console.log('  → Aller sur /dashboard/admin/jury');
    console.log('  → Assigner des programmes à lina ou samir');
    console.log('  → Les candidatures apparaitront dans /dashboard/jury/candidatures');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('  ✅  Seed terminé');

  } catch (err) {
    console.error('❌  Erreur seed :', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('  🔌  MongoDB déconnecté.');
  }
}

seed();