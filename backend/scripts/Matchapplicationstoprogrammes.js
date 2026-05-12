// scripts/matchApplicationsToProgrammes.js
// Distribue toutes les candidatures existantes aux programmes existants
// Usage: node scripts/matchApplicationsToProgrammes.js

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/medianet_db';

// Mapping secteur → programme préféré
const SECTOR_TO_PROGRAMME = {
  'FinTech':    'Programme FinTech 2026',
  'HealthTech': 'HealthTech Boost',
  'AgriTech':   'Programme AgriTech 2026',
  'EdTech':     'Programme EdTech 2026',
  'CleanTech':  'Programme CleanTech 2026',
  'AI/ML':      'Programme AI/ML 2026',
  'FoodTech':   'FoodStart 2ème Édition',
  'E-commerce': 'Candidatures Spontanées',
  'E-Commerce': 'Candidatures Spontanées',
  'Logistique': 'Candidatures Spontanées',
  'Logistics':  'Candidatures Spontanées',
};

// Statuts distribués de façon réaliste selon le volume
const STATUS_POOL = [
  'pending', 'pending', 'pending',
  'reviewing', 'reviewing',
  'interview',
  'approved', 'approved',
  'rejected',
];

const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seed() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const dbName = MONGO_URI.split('/').pop().split('?')[0];
    const db = client.db(dbName);
    console.log(`\n✅ MongoDB connecté : ${dbName}\n`);

    // 1. Charger tous les programmes
    const programmes = await db.collection('programmes').find({}).toArray();
    console.log(`📋 ${programmes.length} programmes trouvés :`);
    programmes.forEach(p => console.log(`   • [${(p.status||'?').padEnd(9)}] ${(p.sector||'?').padEnd(14)} — ${p.titre || p.title || '?'}`));
    console.log('');

    // Construire un index titre → programme
    const progByTitle = {};
    const progBySector = {};
    programmes.forEach(p => {
      const titre = p.titre || p.title || '';
      if (titre) progByTitle[titre] = p;
      const sector = p.sector || '';
      if (sector && sector !== 'Tous secteurs') progBySector[sector] = p;
    });

    // Programme fallback (candidatures spontanées)
    const spontaneProg = programmes.find(p =>
      (p.sector === 'Tous secteurs') ||
      (p.titre || p.title || '').toLowerCase().includes('spontan') ||
      (p.slug || '').includes('spontan')
    ) || programmes[0];

    console.log(`🔁 Programme fallback : ${spontaneProg?.titre || spontaneProg?.title || 'N/A'}\n`);

    // 2. Charger toutes les candidatures
    const applications = await db.collection('applications').find({}).toArray();
    console.log(`📦 ${applications.length} candidatures à traiter\n`);

    if (applications.length === 0) {
      console.log('⚠️  Aucune candidature trouvée. Lancez d\'abord un seed de candidatures.');
      return;
    }

    // 3. Traiter chaque candidature
    let updated = 0;
    let skipped = 0;

    for (const app of applications) {
      const sector = app.sector || app.project?.sector || '';
      const currentProg = app.programmeName;

      // Trouver le bon programme
      let targetProg = null;

      // a) La candidature a déjà un programme valide → vérifier qu'il existe en DB
      if (currentProg && currentProg !== 'null') {
        targetProg = progByTitle[currentProg] || null;
      }

      // b) Pas de programme ou programme introuvable → mapper par secteur
      if (!targetProg) {
        const mappedName = SECTOR_TO_PROGRAMME[sector];
        if (mappedName) {
          targetProg = progByTitle[mappedName] || null;
        }
        // c) Tenter directement par secteur
        if (!targetProg && sector) {
          targetProg = progBySector[sector] || null;
        }
        // d) Fallback spontané
        if (!targetProg) {
          targetProg = spontaneProg;
        }
      }

      if (!targetProg) { skipped++; continue; }

      const titre = targetProg.titre || targetProg.title || '';
      const isSpontaneous = titre.toLowerCase().includes('spontan') || targetProg.sector === 'Tous secteurs';

      // Générer un statut réaliste si absent ou 'submitted'
      let newStatus = app.status;
      if (!newStatus || newStatus === 'submitted') {
        newStatus = rnd(STATUS_POOL);
      }

      // Mise à jour
      await db.collection('applications').updateOne(
        { _id: app._id },
        {
          $set: {
            programmeId:   targetProg._id,
            programmeName: titre,
            type:          isSpontaneous ? 'spontaneous' : 'programme',
            status:        newStatus,
            updatedAt:     new Date(),
          }
        }
      );

      updated++;
      const action = currentProg === titre ? '[CONFIRMÉ]' : '[ASSIGNÉ ]';
      console.log(`   ${action} ${(app.startupName || 'N/A').padEnd(18)} → ${titre} [${newStatus}]`);
    }

    // 4. Mettre à jour les compteurs dans programmes
    console.log('\n── Mise à jour compteurs programmes ──────────────────');
    for (const prog of programmes) {
      const titre = prog.titre || prog.title || '';
      const count = await db.collection('applications').countDocuments({
        programmeId: prog._id
      });
      await db.collection('programmes').updateOne(
        { _id: prog._id },
        { $set: { candidatures: count, updatedAt: new Date() } }
      );
      if (count > 0) console.log(`   ${titre.padEnd(35)} → ${count} candidature(s)`);
    }

    // 5. Résumé
    console.log('\n══════════════════════════════════════════════════════');
    console.log('RÉSUMÉ');
    console.log('══════════════════════════════════════════════════════');
    console.log(`  Candidatures traitées : ${updated}`);
    console.log(`  Ignorées              : ${skipped}`);

    // Répartition par programme
    const byProg = {};
    const allApps = await db.collection('applications').find({}).toArray();
    allApps.forEach(a => {
      const k = a.programmeName || 'Sans programme';
      byProg[k] = (byProg[k] || 0) + 1;
    });
    console.log('\n  Par programme :');
    Object.entries(byProg).sort((a,b)=>b[1]-a[1]).forEach(([name, count]) => {
      console.log(`    • ${name.padEnd(38)} ${count} candidature(s)`);
    });

    // Répartition par statut
    const byStatus = {};
    allApps.forEach(a => { byStatus[a.status] = (byStatus[a.status]||0)+1; });
    console.log('\n  Par statut :');
    Object.entries(byStatus).forEach(([s, c]) => console.log(`    • ${s.padEnd(15)} ${c}`));

    console.log('\n══════════════════════════════════════════════════════');
    console.log('✅  Distribution terminée.');
    console.log('   Rechargez la page /dashboard/admin/applications\n');

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

seed();