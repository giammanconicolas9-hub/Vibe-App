const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Il nome è obbligatorio'],
    trim: true,
    maxlength: [50, 'Il nome non può superare i 50 caratteri']
  },
  whatsapp: {
    type: String,
    required: [true, 'Il numero WhatsApp è obbligatorio'],
    unique: true,
    trim: true,
    match: [/^\d{10,15}$/, 'Numero WhatsApp non valido']
  },
  photo: {
    type: String,
    default: null
  },
  city: {
    type: String,
    required: [true, 'La città è obbligatoria'],
    trim: true
  },
  province: {
    type: String,
    required: [true, 'La provincia è obbligatoria'],
    trim: true,
    uppercase: true,
    maxlength: 2
  },
  preferences: [{
    id: String,
    name: String,
    icon: String,
    color: String
  }],
  fcmToken: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  stats: {
    requestsCount: { type: Number, default: 0 },
    responsesCount: { type: Number, default: 0 },
    viewsReceived: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual per richieste dell'utente
userSchema.virtual('requests', {
  ref: 'Request',
  localField: '_id',
  foreignField: 'userId'
});

// Index per ricerche veloci
userSchema.index({ city: 1, province: 1 });
userSchema.index({ whatsapp: 1 });
userSchema.index({ 'preferences.id': 1 });
userSchema.index({ isActive: 1 });

// Pre-save middleware
userSchema.pre('save', function(next) {
  this.lastLogin = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
