const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware per verificare JWT
const protect = async (req, res, next) => {
  let token;

  // Verifica header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Estrai token
      token = req.headers.authorization.split(' ')[1];

      // Verifica token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Trova utente
      req.user = await User.findById(decoded.id).select('-__v');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utente non trovato'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account disattivato'
        });
      }

      next();
    } catch (error) {
      console.error('Errore auth middleware:', error);
      return res.status(401).json({
        success: false,
        message: 'Token non valido'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Accesso non autorizzato, token mancante'
    });
  }
};

// Middleware opzionale (non blocca se non c'è token)
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-__v');
    } catch (error) {
      // Non blocca, continua senza utente
      req.user = null;
    }
  }

  next();
};

// Genera JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

module.exports = {
  protect,
  optionalAuth,
  generateToken
};
