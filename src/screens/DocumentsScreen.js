/**
 * LECA Enterprise Mobile - Documents Screen
 * Dokumenten-Übersicht über alle Anlagen
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { installationsApi, documentsApi } from '../api/client';
import { Loading, EmptyState, Chip, Badge } from '../components/ui';
import theme, { DOCUMENT_CATEGORIES } from '../theme';

const FILTER_CATEGORIES = [
  { key: 'alle', label: 'Alle', icon: 'folder-outline' },
  { key: 'LAGEPLAN', label: 'Lageplan', icon: 'map-outline' },
  { key: 'SCHALTPLAN', label: 'Schaltplan', icon: 'git-network-outline' },
  { key: 'DATENBLATT', label: 'Datenblatt', icon: 'document-text-outline' },
  { key: 'ANTRAG', label: 'Antrag', icon: 'clipboard-outline' },
];

export default function DocumentsScreen() {
  const navigation = useNavigation();
  
  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('alle');

  const loadData = useCallback(async () => {
    try {
      // Get all installations with their documents
      const response = await installationsApi.getAll({ limit: 100 });
      const installations = response.data || response || [];
      
      // Fetch documents for each installation
      const allDocs = [];
      for (const inst of installations.slice(0, 50)) { // Limit for performance
        try {
          const docsResponse = await installationsApi.getDocuments(inst.id);
          const docs = docsResponse.data || [];
          docs.forEach(doc => {
            allDocs.push({
              ...doc,
              installationId: inst.id,
              installationName: inst.customerName || inst.publicId,
              installationPublicId: inst.publicId,
            });
          });
        } catch (e) {
          // Skip if no documents
        }
      }
      
      // Sort by date
      allDocs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setDocuments(allDocs);
      setFilteredDocs(allDocs);
    } catch (error) {
      console.error('[Documents] Load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (activeFilter === 'alle') {
      setFilteredDocs(documents);
    } else {
      setFilteredDocs(documents.filter(d => d.kategorie === activeFilter));
    }
  }, [activeFilter, documents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleOpenDocument = async (doc) => {
    try {
      const url = await documentsApi.download(doc.id);
      Linking.openURL(url);
    } catch (error) {
      console.error('[Documents] Open error:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderItem = ({ item }) => {
    const catConfig = DOCUMENT_CATEGORIES[item.kategorie] || DOCUMENT_CATEGORIES.SONSTIGE;
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => handleOpenDocument(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.cardIcon, { backgroundColor: `${catConfig.color}15` }]}>
          <Ionicons name={catConfig.icon} size={24} color={catConfig.color} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.originalName}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {item.installationPublicId} • {item.installationName}
          </Text>
          <View style={styles.cardMeta}>
            <Badge text={catConfig.label} color={catConfig.color} size="sm" />
            <Text style={styles.cardMetaText}>{formatFileSize(item.dateigroesse)}</Text>
            <Text style={styles.cardMetaText}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <Ionicons name="download-outline" size={22} color={theme.primary} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Loading fullScreen text="Dokumente werden geladen..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dokumente</Text>
        <Text style={styles.headerSubtitle}>{documents.length} Dokumente</Text>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_CATEGORIES}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Chip
              label={item.label}
              selected={activeFilter === item.key}
              onPress={() => setActiveFilter(item.key)}
              icon={item.icon}
            />
          )}
        />
      </View>

      {/* Results */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          {filteredDocs.length} {activeFilter === 'alle' ? 'Dokumente' : DOCUMENT_CATEGORIES[activeFilter]?.label || 'Dokumente'}
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={filteredDocs}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState 
            icon="document-text-outline" 
            title="Keine Dokumente" 
            description="Dokumente werden hier angezeigt, sobald welche hochgeladen wurden"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 4,
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterList: {
    paddingHorizontal: 20,
  },
  resultsBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 14,
    color: theme.textMuted,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardMetaText: {
    fontSize: 12,
    color: theme.textMuted,
  },
});
