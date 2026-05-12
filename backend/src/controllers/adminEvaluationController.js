// controllers/adminEvaluationController.js
// ─────────────────────────────────────────────────────────────────────────────
// FIXES :
//   1. ✅ Conversion scores /10 → /100
//   2. ✅ programmeId normalisé en string
//   3. ✅ jurySubmitted correct depuis status === 'submitted'
//   4. ✅ enrichissement startupName/founder/sector depuis Application
//   5. ✅ totalScore recalculé si < 10 (détection échelle /10)
//   6. ✅ FIX getByProgramme : applicationId inclus dans formattedEvals
//   7. ✅ FIX getByProgramme : tous les champs détail transmis (globalRemark, pointsCles, etc.)
// ─────────────────────────────────────────────────────────────────────────────
const mongoose = require('mongoose');
const db = mongoose.connection;

const evalCol = () => db.collection('juryevaluations');
const appCol  = () => db.collection('applications');
const juryCol = () => db.collection('users');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeScores(raw) {
  const defaults = { team: 0, innovation: 0, market: 0, business: 0, traction: 0 };
  let obj = { ...defaults };

  if (!raw) return defaults;

  if (Array.isArray(raw)) {
    raw.forEach(s => {
      if (s.criteriaId) obj[s.criteriaId] = s.score ?? 0;
    });
  } else if (typeof raw === 'object') {
    obj = {
      team:       raw.team       ?? raw.equipe    ?? 0,
      innovation: raw.innovation ?? 0,
      market:     raw.market     ?? raw.marche    ?? 0,
      business:   raw.business   ?? raw.modele    ?? 0,
      traction:   raw.traction   ?? 0,
    };
  }

  const maxVal = Math.max(...Object.values(obj));
  if (maxVal > 0 && maxVal <= 10) {
    Object.keys(obj).forEach(k => { obj[k] = Math.round(obj[k] * 10); });
  }

  return obj;
}

function computeTotalScore(rawTotal, scores) {
  if (rawTotal != null && rawTotal <= 10 && rawTotal > 0) {
    return Math.round(rawTotal * 10);
  }
  if (!rawTotal || rawTotal === 0) {
    const weights = { team: 30, innovation: 25, market: 20, business: 15, traction: 10 };
    const total = Object.entries(weights).reduce((sum, [key, w]) => {
      return sum + (scores[key] || 0) * (w / 100);
    }, 0);
    return Math.round(total);
  }
  return rawTotal;
}

function scoresObjToArray(obj) {
  const labels = {
    team: 'Équipe', innovation: 'Innovation',
    market: 'Marché', business: 'Modèle économique', traction: 'Traction',
  };
  return Object.entries(obj).map(([criteriaId, score]) => ({
    criteriaId,
    criteriaName: labels[criteriaId] || criteriaId,
    score:        Number(score) || 0,
    remark:       '',
  }));
}

