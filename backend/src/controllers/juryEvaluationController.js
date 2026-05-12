// controllers/juryEvaluationController.js
const mongoose = require('mongoose');
const db = mongoose.connection;

const evalCol = () => db.collection('juryevaluations');
const appCol  = () => db.collection('applications');
const juryCol = () => db.collection('jury');

// ════════════════════════════════════════════════════
// GET /api/evaluations  — list all evaluations (admin)
// ════════════════════════════════════════════════════
exports.getAllEvaluations = async (req, res) => {
  try {
    const { applicationId, juryId, status } = req.query;
    const filter = {};
    if (applicationId && mongoose.Types.ObjectId.isValid(applicationId))
      filter.applicationId = new mongoose.Types.ObjectId(applicationId);
    if (juryId && mongoose.Types.ObjectId.isValid(juryId))
      filter.juryId = new mongoose.Types.ObjectId(juryId);
    if (status) filter.status = status;

    const evals = await evalCol().find(filter).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, evaluations: evals.map(e => ({ ...e, id: e._id.toString() })), total: evals.length });
  } catch (err) {
    console.error('[getAllEvaluations]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════
// GET /api/evaluations/application/:applicationId
// Get all jury evaluations for one application
// ════════════════════════════════════════════════════
exports.getEvaluationsByApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(applicationId))
      return res.status(400).json({ success: false, message: 'ID invalide' });

    const evals = await evalCol()
      .find({ applicationId: new mongoose.Types.ObjectId(applicationId) })
      .sort({ submittedAt: -1 })
      .toArray();

    // Compute aggregate scores
    const submitted = evals.filter(e => e.status === 'submitted');
    const avgScore  = submitted.length
      ? Math.round(submitted.reduce((a, e) => a + (e.totalScore || 0), 0) / submitted.length)
      : 0;

    res.json({
      success: true,
      evaluations: evals.map(e => ({ ...e, id: e._id.toString() })),
      total: evals.length,
      avgScore,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════
// GET /api/evaluations/jury/:juryId
// Get all evaluations by a specific jury member
// ════════════════════════════════════════════════════
exports.getEvaluationsByJury = async (req, res) => {
  try {
    const { juryId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(juryId))
      return res.status(400).json({ success: false, message: 'ID invalide' });

    const evals = await evalCol()
      .find({ juryId: new mongoose.Types.ObjectId(juryId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      evaluations: evals.map(e => ({ ...e, id: e._id.toString() })),
      total: evals.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════
// POST /api/evaluations  — submit evaluation (jury)
// ════════════════════════════════════════════════════
exports.submitEvaluation = async (req, res) => {
  try {
    const {
      applicationId, juryId, juryName,
      startupName, programme, scores = [],
      globalRemark, recommendation,
    } = req.body;

    if (!applicationId || !juryId)
      return res.status(400).json({ success: false, message: 'applicationId et juryId requis' });

    // Check for existing evaluation
    let existingFilter = {};
    if (mongoose.Types.ObjectId.isValid(applicationId) && mongoose.Types.ObjectId.isValid(juryId)) {
      existingFilter = {
        applicationId: new mongoose.Types.ObjectId(applicationId),
        juryId:        new mongoose.Types.ObjectId(juryId),
      };
    }

    const existing = Object.keys(existingFilter).length
      ? await evalCol().findOne(existingFilter)
      : null;

    // Calculate total score (weighted average)
    const WEIGHTS = { team: 30, innovation: 25, market: 20, business: 15, traction: 10 };
    const totalScore = Math.round(
      scores.reduce((sum, s) => sum + (s.score || 0) * ((WEIGHTS[s.criteriaId] || 20) / 100), 0)
    );

    const evalData = {
      applicationId: mongoose.Types.ObjectId.isValid(applicationId)
        ? new mongoose.Types.ObjectId(applicationId) : applicationId,
      juryId: mongoose.Types.ObjectId.isValid(juryId)
        ? new mongoose.Types.ObjectId(juryId) : juryId,
      juryName:       juryName || req.user?.name || 'Jury',
      startupName:    startupName || '',
      programme:      programme || '',
      scores,
      totalScore,
      globalRemark:   globalRemark || '',
      recommendation: recommendation || 'review',
      status:         'submitted',
      submittedAt:    new Date(),
      updatedAt:      new Date(),
    };

    if (existing) {
      await evalCol().updateOne({ _id: existing._id }, { $set: evalData });
      // Update jury evaluations array
      await juryCol().updateOne(
        { _id: mongoose.Types.ObjectId.isValid(juryId) ? new mongoose.Types.ObjectId(juryId) : juryId },
        { $set: { updatedAt: new Date() } }
      );
      return res.json({ success: true, message: 'Évaluation mise à jour', updated: true });
    }

    const result = await evalCol().insertOne({ ...evalData, createdAt: new Date() });

    // Update jury evaluations count
    await juryCol().updateOne(
      { _id: mongoose.Types.ObjectId.isValid(juryId) ? new mongoose.Types.ObjectId(juryId) : juryId },
      {
        $inc: { evaluationsCount: 1 },
        $push: {
          evaluations: {
            evaluationId: result.insertedId,
            candidature: startupName,
            startupName,
            programme,
            score: Math.round(totalScore / 20), // Convert to /5 scale
            date: new Date(),
          }
        },
        $set: { updatedAt: new Date() },
      }
    );

    res.status(201).json({
      success: true,
      message: 'Évaluation soumise',
      evaluation: { ...evalData, id: result.insertedId.toString(), _id: result.insertedId },
    });
  } catch (err) {
    console.error('[submitEvaluation]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
};

// ════════════════════════════════════════════════════
// PUT /api/evaluations/:id  — update evaluation
// ════════════════════════════════════════════════════
exports.updateEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'ID invalide' });

    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id;
    delete updates.id;

    if (updates.scores) {
      const WEIGHTS = { team: 30, innovation: 25, market: 20, business: 15, traction: 10 };
      updates.totalScore = Math.round(
        updates.scores.reduce((sum, s) => sum + (s.score || 0) * ((WEIGHTS[s.criteriaId] || 20) / 100), 0)
      );
    }

    const result = await evalCol().findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    );

    res.json({ success: true, evaluation: { ...result, id: result._id.toString() } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════
// GET /api/evaluations/stats  — global stats (admin)
// ════════════════════════════════════════════════════
exports.getEvaluationStats = async (req, res) => {
  try {
    const [total, submitted, pending] = await Promise.all([
      evalCol().countDocuments({}),
      evalCol().countDocuments({ status: 'submitted' }),
      evalCol().countDocuments({ status: 'pending' }),
    ]);

    const allSubmitted = await evalCol()
      .find({ status: 'submitted' })
      .project({ totalScore: 1 })
      .toArray();

    const avgScore = allSubmitted.length
      ? Math.round(allSubmitted.reduce((a, e) => a + (e.totalScore || 0), 0) / allSubmitted.length)
      : 0;

    res.json({ success: true, stats: { total, submitted, pending, avgScore } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};