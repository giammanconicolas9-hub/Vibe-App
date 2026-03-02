const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateProfile,
  deleteAccount,
  checkWhatsapp
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Validazione registrazione
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Il nome è obbligatorio')
    .isLength({ max: 50 }).withMessage('Il nome non può superare i 50 caratteri'),
  body('whatsapp')
    .trim()
    .notEmpty().withMessage('Il numero WhatsApp è obbligatorio')
    .matches(/^\d{10,15}$/).withMessage('Numero WhatsApp non valido'),
  body('city')
    .trim()
    .notEmpty().withMessage('La città è obbligatoria'),
  body('province')
    .trim()
    .notEmpty().withMessage('La provincia è obbligatoria')
    .isLength({ max: 2 }).withMessage('La provincia deve essere di 2 caratteri')
];

// Validazione login
const loginValidation = [
  body('whatsapp')
    .trim()
    .notEmpty().withMessage('Il numero WhatsApp è obbligatorio')
    .matches(/^\d{10,15}$/).withMessage('Numero WhatsApp non valido')
];

// Validazione aggiornamento profilo
const updateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Il nome non può superare i 50 caratteri'),
  body('preferences')
    .optional()
    .isArray({ max: 5 }).withMessage('Massimo 5 preferenze')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/check-whatsapp', loginValidation, checkWhatsapp);
router.get('/me', protect, getMe);
router.put('/me', protect, updateValidation, updateProfile);
router.delete('/me', protect, deleteAccount);

module.exports = router;
