// controllers/formController.js
const mongoose = require('mongoose');
const db = mongoose.connection;

const formCol     = () => db.collection('forms');
const responseCol = () => db.collection('formresponses');

// Helper pour convertir les IDs
const toObjectId = (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
};

// ════════════════════════════════════════════════════
// GET /api/forms  — list all forms
// ════════════════════════════════════════════════════
exports.getAllForms = async (req, res) => {
  try {
    const { status, type, programme } = req.query;
    const filter = {};
    if (status    && status    !== 'all') filter.status    = status;
    if (type      && type      !== 'all') filter.type      = type;
    if (programme && programme !== 'all') {
      if (programme === 'base' || programme === 'null') {
        filter.programme = null;
      } else {
        filter.programme = programme;
      }
    }

    const forms = await formCol().find(filter).sort({ createdAt: -1 }).toArray();

    // Enrich with live response counts
    const enriched = await Promise.all(forms.map(async (f) => {
      const responseCount = await responseCol().countDocuments({ formId: f._id });
      const totalSent = f.sentTo || 0;
      const completionRate = totalSent > 0 ? Math.round((responseCount / totalSent) * 100) : 0;
      return {
        ...f,
        id: f._id.toString(),
        responses: responseCount,
        completionRate,
        fields: f.questions?.length || 0,
      };
    }));

    res.json({ success: true, forms: enriched, total: enriched.length });
  } catch (err) {
    console.error('[getAllForms]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
};

// ════════════════════════════════════════════════════
// GET /api/forms/:id
// ════════════════════════════════════════════════════
exports.getFormById = async (req, res) => {
  try {
    const { id } = req.params;
    const formId = toObjectId(id);
    if (!formId)
      return res.status(400).json({ success: false, message: 'ID invalide' });

    const form = await formCol().findOne({ _id: formId });
    if (!form) return res.status(404).json({ success: false, message: 'Formulaire non trouvé' });

    const responseCount = await responseCol().countDocuments({ formId: form._id });
    res.json({ success: true, form: { ...form, id: form._id.toString(), responses: responseCount } });
  } catch (err) {
    console.error('[getFormById]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════
// POST /api/forms  — create form
// ════════════════════════════════════════════════════
exports.createForm = async (req, res) => {
  try {
    const {
      title, subtitle, description, type = 'custom', status = 'draft',
      accent, programme, programmeName, isInherited, questions = [],
      sentTo = 0, sentToNames = [], recipientIds = [],
    } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'Titre requis' });

    const newForm = {
      title,
      subtitle:      subtitle      || '',
      description:   description   || '',
      type,
      status,
      accent:        accent        || '#006d94',
      programme:     programme     || null,
      programmeName: programmeName || null,
      isInherited:   isInherited   || false,
      questions,
      fields:        questions.length,
      sentTo,
      sentToNames,
      recipientIds,
      responses:     0,
      completionRate: 0,
      createdBy:     req.user?._id || null,
      createdAt:     new Date(),
      updatedAt:     new Date(),
    };

    const result = await formCol().insertOne(newForm);
    res.status(201).json({
      success: true,
      message: 'Formulaire créé',
      form: { ...newForm, id: result.insertedId.toString(), _id: result.insertedId },
    });
  } catch (err) {
    console.error('[createForm]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
};

// ════════════════════════════════════════════════════
// PUT /api/forms/:id  — update form
// ════════════════════════════════════════════════════
exports.updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formId = toObjectId(id);
    if (!formId)
      return res.status(400).json({ success: false, message: 'ID invalide' });

    const updates = { ...req.body, updatedAt: new Date() };
    delete updates._id;
    delete updates.id;
    if (updates.questions) updates.fields = updates.questions.length;

    const result = await formCol().findOneAndUpdate(
      { _id: formId },
      { $set: updates },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ success: false, message: 'Formulaire non trouvé' });

    res.json({ success: true, form: { ...result, id: result._id.toString() } });
  } catch (err) {
    console.error('[updateForm]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════
// DELETE /api/forms/:id
// ✅ PROTECTION : suppression bloquée si des réponses existent
// Pour forcer la suppression avec cascade, passer ?force=true
// ════════════════════════════════════════════════════
exports.deleteForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formId = toObjectId(id);
    if (!formId)
      return res.status(400).json({ success: false, message: 'ID invalide' });

    // ✅ Vérifier l'existence du formulaire
    const form = await formCol().findOne({ _id: formId });
    if (!form)
      return res.status(404).json({ success: false, message: 'Formulaire non trouvé' });

    // ✅ NOUVEAU — bloquer si lié à un programme publié
    if (form.programme) {
      const publishedProg = await db
        .collection('programmes')
        .findOne({ _id: toObjectId(form.programme), status: 'published' });

      if (publishedProg) {
        return res.status(403).json({
          success: false,
          message: `Ce formulaire est lié au programme publié "${publishedProg.name || form.programme}" et ne peut pas être supprimé.`,
          reason: 'linked_to_published_programme',
        });
      }
    }

    // ✅ Bloquer si des réponses existent (cascade désactivée)
    const responseCount = await responseCol().countDocuments({ formId });
    if (responseCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Ce formulaire contient ${responseCount} réponse(s) et ne peut pas être supprimé.`,
        reason: 'has_responses',
        responseCount,
      });
    }

    await formCol().deleteOne({ _id: formId });

    res.json({ success: true, message: 'Formulaire supprimé.' });
  } catch (err) {
    console.error('[deleteForm]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════
// PATCH /api/forms/:id/send  — send form to recipients
// ════════════════════════════════════════════════════
exports.sendForm = async (req, res) => {
  try {
    const { id } = req.params;
    const formId = toObjectId(id);
    if (!formId)
      return res.status(400).json({ success: false, message: 'ID invalide' });

    const { recipients, message } = req.body;

    const sentTo      = recipients === 'all' ? 99 : recipients.length;
    const sentToNames = recipients;

    await formCol().updateOne(
      { _id: formId },
      { $set: { status: 'published', sentTo, sentToNames, updatedAt: new Date() } }
    );

    // TODO: integrate with mailer.js
    res.json({ success: true, message: `Formulaire envoyé à ${sentTo} destinataire(s)` });
  } catch (err) {
    console.error('[sendForm]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════
// GET /api/forms/:id/responses  — get all responses for a form
// ════════════════════════════════════════════════════
exports.getFormResponses = async (req, res) => {
  try {
    const { id } = req.params;
    const formId = toObjectId(id);

    if (!formId)
      return res.status(400).json({ success: false, message: 'ID de formulaire invalide' });

    const responses = await responseCol()
      .find({ formId })
      .sort({ submittedAt: -1 })
      .toArray();

    const mapped = responses.map(r => {
      let answers = r.answers || {};
      if (answers instanceof Map)                                    answers = Object.fromEntries(answers);
      else if (Array.isArray(answers))                              answers = answers.reduce((acc, item, idx) => { acc[`field_${idx}`] = item; return acc; }, {});
      else if (typeof answers !== 'object' || answers === null)     answers = {};

      return { ...r, id: r._id.toString(), answers };
    });

    res.json({ success: true, responses: mapped, total: mapped.length });
  } catch (err) {
    console.error('[getFormResponses]', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des réponses', error: err.message });
  }
};

// ════════════════════════════════════════════════════
// POST /api/forms/:id/responses  — submit a response
// ════════════════════════════════════════════════════
exports.submitFormResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const formId = toObjectId(id);

    if (!formId)
      return res.status(400).json({ success: false, message: 'ID de formulaire invalide' });

    const { respondent, email, company, sector, answers, score, status, amount } = req.body;

    let normalizedAnswers = answers || {};
    if (normalizedAnswers instanceof Map)                                    normalizedAnswers = Object.fromEntries(normalizedAnswers);
    if (typeof normalizedAnswers !== 'object' || Array.isArray(normalizedAnswers)) normalizedAnswers = {};

    const newResponse = {
      formId,
      respondent:  respondent || 'Anonymous',
      email:       email      || '',
      company:     company    || '',
      sector:      sector     || '',
      answers:     normalizedAnswers,
      submittedAt: new Date(),
      score:       score  || 0,
      status:      status || 'Active',
      amount:      amount || '',
    };

    const result = await responseCol().insertOne(newResponse);

    // Mise à jour du compteur du formulaire
    const responseCount  = await responseCol().countDocuments({ formId });
    const form           = await formCol().findOne({ _id: formId });
    const totalSent      = form?.sentTo || 0;
    const completionRate = totalSent > 0 ? Math.round((responseCount / totalSent) * 100) : 0;

    await formCol().updateOne(
      { _id: formId },
      { $set: { responses: responseCount, completionRate, updatedAt: new Date() } }
    );

    res.status(201).json({
      success:  true,
      message:  'Réponse soumise',
      response: { ...newResponse, id: result.insertedId.toString() },
    });
  } catch (err) {
    console.error('[submitFormResponse]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
};

// ════════════════════════════════════════════════════
// DELETE /api/forms/:id/responses/:responseId
// ════════════════════════════════════════════════════
exports.deleteFormResponse = async (req, res) => {
  try {
    const { id, responseId } = req.params;
    const respId = toObjectId(responseId);

    if (!respId)
      return res.status(400).json({ success: false, message: 'ID de réponse invalide' });

    const result = await responseCol().deleteOne({ _id: respId });

    if (result.deletedCount === 0)
      return res.status(404).json({ success: false, message: 'Réponse non trouvée' });

    // Mettre à jour le compteur du formulaire
    if (id) {
      const formId = toObjectId(id);
      if (formId) {
        const responseCount  = await responseCol().countDocuments({ formId });
        const form           = await formCol().findOne({ _id: formId });
        const totalSent      = form?.sentTo || 0;
        const completionRate = totalSent > 0 ? Math.round((responseCount / totalSent) * 100) : 0;

        await formCol().updateOne(
          { _id: formId },
          { $set: { responses: responseCount, completionRate, updatedAt: new Date() } }
        );
      }
    }

    res.json({ success: true, message: 'Réponse supprimée' });
  } catch (err) {
    console.error('[deleteFormResponse]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════
// GET /api/forms/stats  — global stats
// ════════════════════════════════════════════════════
exports.getFormStats = async (req, res) => {
  try {
    const [total, basic, custom, published, draft, archived, totalResponses] = await Promise.all([
      formCol().countDocuments({}),
      formCol().countDocuments({ type: 'basic' }),
      formCol().countDocuments({ type: 'custom' }),
      formCol().countDocuments({ status: 'published' }),
      formCol().countDocuments({ status: 'draft' }),
      formCol().countDocuments({ status: 'archived' }),
      responseCol().countDocuments({}),
    ]);

    res.json({ success: true, stats: { total, basic, custom, published, draft, archived, totalResponses } });
  } catch (err) {
    console.error('[getFormStats]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ════════════════════════════════════════════════════
// GET /api/forms/:id/export  — export responses as CSV
// ════════════════════════════════════════════════════
exports.exportFormResponses = async (req, res) => {
  try {
    const { id } = req.params;
    const formId = toObjectId(id);

    if (!formId)
      return res.status(400).json({ success: false, message: 'ID de formulaire invalide' });

    const form = await formCol().findOne({ _id: formId });
    if (!form)
      return res.status(404).json({ success: false, message: 'Formulaire non trouvé' });

    const responses = await responseCol()
      .find({ formId })
      .sort({ submittedAt: -1 })
      .toArray();

    const headers = ['ID', 'Répondant', 'Email', 'Société', 'Secteur', 'Score', 'Statut', 'Montant', 'Date de soumission'];

    if (form.questions?.length > 0) {
      form.questions.forEach((q, idx) => headers.push(`Q${idx + 1}: ${q.label}`));
    }

    const rows = responses.map(r => {
      let answers = r.answers || {};
      if (answers instanceof Map) answers = Object.fromEntries(answers);

      const row = [
        r._id.toString(),
        r.respondent || '',
        r.email      || '',
        r.company    || '',
        r.sector     || '',
        r.score      || 0,
        r.status     || '',
        r.amount     || '',
        new Date(r.submittedAt).toLocaleString('fr-FR'),
      ];

      if (form.questions?.length > 0) {
        form.questions.forEach(q => {
          const answer = answers[q.id] || answers[q.label] || '';
          row.push(typeof answer === 'object' ? JSON.stringify(answer) : answer);
        });
      }

      return row;
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=form_${form._id}_responses.csv`);
    res.send('\uFEFF' + csvContent); // BOM UTF-8
  } catch (err) {
    console.error('[exportFormResponses]', err);
    res.status(500).json({ success: false, message: "Erreur lors de l'export" });
  }
};