// src/services/ollamaService.js
// ✅ Version corrigée - timeout 180s + num_predict optimisé

const axios = require('axios');

const OLLAMA_URL   = process.env.OLLAMA_URL            || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL          || 'mistral';
const TIMEOUT_MS   = parseInt(process.env.OLLAMA_TIMEOUT_MS || '180000'); // 3 min

// ─── Construire le contexte à partir des réponses de formulaire ────────
function buildFormContext(app) {
  if (app.formResponses && Object.keys(app.formResponses).length > 0) {
    const lines = [];
    for (const [question, answer] of Object.entries(app.formResponses)) {
      if (answer && typeof answer === 'string' && answer.trim()) {
        const cleanQuestion = question
          .replace(/([A-Z])/g, ' $1')
          .replace(/_/g, ' ')
          .replace(/q\d+/i, '')
          .trim();
        lines.push(`• ${cleanQuestion || question}: ${answer}`);
      }
    }
    if (lines.length > 0) return lines.join('\n');
  }

  const project = app.project || {};
  const team    = app.team    || {};
  const economy = app.economy || {};

  const fields = [
    ['Problème identifié',   project.problem       || app.problem         || app.problemDescription],
    ['Solution proposée',    project.solution      || app.solution        || app.solutionDescription],
    ['Marché cible',         economy.targetMarket  || app.targetMarket    || app.market],
    ['Description équipe',   team.founderBio       || app.teamDescription || app.team],
    ['Traction actuelle',    economy.traction      || app.traction        || app.currentTraction],
    ['Description générale', project.description   || app.description],
    ['Technologie utilisée', app.technology],
    ['Modèle économique',    economy.businessModel || app.businessModel   || app.revenueModel],
  ];

  const lines = fields
    .filter(([, val]) => val && val !== 'N/A' && val !== 'Non renseigné')
    .map(([label, val]) => `• ${label}: ${val}`);

  return lines.length > 0 ? lines.join('\n') : 'Aucune réponse détaillée disponible.';
}

// ─── Construire le prompt de scoring ────────────────────────────────────
function buildScoringPrompt(app) {
  const formContext = buildFormContext(app);
  const project     = app.project || {};
  const name        = project.startupName || app.startupName || app.name || 'N/A';
  const sector      = project.sector      || app.sector      || 'N/A';
  const stage       = project.stage       || app.stage       || 'N/A';

  return `Tu es un expert en évaluation de startups pour MEDIANET Incubator, un incubateur tunisien de premier plan.

Analyse cette candidature et retourne UNIQUEMENT un JSON valide, sans texte avant ou après.

CANDIDATURE:
- Startup: ${name}
- Secteur: ${sector}
- Stade de développement: ${stage}

RÉPONSES DU FORMULAIRE:
${formContext}

CRITÈRES DE NOTATION (chaque critère sur 20 points):
1. PROBLÈME (0-20): Clarté du problème identifié, urgence, impact réel sur le marché tunisien/africain
2. MARCHÉ (0-20): Taille du marché, potentiel de croissance, segmentation, accessibilité
3. ÉQUIPE (0-20): Expérience des fondateurs, complémentarité, capacité d'exécution
4. SOLUTION (0-20): Innovation, faisabilité technique, avantage concurrentiel
5. TRACTION (0-20): Preuves marché, clients existants, revenus, croissance

RÈGLES DE SCORING:
- Si l'information est absente ou "Non renseigné" → score bas (1-6)
- Si l'information est partielle → score moyen (7-12)
- Si l'information est complète et convaincante → score élevé (13-20)

Retourne UNIQUEMENT ce JSON (pas de markdown, pas de texte avant/après):
{"scores":{"problem":<0-20>,"market":<0-20>,"team":<0-20>,"solution":<0-20>,"traction":<0-20>},"total":<somme>,"summary":"<2-3 phrases sur ${name}>","strengths":["<point 1>","<point 2>"],"weaknesses":["<point 1>"]}`;
}

