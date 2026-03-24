/**
 * LECA Enterprise Mobile - Auth Context
 * Mit WhiteLabel Support
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi, getTokens, clearTokens } from '../api/client';
import { applyWhiteLabel, resetTheme } from '../theme';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { accessToken } = await getTokens();
      
      if (accessToken) {
        const userData = await authApi.getMe();
        setUser(userData);
        
        // Apply WhiteLabel config if present
        if (userData.whiteLabelConfig) {
          applyWhiteLabel(userData.whiteLabelConfig);
        }
      }
    } catch (err) {
      console.log('[Auth] Session check failed:', err.message);
      await clearTokens();
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);
    
    try {
      const response = await authApi.login(email, password);
      
      // Get full user data
      const userData = await authApi.getMe();
      setUser(userData);
      
      // Apply WhiteLabel if present
      if (userData.whiteLabelConfig) {
        applyWhiteLabel(userData.whiteLabelConfig);
      }
      
      // Save email for biometric login
      await SecureStore.setItemAsync('user_email', email);
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Login fehlgeschlagen');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.log('[Auth] Logout error:', err.message);
    } finally {
      setUser(null);
      resetTheme();
      await clearTokens();
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      
      if (userData.whiteLabelConfig) {
        applyWhiteLabel(userData.whiteLabelConfig);
      }
      
      return userData;
    } catch (err) {
      console.error('[Auth] Refresh user failed:', err);
      return null;
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await authApi.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    changePassword,
    // User helpers
    isAdmin: user?.role === 'ADMIN',
    isMitarbeiter: user?.role === 'MITARBEITER' || user?.role === 'ADMIN',
    isKunde: user?.role === 'KUNDE',
    isSubunternehmer: user?.role === 'SUBUNTERNEHMER',
    // WhiteLabel
    whiteLabelConfig: user?.whiteLabelConfig ? 
      (typeof user.whiteLabelConfig === 'string' ? JSON.parse(user.whiteLabelConfig) : user.whiteLabelConfig) 
      : null,
    companyName: user?.kunde?.firmenName || user?.kunde?.name || 'Baunity',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
