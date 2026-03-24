/**
 * LECA Biometric Authentication Service
 * Face ID / Touch ID / Fingerprint Support
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'leca_biometric_enabled';
const BIOMETRIC_EMAIL_KEY = 'leca_biometric_email';

class BiometricService {
  constructor() {
    this.isAvailable = false;
    this.biometricType = null;
  }

  async initialize() {
    try {
      // Check hardware support
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        this.isAvailable = false;
        return false;
      }

      // Check if biometrics are enrolled
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        this.isAvailable = false;
        return false;
      }

      // Get supported types
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        this.biometricType = 'face';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        this.biometricType = 'fingerprint';
      }

      this.isAvailable = true;
      return true;
    } catch (error) {
      console.error('[Biometric] Initialize error:', error);
      this.isAvailable = false;
      return false;
    }
  }

  getBiometricTypeName() {
    switch (this.biometricType) {
      case 'face': return 'Face ID';
      case 'fingerprint': return 'Fingerabdruck';
      default: return 'Biometrie';
    }
  }

  getBiometricIcon() {
    switch (this.biometricType) {
      case 'face': return 'scan-outline';
      case 'fingerprint': return 'finger-print-outline';
      default: return 'lock-closed-outline';
    }
  }

  async authenticate(reason = 'Bitte authentifizieren Sie sich') {
    if (!this.isAvailable) {
      throw new Error('Biometrie nicht verfuegbar');
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Abbrechen',
        disableDeviceFallback: false,
        fallbackLabel: 'Passwort verwenden',
      });

      return result.success;
    } catch (error) {
      console.error('[Biometric] Auth error:', error);
      return false;
    }
  }

  async isEnabled() {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch {
      return false;
    }
  }

  async setEnabled(enabled, email = null) {
    try {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
      if (email) {
        await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email);
      }
      return true;
    } catch (error) {
      console.error('[Biometric] Set enabled error:', error);
      return false;
    }
  }

  async getStoredEmail() {
    try {
      return await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
    } catch {
      return null;
    }
  }

  async quickLogin() {
    if (!this.isAvailable) return null;
    
    const enabled = await this.isEnabled();
    if (!enabled) return null;

    const success = await this.authenticate('Mit ' + this.getBiometricTypeName() + ' anmelden');
    if (!success) return null;

    const email = await this.getStoredEmail();
    return email;
  }

  async disable() {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
      return true;
    } catch {
      return false;
    }
  }
}

export const biometricService = new BiometricService();
export default biometricService;
