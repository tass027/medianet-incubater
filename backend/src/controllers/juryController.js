// controllers/juryController.js
// CRUD jury + assignation programmes + historique évaluations

const mongoose = require('mongoose');
const db       = mongoose.connection;

// ── helpers ──────────────────────────────────────────────────────
const juryCol      = () => db.collection('jury');
const appCol       = () => db.collection('applications');
const progCol      = () => db.collection('programmes');

// ════════════════════════════════════════════════════════════════
// GET /api/jury  — liste tous les jurys
// ════════════════════════════════════════════════════════════════
exports.getAllJury = async (req, res) => {
  try {
    const { search, status, domain, programme } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name:    { $regex: search, $options: 'i' } },
        { email:   { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }
    if (status && status !== 'all') filter.status = status;
    if (domain && domain !== 'all') filter.expertise = { $in: [domain] };
    if (programme && programme !== 'all') {
      filter.assignedProgrammes = { $in: [programme] };
    }

    const jury = await juryCol()
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // Enrichir avec stats d'évaluations
    const enriched = jury.map(j => ({
      ...j,
      id: j._id.toString(),
    }));

    res.json({ success: true, jury: enriched, total: enriched.length });
  } catch (err) {
    console.error('[getAllJury]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════════
// GET /api/jury/:id  — un seul jury
// ════════════════════════════════════════════════════════════════
exports.getJuryById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'ID invalide' });

    const jury = await juryCol().findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (!jury) return res.status(404).json({ success: false, message: 'Jury non trouvé' });

    res.json({ success: true, jury: { ...jury, id: jury._id.toString() } });
  } catch (err) {
    console.error('[getJuryById]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════════════════
// POST /api/jury  — créer un jury
// ════════════════════════════════════════════════════════════════
exports.createJury = async (req, res) => {
  try {
    const {
      name, email, post, company, linkedin,
      expertise = [], status = 'invited',
      assignedProgrammes = [],
      bio = '',
    } = req.body;

    if (!name || !email)
      return res.status(400).json({ success: false, message: 'Nom et email requis' });

    // Vérifier doublon email
    const existing = await juryCol().findOne({ email: email.toLowerCase().trim() });
    if (existing)
      return res.status(409).json({ success: false, message: 'Un jury avec cet email existe déjà' });

    const newJury = {
      name:               name.trim(),
      email:              email.toLowerCase().trim(),
      post:               post || '',
      company:            company || '',
      linkedin:           linkedin || '',
      bio:                bio,
      expertise,
      status,             // 'active' | 'invited' | 'inactive'
      assignedProgrammes,
      evaluationsCount:   0,
      evaluations:        [],
      isActive:           true,
      isApproved:         status === 'active',
      isEmailVerified:    false,
      role:               'jury',
      createdAt:          new Date(),
      updatedAt:          new Date(),
    };

    const result = await juryCol().insertOne(newJury);
    res.status(201).json({
      success: true,
      message: 'Jury créé avec succès',
      jury:    { ...newJury, id: result.insertedId.toString(), _id: result.insertedId },
    });
  } catch (err) {
    console.error('[createJury]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════════
// PUT /api/jury/:id  — mettre à jour un jury
// ════════════════════════════════════════════════════════════════
exports.updateJury = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'ID invalide' });

    const {
      name, email, post, company, linkedin,
      expertise, status, assignedProgrammes, bio,
    } = req.body;

    const updateFields = { updatedAt: new Date() };
    if (name  !== undefined) updateFields.name  = name.trim();
    if (email !== undefined) updateFields.email = email.toLowerCase().trim();
    if (post  !== undefined) updateFields.post  = post;
    if (company    !== undefined) updateFields.company    = company;
    if (linkedin   !== undefined) updateFields.linkedin   = linkedin;
    if (bio        !== undefined) updateFields.bio        = bio;
    if (expertise  !== undefined) updateFields.expertise  = expertise;
    if (status     !== undefined) {
      updateFields.status     = status;
      updateFields.isApproved = status === 'active';
      updateFields.isActive   = status !== 'inactive';
    }
    if (assignedProgrammes !== undefined) updateFields.assignedProgrammes = assignedProgrammes;

    const result = await juryCol().findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result)
      return res.status(404).json({ success: false, message: 'Jury non trouvé' });

    res.json({ success: true, message: 'Jury mis à jour', jury: { ...result, id: result._id.toString() } });
  } catch (err) {
    console.error('[updateJury]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
};

// ════════════════════════════════════════════════════════════════
// DELETE /api/jury/:id
// ════════════════════════════════════════════════════════════════
exports.deleteJury = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'ID invalide' });

    const result = await juryCol().deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    if (result.deletedCount === 0)
      return res.status(404).json({ success: false, message: 'Jury non trouvé' });

    res.json({ success: true, message: 'Jury supprimé avec succès' });
  } catch (err) {
    console.error('[deleteJury]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════════════════
// PATCH /api/jury/:id/programmes  — assigner/désassigner programmes
// ════════════════════════════════════════════════════════════════
exports.assignProgrammes = async (req, res) => {
  try {
    const { id } = req.params;
    const { programmeIds = [], programmeNames = [] } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'ID invalide' });

    // On stocke les noms (lisibles) et les IDs
    const result = await juryCol().findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          assignedProgrammes: programmeNames,
          assignedProgrammeIds: programmeIds,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!result)
      return res.status(404).json({ success: false, message: 'Jury non trouvé' });

    res.json({
      success: true,
      message: `${programmeNames.length} programme(s) assigné(s)`,
      jury:    { ...result, id: result._id.toString() },
    });
  } catch (err) {
    console.error('[assignProgrammes]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════════════════
// POST /api/jury/:id/invite  — envoyer invitation email (mock)
// ════════════════════════════════════════════════════════════════
exports.sendInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, message } = req.body;

    // Marquer comme invité dans la DB si on connaît l'ID
    if (id && id !== 'new' && mongoose.Types.ObjectId.isValid(id)) {
      await juryCol().updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { status: 'invited', invitedAt: new Date(), updatedAt: new Date() } }
      );
    }

    // TODO: intégrer avec votre mailer.js existant
    // await sendMail({ to: email, subject: '...', text: message });

    res.json({
      success: true,
      message: `Invitation envoyée à ${email}`,
      sentAt: new Date(),
    });
  } catch (err) {
    console.error('[sendInvitation]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════════════════
// GET /api/jury/:id/evaluations  — historique évaluations d'un jury
// ════════════════════════════════════════════════════════════════
exports.getJuryEvaluations = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'ID invalide' });

    const jury = await juryCol().findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (!jury) return res.status(404).json({ success: false, message: 'Jury non trouvé' });

    res.json({
      success:     true,
      evaluations: jury.evaluations || [],
      count:       (jury.evaluations || []).length,
      avgScore:    jury.evaluations?.length
        ? (jury.evaluations.reduce((a, e) => a + (e.score || 0), 0) / jury.evaluations.length).toFixed(1)
        : null,
    });
  } catch (err) {
    console.error('[getJuryEvaluations]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════════════════
// GET /api/jury/stats  — statistiques globales
// ════════════════════════════════════════════════════════════════
exports.getJuryStats = async (req, res) => {
  try {
    const [total, active, invited, inactive] = await Promise.all([
      juryCol().countDocuments({}),
      juryCol().countDocuments({ status: 'active' }),
      juryCol().countDocuments({ status: 'invited' }),
      juryCol().countDocuments({ status: 'inactive' }),
    ]);

    const assigned = await juryCol().countDocuments({
      assignedProgrammes: { $exists: true, $not: { $size: 0 } },
    });

    // Score moyen toutes évaluations confondues
    const juryWithEvals = await juryCol()
      .find({ 'evaluations.0': { $exists: true } })
      .toArray();

    const allScores = juryWithEvals.flatMap(j => j.evaluations.map(e => e.score || 0));
    const avgScore  = allScores.length
      ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1)
      : null;

    const totalEvals = allScores.length;

    res.json({ success: true, stats: { total, active, invited, inactive, assigned, totalEvals, avgScore } });
  } catch (err) {
    console.error('[getJuryStats]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};