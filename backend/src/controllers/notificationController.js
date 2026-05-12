// src/controllers/notificationController.js

const Notification = require('../models/Notification');

// ─────────────────────────────────────────────────────────────
// GET /api/notifications/me
// Récupère les 30 dernières notifs du user connecté
// ─────────────────────────────────────────────────────────────
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    console.error('[getMyNotifications]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/notifications/:id/read
// Marque une notification spécifique comme lue
// ─────────────────────────────────────────────────────────────
exports.markRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notif) return res.status(404).json({ message: 'Notification introuvable.' });

    res.status(200).json({ success: true, notification: notif });
  } catch (err) {
    console.error('[markRead]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/notifications/mark-all-read
// Marque TOUTES les notifs du user comme lues
// ─────────────────────────────────────────────────────────────
exports.markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      updated: result.modifiedCount,
    });
  } catch (err) {
    console.error('[markAllRead]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/notifications/:id
// Supprime une notification
// ─────────────────────────────────────────────────────────────
exports.deleteNotification = async (req, res) => {
  try {
    const notif = await Notification.findOneAndDelete({
      _id:  req.params.id,
      user: req.user._id,
    });

    if (!notif) return res.status(404).json({ message: 'Notification introuvable.' });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[deleteNotification]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/notifications/unread-count
// Compte rapide des non-lues (pour le badge dans le header)
// ─────────────────────────────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user:   req.user._id,
      isRead: false,
    });

    res.status(200).json({ unreadCount: count });
  } catch (err) {
    console.error('[getUnreadCount]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};