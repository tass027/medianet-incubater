// scripts/createAdminAccount.js
// Recrée le compte admin mohamed.jerbi@medianet.tn
// Usage: node scripts/createAdminAccount.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/medianet_db';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connecté :', MONGO_URI);

  const db = mongoose.connection;
  const usersCol = db.collection('users');

  // ── Compte admin principal ───────────────────────────────────────
  const ADMIN_ACCOUNTS = [
    {
      name:            'Mohamed Jerbi',
      email:           'mohamed.jerbi@medianet.tn',
      password:        'Admin@2026!',   // ← change après connexion
      role:            'admin',
    },
    // Compte admin de secours (au cas où)
    {
      name:            'Admin MediaNet',
      email:           'admin@medianet.tn',
      password:        'Admin@2026!',
      role:            'admin',
    },
  ];

  console.log('\n── Création / mise à jour des comptes admin ──────────────');

  for (const acc of ADMIN_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(acc.password, 12);

    const existing = await usersCol.findOne({ email: acc.email });

    if (existing) {
      // Mise à jour : reset mot de passe + s'assurer que role=admin
      await usersCol.updateOne(
        { email: acc.email },
        {
          $set: {
            passwordHash,
            role:            'admin',
            isActive:        true,
            isApproved:      true,
            isEmailVerified: true,
            updatedAt:       new Date(),
          }
        }
      );
      console.log(`   [MIS À JOUR] ${acc.email}  →  role=admin, nouveau mot de passe`);
    } else {
      await usersCol.insertOne({
        name:            acc.name,
        email:           acc.email,
        passwordHash,
        role:            'admin',
        isActive:        true,
        isApproved:      true,
        isEmailVerified: true,
        createdAt:       new Date(),
        updatedAt:       new Date(),
      });
      console.log(`   [CRÉÉ]       ${acc.email}  →  role=admin`);
    }
  }

  // ── Vérification finale ──────────────────────────────────────────
  console.log('\n── Vérification des comptes admin en base ────────────────');
  const admins = await usersCol.find({ role: 'admin' }).toArray();
  admins.forEach(a => {
    console.log(`   ✅ ${a.name.padEnd(25)} | ${a.email} | actif=${a.isActive}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  COMPTES ADMIN DISPONIBLES');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Email                          Mot de passe');
  console.log('  ─────────────────────────────────────────────────────────');
  ADMIN_ACCOUNTS.forEach(a => {
    console.log(`  ${a.email.padEnd(35)} ${a.password}`);
  });
  console.log('');
  console.log('  Connexion : http://localhost:3000/internal/login');
  console.log('═══════════════════════════════════════════════════════════');

  await mongoose.disconnect();
  console.log('\n🔌 MongoDB déconnecté.');
}

run().catch(err => {
  console.error('❌ Erreur :', err.message);
  process.exit(1);
});