// controllers/startupsProgrammesController.js
// Controller pour /dashboard/startup/programmes (liste + détail par ID)

const mongoose = require('mongoose');
const Programme = require('../models/Programme');
const Application = require('../models/Application');

/* ─────────────────────────────────────────────────────────────────────────────
   Helper : normalise un document Programme vers le format attendu par le front
   ──────────────────────────────────────────────────────────────────────────── */
const mapProgramme = (p, applicantsCount = 0) => ({
  _id:             p._id,
  slug:            p.slug || null,

  // ── Identité ──────────────────────────────────────────────────────────────
  titre:           p.titre || p.name || 'Programme',          // front attend "titre"
  name:            p.titre || p.name || 'Programme',          // alias rétro-compat
  description:     p.description || '',
  sector:          p.sector || 'Tous secteurs',
  subSectors:      p.subSectors || p.subdomains || [],

  // ── Statut & dates ────────────────────────────────────────────────────────
  status:          p.status === 'published' ? 'open' : (p.status || 'closed'),
  deadline:        p.deadline || p.closingDate || p.dateFin || null,
  dateDebut:       p.dateDebut || p.startDate || null,
  dateFin:         p.dateFin || p.deadline || p.closingDate || p.endDate || null,

  // ── Capacité ──────────────────────────────────────────────────────────────
  quota:           p.quota || p.maxStartups || p.capacity || 0,
  maxStartups:     p.quota || p.maxStartups || p.capacity || 0,
  applicantsCount,

  // ── Contenu riche ─────────────────────────────────────────────────────────
  objectives:      p.objectives || [],
  phases:          p.phases || [],
  benefits:        p.benefits || [],
  criteria:        p.criteria || p.eligibilityCriteria || [],
  jury:            p.jury || p.mentors || [],
  partners:        p.partners || [],
  gallery:         p.gallery || [],
  testimonials:    p.testimonials || [],
  stats:           p.stats || null,

  // ── Médias ────────────────────────────────────────────────────────────────
  image:           p.image || p.coverImage || null,
  logo:            p.logo || p.logoUrl || null,
  website:         p.website || null,

  // ── Financement ───────────────────────────────────────────────────────────
  fundingAmount:   p.fundingAmount || p.funding || null,
  duration:        p.duration || null,
  rating:          p.rating || 0,

  createdAt:       p.createdAt,
  updatedAt:       p.updatedAt,
});

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/startups-programmes
   Liste des programmes publiés avec comptage candidatures
   ──────────────────────────────────────────────────────────────────────────── */
const getProgrammes = async (req, res) => {
  try {
    const {
      status = 'published',
      sector,
      search,
      page  = 1,
      limit = 50,
    } = req.query;

    // ── Build query ──────────────────────────────────────────────────────────
    const query = {};

    if (status !== 'all') {
      // Accepte "open" comme alias de "published"
      query.status = status === 'open' ? 'published' : status;
    }

    if (sector && sector !== 'all' && sector !== 'Tous') {
      query.sector = sector;
    }

    if (search) {
      query.$or = [
        { titre:       { $regex: search, $options: 'i' } },
        { name:        { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // ── Fetch ────────────────────────────────────────────────────────────────
    const [programmes, total] = await Promise.all([
      Programme.find(query)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      Programme.countDocuments(query),
    ]);

    // ── Enrichir avec le compte d'applications ───────────────────────────────
    const programmeIds = programmes.map(p => p._id);

    const applicationCounts = await Application.aggregate([
      { $match: { programmeId: { $in: programmeIds } } },
      { $group: { _id: '$programmeId', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    applicationCounts.forEach(a => { countMap[a._id.toString()] = a.count; });

    const mapped = programmes.map(p =>
      mapProgramme(p, countMap[p._id.toString()] || 0)
    );

    return res.status(200).json({
      success: true,
      programmes: mapped,
      pagination: {
        total,
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('[getProgrammes] Error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/startups-programmes/:idOrSlug
   Détail d'un programme — accepte un ObjectId MongoDB OU un slug
   ──────────────────────────────────────────────────────────────────────────── */
const getProgrammeDetail = async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    // Détermine si c'est un ObjectId valide ou un slug textuel
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);

    const programme = isObjectId
      ? await Programme.findById(idOrSlug).lean()
      : await Programme.findOne({ slug: idOrSlug }).lean();

    if (!programme) {
      return res.status(404).json({ success: false, message: 'Programme introuvable' });
    }

    const applicantsCount = await Application.countDocuments({
      programmeId: programme._id,
    });

    // Incrémenter le compteur de vues (optionnel, sans bloquer la réponse)
    Programme.findByIdAndUpdate(programme._id, { $inc: { views: 1 } }).exec();

    return res.status(200).json({
      success: true,
      programme: mapProgramme(programme, applicantsCount),
    });
  } catch (error) {
    console.error('[getProgrammeDetail] Error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/startups-programmes/my-applications
   IDs des programmes auxquels le startup connecté a déjà candidaté
   ──────────────────────────────────────────────────────────────────────────── */
const getMyApplicationIds = async (req, res) => {
  try {
    const startupId = req.user?.startupId || req.user?._id;
    if (!startupId) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const applications = await Application.find(
      { $or: [{ startupId }, { userId: startupId }] },
      { programmeId: 1, status: 1, createdAt: 1, _id: 1 }
    ).lean();

    // Retourne aussi les détails pour enrichir l'UI
    const appliedIds = applications
      .map(a => a.programmeId?.toString())
      .filter(Boolean);

    // Map détaillé pour afficher les infos dans le hero (optionnel)
    const appliedDetails = applications.map(a => ({
      applicationId: a._id,
      programmeId:   a.programmeId?.toString(),
      status:        a.status,
      submittedAt:   a.createdAt,
    }));

    return res.status(200).json({ success: true, appliedIds, appliedDetails });
  } catch (error) {
    console.error('[getMyApplicationIds] Error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/startups-programmes/:id/related
   Programmes du même secteur (suggestions dans la sidebar)
   ──────────────────────────────────────────────────────────────────────────── */
const getRelatedProgrammes = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);

    const current = isObjectId
      ? await Programme.findById(idOrSlug, { sector: 1 }).lean()
      : await Programme.findOne({ slug: idOrSlug }, { sector: 1 }).lean();

    if (!current) {
      return res.status(404).json({ success: false, message: 'Programme introuvable' });
    }

    const related = await Programme.find({
      _id:    { $ne: current._id },
      sector: current.sector,
      status: 'published',
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    return res.status(200).json({
      success: true,
      programmes: related.map(p => mapProgramme(p)),
    });
  } catch (error) {
    console.error('[getRelatedProgrammes] Error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
  getProgrammes,
  getProgrammeDetail,
  getMyApplicationIds,
  getRelatedProgrammes,
};