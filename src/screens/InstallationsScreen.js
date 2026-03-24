/**
 * LECA Enterprise Mobile - Installations Screen
 * Liste aller Anlagen mit Suche & Filter
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { installationsApi } from '../api/client';
import { Loading, Badge, EmptyState, Chip } from '../components/ui';
import theme, { getStatusConfig, getAnlagentypConfig } from '../theme';

const FILTERS = [
  { key: 'alle', label: 'Alle', icon: 'layers-outline' },
  { key: 'entwurf', label: 'Entwurf', icon: 'create-outline' },
  { key: 'eingereicht', label: 'Eingereicht', icon: 'paper-plane-outline' },
  { key: 'warten_nb', label: 'Beim NB', icon: 'time-outline' },
  { key: 'genehmigt', label: 'Genehmigt', icon: 'checkmark-circle-outline' },
  { key: 'abgeschlossen', label: 'Fertig', icon: 'checkmark-done-outline' },
];

export default function InstallationsScreen() {
  const navigation = useNavigation();
  
  const [installations, setInstallations] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('alle');

  const loadData = useCallback(async () => {
    try {
      const response = await installationsApi.getAll({ limit: 500 });
      const data = response.data || response || [];
      setInstallations(data);
      setFilteredData(data);
    } catch (error) {
      console.error('[Installations] Load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filter & Search
  useEffect(() => {
    let result = installations;

    // Filter by status
    if (activeFilter !== 'alle') {
      const statusMap = {
        'entwurf': ['ENTWURF'],
        'eingereicht': ['EINGEREICHT'],
        'pruefung': ['IN_PRUEFUNG'],
        'warten_nb': ['WARTEN_AUF_NB'],
        'genehmigt': ['NB_GENEHMIGT'],
        'abgeschlossen': ['ABGESCHLOSSEN'],
      };
      const statuses = statusMap[activeFilter] || [];
      result = result.filter(i => statuses.includes(i.status));
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.customerName?.toLowerCase().includes(q) ||
        i.publicId?.toLowerCase().includes(q) ||
        i.location?.toLowerCase().includes(q) ||
        i.ort?.toLowerCase().includes(q) ||
        i.gridOperator?.toLowerCase().includes(q)
      );
    }

    setFilteredData(result);
  }, [searchQuery, activeFilter, installations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const renderItem = ({ item }) => {
    const statusConfig = getStatusConfig(item.status);
    const anlagentypConfig = getAnlagentypConfig(item.anlagentyp);
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('InstallationDetail', { id: item.id, installation: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: `${anlagentypConfig.color}15` }]}>
            <Ionicons name={anlagentypConfig.icon} size={22} color={anlagentypConfig.color} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.customerName || 'Unbekannt'}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {item.publicId}
            </Text>
          </View>
          <Badge 
            text={statusConfig.label} 
            color={statusConfig.color} 
            size="sm"
          />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Ionicons name="location-outline" size={16} color={theme.textMuted} />
            <Text style={styles.cardRowText}>{item.location || item.ort || '-'}</Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="business-outline" size={16} color={theme.textMuted} />
            <Text style={styles.cardRowText}>{item.gridOperator || '-'}</Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.textMuted} />
            <Text style={styles.cardRowText}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.cardFooterText}>Details</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Loading fullScreen text="Anlagen werden geladen..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Anlagen</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('Wizard')}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={theme.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Suchen..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
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

      {/* Results Count */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>{filteredData.length} Anlagen</Text>
      </View>

      {/* List */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState 
            icon="layers-outline" 
            title="Keine Anlagen gefunden" 
            description={searchQuery ? 'Versuchen Sie andere Suchbegriffe' : 'Erstellen Sie Ihre erste Anlage'}
            action={!searchQuery ? () => navigation.navigate('Wizard') : undefined}
            actionLabel={!searchQuery ? 'Neue Anlage' : undefined}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: theme.text,
  },
  filterContainer: {
    marginTop: 16,
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
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.textMuted,
  },
  cardBody: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardRowText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cardFooterText: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '500',
    marginRight: 4,
  },
});
