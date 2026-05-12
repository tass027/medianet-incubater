const mongoose = require('mongoose');
const db = mongoose.connection;

const decCol  = () => db.collection('decisions');
const appCol  = () => db.collection('applications');
const userCol = () => db.collection('users');

// GET /api/admin/programmes/:id/decisions
exports.getByProgramme = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: 'programmeId invalide' });

    const progOid = new mongoose.Types.ObjectId(id);

    // Try dedicated decisions collection first
    let decisions = await decCol()
      .find({ programmeId: progOid })
      .sort({ updatedAt: -1 })
      .toArray();

    // Fallback: derive from applications if no dedicated decisions yet
    if (decisions.length === 0) {
      const apps = await appCol()
        .find({ programmeId: progOid })
        .project({
          startupName: 1, founder: 1, status: 1, decidedAt: 1,
          'startupProfile.startupName': 1, 'team.founderName': 1,
        })
        .toArray();

      decisions = apps.map(a => ({
        id:            a._id.toString(),
        applicationId: a._id.toString(),
        startup:       a.startupName || a.startupProfile?.startupName || 'N/A',
        founder:       a.founder     || a.team?.founderName || '—',
        decision:      a.status === 'accepted' ? 'accepted'
                     : a.status === 'rejected'  ? 'rejected'
                     : 'pending',
        notified:      false,
        adminNote:     '',
        date:          a.decidedAt || null,
      }));
    } else {
      decisions = decisions.map(d => ({
        ...d,
        id:       d._id?.toString() || d.id,
        date:     d.updatedAt || d.createdAt,
        decision: d.decision || 'pending',
      }));
    }

    const accepted  = decisions.filter(d => d.decision === 'accepted').length;
    const rejected  = decisions.filter(d => d.decision === 'rejected').length;
    const pending   = decisions.filter(d => d.decision === 'pending').length;
    const waitlist  = decisions.filter(d => d.decision === 'waitlist').length;
    const notified  = decisions.filter(d => d.notified).length;

    res.json({
      success: true,
      decisions,
      accepted, rejected, pending, waitlist, notified,
    });
  } catch (err) {
    console.error('[adminDecision.getByProgramme]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /api/admin/programmes/:id/decisions
exports.saveDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { applicationId, decision, adminNote } = req.body;

    if (!applicationId || !decision)
      return res.status(400).json({ success: false, message: 'applicationId et decision requis' });

    const progOid = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
    const appOid  = mongoose.Types.ObjectId.isValid(applicationId)
      ? new mongoose.Types.ObjectId(applicationId) : null;

    // Upsert into decisions collection
    await decCol().updateOne(
      { applicationId: appOid || applicationId, programmeId: progOid },
      {
        $set: {
          applicationId: appOid || applicationId,
          programmeId:   progOid,
          decision,
          adminNote:     adminNote || '',
          updatedAt:     new Date(),
          updatedBy:     req.user?.id || 'admin',
        },
        $setOnInsert: { createdAt: new Date(), notified: false },
      },
      { upsert: true }
    );

    // Mirror the status back to the application document
    if (appOid) {
      const statusMap = {
        accepted: 'accepted', rejected: 'rejected',
        waitlist: 'pending',  pending: 'pending',
      };
      await appCol().updateOne(
        { _id: appOid },
        { $set: { status: statusMap[decision] || 'pending', decidedAt: new Date() } }
      );
    }

    res.json({ success: true, message: 'Décision enregistrée' });
  } catch (err) {
    console.error('[adminDecision.saveDecision]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};