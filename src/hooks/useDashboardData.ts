import { useState, useEffect, useMemo, useCallback } from 'react';
import type { UeberwachteAnwendungen, Schwellenwerte, Messungen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [ueberwachteAnwendungen, setUeberwachteAnwendungen] = useState<UeberwachteAnwendungen[]>([]);
  const [schwellenwerte, setSchwellenwerte] = useState<Schwellenwerte[]>([]);
  const [messungen, setMessungen] = useState<Messungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [ueberwachteAnwendungenData, schwellenwerteData, messungenData] = await Promise.all([
        LivingAppsService.getUeberwachteAnwendungen(),
        LivingAppsService.getSchwellenwerte(),
        LivingAppsService.getMessungen(),
      ]);
      setUeberwachteAnwendungen(ueberwachteAnwendungenData);
      setSchwellenwerte(schwellenwerteData);
      setMessungen(messungenData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [ueberwachteAnwendungenData, schwellenwerteData, messungenData] = await Promise.all([
          LivingAppsService.getUeberwachteAnwendungen(),
          LivingAppsService.getSchwellenwerte(),
          LivingAppsService.getMessungen(),
        ]);
        setUeberwachteAnwendungen(ueberwachteAnwendungenData);
        setSchwellenwerte(schwellenwerteData);
        setMessungen(messungenData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const ueberwachteAnwendungenMap = useMemo(() => {
    const m = new Map<string, UeberwachteAnwendungen>();
    ueberwachteAnwendungen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [ueberwachteAnwendungen]);

  return { ueberwachteAnwendungen, setUeberwachteAnwendungen, schwellenwerte, setSchwellenwerte, messungen, setMessungen, loading, error, fetchAll, ueberwachteAnwendungenMap };
}