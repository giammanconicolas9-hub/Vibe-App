require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'localrequest-secret-key-2024';

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Assicurati che la cartella data esista
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database SQLite
const db = new sqlite3.Database(path.join(dataDir, 'localrequest.db'));

// Inizializza database
db.serialize(() => {
  // Tabella utenti
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    whatsapp TEXT UNIQUE NOT NULL,
    photo TEXT,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    preferences TEXT,
    fcm_token TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabella richieste
  db.run(`CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id TEXT NOT NULL,
    category_name TEXT NOT NULL,
    category_icon TEXT,
    category_color TEXT,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    images TEXT,
    budget INTEGER,
    urgency TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'active',
    views INTEGER DEFAULT 0,
    contacts INTEGER DEFAULT 0,
    notified_users TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // Tabella notifiche
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    request_id TEXT NOT NULL,
    type TEXT DEFAULT 'new_request',
    read INTEGER DEFAULT 0,
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (request_id) REFERENCES requests(id)
  )`);

  console.log('✅ Database inizializzato');
});

// Helper functions
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token mancante' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Token non valido' });
  }

  req.userId = decoded.id;
  next();
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'LocalRequest API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// AUTH ROUTES

// Registrazione
app.post('/api/auth/register', (req, res) => {
  const { name, whatsapp, photo, city, province, preferences } = req.body;

  if (!name || !whatsapp || !city || !province) {
    return res.status(400).json({
      success: false,
      message: 'Dati mancanti'
    });
  }

  const id = uuidv4();
  const prefsJson = JSON.stringify(preferences || []);

  db.run(
    `INSERT INTO users (id, name, whatsapp, photo, city, province, preferences) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, name, whatsapp, photo || null, city, province.toUpperCase(), prefsJson],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({
            success: false,
            message: 'Numero WhatsApp già registrato'
          });
        }
        return res.status(500).json({
          success: false,
          message: 'Errore registrazione'
        });
      }

      const token = generateToken(id);
      
      res.status(201).json({
        success: true,
        message: 'Utente registrato',
        data: {
          user: {
            id,
            name,
            whatsapp,
            photo,
            city,
            province: province.toUpperCase(),
            preferences: preferences || [],
            createdAt: new Date().toISOString()
          },
          token
        }
      });
    }
  );
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { whatsapp } = req.body;

  if (!whatsapp) {
    return res.status(400).json({
      success: false,
      message: 'WhatsApp richiesto'
    });
  }

  db.get(
    `SELECT * FROM users WHERE whatsapp = ? AND is_active = 1`,
    [whatsapp],
    (err, user) => {
      if (err || !user) {
        return res.status(401).json({
          success: false,
          message: 'Utente non trovato'
        });
      }

      // Aggiorna last_login
      db.run(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`, [user.id]);

      const token = generateToken(user.id);

      res.json({
        success: true,
        message: 'Login effettuato',
        data: {
          user: {
            id: user.id,
            name: user.name,
            whatsapp: user.whatsapp,
            photo: user.photo,
            city: user.city,
            province: user.province,
            preferences: JSON.parse(user.preferences || '[]'),
            createdAt: user.created_at
          },
          token
        }
      });
    }
  );
});

// Get current user
app.get('/api/auth/me', authMiddleware, (req, res) => {
  db.get(
    `SELECT * FROM users WHERE id = ?`,
    [req.userId],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({
          success: false,
          message: 'Utente non trovato'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            whatsapp: user.whatsapp,
            photo: user.photo,
            city: user.city,
            province: user.province,
            preferences: JSON.parse(user.preferences || '[]'),
            createdAt: user.created_at
          }
        }
      });
    }
  );
});

// Update profile
app.put('/api/auth/me', authMiddleware, (req, res) => {
  const { name, photo, preferences, fcmToken } = req.body;
  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (photo !== undefined) {
    updates.push('photo = ?');
    values.push(photo);
  }
  if (preferences !== undefined) {
    updates.push('preferences = ?');
    values.push(JSON.stringify(preferences));
  }
  if (fcmToken !== undefined) {
    updates.push('fcm_token = ?');
    values.push(fcmToken);
  }

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Nessun dato da aggiornare'
    });
  }

  values.push(req.userId);

  db.run(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Errore aggiornamento'
        });
      }

      // Ritorna utente aggiornato
      db.get(`SELECT * FROM users WHERE id = ?`, [req.userId], (err, user) => {
        res.json({
          success: true,
          message: 'Profilo aggiornato',
          data: {
            user: {
              id: user.id,
              name: user.name,
              whatsapp: user.whatsapp,
              photo: user.photo,
              city: user.city,
              province: user.province,
              preferences: JSON.parse(user.preferences || '[]'),
              createdAt: user.created_at
            }
          }
        });
      });
    }
  );
});

