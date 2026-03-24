/**
 * LECA Enterprise Mobile - Navigation
 * Komplette Navigation mit allen Screens
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import theme from '../theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import InstallationsScreen from '../screens/InstallationsScreen';
import InstallationDetailScreen from '../screens/InstallationDetailScreen';
import WizardScreen from '../screens/WizardScreen';
import ScannerScreen from '../screens/ScannerScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Loading Screen
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={theme.primary} />
  </View>
);

// Tab Navigator (Main App)
const TabNavigator = () => {
  const { whiteLabelConfig } = useAuth();
  const brandColor = whiteLabelConfig?.primaryColor || theme.primary;
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: brandColor,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'Anlagen':
              iconName = focused ? 'layers' : 'layers-outline';
              break;
            case 'Dokumente':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Mehr':
              iconName = focused ? 'menu' : 'menu-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }
          
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ tabBarLabel: 'Start' }}
      />
      <Tab.Screen 
        name="Anlagen" 
        component={InstallationsStackNavigator}
        options={{ tabBarLabel: 'Anlagen' }}
      />
      <Tab.Screen 
        name="Dokumente" 
        component={DocumentsScreen}
        options={{ tabBarLabel: 'Dokumente' }}
      />
      <Tab.Screen 
        name="Mehr" 
        component={SettingsScreen}
        options={{ tabBarLabel: 'Mehr' }}
      />
    </Tab.Navigator>
  );
};

// Installations Stack (for nested navigation)
const InstallationsStack = createNativeStackNavigator();

const InstallationsStackNavigator = () => (
  <InstallationsStack.Navigator screenOptions={{ headerShown: false }}>
    <InstallationsStack.Screen name="InstallationsList" component={InstallationsScreen} />
    <InstallationsStack.Screen name="InstallationDetail" component={InstallationDetailScreen} />
  </InstallationsStack.Navigator>
);

// Main Stack Navigator
const MainStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Main" component={TabNavigator} />
    <Stack.Screen 
      name="Wizard" 
      component={WizardScreen}
      options={{ presentation: 'modal' }}
    />
    <Stack.Screen 
      name="Scanner" 
      component={ScannerScreen}
      options={{ presentation: 'fullScreenModal' }}
    />
    <Stack.Screen 
      name="InstallationDetail" 
      component={InstallationDetailScreen}
      options={{ presentation: 'card' }}
    />
  </Stack.Navigator>
);

// Auth Stack
const AuthStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

// Root Navigator
export default function Navigation() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStackNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  tabBar: {
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    height: 85,
    paddingTop: 8,
    paddingBottom: 28,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
});