// ─── Extraire et valider le JSON ──────────────────────────────────────────
function extractAndValidateJSON(rawText) {
  if (!rawText) throw new Error('Réponse vide');

  let cleaned = rawText.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) cleaned = jsonMatch[1];

  const startIndex = cleaned.indexOf('{');
  const endIndex   = cleaned.lastIndexOf('}');
  if (startIndex === -1 || endIndex === -1) {
    console.error('[ollamaService] Réponse brute:', rawText.substring(0, 500));
    throw new Error('Aucun JSON trouvé dans la réponse');
  }
  cleaned = cleaned.substring(startIndex, endIndex + 1);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error('[ollamaService] JSON invalide:', cleaned.substring(0, 300));
    throw new Error(`JSON invalide: ${e.message}`);
  }

  if (!parsed.scores) throw new Error('Structure invalide — champ "scores" manquant');

  const validatedScores = {
    problem:  Math.min(20, Math.max(0, Math.round(parsed.scores.problem  || 0))),
    market:   Math.min(20, Math.max(0, Math.round(parsed.scores.market   || 0))),
    team:     Math.min(20, Math.max(0, Math.round(parsed.scores.team     || 0))),
    solution: Math.min(20, Math.max(0, Math.round(parsed.scores.solution || 0))),
    traction: Math.min(20, Math.max(0, Math.round(parsed.scores.traction || 0))),
  };
  const computedTotal = Object.values(validatedScores).reduce((a, b) => a + b, 0);

  return {
    scores:     validatedScores,
    total:      computedTotal,
    summary:    parsed.summary   || 'Analyse non disponible.',
    strengths:  Array.isArray(parsed.strengths)  ? parsed.strengths  : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
  };
}

// ─── generateScore : scoring de candidature (évaluation) ─────────────────
async function generateScore(appData) {
  const prompt = buildScoringPrompt(appData);
  let response;
  try {
    response = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model:  OLLAMA_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.3, num_predict: 512 },
      },
      { timeout: TIMEOUT_MS }
    );
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      throw new Error(`Ollama non disponible sur ${OLLAMA_URL}. Vérifiez que Ollama est démarré.`);
    }
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      throw new Error(`Ollama timeout après ${TIMEOUT_MS / 1000}s — essayez OLLAMA_MODEL=gemma2:2b`);
    }
    throw err;
  }

  const raw = response.data?.response || '';
  if (!raw) throw new Error("Réponse vide d'Ollama");
  return extractAndValidateJSON(raw);
}

// ─── generate : appel générique pour le matching (investisseurs / mentors / jury)
// ✅ FIX PRINCIPAL :
//    - timeout : 180 000 ms  (au lieu de 60 000 ms)
//    - num_predict : 800     (au lieu de 300)
//    Ces deux valeurs corrigent l'erreur "timeout of 60000ms exceeded"
//    et le fallback systématique à 75/100 dans matchingService.js
async function generate(prompt, options = {}) {
  try {
    const response = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model:  options.model || OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature:    options.temperature    ?? 0.2,
          num_predict:    options.num_predict    ?? 800,   // ← était 300
          top_p:          options.top_p          ?? 0.9,
          repeat_penalty: options.repeat_penalty ?? 1.1,
        },
      },
      { timeout: options.timeout ?? TIMEOUT_MS }           // ← était 60 000
    );

    const text = response.data?.response || '';
    if (!text) throw new Error("Réponse vide d'Ollama");
    return text;

  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      throw new Error(`Ollama non disponible sur ${OLLAMA_URL}`);
    }
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      throw new Error(
        `Ollama timeout après ${(options.timeout ?? TIMEOUT_MS) / 1000}s. ` +
        `Ajoutez OLLAMA_TIMEOUT_MS=240000 dans .env, ` +
        `ou passez à un modèle plus rapide (ex: gemma2:2b).`
      );
    }
    throw err;
  }
}

// ─── healthCheck ──────────────────────────────────────────────────────────
async function healthCheck() {
  try {
    const start  = Date.now();
    const res    = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 5000 });
    const models = (res.data?.models || []).map((m) => m.name);
    return {
      status:      'healthy',
      latency:     Date.now() - start,
      model:       OLLAMA_MODEL,
      models,
      modelLoaded: models.some((m) => m.startsWith(OLLAMA_MODEL)),
    };
  } catch (err) {
    return { status: 'unhealthy', error: err.message };
  }
}

module.exports = { generateScore, generate, buildScoringPrompt, healthCheck };