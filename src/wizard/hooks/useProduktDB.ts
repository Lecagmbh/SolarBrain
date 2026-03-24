/**
 * Baunity Wizard - useProduktDB Hook
 * Initialisiert und verwaltet den Produkt-Cache
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api/client';
import { produktCache, type ProduktTyp, type Produkt, syncProduktZuDB, type SyncResult } from '../lib/intelligence/produktSync';

interface UseProduktDBResult {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  stats: {
    pvModule: number;
    wechselrichter: number;
    speicher: number;
    wallboxen: number;
    waermepumpen: number;
    hersteller: number;
  };
  refresh: () => Promise<void>;
  syncProduct: (typ: ProduktTyp, daten: Partial<Produkt>, datenblattFile?: File) => Promise<SyncResult>;
}

export function useProduktDB(): UseProduktDBResult {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    pvModule: 0,
    wechselrichter: 0,
    speicher: 0,
    wallboxen: 0,
    waermepumpen: 0,
    hersteller: 0,
  });
  
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await produktCache.refresh(api);
      
      // Stats aktualisieren
      setStats({
        pvModule: (produktCache.get('pvModule') || []).length,
        wechselrichter: (produktCache.get('wechselrichter') || []).length,
        speicher: (produktCache.get('speicher') || []).length,
        wallboxen: (produktCache.get('wallboxen') || []).length,
        waermepumpen: (produktCache.get('waermepumpen') || []).length,
        hersteller: (produktCache.getHersteller() || []).length,
      });
      
      setIsReady(true);
    } catch (err) {
      console.error('ProduktDB refresh error:', err);
      setError('Produktdatenbank konnte nicht geladen werden');
      // Trotzdem als "ready" markieren - der Wizard funktioniert auch ohne DB
      setIsReady(true);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Initial laden
  useEffect(() => {
    refresh();
  }, [refresh]);
  
  // Auto-Refresh wenn Cache stale
  useEffect(() => {
    const interval = setInterval(() => {
      if (produktCache.isStale()) {
        refresh();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [refresh]);
  
  // Sync-Funktion für bidirektionale Synchronisation
  const syncProduct = useCallback(async (
    typ: ProduktTyp,
    daten: Partial<Produkt>,
    datenblattFile?: File
  ): Promise<SyncResult> => {
    return syncProduktZuDB(api, typ, daten, datenblattFile);
  }, []);
  
  return {
    isLoading,
    isReady,
    error,
    stats,
    refresh,
    syncProduct,
  };
}

export default useProduktDB;
