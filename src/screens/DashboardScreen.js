/**
 * LECA Enterprise Mobile - Dashboard Screen
 * Premium Enterprise Overview
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi } from '../api/client';
import { Card, KpiCard, Loading, EmptyState, SectionHeader, Avatar, Badge, StatusBadge, Skeleton } from '../components/ui';
import theme, { getStatusConfig, getAnlagentypConfig } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { user, companyName, whiteLabelConfig } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const brandColor = whiteLabelConfig?.primaryColor || theme.primary;

  const loadData = useCallback(async () => {
    try {
      const summary = await dashboardApi.getSummary();
      
      setStats({
        total: summary.totalInstallations || 0,
        offen: summary.openNetRegistrations || 0,
        pipeline: summary.pipeline || [],
        avgStartHours: summary.avgStartHours,
        lastActivityLabel: summary.lastActivityLabel,
      });
      
      setActivities((summary.activities || []).slice(0, 5));
    } catch (error) {
      console.error('[Dashboard] Load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const getPipelineCount = (key) => {
    return stats?.pipeline?.find(p => p.key === key)?.count || 0;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Skeleton width={200} height={32} />
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.kpiGrid}>
            <Skeleton width={(SCREEN_WIDTH - 52) / 2} height={130} borderRadius={16} />
            <Skeleton width={(SCREEN_WIDTH - 52) / 2} height={130} borderRadius={16} />
          </View>
          <View style={[styles.kpiGrid, { marginTop: 12 }]}>
            <Skeleton width={(SCREEN_WIDTH - 52) / 2} height={130} borderRadius={16} />
            <Skeleton width={(SCREEN_WIDTH - 52) / 2} height={130} borderRadius={16} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Willkommen zurück,</Text>
          <Text style={styles.userName}>{user?.name || user?.email?.split('@')[0] || 'Benutzer'}</Text>
          {companyName !== 'Baunity' && (
            <Text style={styles.companyName}>{companyName}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Mehr')}>
          <Avatar name={user?.name || user?.email} size={48} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={brandColor}
            colors={[brandColor]}
          />
        }
      >
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction} 
            onPress={() => navigation.navigate('Wizard')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: `${brandColor}20` }]}>
              <Ionicons name="add-circle-outline" size={24} color={brandColor} />
            </View>
            <Text style={styles.quickActionText}>Neue Anlage</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('Scanner')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: `${theme.secondary}20` }]}>
              <Ionicons name="scan-outline" size={24} color={theme.secondary} />
            </View>
            <Text style={styles.quickActionText}>Scanner</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('Dokumente')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: `${theme.accent}20` }]}>
              <Ionicons name="document-text-outline" size={24} color={theme.accent} />
            </View>
            <Text style={styles.quickActionText}>Dokumente</Text>
          </TouchableOpacity>
        </View>

        {/* KPI Grid */}
        <SectionHeader title="Pipeline Übersicht" />
        <View style={styles.kpiGrid}>
          <KpiCard 
            title="Gesamt" 
            value={stats?.total ?? 0} 
            icon="layers-outline" 
            color={brandColor}
            onPress={() => navigation.navigate('Anlagen')}
          />
          <KpiCard 
            title="Offen" 
            value={stats?.offen ?? 0} 
            icon="time-outline" 
            color={theme.secondary}
            subtitle={stats?.lastActivityLabel}
          />
        </View>
        
        <View style={[styles.kpiGrid, { marginTop: 12 }]}>
          <KpiCard 
            title="In Prüfung" 
            value={getPipelineCount('pruefung')} 
            icon="search-outline" 
            color="#8B5CF6"
          />
          <KpiCard 
            title="Beim NB" 
            value={getPipelineCount('warten_nb')} 
            icon="business-outline" 
            color={theme.accent}
          />
        </View>

        <View style={[styles.kpiGrid, { marginTop: 12 }]}>
          <KpiCard 
            title="Genehmigt" 
            value={getPipelineCount('genehmigt')} 
            icon="checkmark-circle-outline" 
            color={theme.success}
          />
          <KpiCard 
            title="Abgeschlossen" 
            value={getPipelineCount('abgeschlossen')} 
            icon="checkmark-done-outline" 
            color="#10B981"
          />
        </View>

        {/* Performance Insights */}
        {stats?.avgStartHours && (
          <Card style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="analytics-outline" size={20} color={theme.secondary} />
              <Text style={styles.insightTitle}>Performance</Text>
            </View>
            <Text style={styles.insightValue}>
              Ø {stats.avgStartHours < 24 ? `${stats.avgStartHours}h` : `${Math.round(stats.avgStartHours / 24)}d`}
            </Text>
            <Text style={styles.insightLabel}>Durchschnittliche Bearbeitungszeit</Text>
          </Card>
        )}

        {/* Recent Activities */}
        <SectionHeader 
          title="Aktuelle Anlagen" 
          actionText="Alle anzeigen" 
          onAction={() => navigation.navigate('Anlagen')} 
          style={{ marginTop: 24 }}
        />
        
        {activities.length === 0 ? (
          <EmptyState 
            icon="layers-outline" 
            title="Keine Anlagen" 
            description="Erstellen Sie Ihre erste Anlage"
            action={() => navigation.navigate('Wizard')}
            actionLabel="Neue Anlage"
          />
        ) : (
          activities.map((item) => {
            const statusConfig = getStatusConfig(item.status);
            return (
              <TouchableOpacity 
                key={item.id} 
                style={styles.activityCard}
                onPress={() => navigation.navigate('InstallationDetail', { id: item.id })}
                activeOpacity={0.7}
              >
                <View style={styles.activityIcon}>
                  <Ionicons name="sunny-outline" size={24} color={brandColor} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName} numberOfLines={1}>
                    {item.customerName || 'Unbekannt'}
                  </Text>
                  <Text style={styles.activityLocation} numberOfLines={1}>
                    {item.location || item.gridOperator || '-'}
                  </Text>
                </View>
                <View style={styles.activityRight}>
                  <Badge 
                    text={statusConfig.label} 
                    color={statusConfig.color}
                    size="sm"
                  />
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
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
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
  },
  companyName: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  insightCard: {
    marginTop: 16,
    backgroundColor: `${theme.secondary}10`,
    borderColor: `${theme.secondary}30`,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 14,
    color: theme.secondary,
    fontWeight: '600',
    marginLeft: 8,
  },
  insightValue: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  insightLabel: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${theme.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
    marginRight: 12,
  },
  activityName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  activityLocation: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
});
