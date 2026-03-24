/**
 * LECA Barcode Scanner Screen
 * Scan products for automatic data lookup
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Vibration,
  Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Button, Card, Badge } from '../components/ui';
import { api } from '../api/client';
import theme from '../theme';

export default function BarcodeScannerScreen() {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    requestPermission();
  }, []);

  const requestPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    
    setScanned(true);
    Vibration.vibrate(100);

    console.log('[Scanner] Scanned:', type, data);
    
    // Lookup product in database
    await lookupProduct(data);
  };

  const lookupProduct = async (barcode) => {
    setLoading(true);
    try {
      // Try to find in PV*SOL database
      const response = await api.get(`/produkte/search?barcode=${encodeURIComponent(barcode)}`);
      
      if (response && response.length > 0) {
        setScanResult({
          found: true,
          product: response[0],
          barcode,
        });
      } else {
        setScanResult({
          found: false,
          barcode,
          message: 'Produkt nicht in Datenbank gefunden',
        });
      }
    } catch (error) {
      console.error('[Scanner] Lookup error:', error);
      setScanResult({
        found: false,
        barcode,
        message: 'Suche fehlgeschlagen',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScanResult(null);
  };

  const useProduct = () => {
    if (scanResult?.product) {
      // Pass product data back
      navigation.navigate('InstallationWizard', {
        scannedProduct: scanResult.product,
      });
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.permissionText}>Kamera-Berechtigung wird geprueft...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="camera-outline" size={64} color={theme.semantic.textMuted} />
          <Text style={styles.permissionTitle}>Kamera-Zugriff erforderlich</Text>
          <Text style={styles.permissionText}>
            Bitte erlauben Sie den Kamera-Zugriff, um Barcodes zu scannen.
          </Text>
          <Button
            title="Einstellungen oeffnen"
            onPress={() => Linking.openSettings()}
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        style={StyleSheet.absoluteFill}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'datamatrix'],
        }}
        enableTorch={flashOn}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Barcode scannen</Text>
            <TouchableOpacity onPress={() => setFlashOn(!flashOn)} style={styles.headerBtn}>
              <Ionicons name={flashOn ? 'flash' : 'flash-outline'} size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Scanner Frame */}
        <View style={styles.scannerArea}>
          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.scannerHint}>
            {scanned ? 'Gescannt!' : 'Barcode in den Rahmen halten'}
          </Text>
        </View>

        {/* Result Card */}
        {scanResult && (
          <View style={styles.resultContainer}>
            <Card style={styles.resultCard}>
              {loading ? (
                <View style={styles.resultLoading}>
                  <Text style={styles.resultLoadingText}>Suche Produkt...</Text>
                </View>
              ) : scanResult.found ? (
                <>
                  <View style={styles.resultHeader}>
                    <Badge label="Gefunden" variant="success" />
                    <Text style={styles.resultBarcode}>{scanResult.barcode}</Text>
                  </View>
                  <Text style={styles.resultName}>{scanResult.product.name}</Text>
                  <Text style={styles.resultMeta}>
                    {scanResult.product.manufacturer} • {scanResult.product.type}
                  </Text>
                  {scanResult.product.power && (
                    <Text style={styles.resultSpec}>{scanResult.product.power} W</Text>
                  )}
                  <View style={styles.resultActions}>
                    <Button
                      title="Verwenden"
                      onPress={useProduct}
                      icon="checkmark"
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="Neu scannen"
                      variant="secondary"
                      onPress={resetScanner}
                      style={{ flex: 1, marginLeft: 12 }}
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.resultHeader}>
                    <Badge label="Nicht gefunden" variant="warning" />
                    <Text style={styles.resultBarcode}>{scanResult.barcode}</Text>
                  </View>
                  <Text style={styles.resultMessage}>{scanResult.message}</Text>
                  <View style={styles.resultActions}>
                    <Button
                      title="Manuell eingeben"
                      variant="secondary"
                      onPress={() => navigation.goBack()}
                      icon="create-outline"
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="Neu scannen"
                      onPress={resetScanner}
                      style={{ flex: 1, marginLeft: 12 }}
                    />
                  </View>
                </>
              )}
            </Card>
          </View>
        )}

        {/* Instructions */}
        {!scanResult && (
          <SafeAreaView edges={['bottom']} style={styles.instructions}>
            <View style={styles.instructionItem}>
              <Ionicons name="barcode-outline" size={24} color={theme.primary} />
              <Text style={styles.instructionText}>EAN, QR-Code, DataMatrix</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="search-outline" size={24} color={theme.primary} />
              <Text style={styles.instructionText}>Automatische Produktsuche</Text>
            </View>
          </SafeAreaView>
        )}
      </View>
    </View>
  );
}

const FRAME_SIZE = 280;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: theme.semantic.bgBase,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.semantic.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 15,
    color: theme.semantic.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
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

  scannerArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: theme.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scannerHint: {
    marginTop: 24,
    fontSize: 15,
    color: '#FFF',
    textAlign: 'center',
  },

  resultContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  resultCard: {
    backgroundColor: theme.semantic.bgSurface,
  },
  resultLoading: {
    padding: 20,
    alignItems: 'center',
  },
  resultLoadingText: {
    fontSize: 15,
    color: theme.semantic.textSecondary,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultBarcode: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: theme.semantic.textTertiary,
  },
  resultName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.semantic.textPrimary,
    marginBottom: 4,
  },
  resultMeta: {
    fontSize: 14,
    color: theme.semantic.textSecondary,
    marginBottom: 8,
  },
  resultSpec: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 16,
  },
  resultMessage: {
    fontSize: 15,
    color: theme.semantic.textSecondary,
    marginBottom: 16,
  },
  resultActions: {
    flexDirection: 'row',
    marginTop: 8,
  },

  instructions: {
    padding: 20,
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#FFF',
  },
});
