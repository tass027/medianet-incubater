// src/routes/notificationRoutes.js

const express = require('express');
const router  = express.Router();

const {
  getMyNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  getUnreadCount,
} = require('../controllers/notificationController');

const { protect } = require('../middlewares/authMiddleware');

// Toutes les routes nécessitent d'être connecté (n'importe quel rôle)
router.use(protect);

// GET    /api/notifications/me             → mes notifications + unreadCount
// GET    /api/notifications/unread-count   → juste le nombre de non-lues
// PATCH  /api/notifications/mark-all-read  → tout marquer comme lu
// PATCH  /api/notifications/:id/read       → marquer 1 notif comme lue
// DELETE /api/notifications/:id            → supprimer une notif

// ⚠️ Les routes spécifiques AVANT la route dynamique :id
router.get('/me',              getMyNotifications);
router.get('/unread-count',    getUnreadCount);
router.patch('/mark-all-read', markAllRead);
router.patch('/:id/read',      markRead);
router.delete('/:id',          deleteNotification);

module.exports = router;