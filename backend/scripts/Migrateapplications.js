// scripts/migrateApplications.js
// Migre les anciens documents "plats" vers la structure unifiée
// et synchronise tous les champs manquants
//
// Usage : node scripts/migrateApplications.js

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/medianet_db';

async function migrate() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const dbName = MONGO_URI.split('/').pop().split('?')[0];
    const db = client.db(dbName);
    console.log(`\n✅ MongoDB connecté : ${dbName}\n`);

    const col = db.collection('applications');
    const all = await col.find({}).toArray();
    console.log(`📋 ${all.length} applications à migrer\n`);

    let migrated = 0;
    let skipped  = 0;

    for (const doc of all) {
      // ── Résoudre les champs depuis l'une ou l'autre structure ──
      const startupName = doc.project?.startupName || doc.startupName || doc.formResponses?.startupName || null;
      const sector      = doc.project?.sector      || doc.sector      || doc.formResponses?.sector      || null;
      const stage       = doc.project?.stage       || doc.stage       || doc.formResponses?.stage       || null;
      const location    = doc.project?.location    || doc.location    || null;
      const description = doc.project?.description || doc.description || null;
      const problem     = doc.project?.problem     || null;
      const solution    = doc.project?.solution    || null;
      const website     = doc.project?.website     || doc.website     || null;

      const founderName  = doc.team?.founderName  || doc.founderName  || doc.founder || null;
      const founderEmail = doc.team?.founderEmail || doc.founderEmail || doc.email   || null;
      const founderBio   = doc.team?.founderBio   || null;
      const teamSize     = doc.team?.teamSize      || doc.formResponses?.teamSize || null;

      const businessModel  = doc.economy?.businessModel  || doc.formResponses?.businessModel || null;
      const fundingGoal    = doc.economy?.fundingGoal    || doc.amount || doc.formResponses?.fundingNeeded || null;
      const monthlyRevenue = doc.economy?.monthlyRevenue || doc.formResponses?.revenue || null;
      const customers      = doc.economy?.customers      || parseInt(doc.formResponses?.customers || '0') || 0;
      const growthRate     = doc.economy?.growthRate     || null;
      const traction       = doc.economy?.traction       || null;

      // ── KPIs ──────────────────────────────────────────────────
      const kpis = {
        mrr:    doc.kpis?.mrr    ?? (parseInt(doc.formResponses?.revenue || '0') || 0),
        users:  doc.kpis?.users  ?? customers,
        growth: doc.kpis?.growth ?? growthRate ?? '—',
      };

      // ── Score ──────────────────────────────────────────────────
      const totalScore = doc.totalScore ?? doc.aiScore?.total ?? null;

      // ── Timeline ──────────────────────────────────────────────
      const timelinePhase    = doc.timelinePhase    || 'ideation';
      const timelineProgress = doc.timelineProgress ?? 20;
      const timelineNotes    = doc.timelineNotes    || '';

      // ── Champs programme ──────────────────────────────────────
      const programmeName = doc.programmeName || null;

      // ── Construire l'update ────────────────────────────────────
      const update = {
        // Champs racine synchronisés
        startupName,
        founderName,
        founderEmail,
        founder:     founderName,
        email:       founderEmail,
        sector,
        stage,
        location,
        description,
        website,

        // Champs project enrichis
        'project.startupName': startupName,
        'project.sector':      sector,
        'project.stage':       stage,
        'project.location':    location,
        'project.description': description,
        'project.problem':     problem,
        'project.solution':    solution,
        'project.website':     website,

        // Champs team enrichis
        'team.founderName':  founderName,
        'team.founderEmail': founderEmail,
        'team.founderBio':   founderBio,
        'team.teamSize':     teamSize,

        // Champs economy enrichis
        'economy.businessModel':  businessModel,
        'economy.fundingGoal':    fundingGoal,
        'economy.monthlyRevenue': monthlyRevenue,
        'economy.customers':      customers,
        'economy.growthRate':     growthRate,
        'economy.traction':       traction,

        // KPIs
        kpis,

        // Scores
        totalScore,

        // Timeline
        timelinePhase,
        timelineProgress,
        timelineNotes,

        // Assignations (initialiser si absent)
        assignedInvestorIds: doc.assignedInvestorIds || [],
        assignedMentorIds:   doc.assignedMentorIds   || [],

        updatedAt: new Date(),
      };

      // Nettoyer les valeurs null pour ne pas écraser les données existantes
      const cleanUpdate = {};
      for (const [k, v] of Object.entries(update)) {
        if (v !== null && v !== undefined) {
          cleanUpdate[k] = v;
        }
      }

      await col.updateOne({ _id: doc._id }, { $set: cleanUpdate });
      migrated++;

      const name = startupName || doc._id.toString().slice(-6);
      console.log(`   ✅ ${name.padEnd(20)} | ${sector || '?'} | ${doc.status} | score=${totalScore ?? '?'}`);
    }

    // ── Résumé ─────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════════════════');
    console.log(`MIGRATION TERMINÉE`);
    console.log(`  ✅ Migrés  : ${migrated}`);
    console.log(`  ⏭  Ignorés : ${skipped}`);
    console.log('══════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('\n❌ ERREUR MIGRATION :', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Déconnexion MongoDB.');
    process.exit(0);
  }
}

migrate();