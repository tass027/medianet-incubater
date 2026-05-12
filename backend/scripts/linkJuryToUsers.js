// scripts/linkJuryToUsers.js
// Run: node scripts/linkJuryToUsers.js
//
// Ce script :
// 1. Liste tous les docs dans la collection 'jury'
// 2. Pour chaque doc, cherche le User correspondant par email ou nom
// 3. Met à jour le doc jury avec userId si trouvé
// 4. Affiche un rapport complet

require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('../src/models/User');

const DB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/venturebridge';

async function run() {
  await mongoose.connect(DB_URI);
  console.log('✅ MongoDB connecté');

  const db = mongoose.connection;
  const juryCol = db.collection('jury');

  const juryDocs = await juryCol.find({}).toArray();
  console.log(`\n📋 ${juryDocs.length} fiche(s) jury trouvée(s) dans la collection 'jury'\n`);

  if (juryDocs.length === 0) {
    console.log('ℹ️  Aucune fiche jury. Créez-en d\'abord via le panel admin.');
    await mongoose.disconnect();
    return;
  }

  let linked = 0, alreadyLinked = 0, notFound = 0;
  const report = [];

  for (const doc of juryDocs) {
    // Déjà lié ?
    if (doc.userId) {
      const u = await User.findById(doc.userId).select('name email role').lean();
      if (u) {
        report.push({ jury: doc.name || doc.email, status: '✅ Déjà lié', user: `${u.name} (${u.email}) role=${u.role}` });
        alreadyLinked++;
        continue;
      }
    }

    // Cherche par email
    let user = null;
    if (doc.email) {
      user = await User.findOne({
        email: doc.email.toLowerCase().trim(),
        role: { $in: ['jury', 'mentor'] },
      }).select('name email role mentorRoles').lean();
    }

    // Cherche par nom si email not found
    if (!user && doc.name) {
      const nameParts = doc.name.trim().split(/\s+/);
      user = await User.findOne({
        name: { $regex: new RegExp(nameParts.join('.*'), 'i') },
        role: { $in: ['jury', 'mentor'] },
      }).select('name email role mentorRoles').lean();
    }

    if (user) {
      await juryCol.updateOne(
        { _id: doc._id },
        { $set: { userId: user._id, linkedAt: new Date() } }
      );
      report.push({ jury: doc.name || doc.email, status: '🔗 Lié maintenant', user: `${user.name} (${user.email}) role=${user.role}` });
      linked++;
    } else {
      report.push({ jury: doc.name || doc.email, status: '❌ Aucun User trouvé', email: doc.email, hint: `Créez un compte User avec email=${doc.email} et role=jury` });
      notFound++;
    }
  }

  console.log('─'.repeat(60));
  report.forEach(r => {
    console.log(`${r.status}  jury="${r.jury}"`);
    if (r.user) console.log(`           → User: ${r.user}`);
    if (r.hint) console.log(`           → Hint: ${r.hint}`);
  });
  console.log('─'.repeat(60));
  console.log(`\n📊 Résumé : ${linked} liés | ${alreadyLinked} déjà liés | ${notFound} non trouvés`);

  if (notFound > 0) {
    console.log('\n⚠️  Pour les fiches non liées, soit :');
    console.log('   1. Créez un compte User avec le même email et role=jury');
    console.log('   2. Ou modifiez l\'email dans la fiche jury pour matcher le compte existant');
    console.log('   3. Ou ajoutez manuellement userId dans la collection jury');
  }

  // Affiche aussi les Users jury/mentor sans fiche jury
  const juryUsers = await User.find({ role: { $in: ['jury', 'mentor'] } }).select('name email role mentorRoles').lean();
  const linkedIds = (await juryCol.find({ userId: { $exists: true } }).toArray()).map(d => d.userId?.toString());

  const unlinked = juryUsers.filter(u => !linkedIds.includes(u._id.toString()));
  if (unlinked.length > 0) {
    console.log(`\n🔍 Users jury/mentor SANS fiche jury :`);
    unlinked.forEach(u => {
      console.log(`   - ${u.name} (${u.email}) role=${u.role} mentorRoles=${JSON.stringify(u.mentorRoles || [])}`);
    });
  }

  await mongoose.disconnect();
  console.log('\n✅ Terminé');
}

run().catch(err => {
  console.error('❌', err);
  process.exit(1);
});