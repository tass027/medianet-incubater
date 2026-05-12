// src/services/notificationService.js
/**
 * Service centralisé de notifications
 * Utilisé par : SessionController, MentorController, AdminController
 *
 * Chaque méthode crée la notification en base ET l'émet via Socket.IO
 * si la connexion WebSocket est disponible.
 */

const Notification = require('../models/Notification');

/**
 * Accès à l'instance Socket.IO (initialisée dans server.js)
 * On passe par un getter pour éviter les dépendances circulaires.
 */
let _io = null;
const setIo = (io) => { _io = io; };
const getIo = () => _io;

// ─── Émission Socket.IO ──────────────────────────────────────────────────────
const emit = (notification) => {
  const io = getIo();
  if (!io) return;
  // Chaque user rejoint une room à son ID lors de la connexion WS
  const room = notification.recipientId.toString();
  io.to(room).emit('notification:new', {
    _id:           notification._id,
    type:          notification.type,
    title:         notification.title,
    body:          notification.body,
    link:          notification.link,
    read:          notification.read,
    data:          notification.data,
    createdAt:     notification.createdAt,
  });
};

// ─── Créer + émettre une notification ────────────────────────────────────────
const create = async ({ recipientId, recipientRole, type, title, body, link = '', data = {} }) => {
  try {
    const notif = await Notification.create({
      recipientId,
      recipientRole,
      type,
      title,
      body,
      link,
      data,
    });
    emit(notif);
    return notif;
  } catch (err) {
    console.error('[NotificationService] create error:', err.message);
    return null;
  }
};

// ─── Helpers métier ────────────────────────────────────────────────────────
/**
 * Notifie le mentor ET la startup quand une session mentorat est créée/assignée.
 * Appelé par : SessionController.createSession (type='mentoring')
 */
const notifyMentoringSession = async ({
  session,
  mentor,
  startup,
  customBody = '',
  createdByMentor = false,
}) => {
  const promises = [];

  // --- Mentor ---
  if (mentor && session.notifyMentor !== false) {
    const mentorBody = customBody ||
      `Une session de mentorat "${session.title}" a été planifiée pour vous. ` +
      `Date : ${new Date(session.date).toLocaleDateString('fr-FR')} à ${session.time}.`;

    promises.push(
      create({
        recipientId:   mentor._id,
        recipientRole: 'mentor',
        type:          createdByMentor ? 'session_confirmed' : 'session_pending',
        title:         createdByMentor ? 'Session créée' : 'Nouvelle session de mentorat',
        body:          mentorBody,
        link:          '/dashboard/mentor/sessions',
        data: {
          sessionId:      session._id,
          sessionType:    session.type,
          domain:         session.domain,
          requiresAction: !createdByMentor,
          meetLink:       session.meetLink || '',
        },
      })
    );
  }

  // --- Startup ---
  if (startup && session.notifyStartup !== false) {
    const startupBody = customBody ||
      (createdByMentor
        ? `Votre mentor a planifié une session "${session.title}". Date : ${new Date(session.date).toLocaleDateString('fr-FR')} à ${session.time}.`
        : `Une session de mentorat "${session.title}" a été planifiée. Date : ${new Date(session.date).toLocaleDateString('fr-FR')} à ${session.time}.`
      );

    promises.push(
      create({
        recipientId:   startup._id || startup.userId,
        recipientRole: 'startup',
        type:          'session_assigned',
        title:         'Session de mentorat planifiée',
        body:          startupBody,
        link:          '/dashboard/startup/sessions',
        data: {
          sessionId:       session._id,
          sessionType:     session.type,
          mentorId:        mentor?._id || null,
          meetLink:        session.meetLink || '',
          createdByMentor,
        },
      })
    );
  }

  // --- Admin (si session créée par mentor) ---
  if (createdByMentor) {
    promises.push(
      create({
        recipientId:   null,          // sera résolu en boucle sur les admins
        recipientRole: 'admin',
        type:          'mentor_session_created',
        title:         'Nouvelle session créée par un mentor',
        body:          `Le mentor ${mentor?.name || ''} a planifié une session "${session.title}".`,
        link:          '/dashboard/admin/startups',
        data: {
          sessionId: session._id,
          mentorId:  mentor?._id || null,
          startupId: startup?._id || null,
        },
      })
    );
  }

  return Promise.all(promises.filter(Boolean));
};

/**
 * Notifie les startups ciblées quand une session collective est créée.
 * Appelé par : SessionController.createSession (type != 'mentoring')
 */
const notifyCollectiveSession = async ({ session, targetUsers = [] }) => {
  if (!session.notifyStartup || targetUsers.length === 0) return;

  const promises = targetUsers.map((user) =>
    create({
      recipientId:   user._id || user.userId,
      recipientRole: 'startup',
      type:          'session_new',
      title:         `Nouvelle session : ${session.title}`,
      body:          session.customNotificationBody ||
        `Une nouvelle session "${session.title}" est disponible. ` +
        `Date : ${new Date(session.date).toLocaleDateString('fr-FR')} à ${session.time}.`,
      link:          '/dashboard/startup/sessions',
      data: {
        sessionId:   session._id,
        sessionType: session.type,
        domain:      session.domain,
        isOnline:    session.isOnline,
        meetLink:    session.meetLink || '',
        location:    session.location || '',
      },
    })
  );

  // Notifier les mentors si demandé
  if (session.notifyMentor) {
    // targetMentors doit être passé séparément si besoin
  }

  return Promise.all(promises);
};

/**
 * Rappel automatique J-1 (appelable via un cron job)
 */
const sendReminders = async (sessionsDb) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const sessions = await sessionsDb.find({
    date: { $gte: tomorrow, $lt: dayAfter },
    status: 'upcoming',
  }).toArray();

  const promises = [];
  for (const session of sessions) {
    const dateStr = new Date(session.date).toLocaleDateString('fr-FR');
    const body    = `Rappel : la session "${session.title}" a lieu demain à ${session.time}.`;

    // Notifier mentor
    if (session.mentorId) {
      promises.push(create({
        recipientId:   session.mentorId,
        recipientRole: 'mentor',
        type:          'session_reminder',
        title:         'Rappel — Session demain',
        body,
        link:          '/dashboard/mentor/sessions',
        data:          { sessionId: session._id, hoursUntil: 24 },
      }));
    }

    // Notifier startup
    if (session.startupId) {
      promises.push(create({
        recipientId:   session.startupId,
        recipientRole: 'startup',
        type:          'session_reminder',
        title:         'Rappel — Session demain',
        body,
        link:          '/dashboard/startup/sessions',
        data:          { sessionId: session._id, hoursUntil: 24 },
      }));
    }
  }

  return Promise.all(promises);
};

module.exports = {
  setIo,
  create,
  notifyMentoringSession,
  notifyCollectiveSession,
  sendReminders,
};