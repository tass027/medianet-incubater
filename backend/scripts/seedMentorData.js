/**
 * seedMentorData.js - Version CORRIGÉE (avec label pour milestones)
 */

require('dotenv').config();
const mongoose = require('mongoose');

// ── Models ────────────────────────────────────────────────────────────────────
const User = require('../src/models/User');
const Application = require('../src/models/Application');
const MentorSession = require('../src/models/MentorSession');
const MentorFeedback = require('../src/models/MentorFeedback');
const MentorReport = require('../src/models/MentorReport');
const MentorResource = require('../src/models/MentorResource');

// ── Helpers ───────────────────────────────────────────────────────────────────
const d = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(10, 0, 0, 0);
  return date;
};

const getPeriod = (monthsAgo = 0) => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear()
  };
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // ── 1. Find mentor ──────────────────────────────────────────────────────
    let mentor = await User.findOne({ 
      $or: [
        { role: 'mentor' },
        { mentorRoles: { $in: ['mentor'] } }
      ]
    });
    
    if (!mentor) {
      const mentorsCollection = mongoose.connection.db.collection('mentors');
      const oldMentor = await mentorsCollection.findOne({ role: 'mentor' });
      if (oldMentor) {
        console.log('⚠️  Mentor found in "mentors" collection, creating User document...');
        const bcrypt = require('bcryptjs');
        const passwordHash = bcrypt.hashSync('Mentor2026!', 10);
        mentor = await User.create({
          name: oldMentor.name,
          email: oldMentor.email,
          passwordHash,
          role: 'mentor',
          mentorRoles: ['mentor'],
          isActive: true,
          isApproved: true,
          isEmailVerified: true,
          assignedStartups: []
        });
        console.log(`✅ Created User from mentors collection: ${mentor.name}`);
      }
    }
    
    if (!mentor) {
      console.error('❌ No mentor found.');
      process.exit(1);
    }
    
    console.log(`✅ Using mentor: ${mentor.name} (${mentor._id})`);

    // ── 2. Find applications ─────────────────────────────────────────────────
    let applications = await Application.find({ 
      status: { $in: ['accepted', 'active', 'reviewing'] } 
    }).limit(6).lean();
    
    if (!applications || applications.length === 0) {
      const appsCollection = mongoose.connection.db.collection('applications');
      applications = await appsCollection.find({ 
        status: { $in: ['accepted', 'active', 'reviewing'] } 
      }).limit(6).toArray();
    }
    
    if (!applications || applications.length < 2) {
      console.error('❌ Not enough applications found (minimum 2).');
      process.exit(1);
    }
    
    // ── 3. Assign startups to mentor ─────────────────────────────────────────
    const startupIds = applications.map(s => s._id);
    mentor.assignedStartups = startupIds;
    mentor.mentorRoles = ['mentor'];
    await mentor.save();
    console.log(`✅ Assigned ${startupIds.length} startups to mentor\n`);

    const [s1, s2, s3, s4, s5, s6] = applications;

    // ── 4. Clean existing data ───────────────────────────────────────────────
    await Promise.all([
      MentorSession.deleteMany({ mentorId: mentor._id }),
      MentorFeedback.deleteMany({ mentorId: mentor._id }),
      MentorReport.deleteMany({ mentorId: mentor._id }),
      MentorResource.deleteMany({ mentorId: mentor._id }),
    ]);
    console.log('🗑  Cleaned previous mentor seed data\n');

    // ── 5. Sessions ──────────────────────────────────────────────────────────
    const sessions = await MentorSession.insertMany([
      { mentorId: mentor._id, startupId: s1._id, date: d(-5),  duration: 60, topic: 'Stratégie go-to-market',  status: 'done',      notes: 'Revu le positionnement prix.' },
      { mentorId: mentor._id, startupId: s2._id, date: d(-3),  duration: 60, topic: 'Onboarding clients',      status: 'done',      notes: 'Identification des freins.' },
      { mentorId: mentor._id, startupId: s3?._id || s1._id, date: d(-10), duration: 30, topic: 'Revue business model',  status: 'cancelled', notes: 'Annulé.' },
      { mentorId: mentor._id, startupId: s1._id, date: d(3),   duration: 90, topic: 'Préparation levée de fonds', status: 'scheduled', notes: '' },
      { mentorId: mentor._id, startupId: s2._id, date: d(5),   duration: 60, topic: 'Revue produit',             status: 'scheduled', notes: '' },
      { mentorId: mentor._id, startupId: s4?._id || s2._id, date: d(-2),  duration: 45, topic: 'Stratégie marketing',    status: 'done',      notes: 'Définition des KPIs.' },
    ]);
    console.log(`✅ Inserted ${sessions.length} sessions`);

    // ── 6. Feedback ──────────────────────────────────────────────────────────
    const feedbacks = await MentorFeedback.insertMany([
      {
        mentorId: mentor._id,
        startupId: s1._id,
        sessionId: sessions[0]._id,
        rating: 4,
        comment: 'Très bonne progression sur le pipeline commercial.',
        axes: { product: 4, team: 4, market: 4, finance: 3 },
        milestones: [
          { name: 'MVP', status: 'achieved', date: new Date(), comment: 'MVP V2 livré' },
          { name: 'Premier client', status: 'achieved', date: new Date(), comment: '47 clients actifs' }
        ],
        visibility: 'startup'
      },
      {
        mentorId: mentor._id,
        startupId: s1._id,
        rating: 3,
        comment: 'Le cycle de vente reste trop long. Travailler sur la démo.',
        axes: { product: 3, team: 4, market: 2, finance: 3 },
        milestones: [],
        visibility: 'startup'
      },
      {
        mentorId: mentor._id,
        startupId: s2._id,
        sessionId: sessions[1]._id,
        rating: 3,
        comment: 'Bon potentiel mais complexité réglementaire.',
        axes: { product: 4, team: 3, market: 2, finance: 2 },
        milestones: [
          { name: 'MVP', status: 'achieved', date: new Date(), comment: 'MVP livré' }
        ],
        visibility: 'startup'
      },
      {
        mentorId: mentor._id,
        startupId: s4?._id || s2._id,
        sessionId: sessions[5]._id,
        rating: 5,
        comment: 'Excellente maîtrise des métriques.',
        axes: { product: 5, team: 5, market: 5, finance: 4 },
        milestones: [
          { name: 'MVP', status: 'achieved', date: new Date(), comment: 'Plateforme V3' },
          { name: 'Premier client', status: 'achieved', date: new Date(), comment: 'Contrats signés' },
          { name: 'Revenue', status: 'in_progress', date: null, comment: 'ARR croissant' }
        ],
        visibility: 'startup'
      },
    ]);
    console.log(`✅ Inserted ${feedbacks.length} feedbacks`);

    // ── 7. Reports (CORRIGÉ : avec label requis) ─────────────────────────────
    const lastPeriod = getPeriod(1);
    const currentPeriod = getPeriod(0);

    const reports = await MentorReport.insertMany([
      {
        mentorId: mentor._id,
        startupId: s1._id,
        period: lastPeriod,
        // ✅ CORRECTION : chaque milestone doit avoir un champ 'label'
        milestones: [
          { label: 'MVP', status: 'done', date: new Date(), note: 'MVP V2 livré' },
          { label: 'Premier client', status: 'done', date: new Date(), note: '47 clients actifs' },
          { label: 'Revenue récurrente', status: 'active', date: null, note: 'MRR 8500 TND' }
        ],
        axes: {
          product: 'MVP V2 livré, bugs critiques corrigés.',
          team: 'Recrutement CTO en cours.',
          market: 'Pipeline commercial solide.',
          finance: 'Runway 9 mois.'
        },
        overallProgress: 65,
        recommendations: 'Finaliser le recrutement CTO.',
        status: 'submitted'
      },
      {
        mentorId: mentor._id,
        startupId: s2._id,
        period: lastPeriod,
        milestones: [
          { label: 'MVP', status: 'done', date: new Date(), note: 'MVP livré' },
          { label: 'Premier client', status: 'pending', date: null, note: 'En négociation' }
        ],
        axes: {
          product: 'MVP livré, intégration en cours.',
          team: 'Équipe de 3.',
          market: 'Adoption progressive.',
          finance: 'Runway 6 mois.'
        },
        overallProgress: 40,
        recommendations: 'Prioriser signature premier client.',
        status: 'submitted'
      },
      {
        mentorId: mentor._id,
        startupId: s4?._id || s2._id,
        period: currentPeriod,
        milestones: [
          { label: 'MVP', status: 'done', date: new Date(), note: 'Plateforme V3 déployée' },
          { label: 'Premier client', status: 'done', date: new Date(), note: 'Contrats signés avec 2 collectivités' },
          { label: 'Revenue', status: 'done', date: new Date(), note: 'ARR 120k TND' },
          { label: 'Expansion', status: 'active', date: null, note: 'Préparation Série A' }
        ],
        axes: {
          product: 'Solution mature et stable.',
          team: 'Équipe complète et expérimentée.',
          market: 'Position solide sur le marché.',
          finance: 'Bonne santé financière.'
        },
        overallProgress: 90,
        recommendations: 'Préparer expansion régionale et levée de fonds.',
        status: 'submitted'
      },
    ]);
    console.log(`✅ Inserted ${reports.length} reports`);

    // ── 8. Resources ─────────────────────────────────────────────────────────
    const resources = await MentorResource.insertMany([
      {
        mentorId: mentor._id,
        title: 'Template Business Plan 2026',
        description: 'Modèle complet pour structurer votre business plan.',
        type: 'document',
        url: 'https://example.com/business-plan.xlsx',
        targetStartups: [],
        tags: ['finance', 'template']
      },
      {
        mentorId: mentor._id,
        title: 'Guide Pitch Deck — 12 slides',
        description: 'Structure recommandée pour un pitch investisseur.',
        type: 'document',
        url: 'https://example.com/pitch-deck.pptx',
        targetStartups: [],
        tags: ['pitch', 'investor']
      },
      {
        mentorId: mentor._id,
        title: 'Masterclass Lean Startup',
        description: 'Conférence sur la méthode Lean.',
        type: 'video',
        url: 'https://youtube.com/watch?v=example',
        targetStartups: [],
        tags: ['product', 'lean']
      },
      {
        mentorId: mentor._id,
        title: 'Calculateur CAC/LTV SaaS',
        description: 'Tableur pour métriques SaaS.',
        type: 'document',
        url: 'https://example.com/cac-ltv.xlsx',
        targetStartups: [s1._id],
        tags: ['finance', 'saas']
      },
      {
        mentorId: mentor._id,
        title: 'Guide réglementation par secteur',
        description: 'Ressource sur les réglementations.',
        type: 'link',
        url: 'https://example.com/regulations',
        targetStartups: [s2._id],
        tags: ['regulatory']
      },
      {
        mentorId: mentor._id,
        title: 'Template contrat B2B',
        description: 'Modèle de contrat adapté.',
        type: 'document',
        url: 'https://example.com/contract.docx',
        targetStartups: [],
        tags: ['legal', 'contract']
      },
    ]);
    console.log(`✅ Inserted ${resources.length} resources`);

    // ── 9. Summary ───────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🎉 MENTOR SEED COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`\n📊 Summary:`);
    console.log(`   • Mentor: ${mentor.name} (${mentor.email})`);
    console.log(`   • Startups assigned: ${startupIds.length}`);
    console.log(`   • Sessions: ${sessions.length}`);
    console.log(`   • Feedbacks: ${feedbacks.length}`);
    console.log(`   • Reports: ${reports.length}`);
    console.log(`   • Resources: ${resources.length}`);
    
    console.log('\n✅ You can now access the Mentor Space at: /dashboard/mentor');
    console.log('═══════════════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Seed error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();