// src/controllers/aiChatbotController.js
// Express controller — GET /api/ai/chat (SSE) + POST /api/ai/chat (JSON)

const { getChatResponse, buildSystemPrompt } = require('../services/aiChatbotService');
const { generate }                           = require('../services/ollamaService');

// ─── Rate limiting simple en mémoire (par IP, sans dépendance externe) ───
const rateLimitMap = new Map();
const RATE_LIMIT   = parseInt(process.env.CHATBOT_RATE_LIMIT || '20');
const RATE_WINDOW  = 60 * 60 * 1000;

function checkRateLimit(ip) {
  const now   = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ─── POST /api/ai/chat — réponse JSON complète ───────────────────────────
async function chatJSON(req, res) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: `Limite atteinte : ${RATE_LIMIT} messages/heure. Réessayez plus tard.`,
    });
  }

  const { message, history = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Le champ "message" est requis.' });
  }

  let parsedHistory = [];
  try {
    parsedHistory = Array.isArray(history) ? history : JSON.parse(history);
  } catch {
    parsedHistory = [];
  }

  try {
    const response = await getChatResponse(message.trim(), parsedHistory);
    return res.json({ response, timestamp: new Date() });
  } catch (err) {
    console.error('[aiChatbot] Erreur getChatResponse:', err.message);
    if (err.message?.includes('non disponible') || err.message?.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: 'Le service IA est temporairement indisponible. Réessayez dans quelques instants.',
        fallback: true,
      });
    }
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ─── GET /api/ai/chat — streaming SSE token par token ────────────────────
async function chatSSE(req, res) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  if (!checkRateLimit(ip)) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.write(`data: ${JSON.stringify({ error: `Limite atteinte : ${RATE_LIMIT} messages/heure.` })}\n\n`);
    return res.end();
  }

  const message    = req.query.message;
  const historyRaw = req.query.history;

  if (!message || !message.trim()) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.write(`data: ${JSON.stringify({ error: 'Paramètre "message" requis.' })}\n\n`);
    return res.end();
  }

  let history = [];
  try {
    history = historyRaw ? JSON.parse(historyRaw) : [];
  } catch {
    history = [];
  }

  res.setHeader('Content-Type',                'text/event-stream');
  res.setHeader('Cache-Control',               'no-cache');
  res.setHeader('Connection',                  'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.flushHeaders();

  const keepalive = setInterval(() => res.write(': ping\n\n'), 15000);

  try {
    const systemPrompt = await buildSystemPrompt();

    let prompt = systemPrompt + '\n\n';
    history.slice(-10).forEach(msg => {
      prompt += msg.role === 'user'
        ? `Utilisateur: ${msg.content}\n`
        : `Assistant: ${msg.content}\n`;
    });
    prompt += `Utilisateur: ${message.trim()}\nAssistant:`;

    const ollamaUrl   = process.env.OLLAMA_URL  || 'http://localhost:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'mistral';

    const ollamaRes = await fetch(`${ollamaUrl}/api/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:  ollamaModel,
        prompt,
        stream: true,
        options: {
          temperature:    0.3,
          num_predict:    512,   // FIX: was 256 — truncated responses mid-sentence
          top_p:          0.9,
          repeat_penalty: 1.1,
        },
      }),
      signal: AbortSignal.timeout(
        parseInt(process.env.OLLAMA_TIMEOUT_MS || '60000')
      ),
    });

    if (!ollamaRes.ok) throw new Error(`Ollama HTTP ${ollamaRes.status}`);

    const reader  = ollamaRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.response) {
            res.write(`data: ${JSON.stringify({ token: json.response })}\n\n`);
          }
          if (json.done) {
            clearInterval(keepalive);
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            return res.end();
          }
        } catch { /* ignorer les lignes non-JSON */ }
      }
    }

    clearInterval(keepalive);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (err) {
    clearInterval(keepalive);
    console.error('[aiChatbot SSE] Erreur:', err.message);
    const msg = err.message?.includes('ECONNREFUSED')
      ? 'Service IA indisponible.'
      : 'Erreur de connexion. Réessayez.';
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    res.end();
  }
}

// ─── GET /api/ai/chat/health ──────────────────────────────────────────────
async function chatHealth(req, res) {
  const { healthCheck } = require('../services/ollamaService');
  const status = await healthCheck();
  res.json({ chatbot: 'online', ollama: status, timestamp: new Date() });
}

module.exports = { chatJSON, chatSSE, chatHealth };