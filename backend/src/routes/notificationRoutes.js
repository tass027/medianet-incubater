const router       = require('express').Router();
const { protect }  = require('../middlewares/authMiddleware');
const Notification = require('../models/Notification');

router.get('/', protect, async (req, res) => {
  try {
    const filter = { recipientId: req.user._id };

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      success:     true,
      data:        notifications,
      unreadCount: notifications.filter(n => !n.read).length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/read-all', protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipientId: req.user._id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    res.json({ success: true, updated: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:id/read', protect, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { $set: { read: true, readAt: new Date() } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Notification.findOneAndDelete({
      _id:         req.params.id,
      recipientId: req.user._id,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;