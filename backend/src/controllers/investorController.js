// src/controllers/investorController.js
const Investor = require('../models/Investor');

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/investors
// Liste tous les investisseurs avec filtres optionnels
// ══════════════════════════════════════════════════════════════════════════════
exports.getAll = async (req, res) => {
  try {
    const { type, secteur, stade, recherche } = req.query;
    const filter = {};

    if (type)     filter.type = type;
    if (secteur)  filter.secteurs = { $in: [secteur] };
    if (stade)    filter.stades   = { $in: [stade] };
    if (recherche) {
      const re = new RegExp(recherche, 'i');
      filter.$or = [{ nom: re }, { entreprise: re }, { localisation: re }];
    }

    const investors = await Investor.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: investors });
  } catch (err) {
    console.error('[investorController.getAll]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/investors/stats
// Statistiques globales des investisseurs
// ══════════════════════════════════════════════════════════════════════════════
exports.getStats = async (req, res) => {
  try {
    const investors = await Investor.find();

    const totalInvesti     = investors.reduce((s, i) => s + (i.totalInvesti || 0), 0);
    const ticketMoyen      = investors.length
      ? Math.round(investors.reduce((s, i) => s + ((i.ticketMin + i.ticketMax) / 2 || 0), 0) / investors.length)
      : 0;

    const allMatches       = investors.flatMap(i => i.matches || []);
    const matchesEnAttente = allMatches.filter(m => m.statut === 'en_attente').length;
    const matchesValidés   = allMatches.filter(m => m.statut === 'validé').length;

    res.json({
      success: true,
      data: {
        total: investors.length,
        totalInvesti,
        ticketMoyen,
        matchesEnAttente,
        matchesValidés,
      },
    });
  } catch (err) {
    console.error('[investorController.getStats]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/investors/:id
// ══════════════════════════════════════════════════════════════════════════════
exports.getOne = async (req, res) => {
  try {
    const investor = await Investor.findById(req.params.id);
    if (!investor) return res.status(404).json({ success: false, message: 'Investisseur introuvable' });
    res.json({ success: true, data: investor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/investors
// Créer un nouvel investisseur
// ══════════════════════════════════════════════════════════════════════════════
exports.create = async (req, res) => {
  try {
    const investor = new Investor(req.body);
    await investor.save();
    res.status(201).json({ success: true, data: investor });
  } catch (err) {
    console.error('[investorController.create]', err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/investors/:id
// ══════════════════════════════════════════════════════════════════════════════
exports.update = async (req, res) => {
  try {
    const investor = await Investor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!investor) return res.status(404).json({ success: false, message: 'Investisseur introuvable' });
    res.json({ success: true, data: investor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/investors/:id
// ══════════════════════════════════════════════════════════════════════════════
exports.remove = async (req, res) => {
  try {
    const investor = await Investor.findByIdAndDelete(req.params.id);
    if (!investor) return res.status(404).json({ success: false, message: 'Investisseur introuvable' });
    res.json({ success: true, message: 'Investisseur supprimé.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/investors/:investorId/matches/:matchId/valider
// Valider un match
// ══════════════════════════════════════════════════════════════════════════════
exports.validerMatch = async (req, res) => {
  try {
    const { investorId, matchId } = req.params;

    const investor = await Investor.findById(investorId);
    if (!investor) return res.status(404).json({ success: false, message: 'Investisseur introuvable' });

    const match = investor.matches.id(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });

    match.statut = 'validé';
    await investor.save();

    res.json({ success: true, data: investor, message: 'Match validé avec succès.' });
  } catch (err) {
    console.error('[investorController.validerMatch]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/investors/:investorId/matches/:matchId/rejeter
// Rejeter un match
// ══════════════════════════════════════════════════════════════════════════════
exports.rejeterMatch = async (req, res) => {
  try {
    const { investorId, matchId } = req.params;

    const investor = await Investor.findById(investorId);
    if (!investor) return res.status(404).json({ success: false, message: 'Investisseur introuvable' });

    const match = investor.matches.id(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match introuvable' });

    match.statut = 'rejeté';
    await investor.save();

    res.json({ success: true, data: investor, message: 'Match rejeté.' });
  } catch (err) {
    console.error('[investorController.rejeterMatch]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};