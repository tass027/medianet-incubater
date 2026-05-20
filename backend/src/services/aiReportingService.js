// src/services/aiReportingService.js
const { generate } = require('./ollamaService');

// ─── Pré-calcul complet côté Node ────────────────────────────────────────
function computeStats(submittedEvals) {
  const criteria = [
    { key: 'team',       label: 'Equipe',           poids: 30 },
    { key: 'innovation', label: 'Innovation',        poids: 25 },
    { key: 'market',     label: 'Marche',            poids: 20 },
    { key: 'business',   label: 'Modele economique', poids: 15 },
    { key: 'traction',   label: 'Traction',          poids: 10 },
  ];

  const tableau = criteria.map(c => {
    const scoresByJure = {};
    submittedEvals.forEach(ev => {
      const name = ev.jurorName || ev.juryName || 'Jury';
      scoresByJure[name] = (ev.scores || {})[c.key] || 0;
    });
    const vals  = Object.values(scoresByJure).filter(v => v > 0);
    const min   = vals.length ? Math.min(...vals) : 0;
    const max   = vals.length ? Math.max(...vals) : 0;
    const avg   = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    const ecart = max - min;
    return {
      critere:         c.label,
      poids_pct:       c.poids,
      scores_par_jure: scoresByJure,
      moyenne:         avg,
      ecart_max:       ecart,
      consensus:       ecart <= 15,
    };
  });

  const scorePondere = Math.round(
    criteria.reduce((total, c) => {
      const vals = submittedEvals.map(e => (e.scores || {})[c.key] || 0).filter(v => v > 0);
      const avg  = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return total + (avg * c.poids / 100);
    }, 0)
  );

  const jureScores    = submittedEvals.map(ev => ({
    nom:   ev.jurorName || ev.juryName || 'Jury',
    score: ev.totalScore || 0,
  }));
  const jureSevere    = jureScores.reduce((a, b) => a.score < b.score ? a : b, jureScores[0]);
  const jureIndulgent = jureScores.reduce((a, b) => a.score > b.score ? a : b, jureScores[0]);

  const maxEcart  = Math.max(...tableau.map(t => t.ecart_max));
  const fiabilite = submittedEvals.length >= 3 && maxEcart <= 20
    ? 'Eleve'
    : submittedEvals.length >= 2 && maxEcart <= 30
    ? 'Modere'
    : 'Faible';

  const recommandation = scorePondere >= 70 && fiabilite !== 'Faible'
    ? 'Selectionner'
    : scorePondere >= 50
    ? 'A surveiller'
    : 'Non retenu';

  const niveauConfiance = fiabilite === 'Eleve' && submittedEvals.length >= 3
    ? 'Eleve'
    : fiabilite === 'Modere'
    ? 'Modere'
    : 'Faible';

  return {
    tableau,
    scorePondere,
    jureSevere,
    jureIndulgent,
    fiabilite,
    recommandation,
    niveauConfiance,
    maxEcart,
  };
}

// ─── Contexte minimal pour le LLM ────────────────────────────────────────
function buildReportContext(app, evaluations) {
  const submittedEvals = evaluations.filter(e =>
    e.jurySubmitted || e.status === 'submitted' || e.status === 'completed'
  );

  if (submittedEvals.length === 0) {
    throw new Error('Aucune évaluation soumise pour cette candidature');
  }

  const stats    = computeStats(submittedEvals);
  const avgScore = Math.round(
    submittedEvals.reduce((s, e) => s + (e.totalScore || 0), 0) / submittedEvals.length
  );

  let context = `Startup: ${app.startupName || app.name || 'N/A'}\n`;
  context += `Secteur: ${app.sector || 'N/A'} | Stade: ${app.stage || 'N/A'} | Programme: ${app.programmeName || 'N/A'}\n`;
  context += `Score moyen: ${avgScore}/100 | Score pondere: ${stats.scorePondere}/100 | Jures: ${submittedEvals.length}\n\n`;

  context += `Scores par critere:\n`;
  stats.tableau.forEach(t => {
    const detail = Object.entries(t.scores_par_jure)
      .map(([nom, s]) => `${nom}: ${s}`)
      .join(', ');
    context += `- ${t.critere} (${t.poids_pct}%): moyenne ${t.moyenne}, ecart ${t.ecart_max}, consensus: ${t.consensus ? 'oui' : 'non'} | ${detail}\n`;
  });

  context += `\nCommentaires jury:\n`;
  submittedEvals.forEach((ev, i) => {
    const name     = ev.jurorName || ev.juryName || `Jure ${i + 1}`;
    const feedback = (ev.feedback || '').trim();
    // Tronquer les feedbacks longs pour éviter de dépasser num_predict
    const truncated = feedback.length > 200 ? feedback.slice(0, 200) + '...' : feedback;
    context += feedback.length > 5
      ? `- ${name} (${ev.totalScore}/100): "${truncated}"\n`
      : `- ${name} (${ev.totalScore}/100): aucun commentaire\n`;
  });

  return { context, avgScore, stats, submittedEvals };
}

