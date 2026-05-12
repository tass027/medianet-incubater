// scripts/fixLinaJury.js
// Fix COMPLET pour Lina :
// 1. Crée/met à jour la fiche jury avec assignedProgrammeIds
// 2. Assigne Lina sur les candidatures (collection applications)
// 3. Assigne Lina sur les User.applications (embedded)
//
// Usage: node scripts/fixLinaJury.js

require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('../src/models/User');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/medianet_db';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected\n');

  const db      = mongoose.connection;
  const juryCol = db.collection('jury');
  const appsCol = db.collection('applications');

  // ── 1. Trouver le User Lina ─────────────────────────────────────
  const linaUser = await User.findOne({
    email: { $in: ['lina.jury@medianet.tn', 'lina.oueslati@mentor.medianet.tn'] }
  });

  if (!linaUser) {
    console.error('❌ User Lina introuvable. Lance d\'abord: node scripts/seedMentorJuryAccounts.js');
    process.exit(1);
  }
  console.log(`👤 User: ${linaUser.name} (${linaUser.email}) — _id: ${linaUser._id}`);

  // ── 2. Trouver les programmes FinTech + EdTech ──────────────────
  const programmes = await db.collection('programmes').find({
    $or: [
      { titre: { $regex: /FinTech|EdTech/i } },
      { name:  { $regex: /FinTech|EdTech/i } },
    ]
  }).toArray();

  const progIds   = programmes.map(p => p._id);
  const progNames = programmes.map(p => p.titre || p.name || '');

  console.log(`\n📋 Programmes assignés à Lina:`);
  programmes.forEach(p => console.log(`   • ${p.titre || p.name} [${p._id}]`));

  // ── 3. Upsert fiche jury ────────────────────────────────────────
  const juryRecord = {
    name:                 linaUser.name,
    email:                linaUser.email,
    post:                 'Directrice Innovation',
    company:              'MediaNet',
    expertise:            ['FinTech', 'EdTech'],
    status:               'active',
    userId:               linaUser._id,
    linkedAt:             new Date(),
    assignedProgrammes:   progNames,
    assignedProgrammeIds: progIds,
    evaluationsCount:     0,
    evaluations:          [],
    isActive:             true,
    role:                 'jury',
    updatedAt:            new Date(),
  };

  const existingJury = await juryCol.findOne({ email: linaUser.email });
  if (existingJury) {
    await juryCol.updateOne({ email: linaUser.email }, { $set: juryRecord });
    console.log(`\n✅ Fiche jury mise à jour`);
  } else {
    await juryCol.insertOne({ ...juryRecord, createdAt: new Date() });
    console.log(`\n✅ Fiche jury créée`);
  }

  // ── 4. Mettre à jour mentorRoles du User ────────────────────────
  await User.findByIdAndUpdate(linaUser._id, {
    $addToSet: { mentorRoles: 'jury' },
    isActive: true, isApproved: true, isEmailVerified: true,
  });
  console.log(`✅ mentorRoles['jury'] ajouté au User`);

  // ── 5. Assigner Lina dans collection applications ───────────────
  console.log(`\n── Assignation dans collection applications ───────────────`);

  let assignedCount = 0;

  if (progIds.length > 0) {
    const appsById   = await appsCol.find({ programmeId:   { $in: progIds   } }).toArray();
    const appsByName = await appsCol.find({ programmeName: { $in: progNames } }).toArray();

    // Dédupliquer
    const allApps = [...appsById];
    appsByName.forEach(a => {
      if (!allApps.find(x => x._id.toString() === a._id.toString())) allApps.push(a);
    });

    console.log(`   ${allApps.length} candidature(s) trouvée(s)`);

    for (const app of allApps) {
      const alreadyIn = (app.juryIds || []).map(id => id.toString()).includes(linaUser._id.toString());
      if (!alreadyIn) {
        await appsCol.updateOne(
          { _id: app._id },
          {
            $addToSet: { juryIds: linaUser._id, juryAssigned: linaUser.name },
            $set:      { updatedAt: new Date() }
          }
        );
        assignedCount++;
        const name = app.startupName || app.project?.startupName || 'N/A';
        console.log(`   ✅ ${name.padEnd(22)} [${app.status}] — ${app.programmeName || '?'}`);
      } else {
        const name = app.startupName || app.project?.startupName || 'N/A';
        console.log(`   ⏩ Déjà assigné : ${name}`);
      }
    }
  } else {
    console.log(`   ⚠️  Aucun programme trouvé — assigne sur toutes les candidatures reviewing/interview`);
    const fallbackApps = await appsCol.find({
      status: { $in: ['reviewing', 'interview', 'accepted'] }
    }).limit(10).toArray();

    for (const app of fallbackApps) {
      await appsCol.updateOne(
        { _id: app._id },
        {
          $addToSet: { juryIds: linaUser._id, juryAssigned: linaUser.name },
          $set:      { updatedAt: new Date() }
        }
      );
      assignedCount++;
      console.log(`   ✅ ${(app.startupName || 'N/A').padEnd(22)} [${app.status}]`);
    }
  }

  // ── 6. Assigner Lina dans User.applications (embedded) ──────────
  console.log(`\n── Assignation dans User.applications (embedded) ──────────`);

  let embeddedCount = 0;
  const query = progIds.length > 0
    ? { 'applications.programmeId': { $in: progIds } }
    : { 'applications.status': { $in: ['reviewing', 'interview', 'accepted'] } };

  const usersWithApps = await User.find(query).select('name email applications');

  for (const u of usersWithApps) {
    let changed = false;
    for (let i = 0; i < u.applications.length; i++) {
      const app    = u.applications[i];
      const inProg = progIds.length === 0 || progIds.some(id => id.toString() === app.programmeId?.toString());
      if (!inProg) continue;
      const alreadyIn = (app.assignedJury || []).map(id => id.toString()).includes(linaUser._id.toString());
      if (!alreadyIn) {
        u.applications[i].assignedJury = [...(app.assignedJury || []), linaUser._id];
        changed = true;
        embeddedCount++;
        console.log(`   ✅ ${u.name} — ${app.programmeName} [${app.status}]`);
      }
    }
    if (changed) await u.save();
  }

  if (embeddedCount === 0) console.log(`   (aucune candidature embedded à mettre à jour)`);

  // ── 7. Résumé ───────────────────────────────────────────────────
  const totalAssigned = await appsCol.countDocuments({ juryIds: linaUser._id });

  console.log(`\n══════════════════════════════════════════════════════════`);
  console.log(`✅ FIX TERMINÉ`);
  console.log(`   • Fiche jury         : OK (userId lié)`);
  console.log(`   • Programmes assignés: ${progIds.length}`);
  console.log(`   • Apps assignées     : ${assignedCount} nouvelles / ${totalAssigned} total`);
  console.log(`   • Embedded apps      : ${embeddedCount}`);
  console.log(`\n   → Relance : node scripts/testLinaAccess.js`);
  console.log(`══════════════════════════════════════════════════════════\n`);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌', err.message);
  console.error(err.stack);
  process.exit(1);
});