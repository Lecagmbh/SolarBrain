/**
 * LECA Enterprise Mobile - Settings Screen
 * Profil, Sicherheit, App-Einstellungen
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';
import { Card, Avatar, Badge, Button, ListItem, Divider } from '../components/ui';
import theme from '../theme';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, logout, companyName, whiteLabelConfig, isAdmin, isMitarbeiter } = useAuth();
  
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const brandColor = whiteLabelConfig?.primaryColor || theme.primary;
  const brandLogo = whiteLabelConfig?.logoUrl;

  useEffect(() => {
    checkBiometric();
    loadSettings();
  }, []);

  const checkBiometric = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
    
    const enabled = await SecureStore.getItemAsync('biometric_enabled');
    setBiometricEnabled(enabled === 'true');
  };

  const loadSettings = async () => {
    const notifications = await SecureStore.getItemAsync('notifications_enabled');
    setNotificationsEnabled(notifications !== 'false');
  };

  const handleBiometricToggle = async (value) => {
    if (value) {
      // Verify biometric before enabling
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Biometrie aktivieren',
      });
      
      if (result.success) {
        await SecureStore.setItemAsync('biometric_enabled', 'true');
        setBiometricEnabled(true);
      }
    } else {
      await SecureStore.setItemAsync('biometric_enabled', 'false');
      setBiometricEnabled(false);
    }
  };

  const handleNotificationsToggle = async (value) => {
    await SecureStore.setItemAsync('notifications_enabled', value ? 'true' : 'false');
    setNotificationsEnabled(value);
  };

  const handleLogout = () => {
    Alert.alert(
      'Abmelden',
      'Möchten Sie sich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Abmelden', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        },
      ]
    );
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleSupport = () => {
    Linking.openURL('mailto:info@baunity.de?subject=Baunity App Support');
  };

  const handlePrivacy = () => {
    Linking.openURL('https://baunity.de/datenschutz');
  };

  const handleTerms = () => {
    Linking.openURL('https://baunity.de/agb');
  };

  const getRoleBadge = () => {
    if (isAdmin) return { label: 'Administrator', color: theme.error };
    if (isMitarbeiter) return { label: 'Mitarbeiter', color: theme.secondary };
    return { label: 'Kunde', color: theme.primary };
  };

  const roleBadge = getRoleBadge();
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar name={user?.name || user?.email} size={72} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'Benutzer'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <Badge text={roleBadge.label} color={roleBadge.color} size="sm" style={{ marginTop: 8 }} />
            </View>
          </View>
          
          {companyName && companyName !== 'Baunity' && (
            <View style={styles.companySection}>
              {brandLogo ? (
                <Image source={{ uri: brandLogo }} style={styles.companyLogo} resizeMode="contain" />
              ) : (
                <Ionicons name="business-outline" size={24} color={brandColor} />
              )}
              <Text style={[styles.companyName, { color: brandColor }]}>{companyName}</Text>
            </View>
          )}
        </Card>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Konto</Text>
        <Card>
          <ListItem
            title="Profil bearbeiten"
            subtitle="Name und Kontaktdaten ändern"
            left={<Ionicons name="person-outline" size={22} color={theme.primary} />}
            onPress={() => navigation.navigate('EditProfile')}
          />
          <ListItem
            title="Passwort ändern"
            subtitle="Sicherheitspasswort aktualisieren"
            left={<Ionicons name="key-outline" size={22} color={theme.accent} />}
            onPress={handleChangePassword}
          />
          {user?.kundeId && (
            <ListItem
              title="Firmendaten"
              subtitle="Unternehmensinformationen verwalten"
              left={<Ionicons name="business-outline" size={22} color={theme.secondary} />}
              onPress={() => navigation.navigate('CompanySettings')}
              borderBottom={false}
            />
          )}
        </Card>

        {/* Security Section */}
        <Text style={styles.sectionTitle}>Sicherheit</Text>
        <Card>
          {biometricAvailable && (
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="finger-print" size={22} color={theme.primary} />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Biometrie</Text>
                  <Text style={styles.settingSubtitle}>Mit Face ID / Fingerprint anmelden</Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: theme.border, true: `${brandColor}50` }}
                thumbColor={biometricEnabled ? brandColor : theme.textMuted}
              />
            </View>
          )}
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={22} color={theme.accent} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Push-Benachrichtigungen</Text>
                <Text style={styles.settingSubtitle}>Status-Updates erhalten</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: theme.border, true: `${brandColor}50` }}
              thumbColor={notificationsEnabled ? brandColor : theme.textMuted}
            />
          </View>
        </Card>

        {/* App Section */}
        <Text style={styles.sectionTitle}>App</Text>
        <Card>
          <ListItem
            title="Offline-Daten"
            subtitle="Gespeicherte Daten verwalten"
            left={<Ionicons name="cloud-offline-outline" size={22} color={theme.textSecondary} />}
            onPress={() => Alert.alert('Offline-Daten', 'Keine offline Daten gespeichert')}
          />
          <ListItem
            title="Cache leeren"
            subtitle="App-Cache löschen"
            left={<Ionicons name="trash-outline" size={22} color={theme.warning} />}
            onPress={() => Alert.alert('Cache', 'Cache wurde geleert')}
            borderBottom={false}
          />
        </Card>

        {/* Support Section */}
        <Text style={styles.sectionTitle}>Support & Rechtliches</Text>
        <Card>
          <ListItem
            title="Hilfe & Support"
            subtitle="Kontaktieren Sie uns"
            left={<Ionicons name="help-circle-outline" size={22} color={theme.info} />}
            onPress={handleSupport}
          />
          <ListItem
            title="Datenschutz"
            subtitle="Datenschutzerklärung lesen"
            left={<Ionicons name="shield-checkmark-outline" size={22} color={theme.success} />}
            onPress={handlePrivacy}
          />
          <ListItem
            title="AGB"
            subtitle="Allgemeine Geschäftsbedingungen"
            left={<Ionicons name="document-text-outline" size={22} color={theme.textSecondary} />}
            onPress={handleTerms}
            borderBottom={false}
          />
        </Card>

        {/* Logout */}
        <Button
          title="Abmelden"
          variant="outline"
          icon="log-out-outline"
          onPress={handleLogout}
          style={styles.logoutBtn}
          textStyle={{ color: theme.error }}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <Ionicons name="flash" size={24} color={theme.textMuted} />
            <Text style={styles.footerBrand}>GridNetz</Text>
          </View>
          <Text style={styles.footerVersion}>Version {appVersion}</Text>
          <Text style={styles.footerCopy}>© 2025 Baunity GmbH</Text>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  profileCard: {
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  companySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  companyLogo: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 10,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted,
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingInfo: {
    marginLeft: 14,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  settingSubtitle: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: 24,
    borderColor: theme.error,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingTop: 20,
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  footerBrand: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textMuted,
    marginLeft: 8,
  },
  footerVersion: {
    fontSize: 12,
    color: theme.textMuted,
  },
  footerCopy: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 4,
  },
});
