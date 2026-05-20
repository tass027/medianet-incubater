// src/services/notificationService.js
const Notification = require('../models/Notification');

let _io = null;

/**
 * Injecté depuis server.js après l'initialisation de Socket.IO
 */
function setIo(io) {
  _io = io;
}

/**
 * Crée une notification en base et l'émet en temps réel si possible.
 */
async function create({
  recipientId,
  recipientRole,
  type,
  title,
  body,
  link = '#',
  data = {},
}) {
  const notif = await Notification.create({
    recipientId,
    recipientRole,
    type,
    title,
    body,
    link,
    data,
    read:      false,
    readAt:    null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Émettre en temps réel si Socket.IO est disponible
  if (_io && recipientId) {
    _io
      .to(recipientId.toString())
      .emit('notification:new', notif.toObject());
  }

  return notif;
}

module.exports = { setIo, create };