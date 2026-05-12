// debugNeeds.js — placez ce fichier à la racine du backend et lancez :
// node debugNeeds.js 69f3d92f58178a434fd83b87
//
// Ce script vérifie pourquoi `needs` apparaît vide dans matchingService

require('dotenv').config();
const mongoose = require('mongoose');

const APPLICATION_ID = process.argv[2];
if (!APPLICATION_ID) {
  console.error('Usage: node debugNeeds.js <applicationId>');
  process.exit(1);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medianet');
  console.log('✅ MongoDB connecté\n');

  // ── Test 1 : requête brute sans modèle ──────────────────────────────────
  const raw = await mongoose.connection.db
    .collection('applications')
    .findOne({ _id: new mongoose.Types.ObjectId(APPLICATION_ID) });

  console.log('═══ DOCUMENT BRUT (MongoDB) ═══');
  console.log('needs:', JSON.stringify(raw?.needs, null, 2));
  console.log('besoins:', JSON.stringify(raw?.besoins, null, 2)); // parfois le champ s'appelle "besoins"
  console.log('Tous les champs:', Object.keys(raw || {}).join(', '));
  console.log('');

  // ── Test 2 : avec le modèle Application ─────────────────────────────────
  let Application;
  try {
    Application = require('./src/models/Application');
  } catch {
    Application = require('./models/Application');
  }

  // 2a — findById sans select
  const app1 = await Application.findById(APPLICATION_ID);
  console.log('═══ findById() SANS select ═══');
  console.log('needs:', JSON.stringify(app1?.needs, null, 2));
  console.log('needs keys:', app1?.needs ? Object.keys(app1.needs) : 'undefined/null');
  console.log('');

  // 2b — findById avec select
  const app2 = await Application.findById(APPLICATION_ID)
    .select('project economy team needs matching status');
  console.log('═══ findById() AVEC select needs ═══');
  console.log('needs:', JSON.stringify(app2?.needs, null, 2));
  console.log('needs keys:', app2?.needs ? Object.keys(app2.needs) : 'undefined/null');
  console.log('');

  // 2c — lean() pour bypasser les getters Mongoose
  const app3 = await Application.findById(APPLICATION_ID).lean();
  console.log('═══ findById().lean() ═══');
  console.log('needs:', JSON.stringify(app3?.needs, null, 2));
  console.log('');

  // ── Test 3 : vérifier le schema ─────────────────────────────────────────
  const schema = Application.schema;
  console.log('═══ SCHEMA — champ "needs" ═══');
  const needsPath = schema.path('needs');
  if (needsPath) {
    console.log('Type:', needsPath.instance);
    console.log('Select par défaut:', needsPath.options?.select);
  } else {
    console.log('⚠ Le champ "needs" N\'EXISTE PAS dans le schema!');
    console.log('Champs du schema:', Object.keys(schema.paths).join(', '));
  }

  await mongoose.disconnect();
}

main().catch(console.error);