// src/controllers/jurySpaceController.js

const mongoose = require('mongoose');
const User      = require('../models/User');

const db = mongoose.connection;

const serverError = (res, err, label = 'jurySpace') => {
  console.error(`[${label}]`, err);
  res.status(500).json({ success: false, message: err.message || 'Erreur serveur' });
};

// ─── Récupère la fiche jury par email OU par userId ───────────────────────────
const getJuryRecord = async (user) => {
  try {
    const col = db.collection('jury');

    if (user._id) {
      const byId = await col.findOne({
        $or: [
          { userId:       user._id },
          { userId:       user._id.toString() },
          { linkedUserId: user._id },
          { linkedUserId: user._id.toString() },
        ],
      });
      if (byId) return byId;
    }

    if (user.email) {
      const byEmail = await col.findOne({ email: user.email.toLowerCase().trim() });
      if (byEmail) return byEmail;
    }

    if (user.name) {
      const byName = await col.findOne({
        name: { $regex: new RegExp(user.name.split(' ')[0], 'i') },
      });
      if (byName) return byName;
    }

    return null;
  } catch (err) {
    console.error('[getJuryRecord]', err);
    return null;
  }
};

const getStartupName = (user, app) =>
  user?.startupProfile?.startupName
  || app?.formResponses?.startupName
  || app?.formResponses?.projectName
  || user?.name
  || 'Sans nom';

const toObjectIds = (ids = []) =>
  ids.map(id => {
    try { return new mongoose.Types.ObjectId(id); } catch { return null; }
  }).filter(Boolean);

// ─── Normalise un score brut vers /10 ────────────────────────────────────────
const normToTen = (raw) => {
  const n = Number(raw);
  if (isNaN(n)) return 0;
  return n > 10 ? +(n / 10).toFixed(2) : +n.toFixed(2);
};

