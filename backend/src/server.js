require('dotenv').config();
const http    = require('http');
const app     = require('./app');
const connectDB = require('./config/database');
const { Server } = require('socket.io');
const notificationService = require('./services/notificationService');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  // ── 1. Créer le serveur HTTP à partir d'Express ─────────────────────────
  const server = http.createServer(app);

  // ── 2. Attacher Socket.IO au serveur HTTP ────────────────────────────────
  const io = new Server(server, {
    cors: {
      origin:      process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
      methods:     ['GET', 'POST'],
    },
    // Reconnexion automatique côté client activée par défaut
    pingTimeout:  60000,
    pingInterval: 25000,
  });

  // ── 3. Injecter io dans notificationService ──────────────────────────────
  notificationService.setIo(io);

  // ── 4. Gestion des connexions Socket.IO ──────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId;
    const role   = socket.handshake.auth?.role;

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    // Chaque user rejoint sa room personnelle (userId) + la room de son rôle
    socket.join(userId.toString());
    if (role) socket.join(`role:${role}`); // ex: 'role:admin', 'role:mentor'

    console.log(`🔌 [Socket] ${role || 'user'} connecté — room: ${userId}`);

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [Socket] ${userId} déconnecté — ${reason}`);
    });

    // Optionnel : le client peut demander ses notifs non-lues via socket
    socket.on('notifications:fetch', async () => {
      try {
        const Notification = require('./models/Notification');
        const notifs = await Notification.find({ recipientId: userId, read: false })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean();
        socket.emit('notifications:list', notifs);
      } catch (err) {
        console.error('[Socket] notifications:fetch error:', err.message);
      }
    });
  });

  // ── 5. Exposer io sur app pour usage dans les controllers ────────────────
  // Permet : req.app.get('io').to(roomId).emit(...)
  app.set('io', io);

  // ── 6. Démarrer le serveur ───────────────────────────────────────────────
  server.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📦 MongoDB connecté`);
    console.log(`🔌 Socket.IO actif`);
    console.log(`🌍 Environnement : ${process.env.NODE_ENV}`);
  });

  // Timeouts pour requêtes LLM/Ollama
  server.setTimeout(15 * 60 * 1000);
  server.keepAliveTimeout = 65 * 1000;

  console.log('⏱  Timeouts configurés : 15 min pour requêtes LLM');

}).catch((err) => {
  console.error('❌ Impossible de démarrer :', err.message);
  process.exit(1);
});