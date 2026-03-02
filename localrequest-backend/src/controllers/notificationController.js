const { Notification, Request } = require('../models');

// @desc    Ottieni notifiche utente
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { userId: req.user._id };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .populate({
        path: 'requestId',
        select: 'title description category city province budget urgency status userId',
        populate: {
          path: 'userId',
          select: 'name photo whatsapp'
        }
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: {
        notifications: notifications.map(n => ({
          id: n._id,
          type: n.type,
          read: n.read,
          readAt: n.readAt,
          createdAt: n.createdAt,
          request: n.requestId
        })),
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Segna notifica come letta
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notifica non trovata'
      });
    }

    await notification.markAsRead();

    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      message: 'Notifica segnata come letta',
      data: { unreadCount }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Segna tutte le notifiche come lette
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.markAllAsRead(req.user._id);

    res.json({
      success: true,
      message: 'Tutte le notifiche segnate come lette',
      data: { unreadCount: 0 }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Elimina notifica
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notifica non trovata'
      });
    }

    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      message: 'Notifica eliminata',
      data: { unreadCount }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ottieni conteggio notifiche non lette
// @route   GET /api/notifications/count
// @access  Private
const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};
