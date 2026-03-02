import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authAPI } from '@/services/api';
import type { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (whatsapp: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Verifica autenticazione all'avvio
  useEffect(() => {
    const initAuth = async () => {
      const token = authAPI.getToken();
      const storedUser = authAPI.getStoredUser();

      if (token && storedUser) {
        try {
          // Verifica token valido
          const response = await authAPI.getCurrentUser();
          if (response.success) {
            setState({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Token non valido
            authAPI.logout();
            setState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          authAPI.logout();
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initAuth();
  }, []);

  const login = async (whatsapp: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await authAPI.login(whatsapp);
      
      if (response.success) {
        setState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await authAPI.register(userData);
      
      if (response.success) {
        setState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const logout = () => {
    authAPI.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    try {
      const response = await authAPI.updateProfile(updates);
      if (response.success) {
        setState(prev => ({
          ...prev,
          user: response.data.user,
        }));
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.success) {
        setState(prev => ({
          ...prev,
          user: response.data.user,
        }));
      }
    } catch (error) {
      console.error('Errore refresh user:', error);
    }
  };

  const checkAuth = () => {
    return authAPI.isAuthenticated();
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve essere usato dentro AuthProvider');
  }
  return context;
};
