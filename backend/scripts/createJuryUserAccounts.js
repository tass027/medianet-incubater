// scripts/createJuryUserAccounts.js
// Run: node scripts/createJuryUserAccounts.js
//
// Crée les comptes User manquants pour les 5 fiches jury non liées
// puis met à jour leur fiche jury avec le userId

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../src/models/User');

const DB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/venturebridge';

// Mot de passe temporaire — à changer lors de la première connexion
const TEMP_PASSWORD = 'Jury@2025!';

async function run() {
  await mongoose.connect(DB_URI);
  console.log('✅ MongoDB connecté\n');

  const db      = mongoose.connection;
  const juryCol = db.collection('jury');

  // Récupère les fiches jury sans userId
  const unlinked = await juryCol.find({ userId: { $exists: false } }).toArray();
  console.log(`📋 ${unlinked.length} fiche(s) jury sans compte User\n`);

  if (unlinked.length === 0) {
    console.log('✅ Toutes les fiches sont déjà liées.');
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 12);
  let created = 0, skipped = 0;

  for (const doc of unlinked) {
    const email = doc.email?.toLowerCase().trim();
    if (!email) {
      console.log(`⚠️  Fiche "${doc.name}" ignorée : pas d'email`);
      skipped++;
      continue;
    }

    // Vérifie si un User existe déjà avec cet email
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`ℹ️  User existe déjà pour ${email} — liaison uniquement`);
      await juryCol.updateOne(
        { _id: doc._id },
        { $set: { userId: existing._id, linkedAt: new Date() } }
      );
      skipped++;
      continue;
    }

    // Crée le compte User
    const newUser = new User({
      name:            doc.name,
      email,
      passwordHash,
      role:            'jury',
      isActive:        true,
      isApproved:      true,
      isEmailVerified: true,   // créé par admin
      location:        'Tunis',
      mentorRoles:     [],
    });

    await newUser.save();

    // Lie la fiche jury au nouveau User
    await juryCol.updateOne(
      { _id: doc._id },
      { $set: { userId: newUser._id, linkedAt: new Date() } }
    );

    console.log(`✅ Compte créé & lié : ${doc.name} (${email})`);
    created++;
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`📊 ${created} compte(s) créé(s) | ${skipped} ignoré(s)/liés`);
  console.log(`\n🔑 Mot de passe temporaire : ${TEMP_PASSWORD}`);
  console.log('   → Demandez aux membres jury de le changer à leur 1ère connexion');
  console.log('\n🔗 URL de connexion : /internal/login  (espace jury/mentor)');

  await mongoose.disconnect();
  console.log('\n✅ Terminé');
}

run().catch(err => {
  console.error('❌', err);
  process.exit(1);
});