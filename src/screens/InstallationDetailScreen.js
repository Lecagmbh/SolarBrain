/**
 * LECA Enterprise Mobile - Installation Detail Screen V2
 * MIT KORREKTER DATEN-ANZEIGE
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert,
  RefreshControl, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { installationsApi, documentsApi } from '../api/client';
import { Loading, Badge, Card, Button, EmptyState, Avatar } from '../components/ui';
import theme, { getStatusConfig, DOCUMENT_CATEGORIES } from '../theme';

const TABS = [
  { key: 'overview', label: 'Übersicht', icon: 'information-circle-outline' },
  { key: 'technical', label: 'Technik', icon: 'hardware-chip-outline' },
  { key: 'documents', label: 'Dokumente', icon: 'document-text-outline' },
  { key: 'history', label: 'Verlauf', icon: 'time-outline' },
];

export default function InstallationDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};

  const [installation, setInstallation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [uploading, setUploading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await installationsApi.getById(id);
      setInstallation(data);
    } catch (error) {
      console.error('[Detail] Load error:', error);
      Alert.alert('Fehler', 'Anlage konnte nicht geladen werden');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadData();
  }, [id, loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleCall = () => {
    const phone = installation?.contactPhone;
    if (phone) Linking.openURL(`tel:${phone}`);
    else Alert.alert('Info', 'Keine Telefonnummer vorhanden');
  };

  const handleEmail = () => {
    const email = installation?.contactEmail;
    if (email) Linking.openURL(`mailto:${email}`);
    else Alert.alert('Info', 'Keine E-Mail vorhanden');
  };

  const handleMaps = () => {
    const { strasse, hausNr, plz, ort } = installation || {};
    const address = [strasse, hausNr, plz, ort].filter(Boolean).join(' ');
    if (address) {
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`);
    } else {
      Alert.alert('Info', 'Keine Adresse vorhanden');
    }
  };

  const handleUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;

      setUploading(true);
      const file = result.assets[0];
      await installationsApi.uploadDocument(id, {
        uri: file.uri, name: file.name, mimeType: file.mimeType,
      }, 'SONSTIGE');

      Alert.alert('Erfolg', 'Dokument hochgeladen');
      loadData();
    } catch (error) {
      console.error('[Detail] Upload error:', error);
      Alert.alert('Fehler', 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setAddingComment(true);
    try {
      await installationsApi.addComment(id, newComment.trim());
      setNewComment('');
      loadData();
    } catch (error) {
      Alert.alert('Fehler', 'Kommentar konnte nicht hinzugefügt werden');
    } finally {
      setAddingComment(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER LOADING / ERROR
  // ═══════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Loading fullScreen text="Lade Anlage..." />
      </SafeAreaView>
    );
  }

  if (!installation) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState
          icon="alert-circle-outline"
          title="Anlage nicht gefunden"
          action={() => navigation.goBack()}
          actionLabel="Zurück"
        />
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTRACT DATA
  // ═══════════════════════════════════════════════════════════════════════════

  const {
    publicId,
    customerName,
    customerType,
    contactEmail,
    contactPhone,
    strasse,
    hausNr,
    plz,
    ort,
    location,
    gridOperator,
    zaehlernummer,
    messkonzept,
    caseType,
    status,
    createdAt,
    updatedAt,
    submittedAt,
    wizardContext = {},
    technicalData = {},
    documents = [],
    comments = [],
    statusHistory = [],
  } = installation;

  // Build display values
  const displayName = customerName ||
    [wizardContext?.step6?.vorname, wizardContext?.step6?.nachname].filter(Boolean).join(' ') ||
    wizardContext?.step6?.firma ||
    'Unbekannt';

  const displayAddress = [strasse, hausNr].filter(Boolean).join(' ') ||
    [wizardContext?.step2?.strasse, wizardContext?.step2?.hausnummer].filter(Boolean).join(' ');

  const displayLocation = location || [plz, ort].filter(Boolean).join(' ') ||
    [wizardContext?.step2?.plz, wizardContext?.step2?.ort].filter(Boolean).join(' ');

  const displayEmail = contactEmail || wizardContext?.step6?.email || '';
  const displayPhone = contactPhone || wizardContext?.step6?.telefon || '';
  const displayGridOperator = gridOperator || wizardContext?.netzbetreiber?.name || '';
  const displayMeterNumber = zaehlernummer || wizardContext?.step2?.zaehlernummer || '';
  const displayMesskonzept = messkonzept || wizardContext?.step5?.messkonzept || technicalData?.messkonzept || '';

  // Technical data from technicalData (API format)
  const td = technicalData || {};
  const pvEntries = td.pvEntries || [];
  const inverterEntries = td.inverterEntries || [];
  const batteryEntries = td.batteryEntries || [];
  const wallboxEntries = td.wallboxEntries || [];
  const heatpumpEntries = td.heatpumpEntries || [];
  const totalPvKwp = td.totalPvKwp || 0;
  const totalInverterKva = td.totalInverterKva || 0;
  const totalBatteryKwh = td.totalBatteryKwh || 0;

  const statusConfig = getStatusConfig(status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{publicId}</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}15` }]}>
            <Ionicons name="sunny-outline" size={32} color={theme.primary} />
          </View>
          <Text style={styles.heroTitle}>{displayName}</Text>
          <Text style={styles.heroSubtitle}>{displayLocation || '-'}</Text>
          <Badge
            text={statusConfig.label}
            color={statusConfig.color}
            icon={statusConfig.icon}
            style={{ marginTop: 12 }}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={handleCall}>
            <Ionicons name="call-outline" size={22} color={theme.success} />
            <Text style={styles.quickActionText}>Anrufen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={handleEmail}>
            <Ionicons name="mail-outline" size={22} color={theme.secondary} />
            <Text style={styles.quickActionText}>E-Mail</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={handleMaps}>
            <Ionicons name="navigate-outline" size={22} color={theme.accent} />
            <Text style={styles.quickActionText}>Route</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons name={tab.icon} size={16} color={activeTab === tab.key ? theme.primary : theme.textMuted} />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>

          {/* ═══════════ OVERVIEW TAB ═══════════ */}
          {activeTab === 'overview' && (
            <>
              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Betreiber</Text>
                <InfoRow icon="person-outline" label="Name" value={displayName} />
                <InfoRow icon="mail-outline" label="E-Mail" value={displayEmail} />
                <InfoRow icon="call-outline" label="Telefon" value={displayPhone} />
                <InfoRow icon="briefcase-outline" label="Typ" value={customerType === 'PRIVATE' ? 'Privat' : customerType === 'BUSINESS' ? 'Gewerbe' : customerType || '-'} last />
              </Card>

              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Standort</Text>
                <InfoRow icon="location-outline" label="Adresse" value={displayAddress} />
                <InfoRow icon="map-outline" label="Ort" value={displayLocation} />
                <InfoRow icon="business-outline" label="Netzbetreiber" value={displayGridOperator} />
                <InfoRow icon="barcode-outline" label="Zählernummer" value={displayMeterNumber} last />
              </Card>

              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Zeitstempel</Text>
                <InfoRow icon="calendar-outline" label="Erstellt" value={formatDateShort(createdAt)} />
                <InfoRow icon="refresh-outline" label="Aktualisiert" value={formatDateShort(updatedAt)} />
                {submittedAt && <InfoRow icon="paper-plane-outline" label="Eingereicht" value={formatDateShort(submittedAt)} />}
              </Card>
            </>
          )}

          {/* ═══════════ TECHNICAL TAB ═══════════ */}
          {activeTab === 'technical' && (
            <>
              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Übersicht</Text>
                <InfoRow icon="flash-outline" label="Messkonzept" value={displayMesskonzept} />
                <InfoRow icon="layers-outline" label="Falltyp" value={caseType} />
                {totalPvKwp > 0 && <InfoRow icon="sunny-outline" label="Gesamt PV" value={`${totalPvKwp.toFixed(2)} kWp`} />}
                {totalInverterKva > 0 && <InfoRow icon="flash-outline" label="Gesamt WR" value={`${totalInverterKva.toFixed(2)} kVA`} />}
                {totalBatteryKwh > 0 && <InfoRow icon="battery-half-outline" label="Speicher" value={`${totalBatteryKwh.toFixed(1)} kWh`} last />}
              </Card>

              {pvEntries.length > 0 && (
                <Card style={styles.section}>
                  <Text style={styles.sectionTitle}>PV-Module ({pvEntries.length})</Text>
                  {pvEntries.map((pv, idx) => (
                    <View key={pv.id || idx} style={styles.techItem}>
                      <View style={styles.techItemHeader}>
                        <Ionicons name="sunny-outline" size={18} color={theme.primary} />
                        <Text style={styles.techItemTitle}>{pv.roofName || `Dachfläche ${idx + 1}`}</Text>
                      </View>
                      <Text style={styles.techItemSubtitle}>{pv.manufacturer} {pv.model}</Text>
                      <View style={styles.techItemGrid}>
                        <TechValue label="Module" value={pv.count} />
                        <TechValue label="Leistung" value={pv.powerWp ? `${pv.powerWp} Wp` : "-"} />
                        <TechValue label="Ausrichtung" value={pv.orientation} />
                        <TechValue label="Neigung" value={pv.tilt ? `${pv.tilt}°` : "-"} />
                        <TechValue label="Gesamt" value={pv.count && pv.powerWp ? `${((pv.count * pv.powerWp) / 1000).toFixed(2)} kWp` : "-"} />
                      </View>
                    </View>
                  ))}
                </Card>
              )}

              {inverterEntries.length > 0 && (
                <Card style={styles.section}>
                  <Text style={styles.sectionTitle}>Wechselrichter ({inverterEntries.length})</Text>
                  {inverterEntries.map((wr, idx) => (
                    <View key={wr.id || idx} style={styles.techItem}>
                      <View style={styles.techItemHeader}>
                        <Ionicons name="hardware-chip-outline" size={18} color={theme.accent} />
                        <Text style={styles.techItemTitle}>{wr.manufacturer} {wr.model || `WR ${idx + 1}`}</Text>
                        {wr.count > 1 && <Badge text={`${wr.count}x`} color={theme.secondary} size="sm" />}
                      </View>
                      <View style={styles.techItemGrid}>
                        <TechValue label="Leistung" value={wr.powerKva ? `${wr.powerKva} kVA` : "-"} />
                        <TechValue label="Hybrid" value={wr.hybrid ? "Ja" : "Nein"} />
                      </View>
                    </View>
                  ))}
                </Card>
              )}

              {batteryEntries.length > 0 && (
                <Card style={styles.section}>
                  <Text style={styles.sectionTitle}>Speicher ({batteryEntries.length})</Text>
                  {batteryEntries.map((bat, idx) => (
                    <View key={bat.id || idx} style={styles.techItem}>
                      <View style={styles.techItemHeader}>
                        <Ionicons name="battery-charging-outline" size={18} color={theme.success} />
                        <Text style={styles.techItemTitle}>{bat.manufacturer} {bat.model || `Speicher ${idx + 1}`}</Text>
                        {bat.count > 1 && <Badge text={`${bat.count}x`} color={theme.secondary} size="sm" />}
                      </View>
                      <View style={styles.techItemGrid}>
                        <TechValue label="Kapazität" value={bat.capacityKwh ? `${bat.capacityKwh} kWh` : "-"} />
                        <TechValue label="Leistung" value={bat.powerKw ? `${bat.powerKw} kW` : "-"} />
                      </View>
                    </View>
                  ))}
                </Card>
              )}

              {wallboxEntries.length > 0 && (
                <Card style={styles.section}>
                  <Text style={styles.sectionTitle}>Wallboxen ({wallboxEntries.length})</Text>
                  {wallboxEntries.map((wb, idx) => (
                    <View key={wb.id || idx} style={styles.techItem}>
                      <View style={styles.techItemHeader}>
                        <Ionicons name="car-outline" size={18} color={theme.secondary} />
                        <Text style={styles.techItemTitle}>{wb.manufacturer} {wb.model || `Wallbox ${idx + 1}`}</Text>
                      </View>
                      <View style={styles.techItemGrid}>
                        <TechValue label="Leistung" value={wb.powerKw ? `${wb.powerKw} kW` : '-'} />
                      </View>
                    </View>
                  ))}
                </Card>
              )}

              {heatpumpEntries.length > 0 && (
                <Card style={styles.section}>
                  <Text style={styles.sectionTitle}>Wärmepumpen ({heatpumpEntries.length})</Text>
                  {heatpumpEntries.map((hp, idx) => (
                    <View key={hp.id || idx} style={styles.techItem}>
                      <View style={styles.techItemHeader}>
                        <Ionicons name="thermometer-outline" size={18} color={theme.error} />
                        <Text style={styles.techItemTitle}>{hp.manufacturer} {hp.model || `WP ${idx + 1}`}</Text>
                      </View>
                      <View style={styles.techItemGrid}>
                        <TechValue label="Leistung" value={hp.powerKw ? `${hp.powerKw} kW` : '-'} />
                        <TechValue label="Typ" value={hp.type} />
                      </View>
                    </View>
                  ))}
                </Card>
              )}

              {pvEntries.length === 0 && inverterEntries.length === 0 && batteryEntries.length === 0 && (
                <Card style={styles.section}>
                  <EmptyState
                    icon="hardware-chip-outline"
                    title="Keine technischen Daten"
                    description="Technische Details werden nach dem Wizard angezeigt"
                  />
                </Card>
              )}
            </>
          )}

          {/* ═══════════ DOCUMENTS TAB ═══════════ */}
          {activeTab === 'documents' && (
            <>
              <Button
                title="Dokument hochladen"
                icon="cloud-upload-outline"
                onPress={handleUploadDocument}
                loading={uploading}
                style={{ marginBottom: 16 }}
              />

              {documents.length === 0 ? (
                <Card>
                  <EmptyState icon="document-text-outline" title="Keine Dokumente" description="Laden Sie Dokumente hoch" />
                </Card>
              ) : (
                documents.map((doc) => {
                  const catConfig = DOCUMENT_CATEGORIES[doc.kategorie] || DOCUMENT_CATEGORIES.SONSTIGE;
                  return (
                    <TouchableOpacity
                      key={doc.id}
                      style={styles.documentCard}
                      onPress={async () => {
                        try {
                          const url = await documentsApi.download(doc.id);
                          Linking.openURL(url);
                        } catch (e) {
                          Alert.alert('Fehler', 'Download fehlgeschlagen');
                        }
                      }}
                    >
                      <View style={[styles.docIcon, { backgroundColor: `${catConfig.color}15` }]}>
                        <Ionicons name={catConfig.icon} size={24} color={catConfig.color} />
                      </View>
                      <View style={styles.docInfo}>
                        <Text style={styles.docName} numberOfLines={1}>{doc.originalName}</Text>
                        <Text style={styles.docMeta}>{catConfig.label} • {formatFileSize(doc.dateigroesse)}</Text>
                      </View>
                      <Ionicons name="download-outline" size={20} color={theme.primary} />
                    </TouchableOpacity>
                  );
                })
              )}
            </>
          )}

          {/* ═══════════ HISTORY TAB ═══════════ */}
          {activeTab === 'history' && (
            <>
              {/* Comment Input */}
              <View style={styles.commentInput}>
                <TextInput
                  style={styles.commentTextInput}
                  placeholder="Notiz hinzufügen..."
                  placeholderTextColor={theme.textMuted}
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.commentSendBtn, !newComment.trim() && { opacity: 0.5 }]}
                  onPress={handleAddComment}
                  disabled={!newComment.trim() || addingComment}
                >
                  {addingComment ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="send" size={20} color="#FFF" />}
                </TouchableOpacity>
              </View>

              {/* Status History */}
              {statusHistory.length > 0 && (
                <Card style={[styles.section, { marginTop: 16 }]}>
                  <Text style={styles.sectionTitle}>Status-Verlauf</Text>
                  {statusHistory.map((item, index) => {
                    const itemConfig = getStatusConfig(item.newStatus || item.status);
                    return (
                      <View key={item.id || index} style={styles.historyItem}>
                        <View style={[styles.historyDot, { backgroundColor: itemConfig.color }]} />
                        {index < statusHistory.length - 1 && <View style={styles.historyLine} />}
                        <View style={styles.historyContent}>
                          <Text style={styles.historyStatus}>{itemConfig.label}</Text>
                          <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
                          {item.note && <Text style={styles.historyNote}>{item.note}</Text>}
                        </View>
                      </View>
                    );
                  })}
                </Card>
              )}

              {/* Comments */}
              {comments.length > 0 && (
                <Card style={styles.section}>
                  <Text style={styles.sectionTitle}>Notizen ({comments.length})</Text>
                  {comments.map((comment) => (
                    <View key={comment.id} style={styles.commentCard}>
                      <View style={styles.commentHeader}>
                        <Avatar name={comment.authorName || 'U'} size={32} />
                        <View style={styles.commentMeta}>
                          <Text style={styles.commentAuthor}>{comment.authorName || 'Unbekannt'}</Text>
                          <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
                        </View>
                      </View>
                      <Text style={styles.commentText}>{comment.message}</Text>
                    </View>
                  ))}
                </Card>
              )}

              {statusHistory.length === 0 && comments.length === 0 && (
                <Card style={{ marginTop: 16 }}>
                  <EmptyState icon="time-outline" title="Keine Einträge" description="Status-Änderungen und Notizen werden hier angezeigt" />
                </Card>
              )}
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const InfoRow = ({ icon, label, value, last }) => (
  <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
    <View style={styles.infoRowLeft}>
      <Ionicons name={icon} size={18} color={theme.textMuted} />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue} numberOfLines={2}>{value || '-'}</Text>
  </View>
);

