import type { Messungen, Schwellenwerte } from './app';

export type EnrichedSchwellenwerte = Schwellenwerte & {
  anwendungName: string;
};

export type EnrichedMessungen = Messungen & {
  anwendungName: string;
};
