import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { notificationsAPI, requestsAPI } from '@/services/api';
import { useAuth } from './AuthContext';
import type { Notification, RequestAd } from '@/types';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  refreshNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  getRequestDetails: (requestId: string) => Promise<RequestAd | null>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await notificationsAPI.getNotifications({
        page: pageNum,
        limit: 20
      });

      if (response.success) {
        const newNotifications = response.data.notifications;
        
        if (append) {
          setNotifications(prev => [...prev, ...newNotifications]);
        } else {
          setNotifications(newNotifications);
        }
        
        setUnreadCount(response.data.unreadCount);
        setHasMore(
          response.data.pagination.page < response.data.pagination.pages
        );
      }
    } catch (error) {
      console.error('Errore fetch notifiche:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const refreshNotifications = useCallback(async () => {
    setPage(1);
    await fetchNotifications(1, false);
  }, [fetchNotifications]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    await fetchNotifications(nextPage, true);
    setPage(nextPage);
  }, [hasMore, loading, page, fetchNotifications]);

  // Carica notifiche all'avvio e quando cambia autenticazione
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(1, false);
      
      // Polling ogni 30 secondi per nuove notifiche
      const interval = setInterval(() => {
        fetchNotifications(1, false);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await notificationsAPI.markAsRead(notificationId);
      if (response.success) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, read: true, readAt: new Date() } : n
          )
        );
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Errore mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await notificationsAPI.markAllAsRead();
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true, readAt: new Date() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Errore mark all as read:', error);
    }
  };

  const getRequestDetails = async (requestId: string): Promise<RequestAd | null> => {
    try {
      const response = await requestsAPI.getRequest(requestId);
      if (response.success) {
        return response.data.request;
      }
      return null;
    } catch (error) {
      console.error('Errore get request details:', error);
      return null;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        hasMore,
        refreshNotifications,
        loadMore,
        markAsRead,
        markAllAsRead,
        getRequestDetails,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications deve essere usato dentro NotificationProvider');
  }
  return context;
};
