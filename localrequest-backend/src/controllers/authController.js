const { User } = require('../models');
const { generateToken } = require('../middleware/auth');
const { validationResult } = require('express-validator');

// @desc    Registra nuovo utente
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    // Validazione input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: errors.array()
      });
    }

    const { name, whatsapp, photo, city, province, preferences } = req.body;

    // Verifica se utente esiste già
    const userExists = await User.findOne({ whatsapp });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Numero WhatsApp già registrato'
      });
    }

    // Crea utente
    const user = await User.create({
      name,
      whatsapp,
      photo,
      city,
      province: province.toUpperCase(),
      preferences: preferences || []
    });

    // Genera token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Utente registrato con successo',
      data: {
        user: {
          id: user._id,
          name: user.name,
          whatsapp: user.whatsapp,
          photo: user.photo,
          city: user.city,
          province: user.province,
          preferences: user.preferences,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login utente
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: errors.array()
      });
    }

    const { whatsapp } = req.body;

    // Trova utente
    const user = await User.findOne({ whatsapp });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account disattivato'
      });
    }

    // Aggiorna last login
    user.lastLogin = Date.now();
    await user.save();

    // Genera token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login effettuato con successo',
      data: {
        user: {
          id: user._id,
          name: user.name,
          whatsapp: user.whatsapp,
          photo: user.photo,
          city: user.city,
          province: user.province,
          preferences: user.preferences,
          stats: user.stats,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ottieni profilo utente
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          whatsapp: user.whatsapp,
          photo: user.photo,
          city: user.city,
          province: user.province,
          preferences: user.preferences,
          stats: user.stats,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Aggiorna profilo utente
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: errors.array()
      });
    }

    const { name, photo, preferences, fcmToken } = req.body;

    // Costruisci oggetto aggiornamento
    const updateData = {};
    if (name) updateData.name = name;
    if (photo !== undefined) updateData.photo = photo;
    if (preferences) updateData.preferences = preferences;
    if (fcmToken) updateData.fcmToken = fcmToken;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profilo aggiornato con successo',
      data: {
        user: {
          id: user._id,
          name: user.name,
          whatsapp: user.whatsapp,
          photo: user.photo,
          city: user.city,
          province: user.province,
          preferences: user.preferences,
          stats: user.stats,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Elimina account
// @route   DELETE /api/auth/me
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    // Disattiva account invece di eliminare (soft delete)
    await User.findByIdAndUpdate(req.user._id, { isActive: false });

    res.json({
      success: true,
      message: 'Account eliminato con successo'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verifica se numero WhatsApp esiste
// @route   POST /api/auth/check-whatsapp
// @access  Public
const checkWhatsapp = async (req, res, next) => {
  try {
    const { whatsapp } = req.body;

    const user = await User.findOne({ whatsapp });

    res.json({
      success: true,
      data: {
        exists: !!user
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  deleteAccount,
  checkWhatsapp
};
