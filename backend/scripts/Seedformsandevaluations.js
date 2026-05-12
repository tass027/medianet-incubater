// scripts/seedFormsAndEvaluations.js
// Run: node scripts/seedFormsAndEvaluations.js

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/medianet';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connecté');

  const db = mongoose.connection;
  const formCol  = db.collection('forms');
  const respCol  = db.collection('formresponses');
  const evalCol  = db.collection('juryevaluations');
  const appCol   = db.collection('applications');
  const juryCol  = db.collection('jury');

  // ── Clear old seed data ───────────────────────────────
  await formCol.deleteMany({ _seeded: true });
  await respCol.deleteMany({ _seeded: true });
  await evalCol.deleteMany({ _seeded: true });
  console.log('🗑  Old seed data cleared');

  // ── Fetch real applications & jury members ─────────────
  const applications = await appCol.find({}).limit(10).toArray();
  const juryMembers  = await juryCol.find({}).limit(5).toArray();

  console.log(`📋 Found ${applications.length} applications, ${juryMembers.length} jury members`);

  // ── Seed Forms ─────────────────────────────────────────
  const forms = [
    {
      _seeded: true,
      title: 'Basic Application Form',
      subtitle: 'Standard application form sent to all candidates upon registration.',
      description: 'Standard application form sent to all candidates upon registration.',
      type: 'basic',
      status: 'published',
      accent: '#006d94',
      programme: null,
      programmeName: null,
      isInherited: false,
      sentTo: applications.length || 8,
      sentToNames: 'all',
      completionRate: 80,
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-03-01'),
      questions: [
        { id: 'q1', type: 'short',    title: 'Company Name',               description: '', required: true,  options: [], rows: [], scaleMin: 1, scaleMax: 5, scaleMinLabel: '', scaleMaxLabel: '' },
        { id: 'q2', type: 'dropdown', title: 'Sector',                     description: 'e.g. FinTech, EdTech', required: true, options: ['FinTech','HealthTech','AgriTech','EdTech','CleanTech','Logistics','Other'], rows: [], scaleMin: 1, scaleMax: 5, scaleMinLabel: '', scaleMaxLabel: '' },
        { id: 'q3', type: 'short',    title: 'Founding Year',              description: '', required: true,  options: [], rows: [], scaleMin: 1, scaleMax: 5, scaleMinLabel: '', scaleMaxLabel: '' },
        { id: 'q4', type: 'short',    title: 'Team Size',                  description: '', required: false, options: [], rows: [], scaleMin: 1, scaleMax: 5, scaleMinLabel: '', scaleMaxLabel: '' },
        { id: 'q5', type: 'short',    title: 'Country of Operation',       description: '', required: false, options: [], rows: [], scaleMin: 1, scaleMax: 5, scaleMinLabel: '', scaleMaxLabel: '' },
        { id: 'q6', type: 'radio',    title: 'Funding Stage',              description: '', required: true,  options: ['Pre-seed','Seed','Series A','Series B+'], rows: [], scaleMin: 1, scaleMax: 5, scaleMinLabel: '', scaleMaxLabel: '' },
        { id: 'q7', type: 'long',     title: 'Brief Description',          description: 'Describe your startup in 2–3 sentences', required: true, options: [], rows: [], scaleMin: 1, scaleMax: 5, scaleMinLabel: '', scaleMaxLabel: '' },
        { id: 'q8', type: 'radio',    title: 'How did you hear about us?', description: '', required: false, options: ['Partner referral','LinkedIn','Accelerator website','Social media','Conference','Other'], rows: [], scaleMin: 1, scaleMax: 5, scaleMinLabel: '', scaleMaxLabel: '' },
      ],
    },
    {
      _seeded: true,
      title: 'FinTech Due Diligence',
      subtitle: 'Deep-dive assessment for FinTech startups entering evaluation phase.',
      description: 'Deep-dive assessment for FinTech startups entering the evaluation phase.',
      type: 'custom',
      status: 'published',
      accent: '#0EA5E9',
      programme: 'form-fintech-2026',
      programmeName: 'FinTech 2026',
      isInherited: true,
      sentTo: 3,
      sentToNames: ['Imen Ben Ammar'],
      completionRate: 100,
      createdAt: new Date('2026-02-01'),
      updatedAt: new Date('2026-03-10'),
      questions: [
        { id: 'q1', type: 'radio',  title: 'Revenue Model',                   description: '', required: true,  options: ['Subscription','Transaction fee','Freemium','Marketplace','Other'], rows: [], scaleMin: 1, scaleMax: 5, scaleMinLabel: '', scaleMaxLabel: '' },
        { id: 'q2', type: 'short',  title: 'Monthly Recurring Revenue (TND)', description: '', required: true,  options: [], rows: [], scaleMin: 1, scaleMax: 5, scaleMinLabel: '', scaleMaxLabel: '' },
        { id: 'q3', type: 'radio',  title: 'Regulatory Compliance',           description: '', required: true,  options: ['Fully compliant','In progress','Not started'], rows: [], scaleMin: 1, scaleMax: 5, scaleMinLabel: '', scaleMaxLabel: '' },
        { id: 'q4', type: 'long',   title: 'Banking Partnerships',            description: 'List any banking partnerships', required: false, options: [], rows: [], scaleMin: 1, scaleMax: 5, scaleMinLabel: '', scaleMaxLabel: '' },
      ],
    },
    {
      _seeded: true,
      title: 'Technical Assessment',
      subtitle: 'Technical evaluation for deep-tech and software projects.',
      description: 'Technical evaluation for deep-tech and software projects.',
      type: 'custom',
      status: 'draft',
      accent: '#8B5CF6',
      programme: 'form-edtech-2026',
      programmeName: 'EdTech 2026',
      isInherited: true,
      sentTo: 0,
      sentToNames: [],
      completionRate: 0,
      createdAt: new Date('2026-02-10'),
      updatedAt: new Date('2026-02-10'),
      questions: [
        { id: 'q1', type: 'short', title: 'Primary Technology', description: 'e.g. AI/ML, Blockchain', required: true,  options: [], rows: [], scaleMin: 1, scaleMax: 5, scaleMinLabel: '', scaleMaxLabel: '' },
        { id: 'q2', type: 'long',  title: 'Tech Stack',         description: 'List your core technologies', required: true, options: [], rows: [], scaleMin: 1, scaleMax: 5, scaleMinLabel: '', scaleMaxLabel: '' },
        { id: 'q3', type: 'radio', title: 'IP / Patents',        description: '', required: false, options: ['Patent filed','Patent pending','Trade secret','None'], rows: [], scaleMin: 1, scaleMax: 5, scaleMinLabel: '', scaleMaxLabel: '' },
      ],
    },
    {
      _seeded: true,
      title: 'Market Validation Survey',
      subtitle: 'Market traction and product-market fit assessment questions.',
      description: 'Market traction and product-market fit assessment questions.',
      type: 'custom',
      status: 'published',
      accent: '#D97706',
      programme: 'form-agritech-2026',
      programmeName: 'AgriTech 2026',
      isInherited: false,
      sentTo: 7,
      sentToNames: ['Sara Ben Ali', 'Ibrahim Diallo'],
      completionRate: 71,
      createdAt: new Date('2026-02-08'),
      updatedAt: new Date('2026-03-08'),
      questions: [
        { id: 'q1', type: 'short', title: 'Target Customer',          description: '', required: true,  options: [], rows: [], scaleMin: 1, scaleMax: 5,  scaleMinLabel: '', scaleMaxLabel: '' },
        { id: 'q2', type: 'long',  title: 'Problem Being Solved',     description: '', required: true,  options: [], rows: [], scaleMin: 1, scaleMax: 5,  scaleMinLabel: '', scaleMaxLabel: '' },
        { id: 'q3', type: 'scale', title: 'Product-Market Fit Score', description: 'How confident are you?', required: false, options: [], rows: [], scaleMin: 1, scaleMax: 10, scaleMinLabel: 'Not confident', scaleMaxLabel: 'Extremely confident' },
      ],
    },
    {
      _seeded: true,
      title: 'Pitch Deck Feedback Form',
      subtitle: 'Structured feedback form distributed after pitch presentations.',
      description: 'Structured feedback form distributed after pitch presentations.',
      type: 'custom',
      status: 'archived',
      accent: '#9D174D',
      programme: 'form-healthtech-2025',
      programmeName: 'HealthTech 2025',
      isInherited: false,
      sentTo: 8,
      sentToNames: 'all',
      completionRate: 100,
      createdAt: new Date('2026-01-20'),
      updatedAt: new Date('2026-02-20'),
      questions: [
        { id: 'q1', type: 'scale', title: 'Clarity of Vision',  description: '', required: true, options: [], rows: [], scaleMin: 1, scaleMax: 5, scaleMinLabel: 'Poor', scaleMaxLabel: 'Excellent' },
        { id: 'q2', type: 'scale', title: 'Team Credibility',   description: '', required: true, options: [], rows: [], scaleMin: 1, scaleMax: 5, scaleMinLabel: 'Poor', scaleMaxLabel: 'Excellent' },
        { id: 'q3', type: 'long',  title: 'Overall Impression', description: 'Summarize your feedback', required: true, options: [], rows: [], scaleMin: 1, scaleMax: 5, scaleMinLabel: '', scaleMaxLabel: '' },
      ],
    },
  ];

  const insertedForms = await formCol.insertMany(forms);
  console.log(`✅ ${insertedForms.insertedCount} formulaires insérés`);

  const formIds = Object.values(insertedForms.insertedIds);

  // ── Update forms with their response counts ────────────
  // Add fields count
  for (let i = 0; i < forms.length; i++) {
    await formCol.updateOne(
      { _id: formIds[i] },
      { $set: { fields: forms[i].questions.length } }
    );
  }

  // ── Seed Form Responses ────────────────────────────────
  const mockRespondents = [
    { name: 'Imen Ben Ammar',   email: 'i.benammar@paytun.is',   company: 'PayTunis',   sector: 'FinTech',    score: 87, status: 'Active',   amount: '500,000 TND'   },
    { name: 'Hela Ghariani',    email: 'h.ghariani@dabadoc.tn',  company: 'DabaDoc',    sector: 'HealthTech', score: 94, status: 'Accepted', amount: '1,500,000 TND' },
    { name: 'Ibrahim Diallo',   email: 'i.diallo@agrismart.co',  company: 'AgriSmart',  sector: 'AgriTech',   score: 71, status: 'Pending',  amount: '200,000 TND'   },
    { name: 'Sara Ben Ali',     email: 's.benali@edulearn.tn',   company: 'EduLearn',   sector: 'EdTech',     score: 58, status: 'Rejected', amount: '350,000 TND'   },
    { name: 'Mohamed Khemiri',  email: 'm.khemiri@solartech.io', company: 'SolarTech',  sector: 'CleanTech',  score: 82, status: 'Active',   amount: '800,000 TND'   },
    { name: 'Karim Gharbi',     email: 'k.gharbi@logitrack.tn',  company: 'LogiTrack',  sector: 'Logistics',  score: 75, status: 'Active',   amount: '300,000 TND'   },
    { name: 'Amira Slama',      email: 'a.slama@greenbox.tn',    company: 'GreenBox',   sector: 'CleanTech',  score: 68, status: 'Pending',  amount: '150,000 TND'   },
    { name: 'Youssef Trabelsi', email: 'y.trabelsi@medtech.tn',  company: 'MedTech TN', sector: 'HealthTech', score: 91, status: 'Accepted', amount: '2,000,000 TND' },
  ];

  const responses = [];

  // Responses for Basic Application Form (formIds[0])
  mockRespondents.forEach((r, idx) => {
    responses.push({
      _seeded: true,
      formId: formIds[0],
      respondent: r.name,
      email: r.email,
      company: r.company,
      sector: r.sector,
      score: r.score,
      status: r.status,
      amount: r.amount,
      answers: {
        q1: r.company,
        q2: r.sector,
        q3: String(2022 + (idx % 3)),
        q4: String(4 + idx * 2),
        q5: ['Tunisia','Morocco','Algeria','Ivory Coast','Tunisia','Tunisia','Algeria','Tunisia'][idx],
        q6: ['Seed','Series A','Pre-seed','Pre-seed','Series A','Seed','Pre-seed','Series A'][idx],
        q7: `${r.company} is a ${r.sector} startup building innovative solutions for MENA markets.`,
        q8: ['Partner referral','LinkedIn','Accelerator website','Social media','Partner referral','Conference','LinkedIn','Social media'][idx],
      },
      submittedAt: new Date(`2026-03-${String(7 + idx).padStart(2, '0')} ${10 + idx}:${15 + idx}:00`),
    });
  });

  // Responses for FinTech Due Diligence (formIds[1])
  [mockRespondents[0], mockRespondents[1], mockRespondents[4]].forEach((r, idx) => {
    responses.push({
      _seeded: true,
      formId: formIds[1],
      respondent: r.name,
      email: r.email,
      company: r.company,
      sector: r.sector,
      score: r.score,
      status: r.status,
      amount: r.amount,
      answers: {
        q1: ['Transaction fee','Subscription','Marketplace'][idx],
        q2: ['180,000','320,000','95,000'][idx],
        q3: ['Fully compliant','In progress','In progress'][idx],
        q4: ['Partnership with BNA and Attijari','Working with STB for payment rails','No formal banking partnerships yet'][idx],
      },
      submittedAt: new Date(`2026-03-${String(9 + idx).padStart(2, '0')} 14:${23 + idx}:00`),
    });
  });

  // Responses for Market Validation Survey (formIds[3])
  [mockRespondents[3], mockRespondents[2], mockRespondents[5]].forEach((r, idx) => {
    responses.push({
      _seeded: true,
      formId: formIds[3],
      respondent: r.name,
      email: r.email,
      company: r.company,
      sector: r.sector,
      score: r.score,
      status: r.status,
      amount: r.amount,
      answers: {
        q1: ['Students 15-18','Smallholder farmers','E-commerce retailers'][idx],
        q2: ['No engaging digital learning tools for Tunisian curriculum','Manual irrigation wastes water and reduces yields','No reliable last-mile tracking or delivery confirmation'][idx],
        q3: ['8','7','9'][idx],
      },
      submittedAt: new Date(`2026-03-${String(8 + idx).padStart(2, '0')} 11:${15 + idx}:00`),
    });
  });

  // Responses for Pitch Deck Feedback (formIds[4])
  mockRespondents.forEach((r, idx) => {
    responses.push({
      _seeded: true,
      formId: formIds[4],
      respondent: r.name,
      email: r.email,
      company: r.company,
      sector: r.sector,
      score: r.score,
      status: r.status,
      amount: r.amount,
      answers: {
        q1: String(3 + (idx % 3)),
        q2: String(3 + ((idx + 1) % 3)),
        q3: ['Exceptional pitch - clear market opportunity and strong founding team.','Great vision but financials need more detail.','Interesting concept - go-to-market strategy needs strengthening.','Strong social impact angle, needs competitive differentiation.','Best pitch of the session - execution-ready team.','Logistics market is crowded - need stronger differentiation.','Promising early traction, scale strategy unclear.','AI diagnostics approach is compelling, regulatory path needed.'][idx],
      },
      submittedAt: new Date(`2026-03-${String(7 + idx).padStart(2, '0')} 14:${23 - idx}:00`),
    });
  });

  const insertedResponses = await respCol.insertMany(responses);
  console.log(`✅ ${insertedResponses.insertedCount} réponses insérées`);

  // Update form response counts
  for (let i = 0; i < formIds.length; i++) {
    const count = await respCol.countDocuments({ formId: formIds[i] });
    const form  = forms[i];
    const sentTo = typeof form.sentTo === 'number' ? form.sentTo : mockRespondents.length;
    const completionRate = sentTo > 0 ? Math.round((count / sentTo) * 100) : 0;
    await formCol.updateOne(
      { _id: formIds[i] },
      { $set: { responses: count, completionRate } }
    );
  }

  // ── Seed Jury Evaluations ─────────────────────────────
  if (juryMembers.length > 0 && applications.length > 0) {
    const CRITERIA = [
      { criteriaId: 'team',       criteriaName: 'Équipe',           weight: 30 },
      { criteriaId: 'innovation', criteriaName: 'Innovation',       weight: 25 },
      { criteriaId: 'market',     criteriaName: 'Marché',           weight: 20 },
      { criteriaId: 'business',   criteriaName: 'Modèle économique',weight: 15 },
      { criteriaId: 'traction',   criteriaName: 'Traction',         weight: 10 },
    ];

    const evaluations = [];
    const scorePresets = [
      [85, 78, 82, 70, 90],
      [92, 88, 75, 95, 80],
      [65, 72, 68, 60, 75],
      [78, 85, 90, 82, 70],
      [55, 60, 58, 65, 52],
    ];
    const recommendations = ['accept','accept','review','accept','reject'];
    const remarks = [
      'Équipe solide avec forte expérience sectorielle.',
      'Innovation remarquable sur un marché en croissance.',
      'Potentiel intéressant mais le modèle économique manque de clarté.',
      'Traction impressionnante, go-to-market bien pensé.',
      'Concept prometteur mais différenciation insuffisante.',
    ];

    juryMembers.forEach((jury, ji) => {
      applications.slice(0, 3).forEach((app, ai) => {
        const presetIdx = (ji + ai) % scorePresets.length;
        const scores = CRITERIA.map((c, ci) => ({
          criteriaId:   c.criteriaId,
          criteriaName: c.criteriaName,
          score:        scorePresets[presetIdx][ci],
          remark:       ci === 0 ? remarks[presetIdx] : '',
        }));

        const totalScore = Math.round(
          scores.reduce((sum, s, ci) => sum + s.score * (CRITERIA[ci].weight / 100), 0)
        );

        evaluations.push({
          _seeded: true,
          applicationId: app._id,
          juryId:        jury._id,
          juryName:      jury.name,
          startupName:   app.startupName || app.formResponses?.startupName || `Startup ${ai + 1}`,
          programme:     app.programmeName || '',
          scores,
          totalScore,
          globalRemark:  remarks[presetIdx],
          recommendation:recommendations[presetIdx],
          status:        'submitted',
          submittedAt:   new Date(`2026-03-${String(10 + ai).padStart(2,'0')}`),
          createdAt:     new Date(`2026-03-${String(9 + ai).padStart(2,'0')}`),
          updatedAt:     new Date(`2026-03-${String(10 + ai).padStart(2,'0')}`),
        });
      });
    });

    if (evaluations.length > 0) {
      const insertedEvals = await evalCol.insertMany(evaluations);
      console.log(`✅ ${insertedEvals.insertedCount} évaluations jury insérées`);

      // Update jury evaluationsCount
      for (const jury of juryMembers) {
        const count = await evalCol.countDocuments({ juryId: jury._id });
        const juryEvals = await evalCol.find({ juryId: jury._id, status: 'submitted' }).toArray();
        const evalSummaries = juryEvals.map(e => ({
          evaluationId: e._id,
          candidature:  e.startupName,
          startupName:  e.startupName,
          programme:    e.programme,
          score:        Math.round(e.totalScore / 20), // scale /100 → /5
          date:         e.submittedAt,
        }));
        await juryCol.updateOne(
          { _id: jury._id },
          { $set: { evaluationsCount: count, evaluations: evalSummaries, updatedAt: new Date() } }
        );
      }
      console.log('✅ Jury evaluationsCount mis à jour');
    }
  } else {
    console.log('⚠️  Pas de jury ou candidatures — évaluations ignorées');
  }

  console.log('\n🎉 Seed terminé avec succès!');
  console.log(`   📝 ${forms.length} formulaires`);
  console.log(`   📊 ${responses.length} réponses`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});