const Notification = require('../models/Notification');

exports.getMyNotifications = async (req, res) => {
  try {
    const filter = { recipientId: req.user._id };

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success:     true,
      data:        notifications,
      unreadCount: notifications.filter(n => !n.read).length,
    });
  } catch (err) {
    console.error('[getMyNotifications]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification introuvable.' });
    res.status(200).json({ success: true, notification: notif });
  } catch (err) {
    console.error('[markRead]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipientId: req.user._id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    res.status(200).json({ success: true, updated: result.modifiedCount });
  } catch (err) {
    console.error('[markAllRead]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notif = await Notification.findOneAndDelete({
      _id:         req.params.id,
      recipientId: req.user._id,
    });
    if (!notif) return res.status(404).json({ message: 'Notification introuvable.' });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[deleteNotification]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipientId: req.user._id,
      read:        false,
    });
    res.status(200).json({ unreadCount: count });
  } catch (err) {
    console.error('[getUnreadCount]', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};