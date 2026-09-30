// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface UeberwachteAnwendungen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    name?: string;
    beschreibung?: string;
    umgebung?: LookupValue;
    laufzeit?: LookupValue;
    version?: string;
    verantwortlicher_vorname?: string;
    verantwortlicher_nachname?: string;
    status?: LookupValue;
  };
}

export interface Schwellenwerte {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    anwendung?: string; // applookup -> URL zu 'UeberwachteAnwendungen' Record
    metrik?: LookupValue;
    einheit?: string;
    warngrenze?: number;
    kritische_grenze?: number;
    notizen?: string;
  };
}

export interface Messungen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    anwendung?: string; // applookup -> URL zu 'UeberwachteAnwendungen' Record
    zeitpunkt?: string; // Format: YYYY-MM-DD oder ISO String
    cpu_auslastung?: number;
    heap_speicher_mb?: number;
    gesamtspeicher_mb?: number;
    event_loop_verzoegerung_ms?: number;
    antwortzeit_ms?: number;
    aktive_anfragen?: number;
    fehleranzahl?: number;
    bewertung?: LookupValue;
    notizen?: string;
  };
}

export const APP_IDS = {
  UEBERWACHTE_ANWENDUNGEN: '6abcb50f29a4754b70822854',
  SCHWELLENWERTE: '6abcb5139d56ccbaa43e98cb',
  MESSUNGEN: '6abcb5148be783f494595865',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'ueberwachte_anwendungen': {
    umgebung: [{ key: "produktion", label: "Produktion" }, { key: "staging", label: "Staging" }, { key: "entwicklung", label: "Entwicklung" }, { key: "test", label: "Test" }],
    laufzeit: [{ key: "nodejs", label: "Node.js" }, { key: "browser", label: "Browser" }, { key: "deno", label: "Deno" }, { key: "bun", label: "Bun" }, { key: "sonstige", label: "Sonstige" }],
    status: [{ key: "aktiv", label: "Aktiv" }, { key: "pausiert", label: "Pausiert" }, { key: "archiviert", label: "Archiviert" }],
  },
  'schwellenwerte': {
    metrik: [{ key: "cpu_auslastung", label: "CPU-Auslastung" }, { key: "heap_speicher", label: "Heap-Speicher" }, { key: "gesamtspeicher", label: "Gesamtspeicher" }, { key: "event_loop_verzoegerung", label: "Event-Loop-Verzögerung" }, { key: "antwortzeit", label: "Antwortzeit" }, { key: "fehleranzahl", label: "Fehleranzahl" }],
  },
  'messungen': {
    bewertung: [{ key: "ok", label: "OK" }, { key: "warnung", label: "Warnung" }, { key: "kritisch", label: "Kritisch" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'ueberwachte_anwendungen': {
    'name': 'string/text',
    'beschreibung': 'string/textarea',
    'umgebung': 'lookup/radio',
    'laufzeit': 'lookup/select',
    'version': 'string/text',
    'verantwortlicher_vorname': 'string/text',
    'verantwortlicher_nachname': 'string/text',
    'status': 'lookup/select',
  },
  'schwellenwerte': {
    'anwendung': 'applookup/select',
    'metrik': 'lookup/select',
    'einheit': 'string/text',
    'warngrenze': 'number',
    'kritische_grenze': 'number',
    'notizen': 'string/textarea',
  },
  'messungen': {
    'anwendung': 'applookup/select',
    'zeitpunkt': 'date/datetimeminute',
    'cpu_auslastung': 'number',
    'heap_speicher_mb': 'number',
    'gesamtspeicher_mb': 'number',
    'event_loop_verzoegerung_ms': 'number',
    'antwortzeit_ms': 'number',
    'aktive_anfragen': 'number',
    'fehleranzahl': 'number',
    'bewertung': 'lookup/radio',
    'notizen': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateUeberwachteAnwendungen = StripLookup<UeberwachteAnwendungen['fields']>;
export type CreateSchwellenwerte = StripLookup<Schwellenwerte['fields']>;
export type CreateMessungen = StripLookup<Messungen['fields']>;