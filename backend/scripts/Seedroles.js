// scripts/seedRoles.js
// Peuple la collection "roles" avec tous les rôles de la plateforme MediaNet
// Usage: node scripts/seedRoles.js

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/medianet_db';

const ROLES = [
  {
    name: 'admin',
    label: 'Administrateur',
    description: 'Accès complet à toute la plateforme. Gestion des programmes, utilisateurs, candidatures, jury et mentors.',
    permissions: [
      'manage_programmes',
      'manage_applications',
      'manage_users',
      'manage_jury',
      'manage_mentors',
      'manage_investors',
      'manage_forms',
      'view_analytics',
      'export_data',
      'manage_notifications',
      'manage_roles',
    ],
    dashboardPath: '/dashboard/admin',
    color: '#E24B4A',
    icon: 'shield',
    isSystem: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'jury',
    label: 'Membre du Jury',
    description: "Évalue les candidatures assignées. Accès aux dossiers des startups, formulaires d'évaluation et scoring.",
    permissions: [
      'view_assigned_applications',
      'evaluate_applications',
      'view_forms',
      'view_jury_dashboard',
      'submit_evaluations',
      'view_programme_details',
    ],
    dashboardPath: '/dashboard/jury',
    color: '#185FA5',
    icon: 'star',
    isSystem: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'mentor',
    label: 'Mentor',
    description: "Accompagne les startups sélectionnées. Accès aux sessions, feedback, rapports et ressources partagées.",
    permissions: [
      'view_assigned_startups',
      'manage_sessions',
      'submit_feedback',
      'submit_reports',
      'manage_resources',
      'view_mentor_dashboard',
      'view_startup_details',
    ],
    dashboardPath: '/dashboard/mentor',
    color: '#3B6D11',
    icon: 'users',
    isSystem: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'applicant',
    label: 'Candidat / Fondateur',
    description: "Dépose et suit ses candidatures. Accès au portail startup, formulaires de candidature et suivi de dossier.",
    permissions: [
      'submit_application',
      'view_own_applications',
      'upload_documents',
      'view_programme_list',
      'view_startup_dashboard',
      'edit_startup_profile',
    ],
    dashboardPath: '/dashboard/startup',
    color: '#854F0B',
    icon: 'briefcase',
    isSystem: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'investor',
    label: 'Investisseur',
    description: "Consulte les startups et dossiers d'investissement. Accès au catalogue investisseurs et matchmaking.",
    permissions: [
      'view_investor_dashboard',
      'view_startup_catalogue',
      'view_investment_dossiers',
      'manage_matches',
      'view_portfolio',
    ],
    dashboardPath: '/dashboard/investor',
    color: '#534AB7',
    icon: 'trending-up',
    isSystem: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'staff',
    label: 'Staff MediaNet',
    description: "Membre interne de l'équipe MediaNet. Accès en lecture à la plupart des données, sans droits de modification globaux.",
    permissions: [
      'view_applications',
      'view_programmes',
      'view_users',
      'view_analytics',
      'view_jury',
      'view_mentors',
    ],
    dashboardPath: '/dashboard/admin',
    color: '#5F5E5A',
    icon: 'user-check',
    isSystem: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function seed() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const dbName = MONGO_URI.split('/').pop().split('?')[0];
    const db = client.db(dbName);
    console.log(`\n✅ MongoDB connecté : ${dbName}\n`);

    const col = db.collection('roles');

    // ── Supprimer les index problématiques (id: null) ───────────
    try {
      const indexes = await col.indexes();
      for (const idx of indexes) {
        // Supprimer tout index sur un champ "id" (pas "_id") qui cause le conflit
        if (idx.name !== '_id_' && idx.key && idx.key.id !== undefined) {
          await col.dropIndex(idx.name);
          console.log(`🗑  Index supprimé : ${idx.name}`);
        }
      }
    } catch (e) {
      console.log('ℹ️  Aucun index à supprimer ou déjà propre.');
    }

    // Vider et réinsérer
    const existing = await col.countDocuments();
    if (existing > 0) {
      await col.deleteMany({});
      console.log(`🗑  ${existing} rôle(s) existant(s) supprimé(s)\n`);
    }

    await col.insertMany(ROLES);

    console.log('── Rôles insérés ──────────────────────────────────────');
    for (const r of ROLES) {
      const bar = r.permissions.length;
      console.log(`   ✅ ${r.name.padEnd(12)} "${r.label.padEnd(22)}"  ${bar} permission(s)`);
    }

    // Résumé
    console.log('\n══════════════════════════════════════════════════════');
    console.log('RÉSUMÉ');
    console.log('══════════════════════════════════════════════════════');
    console.log(`  Rôles créés        : ${ROLES.length}`);
    console.log(`  Permissions totales: ${ROLES.reduce((s, r) => s + r.permissions.length, 0)}`);
    console.log('');
    console.log('  Rôles disponibles :');
    ROLES.forEach(r => {
      console.log(`    • ${r.name.padEnd(12)} → ${r.dashboardPath}`);
    });
    console.log('\n══════════════════════════════════════════════════════');
    console.log('✅ Collection "roles" peuplée avec succès.');
    console.log('══════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('\n❌ ERREUR :', err.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 MongoDB déconnecté.');
    process.exit(0);
  }
}

seed();