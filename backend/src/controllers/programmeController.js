// src/controllers/programmeController.js
// ✅ Fichier unifié — méthodes publiques + méthodes admin
// ✅ FIX : candidatures comptées depuis la collection 'applications' (pas User)
// ✅ AJOUT : getProgrammeForm — retourne le formulaire lié au programme

const Programme   = require('../models/Programme');
const User        = require('../models/User');
const Application = require('../models/Application');
const Form        = require('../models/Form');           // ← AJOUTÉ
const mongoose    = require('mongoose');

/* ── helper : accepte _id MongoDB OU slug ────────────────────── */
const buildQuery = (id) =>
  mongoose.isValidObjectId(id) ? { _id: id } : { slug: id };

/* ── helper : compte les candidatures réelles d'un programme ─── */
const countCandidatures = async (prog) => {
  const titre = prog.titre || prog.title || '';
  return Application.countDocuments({
    $or: [
      { programmeId:   prog._id },
      { programmeName: titre    },
    ],
  });
};

/* ══════════════════════════════════════════════════════════════
   MÉTHODES PUBLIQUES
══════════════════════════════════════════════════════════════ */

exports.getPublicProgrammes = async (req, res) => {
  try {
    const programmes = await Programme.find({ status: 'published' })
      .select('-__v -formulaireId -juryIds')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, programmes });
  } catch (err) {
    console.error('[getPublicProgrammes]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getPublicProgrammeById = async (req, res) => {
  try {
    const query = { ...buildQuery(req.params.id), status: 'published' };
    const programme = await Programme.findOne(query)
      .select('-__v -formulaireId -juryIds')
      .lean();

    if (!programme)
      return res.status(404).json({ success: false, message: 'Programme introuvable' });

    return res.json({ success: true, programme });
  } catch (err) {
    console.error('[getPublicProgrammeById]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * GET /api/programmes/:id/form
 * Retourne le formulaire spécifique au programme.
 * Cherche par formulaireId d'abord, puis fallback sur formulaire de base.
 * Accessible aux startups authentifiées.
 */
exports.getProgrammeForm = async (req, res) => {
  try {
    const programme = await Programme.findOne(buildQuery(req.params.id)).lean();

    if (!programme)
      return res.status(404).json({ success: false, message: 'Programme introuvable' });

    // Le programme doit être published OU l'utilisateur est admin
    const isAdmin = req.user?.role === 'admin';
    if (programme.status !== 'published' && !isAdmin)
      return res.status(403).json({ success: false, message: 'Programme non disponible' });

    let form = null;

    // 1. Essayer le formulaireId stocké dans le programme
    if (programme.formulaireId) {
      form = await Form.findById(programme.formulaireId).lean();
    }

    // 2. Fallback : chercher un formulaire dont le titre contient le secteur du programme
    if (!form && programme.sector) {
      form = await Form.findOne({
        status: { $in: ['published', 'draft'] },
        title:  { $regex: programme.sector, $options: 'i' },
      }).lean();
    }

    // 3. Fallback final : premier formulaire de type 'basic' publié
    if (!form) {
      form = await Form.findOne({
        type:   'basic',
        status: 'published',
      }).sort({ createdAt: 1 }).lean();
    }

    // 4. Aucun formulaire en base → schéma par défaut codé en dur
    if (!form) {
      form = getDefaultFormSchema(programme);
    }

    return res.json({
      success:   true,
      programme: {
        _id:    programme._id,
        titre:  programme.titre,
        sector: programme.sector,
        status: programme.status,
      },
      form,
      isDefault: !form._id,
    });
  } catch (err) {
    console.error('[getProgrammeForm]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/* ══════════════════════════════════════════════════════════════
   MÉTHODES ADMIN
══════════════════════════════════════════════════════════════ */

exports.getAllProgrammes = async (req, res) => {
  try {
    const { sector, status, search } = req.query;

    let query = {};
    if (sector && sector !== 'all') query.sector = sector;
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { titre:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const programmes = await Programme.find(query).sort({ createdAt: -1 }).lean();

    const programmesWithCount = await Promise.all(
      programmes.map(async (prog) => {
        const count = await countCandidatures(prog);
        return { ...prog, candidatures: count };
      })
    );

    res.json({ success: true, programmes: programmesWithCount });
  } catch (error) {
    console.error('[getAllProgrammes]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.createProgramme = async (req, res) => {
  try {
    const programme = await Programme.create(req.body);
    res.status(201).json({ success: true, programme });
  } catch (error) {
    console.error('[createProgramme]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getProgramme = async (req, res) => {
  try {
    const programme = await Programme.findById(req.params.id).lean();
    if (!programme) return res.status(404).json({ message: 'Programme non trouvé' });

    const titre = programme.titre || programme.title || '';

    const applications = await Application.find({
      $or: [
        { programmeId:   programme._id },
        { programmeName: titre         },
      ],
    })
    .select('startupName founder email sector stage status totalScore submittedAt aiScore project team')
    .lean();

    const candidaturesDetail = applications.map(app => ({
      id:          app._id.toString(),
      startup:     app.startupName          || app.project?.startupName || '—',
      founder:     app.founder              || app.team?.founderName    || '—',
      email:       app.email                || app.team?.founderEmail   || '',
      sector:      app.sector               || programme.sector,
      stage:       app.stage                || app.project?.stage       || '—',
      status:      app.status               || 'pending',
      score:       app.totalScore           || app.aiScore?.total       || null,
      submittedAt: app.submittedAt          || app.createdAt,
    }));

    res.json({
      success:    true,
      programme:  { ...programme, candidatures: candidaturesDetail.length },
      candidatures: candidaturesDetail.length,
      candidaturesDetail,
      applications: candidaturesDetail,
    });
  } catch (error) {
    console.error('[getProgramme]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.updateProgramme = async (req, res) => {
  try {
    const programme = await Programme.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!programme) return res.status(404).json({ message: 'Programme non trouvé' });
    res.json({ success: true, programme });
  } catch (error) {
    console.error('[updateProgramme]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.deleteProgramme = async (req, res) => {
  try {
    const programme = await Programme.findById(req.params.id);
    if (!programme) return res.status(404).json({ message: 'Programme non trouvé' });

    if (programme.status === 'published') {
      return res.status(400).json({ message: 'Impossible de supprimer un programme publié' });
    }

    await programme.deleteOne();
    res.json({ success: true, message: 'Programme supprimé' });
  } catch (error) {
    console.error('[deleteProgramme]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const programme = await Programme.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!programme) return res.status(404).json({ message: 'Programme non trouvé' });
    res.json({ success: true, programme });
  } catch (error) {
    console.error('[updateStatus]', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/* ══════════════════════════════════════════════════════════════
   HELPER — formulaire par défaut si rien en base
   Reproduit la structure { steps, fields } attendue par le frontend
══════════════════════════════════════════════════════════════ */
function getDefaultFormSchema(programme) {
  return {
    _id:   null,
    title: `Formulaire de candidature — ${programme?.titre || 'Programme'}`,
    type:  'basic',
    steps: [
      { n:1, title:'Projet',    desc:'Informations générales', icon:'Rocket' },
      { n:2, title:'Équipe',    desc:'Talents et compétences', icon:'User'   },
      { n:3, title:'Business',  desc:'Modèle et stratégie',    icon:'Brief'  },
      { n:4, title:'Traction',  desc:'Preuves et métriques',   icon:'Chart'  },
      { n:5, title:'Documents', desc:'Pièces jointes',         icon:'File'   },
    ],
    fields: [
      // ── Étape 1 ──────────────────────────────────────────────────────────
      { key:'startupName',   label:'Nom de la startup',       type:'text',     required:true,  step:1, order:1, group:'col-2' },
      { key:'sector',        label:"Secteur d'activité",      type:'select',   required:true,  step:1, order:2, group:'col-2',
        options:[
          {value:'FinTech',label:'FinTech'},{value:'HealthTech',label:'HealthTech'},
          {value:'EdTech',label:'EdTech'},{value:'AgriTech',label:'AgriTech'},
          {value:'CleanTech',label:'CleanTech'},{value:'SaaS',label:'SaaS'},
          {value:'E-commerce',label:'E-commerce'},{value:'Mobility',label:'Mobility'},
          {value:'Other',label:'Autre'},
        ],
      },
      { key:'stage', label:'Stade du projet', type:'select', required:true, step:1, order:3, group:'col-2',
        options:[
          {value:'idea',label:'Idée — Concept en cours de développement'},
          {value:'mvp',label:'MVP — Produit minimum viable'},
          {value:'traction',label:'Early Traction — Premiers clients'},
          {value:'growth',label:'Growth — Croissance confirmée'},
          {value:'scale',label:"Scale — Mise à l'échelle"},
        ],
      },
      { key:'website',     label:'Site web',     type:'url',      required:false, step:1, order:4, group:'col-2', placeholder:'https://exemple.com' },
      { key:'description', label:'Description',  type:'textarea', required:true,  step:1, order:5, minLength:100,
        placeholder:"Décrivez votre projet : le problème résolu, votre solution, la valeur ajoutée..." },

      // ── Étape 2 ──────────────────────────────────────────────────────────
      { key:'founderName',  label:'Nom du fondateur',  type:'text',   required:true, step:2, order:1, group:'col-2' },
      { key:'founderEmail', label:'Email',             type:'email',  required:true, step:2, order:2, group:'col-2' },
      { key:'founderPhone', label:'Téléphone',         type:'tel',    required:true, step:2, order:3, group:'col-2', placeholder:'+216 XX XXX XXX' },
      { key:'teamSize', label:"Taille de l'équipe", type:'select', required:true, step:2, order:4, group:'col-2',
        options:[
          {value:'1-2',label:'1-2 personnes'},{value:'3-5',label:'3-5 personnes'},
          {value:'6-10',label:'6-10 personnes'},{value:'11-20',label:'11-20 personnes'},
          {value:'20+',label:'Plus de 20 personnes'},
        ],
      },

      // ── Étape 3 ──────────────────────────────────────────────────────────
      { key:'businessModel', label:'Modèle économique',           type:'textarea', required:true, step:3, order:1, placeholder:'Décrivez comment vous générez des revenus' },
      { key:'usp',           label:'Proposition de valeur unique',type:'textarea', required:true, step:3, order:2, placeholder:"Qu'est-ce qui vous différencie de vos concurrents ?" },
      { key:'targetMarket',  label:'Marché cible',                type:'textarea', required:true, step:3, order:3, placeholder:'Qui sont vos clients ? Quelle est la taille du marché ?' },
      { key:'fundingNeeded', label:'Montant recherché', type:'select', required:true, step:3, order:4, group:'col-2',
        options:[
          {value:'<50k',label:'Moins de 50 000 TND'},{value:'50k-200k',label:'50 000 - 200 000 TND'},
          {value:'200k-500k',label:'200 000 - 500 000 TND'},{value:'500k-1M',label:'500 000 - 1 000 000 TND'},
          {value:'>1M',label:'Plus de 1 000 000 TND'},
        ],
      },
      { key:'competitors', label:'Principaux concurrents', type:'textarea', required:false, step:3, order:5, group:'col-2',
        placeholder:'Listez vos principaux concurrents' },

      // ── Étape 4 ──────────────────────────────────────────────────────────
      { key:'revenue',      label:'Revenus mensuels (TND)', type:'text',     required:false, step:4, order:1, group:'col-2', placeholder:'Ex: 50 000' },
      { key:'customers',    label:'Nombre de clients',      type:'text',     required:false, step:4, order:2, group:'col-2', placeholder:'Ex: 1 200' },
      { key:'achievements', label:'Réalisations clés',      type:'textarea', required:false, step:4, order:3,
        placeholder:'Prix, partenariats, articles de presse, jalons importants...' },

      // ── Étape 5 ──────────────────────────────────────────────────────────
      { key:'businessPlan', label:'Business Plan',                  type:'file', required:true,  step:5, order:1,
        accept:['application/pdf'] },
      { key:'pitchDeck',    label:'Pitch Deck',                     type:'file', required:true,  step:5, order:2,
        accept:['application/pdf','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'] },
      { key:'financials',   label:'Projections financières (opt.)', type:'file', required:false, step:5, order:3,
        accept:['application/pdf','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] },
      { key:'videoUrl',     label:'Vidéo de pitch (URL)',           type:'url',  required:false, step:5, order:4, placeholder:'https://youtube.com/watch?v=...' },
    ],
  };
}