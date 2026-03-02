import type { User, RequestAd, Notification } from '@/types';
import { CATEGORIES } from '@/types';

// Simulazione database locale
class LocalDatabase {
  private users: Map<string, User> = new Map();
  private requests: Map<string, RequestAd> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private currentUser: User | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const usersData = localStorage.getItem('lr_users');
      const requestsData = localStorage.getItem('lr_requests');
      const currentUserData = localStorage.getItem('lr_current_user');

      if (usersData) {
        const users = JSON.parse(usersData);
        this.users = new Map(Object.entries(users));
      }

      if (requestsData) {
        const requests = JSON.parse(requestsData);
        this.requests = new Map(Object.entries(requests));
      }

      if (currentUserData) {
        this.currentUser = JSON.parse(currentUserData);
      }
    } catch (e) {
      console.error('Errore caricamento database:', e);
    }
  }

  private saveToStorage() {
    try {
      const usersObj = Object.fromEntries(this.users);
      const requestsObj = Object.fromEntries(this.requests);
      localStorage.setItem('lr_users', JSON.stringify(usersObj));
      localStorage.setItem('lr_requests', JSON.stringify(requestsObj));
      if (this.currentUser) {
        localStorage.setItem('lr_current_user', JSON.stringify(this.currentUser));
      }
    } catch (e) {
      console.error('Errore salvataggio database:', e);
    }
  }

  // Utenti
  createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const user: User = {
      ...userData,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    this.currentUser = user;
    this.saveToStorage();
    return user;
  }

  updateUser(userId: string, updates: Partial<User>): User | null {
    const user = this.users.get(userId);
    if (!user) return null;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(userId, updatedUser);
    
    if (this.currentUser?.id === userId) {
      this.currentUser = updatedUser;
    }
    
    this.saveToStorage();
    return updatedUser;
  }

  getUser(userId: string): User | null {
    return this.users.get(userId) || null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  setCurrentUser(user: User | null) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('lr_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('lr_current_user');
    }
  }

  loginUser(whatsapp: string): User | null {
    for (const user of this.users.values()) {
      if (user.whatsapp === whatsapp) {
        this.currentUser = user;
        this.saveToStorage();
        return user;
      }
    }
    return null;
  }

  logoutUser() {
    this.currentUser = null;
    localStorage.removeItem('lr_current_user');
  }

  // Richieste/Annunci
  createRequest(requestData: Omit<RequestAd, 'id' | 'createdAt' | 'views' | 'contacts'>): RequestAd {
    const id = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const request: RequestAd = {
      ...requestData,
      id,
      views: 0,
      contacts: 0,
      createdAt: new Date(),
    };
    this.requests.set(id, request);
    this.saveToStorage();
    
    // Notifica utenti nella stessa zona con preferenze corrispondenti
    this.notifyMatchingUsers(request);
    
    return request;
  }

  updateRequest(requestId: string, updates: Partial<RequestAd>): RequestAd | null {
    const request = this.requests.get(requestId);
    if (!request) return null;
    
    const updatedRequest = { ...request, ...updates };
    this.requests.set(requestId, updatedRequest);
    this.saveToStorage();
    return updatedRequest;
  }

  getRequest(requestId: string): RequestAd | null {
    return this.requests.get(requestId) || null;
  }

  getRequestsByUser(userId: string): RequestAd[] {
    return Array.from(this.requests.values())
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getRequestsForUser(userId: string): RequestAd[] {
    const user = this.users.get(userId);
    if (!user) return [];

    return Array.from(this.requests.values())
      .filter(r => {
        // Stessa città o provincia
        const sameZone = r.city === user.city || r.province === user.province;
        // Categoria nelle preferenze dell'utente
        const categoryMatch = user.preferences.some(p => p.id === r.category.id);
        // Non è dell'utente stesso
        const notOwn = r.userId !== userId;
        // Attivo
        const isActive = r.status === 'active';
        // Non scaduto
        const notExpired = new Date(r.expiresAt) > new Date();
        
        return sameZone && categoryMatch && notOwn && isActive && notExpired;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAllActiveRequests(): RequestAd[] {
    return Array.from(this.requests.values())
      .filter(r => r.status === 'active' && new Date(r.expiresAt) > new Date())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  incrementViews(requestId: string) {
    const request = this.requests.get(requestId);
    if (request) {
      request.views++;
      this.requests.set(requestId, request);
      this.saveToStorage();
    }
  }

  incrementContacts(requestId: string) {
    const request = this.requests.get(requestId);
    if (request) {
      request.contacts++;
      this.requests.set(requestId, request);
      this.saveToStorage();
    }
  }

  // Notifiche
  private notifyMatchingUsers(request: RequestAd) {
    for (const user of this.users.values()) {
      if (user.id === request.userId) continue;
      
      const sameZone = user.city === request.city || user.province === request.province;
      const categoryMatch = user.preferences.some(p => p.id === request.category.id);
      
      if (sameZone && categoryMatch) {
        this.createNotification(user.id, request.id);
      }
    }
  }

  createNotification(userId: string, requestId: string): Notification {
    const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const notification: Notification = {
      id,
      userId,
      requestId,
      read: false,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);
    this.saveToStorage();
    return notification;
  }

  getNotifications(userId: string): Notification[] {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getUnreadCount(userId: string): number {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.read).length;
  }

  markNotificationAsRead(notificationId: string) {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.read = true;
      this.notifications.set(notificationId, notification);
      this.saveToStorage();
    }
  }

  markAllNotificationsAsRead(userId: string) {
    for (const notification of this.notifications.values()) {
      if (notification.userId === userId) {
        notification.read = true;
        this.notifications.set(notification.id, notification);
      }
    }
    this.saveToStorage();
  }

  // Dati di esempio
  seedDemoData() {
    if (this.users.size > 0) return;

    // Crea utenti demo
    const demoUsers: Omit<User, 'id' | 'createdAt'>[] = [
      {
        name: 'Marco Rossi',
        photo: 'https://i.pravatar.cc/150?u=marco',
        whatsapp: '393331234567',
        city: 'Roma',
        province: 'RM',
        preferences: [CATEGORIES[0], CATEGORIES[1], CATEGORIES[3]],
      },
      {
        name: 'Laura Bianchi',
        photo: 'https://i.pravatar.cc/150?u=laura',
        whatsapp: '393337654321',
        city: 'Milano',
        province: 'MI',
        preferences: [CATEGORIES[0], CATEGORIES[5], CATEGORIES[6]],
      },
      {
        name: 'Giuseppe Verdi',
        photo: 'https://i.pravatar.cc/150?u=giuseppe',
        whatsapp: '393339876543',
        city: 'Napoli',
        province: 'NA',
        preferences: [CATEGORIES[1], CATEGORIES[2], CATEGORIES[4]],
      },
    ];

    const createdUsers = demoUsers.map(u => this.createUser(u));

    // Crea richieste demo
    const demoRequests: Omit<RequestAd, 'id' | 'createdAt' | 'views' | 'contacts'>[] = [
      {
        userId: createdUsers[0].id,
        title: 'Cerco iPhone 14 Pro',
        description: 'Cerco iPhone 14 Pro in buone condizioni. Preferibilmente con garanzia ancora attiva. Colore nero o viola.',
        category: CATEGORIES[0],
        city: 'Roma',
        province: 'RM',
        images: [],
        budget: 700,
        urgency: 'medium',
        status: 'active',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        userId: createdUsers[1].id,
        title: 'Cerco divano 3 posti',
        description: 'Cerco divano moderno 3 posti in tessuto. Colore grigio o beige. Deve essere in ottime condizioni.',
        category: CATEGORIES[5],
        city: 'Milano',
        province: 'MI',
        images: [],
        budget: 500,
        urgency: 'low',
        status: 'active',
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        userId: createdUsers[2].id,
        title: 'Cerco Fiat Panda 2020',
        description: 'Cerco Fiat Panda anno 2020/2021 con pochi km. Preferibilmente benzina/metano. Colore indifferente.',
        category: CATEGORIES[1],
        city: 'Napoli',
        province: 'NA',
        images: [],
        budget: 12000,
        urgency: 'high',
        status: 'active',
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        userId: createdUsers[0].id,
        title: 'Cerco sviluppatore web',
        description: 'Cerco sviluppatore web per progetto e-commerce. Necessaria esperienza con React e Node.js.',
        category: CATEGORIES[3],
        city: 'Roma',
        province: 'RM',
        images: [],
        budget: 2000,
        urgency: 'high',
        status: 'active',
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    ];

    demoRequests.forEach(r => this.createRequest(r));

    // Logout per permettere registrazione nuovo utente
    this.logoutUser();
  }
}

export const db = new LocalDatabase();

// API Functions
export const api = {
  // Auth
  register: (userData: Omit<User, 'id' | 'createdAt'>) => {
    return db.createUser(userData);
  },

  login: (whatsapp: string) => {
    return db.loginUser(whatsapp);
  },

  logout: () => {
    db.logoutUser();
  },

  getCurrentUser: () => {
    return db.getCurrentUser();
  },

  updateUser: (userId: string, updates: Partial<User>) => {
    return db.updateUser(userId, updates);
  },

  // Requests
  createRequest: (requestData: Omit<RequestAd, 'id' | 'createdAt' | 'views' | 'contacts'>) => {
    return db.createRequest(requestData);
  },

  getMyRequests: (userId: string) => {
    return db.getRequestsByUser(userId);
  },

  getFeedRequests: (userId: string) => {
    return db.getRequestsForUser(userId);
  },

  getRequest: (requestId: string) => {
    return db.getRequest(requestId);
  },

  updateRequest: (requestId: string, updates: Partial<RequestAd>) => {
    return db.updateRequest(requestId, updates);
  },

  contactRequest: (requestId: string) => {
    db.incrementContacts(requestId);
    const request = db.getRequest(requestId);
    if (request?.user) {
      return request.user.whatsapp;
    }
    return null;
  },

  incrementContacts: (requestId: string) => {
    db.incrementContacts(requestId);
  },

  // Notifications
  getNotifications: (userId: string) => {
    return db.getNotifications(userId);
  },

  getUnreadCount: (userId: string) => {
    return db.getUnreadCount(userId);
  },

  markNotificationAsRead: (notificationId: string) => {
    db.markNotificationAsRead(notificationId);
  },

  markAllNotificationsAsRead: (userId: string) => {
    db.markAllNotificationsAsRead(userId);
  },

  // Demo
  seedDemoData: () => {
    db.seedDemoData();
  },
};

export default api;