// REQUEST ROUTES

// Create request
app.post('/api/requests', authMiddleware, (req, res) => {
  const { title, description, category, images, budget, urgency, expiresAt } = req.body;

  if (!title || !description || !category || !expiresAt) {
    return res.status(400).json({
      success: false,
      message: 'Dati mancanti'
    });
  }

  // Get user info
  db.get(`SELECT * FROM users WHERE id = ?`, [req.userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    const requestId = uuidv4();
    const imagesJson = JSON.stringify(images || []);

    db.run(
      `INSERT INTO requests (id, user_id, title, description, category_id, category_name, 
       category_icon, category_color, city, province, images, budget, urgency, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requestId,
        req.userId,
        title,
        description,
        category.id,
        category.name,
        category.icon,
        category.color,
        user.city,
        user.province,
        imagesJson,
        budget || null,
        urgency || 'medium',
        expiresAt
      ],
      function(err) {
        if (err) {
          console.error('Errore creazione richiesta:', err);
          return res.status(500).json({
            success: false,
            message: 'Errore creazione richiesta'
          });
        }

        // Trova utenti da notificare
        const userPrefs = JSON.parse(user.preferences || '[]');
        const categoryIds = userPrefs.map(p => p.id);

        db.all(
          `SELECT id FROM users 
           WHERE id != ? AND is_active = 1 
           AND (city = ? OR province = ?)
           AND preferences LIKE ?`,
          [req.userId, user.city, user.province, `%${category.id}%`],
          (err, usersToNotify) => {
            if (!err && usersToNotify.length > 0) {
              const notifiedIds = [];
              
              usersToNotify.forEach(u => {
                const notifId = uuidv4();
                notifiedIds.push(u.id);
                
                db.run(
                  `INSERT INTO notifications (id, user_id, request_id, type) VALUES (?, ?, ?, ?)`,
                  [notifId, u.id, requestId, 'new_request']
                );
              });

              // Aggiorna notified_users
              db.run(
                `UPDATE requests SET notified_users = ? WHERE id = ?`,
                [JSON.stringify(notifiedIds), requestId]
              );
            }

            res.status(201).json({
              success: true,
              message: 'Richiesta creata',
              data: {
                request: {
                  id: requestId,
                  title,
                  description,
                  category,
                  city: user.city,
                  province: user.province,
                  images: images || [],
                  budget,
                  urgency: urgency || 'medium',
                  status: 'active',
                  views: 0,
                  contacts: 0,
                  user: {
                    id: user.id,
                    name: user.name,
                    photo: user.photo,
                    whatsapp: user.whatsapp
                  },
                  createdAt: new Date().toISOString(),
                  expiresAt,
                  notifiedCount: usersToNotify ? usersToNotify.length : 0
                }
              }
            });
          }
        );
      }
    );
  });
});

// Get feed
app.get('/api/requests/feed', authMiddleware, (req, res) => {
  const { page = 1, limit = 20, category } = req.query;
  const offset = (page - 1) * limit;

  db.get(`SELECT * FROM users WHERE id = ?`, [req.userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    const userPrefs = JSON.parse(user.preferences || '[]');
    const prefIds = userPrefs.map(p => p.id);

    let sql = `
      SELECT r.*, u.name as user_name, u.photo as user_photo, u.whatsapp as user_whatsapp
      FROM requests r
      JOIN users u ON r.user_id = u.id
      WHERE r.status = 'active'
      AND datetime(r.expires_at) > datetime('now')
      AND r.user_id != ?
      AND (r.city = ? OR r.province = ?)
    `;
    
    const params = [req.userId, user.city, user.province];

    if (category) {
      sql += ` AND r.category_id = ?`;
      params.push(category);
    } else if (prefIds.length > 0) {
      sql += ` AND r.category_id IN (${prefIds.map(() => '?').join(',')})`;
      params.push(...prefIds);
    }

    sql += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, requests) => {
      if (err) {
        console.error('Errore feed:', err);
        return res.status(500).json({
          success: false,
          message: 'Errore caricamento feed'
        });
      }

      const formattedRequests = requests.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: {
          id: r.category_id,
          name: r.category_name,
          icon: r.category_icon,
          color: r.category_color
        },
        city: r.city,
        province: r.province,
        images: JSON.parse(r.images || '[]'),
        budget: r.budget,
        urgency: r.urgency,
        status: r.status,
        views: r.views,
        contacts: r.contacts,
        user: {
          id: r.user_id,
          name: r.user_name,
          photo: r.user_photo,
          whatsapp: r.user_whatsapp
        },
        createdAt: r.created_at,
        expiresAt: r.expires_at
      }));

      res.json({
        success: true,
        data: {
          requests: formattedRequests,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: formattedRequests.length,
            pages: Math.ceil(formattedRequests.length / limit)
          }
        }
      });
    });
  });
});

// Get my requests
app.get('/api/requests/my', authMiddleware, (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT r.*, u.name as user_name, u.photo as user_photo
    FROM requests r
    JOIN users u ON r.user_id = u.id
    WHERE r.user_id = ?
  `;
  const params = [req.userId];

  if (status) {
    sql += ` AND r.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, requests) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Errore caricamento richieste'
      });
    }

    const formattedRequests = requests.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: {
        id: r.category_id,
        name: r.category_name,
        icon: r.category_icon,
        color: r.category_color
      },
      city: r.city,
      province: r.province,
      images: JSON.parse(r.images || '[]'),
      budget: r.budget,
      urgency: r.urgency,
      status: r.status,
      views: r.views,
      contacts: r.contacts,
      createdAt: r.created_at,
      expiresAt: r.expires_at
    }));

    res.json({
      success: true,
      data: {
        requests: formattedRequests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: formattedRequests.length,
          pages: Math.ceil(formattedRequests.length / limit)
        }
      }
    });
  });
});

// Get single request
app.get('/api/requests/:id', (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT r.*, u.name as user_name, u.photo as user_photo, u.whatsapp as user_whatsapp,
     u.city as user_city, u.province as user_province, u.created_at as user_created_at
     FROM requests r
     JOIN users u ON r.user_id = u.id
     WHERE r.id = ?`,
    [id],
    (err, request) => {
      if (err || !request) {
        return res.status(404).json({
          success: false,
          message: 'Richiesta non trovata'
        });
      }

      // Incrementa views
      db.run(`UPDATE requests SET views = views + 1 WHERE id = ?`, [id]);

      res.json({
        success: true,
        data: {
          request: {
            id: request.id,
            title: request.title,
            description: request.description,
            category: {
              id: request.category_id,
              name: request.category_name,
              icon: request.category_icon,
              color: request.category_color
            },
            city: request.city,
            province: request.province,
            images: JSON.parse(request.images || '[]'),
            budget: request.budget,
            urgency: request.urgency,
            status: request.status,
            views: request.views + 1,
            contacts: request.contacts,
            user: {
              id: request.user_id,
              name: request.user_name,
              photo: request.user_photo,
              whatsapp: request.user_whatsapp,
              city: request.user_city,
              province: request.user_province,
              createdAt: request.user_created_at
            },
            createdAt: request.created_at,
            expiresAt: request.expires_at
          }
        }
      });
    }
  );
});

// Contact request
app.post('/api/requests/:id/contact', authMiddleware, (req, res) => {
  const { id } = req.params;

  db.get(`SELECT * FROM requests WHERE id = ?`, [id], (err, request) => {
    if (err || !request) {
      return res.status(404).json({
        success: false,
        message: 'Richiesta non trovata'
      });
    }

    if (request.user_id === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'Non puoi contattare la tua stessa richiesta'
      });
    }

    // Incrementa contatti
    db.run(`UPDATE requests SET contacts = contacts + 1 WHERE id = ?`, [id]);

    // Get owner info
    db.get(`SELECT name, whatsapp FROM users WHERE id = ?`, [request.user_id], (err, owner) => {
      res.json({
        success: true,
        message: 'Contatto registrato',
        data: {
          whatsapp: owner.whatsapp,
          name: owner.name
        }
      });
    });
  });
});

// Get stats
app.get('/api/requests/stats/overview', authMiddleware, (req, res) => {
  db.get(`SELECT * FROM users WHERE id = ?`, [req.userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    const userPrefs = JSON.parse(user.preferences || '[]');
    const prefIds = userPrefs.map(p => p.id);

    // Conta richieste disponibili
    let availableSql = `
      SELECT COUNT(*) as count FROM requests
      WHERE status = 'active'
      AND datetime(expires_at) > datetime('now')
      AND user_id != ?
      AND (city = ? OR province = ?)
    `;
    const availableParams = [req.userId, user.city, user.province];

    if (prefIds.length > 0) {
      availableSql += ` AND category_id IN (${prefIds.map(() => '?').join(',')})`;
      availableParams.push(...prefIds);
    }

    db.get(availableSql, availableParams, (err, available) => {
      db.get(
        `SELECT COUNT(*) as count FROM requests WHERE user_id = ? AND status = 'active'`,
        [req.userId],
        (err, active) => {
          db.get(
            `SELECT COUNT(*) as count FROM requests WHERE user_id = ?`,
            [req.userId],
            (err, total) => {
              res.json({
                success: true,
                data: {
                  availableRequests: available ? available.count : 0,
                  myActiveRequests: active ? active.count : 0,
                  myTotalRequests: total ? total.count : 0,
                  byCategory: {}
                }
              });
            }
          );
        }
      );
    });
  });
});

// NOTIFICATION ROUTES

// Get notifications
app.get('/api/notifications', authMiddleware, (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT n.*, r.title, r.description, r.category_id, r.category_name, 
    r.category_icon, r.category_color, r.city, r.province, r.budget, 
    r.urgency, r.status, r.user_id as request_user_id,
    u.name as request_user_name, u.photo as request_user_photo, u.whatsapp as request_user_whatsapp
    FROM notifications n
    JOIN requests r ON n.request_id = r.id
    JOIN users u ON r.user_id = u.id
    WHERE n.user_id = ?
  `;
  const params = [req.userId];

  if (unreadOnly === 'true') {
    sql += ` AND n.read = 0`;
  }

  sql += ` ORDER BY n.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, notifications) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Errore caricamento notifiche'
      });
    }

    // Conta non lette
    db.get(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0`,
      [req.userId],
      (err, unread) => {
        const formattedNotifications = notifications.map(n => ({
          id: n.id,
          type: n.type,
          read: n.read === 1,
          readAt: n.read_at,
          createdAt: n.created_at,
          request: {
            id: n.request_id,
            title: n.title,
            description: n.description,
            category: {
              id: n.category_id,
              name: n.category_name,
              icon: n.category_icon,
              color: n.category_color
            },
            city: n.city,
            province: n.province,
            budget: n.budget,
            urgency: n.urgency,
            status: n.status,
            user: {
              id: n.request_user_id,
              name: n.request_user_name,
              photo: n.request_user_photo,
              whatsapp: n.request_user_whatsapp
            }
          }
        }));

        res.json({
          success: true,
          data: {
            notifications: formattedNotifications,
            unreadCount: unread ? unread.count : 0,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: formattedNotifications.length,
              pages: Math.ceil(formattedNotifications.length / limit)
            }
          }
        });
      }
    );
  });
});

// Get unread count
app.get('/api/notifications/count', authMiddleware, (req, res) => {
  db.get(
    `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0`,
    [req.userId],
    (err, result) => {
      res.json({
        success: true,
        data: { unreadCount: result ? result.count : 0 }
      });
    }
  );
});

// Mark as read
app.put('/api/notifications/:id/read', authMiddleware, (req, res) => {
  const { id } = req.params;

  db.run(
    `UPDATE notifications SET read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
    [id, req.userId],
    function(err) {
      if (err || this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notifica non trovata'
        });
      }

      db.get(
        `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0`,
        [req.userId],
        (err, result) => {
          res.json({
            success: true,
            message: 'Notifica segnata come letta',
            data: { unreadCount: result ? result.count : 0 }
          });
        }
      );
    }
  );
});

// Mark all as read
app.put('/api/notifications/read-all', authMiddleware, (req, res) => {
  db.run(
    `UPDATE notifications SET read = 1, read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read = 0`,
    [req.userId],
    function(err) {
      res.json({
        success: true,
        message: 'Tutte le notifiche segnate come lette',
        data: { unreadCount: 0 }
      });
    }
  );
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Errore:', err);
  res.status(500).json({
    success: false,
    message: 'Errore del server'
  });
});

// Avvio server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ===========================================');
  console.log('🚀 LocalRequest Backend (SQLite) avviato!');
  console.log('🚀 ===========================================');
  console.log(`🌐 Porta: ${PORT}`);
  console.log(`💾 Database: ${path.join(dataDir, 'localrequest.db')}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`💓 Health Check: http://localhost:${PORT}/api/health`);
  console.log('🚀 ===========================================');
  console.log('');
});
