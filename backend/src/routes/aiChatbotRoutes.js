// src/routes/aiChatbotRoutes.js

const express = require('express');
const router  = express.Router();
const { chatJSON, chatSSE, chatHealth } = require('../controllers/aiChatbotController');

// GET  /api/ai/chat?message=...&history=...  → streaming SSE token par token
router.get('/', chatSSE);

// POST /api/ai/chat  { message, history[] }  → réponse JSON complète
router.post('/', chatJSON);

// GET  /api/ai/chat/health                   → statut Ollama
router.get('/health', chatHealth);

module.exports = router;