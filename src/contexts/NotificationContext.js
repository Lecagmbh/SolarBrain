/**
 * LECA Notification Context
 * Global notification state and handling
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { pushService } from '../services/pushNotifications';
import { useNavigation } from '@react-navigation/native';

const NotificationContext = createContext(undefined);

export function NotificationProvider({ children }) {
  const navigation = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expoPushToken, setExpoPushToken] = useState(null);

  useEffect(() => {
    initializePush();
    
    // Clear badge on app foreground
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        pushService.clearBadge();
      }
    });

    return () => {
      subscription.remove();
      pushService.removeListeners();
    };
  }, []);

  const initializePush = async () => {
    const token = await pushService.initialize();
    if (token) {
      setExpoPushToken(token);
    }

    // Setup notification handlers
    pushService.setupListeners(
      handleNotificationReceived,
      handleNotificationResponse
    );
  };

  const handleNotificationReceived = (notification) => {
    console.log('[Notification] Received:', notification);
    
    const newNotification = {
      id: notification.request.identifier,
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: notification.request.content.data,
      receivedAt: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const handleNotificationResponse = (response) => {
    console.log('[Notification] Response:', response);
    
    const data = response.notification.request.content.data;
    
    // Navigate based on notification type
    if (data?.type === 'STATUS_CHANGE' && data?.installationId) {
      // Navigate to installation detail
      // navigation.current?.navigate('InstallationDetail', { id: data.installationId });
    } else if (data?.type === 'DOCUMENT_UPLOADED' && data?.installationId) {
      // Navigate to documents
      // navigation.current?.navigate('InstallationDetail', { id: data.installationId, tab: 'documents' });
    }
  };

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const sendLocalNotification = useCallback(async (title, body, data = {}) => {
    await pushService.scheduleLocalNotification(title, body, data);
  }, []);

  const value = {
    notifications,
    unreadCount,
    expoPushToken,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    sendLocalNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

export default NotificationContext;
