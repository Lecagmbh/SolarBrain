/**
 * LECA Enterprise Mobile - Installation Wizard
 * Vollständiger 7-Step Wizard für neue Anlagen
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { installationsApi, netzbetreiberApi } from '../api/client';
import { Input, Select, Button, Card, StepIndicator, ProgressBar } from '../components/ui';
import theme, { ANLAGENTYP_CONFIG } from '../theme';

const STEPS = [
  { key: 'type', label: 'Anlagentyp' },
  { key: 'customer', label: 'Betreiber' },
  { key: 'location', label: 'Standort' },
  { key: 'technical', label: 'Technik' },
  { key: 'messkonzept', label: 'Messkonzept' },
  { key: 'documents', label: 'Dokumente' },
  { key: 'summary', label: 'Zusammenfassung' },
];

const ANLAGENTYPEN = [
  { value: 'PV', label: 'PV-Anlage', icon: 'sunny-outline', color: '#F59E0B', description: 'Photovoltaik-Anlage zur Stromerzeugung' },
  { value: 'SPEICHER', label: 'Speicher', icon: 'battery-charging-outline', color: '#22C55E', description: 'Batteriespeicher für Solarstrom' },
  { value: 'WALLBOX', label: 'Wallbox', icon: 'car-outline', color: '#3B82F6', description: 'Ladestation für Elektrofahrzeuge' },
  { value: 'WAERMEPUMPE', label: 'Wärmepumpe', icon: 'thermometer-outline', color: '#EF4444', description: 'Wärmepumpe für Heizung' },
  { value: 'KOMBI', label: 'Kombi-Anlage', icon: 'layers-outline', color: '#8B5CF6', description: 'Kombination mehrerer Anlagentypen' },
];

const MESSKONZEPTE = [
  { value: 'UEBERSCHUSS', label: 'Überschusseinspeisung', description: 'Eigenverbrauch mit Einspeisung des Überschusses' },
  { value: 'VOLLEINSPEISUNG', label: 'Volleinspeisung', description: 'Gesamte Erzeugung wird eingespeist' },
  { value: 'NULLEINSPEISUNG', label: 'Nulleinspeisung', description: 'Kein Strom wird ins Netz eingespeist' },
  { value: 'EIGENVERBRAUCH', label: 'Eigenverbrauch', description: 'Maximierung des Eigenverbrauchs' },
];

const CUSTOMER_TYPES = [
  { value: 'PRIVATE', label: 'Privatkunde' },
  { value: 'BUSINESS', label: 'Gewerbekunde' },
];

export default function WizardScreen() {
  const navigation = useNavigation();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Type
    anlagentyp: '',
    
    // Step 2: Customer
    customerType: 'PRIVATE',
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    
    // Step 3: Location
    street: '',
    houseNumber: '',
    zip: '',
    city: '',
    netOperator: '',
    meterNumber: '',
    
    // Step 4: Technical
    pvLeistung: '',
    anzahlModule: '',
    modulTyp: '',
    wechselrichterTyp: '',
    speicherKapazitaet: '',
    speicherTyp: '',
    wallboxLeistung: '',
    
    // Step 5: Messkonzept
    messkonzept: '',
    
    // Step 6: Documents (handled separately)
    documents: [],
  });

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: null }));
  };

  const validateStep = () => {
    const newErrors = {};
    
    switch (currentStep) {
      case 0: // Type
        if (!formData.anlagentyp) newErrors.anlagentyp = 'Bitte Anlagentyp wählen';
        break;
        
      case 1: // Customer
        if (formData.customerType === 'PRIVATE') {
          if (!formData.firstName) newErrors.firstName = 'Vorname erforderlich';
          if (!formData.lastName) newErrors.lastName = 'Nachname erforderlich';
        } else {
          if (!formData.companyName) newErrors.companyName = 'Firmenname erforderlich';
        }
        if (!formData.email) newErrors.email = 'E-Mail erforderlich';
        break;
        
      case 2: // Location
        if (!formData.street) newErrors.street = 'Straße erforderlich';
        if (!formData.zip) newErrors.zip = 'PLZ erforderlich';
        if (!formData.city) newErrors.city = 'Ort erforderlich';
        break;
        
      case 4: // Messkonzept
        if (!formData.messkonzept) newErrors.messkonzept = 'Bitte Messkonzept wählen';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      // Build wizard context
      const wizardContext = {
        anlagentyp: formData.anlagentyp,
        customer: {
          customerType: formData.customerType,
          firstName: formData.firstName,
          lastName: formData.lastName,
          companyName: formData.companyName,
          email: formData.email,
          phone: formData.phone,
        },
        location: {
          siteAddress: {
            street: formData.street,
            houseNumber: formData.houseNumber,
            zip: formData.zip,
            city: formData.city,
          },
          netOperator: { name: formData.netOperator },
          meterNumber: formData.meterNumber,
        },
        technical: {
          pvLeistung: formData.pvLeistung,
          anzahlModule: formData.anzahlModule,
          modulTyp: formData.modulTyp,
          wechselrichterTyp: formData.wechselrichterTyp,
          speicherKapazitaet: formData.speicherKapazitaet,
          speicherTyp: formData.speicherTyp,
          wallboxLeistung: formData.wallboxLeistung,
        },
        messkonzept: formData.messkonzept,
      };

      const result = await installationsApi.create(wizardContext);
      
      Alert.alert(
        'Erfolg',
        `Anlage ${result.publicId} wurde erstellt!`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('[Wizard] Submit error:', error);
      Alert.alert('Fehler', error.message || 'Anlage konnte nicht erstellt werden');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      // STEP 0: Anlagentyp
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Welche Anlage möchten Sie anmelden?</Text>
            <Text style={styles.stepDescription}>Wählen Sie den Anlagentyp aus</Text>
            
            <View style={styles.typeGrid}>
              {ANLAGENTYPEN.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeCard,
                    formData.anlagentyp === type.value && styles.typeCardActive,
                    formData.anlagentyp === type.value && { borderColor: type.color },
                  ]}
                  onPress={() => updateFormData('anlagentyp', type.value)}
                >
                  <View style={[styles.typeIcon, { backgroundColor: `${type.color}15` }]}>
                    <Ionicons name={type.icon} size={28} color={type.color} />
                  </View>
                  <Text style={styles.typeLabel}>{type.label}</Text>
                  <Text style={styles.typeDescription} numberOfLines={2}>{type.description}</Text>
                  {formData.anlagentyp === type.value && (
                    <View style={[styles.typeCheck, { backgroundColor: type.color }]}>
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {errors.anlagentyp && <Text style={styles.errorText}>{errors.anlagentyp}</Text>}
          </View>
        );

      // STEP 1: Betreiber
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Betreiber-Daten</Text>
            <Text style={styles.stepDescription}>Wer betreibt die Anlage?</Text>

            <Select
              label="Kundentyp"
              value={formData.customerType}
              onValueChange={(v) => updateFormData('customerType', v)}
              options={CUSTOMER_TYPES}
            />

            {formData.customerType === 'PRIVATE' ? (
              <>
                <Input
                  label="Vorname"
                  value={formData.firstName}
                  onChangeText={(v) => updateFormData('firstName', v)}
                  placeholder="Max"
                  error={errors.firstName}
                  icon="person-outline"
                />
                <Input
                  label="Nachname"
                  value={formData.lastName}
                  onChangeText={(v) => updateFormData('lastName', v)}
                  placeholder="Mustermann"
                  error={errors.lastName}
                  icon="person-outline"
                />
              </>
            ) : (
              <Input
                label="Firmenname"
                value={formData.companyName}
                onChangeText={(v) => updateFormData('companyName', v)}
                placeholder="Muster GmbH"
                error={errors.companyName}
                icon="business-outline"
              />
            )}

            <Input
              label="E-Mail"
              value={formData.email}
              onChangeText={(v) => updateFormData('email', v)}
              placeholder="max@beispiel.de"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              icon="mail-outline"
            />

            <Input
              label="Telefon"
              value={formData.phone}
              onChangeText={(v) => updateFormData('phone', v)}
              placeholder="+49 123 456789"
              keyboardType="phone-pad"
              icon="call-outline"
            />
          </View>
        );

      // STEP 2: Standort
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Standort der Anlage</Text>
            <Text style={styles.stepDescription}>Wo wird die Anlage installiert?</Text>

            <View style={styles.row}>
              <View style={{ flex: 3, marginRight: 12 }}>
                <Input
                  label="Straße"
                  value={formData.street}
                  onChangeText={(v) => updateFormData('street', v)}
                  placeholder="Musterstraße"
                  error={errors.street}
                  icon="location-outline"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Nr."
                  value={formData.houseNumber}
                  onChangeText={(v) => updateFormData('houseNumber', v)}
                  placeholder="1"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Input
                  label="PLZ"
                  value={formData.zip}
                  onChangeText={(v) => updateFormData('zip', v)}
                  placeholder="12345"
                  keyboardType="numeric"
                  error={errors.zip}
                />
              </View>
              <View style={{ flex: 2 }}>
                <Input
                  label="Ort"
                  value={formData.city}
                  onChangeText={(v) => updateFormData('city', v)}
                  placeholder="Musterstadt"
                  error={errors.city}
                />
              </View>
            </View>

            <Input
              label="Netzbetreiber"
              value={formData.netOperator}
              onChangeText={(v) => updateFormData('netOperator', v)}
              placeholder="z.B. E.ON, Westnetz"
              icon="business-outline"
              helper="Wird automatisch ermittelt falls PLZ bekannt"
            />

            <Input
              label="Zählernummer (optional)"
              value={formData.meterNumber}
              onChangeText={(v) => updateFormData('meterNumber', v)}
              placeholder="1234567890"
              icon="barcode-outline"
            />
          </View>
        );

      // STEP 3: Technische Daten
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Technische Daten</Text>
            <Text style={styles.stepDescription}>Details zur Anlage</Text>

            {(formData.anlagentyp === 'PV' || formData.anlagentyp === 'KOMBI') && (
              <>
                <Text style={styles.sectionLabel}>PV-Anlage</Text>
                <Input
                  label="Leistung (kWp)"
                  value={formData.pvLeistung}
                  onChangeText={(v) => updateFormData('pvLeistung', v)}
                  placeholder="10.5"
                  keyboardType="decimal-pad"
                  icon="flash-outline"
                />
                <Input
                  label="Anzahl Module"
                  value={formData.anzahlModule}
                  onChangeText={(v) => updateFormData('anzahlModule', v)}
                  placeholder="25"
                  keyboardType="numeric"
                  icon="grid-outline"
                />
                <Input
                  label="Wechselrichter"
                  value={formData.wechselrichterTyp}
                  onChangeText={(v) => updateFormData('wechselrichterTyp', v)}
                  placeholder="z.B. SMA Sunny Tripower"
                  icon="hardware-chip-outline"
                />
              </>
            )}

            {(formData.anlagentyp === 'SPEICHER' || formData.anlagentyp === 'KOMBI') && (
              <>
                <Text style={styles.sectionLabel}>Speicher</Text>
                <Input
                  label="Kapazität (kWh)"
                  value={formData.speicherKapazitaet}
                  onChangeText={(v) => updateFormData('speicherKapazitaet', v)}
                  placeholder="10"
                  keyboardType="decimal-pad"
                  icon="battery-half-outline"
                />
                <Input
                  label="Speichertyp"
                  value={formData.speicherTyp}
                  onChangeText={(v) => updateFormData('speicherTyp', v)}
                  placeholder="z.B. BYD HVS"
                  icon="cube-outline"
                />
              </>
            )}

            {(formData.anlagentyp === 'WALLBOX' || formData.anlagentyp === 'KOMBI') && (
              <>
                <Text style={styles.sectionLabel}>Wallbox</Text>
                <Input
                  label="Leistung (kW)"
                  value={formData.wallboxLeistung}
                  onChangeText={(v) => updateFormData('wallboxLeistung', v)}
                  placeholder="11"
                  keyboardType="decimal-pad"
                  icon="car-outline"
                />
              </>
            )}

            {formData.anlagentyp === 'WAERMEPUMPE' && (
              <Text style={styles.infoText}>
                Wärmepumpen-Details werden im nächsten Schritt ergänzt.
              </Text>
            )}
          </View>
        );

      // STEP 4: Messkonzept
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Messkonzept</Text>
            <Text style={styles.stepDescription}>Wie soll der Strom gemessen werden?</Text>

            {MESSKONZEPTE.map((mk) => (
              <TouchableOpacity
                key={mk.value}
                style={[
                  styles.mkCard,
                  formData.messkonzept === mk.value && styles.mkCardActive,
                ]}
                onPress={() => updateFormData('messkonzept', mk.value)}
              >
                <View style={styles.mkRadio}>
                  {formData.messkonzept === mk.value && <View style={styles.mkRadioInner} />}
                </View>
                <View style={styles.mkContent}>
                  <Text style={styles.mkLabel}>{mk.label}</Text>
                  <Text style={styles.mkDescription}>{mk.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {errors.messkonzept && <Text style={styles.errorText}>{errors.messkonzept}</Text>}
          </View>
        );

      // STEP 5: Dokumente
      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Dokumente</Text>
            <Text style={styles.stepDescription}>Laden Sie erforderliche Dokumente hoch</Text>

            <Card style={styles.docCard}>
              <View style={styles.docCardHeader}>
                <Ionicons name="document-text-outline" size={24} color={theme.textMuted} />
                <Text style={styles.docCardTitle}>Lageplan</Text>
              </View>
              <Text style={styles.docCardDescription}>
                Zeigt die Position der Anlage auf dem Grundstück
              </Text>
              <Button
                title="Datei auswählen"
                variant="outline"
                icon="cloud-upload-outline"
                size="sm"
                style={{ marginTop: 12 }}
              />
            </Card>

            <Card style={styles.docCard}>
              <View style={styles.docCardHeader}>
                <Ionicons name="git-network-outline" size={24} color={theme.textMuted} />
                <Text style={styles.docCardTitle}>Schaltplan</Text>
              </View>
              <Text style={styles.docCardDescription}>
                Elektrischer Anschlussplan der Anlage
              </Text>
              <Button
                title="Datei auswählen"
                variant="outline"
                icon="cloud-upload-outline"
                size="sm"
                style={{ marginTop: 12 }}
              />
            </Card>

            <Text style={styles.infoText}>
              Dokumente können auch später hochgeladen werden.
            </Text>
          </View>
        );

      // STEP 6: Zusammenfassung
      case 6:
        const typeConfig = ANLAGENTYPEN.find(t => t.value === formData.anlagentyp) || {};
        const mkConfig = MESSKONZEPTE.find(m => m.value === formData.messkonzept) || {};
        
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Zusammenfassung</Text>
            <Text style={styles.stepDescription}>Prüfen Sie Ihre Angaben</Text>

            <Card style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={[styles.summaryIcon, { backgroundColor: `${typeConfig.color}15` }]}>
                  <Ionicons name={typeConfig.icon} size={24} color={typeConfig.color} />
                </View>
                <Text style={styles.summaryType}>{typeConfig.label}</Text>
              </View>
            </Card>

            <Card style={styles.summaryCard}>
              <Text style={styles.summarySection}>Betreiber</Text>
              <SummaryRow label="Name" value={formData.customerType === 'PRIVATE' 
                ? `${formData.firstName} ${formData.lastName}` 
                : formData.companyName} />
              <SummaryRow label="E-Mail" value={formData.email} />
              <SummaryRow label="Telefon" value={formData.phone} />
            </Card>

            <Card style={styles.summaryCard}>
              <Text style={styles.summarySection}>Standort</Text>
              <SummaryRow label="Adresse" value={`${formData.street} ${formData.houseNumber}`} />
              <SummaryRow label="Ort" value={`${formData.zip} ${formData.city}`} />
              <SummaryRow label="Netzbetreiber" value={formData.netOperator} />
            </Card>

            <Card style={styles.summaryCard}>
              <Text style={styles.summarySection}>Technische Daten</Text>
              {formData.pvLeistung && <SummaryRow label="PV-Leistung" value={`${formData.pvLeistung} kWp`} />}
              {formData.speicherKapazitaet && <SummaryRow label="Speicher" value={`${formData.speicherKapazitaet} kWh`} />}
              <SummaryRow label="Messkonzept" value={mkConfig.label} />
            </Card>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={handleBack}>
          <Ionicons name={currentStep === 0 ? 'close' : 'arrow-back'} size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{STEPS[currentStep].label}</Text>
        <View style={styles.headerBtn}>
          <Text style={styles.stepCounter}>{currentStep + 1}/{STEPS.length}</Text>
        </View>
      </View>

      {/* Progress */}
      <ProgressBar 
        progress={(currentStep / (STEPS.length - 1)) * 100} 
        height={4}
        style={{ marginHorizontal: 20 }}
      />

      {/* Content */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title={currentStep === STEPS.length - 1 ? 'Anlage erstellen' : 'Weiter'}
          onPress={handleNext}
          loading={submitting}
          icon={currentStep === STEPS.length - 1 ? 'checkmark-circle-outline' : 'arrow-forward'}
          iconRight
          size="lg"
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

// Summary Row Component
const SummaryRow = ({ label, value }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value || '-'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: { width: 44, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: theme.text },
  stepCounter: { fontSize: 14, color: theme.textMuted },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  stepContent: {},
  stepTitle: { fontSize: 24, fontWeight: '700', color: theme.text, marginBottom: 8 },
  stepDescription: { fontSize: 15, color: theme.textSecondary, marginBottom: 24 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  typeCard: {
    width: '48%',
    margin: '1%',
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: theme.border,
    position: 'relative',
  },
  typeCardActive: { backgroundColor: `${theme.primary}08` },
  typeIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  typeLabel: { fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 4 },
  typeDescription: { fontSize: 12, color: theme.textMuted, lineHeight: 16 },
  typeCheck: { position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row' },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: theme.primary, marginTop: 16, marginBottom: 12 },
  mkCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: theme.border,
  },
  mkCardActive: { borderColor: theme.primary, backgroundColor: `${theme.primary}08` },
  mkRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  mkRadioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.primary },
  mkContent: { flex: 1 },
  mkLabel: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 4 },
  mkDescription: { fontSize: 13, color: theme.textSecondary, lineHeight: 18 },
  docCard: { marginBottom: 12 },
  docCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  docCardTitle: { fontSize: 16, fontWeight: '600', color: theme.text, marginLeft: 10 },
  docCardDescription: { fontSize: 13, color: theme.textMuted },
  summaryCard: { marginBottom: 12 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center' },
  summaryIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  summaryType: { fontSize: 18, fontWeight: '600', color: theme.text },
  summarySection: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border },
  summaryLabel: { fontSize: 14, color: theme.textMuted },
  summaryValue: { fontSize: 14, color: theme.text, fontWeight: '500' },
  infoText: { fontSize: 14, color: theme.textMuted, textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  errorText: { fontSize: 13, color: theme.error, marginTop: 8 },
  footer: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.background },
});