// ─── Prompt compact ───────────────────────────────────────────────────────
function buildReportPrompt(context, stats) {
  return `Tu es expert evaluation startups. Reponds en JSON valide UNIQUEMENT. Langue: francais. Zero emoji. Textes courts (max 20 mots par champ).

${context}

JSON attendu (respecte exactement cette structure, ne tronque pas):
{"synthese":"2 phrases","interpretations":{"Equipe":"1 phrase","Innovation":"1 phrase","Marche":"1 phrase","Modele economique":"1 phrase","Traction":"1 phrase"},"convergences":["1 element"],"divergences":["1 element si ecart>15 sinon tableau vide"],"forces":[{"titre":"court","analyse":"1 phrase"},{"titre":"court","analyse":"1 phrase"}],"faiblesses":[{"titre":"court","analyse":"1 phrase","action":"1 action"},{"titre":"court","analyse":"1 phrase","action":"1 action"}],"resume_feedbacks":"2 phrases","justification":"2 phrases pour recommandation ${stats.recommandation} score ${stats.scorePondere}/100","conditions":["1 point"],"prochaines_etapes":["1 etape"]}`;
}

// ─── Réparer les trailing commas ──────────────────────────────────────────
function repairJSON(str) {
  // Supprimer trailing commas avant } ou ]
  return str.replace(/,(\s*[}\]])/g, '$1');
}

// ─── Extraire et valider le JSON — robuste aux troncatures ───────────────
function extractReportJSON(rawText) {
  if (!rawText || !rawText.trim()) throw new Error('Reponse vide du modele');

  let cleaned = rawText.trim();

  // Retirer les blocs markdown ```json ... ```
  const mdMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (mdMatch) cleaned = mdMatch[1].trim();

  // Trouver le premier { et le dernier }
  const start = cleaned.indexOf('{');
  if (start === -1) throw new Error('Aucun objet JSON trouve dans la reponse');
  cleaned = cleaned.slice(start);

  // 1er essai : JSON tel quel
  try {
    const parsed = JSON.parse(cleaned);
    return validateAndFill(parsed);
  } catch (_) {}

  // 2ème essai : réparer trailing commas
  try {
    const repaired = repairJSON(cleaned);
    const parsed   = JSON.parse(repaired);
    return validateAndFill(parsed);
  } catch (_) {}

  // 3ème essai : trouver le dernier } valide en remontant
  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace > 0) {
    for (let i = lastBrace; i >= 0; i--) {
      if (cleaned[i] !== '}') continue;
      try {
        const slice   = repairJSON(cleaned.slice(0, i + 1));
        const parsed  = JSON.parse(slice);
        console.warn('[aiReporting] JSON tronque recupere par retour arriere');
        return validateAndFill(parsed);
      } catch (_) {}
    }
  }

  // 4ème essai : extraire champ par champ avec regex (fallback minimal)
  console.warn('[aiReporting] JSON irrecuperable, utilisation du fallback regex');
  return buildFallbackFromRegex(cleaned);
}

