/**
 * LECA Enterprise Mobile - Scanner Screen
 * Barcode Scanner für Produkt-Lookup (Wechselrichter, Speicher, etc.)
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Vibration,
  Modal, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { produkteApi } from '../api/client';
import { Card, Button, Loading, Badge } from '../components/ui';
import theme from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

export default function ScannerScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  
  const [scanning, setScanning] = useState(true);
  const [scannedCode, setScannedCode] = useState(null);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (!scanning || loading) return;
    
    setScanning(false);
    setScannedCode(data);
    Vibration.vibrate(100);
    
    await lookupProduct(data);
  };

  const lookupProduct = async (code) => {
    setLoading(true);
    
    try {
      // Try to find product by barcode/EAN
      const result = await produkteApi.searchByBarcode(code);
      
      if (result) {
        setProductData(result);
        setModalVisible(true);
      } else {
        // Try searching by code as model number
        const wrResults = await produkteApi.searchWechselrichter(code);
        if (wrResults?.data?.length > 0) {
          setProductData({ type: 'wechselrichter', data: wrResults.data[0] });
          setModalVisible(true);
        } else {
          const spResults = await produkteApi.searchSpeicher(code);
          if (spResults?.data?.length > 0) {
            setProductData({ type: 'speicher', data: spResults.data[0] });
            setModalVisible(true);
          } else {
            Alert.alert(
              'Nicht gefunden',
              `Kein Produkt mit Code "${code}" gefunden.\n\nMöchten Sie manuell suchen?`,
              [
                { text: 'Abbrechen', onPress: resetScanner },
                { text: 'Manuell suchen', onPress: () => navigation.navigate('ProductSearch', { query: code }) },
              ]
            );
          }
        }
      }
    } catch (error) {
      console.error('[Scanner] Lookup error:', error);
      Alert.alert('Fehler', 'Produkt-Suche fehlgeschlagen');
      resetScanner();
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanning(true);
    setScannedCode(null);
    setProductData(null);
    setModalVisible(false);
  };

  const handleUseProduct = () => {
    // Navigate back with product data
    navigation.navigate('Wizard', { 
      selectedProduct: productData,
    });
    setModalVisible(false);
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading fullScreen text="Kamera wird initialisiert..." />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={theme.textMuted} />
          <Text style={styles.permissionTitle}>Kamera-Zugriff benötigt</Text>
          <Text style={styles.permissionText}>
            Um Barcodes zu scannen, benötigt die App Zugriff auf Ihre Kamera.
          </Text>
          <Button
            title="Kamera erlauben"
            onPress={requestPermission}
            icon="camera-outline"
            style={{ marginTop: 20 }}
          />
          <Button
            title="Zurück"
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 12 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={flashOn}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'qr', 'datamatrix'],
        }}
        onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scanner</Text>
            <TouchableOpacity style={styles.headerBtn} onPress={() => setFlashOn(!flashOn)}>
              <Ionicons name={flashOn ? 'flash' : 'flash-off'} size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Scan Area */}
        <View style={styles.scanAreaContainer}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            
            {loading && (
              <View style={styles.loadingOverlay}>
                <Loading text="Suche..." />
              </View>
            )}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>
            {loading ? 'Produkt wird gesucht...' : 'Barcode scannen'}
          </Text>
          <Text style={styles.instructionsText}>
            Richten Sie die Kamera auf den Barcode eines Wechselrichters, Speichers oder Moduls
          </Text>
          
          {scannedCode && !loading && (
            <View style={styles.scannedInfo}>
              <Ionicons name="barcode-outline" size={18} color={theme.primary} />
              <Text style={styles.scannedCode}>{scannedCode}</Text>
            </View>
          )}
        </View>

        {/* Bottom Actions */}
        <SafeAreaView edges={['bottom']} style={styles.bottomActions}>
          <TouchableOpacity 
            style={styles.bottomBtn}
            onPress={() => navigation.navigate('ProductSearch')}
          >
            <Ionicons name="search-outline" size={24} color="#FFF" />
            <Text style={styles.bottomBtnText}>Manuell suchen</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.bottomBtn}
            onPress={resetScanner}
          >
            <Ionicons name="refresh-outline" size={24} color="#FFF" />
            <Text style={styles.bottomBtnText}>Neu scannen</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      {/* Product Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Produkt gefunden</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {productData && (
                <Card style={styles.productCard}>
                  <View style={styles.productHeader}>
                    <View style={styles.productIcon}>
                      <Ionicons 
                        name={productData.type === 'wechselrichter' ? 'hardware-chip-outline' : 'battery-charging-outline'} 
                        size={32} 
                        color={theme.primary} 
                      />
                    </View>
                    <View style={styles.productInfo}>
                      <Badge 
                        text={productData.type === 'wechselrichter' ? 'Wechselrichter' : 'Speicher'} 
                        color={theme.primary}
                        size="sm"
                      />
                      <Text style={styles.productName}>
                        {productData.data?.modell || productData.data?.name || 'Unbekannt'}
                      </Text>
                      <Text style={styles.productManufacturer}>
                        {productData.data?.hersteller || '-'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.productDetails}>
                    {productData.type === 'wechselrichter' && (
                      <>
                        <ProductDetail label="Nennleistung" value={`${productData.data?.nennleistung || '-'} kW`} />
                        <ProductDetail label="Max. DC-Leistung" value={`${productData.data?.maxDcLeistung || '-'} kW`} />
                        <ProductDetail label="Wirkungsgrad" value={`${productData.data?.wirkungsgrad || '-'} %`} />
                        <ProductDetail label="Phasen" value={productData.data?.phasen || '-'} />
                      </>
                    )}
                    {productData.type === 'speicher' && (
                      <>
                        <ProductDetail label="Kapazität" value={`${productData.data?.kapazitaet || '-'} kWh`} />
                        <ProductDetail label="Nennleistung" value={`${productData.data?.nennleistung || '-'} kW`} />
                        <ProductDetail label="Zyklen" value={productData.data?.zyklen || '-'} />
                      </>
                    )}
                  </View>
                </Card>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Abbrechen"
                variant="outline"
                onPress={resetScanner}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Übernehmen"
                onPress={handleUseProduct}
                icon="checkmark-circle-outline"
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const ProductDetail = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: theme.background,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginTop: 20,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  scanAreaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: theme.primary,
  },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: 4, borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: 4, borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: 4, borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: 4, borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  instructions: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 24,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  scannedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  scannedCode: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 24,
  },
  bottomBtn: {
    alignItems: 'center',
  },
  bottomBtnText: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  productCard: {
    marginBottom: 0,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  productIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: `${theme.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginTop: 8,
  },
  productManufacturer: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  productDetails: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.textMuted,
  },
  detailValue: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
  },
});
