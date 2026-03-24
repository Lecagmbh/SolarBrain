/**
 * LECA Installation Wizard
 * Multi-Step Form fuer neue Netzanmeldungen
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Button, Input, Card, Badge } from '../components/ui';
import { installationsApi, netzbetreiberApi } from '../api/client';
import theme from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WIZARD_STEPS = [
  { key: 'typ', title: 'Anlagentyp', icon: 'flash-outline' },
  { key: 'standort', title: 'Standort', icon: 'location-outline' },
  { key: 'betreiber', title: 'Betreiber', icon: 'person-outline' },
  { key: 'technik', title: 'Technik', icon: 'settings-outline' },
  { key: 'dokumente', title: 'Dokumente', icon: 'document-outline' },
  { key: 'zusammenfassung', title: 'Zusammenfassung', icon: 'checkmark-circle-outline' },
];

const ANLAGE_TYPEN = [
  { key: 'pv', label: 'PV-Anlage', icon: 'sunny-outline', color: theme.colors.warning[500] },
  { key: 'speicher', label: 'Speicher', icon: 'battery-charging-outline', color: theme.colors.success[500] },
  { key: 'wallbox', label: 'Wallbox', icon: 'car-outline', color: theme.colors.accent[500] },
  { key: 'waermepumpe', label: 'Waermepumpe', icon: 'thermometer-outline', color: theme.colors.danger[500] },
  { key: 'kombi', label: 'Kombination', icon: 'apps-outline', color: theme.primary },
];

const MESSKONZEPTE = [
  { key: 'ueberschuss', label: 'Ueberschusseinspeisung' },
  { key: 'volleinspeisung', label: 'Volleinspeisung' },
  { key: 'nulleinspeisung', label: 'Nulleinspeisung' },
  { key: 'eigenverbrauch', label: 'Eigenverbrauch' },
];

export default function InstallationWizardScreen() {
  const navigation = useNavigation();
  const scrollRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [netzbetreiber, setNetzbetreiber] = useState([]);

  // Form Data
  const [formData, setFormData] = useState({
    // Typ
    anlagenTyp: '',
    // Standort
    strasse: '',
    hausNr: '',
    plz: '',
    ort: '',
    bundesland: '',
    netzbetreiberId: null,
    netzbetreiberName: '',
    // Betreiber
    betreiberVorname: '',
    betreiberNachname: '',
    betreiberEmail: '',
    betreiberTelefon: '',
    betreiberFirma: '',
    // Technik
    leistungKwp: '',
    modulAnzahl: '',
    modulHersteller: '',
    modulTyp: '',
    wechselrichterHersteller: '',
    wechselrichterTyp: '',
    wechselrichterAnzahl: '1',
    speicherKwh: '',
    messkonzept: '',
    // Dokumente
    dokumente: [],
  });

  useEffect(() => {
    loadNetzbetreiber();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / WIZARD_STEPS.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const loadNetzbetreiber = async () => {
    try {
      const data = await netzbetreiberApi.getAll();
      setNetzbetreiber(data.slice(0, 50)); // Limit for performance
    } catch (error) {
      console.error('Load Netzbetreiber error:', error);
    }
  };

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 0: // Typ
        return !!formData.anlagenTyp;
      case 1: // Standort
        return formData.strasse && formData.hausNr && formData.plz && formData.ort;
      case 2: // Betreiber
        return formData.betreiberVorname && formData.betreiberNachname;
      case 3: // Technik
        return formData.leistungKwp && formData.messkonzept;
      case 4: // Dokumente
        return true; // Optional
      case 5: // Zusammenfassung
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep()) {
      Alert.alert('Fehler', 'Bitte fuellen Sie alle Pflichtfelder aus.');
      return;
    }

    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      submitForm();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      navigation.goBack();
    }
  };

  const submitForm = async () => {
    setLoading(true);
    try {
      const payload = {
        anlagenTyp: formData.anlagenTyp,
        customerName: `${formData.betreiberVorname} ${formData.betreiberNachname}`.trim(),
        street: formData.strasse,
        houseNumber: formData.hausNr,
        postalCode: formData.plz,
        city: formData.ort,
        state: formData.bundesland,
        gridOperatorId: formData.netzbetreiberId,
        email: formData.betreiberEmail,
        phone: formData.betreiberTelefon,
        company: formData.betreiberFirma,
        kwpPeak: parseFloat(formData.leistungKwp) || 0,
        moduleCount: parseInt(formData.modulAnzahl) || 0,
        moduleManufacturer: formData.modulHersteller,
        moduleType: formData.modulTyp,
        inverterManufacturer: formData.wechselrichterHersteller,
        inverterType: formData.wechselrichterTyp,
        inverterCount: parseInt(formData.wechselrichterAnzahl) || 1,
        batteryKwh: parseFloat(formData.speicherKwh) || 0,
        meteringConcept: formData.messkonzept,
      };

      // TODO: API call
      // const result = await installationsApi.create(payload);

      Alert.alert(
        'Erfolg',
        'Die Anlage wurde erfolgreich angelegt.',
        [{ text: 'OK', onPress: () => navigation.navigate('InstallationsTab') }]
      );
    } catch (error) {
      Alert.alert('Fehler', error.message || 'Anlage konnte nicht angelegt werden.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.stepProgress}>
        <Animated.View
          style={[
            styles.stepProgressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <View style={styles.stepInfo}>
        <Text style={styles.stepNumber}>
          Schritt {currentStep + 1} von {WIZARD_STEPS.length}
        </Text>
        <Text style={styles.stepTitle}>{WIZARD_STEPS[currentStep].title}</Text>
      </View>
    </View>
  );

  const renderTypStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeading}>Welche Anlage moechten Sie anmelden?</Text>
      <View style={styles.typeGrid}>
        {ANLAGE_TYPEN.map((typ) => (
          <TouchableOpacity
            key={typ.key}
            style={[
              styles.typeCard,
              formData.anlagenTyp === typ.key && styles.typeCardSelected,
              formData.anlagenTyp === typ.key && { borderColor: typ.color },
            ]}
            onPress={() => updateForm('anlagenTyp', typ.key)}
          >
            <View style={[styles.typeIcon, { backgroundColor: typ.color + '20' }]}>
              <Ionicons name={typ.icon} size={32} color={typ.color} />
            </View>
            <Text style={styles.typeLabel}>{typ.label}</Text>
            {formData.anlagenTyp === typ.key && (
              <View style={[styles.typeCheck, { backgroundColor: typ.color }]}>
                <Ionicons name="checkmark" size={14} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStandortStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeading}>Wo befindet sich die Anlage?</Text>
      
      <View style={styles.row}>
        <Input
          label="Strasse *"
          placeholder="Musterstrasse"
          value={formData.strasse}
          onChangeText={(v) => updateForm('strasse', v)}
          style={{ flex: 3 }}
        />
        <Input
          label="Nr. *"
          placeholder="1a"
          value={formData.hausNr}
          onChangeText={(v) => updateForm('hausNr', v)}
          style={{ flex: 1, marginLeft: 12 }}
        />
      </View>

      <View style={styles.row}>
        <Input
          label="PLZ *"
          placeholder="12345"
          value={formData.plz}
          onChangeText={(v) => updateForm('plz', v)}
          keyboardType="numeric"
          style={{ flex: 1 }}
        />
        <Input
          label="Ort *"
          placeholder="Musterstadt"
          value={formData.ort}
          onChangeText={(v) => updateForm('ort', v)}
          style={{ flex: 2, marginLeft: 12 }}
        />
      </View>

      <Input
        label="Bundesland"
        placeholder="Bayern"
        value={formData.bundesland}
        onChangeText={(v) => updateForm('bundesland', v)}
      />

      <Text style={styles.fieldLabel}>Netzbetreiber</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nbScroll}>
        {netzbetreiber.slice(0, 10).map((nb) => (
          <TouchableOpacity
            key={nb.id}
            style={[
              styles.nbChip,
              formData.netzbetreiberId === nb.id && styles.nbChipSelected,
            ]}
            onPress={() => {
              updateForm('netzbetreiberId', nb.id);
              updateForm('netzbetreiberName', nb.name);
            }}
          >
            <Text style={[
              styles.nbChipText,
              formData.netzbetreiberId === nb.id && styles.nbChipTextSelected,
            ]}>
              {nb.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderBetreiberStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeading}>Wer ist der Anlagenbetreiber?</Text>

      <View style={styles.row}>
        <Input
          label="Vorname *"
          placeholder="Max"
          value={formData.betreiberVorname}
          onChangeText={(v) => updateForm('betreiberVorname', v)}
          style={{ flex: 1 }}
        />
        <Input
          label="Nachname *"
          placeholder="Mustermann"
          value={formData.betreiberNachname}
          onChangeText={(v) => updateForm('betreiberNachname', v)}
          style={{ flex: 1, marginLeft: 12 }}
        />
      </View>

      <Input
        label="Firma (optional)"
        placeholder="Musterfirma GmbH"
        value={formData.betreiberFirma}
        onChangeText={(v) => updateForm('betreiberFirma', v)}
        leftIcon="business-outline"
      />

      <Input
        label="E-Mail"
        placeholder="max@example.de"
        value={formData.betreiberEmail}
        onChangeText={(v) => updateForm('betreiberEmail', v)}
        keyboardType="email-address"
        leftIcon="mail-outline"
      />

      <Input
        label="Telefon"
        placeholder="+49 123 456789"
        value={formData.betreiberTelefon}
        onChangeText={(v) => updateForm('betreiberTelefon', v)}
        keyboardType="phone-pad"
        leftIcon="call-outline"
      />
    </View>
  );

  const renderTechnikStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeading}>Technische Daten</Text>

      <Card style={styles.techSection}>
        <Text style={styles.techSectionTitle}>PV-Anlage</Text>
        <View style={styles.row}>
          <Input
            label="Leistung (kWp) *"
            placeholder="10.5"
            value={formData.leistungKwp}
            onChangeText={(v) => updateForm('leistungKwp', v)}
            keyboardType="decimal-pad"
            style={{ flex: 1 }}
          />
          <Input
            label="Module"
            placeholder="24"
            value={formData.modulAnzahl}
            onChangeText={(v) => updateForm('modulAnzahl', v)}
            keyboardType="numeric"
            style={{ flex: 1, marginLeft: 12 }}
          />
        </View>
        <Input
          label="Modul-Hersteller"
          placeholder="z.B. JA Solar"
          value={formData.modulHersteller}
          onChangeText={(v) => updateForm('modulHersteller', v)}
        />
      </Card>

      <Card style={styles.techSection}>
        <Text style={styles.techSectionTitle}>Wechselrichter</Text>
        <Input
          label="Hersteller"
          placeholder="z.B. Fronius"
          value={formData.wechselrichterHersteller}
          onChangeText={(v) => updateForm('wechselrichterHersteller', v)}
        />
        <Input
          label="Typ"
          placeholder="z.B. Symo 10.0-3-M"
          value={formData.wechselrichterTyp}
          onChangeText={(v) => updateForm('wechselrichterTyp', v)}
        />
      </Card>

      {(formData.anlagenTyp === 'speicher' || formData.anlagenTyp === 'kombi') && (
        <Card style={styles.techSection}>
          <Text style={styles.techSectionTitle}>Speicher</Text>
          <Input
            label="Kapazitaet (kWh)"
            placeholder="10.0"
            value={formData.speicherKwh}
            onChangeText={(v) => updateForm('speicherKwh', v)}
            keyboardType="decimal-pad"
          />
        </Card>
      )}

      <Text style={styles.fieldLabel}>Messkonzept *</Text>
      <View style={styles.messkonzeptGrid}>
        {MESSKONZEPTE.map((mk) => (
          <TouchableOpacity
            key={mk.key}
            style={[
              styles.messkonzeptChip,
              formData.messkonzept === mk.key && styles.messkonzeptChipSelected,
            ]}
            onPress={() => updateForm('messkonzept', mk.key)}
          >
            <Text style={[
              styles.messkonzeptText,
              formData.messkonzept === mk.key && styles.messkonzeptTextSelected,
            ]}>
              {mk.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDokumenteStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeading}>Dokumente hochladen</Text>
      <Text style={styles.stepSubheading}>
        Laden Sie die erforderlichen Dokumente hoch (optional, kann spaeter ergaenzt werden)
      </Text>

      {[
        { key: 'lageplan', label: 'Lageplan', required: false },
        { key: 'schaltplan', label: 'Schaltplan', required: false },
        { key: 'datenblatt_modul', label: 'Datenblatt Module', required: false },
        { key: 'datenblatt_wr', label: 'Datenblatt Wechselrichter', required: false },
      ].map((doc) => (
        <TouchableOpacity key={doc.key} style={styles.docUploadItem}>
          <View style={styles.docUploadIcon}>
            <Ionicons name="cloud-upload-outline" size={24} color={theme.semantic.textTertiary} />
          </View>
          <View style={styles.docUploadInfo}>
            <Text style={styles.docUploadLabel}>{doc.label}</Text>
            <Text style={styles.docUploadHint}>Tippen zum Hochladen</Text>
          </View>
          <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderZusammenfassungStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeading}>Zusammenfassung</Text>

      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Anlagentyp</Text>
          <Badge 
            label={ANLAGE_TYPEN.find(t => t.key === formData.anlagenTyp)?.label || '-'} 
            variant="primary" 
          />
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Standort</Text>
          <Text style={styles.summaryValue}>
            {formData.strasse} {formData.hausNr}, {formData.plz} {formData.ort}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Betreiber</Text>
          <Text style={styles.summaryValue}>
            {formData.betreiberVorname} {formData.betreiberNachname}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Leistung</Text>
          <Text style={styles.summaryValue}>{formData.leistungKwp} kWp</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Messkonzept</Text>
          <Text style={styles.summaryValue}>
            {MESSKONZEPTE.find(m => m.key === formData.messkonzept)?.label || '-'}
          </Text>
        </View>
        {formData.netzbetreiberName && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Netzbetreiber</Text>
            <Text style={styles.summaryValue}>{formData.netzbetreiberName}</Text>
          </View>
        )}
      </Card>

      <View style={styles.submitInfo}>
        <Ionicons name="information-circle-outline" size={20} color={theme.semantic.textTertiary} />
        <Text style={styles.submitInfoText}>
          Nach dem Absenden wird die Anlage als Entwurf gespeichert. Sie koennen die Daten 
          jederzeit bearbeiten und weitere Dokumente hochladen.
        </Text>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderTypStep();
      case 1: return renderStandortStep();
      case 2: return renderBetreiberStep();
      case 3: return renderTechnikStep();
      case 4: return renderDokumenteStep();
      case 5: return renderZusammenfassungStep();
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={prevStep} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.semantic.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Neue Anlage</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.semantic.textSecondary} />
        </TouchableOpacity>
      </View>

      {renderStepIndicator()}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderCurrentStep()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title={currentStep === WIZARD_STEPS.length - 1 ? 'Anlage erstellen' : 'Weiter'}
            onPress={nextStep}
            loading={loading}
            icon={currentStep === WIZARD_STEPS.length - 1 ? 'checkmark-circle-outline' : 'arrow-forward'}
            iconRight
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.semantic.bgBase,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.semantic.textPrimary,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Step Indicator
  stepIndicator: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  stepProgress: {
    height: 4,
    backgroundColor: theme.semantic.bgMuted,
    borderRadius: 2,
    overflow: 'hidden',
  },
  stepProgressFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 2,
  },
  stepInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  stepNumber: {
    fontSize: 13,
    color: theme.semantic.textTertiary,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.primary,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  stepContent: {
    paddingTop: 8,
  },
  stepHeading: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.semantic.textPrimary,
    marginBottom: 8,
  },
  stepSubheading: {
    fontSize: 15,
    color: theme.semantic.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },

  // Type Selection
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  typeCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    padding: 20,
    backgroundColor: theme.semantic.bgSurface,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.semantic.borderDefault,
  },
  typeCardSelected: {
    backgroundColor: theme.semantic.bgElevated,
    borderWidth: 2,
  },
  typeIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.semantic.textPrimary,
  },
  typeCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  row: {
    flexDirection: 'row',
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.semantic.textSecondary,
    marginBottom: 8,
    marginTop: 8,
  },

  // Netzbetreiber
  nbScroll: {
    marginBottom: 16,
  },
  nbChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.semantic.bgSurface,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.semantic.borderDefault,
  },
  nbChipSelected: {
    backgroundColor: theme.primaryMuted,
    borderColor: theme.primary,
  },
  nbChipText: {
    fontSize: 13,
    color: theme.semantic.textSecondary,
  },
  nbChipTextSelected: {
    color: theme.primary,
    fontWeight: '500',
  },

  // Tech Section
  techSection: {
    marginBottom: 16,
  },
  techSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.semantic.textPrimary,
    marginBottom: 16,
  },

  // Messkonzept
  messkonzeptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  messkonzeptChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: theme.semantic.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.semantic.borderDefault,
  },
  messkonzeptChipSelected: {
    backgroundColor: theme.primaryMuted,
    borderColor: theme.primary,
  },
  messkonzeptText: {
    fontSize: 13,
    color: theme.semantic.textSecondary,
  },
  messkonzeptTextSelected: {
    color: theme.primary,
    fontWeight: '500',
  },

  // Document Upload
  docUploadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.semantic.bgSurface,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.semantic.borderSubtle,
    borderStyle: 'dashed',
  },
  docUploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.semantic.bgMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  docUploadInfo: {
    flex: 1,
  },
  docUploadLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.semantic.textPrimary,
  },
  docUploadHint: {
    fontSize: 13,
    color: theme.semantic.textTertiary,
    marginTop: 2,
  },

  // Summary
  summaryCard: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.semantic.borderSubtle,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.semantic.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.semantic.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  submitInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: theme.semantic.bgSurface,
    borderRadius: 12,
    gap: 12,
  },
  submitInfoText: {
    flex: 1,
    fontSize: 13,
    color: theme.semantic.textSecondary,
    lineHeight: 20,
  },

  // Footer
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    backgroundColor: theme.semantic.bgBase,
    borderTopWidth: 1,
    borderTopColor: theme.semantic.borderSubtle,
  },
});
