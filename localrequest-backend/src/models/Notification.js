const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utente è obbligatorio'],
    index: true
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: [true, 'La richiesta è obbligatoria']
  },
  type: {
    type: String,
    enum: ['new_request', 'request_viewed', 'request_contacted', 'request_expired'],
    default: 'new_request'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index per ricerche veloci
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

// Metodo per segnare come letta
notificationSchema.methods.markAsRead = async function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    await this.save();
  }
};

// Static method per contare non lette
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ userId, read: false });
};

// Static method per segnare tutte come lette
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { userId, read: false },
    { read: true, readAt: new Date() }
  );
};

module.exports = mongoose.model('Notification', notificationSchema);
