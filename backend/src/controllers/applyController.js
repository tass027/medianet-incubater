// controllers/applyController.js
// Sert le formulaire d'une candidature pour la page /dashboard/startup/apply
// GET /api/apply/form?programmeId=xxx   → schéma adapté au front
// POST /api/apply/submit                → soumet la candidature

const mongoose = require('mongoose');
const Programme = require('../models/Programme');
const Form      = require('../models/Form');
const Application = require('../models/Application');

/* ─────────────────────────────────────────────────────────────────────────────
   Helper : convertit un type Form (BD) → type HTML attendu par DynamicField
   ──────────────────────────────────────────────────────────────────────────── */
const mapType = (q) => {
  switch (q.type) {
    case 'long':      return 'textarea';
    case 'short':     return 'text';
    case 'radio':     return 'select';       // rendu comme select (single choice)
    case 'dropdown':  return 'select';
    case 'checkbox':  return 'select';       // multi — peut être étendu
    case 'scale':     return 'select';       // échelle → select numérique
    case 'date':      return 'date';
    case 'time':      return 'time';
    case 'file':      return 'file';
    case 'grid':      return 'textarea';     // fallback
    default:          return 'text';
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   Helper : génère les options pour select/radio/scale
   ──────────────────────────────────────────────────────────────────────────── */
const buildOptions = (q) => {
  if (q.type === 'scale') {
    const opts = [];
    for (let i = q.scaleMin; i <= q.scaleMax; i++) {
      opts.push({
        value: String(i),
        label: i === q.scaleMin && q.scaleMinLabel
          ? `${i} — ${q.scaleMinLabel}`
          : i === q.scaleMax && q.scaleMaxLabel
            ? `${i} — ${q.scaleMaxLabel}`
            : String(i),
      });
    }
    return opts;
  }
  if (Array.isArray(q.options) && q.options.length > 0) {
    return q.options.map(o => ({ value: o, label: o }));
  }
  return [];
};

/* ─────────────────────────────────────────────────────────────────────────────
   Helper : répartit les questions en étapes (5 max par défaut)
   La BD ne stocke pas de "step" par question → on distribue automatiquement
   en groupes logiques selon le type et l'ordre.

   Logique :
     step 1 — Projet     : 6 premières questions texte/select
     step 2 — Équipe     : questions suivantes jusqu'à "team" keyword ou 6 de plus
     step 3 — Business   : questions suivantes
     step 4 — Traction   : questions suivantes
     step 5 — Documents  : toutes les questions de type file
   ──────────────────────────────────────────────────────────────────────────── */
const STEP_DEFS = [
  { n: 1, title: 'Projet',    desc: 'Informations générales sur votre projet', icon: 'Rocket' },
  { n: 2, title: 'Équipe',    desc: 'Présentation de l\'équipe fondatrice',    icon: 'User'   },
  { n: 3, title: 'Business',  desc: 'Modèle économique et stratégie',          icon: 'Brief'  },
  { n: 4, title: 'Traction',  desc: 'Métriques et preuves de traction',        icon: 'Chart'  },
  { n: 5, title: 'Documents', desc: 'Pièces jointes requises',                 icon: 'File'   },
];

const distributeToSteps = (questions) => {
  // Séparer les fichiers — ils vont toujours en step 5
  const fileQs  = questions.filter(q => q.type === 'file');
  const otherQs = questions.filter(q => q.type !== 'file');

  // Diviser les autres en 4 groupes égaux
  const groupSize = Math.ceil(otherQs.length / 4) || 1;
  const fieldsByStep = {};

  otherQs.forEach((q, idx) => {
    const stepN = Math.min(Math.floor(idx / groupSize) + 1, 4);
    if (!fieldsByStep[stepN]) fieldsByStep[stepN] = [];

    const mappedType = mapType(q);
    const field = {
      key:         q.id || `field_${idx}`,
      label:       q.title || `Champ ${idx + 1}`,
      type:        mappedType,
      required:    q.required || false,
      placeholder: q.description || '',
      helpText:    q.description || '',
      step:        stepN,
      order:       idx,
      // group col-2 pour les champs courts (sauf textarea/file)
      group:       mappedType === 'text' || mappedType === 'date' || mappedType === 'time'
                     ? 'col-2'
                     : 'single',
    };

    // Ajouter minLength pour les textarea longs
    if (mappedType === 'textarea') {
      field.minLength = 50;
    }

    // Ajouter les options pour select
    if (mappedType === 'select') {
      field.options = buildOptions(q);
    }

    // Accepter les fichiers
    if (mappedType === 'file') {
      field.accept = ['application/pdf', 'application/vnd.ms-powerpoint',
                      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                      'application/vnd.ms-excel',
                      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    }

    fieldsByStep[stepN].push(field);
  });

  // Step 5 — fichiers
  if (fileQs.length > 0) {
    fieldsByStep[5] = fileQs.map((q, idx) => ({
      key:      q.id || `file_${idx}`,
      label:    q.title || `Document ${idx + 1}`,
      type:     'file',
      required: q.required || false,
      helpText: q.description || '',
      step:     5,
      order:    idx,
      group:    'single',
      accept:   ['application/pdf',
                 'application/vnd.ms-powerpoint',
                 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                 'application/vnd.ms-excel',
                 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    }));
  }

  // Garder uniquement les steps qui ont des champs + toujours step 5 si fichiers
  const usedStepNs = Object.keys(fieldsByStep).map(Number).sort((a, b) => a - b);
  const steps = STEP_DEFS.filter(s => usedStepNs.includes(s.n));

  // Renuméroter les steps pour qu'ils soient continus (1,2,3…)
  const reIndexed   = {};
  const finalSteps  = [];
  usedStepNs.forEach((originalN, i) => {
    const newN = i + 1;
    const stepDef = STEP_DEFS.find(s => s.n === originalN) || STEP_DEFS[0];
    finalSteps.push({ ...stepDef, n: newN });
    reIndexed[newN] = (fieldsByStep[originalN] || []).map(f => ({ ...f, step: newN }));
  });

  // Aplatir tous les champs
  const allFields = Object.values(reIndexed).flat();

  return { steps: finalSteps, fields: allFields };
};

/* ─────────────────────────────────────────────────────────────────────────────
   Formulaire de base (candidature spontanée) — fallback si pas de formulaire lié
   ──────────────────────────────────────────────────────────────────────────── */
const FALLBACK_FORM = {
  title:  'Candidature Spontanée',
  steps:  [
    { n: 1, title: 'Projet',   desc: 'Informations générales', icon: 'Rocket' },
    { n: 2, title: 'Équipe',   desc: 'Équipe fondatrice',      icon: 'User'   },
    { n: 3, title: 'Business', desc: 'Modèle économique',      icon: 'Brief'  },
  ],
  fields: [
    { key: 'projectName',  label: 'Nom du projet',           type: 'text',     required: true,  step: 1, order: 0, group: 'col-2' },
    { key: 'sector',       label: 'Secteur d\'activité',     type: 'text',     required: true,  step: 1, order: 1, group: 'col-2' },
    { key: 'description',  label: 'Description du projet',   type: 'textarea', required: true,  step: 1, order: 2, group: 'single', minLength: 100 },
    { key: 'founderName',  label: 'Nom du fondateur',        type: 'text',     required: true,  step: 2, order: 0, group: 'col-2' },
    { key: 'founderEmail', label: 'Email',                   type: 'email',    required: true,  step: 2, order: 1, group: 'col-2' },
    { key: 'teamSize',     label: 'Taille de l\'équipe',     type: 'text',     required: false, step: 2, order: 2, group: 'col-2' },
    { key: 'revenue',      label: 'Chiffre d\'affaires',     type: 'text',     required: false, step: 3, order: 0, group: 'col-2' },
    { key: 'businessModel',label: 'Modèle économique',       type: 'textarea', required: true,  step: 3, order: 1, group: 'single', minLength: 50 },
  ],
};

/* ═════════════════════════════════════════════════════════════════════════════
   GET /api/apply/form?programmeId=:id
   Retourne le schéma de formulaire adapté au front (DynamicField)
   ═════════════════════════════════════════════════════════════════════════════ */
const getApplyForm = async (req, res) => {
  try {
    const { programmeId } = req.query;

    // ── Candidature spontanée ────────────────────────────────────────────────
    if (!programmeId || programmeId === 'spontane') {
      return res.status(200).json({ success: true, form: FALLBACK_FORM });
    }

    // ── Valider ObjectId ─────────────────────────────────────────────────────
    if (!mongoose.Types.ObjectId.isValid(programmeId)) {
      return res.status(400).json({ success: false, message: 'programmeId invalide' });
    }

    // ── Chercher le programme avec son formulaire lié ────────────────────────
    const programme = await Programme.findById(programmeId)
      .populate('formulaireId')   // ← le champ ref:'Form' dans Programme.js
      .lean();

    if (!programme) {
      return res.status(404).json({ success: false, message: 'Programme introuvable' });
    }

    // ── Aucun formulaire lié → chercher par programme field dans Form ─────────
    let formDoc = programme.formulaireId;

    if (!formDoc) {
      // Fallback : chercher un Form dont le champ `programme` == programmeId
      formDoc = await Form.findOne({
        programme: programmeId.toString(),
        status:    { $in: ['published', 'draft'] },
      })
        .sort({ updatedAt: -1 })
        .lean();
    }

    if (!formDoc) {
      // Dernier fallback : formulaire spontané de base
      console.warn(`[getApplyForm] Aucun formulaire lié au programme ${programmeId} — fallback`);
      return res.status(200).json({
        success: true,
        form:    { ...FALLBACK_FORM, _warning: 'Aucun formulaire lié — formulaire de base utilisé' },
      });
    }

    // ── Transformer les questions BD → champs front ──────────────────────────
    const questions = Array.isArray(formDoc.questions) ? formDoc.questions : [];

    if (questions.length === 0) {
      return res.status(200).json({
        success: true,
        form: {
          _id:         formDoc._id,
          title:       formDoc.title,
          description: formDoc.description || formDoc.subtitle || '',
          steps:       STEP_DEFS.slice(0, 1),
          fields:      [],
          _warning:    'Ce formulaire ne contient aucune question',
        },
      });
    }

    const { steps, fields } = distributeToSteps(questions);

    return res.status(200).json({
      success: true,
      form: {
        _id:         formDoc._id,
        title:       formDoc.title,
        description: formDoc.description || formDoc.subtitle || '',
        steps,
        fields,
      },
    });

  } catch (error) {
    console.error('[getApplyForm] Error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/* ═════════════════════════════════════════════════════════════════════════════
   POST /api/apply/submit
   Soumet une candidature (remplace /api/startup/applications si besoin)
   ═════════════════════════════════════════════════════════════════════════════ */
const submitApplication = async (req, res) => {
  try {
    const startupId = req.user?.id || req.user?._id;  // ← fix: id pas startupId
    if (!startupId) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const { programmeId, programmeName, formId, ...answers } = req.body;

    // Vérifier doublon
    if (programmeId && programmeId !== 'null') {
      const existing = await Application.findOne({
        userId: startupId,
        programmeId,
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Vous avez déjà soumis une candidature pour ce programme.',
        });
      }
    }

    // Fichiers
    const fileAnswers = {};
    if (req.files) {
      Object.entries(req.files).forEach(([key, files]) => {
        const f = Array.isArray(files) ? files[0] : files;
        if (f) fileAnswers[key] = f.path || f.filename || f.originalname;
      });
    }

    const application = new Application({
      userId:        startupId,
      programmeId:   (programmeId && programmeId !== 'null') ? programmeId : null,
      programmeName: programmeName || null,
      formId:        (formId && formId !== 'null') ? formId : null,
      email:         req.user?.email || answers.founderEmail || '',
      founderName:   answers.founderName || req.user?.name || '',
      founderEmail:  answers.founderEmail || req.user?.email || '',
      answers:       { ...answers, ...fileAnswers },
      status:        'pending',
      submittedAt:   new Date(),
    });

    await application.save();

    return res.status(201).json({
      success: true,
      message: 'Candidature soumise avec succès',
      applicationId: application._id,
    });

  } catch (error) {
    console.error('[submitApplication] Error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

module.exports = { getApplyForm, submitApplication };