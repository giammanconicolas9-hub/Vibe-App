const { Request, User, Notification } = require('../models');
const { validationResult } = require('express-validator');

// @desc    Crea nuova richiesta
// @route   POST /api/requests
// @access  Private
const createRequest = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: errors.array()
      });
    }

    const { title, description, category, images, budget, urgency, expiresAt } = req.body;

    // Crea richiesta
    const request = await Request.create({
      userId: req.user._id,
      title,
      description,
      category,
      city: req.user.city,
      province: req.user.province,
      images: images || [],
      budget,
      urgency,
      expiresAt: new Date(expiresAt),
      notifiedUsers: []
    });

    // Aggiorna stats utente
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.requestsCount': 1 }
    });

    // Trova utenti da notificare (stessa zona, stessa categoria preferita)
    const usersToNotify = await User.find({
      _id: { $ne: req.user._id },
      isActive: true,
      $or: [
        { city: req.user.city },
        { province: req.user.province }
      ],
      'preferences.id': category.id
    });

    // Crea notifiche
    const notifications = usersToNotify.map(user => ({
      userId: user._id,
      requestId: request._id,
      type: 'new_request',
      read: false
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      
      // Aggiorna lista utenti notificati
      await Request.findByIdAndUpdate(request._id, {
        $push: { notifiedUsers: { $each: usersToNotify.map(u => u._id) } }
      });
    }

    // Popola dati utente per risposta
    await request.populate('userId', 'name photo whatsapp');

    res.status(201).json({
      success: true,
      message: 'Richiesta creata con successo',
      data: {
        request: {
          id: request._id,
          title: request.title,
          description: request.description,
          category: request.category,
          city: request.city,
          province: request.province,
          images: request.images,
          budget: request.budget,
          urgency: request.urgency,
          status: request.status,
          views: request.views,
          contacts: request.contacts,
          user: request.userId,
          createdAt: request.createdAt,
          expiresAt: request.expiresAt,
          notifiedCount: usersToNotify.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ottieni richieste per il feed (matching zona + preferenze)
// @route   GET /api/requests/feed
// @access  Private
const getFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category } = req.query;

    // Ottieni preferenze utente
    const userPreferences = req.user.preferences.map(p => p.id);

    // Costruisci query
    const query = {
      status: 'active',
      expiresAt: { $gt: new Date() },
      userId: { $ne: req.user._id },
      $or: [
        { city: req.user.city },
        { province: req.user.province }
      ],
      'category.id': { $in: userPreferences }
    };

    // Filtra per categoria se specificata
    if (category) {
      query['category.id'] = category;
    }

    // Esegui query con paginazione
    const requests = await Request.find(query)
      .populate('userId', 'name photo whatsapp')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Conta totale
    const total = await Request.countDocuments(query);

    res.json({
      success: true,
      data: {
        requests: requests.map(r => ({
          id: r._id,
          title: r.title,
          description: r.description,
          category: r.category,
          city: r.city,
          province: r.province,
          images: r.images,
          budget: r.budget,
          urgency: r.urgency,
          status: r.status,
          views: r.views,
          contacts: r.contacts,
          user: r.userId,
          createdAt: r.createdAt,
          expiresAt: r.expiresAt
        })),
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

// @desc    Ottieni le mie richieste
// @route   GET /api/requests/my
// @access  Private
const getMyRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = { userId: req.user._id };
    if (status) query.status = status;

    const requests = await Request.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Request.countDocuments(query);

    res.json({
      success: true,
      data: {
        requests: requests.map(r => ({
          id: r._id,
          title: r.title,
          description: r.description,
          category: r.category,
          city: r.city,
          province: r.province,
          images: r.images,
          budget: r.budget,
          urgency: r.urgency,
          status: r.status,
          views: r.views,
          contacts: r.contacts,
          createdAt: r.createdAt,
          expiresAt: r.expiresAt
        })),
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

// @desc    Ottieni singola richiesta
// @route   GET /api/requests/:id
// @access  Public/Private
const getRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('userId', 'name photo whatsapp city province createdAt');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Richiesta non trovata'
      });
    }

    // Incrementa views se non è il proprietario
    if (!req.user || req.user._id.toString() !== request.userId._id.toString()) {
      await request.incrementViews();
    }

    res.json({
      success: true,
      data: {
        request: {
          id: request._id,
          title: request.title,
          description: request.description,
          category: request.category,
          city: request.city,
          province: request.province,
          images: request.images,
          budget: request.budget,
          urgency: request.urgency,
          status: request.status,
          views: request.views,
          contacts: request.contacts,
          user: request.userId,
          createdAt: request.createdAt,
          expiresAt: request.expiresAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Aggiorna richiesta
// @route   PUT /api/requests/:id
// @access  Private
const updateRequest = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: errors.array()
      });
    }

    let request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Richiesta non trovata'
      });
    }

    // Verifica proprietario
    if (request.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorizzato'
      });
    }

    const { title, description, images, budget, urgency, status } = req.body;

    // Aggiorna
    request = await Request.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        images,
        budget,
        urgency,
        status
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Richiesta aggiornata con successo',
      data: { request }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Elimina richiesta
// @route   DELETE /api/requests/:id
// @access  Private
const deleteRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Richiesta non trovata'
      });
    }

    // Verifica proprietario
    if (request.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorizzato'
      });
    }

    await Request.findByIdAndDelete(req.params.id);

    // Elimina notifiche associate
    await Notification.deleteMany({ requestId: req.params.id });

    res.json({
      success: true,
      message: 'Richiesta eliminata con successo'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Incrementa contatti
// @route   POST /api/requests/:id/contact
// @access  Private
const contactRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Richiesta non trovata'
      });
    }

    // Non permettere contatto a se stessi
    if (request.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Non puoi contattare la tua stessa richiesta'
      });
    }

    // Incrementa contatti
    await request.incrementContacts();

    // Trova proprietario
    const owner = await User.findById(request.userId);

    res.json({
      success: true,
      message: 'Contatto registrato',
      data: {
        whatsapp: owner.whatsapp,
        name: owner.name
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ottieni statistiche richieste
// @route   GET /api/requests/stats/overview
// @access  Private
const getStats = async (req, res, next) => {
  try {
    const userPreferences = req.user.preferences.map(p => p.id);

    const stats = await Promise.all([
      // Richieste disponibili per l'utente
      Request.countDocuments({
        status: 'active',
        expiresAt: { $gt: new Date() },
        userId: { $ne: req.user._id },
        $or: [
          { city: req.user.city },
          { province: req.user.province }
        ],
        'category.id': { $in: userPreferences }
      }),

      // Le mie richieste attive
      Request.countDocuments({
        userId: req.user._id,
        status: 'active'
      }),

      // Le mie richieste totali
      Request.countDocuments({
        userId: req.user._id
      }),

      // Richieste per categoria
      Request.aggregate([
        {
          $match: {
            status: 'active',
            expiresAt: { $gt: new Date() },
            userId: { $ne: req.user._id },
            $or: [
              { city: req.user.city },
              { province: req.user.province }
            ],
            'category.id': { $in: userPreferences }
          }
        },
        {
          $group: {
            _id: '$category.id',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        availableRequests: stats[0],
        myActiveRequests: stats[1],
        myTotalRequests: stats[2],
        byCategory: stats[3].reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getFeed,
  getMyRequests,
  getRequest,
  updateRequest,
  deleteRequest,
  contactRequest,
  getStats
};