const TechValue = ({ label, value }) => (
  <View style={styles.techValue}>
    <Text style={styles.techValueLabel}>{label}</Text>
    <Text style={styles.techValueText}>{value || '-'}</Text>
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: theme.text, flex: 1, textAlign: 'center' },
  moreBtn: { padding: 4 },
  scrollView: { flex: 1 },
  heroCard: { alignItems: 'center', padding: 24, marginHorizontal: 20, backgroundColor: theme.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
  heroIcon: { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: theme.text, textAlign: 'center' },
  heroSubtitle: { fontSize: 15, color: theme.textMuted, marginTop: 4 },
  quickActions: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 20, marginHorizontal: 20 },
  quickAction: { alignItems: 'center', padding: 14, backgroundColor: theme.surface, borderRadius: 14, borderWidth: 1, borderColor: theme.border, minWidth: 80 },
  quickActionText: { fontSize: 12, color: theme.textSecondary, marginTop: 6 },
  tabsContainer: { flexDirection: 'row', marginTop: 24, marginHorizontal: 20, backgroundColor: theme.surface, borderRadius: 12, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 4 },
  tabActive: { backgroundColor: theme.surfaceElevated },
  tabText: { fontSize: 11, color: theme.textMuted },
  tabTextActive: { color: theme.primary, fontWeight: '600' },
  tabContent: { marginTop: 16, paddingHorizontal: 20 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border },
  infoRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  infoLabel: { fontSize: 14, color: theme.textMuted, marginLeft: 10 },
  infoValue: { fontSize: 14, color: theme.text, fontWeight: '500', maxWidth: '50%', textAlign: 'right' },
  techItem: { backgroundColor: theme.background, borderRadius: 12, padding: 14, marginBottom: 10 },
  techItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  techItemTitle: { fontSize: 15, fontWeight: '600', color: theme.text, flex: 1 },
  techItemSubtitle: { fontSize: 13, color: theme.textMuted, marginBottom: 10, marginLeft: 26 },
  techItemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  techValue: { minWidth: '45%' },
  techValueLabel: { fontSize: 11, color: theme.textMuted, marginBottom: 2 },
  techValueText: { fontSize: 14, color: theme.text, fontWeight: '500' },
  documentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
  docIcon: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  docInfo: { flex: 1, marginRight: 12 },
  docName: { fontSize: 15, fontWeight: '500', color: theme.text, marginBottom: 2 },
  docMeta: { fontSize: 13, color: theme.textMuted },
  historyItem: { flexDirection: 'row', marginBottom: 16, position: 'relative' },
  historyDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12, marginTop: 4 },
  historyLine: { position: 'absolute', left: 5, top: 16, width: 2, height: '100%', backgroundColor: theme.border },
  historyContent: { flex: 1 },
  historyStatus: { fontSize: 15, fontWeight: '600', color: theme.text },
  historyDate: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  historyNote: { fontSize: 14, color: theme.textSecondary, marginTop: 4 },
  commentInput: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: theme.surface, borderRadius: 14, padding: 8, borderWidth: 1, borderColor: theme.border },
  commentTextInput: { flex: 1, fontSize: 15, color: theme.text, paddingHorizontal: 10, paddingVertical: 8, maxHeight: 100 },
  commentSendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' },
  commentCard: { backgroundColor: theme.background, borderRadius: 12, padding: 14, marginBottom: 10 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  commentMeta: { marginLeft: 10 },
  commentAuthor: { fontSize: 14, fontWeight: '600', color: theme.text },
  commentDate: { fontSize: 12, color: theme.textMuted },
  commentText: { fontSize: 15, color: theme.text, lineHeight: 22 },
});
