require('dotenv').config();
const app       = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

// 1. Connexion MongoDB
// 2. Démarrage du serveur avec timeouts augmentés pour Ollama/LLM
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📦 MongoDB connecté`);
    console.log(`🌍 Environnement : ${process.env.NODE_ENV}`);
  });

  // ✅ Augmenter les timeouts pour les requêtes LLM/Ollama (peuvent prendre 5-10 min)
  server.setTimeout(15 * 60 * 1000);          // 15 min pour les requêtes (défaut: ~2 min)
  server.keepAliveTimeout = 65 * 1000;        // 65s keep-alive (doit être > timeout client)
  
  console.log('⏱ Timeouts configurés: 15 min pour requêtes LLM');
}).catch((err) => {
  console.error('❌ Impossible de démarrer :', err.message);
  process.exit(1);
});
