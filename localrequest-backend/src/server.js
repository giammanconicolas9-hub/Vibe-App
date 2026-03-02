require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { protect } = require('./middleware/auth');
const { Request, Notification } = require('./models');

// Inizializza app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Porta
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('public/uploads'));

// Connessione MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Opzioni deprecate rimosse in Mongoose 6+
    });
    console.log(`✅ MongoDB connesso: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Errore connessione MongoDB:', error.message);
    process.exit(1);
  }
};

// Routes
app.use('/api', routes);

// Socket.io
io.on('connection', (socket) => {
  console.log('🔌 Client connesso:', socket.id);

  // Autenticazione socket
  socket.on('authenticate', (token) => {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.join(`user:${decoded.id}`);
      console.log(`✅ Utente ${decoded.id} autenticato su socket`);
    } catch (error) {
      console.log('❌ Autenticazione socket fallita');
    }
  });

  // Unisciti alla room della città
  socket.on('join-city', (city) => {
    if (city) {
      socket.join(`city:${city}`);
      console.log(`📍 Socket ${socket.id} unito alla città: ${city}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnesso:', socket.id);
  });
});

// Esporta io per usarlo nei controller
app.set('io', io);

// Error handler
app.use(errorHandler);

// Cron job: scadenza richieste
cron.schedule('0 */6 * * *', async () => {
  console.log('🕐 Controllo richieste scadute...');
  try {
    const result = await Request.updateMany(
      {
        status: 'active',
        expiresAt: { $lt: new Date() }
      },
      { status: 'expired' }
    );
    console.log(`✅ ${result.modifiedCount} richieste scadute aggiornate`);
  } catch (error) {
    console.error('❌ Errore aggiornamento richieste scadute:', error);
  }
});

// Cron job: pulizia notifiche vecchie (più di 30 giorni)
cron.schedule('0 0 * * 0', async () => {
  console.log('🧹 Pulizia notifiche vecchie...');
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await Notification.deleteMany({
      read: true,
      createdAt: { $lt: thirtyDaysAgo }
    });
    console.log(`✅ ${result.deletedCount} notifiche vecchie eliminate`);
  } catch (error) {
    console.error('❌ Errore pulizia notifiche:', error);
  }
});

// Avvio server
const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log('');
    console.log('🚀 ===========================================');
    console.log('🚀 LocalRequest Backend avviato!');
    console.log('🚀 ===========================================');
    console.log(`🌐 Porta: ${PORT}`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API URL: http://localhost:${PORT}/api`);
    console.log(`💓 Health Check: http://localhost:${PORT}/api/health`);
    console.log('🚀 ===========================================');
    console.log('');
  });
};

// Gestione errori non catturati
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  server.close(() => process.exit(1));
});

startServer();

module.exports = { app, server, io };