// ─── Formate un score pour le retour API ─────────────────────────────────────
const formatScore = (s) => ({
  criteriaId:   s.criteriaId   || s.criteriaName?.toLowerCase() || '',
  criteriaName: s.criteriaName || s.criteriaId || 'Critère',
  score:        normToTen(s.score),
  comment:      s.comment || s.remark || '',
  remark:       s.comment || s.remark || '',
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jury-space/dashboard
// ─────────────────────────────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const juryRecord = await getJuryRecord(req.user);

    const getAccessibleApplications = async () => {
      const results = [];
      if (juryRecord?.assignedProgrammeIds?.length) {
        const oids = toObjectIds(juryRecord.assignedProgrammeIds);
        if (oids.length) {
          const users = await User.find({
            'applications.programmeId': { $in: oids },
            'applications.status': { $in: ['reviewing', 'interview', 'accepted', 'rejected', 'waitlist'] },
          }).select('name email startupProfile applications').lean();
          users.forEach(u => {
            u.applications.forEach(app => {
              const inProg = oids.some(o => o.toString() === app.programmeId?.toString());
              if (!inProg) return;
              if (!['reviewing', 'interview', 'accepted', 'rejected', 'waitlist'].includes(app.status)) return;
              results.push({ user: u, app });
            });
          });
        }
      }
      if (req.user._id) {
        const directlyAssigned = await User.find({
          'applications.assignedJury': { $in: [req.user._id, req.user._id.toString()] },
        }).select('name email startupProfile applications').lean();
        directlyAssigned.forEach(u => {
          u.applications.forEach(app => {
            const alreadyIn = results.some(r => r.app._id.toString() === app._id.toString());
            if (alreadyIn) return;
            const assigned = (app.assignedJury || []).map(id => id.toString());
            if (!assigned.includes(req.user._id.toString())) return;
            results.push({ user: u, app });
          });
        });
      }
      const seen = new Set();
      return results.filter(r => {
        const k = r.app._id.toString();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    };

    const apps = await getAccessibleApplications();

    if (!juryRecord && apps.length === 0) {
      return res.json({
        success: true,
        stats:  { total: 0, evaluated: 0, pending: 0, avgScore: null },
        recent: [],
        debug: {
          message: 'Aucune fiche jury trouvée et aucune candidature directement assignée.',
          userEmail: req.user.email,
          userId: req.user._id,
        },
      });
    }

    let total = 0, evaluatedCount = 0;
    const myScores = [];
    const recentApps = [];

    apps.forEach(({ user: u, app }) => {
      total++;
      const myScore = app.juryScores?.find(s =>
        (juryRecord && s.juryId?.toString() === juryRecord._id?.toString()) ||
        s.juryId?.toString() === req.user._id.toString()
      );
      if (myScore) {
        evaluatedCount++;
        myScores.push(myScore.score || 0);
      }
      recentApps.push({
        _id:           app._id,
        projectName:   getStartupName(u, app),
        sector:        u.startupProfile?.sector || '',
        founderName:   u.name,
        programmeName: app.programmeName,
        status:        app.status,
        juryEvaluated: !!myScore,
        myScore:       myScore?.score ?? null,
        submittedAt:   app.appliedAt,
      });
    });

    const avgScore = myScores.length
      ? (myScores.reduce((a, b) => a + b, 0) / myScores.length).toFixed(1)
      : null;

    recentApps.sort((a, b) => {
      if (a.juryEvaluated !== b.juryEvaluated) return a.juryEvaluated ? 1 : -1;
      return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
    });

    res.json({
      success: true,
      stats: { total, evaluated: evaluatedCount, pending: total - evaluatedCount, avgScore },
      recent: recentApps.slice(0, 5),
    });
  } catch (err) {
    serverError(res, err, 'getDashboardStats');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jury-space/candidatures
// ─────────────────────────────────────────────────────────────────────────────
exports.getCandidatures = async (req, res) => {
  try {
    const juryRecord = await getJuryRecord(req.user);
    // ✅ FIX : effectiveJuryId défini ici, disponible pour tout le reste de la fonction
    const effectiveJuryId = juryRecord?._id || req.user._id;

    const getAccessible = async () => {
      const results = [];
      if (juryRecord?.assignedProgrammeIds?.length) {
        const oids = toObjectIds(juryRecord.assignedProgrammeIds);
        if (oids.length) {
          const users = await User.find({
            'applications.programmeId': { $in: oids },
            'applications.status': { $in: ['reviewing', 'interview', 'accepted', 'rejected', 'waitlist'] },
          }).select('name email startupProfile applications').lean();
          users.forEach(u => {
            u.applications.forEach(app => {
              if (!oids.some(o => o.toString() === app.programmeId?.toString())) return;
              if (!['reviewing', 'interview', 'accepted', 'rejected', 'waitlist'].includes(app.status)) return;
              results.push({ user: u, app });
            });
          });
        }
      }
      if (req.user._id) {
        const direct = await User.find({
          'applications.assignedJury': { $in: [req.user._id, req.user._id.toString()] },
        }).select('name email startupProfile applications').lean();
        direct.forEach(u => {
          u.applications.forEach(app => {
            if (results.some(r => r.app._id.toString() === app._id.toString())) return;
            if (!(app.assignedJury || []).map(id => id.toString()).includes(req.user._id.toString())) return;
            results.push({ user: u, app });
          });
        });
      }
      const seen = new Set();
      return results.filter(r => {
        const k = r.app._id.toString();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    };

    const apps = await getAccessible();

    const flat = apps.map(({ user: u, app }) => {
      const myScore = app.juryScores?.find(s =>
        s.juryId?.toString() === effectiveJuryId.toString() ||
        s.juryId?.toString() === req.user._id.toString()
      );
      return {
        _id:           app._id,
        applicationId: app._id,
        userId:        u._id,
        projectName:   getStartupName(u, app),
        companyName:   getStartupName(u, app),
        founderName:   u.name,
        email:         u.email,
        sector:        u.startupProfile?.sector   || '',
        stage:         u.startupProfile?.stage    || '',
        location:      u.startupProfile?.location || '',
        programmeName: app.programmeName || 'Sans programme',
        programmeId:   app.programmeId,
        status:        app.status,
        juryEvaluated: !!myScore,
        myScore:       myScore?.score ?? null,
        submittedAt:   app.appliedAt,
      };
    });

    // ✅ FIX : sync avec juryevaluations pour avoir le vrai statut évalué
    try {
      const appIds = flat
        .map(c => { try { return new mongoose.Types.ObjectId(c._id); } catch { return null; } })
        .filter(Boolean);

      if (appIds.length > 0) {
        const evalDocs = await db.collection('juryevaluations').find({
          applicationId: { $in: appIds },
          $or: [
            { juryId: effectiveJuryId },
            { juryId: effectiveJuryId.toString() },
            { juryId: req.user._id },
            { juryId: req.user._id.toString() },
          ],
          status: 'submitted',
        }).toArray();

        const evaluatedSet = new Set(evalDocs.map(e => e.applicationId.toString()));

        flat.forEach(c => {
          if (evaluatedSet.has(c._id.toString())) {
            c.juryEvaluated = true;
          }
        });
      }
    } catch (syncErr) {
      console.warn('[getCandidatures] juryevaluations sync error:', syncErr.message);
    }

    const progMap = new Map();
    flat.forEach(c => {
      const key = c.programmeName;
      if (!progMap.has(key)) {
        progMap.set(key, { name: key, programmeId: c.programmeId || null, candidatures: [], pending: 0, evaluated: 0 });
      }
      const g = progMap.get(key);
      g.candidatures.push(c);
      if (c.juryEvaluated) g.evaluated++; else g.pending++;
    });

    progMap.forEach(g => {
      g.candidatures.sort((a, b) => {
        if (a.juryEvaluated !== b.juryEvaluated) return a.juryEvaluated ? 1 : -1;
        return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
      });
    });

    res.json({ success: true, programmes: [...progMap.values()], candidatures: flat });
  } catch (err) {
    serverError(res, err, 'getCandidatures');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jury-space/candidatures/:applicationId
// ─────────────────────────────────────────────────────────────────────────────
exports.getCandidatureById = async (req, res) => {
  try {
    const { applicationId } = req.params;
    let appObjId;
    try { appObjId = new mongoose.Types.ObjectId(applicationId); }
    catch { return res.status(400).json({ success: false, message: 'ID invalide' }); }

    const user = await User.findOne({ 'applications._id': appObjId })
      .select('name email startupProfile applications').lean();
    if (!user) return res.status(404).json({ success: false, message: 'Candidature non trouvée' });

    const app = user.applications.find(a => a._id.toString() === applicationId);
    if (!app) return res.status(404).json({ success: false, message: 'Candidature non trouvée' });

    let responses = [];
    try {
      const formResponseCol = db.collection('formresponses');
      const startupName = getStartupName(user, app);
      const formDoc = await formResponseCol.findOne({
        $or: [
          { email: user.email },
          { email: user.email?.toLowerCase().trim() },
          { company: startupName },
          { company: { $regex: new RegExp(startupName.split(' ')[0], 'i') } },
        ],
      });
      if (formDoc) {
        if (formDoc.answers) {
          if (Array.isArray(formDoc.answers)) {
            responses = formDoc.answers.map(a => ({
              question: a.question || a.label || a.key || 'Champ',
              answer:   String(a.answer || a.value || ''),
            }));
          } else if (typeof formDoc.answers === 'object') {
            responses = Object.entries(formDoc.answers).map(([question, answer]) => ({
              question,
              answer: typeof answer === 'object' ? JSON.stringify(answer) : String(answer ?? ''),
            }));
          }
        }
        if (responses.length === 0) {
          const SKIP = new Set(['_id', '__v', 'createdAt', 'updatedAt', 'programmeId', 'programmeName', 'formId']);
          responses = Object.entries(formDoc)
            .filter(([key]) => !SKIP.has(key))
            .map(([key, value]) => ({
              question: key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim().replace(/^./, c => c.toUpperCase()),
              answer:   typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? ''),
            }))
            .filter(r => r.answer && r.answer !== 'null' && r.answer !== 'undefined' && r.answer.trim() !== '');
        }
      }
    } catch {}

    if (responses.length === 0 && app.formResponses) {
      responses = Object.entries(app.formResponses)
        .filter(([key]) => !['_id', '__v', 'createdAt', 'updatedAt'].includes(key))
        .map(([key, value]) => ({
          question: key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim().replace(/^./, c => c.toUpperCase()),
          answer:   typeof value === 'object' ? JSON.stringify(value) : String(value || ''),
        }))
        .filter(r => r.answer && r.answer !== 'null' && r.answer !== '');
    }

    const formResponsesEmbed = app.formResponses || {};
    res.json({
      success: true,
      candidature: {
        _id:              app._id,
        applicationId:    app._id,
        userId:           user._id,
        projectName:      getStartupName(user, app),
        companyName:      getStartupName(user, app),
        founderName:      user.name,
        email:            user.email,
        sector:           user.startupProfile?.sector      || '',
        stage:            user.startupProfile?.stage       || '',
        location:         user.startupProfile?.location    || '',
        website:          user.startupProfile?.website     || '',
        description:      user.startupProfile?.description || '',
        programmeName:    app.programmeName,
        programmeId:      app.programmeId,
        status:           app.status,
        appliedAt:        app.appliedAt,
        responses,
        problemStatement: formResponsesEmbed.problemStatement || formResponsesEmbed.problem || '',
        solution:         formResponsesEmbed.solution         || formResponsesEmbed.solutionDescription || '',
        targetMarket:     formResponsesEmbed.targetMarket     || formResponsesEmbed.market || '',
        documents:        formResponsesEmbed.documents        || [],
      },
    });
  } catch (err) {
    serverError(res, err, 'getCandidatureById');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jury-space/candidatures/:applicationId/criteria
// ─────────────────────────────────────────────────────────────────────────────
exports.getCriteria = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userWithApp = await User.findOne({ 'applications._id': new mongoose.Types.ObjectId(applicationId) })
      .select('applications._id applications.programmeId').lean();
    const app = userWithApp?.applications?.find(a => a._id.toString() === applicationId);
    const programmeId = app?.programmeId;

    let criteria = [];
    try {
      const query = programmeId
        ? { $or: [{ programmeId: programmeId.toString() }, { programmeId: { $exists: false } }] }
        : {};
      const docs = await db.collection('juryCriteria').find(query).sort({ order: 1 }).toArray();
      criteria = docs.map(c => ({
        _id:         c._id.toString(),
        label:       c.label || c.name || 'Critère',
        description: c.description || '',
        weight:      c.weight   || 1,
        maxScore:    c.maxScore || 10,
        order:       c.order   || 0,
      }));
    } catch { criteria = []; }

    if (criteria.length === 0) {
      criteria = [
        { _id: 'team',       label: 'Équipe',           description: "Expérience, complémentarité et capacité d'exécution",         weight: 2, maxScore: 10, order: 1 },
        { _id: 'innovation', label: 'Innovation',        description: "Degré d'innovation et unicité de la proposition de valeur",   weight: 2, maxScore: 10, order: 2 },
        { _id: 'market',     label: 'Marché',            description: 'Taille, potentiel et accessibilité du marché cible',          weight: 2, maxScore: 10, order: 3 },
        { _id: 'business',   label: 'Modèle économique', description: 'Pertinence, durabilité et scalabilité du business model',     weight: 2, maxScore: 10, order: 4 },
        { _id: 'traction',   label: 'Traction',          description: 'Chiffres, clients, MVP et validation marché',                 weight: 2, maxScore: 10, order: 5 },
      ];
    }

    res.json({ success: true, criteria });
  } catch (err) {
    serverError(res, err, 'getCriteria');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jury-space/candidatures/:applicationId/my-evaluation
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyEvaluation = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const juryRecord = await getJuryRecord(req.user);
    const effectiveJuryId = juryRecord?._id || req.user._id;

    try {
      const col = db.collection('juryevaluations');
      const evalDoc = await col.findOne({
        applicationId: new mongoose.Types.ObjectId(applicationId),
        $or: [
          { juryId: effectiveJuryId },
          { juryId: effectiveJuryId.toString() },
          { juryId: req.user._id },
          { juryId: req.user._id.toString() },
        ],
      });

      if (evalDoc) {
        // ✅ Vérifie si les scores sont vides ou tous à 0
        const hasRealScores = (evalDoc.scores || []).some(s => Number(s.score) > 0);

        let scores      = (evalDoc.scores || []).map(formatScore);
        let computedScore = evalDoc.computedScore != null
          ? +(normToTen(evalDoc.computedScore)).toFixed(2)
          : evalDoc.totalScore != null
            ? +(normToTen(evalDoc.totalScore)).toFixed(2)
            : null;

        // ✅ Si scores vides, cherche dans users.applications.juryScores
        if (!hasRealScores) {
          try {
            const userWithApp = await User.findOne({
              'applications._id': new mongoose.Types.ObjectId(applicationId),
            }).select('applications').lean();

            const app = userWithApp?.applications?.find(
              a => a._id.toString() === applicationId
            );

            const juryScore = app?.juryScores?.find(s =>
              s.juryId?.toString() === effectiveJuryId.toString() ||
              s.juryId?.toString() === req.user._id.toString()
            );

            if (juryScore) {
              // Reconstruire les scores depuis criteriaScores
              if (juryScore.criteriaScores?.length > 0) {
                scores = juryScore.criteriaScores.map(formatScore);
              } else if (juryScore.score > 0) {
                // Pas de détail critères mais score global existe
                // On reconstruit depuis les scores de juryevaluations en les normalisant
                const DEFAULT_IDS = ['team', 'innovation', 'market', 'business', 'traction'];
                const DEFAULT_LABELS = {
                  team: 'Équipe', innovation: 'Innovation',
                  market: 'Marché', business: 'Modèle économique', traction: 'Traction'
                };
                scores = DEFAULT_IDS.map(id => ({
                  criteriaId:   id,
                  criteriaName: DEFAULT_LABELS[id],
                  score:        normToTen(juryScore.score),
                  comment:      '',
                  remark:       '',
                }));
              }

              // Met à jour computedScore depuis le vrai score
              if (juryScore.score > 0) {
                computedScore = normToTen(juryScore.score);
              }

              // ✅ Sync vers juryevaluations pour ne plus avoir ce problème
              await col.updateOne(
                { _id: evalDoc._id },
                {
                  $set: {
                    scores: scores.map(s => ({
                      criteriaId:   s.criteriaId,
                      criteriaName: s.criteriaName,
                      score:        s.score,
                      comment:      s.comment || '',
                      remark:       s.remark  || '',
                    })),
                    computedScore,
                    totalScore:    computedScore * 10,
                    globalRemark:  juryScore.comment || evalDoc.globalRemark || '',
                    status:        'submitted',
                    updatedAt:     new Date(),
                  },
                }
              );
            }
          } catch (fallbackErr) {
            console.warn('[getMyEvaluation] fallback sync error:', fallbackErr.message);
          }
        }

        return res.json({
          success: true,
          evaluation: {
            _id:            evalDoc._id.toString(),
            candidatureId:  evalDoc.applicationId,
            juryId:         evalDoc.juryId,
            juryName:       evalDoc.juryName,
            startupName:    evalDoc.startupName,
            programmeName:  evalDoc.programmeName,
            computedScore,
            totalScore:     evalDoc.totalScore,
            globalRemark:   evalDoc.globalRemark || '',
            recommendation: evalDoc.recommendation || '',
            scores,
            status:         evalDoc.status || 'submitted',
            feedbacks:      evalDoc.feedbacks      || [],
            positivePoints: evalDoc.positivePoints || [],
            negativePoints: evalDoc.negativePoints || [],
            sentToAdmin:    evalDoc.sentToAdmin    || false,
            sentToAdminAt:  evalDoc.sentToAdminAt  || null,
            submittedAt:    evalDoc.submittedAt,
            updatedAt:      evalDoc.updatedAt,
          },
        });
      }
    } catch (colErr) {
      console.warn('[getMyEvaluation] juryevaluations lookup error:', colErr.message);
    }

    // Fallback : embedded juryScores uniquement
    const userWithApp = await User.findOne({
      'applications._id': new mongoose.Types.ObjectId(applicationId),
    }).select('applications').lean();
    if (!userWithApp) return res.json({ success: true, evaluation: null });

    const app = userWithApp.applications.find(a => a._id.toString() === applicationId);
    if (!app)  return res.json({ success: true, evaluation: null });

    const juryScore = app.juryScores?.find(s =>
      (juryRecord && s.juryId?.toString() === juryRecord._id?.toString()) ||
      s.juryId?.toString() === req.user._id.toString()
    );
    if (!juryScore) return res.json({ success: true, evaluation: null });

    res.json({
      success: true,
      evaluation: {
        _id:            `${app._id}-${req.user._id}`,
        candidatureId:  app._id,
        computedScore:  normToTen(juryScore.score),
        globalRemark:   juryScore.comment || '',
        scores:         (juryScore.criteriaScores || []).map(formatScore),
        feedbacks:      [],
        positivePoints: [],
        negativePoints: [],
        sentToAdmin:    false,
        submittedAt:    juryScore.submittedAt,
      },
    });
  } catch (err) {
    serverError(res, err, 'getMyEvaluation');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/jury-space/candidatures/:applicationId/evaluate
// ─────────────────────────────────────────────────────────────────────────────
exports.submitEvaluation = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { scores, globalNote, computedScore } = req.body;

    if (computedScore === undefined) {
      return res.status(400).json({ success: false, message: 'computedScore requis' });
    }

    const juryRecord = await getJuryRecord(req.user);
    const effectiveJuryId = juryRecord?._id || req.user._id;

    const userDoc = await User.findOne({ 'applications._id': new mongoose.Types.ObjectId(applicationId) });
    if (!userDoc) return res.status(404).json({ success: false, message: 'Candidature non trouvée' });

    const app = userDoc.applications.id(applicationId);
    if (!app) return res.status(404).json({ success: false, message: 'Candidature non trouvée' });

    // ── 1. Sauvegarde dans users.applications.juryScores ─────────────────────
    const juryScore = {
      juryId:         effectiveJuryId,
      score:          parseFloat(computedScore),
      comment:        globalNote || '',
      criteriaScores: scores || [],
      submittedAt:    new Date(),
    };

    if (!app.juryScores) app.juryScores = [];
    const existingIdx = app.juryScores.findIndex(s => s.juryId?.toString() === effectiveJuryId.toString());
    const isUpdate = existingIdx >= 0;
    if (isUpdate) app.juryScores[existingIdx] = juryScore;
    else app.juryScores.push(juryScore);

    await userDoc.save();

    // ── 2. Sync vers juryevaluations ─────────────────────────────────────────
    try {
      const col = db.collection('juryevaluations');
      await col.updateOne(
        {
          applicationId: new mongoose.Types.ObjectId(applicationId),
          $or: [
            { juryId: effectiveJuryId },
            { juryId: effectiveJuryId.toString() },
          ],
        },
        {
          $set: {
            scores: (scores || []).map(s => ({
              criteriaId:   s.criterionId   || s.criteriaId   || '',
              criteriaName: s.criterionLabel || s.criteriaName || '',
              score:        Number(s.score) || 0,
              comment:      s.remark || s.comment || '',
              remark:       s.remark || s.comment || '',
            })),
            totalScore:    parseFloat(computedScore) * 10,
            computedScore: parseFloat(computedScore),
            globalRemark:  globalNote || '',
            status:        'submitted',
            submittedAt:   new Date(),
            updatedAt:     new Date(),
          },
        }
      );
    } catch (syncErr) {
      console.warn('[submitEvaluation] juryevaluations sync failed:', syncErr.message);
    }

    // ── 3. Mise à jour du compteur jury ──────────────────────────────────────
    if (juryRecord?._id) {
      db.collection('jury').updateOne(
        { _id: juryRecord._id },
        { $set: { updatedAt: new Date() }, $inc: { evaluationsCount: isUpdate ? 0 : 1 } }
      ).catch(() => {});
    }

    res.json({
      success: true,
      message: isUpdate ? 'Évaluation mise à jour' : 'Évaluation soumise avec succès',
      evaluation: {
        candidatureId: app._id,
        computedScore: juryScore.score,
        globalNote:    juryScore.comment,
        scores:        juryScore.criteriaScores,
        submittedAt:   juryScore.submittedAt,
      },
    });
  } catch (err) {
    serverError(res, err, 'submitEvaluation');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/jury-space/evaluations/:evaluationId
// ─────────────────────────────────────────────────────────────────────────────
exports.patchEvaluation = async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const { scores, globalRemark, recommendation, feedbacks, positivePoints, negativePoints } = req.body;

    let evalObjId;
    try { evalObjId = new mongoose.Types.ObjectId(evaluationId); }
    catch { return res.status(400).json({ success: false, message: 'ID invalide' }); }

    const col = db.collection('juryevaluations');
    const existing = await col.findOne({ _id: evalObjId });
    if (!existing) return res.status(404).json({ success: false, message: 'Évaluation non trouvée' });

    const juryRecord = await getJuryRecord(req.user);
    const effectiveJuryId = juryRecord?._id || req.user._id;

    const isOwner =
      existing.juryId?.toString() === effectiveJuryId.toString() ||
      existing.juryId?.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé à modifier cette évaluation' });
    }

    const updateFields = { updatedAt: new Date() };

    if (scores !== undefined) {
      const normalizedScores = scores.map(s => ({
        criteriaId:   s.criteriaId   || '',
        criteriaName: s.criteriaName || s.criteriaId || 'Critère',
        score:        normToTen(s.score),
        comment:      s.comment || s.remark || '',
        remark:       s.comment || s.remark || '',
      }));
      updateFields.scores = normalizedScores;

      if (normalizedScores.length > 0) {
        const avg = normalizedScores.reduce((sum, s) => sum + (Number(s.score) || 0), 0) / normalizedScores.length;
        updateFields.computedScore = +avg.toFixed(2);
        updateFields.totalScore    = +(avg * 10).toFixed(1);
      }
    }

    if (globalRemark   !== undefined) updateFields.globalRemark   = globalRemark;
    if (recommendation !== undefined) updateFields.recommendation = recommendation;
    if (feedbacks      !== undefined) {
      updateFields.feedbacks = feedbacks.map(f =>
        typeof f === 'string' ? { text: f, type: 'general', createdAt: new Date() } : f
      );
    }
    if (positivePoints !== undefined) updateFields.positivePoints = positivePoints;
    if (negativePoints !== undefined) updateFields.negativePoints = negativePoints;

    await col.updateOne({ _id: evalObjId }, { $set: updateFields });
    const updated = await col.findOne({ _id: evalObjId });

    res.json({
      success: true,
      message: 'Évaluation mise à jour',
      evaluation: {
        ...updated,
        scores: (updated.scores || []).map(formatScore),
      },
    });
  } catch (err) {
    serverError(res, err, 'patchEvaluation');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/jury-space/evaluations/:evaluationId/send-to-admin
// ─────────────────────────────────────────────────────────────────────────────
exports.sendEvaluationToAdmin = async (req, res) => {
  try {
    const { evaluationId } = req.params;

    let evalObjId;
    try { evalObjId = new mongoose.Types.ObjectId(evaluationId); }
    catch { return res.status(400).json({ success: false, message: 'ID invalide' }); }

    const col = db.collection('juryevaluations');
    const existing = await col.findOne({ _id: evalObjId });
    if (!existing) return res.status(404).json({ success: false, message: 'Évaluation non trouvée' });

    const juryRecord = await getJuryRecord(req.user);
    const effectiveJuryId = juryRecord?._id || req.user._id;

    const isOwner =
      existing.juryId?.toString() === effectiveJuryId.toString() ||
      existing.juryId?.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await col.updateOne(
      { _id: evalObjId },
      {
        $set: {
          sentToAdmin:   true,
          sentToAdminAt: new Date(),
          status:        'submitted',
          submittedAt:   existing.submittedAt || new Date(),
          updatedAt:     new Date(),
        },
      }
    );

    // Sync vers users.applications
    if (existing.applicationId) {
      try {
        const userDoc = await User.findOne({ 'applications._id': existing.applicationId });
        if (userDoc) {
          const app = userDoc.applications.id(existing.applicationId.toString());
          if (app) {
            const scoreVal = existing.computedScore ?? normToTen(existing.totalScore);
            const juryScore = {
              juryId:         effectiveJuryId,
              score:          scoreVal,
              comment:        existing.globalRemark || '',
              criteriaScores: (existing.scores || []).map(s => ({
                criteriaId:   s.criteriaId,
                criteriaName: s.criteriaName,
                score:        s.score,
                remark:       s.remark  || s.comment || '',
                comment:      s.comment || s.remark  || '',
              })),
              submittedAt: new Date(),
            };
            if (!app.juryScores) app.juryScores = [];
            const idx = app.juryScores.findIndex(s => s.juryId?.toString() === effectiveJuryId.toString());
            if (idx >= 0) app.juryScores[idx] = juryScore;
            else app.juryScores.push(juryScore);
            await userDoc.save();
          }
        }
      } catch (syncErr) {
        console.warn('[sendEvaluationToAdmin] sync failed:', syncErr.message);
      }
    }

    res.json({ success: true, message: "Évaluation envoyée à l'administration avec succès" });
  } catch (err) {
    serverError(res, err, 'sendEvaluationToAdmin');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jury-space/my-evaluations
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyEvaluations = async (req, res) => {
  try {
    const juryRecord = await getJuryRecord(req.user);
    const effectiveJuryId = juryRecord?._id || req.user._id;

    const col = db.collection('juryevaluations');

    const docs = await col.find({
      $or: [
        { juryId: effectiveJuryId },
        { juryId: effectiveJuryId.toString() },
        { juryId: req.user._id },
        { juryId: req.user._id.toString() },
      ],
    }).sort({ submittedAt: -1 }).toArray();

    const evaluations = docs.map(ev => {
      let computedScore = null;

      if (ev.computedScore != null && !isNaN(Number(ev.computedScore))) {
        computedScore = normToTen(ev.computedScore);
      } else if (ev.totalScore != null && !isNaN(Number(ev.totalScore))) {
        computedScore = normToTen(ev.totalScore);
      } else if (ev.scores?.length) {
        const rawScores = ev.scores.map(s => Number(s.score) || 0);
        const avg = rawScores.reduce((a, b) => a + b, 0) / rawScores.length;
        computedScore = normToTen(avg);
      }

      const rawScores = ev.scores || [];
      const anyOver10 = rawScores.some(s => Number(s.score) > 10);

      const formattedScores = rawScores.map(s => {
        const rawVal     = Number(s.score) || 0;
        const normalized = anyOver10 ? +(rawVal / 10).toFixed(2) : +rawVal.toFixed(2);
        return {
          criteriaId:   s.criteriaId   || s.criteriaName?.toLowerCase().replace(/\s+/g, '_') || '',
          criteriaName: s.criteriaName || s.criteriaId || 'Critère',
          score:        normalized,
          comment:      s.comment || s.remark || '',
          remark:       s.comment || s.remark || '',
        };
      });

      return {
        _id: ev._id.toString(),
        candidatureId: {
          _id:         ev.applicationId?.toString() || '',
          projectName: ev.startupName || 'Candidature',
          companyName: ev.startupName || 'Candidature',
        },
        applicationId: ev.applicationId?.toString() || '',
        juryInfo: {
          name:  ev.juryName  || '',
          email: ev.juryEmail || '',
        },
        candidatureInfo: {
          name:      ev.startupName   || 'Candidature',
          programme: ev.programmeName || '—',
        },
        startupName:    ev.startupName    || 'Candidature',
        juryName:       ev.juryName       || '',
        programme:      ev.programmeName  || '—',
        programmeName:  ev.programmeName  || '—',
        computedScore,
        totalScore:     ev.totalScore     ?? null,
        globalRemark:   ev.globalRemark   || '',
        recommendation: ev.recommendation || '',
        scores:         formattedScores,
        status:         ev.status         || 'submitted',
        feedbacks: (ev.feedbacks || []).map(f =>
          typeof f === 'string' ? { text: f } : (f?.text ? f : { text: String(f) })
        ),
        positivePoints: ev.positivePoints || [],
        negativePoints: ev.negativePoints || [],
        sentToAdmin:    ev.sentToAdmin    || false,
        sentToAdminAt:  ev.sentToAdminAt  || null,
        submittedAt:    ev.submittedAt,
        updatedAt:      ev.updatedAt,
        _source:        'juryevaluations',
      };
    });

    // Fallback : embedded juryScores non présents dans juryevaluations
    const existingAppIds = new Set(
      evaluations.map(e => e.candidatureId?._id?.toString()).filter(Boolean)
    );

    const usersWithScores = await User.find({
      'applications.juryScores.juryId': { $in: [effectiveJuryId, req.user._id] },
    }).select('name startupProfile applications').lean();

    const fallbackEvaluations = [];
    usersWithScores.forEach(u => {
      u.applications.forEach(app => {
        if (existingAppIds.has(app._id.toString())) return;

        const myScore = app.juryScores?.find(s =>
          s.juryId?.toString() === effectiveJuryId.toString() ||
          s.juryId?.toString() === req.user._id.toString()
        );
        if (!myScore) return;

        const embeddedScores = (myScore.criteriaScores || []);
        const anyOver10Emb   = embeddedScores.some(s => Number(s.score) > 10);

        fallbackEvaluations.push({
          _id:            `${app._id}-${effectiveJuryId}`,
          candidatureId:  { _id: app._id, projectName: getStartupName(u, app), companyName: getStartupName(u, app) },
          juryInfo:        { name: req.user.name || '', email: req.user.email || '' },
          candidatureInfo: { name: getStartupName(u, app), programme: app.programmeName || '—' },
          startupName:    getStartupName(u, app),
          programmeName:  app.programmeName || '—',
          computedScore:  normToTen(myScore.score),
          globalRemark:   myScore.comment || '',
          scores:         embeddedScores.map(s => {
            const rawVal     = Number(s.score) || 0;
            const normalized = anyOver10Emb ? +(rawVal / 10).toFixed(2) : +rawVal.toFixed(2);
            return {
              criteriaId:   s.criteriaId   || s.criteriaName?.toLowerCase().replace(/\s+/g, '_') || '',
              criteriaName: s.criteriaName || s.criteriaId || 'Critère',
              score:        normalized,
              comment:      s.comment || s.remark || '',
              remark:       s.comment || s.remark || '',
            };
          }),
          status:         'submitted',
          feedbacks:      [],
          positivePoints: [],
          negativePoints: [],
          sentToAdmin:    false,
          submittedAt:    myScore.submittedAt,
          _source:        'embedded',
        });
      });
    });

    const finalEvaluations = [...evaluations, ...fallbackEvaluations]
      .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));

    const avgScore = finalEvaluations.length
      ? (finalEvaluations.reduce((a, e) => a + (e.computedScore || 0), 0) / finalEvaluations.length).toFixed(1)
      : null;

    res.json({ success: true, evaluations: finalEvaluations, avgScore });
  } catch (err) {
    serverError(res, err, 'getMyEvaluations');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jury-space/debug  (admin only)
// ─────────────────────────────────────────────────────────────────────────────
exports.debugInfo = async (req, res) => {
  try {
    const juryRecord    = await getJuryRecord(req.user);
    const allJuryDocs   = await db.collection('jury').find({}).limit(20).toArray();
    const allProgrammes = await db.collection('programmes').find({}, { projection: { _id: 1, name: 1 } }).toArray();

    res.json({
      connectedUser: { _id: req.user._id, email: req.user.email, name: req.user.name, role: req.user.role },
      juryRecordFound:  !!juryRecord,
      juryRecord:       juryRecord || null,
      allJuryDocsInDB:  allJuryDocs.map(j => ({
        _id: j._id, name: j.name, email: j.email, userId: j.userId,
        assignedProgrammeIds: j.assignedProgrammeIds,
      })),
      allProgrammes,
    });
  } catch (err) {
    serverError(res, err, 'debugInfo');
  }
};
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/jury-space/sync-evaluations
// Migre les scores depuis users.applications.juryScores → juryevaluations
// ─────────────────────────────────────────────────────────────────────────────
exports.syncEvaluations = async (req, res) => {
  try {
    const juryRecord      = await getJuryRecord(req.user);
    const effectiveJuryId = juryRecord?._id || req.user._id;
    const col             = db.collection('juryevaluations');

    // 1. Cherche tous les juryevaluations de ce jury avec scores vides ou à 0
    const pendingDocs = await col.find({
      $or: [
        { juryId: effectiveJuryId },
        { juryId: effectiveJuryId.toString() },
        { juryId: req.user._id },
        { juryId: req.user._id.toString() },
      ],
      $or: [
        { status: 'pending' },
        { totalScore: 0 },
        { scores: { $size: 0 } },
        { 'scores.score': 0 },
      ],
    }).toArray();

    let synced = 0;
    let skipped = 0;

    for (const evalDoc of pendingDocs) {
      if (!evalDoc.applicationId) { skipped++; continue; }

      // 2. Cherche le vrai score dans users.applications.juryScores
      let appObjId;
      try { appObjId = new mongoose.Types.ObjectId(evalDoc.applicationId); }
      catch { skipped++; continue; }

      const userDoc = await User.findOne({
        'applications._id': appObjId,
      }).select('applications').lean();

      if (!userDoc) { skipped++; continue; }

      const app = userDoc.applications.find(
        a => a._id.toString() === evalDoc.applicationId.toString()
      );
      if (!app) { skipped++; continue; }

      const juryScore = app.juryScores?.find(s =>
        s.juryId?.toString() === effectiveJuryId.toString() ||
        s.juryId?.toString() === req.user._id.toString()
      );
      if (!juryScore || !(juryScore.score > 0)) { skipped++; continue; }

      // 3. Reconstruit les scores depuis criteriaScores ou score global
      let scores;
      if (juryScore.criteriaScores?.length > 0) {
        scores = juryScore.criteriaScores.map(s => ({
          criteriaId:   s.criteriaId   || s.criteriaName?.toLowerCase().replace(/\s+/g, '_') || '',
          criteriaName: s.criteriaName || s.criteriaId || 'Critère',
          score:        normToTen(s.score),
          comment:      s.comment || s.remark || '',
          remark:       s.comment || s.remark || '',
        }));
      } else {
        // Pas de détail → reconstruit les 5 critères avec le score global
        const DEFAULT_IDS    = ['team', 'innovation', 'market', 'business', 'traction'];
        const DEFAULT_LABELS = {
          team: 'Équipe', innovation: 'Innovation',
          market: 'Marché', business: 'Modèle économique', traction: 'Traction',
        };
        const normalizedScore = normToTen(juryScore.score);
        scores = DEFAULT_IDS.map(id => ({
          criteriaId:   id,
          criteriaName: DEFAULT_LABELS[id],
          score:        normalizedScore,
          comment:      '',
          remark:       '',
        }));
      }

      const computedScore = normToTen(juryScore.score);

      // 4. Met à jour le document juryevaluations
      await col.updateOne(
        { _id: evalDoc._id },
        {
          $set: {
            scores,
            computedScore,
            totalScore:   computedScore * 10,
            globalRemark: juryScore.comment || evalDoc.globalRemark || '',
            status:       'submitted',
            submittedAt:  juryScore.submittedAt || new Date(),
            updatedAt:    new Date(),
          },
        }
      );
      synced++;
    }

    res.json({
      success: true,
      message: `Sync terminée : ${synced} évaluation(s) mise(s) à jour, ${skipped} ignorée(s).`,
      synced,
      skipped,
    });
  } catch (err) {
    serverError(res, err, 'syncEvaluations');
  }
};