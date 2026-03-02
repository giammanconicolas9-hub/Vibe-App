const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createRequest,
  getFeed,
  getMyRequests,
  getRequest,
  updateRequest,
  deleteRequest,
  contactRequest,
  getStats
} = require('../controllers/requestController');
const { protect, optionalAuth } = require('../middleware/auth');

// Validazione creazione richiesta
const createValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Il titolo è obbligatorio')
    .isLength({ min: 5, max: 100 }).withMessage('Il titolo deve essere tra 5 e 100 caratteri'),
  body('description')
    .trim()
    .notEmpty().withMessage('La descrizione è obbligatoria')
    .isLength({ min: 10, max: 1000 }).withMessage('La descrizione deve essere tra 10 e 1000 caratteri'),
  body('category')
    .notEmpty().withMessage('La categoria è obbligatoria')
    .isObject().withMessage('La categoria deve essere un oggetto'),
  body('category.id')
    .notEmpty().withMessage('ID categoria obbligatorio'),
  body('category.name')
    .notEmpty().withMessage('Nome categoria obbligatorio'),
  body('expiresAt')
    .notEmpty().withMessage('La data di scadenza è obbligatoria')
    .isISO8601().withMessage('Data non valida'),
  body('urgency')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Urgenza non valida'),
  body('budget')
    .optional()
    .isInt({ min: 0 }).withMessage('Il budget deve essere un numero positivo'),
  body('images')
    .optional()
    .isArray({ max: 3 }).withMessage('Massimo 3 immagini')
];

// Validazione aggiornamento
const updateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 }),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 }),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'cancelled'])
];

// Routes
router.get('/feed', protect, getFeed);
router.get('/my', protect, getMyRequests);
router.get('/stats/overview', protect, getStats);
router.post('/', protect, createValidation, createRequest);
router.get('/:id', optionalAuth, getRequest);
router.put('/:id', protect, updateValidation, updateRequest);
router.delete('/:id', protect, deleteRequest);
router.post('/:id/contact', protect, contactRequest);

module.exports = router;
