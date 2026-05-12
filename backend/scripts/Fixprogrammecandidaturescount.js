// scripts/fixProgrammeCandidaturesCount.js
// Recalcule et corrige le compteur "candidatures" de chaque programme
// en comptant les applications liées dans la collection applications.
//
// Usage: node scripts/fixProgrammeCandidaturesCount.js

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/medianet_db';

async function fix() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const dbName = MONGO_URI.split('/').pop().split('?')[0];
    const db = client.db(dbName);
    console.log(`\n✅ MongoDB connecté : ${dbName}\n`);

    // ── 1. Charger tous les programmes ─────────────────────────
    const programmes = await db.collection('programmes').find({}).toArray();
    console.log(`📋 ${programmes.length} programmes trouvés`);

    // ── 2. Charger toutes les candidatures ─────────────────────
    const applications = await db.collection('applications').find({}).toArray();
    console.log(`📦 ${applications.length} candidatures au total\n`);

    // ── 3. Pour chaque programme, compter les candidatures ──────
    // On cherche par : programmeId (ObjectId) OU programmeName (string)
    console.log('── Mise à jour des compteurs ──────────────────────────');

    let totalLinked = 0;

    for (const prog of programmes) {
      const titre = prog.titre || prog.title || '';
      const progIdStr = prog._id.toString();

      // Compter par programmeId (ObjectId match) OU programmeName (string match)
      const count = applications.filter(app => {
        const byId   = app.programmeId   && app.programmeId.toString() === progIdStr;
        const byName = app.programmeName && app.programmeName === titre;
        return byId || byName;
      }).length;

      // Mettre à jour le programme avec le bon compteur
      await db.collection('programmes').updateOne(
        { _id: prog._id },
        {
          $set: {
            candidatures:    count,
            totalApplicants: count,
            updatedAt:       new Date(),
          }
        }
      );

      totalLinked += count;
      const bar = '█'.repeat(Math.min(count, 20));
      console.log(`   ${titre.padEnd(38)} ${String(count).padStart(3)} candidature(s)  ${bar}`);
    }

    // ── 4. Candidatures sans programme ─────────────────────────
    const unlinked = applications.filter(app =>
      !app.programmeId && !app.programmeName
    ).length;

    console.log('\n── Résumé ─────────────────────────────────────────────');
    console.log(`   Total candidatures       : ${applications.length}`);
    console.log(`   Liées à un programme     : ${totalLinked}`);
    console.log(`   Sans programme           : ${unlinked}`);

    // ── 5. S'assurer que programmeName + programmeId sont cohérents ──
    // Correction : si une app a programmeName mais pas programmeId, on le remplit
    console.log('\n── Correction programmeId manquants ──────────────────');
    let fixed = 0;
    for (const app of applications) {
      if (app.programmeName && !app.programmeId) {
        const prog = programmes.find(p =>
          (p.titre || p.title || '') === app.programmeName
        );
        if (prog) {
          await db.collection('applications').updateOne(
            { _id: app._id },
            { $set: { programmeId: prog._id, updatedAt: new Date() } }
          );
          fixed++;
          console.log(`   ✓ ${(app.startupName||'N/A').padEnd(20)} → programmeId ajouté (${app.programmeName})`);
        }
      }
      // Correction inverse : si programmeId mais pas programmeName
      if (app.programmeId && !app.programmeName) {
        const prog = programmes.find(p =>
          p._id.toString() === app.programmeId.toString()
        );
        if (prog) {
          const titre = prog.titre || prog.title || '';
          await db.collection('applications').updateOne(
            { _id: app._id },
            { $set: { programmeName: titre, updatedAt: new Date() } }
          );
          fixed++;
          console.log(`   ✓ ${(app.startupName||'N/A').padEnd(20)} → programmeName ajouté (${titre})`);
        }
      }
    }
    if (fixed === 0) console.log('   Tous les liens programmeId ↔ programmeName sont cohérents.');

    // ── 6. Recompter après corrections ─────────────────────────
    console.log('\n── Recompte final après corrections ──────────────────');
    for (const prog of programmes) {
      const titre    = prog.titre || prog.title || '';
      const progIdStr = prog._id.toString();
      const allApps  = await db.collection('applications').find({}).toArray();
      const count    = allApps.filter(app => {
        const byId   = app.programmeId   && app.programmeId.toString() === progIdStr;
        const byName = app.programmeName && app.programmeName === titre;
        return byId || byName;
      }).length;

      if (count > 0) {
        await db.collection('programmes').updateOne(
          { _id: prog._id },
          { $set: { candidatures: count, totalApplicants: count } }
        );
        console.log(`   ✅ ${titre.padEnd(38)} → ${count} candidature(s)`);
      }
    }

    console.log('\n══════════════════════════════════════════════════════');
    console.log('✅ Compteurs mis à jour. Rechargez la page programmes.');
    console.log('══════════════════════════════════════════════════════\n');

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

fix();