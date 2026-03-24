/**
 * LECA Enterprise Mobile - Login Screen
 * Premium Design mit Biometric Support
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform,
  TouchableOpacity, Animated, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Input, Button, Loading } from '../components/ui';
import theme from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
  const { login, loading, error, whiteLabelConfig } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [savedEmail, setSavedEmail] = useState(null);
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    
    // Check biometric availability
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const email = await SecureStore.getItemAsync('user_email');
      const biometricEnabled = await SecureStore.getItemAsync('biometric_enabled');
      
      if (compatible && enrolled && email && biometricEnabled === 'true') {
        setBiometricAvailable(true);
        setSavedEmail(email);
      }
    } catch (err) {
      console.log('[Login] Biometric check failed:', err);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Mit Biometrie anmelden',
        fallbackLabel: 'Passwort verwenden',
      });

      if (result.success) {
        // Get saved credentials
        const savedPassword = await SecureStore.getItemAsync('user_password');
        if (savedEmail && savedPassword) {
          const loginResult = await login(savedEmail, savedPassword);
          if (!loginResult.success) {
            setFormError(loginResult.error);
          }
        }
      }
    } catch (err) {
      console.log('[Login] Biometric auth failed:', err);
    }
  };

  const handleLogin = async () => {
    setFormError(null);
    
    if (!email.trim()) {
      setFormError('E-Mail erforderlich');
      return;
    }
    if (!password) {
      setFormError('Passwort erforderlich');
      return;
    }

    const result = await login(email.trim().toLowerCase(), password);
    
    if (!result.success) {
      setFormError(result.error || 'Login fehlgeschlagen');
    } else {
      // Save password for biometric login (optional - could be security concern)
      // await SecureStore.setItemAsync('user_password', password);
    }
  };

  // WhiteLabel branding
  const brandColor = whiteLabelConfig?.primaryColor || theme.primary;
  const brandName = whiteLabelConfig?.companyName || 'Baunity';
  const brandLogo = whiteLabelConfig?.logoUrl;

  return (
    <LinearGradient
      colors={['#09090B', '#18181B', '#09090B']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Animated.View 
            style={[
              styles.content,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            {/* Logo & Branding */}
            <View style={styles.brandingContainer}>
              <View style={[styles.logoContainer, { borderColor: brandColor }]}>
                {brandLogo ? (
                  <Image source={{ uri: brandLogo }} style={styles.logo} resizeMode="contain" />
                ) : (
                  <Ionicons name="flash" size={48} color={brandColor} />
                )}
              </View>
              <Text style={styles.brandName}>{brandName}</Text>
              <Text style={styles.brandSubtitle}>Netzanmeldung Portal</Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <Text style={styles.welcomeText}>Willkommen zurück</Text>
              <Text style={styles.subtitleText}>Melden Sie sich an, um fortzufahren</Text>

              <Input
                label="E-Mail"
                value={email}
                onChangeText={setEmail}
                placeholder="ihre@email.de"
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail-outline"
              />

              <Input
                label="Passwort"
                value={password}
                onChangeText={setPassword}
                placeholder="Ihr Passwort"
                secureTextEntry
                icon="lock-closed-outline"
              />

              {(formError || error) && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color={theme.error} />
                  <Text style={styles.errorText}>{formError || error}</Text>
                </View>
              )}

              <Button
                title="Anmelden"
                onPress={handleLogin}
                loading={loading}
                style={{ marginTop: 8, backgroundColor: brandColor }}
                size="lg"
              />

              {biometricAvailable && (
                <TouchableOpacity 
                  style={styles.biometricButton}
                  onPress={handleBiometricLogin}
                >
                  <Ionicons name="finger-print" size={24} color={brandColor} />
                  <Text style={[styles.biometricText, { color: brandColor }]}>
                    Mit Biometrie anmelden
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Powered by Baunity GmbH
              </Text>
              <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 16,
  },
  logo: {
    width: 60,
    height: 60,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  formContainer: {
    backgroundColor: theme.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.error}15`,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: theme.error,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  biometricText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 48,
  },
  footerText: {
    fontSize: 12,
    color: theme.textMuted,
  },
  versionText: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 4,
  },
});
