// scripts/linkProgrammeForms.js
// Exécuter UNE SEULE FOIS : node scripts/linkProgrammeForms.js
//
// Ce script lit les 8 programmes et les 16 formulaires de votre base,
// puis remplit le champ formulaireId de chaque programme.
//
// Logique de matching :
//   1. Si le titre du formulaire contient le secteur du programme → match direct
//   2. Sinon → formulaire de type 'basic' publié en fallback

require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medianet_db';
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connecté :', MONGO_URI);

  // Charger les modèles après connexion
  const Programme = require('../src/models/Programme');
  const Form      = require('../src/models/Form');

  const forms      = await Form.find({ status: { $in: ['published', 'draft'] } }).lean();
  const programmes = await Programme.find({}).lean();

  console.log(`\n📋 ${forms.length} formulaires | 🚀 ${programmes.length} programmes\n`);

  // Construire une map secteur → formId depuis les titres de formulaires
  // Exemples DB : "Formulaire FinTech 2026", "Formulaire EdTech 2026", "Formulaire de Base"
  const sectorMap = {};
  let   basicFormId = null;

  for (const f of forms) {
    const t = (f.title || '').toLowerCase();

    // Formulaire de base
    if (f.type === 'basic' && (t.includes('base') || t.includes('standard'))) {
      basicFormId = f._id;
      console.log(`  📄 Formulaire de base identifié : "${f.title}" (${f._id})`);
    }

    // Matching secteur dans le titre
    const sectors = ['fintech','edtech','agritech','cleantech','healthtech','saas','aiml','foodtech','mobility'];
    for (const s of sectors) {
      if (t.includes(s)) {
        sectorMap[s] = f._id;
        console.log(`  🔗 Secteur "${s}" → "${f.title}"`);
      }
    }
  }

  console.log('\n--- Attribution des formulaires aux programmes ---\n');

  let updated = 0;
  let skipped = 0;

  for (const prog of programmes) {
    // Ne pas écraser un formulaireId déjà défini
    if (prog.formulaireId) {
      console.log(`  ⏭  "${prog.titre}" — formulaireId déjà défini, ignoré`);
      skipped++;
      continue;
    }

    const sectorKey = (prog.sector || '').toLowerCase().replace(/[^a-z]/g, '');
    let formId = sectorMap[sectorKey] || null;

    // Cas spéciaux par slug ou titre
    const slug  = (prog.slug  || '').toLowerCase();
    const titre = (prog.titre || '').toLowerCase();

    if (!formId) {
      // Recherche partielle dans les clés de la map
      const match = Object.keys(sectorMap).find(k => sectorKey.includes(k) || k.includes(sectorKey));
      if (match) formId = sectorMap[match];
    }

    // Candidatures spontanées et autres → formulaire de base
    if (!formId) {
      formId = basicFormId;
    }

    if (formId) {
      await Programme.findByIdAndUpdate(prog._id, { $set: { formulaireId: formId } });
      console.log(`  ✅ "${prog.titre}" (${prog.sector}) → formulaireId=${formId}`);
      updated++;
    } else {
      console.log(`  ⚠️  "${prog.titre}" — aucun formulaire trouvé, laissé null`);
    }
  }

  console.log(`\n✅ Terminé. ${updated} mis à jour, ${skipped} déjà configurés.\n`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ Erreur :', err.message);
  process.exit(1);
});