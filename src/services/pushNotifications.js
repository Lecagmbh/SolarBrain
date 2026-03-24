/**
 * LECA Push Notification Service
 * Expo Push Notifications mit Backend-Registration
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from '../api/client';

// Notification Handler Config
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  async initialize() {
    if (!Device.isDevice) {
      console.log('[Push] Must use physical device for push notifications');
      return null;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permission not granted');
      return null;
    }

    // Get Expo Push Token
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'leca-mobile-app', // EAS Project ID
      });
      this.expoPushToken = token.data;
      console.log('[Push] Token:', this.expoPushToken);

      // Register token with backend
      await this.registerTokenWithBackend(this.expoPushToken);

      // Android channel
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('[Push] Error getting token:', error);
      return null;
    }
  }

  async setupAndroidChannels() {
    await Notifications.setNotificationChannelAsync('status-updates', {
      name: 'Status Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#22C55E',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('documents', {
      name: 'Dokumente',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Erinnerungen',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  async registerTokenWithBackend(token) {
    try {
      await api.post('/me/push-token', {
        token,
        platform: Platform.OS,
        deviceName: Device.deviceName,
      });
      console.log('[Push] Token registered with backend');
    } catch (error) {
      console.warn('[Push] Failed to register token:', error);
    }
  }

  setupListeners(onNotification, onNotificationResponse) {
    // Notification received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[Push] Notification received:', notification);
        if (onNotification) onNotification(notification);
      }
    );

    // User tapped on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('[Push] Notification response:', response);
        if (onNotificationResponse) onNotificationResponse(response);
      }
    );
  }

  removeListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  async scheduleLocalNotification(title, body, data = {}, trigger = null) {
    return Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: trigger || null, // null = immediate
    });
  }

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getBadgeCount() {
    return Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count) {
    await Notifications.setBadgeCountAsync(count);
  }

  async clearBadge() {
    await Notifications.setBadgeCountAsync(0);
  }
}

export const pushService = new PushNotificationService();
export default pushService;
