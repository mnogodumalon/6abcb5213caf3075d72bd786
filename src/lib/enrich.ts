import type { EnrichedMessungen, EnrichedSchwellenwerte } from '@/types/enriched';
import type { Messungen, Schwellenwerte, UeberwachteAnwendungen } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface SchwellenwerteMaps {
  ueberwachteAnwendungenMap: Map<string, UeberwachteAnwendungen>;
}

export function enrichSchwellenwerte(
  schwellenwerte: Schwellenwerte[],
  maps: SchwellenwerteMaps
): EnrichedSchwellenwerte[] {
  return schwellenwerte.map(r => ({
    ...r,
    anwendungName: resolveDisplay(r.fields.anwendung, maps.ueberwachteAnwendungenMap, 'name'),
  }));
}

interface MessungenMaps {
  ueberwachteAnwendungenMap: Map<string, UeberwachteAnwendungen>;
}

export function enrichMessungen(
  messungen: Messungen[],
  maps: MessungenMaps
): EnrichedMessungen[] {
  return messungen.map(r => ({
    ...r,
    anwendungName: resolveDisplay(r.fields.anwendung, maps.ueberwachteAnwendungenMap, 'name'),
  }));
}