function enrichEval(e, juryMap, appMap) {
  const jury = juryMap[e.juryId?.toString()] || null;
  const app  = appMap[e.applicationId?.toString()] || null;

  const scoresObj  = normalizeScores(e.scores);
  const totalScore = computeTotalScore(e.totalScore, scoresObj);

  const jurySubmitted = e.jurySubmitted === true
    || e.status === 'submitted'
    || e.status === 'completed';

  const programmeId = e.programmeId?.toString() || null;

  return {
    ...e,
    id:            e._id.toString(),
    applicationId: e.applicationId?.toString() || null,
    programmeId,
    juryId:        e.juryId?.toString() || null,

    startupName:   e.startupName   || app?.startupName   || app?.project?.startupName || 'N/A',
    founder:       e.founder       || app?.founder       || app?.team?.founderName    || 'N/A',
    founderName:   e.founderName   || app?.founderName   || app?.team?.founderName    || 'N/A',
    email:         e.email         || app?.email         || app?.team?.founderEmail   || '',
    sector:        e.sector        || app?.sector        || 'N/A',
    stage:         e.stage         || app?.stage         || app?.project?.stage       || '',
    programmeName: e.programmeName || app?.programmeName || null,

    juryName:  e.juryName || jury?.name || 'Jury',
    jurorName: e.juryName || jury?.name || 'Jury',
    juryInfo: {
      _id:   e.juryId?.toString() || '',
      name:  jury?.name || e.juryName || 'Jury',
      email: jury?.email || '',
    },
    candidatureInfo: {
      _id:       e.applicationId?.toString() || '',
      name:      app?.startupName || e.startupName || 'Candidature',
      programme: app?.programmeName || e.programmeName || '—',
    },

    scores:     scoresObj,
    totalScore,
    status:     e.status || 'pending',
    jurySubmitted,

    recommendation: e.recommendation || '',
    globalRemark:   e.globalRemark || e.feedback || '',
    feedback:       e.globalRemark || e.feedback || '',
    submittedAt:    e.submittedAt || e.createdAt,
    updatedAt:      e.updatedAt,
    createdAt:      e.createdAt,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// GET /api/admin/evaluations
// ════════════════════════════════════════════════════════════════════════════
exports.getAll = async (req, res) => {
  try {
    const { juryId, applicationId, programmeId, status, sector } = req.query;

    const filter = {};
    if (juryId        && mongoose.Types.ObjectId.isValid(juryId))
      filter.juryId        = new mongoose.Types.ObjectId(juryId);
    if (applicationId && mongoose.Types.ObjectId.isValid(applicationId))
      filter.applicationId = new mongoose.Types.ObjectId(applicationId);
    if (programmeId   && mongoose.Types.ObjectId.isValid(programmeId))
      filter.programmeId   = new mongoose.Types.ObjectId(programmeId);
    if (status)  filter.status = status;
    if (sector)  filter.sector = sector;

    const evals = await evalCol()
      .find(filter)
      .sort({ submittedAt: -1, createdAt: -1 })
      .toArray();

    if (evals.length === 0)
      return res.json({ success: true, evaluations: [], total: 0 });

    const juryOids = [...new Set(evals.map(e => e.juryId?.toString()).filter(Boolean))]
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const juryMembers = juryOids.length
      ? await juryCol().find({ _id: { $in: juryOids } }).project({ name: 1, email: 1 }).toArray()
      : [];

    const juryMap = Object.fromEntries(juryMembers.map(j => [j._id.toString(), j]));

    const appOids = [...new Set(evals.map(e => e.applicationId?.toString()).filter(Boolean))]
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const applications = appOids.length
      ? await appCol()
          .find({ _id: { $in: appOids } })
          .project({
            startupName: 1, founder: 1, founderName: 1, email: 1,
            sector: 1, stage: 1, programmeName: 1, programmeId: 1,
            'project.startupName': 1, 'project.stage': 1,
            'team.founderName': 1, 'team.founderEmail': 1,
            'startupProfile.startupName': 1, 'startupProfile.sector': 1,
          })
          .toArray()
      : [];

    const appMap = Object.fromEntries(applications.map(a => {
      const normalized = {
        ...a,
        startupName: a.startupName || a.project?.startupName || a.startupProfile?.startupName,
        founder:     a.founder     || a.team?.founderName,
        sector:      a.sector      || a.startupProfile?.sector,
      };
      return [a._id.toString(), normalized];
    }));

    const enriched = evals.map(e => enrichEval(e, juryMap, appMap));

    res.json({ success: true, evaluations: enriched, total: enriched.length });
  } catch (err) {
    console.error('[adminEvaluation.getAll]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// POST /api/admin/evaluations/remind
// ════════════════════════════════════════════════════════════════════════════
exports.sendReminder = async (req, res) => {
  try {
    const { juryId, applicationId } = req.body;
    if (!juryId || !applicationId)
      return res.status(400).json({ success: false, message: 'juryId et applicationId requis' });

    const [juryMember, app] = await Promise.all([
      mongoose.Types.ObjectId.isValid(juryId)
        ? juryCol().findOne(
            { _id: new mongoose.Types.ObjectId(juryId) },
            { projection: { name: 1, email: 1 } }
          )
        : juryCol().findOne({ name: juryId }, { projection: { name: 1, email: 1 } }),
      mongoose.Types.ObjectId.isValid(applicationId)
        ? appCol().findOne(
            { _id: new mongoose.Types.ObjectId(applicationId) },
            { projection: { startupName: 1, programmeName: 1 } }
          )
        : null,
    ]);

    if (!juryMember)
      return res.status(404).json({ success: false, message: 'Juré introuvable' });

    console.log(`[Reminder] Envoi à ${juryMember.email} pour ${app?.startupName || applicationId}`);

    await db.collection('notifications').insertOne({
      type:           'jury_reminder',
      recipientId:    juryMember._id,
      recipientName:  juryMember.name,
      recipientEmail: juryMember.email,
      applicationId:  mongoose.Types.ObjectId.isValid(applicationId)
        ? new mongoose.Types.ObjectId(applicationId) : null,
      startupName:    app?.startupName || '',
      programmeName:  app?.programmeName || '',
      sentAt:         new Date(),
      sentBy:         req.user?.id || 'admin',
    });

    res.json({
      success: true,
      message: `Rappel envoyé à ${juryMember.name} (${juryMember.email})`,
    });
  } catch (err) {
    console.error('[adminEvaluation.sendReminder]', err);
    res.status(500).json({ success: false, message: "Erreur lors de l'envoi du rappel" });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// GET /api/admin/evaluations/stats
// ════════════════════════════════════════════════════════════════════════════
exports.getStats = async (req, res) => {
  try {
    const [total, submitted, pending, inProgress] = await Promise.all([
      evalCol().countDocuments({}),
      evalCol().countDocuments({ $or: [{ status: 'submitted' }, { status: 'completed' }, { jurySubmitted: true }] }),
      evalCol().countDocuments({ status: 'pending' }),
      evalCol().countDocuments({ status: 'in_progress' }),
    ]);

    const submittedDocs = await evalCol()
      .find({ $or: [{ status: 'submitted' }, { status: 'completed' }, { jurySubmitted: true }] })
      .project({ totalScore: 1 })
      .toArray();

    const scores = submittedDocs.map(e => {
      const s = e.totalScore || 0;
      return s <= 10 && s > 0 ? s * 10 : s;
    });

    const avgScore = scores.length
      ? Math.round(scores.reduce((a, s) => a + s, 0) / scores.length)
      : 0;

    const completionRate = total > 0 ? Math.round((submitted / total) * 100) : 0;

    const [juryDistinct, appDistinct] = await Promise.all([
      evalCol().distinct('juryId'),
      evalCol().distinct('applicationId'),
    ]);

    res.json({
      success: true,
      stats: {
        total, submitted, pending, inProgress,
        avgScore, completionRate,
        juryCount:        juryDistinct.length,
        applicationCount: appDistinct.length,
      },
    });
  } catch (err) {
    console.error('[adminEvaluation.getStats]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// GET /api/admin/evaluations/:id
// ════════════════════════════════════════════════════════════════════════════
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'ID invalide' });

    const ev = await evalCol().findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (!ev)
      return res.status(404).json({ success: false, message: 'Évaluation introuvable' });

    const [juryDoc, appDoc] = await Promise.all([
      ev.juryId && mongoose.Types.ObjectId.isValid(ev.juryId.toString())
        ? juryCol().findOne(
            { _id: new mongoose.Types.ObjectId(ev.juryId.toString()) },
            { projection: { name: 1, email: 1 } }
          )
        : null,
      ev.applicationId && mongoose.Types.ObjectId.isValid(ev.applicationId.toString())
        ? appCol().findOne(
            { _id: new mongoose.Types.ObjectId(ev.applicationId.toString()) },
            { projection: {
                startupName: 1, founder: 1, founderName: 1, email: 1,
                sector: 1, stage: 1, programmeName: 1, programmeId: 1,
                'project.startupName': 1, 'project.stage': 1,
                'team.founderName': 1, 'team.founderEmail': 1,
                'startupProfile.startupName': 1, 'startupProfile.sector': 1,
              }
            }
          )
        : null,
    ]);

    const juryMap = juryDoc ? { [ev.juryId.toString()]: juryDoc } : {};
    const appMap  = appDoc ? {
      [ev.applicationId.toString()]: {
        ...appDoc,
        startupName: appDoc.startupName || appDoc.project?.startupName || appDoc.startupProfile?.startupName,
        founder:     appDoc.founder     || appDoc.team?.founderName,
        sector:      appDoc.sector      || appDoc.startupProfile?.sector,
      }
    } : {};

    res.json({ success: true, evaluation: enrichEval(ev, juryMap, appMap) });
  } catch (err) {
    console.error('[adminEvaluation.getOne]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// PATCH /api/admin/evaluations/:id
// ════════════════════════════════════════════════════════════════════════════
exports.updateEval = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'ID invalide' });

    const { scores, totalScore, feedback, status, jurySubmitted } = req.body;

    const update = { updatedAt: new Date() };

    if (scores && typeof scores === 'object' && !Array.isArray(scores)) {
      update.scores = scoresObjToArray(scores);
    } else if (Array.isArray(scores)) {
      update.scores = scores;
    }

    if (totalScore  !== undefined) update.totalScore   = Number(totalScore);
    if (feedback    !== undefined) { update.globalRemark = feedback; update.feedback = feedback; }
    if (status      !== undefined) update.status        = status;
    if (jurySubmitted !== undefined) {
      update.jurySubmitted = Boolean(jurySubmitted);
      if (jurySubmitted && !status) update.status = 'submitted';
      if (!jurySubmitted && !status) update.status = 'in_progress';
    }
    if (jurySubmitted === true) update.submittedAt = new Date();

    const result = await evalCol().updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: update }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ success: false, message: 'Évaluation introuvable' });

    const ev = await evalCol().findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (ev?.applicationId && totalScore !== undefined) {
      const allEvals = await evalCol()
        .find({ applicationId: ev.applicationId })
        .project({ totalScore: 1 })
        .toArray();

      if (allEvals.length > 0) {
        const scores100 = allEvals.map(e => {
          const s = e.totalScore || 0;
          return s <= 10 && s > 0 ? s * 10 : s;
        });
        const avgScore = Math.round(scores100.reduce((a, s) => a + s, 0) / scores100.length);
        await appCol().updateOne(
          { _id: ev.applicationId },
          { $set: { totalScore: avgScore, updatedAt: new Date() } }
        );
      }
    }

    res.json({ success: true, message: 'Évaluation mise à jour avec succès' });
  } catch (err) {
    console.error('[adminEvaluation.updateEval]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// GET /api/admin/evaluations/by-application/:applicationId
// ════════════════════════════════════════════════════════════════════════════
exports.getByApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(applicationId))
      return res.status(400).json({ success: false, message: 'applicationId invalide' });

    const evals = await evalCol()
      .find({ applicationId: new mongoose.Types.ObjectId(applicationId) })
      .sort({ submittedAt: -1 })
      .toArray();

    const juryOids = evals
      .map(e => e.juryId?.toString()).filter(Boolean)
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const juryMembers = juryOids.length
      ? await juryCol().find({ _id: { $in: juryOids } }).project({ name: 1, email: 1 }).toArray()
      : [];

    const juryMap = Object.fromEntries(juryMembers.map(j => [j._id.toString(), j]));

    const appDoc = await appCol().findOne(
      { _id: new mongoose.Types.ObjectId(applicationId) },
      { projection: { startupName: 1, founder: 1, sector: 1, programmeName: 1,
          'project.startupName': 1, 'team.founderName': 1, 'startupProfile.sector': 1 } }
    );
    const appMap = appDoc ? {
      [applicationId]: {
        ...appDoc,
        startupName: appDoc.startupName || appDoc.project?.startupName,
        founder:     appDoc.founder     || appDoc.team?.founderName,
        sector:      appDoc.sector      || appDoc.startupProfile?.sector,
      }
    } : {};

    const enriched = evals.map(e => enrichEval(e, juryMap, appMap));
    const avgScore = enriched.length
      ? Math.round(enriched.reduce((a, e) => a + (e.totalScore || 0), 0) / enriched.length)
      : 0;

    res.json({
      success: true,
      evaluations: enriched,
      total: enriched.length,
      avgScore,
      allSubmitted: enriched.every(e => e.jurySubmitted),
    });
  } catch (err) {
    console.error('[adminEvaluation.getByApplication]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// GET /api/admin/programmes/:id/evaluations
// ════════════════════════════════════════════════════════════════════════════
exports.getByProgramme = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'programmeId invalide' });

    const programmeOid = new mongoose.Types.ObjectId(id);

    const progDoc = await db.collection('programmes').findOne(
      { _id: programmeOid },
      { projection: { titre: 1, title: 1 } }
    );
    const programmeName = progDoc?.titre || progDoc?.title || '';

    const filter = programmeName
      ? { $or: [{ programmeId: programmeOid }, { programmeName: programmeName }] }
      : { programmeId: programmeOid };

    const evals = await evalCol()
      .find(filter)
      .sort({ submittedAt: -1, createdAt: -1 })
      .toArray();

    if (evals.length === 0) {
      return res.json({
        success: true, evaluations: [],
        totalEvaluated: 0, pending: 0, avgScore: null, completionRate: 0,
      });
    }

    // Batch-fetch jurés
    const juryOids = [...new Set(evals.map(e => e.juryId?.toString()).filter(Boolean))]
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const juryMembers = juryOids.length
      ? await juryCol().find({ _id: { $in: juryOids } }).project({ name: 1, email: 1 }).toArray()
      : [];
    const juryMap = Object.fromEntries(juryMembers.map(j => [j._id.toString(), j]));

    // Batch-fetch applications
    const appOids = [...new Set(evals.map(e => e.applicationId?.toString()).filter(Boolean))]
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const applications = appOids.length
      ? await appCol()
          .find({ _id: { $in: appOids } })
          .project({
            startupName: 1, founder: 1, sector: 1, programmeName: 1,
            'project.startupName': 1, 'team.founderName': 1,
            'startupProfile.startupName': 1, 'startupProfile.sector': 1,
          })
          .toArray()
      : [];

    const appMap = Object.fromEntries(applications.map(a => [a._id.toString(), {
      ...a,
      startupName: a.startupName || a.project?.startupName || a.startupProfile?.startupName,
      founder:     a.founder     || a.team?.founderName,
      sector:      a.sector      || a.startupProfile?.sector,
    }]));

    const enriched = evals.map(e => enrichEval(e, juryMap, appMap));

    const submitted = enriched.filter(e => e.jurySubmitted);
    const pending   = enriched.filter(e => !e.jurySubmitted);
    const scores100 = submitted.map(e => e.totalScore || 0).filter(s => s > 0);
    const avgScore  = scores100.length
      ? Math.round(scores100.reduce((a, s) => a + s, 0) / scores100.length)
      : null;

    // ✅ FIX 6 & 7 : formattedEvals inclut applicationId + tous les champs détail
    const formattedEvals = enriched.map(e => ({
      // ─ Identifiants ─
      id:            e.id,
      applicationId: e.applicationId,   // ← FIX 6 : manquait, bloquait le grouping

      // ─ Infos startup ─
      startup:       e.startupName,
      startupName:   e.startupName,
      sector:        e.sector,
      founder:       e.founder,

      // ─ Infos jury ─
      juryName:      e.jurorName,
      jurorName:     e.jurorName,

      // ─ Scores ─
      score:         e.totalScore,
      totalScore:    e.totalScore,
      scores:        e.scores,          // ← critères détaillés (team/innovation/...)

      // ─ Statut ─
      status:        e.jurySubmitted ? 'completed' : (e.status || 'pending'),
      jurySubmitted: e.jurySubmitted,

      // ─ Dates ─
      date:          e.submittedAt || e.createdAt,
      submittedAt:   e.submittedAt,
      createdAt:     e.createdAt,

      // ─ Contenu détail (onglets Note globale / Points clés / Feedback) ─
      // ✅ FIX 7 : ces champs étaient absents → onglets vides dans EvalDetailModal
      feedback:      e.feedback      || e.globalRemark || '',
      globalRemark:  e.globalRemark  || e.feedback     || '',
      noteGlobale:   e.noteGlobale   || e.globalRemark || e.feedback || '',
      pointsCles:    e.pointsCles    || e.keyPoints    || null,
      recommendation: e.recommendation || '',
    }));

    res.json({
      success:        true,
      evaluations:    formattedEvals,
      totalEvaluated: submitted.length,
      pending:        pending.length,
      avgScore,
      completionRate: enriched.length > 0
        ? Math.round((submitted.length / enriched.length) * 100)
        : 0,
    });
  } catch (err) {
    console.error('[adminEvaluation.getByProgramme]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.blockWrite = (req, res) => {
  res.status(403).json({
    success: false,
    message: "Cette opération n'est pas autorisée depuis l'espace administrateur.",
  });
};