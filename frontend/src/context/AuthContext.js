import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const initialized = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
      })();
      if (storedUser) {
        setUser(storedUser);
      }
      if (storedToken) {
        try {
          const userData = await authService.verifyToken(storedToken);
          setUser(userData);
          setToken(storedToken);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (_error) {
          // Dev-friendly: keep existing stored user/token even if verify fails (e.g., backend restarted)
          setToken(storedToken);
        }
      }
      setLoading(false);
    };

    if (initialized.current) return;
    initialized.current = true;
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      console.log('Login response:', response);
      const newToken = response.access_token || response.token;
      const userData = response.user;
      
      console.log('Extracted token:', newToken);
      console.log('Extracted user:', userData);
      
      if (newToken) {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        console.log('Token stored in localStorage');
      }
      setUser(userData);
      try { localStorage.setItem('user', JSON.stringify(userData)); } catch {}
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      return { success: true, message: response.message };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const hasRole = (role) => {
    return user && user.role === role;
  };

  const canAccess = (requiredRoles) => {
    if (!user) return false;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    return user.role === requiredRoles;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    hasRole,
    canAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
