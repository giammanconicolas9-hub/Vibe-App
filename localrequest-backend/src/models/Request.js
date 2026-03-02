const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utente è obbligatorio']
  },
  title: {
    type: String,
    required: [true, 'Il titolo è obbligatorio'],
    trim: true,
    maxlength: [100, 'Il titolo non può superare i 100 caratteri']
  },
  description: {
    type: String,
    required: [true, 'La descrizione è obbligatoria'],
    trim: true,
    maxlength: [1000, 'La descrizione non può superare i 1000 caratteri']
  },
  category: {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    icon: String,
    color: String
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
  images: [{
    type: String
  }],
  budget: {
    type: Number,
    min: [0, 'Il budget non può essere negativo'],
    default: null
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'expired'],
    default: 'active'
  },
  views: {
    type: Number,
    default: 0
  },
  contacts: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true
  },
  notifiedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual per utente
requestSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Index per ricerche veloci
requestSchema.index({ city: 1, province: 1, status: 1 });
requestSchema.index({ 'category.id': 1 });
requestSchema.index({ status: 1, expiresAt: 1 });
requestSchema.index({ userId: 1 });
requestSchema.index({ createdAt: -1 });
requestSchema.index({ expiresAt: 1 });

// Pre-save middleware per validazione
requestSchema.pre('save', function(next) {
  // Assicurati che expiresAt sia nel futuro
  if (this.expiresAt <= new Date()) {
    this.status = 'expired';
  }
  next();
});

// Metodo per controllare se scaduto
requestSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Metodo per incrementare views
requestSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
};

// Metodo per incrementare contacts
requestSchema.methods.incrementContacts = async function() {
  this.contacts += 1;
  await this.save();
};

module.exports = mongoose.model('Request', requestSchema);