// ─── Valider et compléter les champs manquants ────────────────────────────
function validateAndFill(parsed) {
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('La reponse n\'est pas un objet JSON');
  }

  return {
    synthese:         parsed.synthese         || '',
    interpretations:  parsed.interpretations  || {},
    convergences:     Array.isArray(parsed.convergences)  ? parsed.convergences  : [],
    divergences:      Array.isArray(parsed.divergences)   ? parsed.divergences   : [],
    forces:           Array.isArray(parsed.forces)        ? parsed.forces        : [],
    faiblesses:       Array.isArray(parsed.faiblesses)    ? parsed.faiblesses    : [],
    resume_feedbacks: parsed.resume_feedbacks || '',
    justification:    parsed.justification    || '',
    conditions:       Array.isArray(parsed.conditions)       ? parsed.conditions       : [],
    prochaines_etapes: Array.isArray(parsed.prochaines_etapes) ? parsed.prochaines_etapes : [],
  };
}

// ─── Fallback si JSON totalement illisible ────────────────────────────────
function buildFallbackFromRegex(raw) {
  const extract = (key) => {
    const m = raw.match(new RegExp(`"${key}"\\s*:\\s*"([^"]{0,300})"`));
    return m ? m[1] : '';
  };

  return {
    synthese:          extract('synthese')         || 'Analyse indisponible.',
    interpretations:   {},
    convergences:      [],
    divergences:       [],
    forces:            [],
    faiblesses:        [],
    resume_feedbacks:  extract('resume_feedbacks') || '',
    justification:     extract('justification')    || 'Justification indisponible.',
    conditions:        [],
    prochaines_etapes: [],
  };
}

// ─── Assembler le rapport final (chiffres Node + texte LLM) ──────────────
function assembleReport(llmText, stats) {
  return {
    synthese_executive: llmText.synthese         || '',
    synthese_feedbacks: llmText.resume_feedbacks || '',

    tableau_comparatif: stats.tableau.map(t => ({
      ...t,
      interpretation: (llmText.interpretations || {})[t.critere] || '',
    })),

    analyse_jury: {
      jure_severe:    stats.jureSevere,
      jure_indulgent: stats.jureIndulgent,
      fiabilite:      stats.fiabilite,
      convergences:   llmText.convergences || [],
      divergences:    llmText.divergences  || [],
    },

    forces: (llmText.forces || []).map(f => ({
      titre:   f.titre   || '',
      analyse: f.analyse || '',
    })),

    axes_amelioration: (llmText.faiblesses || []).map(f => ({
      titre:   f.titre   || '',
      analyse: f.analyse || '',
      action:  f.action  || '',
    })),

    decision_finale: {
      recommandation:    stats.recommandation,
      niveau_confiance:  stats.niveauConfiance,
      score_pondere:     stats.scorePondere,
      justification:     llmText.justification        || '',
      conditions:        llmText.conditions           || [],
      prochaines_etapes: llmText.prochaines_etapes    || [],
    },
  };
}

// ─── Fonction principale ──────────────────────────────────────────────────
async function generateReport(app, evaluations) {
  const { context, avgScore, stats, submittedEvals } = buildReportContext(app, evaluations);
  const prompt = buildReportPrompt(context, stats);

  console.log(`[aiReporting] "${app.startupName || app.name}" — ${submittedEvals.length} jures — score: ${stats.scorePondere} — recommandation: ${stats.recommandation}`);

  const rawResponse = await generate(prompt, {
    temperature: 0.1,   // Plus bas = moins de créativité = JSON plus stable
    num_predict: 800,   // Suffisant pour du texte court uniquement
    format:      'json', // Force Ollama à produire du JSON valide (si supporté)
    timeout:     parseInt(process.env.OLLAMA_TIMEOUT_MS || '120000'),
    model:       process.env.OLLAMA_REPORTING_MODEL || process.env.OLLAMA_MODEL || 'llama3.2',
  });

  const llmText = extractReportJSON(rawResponse);
  const report  = assembleReport(llmText, stats);

  return {
    applicationId:  app._id || app.id,
    startupName:    app.startupName || app.name,
    generatedAt:    new Date(),
    model:          process.env.OLLAMA_REPORTING_MODEL || process.env.OLLAMA_MODEL || 'llama3.2',
    juryCount:      submittedEvals.length,
    avgScore,
    scorePondere:   stats.scorePondere,
    recommandation: stats.recommandation,
    report,
  };
}

module.exports = { generateReport };