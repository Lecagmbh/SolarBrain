/**
 * LECA Network Context
 * Online/Offline state management
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { offlineQueue } from '../services/offlineQueue';
import theme from '../theme';

const NetworkContext = createContext(undefined);

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [queueLength, setQueueLength] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const bannerAnim = useState(new Animated.Value(-50))[0];

  useEffect(() => {
    initializeNetwork();
  }, []);

  const initializeNetwork = async () => {
    const online = await offlineQueue.initialize();
    setIsOnline(online);
    setQueueLength(offlineQueue.getQueueLength());

    // Listen for changes
    offlineQueue.addListener(handleQueueEvent);
  };

  const handleQueueEvent = (event) => {
    if (event.isOnline !== undefined) {
      setIsOnline(event.isOnline);
      
      // Show banner on state change
      if (!event.isOnline) {
        showOfflineBanner();
      } else {
        hideOfflineBanner();
      }
    }

    if (event.queueLength !== undefined) {
      setQueueLength(event.queueLength);
    }

    if (event.syncStarted) {
      setIsSyncing(true);
    }

    if (event.syncCompleted) {
      setIsSyncing(false);
    }
  };

  const showOfflineBanner = () => {
    setShowBanner(true);
    Animated.spring(bannerAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const hideOfflineBanner = () => {
    Animated.timing(bannerAnim, {
      toValue: -50,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowBanner(false));
  };

  const forceSync = useCallback(async () => {
    if (isOnline && queueLength > 0) {
      return offlineQueue.processQueue();
    }
    return null;
  }, [isOnline, queueLength]);

  const addToQueue = useCallback((operation) => {
    return offlineQueue.addToQueue(operation);
  }, []);

  const value = {
    isOnline,
    queueLength,
    isSyncing,
    forceSync,
    addToQueue,
    queueStatusUpdate: offlineQueue.queueStatusUpdate.bind(offlineQueue),
    queueComment: offlineQueue.queueComment.bind(offlineQueue),
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
      
      {/* Offline Banner */}
      {showBanner && (
        <Animated.View
          style={[
            styles.offlineBanner,
            { transform: [{ translateY: bannerAnim }] },
          ]}
        >
          <View style={styles.offlineBannerContent}>
            <Text style={styles.offlineBannerText}>
              {isOnline 
                ? `Wieder online ${queueLength > 0 ? `• ${queueLength} Aenderungen werden synchronisiert` : ''}`
                : `Offline • ${queueLength} Aenderungen warten`
              }
            </Text>
          </View>
        </Animated.View>
      )}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  offlineBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  offlineBannerContent: {
    backgroundColor: theme.colors.warning[500],
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    paddingTop: 50, // Account for status bar
  },
  offlineBannerText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default NetworkContext;
