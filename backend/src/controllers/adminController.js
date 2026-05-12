const User = require('../models/User');

// GET /api/admin/applications
exports.getAllApplications = async (req, res) => {
  try {
    const { status, programme, search } = req.query;
    
    const users = await User.find({ 'applications.0': { $exists: true } })
      .select('name email role startupProfile applications');

    let applications = [];
    
    users.forEach(user => {
      user.applications.forEach(app => {
        applications.push({
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          startupName: user.startupProfile?.startupName || user.name,
          founder: user.name,
          email: user.email,
          sector: user.startupProfile?.sector || 'N/A',
          stage: user.startupProfile?.stage || 'idea',
          applicationId: app._id,
          programmeName: app.programmeName,
          programmeId: app.programmeId,
          status: app.status,
          appliedAt: app.appliedAt,
          decidedAt: app.decidedAt,
          aiScore: app.aiScore,
          juryScores: app.juryScores,
          timelineSteps: app.timelineSteps,
          formResponses: app.formResponses,
          totalScore: app.aiScore?.total || 0,
          detailedScores: app.aiScore?.scores || { problem: 0, market: 0, team: 0, solution: 0, traction: 0 },
          adminDecisionRemark: app.aiScore?.summary || ''
        });
      });
    });

    // Filtres
    if (status && status !== 'all') {
      applications = applications.filter(a => a.status === status);
    }
    if (search) {
      const term = search.toLowerCase();
      applications = applications.filter(a =>
        a.startupName.toLowerCase().includes(term) ||
        a.founder.toLowerCase().includes(term)
      );
    }

    applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

    res.json({ success: true, count: applications.length, applications });
    
  } catch (error) {
    console.error('[getAllApplications]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/admin/applications/:userId/:applicationId
exports.getApplicationDetail = async (req, res) => {
  try {
    const { userId, applicationId } = req.params;
    
    const user = await User.findById(userId).select('name email startupProfile applications');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    
    const application = user.applications.id(applicationId);
    if (!application) return res.status(404).json({ message: 'Candidature non trouvée' });
    
    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, startupProfile: user.startupProfile },
      application
    });
    
  } catch (error) {
    console.error('[getApplicationDetail]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /api/admin/applications/:userId/:applicationId/status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { userId, applicationId } = req.params;
    const { status, decisionRemark } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    
    const application = user.applications.id(applicationId);
    if (!application) return res.status(404).json({ message: 'Candidature non trouvée' });
    
    application.status = status;
    
    if (status === 'accepted' || status === 'rejected') {
      application.decidedAt = new Date();
    }

    // Mettre à jour la timeline
    const timelineStep = application.timelineSteps?.find(s => {
      if (status === 'accepted') return s.step === 'decision';
      if (status === 'rejected') return s.step === 'decision';
      if (status === 'interview') return s.step === 'interview';
      if (status === 'reviewing') return s.step === 'reviewing';
      return false;
    });

    if (timelineStep) {
      timelineStep.status = 'done';
      timelineStep.date = new Date();
      if (decisionRemark) timelineStep.note = decisionRemark;
    }

    if (decisionRemark && application.aiScore) {
      application.aiScore.summary = decisionRemark;
    }

    await user.save();

    const userData = user.toJSON();
    
    res.json({
      success: true,
      message: 'Statut mis à jour',
      isFounder: userData.isFounder,
      application: { id: application._id, status: application.status, timelineSteps: application.timelineSteps }
    });
    
  } catch (error) {
    console.error('[updateApplicationStatus]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /api/admin/applications/:userId/:applicationId/evaluation
exports.updateApplicationEvaluation = async (req, res) => {
  try {
    const { userId, applicationId } = req.params;
    const { scores, summary, strengths, weaknesses } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    
    const application = user.applications.id(applicationId);
    if (!application) return res.status(404).json({ message: 'Candidature non trouvée' });
    
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    
    application.aiScore = {
      scores,
      total,
      summary: summary || '',
      strengths: strengths || [],
      weaknesses: weaknesses || [],
      generatedAt: new Date(),
      model: 'admin_manual'
    };

    await user.save();

    res.json({ success: true, message: 'Évaluation mise à jour', aiScore: application.aiScore });
    
  } catch (error) {
    console.error('[updateApplicationEvaluation]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/admin/startups
exports.getAllStartups = async (req, res) => {
  try {
    const users = await User.find({ role: 'startup' })
      .select('name email startupProfile applications isActive isApproved');
    res.json({ success: true, startups: users });
  } catch (error) {
    console.error('[getAllStartups]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/admin/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalStartups = await User.countDocuments({ role: 'startup' });
    const totalApplications = await User.aggregate([
      { $unwind: '$applications' },
      { $count: 'total' }
    ]);
    
    const applicationsByStatus = await User.aggregate([
      { $unwind: '$applications' },
      { $group: { _id: '$applications.status', count: { $sum: 1 } } }
    ]);

    const stats = {
      totalStartups,
      totalApplications: totalApplications[0]?.total || 0,
      applicationsByStatus: applicationsByStatus.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('[getDashboardStats]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};