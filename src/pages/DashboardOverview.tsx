import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichSchwellenwerte, enrichMessungen } from '@/lib/enrich';
import type { EnrichedMessungen } from '@/types/enriched';
import type { UeberwachteAnwendungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { IconAlertCircle, IconTool, IconRefresh, IconCheck, IconPlus, IconPencil, IconTrash, IconActivity, IconCpu, IconServer, IconClock, IconAlertTriangle, IconCircleCheck, IconCircleX, IconChartLine, IconSettings } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { UeberwachteAnwendungenDialog } from '@/components/dialogs/UeberwachteAnwendungenDialog';
import { MessungenDialog } from '@/components/dialogs/MessungenDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

const APPGROUP_ID = '6abcb5213caf3075d72bd786';
const REPAIR_ENDPOINT = '/claude/build/repair';

export default function DashboardOverview() {
  const {
    ueberwachteAnwendungen, schwellenwerte, messungen,
    ueberwachteAnwendungenMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedSchwellenwerte = enrichSchwellenwerte(schwellenwerte, { ueberwachteAnwendungenMap });
  const enrichedMessungen = enrichMessungen(messungen, { ueberwachteAnwendungenMap });

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [editApp, setEditApp] = useState<UeberwachteAnwendungen | null>(null);
  const [deleteAppTarget, setDeleteAppTarget] = useState<UeberwachteAnwendungen | null>(null);
  const [messungDialogOpen, setMessungDialogOpen] = useState(false);
  const [editMessung, setEditMessung] = useState<EnrichedMessungen | null>(null);
  const [deleteMessungTarget, setDeleteMessungTarget] = useState<EnrichedMessungen | null>(null);
  const [activeMetric, setActiveMetric] = useState<'cpu' | 'heap' | 'antwortzeit' | 'fehler'>('cpu');

  const selectedApp = useMemo(
    () => ueberwachteAnwendungen.find(a => a.record_id === selectedAppId) ?? (ueberwachteAnwendungen[0] ?? null),
    [ueberwachteAnwendungen, selectedAppId]
  );

  const effectiveSelectedId = selectedApp?.record_id ?? null;

  const appMessungen = useMemo(
    () => enrichedMessungen
      .filter(m => extractRecordId(m.fields.anwendung) === effectiveSelectedId)
      .sort((a, b) => (a.fields.zeitpunkt ?? '').localeCompare(b.fields.zeitpunkt ?? '')),
    [enrichedMessungen, effectiveSelectedId]
  );

  const appSchwellenwerte = useMemo(
    () => enrichedSchwellenwerte.filter(s => extractRecordId(s.fields.anwendung) === effectiveSelectedId),
    [enrichedSchwellenwerte, effectiveSelectedId]
  );

  const latestMessung = appMessungen[appMessungen.length - 1];

  const chartData = useMemo(() => appMessungen.slice(-20).map(m => ({
    time: m.fields.zeitpunkt ? format(parseISO(m.fields.zeitpunkt), 'dd.MM HH:mm', { locale: de }) : '—',
    cpu: m.fields.cpu_auslastung ?? null,
    heap: m.fields.heap_speicher_mb ?? null,
    antwortzeit: m.fields.antwortzeit_ms ?? null,
    fehler: m.fields.fehleranzahl ?? null,
    bewertung: m.fields.bewertung?.key ?? 'ok',
  })), [appMessungen]);

  // KPIs über alle Apps
  const totalApps = ueberwachteAnwendungen.length;
  const activeApps = ueberwachteAnwendungen.filter(a => a.fields.status?.key === 'aktiv').length;
  const kritischeMessungen = enrichedMessungen.filter(m => m.fields.bewertung?.key === 'kritisch').length;
  const warnungMessungen = enrichedMessungen.filter(m => m.fields.bewertung?.key === 'warnung').length;

  const getStatusBadge = (app: UeberwachteAnwendungen) => {
    const key = app.fields.status?.key;
    if (key === 'aktiv') return <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />;
    if (key === 'pausiert') return <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />;
    return <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />;
  };

  const getBewertungColor = (key?: string) => {
    if (key === 'ok') return 'text-green-600 bg-green-50';
    if (key === 'warnung') return 'text-yellow-700 bg-yellow-50';
    if (key === 'kritisch') return 'text-red-600 bg-red-50';
    return 'text-muted-foreground bg-muted';
  };

  const metricConfig = {
    cpu:        { label: 'CPU-Auslastung', unit: '%', color: 'var(--primary)', dataKey: 'cpu' },
    heap:       { label: 'Heap-Speicher', unit: 'MB', color: '#8b5cf6', dataKey: 'heap' },
    antwortzeit:{ label: 'Antwortzeit', unit: 'ms', color: '#f59e0b', dataKey: 'antwortzeit' },
    fehler:     { label: 'Fehleranzahl', unit: '', color: '#ef4444', dataKey: 'fehler' },
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* KPI-Leiste */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border bg-card p-4 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Anwendungen</span>
          <span className="text-3xl font-700 text-foreground">{totalApps}</span>
          <span className="text-xs text-muted-foreground">{activeApps} aktiv</span>
        </div>
        <div className="rounded-2xl border bg-card p-4 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Messungen</span>
          <span className="text-3xl font-700 text-foreground">{messungen.length}</span>
          <span className="text-xs text-muted-foreground">gesamt erfasst</span>
        </div>
        <div className="rounded-2xl border bg-card p-4 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Warnungen</span>
          <span className="text-3xl font-700 text-yellow-600">{warnungMessungen}</span>
          <span className="text-xs text-muted-foreground">Messungen mit Warnung</span>
        </div>
        <div className="rounded-2xl border bg-card p-4 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Kritisch</span>
          <span className="text-3xl font-700 text-red-600">{kritischeMessungen}</span>
          <span className="text-xs text-muted-foreground">Messungen kritisch</span>
        </div>
      </div>

      {/* Haupt-Workspace: Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start">
        {/* Linke Spalte: Anwendungs-Liste */}
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold text-sm">Anwendungen</span>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setEditApp(null); setAppDialogOpen(true); }}>
              <IconPlus size={14} className="shrink-0" />
            </Button>
          </div>
          {ueberwachteAnwendungen.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 px-4 text-center">
              <IconServer size={36} className="text-muted-foreground" stroke={1.5} />
              <p className="text-sm text-muted-foreground">Noch keine Anwendungen erfasst.</p>
              <Button size="sm" onClick={() => { setEditApp(null); setAppDialogOpen(true); }}>
                <IconPlus size={14} className="mr-1 shrink-0" /> Anwendung hinzufügen
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {ueberwachteAnwendungen.map(app => (
                <li
                  key={app.record_id}
                  className={`px-4 py-3 cursor-pointer transition-colors hover:bg-accent/50 ${app.record_id === effectiveSelectedId ? 'bg-primary/8' : ''}`}
                  onClick={() => setSelectedAppId(app.record_id)}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="mt-1.5">{getStatusBadge(app)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{app.fields.name ?? '—'}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {app.fields.umgebung && (
                          <Badge variant="outline" className="text-xs py-0 px-1.5 h-4">{app.fields.umgebung.label}</Badge>
                        )}
                        {app.fields.laufzeit && (
                          <span className="text-xs text-muted-foreground">{app.fields.laufzeit.label}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        onClick={e => { e.stopPropagation(); setEditApp(app); setAppDialogOpen(true); }}
                        title="Bearbeiten"
                      >
                        <IconPencil size={13} />
                      </button>
                      <button
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={e => { e.stopPropagation(); setDeleteAppTarget(app); }}
                        title="Löschen"
                      >
                        <IconTrash size={13} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Rechte Spalte: Detail-View */}
        {selectedApp ? (
          <div className="space-y-4">
            {/* App-Header */}
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap gap-3 items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-700 truncate">{selectedApp.fields.name ?? '—'}</h2>
                    {selectedApp.fields.status && (
                      <Badge className={`text-xs ${selectedApp.fields.status.key === 'aktiv' ? 'bg-green-100 text-green-700 hover:bg-green-100' : selectedApp.fields.status.key === 'pausiert' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' : 'bg-muted text-muted-foreground hover:bg-muted'}`}>
                        {selectedApp.fields.status.label}
                      </Badge>
                    )}
                  </div>
                  {selectedApp.fields.beschreibung && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{selectedApp.fields.beschreibung}</p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                    {selectedApp.fields.umgebung && <span>Umgebung: <strong className="text-foreground">{selectedApp.fields.umgebung.label}</strong></span>}
                    {selectedApp.fields.laufzeit && <span>Laufzeit: <strong className="text-foreground">{selectedApp.fields.laufzeit.label}</strong></span>}
                    {selectedApp.fields.version && <span>Version: <strong className="text-foreground">{selectedApp.fields.version}</strong></span>}
                    {(selectedApp.fields.verantwortlicher_vorname || selectedApp.fields.verantwortlicher_nachname) && (
                      <span>Verantwortlich: <strong className="text-foreground">{[selectedApp.fields.verantwortlicher_vorname, selectedApp.fields.verantwortlicher_nachname].filter(Boolean).join(' ')}</strong></span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => { setEditApp(selectedApp); setAppDialogOpen(true); }}>
                    <IconSettings size={14} className="mr-1 shrink-0" /> Einstellungen
                  </Button>
                  <Button size="sm" onClick={() => { setEditMessung(null); setMessungDialogOpen(true); }}>
                    <IconPlus size={14} className="mr-1 shrink-0" /> Messung erfassen
                  </Button>
                </div>
              </div>
            </div>

            {/* Letzte Messung KPIs */}
            {latestMessung && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard
                  label="CPU"
                  value={latestMessung.fields.cpu_auslastung != null ? `${latestMessung.fields.cpu_auslastung}%` : '—'}
                  icon={<IconCpu size={16} className="text-primary shrink-0" />}
                  sub={`Stand: ${formatDate(latestMessung.fields.zeitpunkt?.slice(0, 10))}`}
                />
                <MetricCard
                  label="Heap-Speicher"
                  value={latestMessung.fields.heap_speicher_mb != null ? `${latestMessung.fields.heap_speicher_mb} MB` : '—'}
                  icon={<IconServer size={16} className="text-purple-500 shrink-0" />}
                  sub={latestMessung.fields.gesamtspeicher_mb != null ? `von ${latestMessung.fields.gesamtspeicher_mb} MB` : ''}
                />
                <MetricCard
                  label="Antwortzeit"
                  value={latestMessung.fields.antwortzeit_ms != null ? `${latestMessung.fields.antwortzeit_ms} ms` : '—'}
                  icon={<IconClock size={16} className="text-amber-500 shrink-0" />}
                  sub={latestMessung.fields.event_loop_verzoegerung_ms != null ? `Loop: ${latestMessung.fields.event_loop_verzoegerung_ms} ms` : ''}
                />
                <MetricCard
                  label="Fehler"
                  value={latestMessung.fields.fehleranzahl != null ? String(latestMessung.fields.fehleranzahl) : '—'}
                  icon={<IconAlertTriangle size={16} className="text-red-500 shrink-0" />}
                  sub={latestMessung.fields.aktive_anfragen != null ? `${latestMessung.fields.aktive_anfragen} aktive Anfragen` : ''}
                />
              </div>
            )}

            {/* Chart */}
            {chartData.length > 0 && (
              <div className="rounded-2xl border bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b flex-wrap">
                  <IconChartLine size={16} className="text-muted-foreground shrink-0" />
                  <span className="font-semibold text-sm flex-1">Verlauf</span>
                  <div className="flex gap-1 flex-wrap">
                    {(Object.keys(metricConfig) as (keyof typeof metricConfig)[]).map(k => (
                      <button
                        key={k}
                        onClick={() => setActiveMetric(k)}
                        className={`text-xs px-2.5 py-1 rounded-full transition-colors ${activeMetric === k ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                      >
                        {metricConfig[k].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={metricConfig[activeMetric].color} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={metricConfig[activeMetric].color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="time" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                      <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} width={45} unit={metricConfig[activeMetric].unit} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                        formatter={(val: number) => [`${val} ${metricConfig[activeMetric].unit}`, metricConfig[activeMetric].label]}
                      />
                      <Area
                        type="monotone"
                        dataKey={metricConfig[activeMetric].dataKey}
                        stroke={metricConfig[activeMetric].color}
                        strokeWidth={2}
                        fill="url(#metricGrad)"
                        dot={false}
                        connectNulls
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Schwellenwerte */}
            {appSchwellenwerte.length > 0 && (
              <div className="rounded-2xl border bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b">
                  <IconActivity size={16} className="text-muted-foreground shrink-0" />
                  <span className="font-semibold text-sm">Schwellenwerte</span>
                </div>
                <div className="divide-y">
                  {appSchwellenwerte.map(s => (
                    <div key={s.record_id} className="px-5 py-3 flex flex-wrap gap-2 items-center">
                      <span className="text-sm font-medium min-w-0">{s.fields.metrik?.label ?? '—'}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        Warnung: <strong className="text-yellow-600">{s.fields.warngrenze ?? '—'}{s.fields.einheit ? ` ${s.fields.einheit}` : ''}</strong>
                        {' · '}
                        Kritisch: <strong className="text-red-600">{s.fields.kritische_grenze ?? '—'}{s.fields.einheit ? ` ${s.fields.einheit}` : ''}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messungs-Tabelle */}
            <div className="rounded-2xl border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b">
                <span className="font-semibold text-sm">Messungshistorie ({appMessungen.length})</span>
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setEditMessung(null); setMessungDialogOpen(true); }}>
                  <IconPlus size={14} className="shrink-0" />
                </Button>
              </div>
              {appMessungen.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                  <IconActivity size={36} className="text-muted-foreground" stroke={1.5} />
                  <p className="text-sm text-muted-foreground">Noch keine Messungen für diese Anwendung.</p>
                  <Button size="sm" onClick={() => { setEditMessung(null); setMessungDialogOpen(true); }}>
                    <IconPlus size={14} className="mr-1 shrink-0" /> Messung erfassen
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                        <th className="px-4 py-2 text-left font-medium">Zeitpunkt</th>
                        <th className="px-4 py-2 text-right font-medium">CPU %</th>
                        <th className="px-4 py-2 text-right font-medium">Heap MB</th>
                        <th className="px-4 py-2 text-right font-medium">Antwortzeit ms</th>
                        <th className="px-4 py-2 text-right font-medium">Fehler</th>
                        <th className="px-4 py-2 text-left font-medium">Bewertung</th>
                        <th className="px-4 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[...appMessungen].reverse().slice(0, 30).map(m => (
                        <tr key={m.record_id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                            {m.fields.zeitpunkt ? format(parseISO(m.fields.zeitpunkt), 'dd.MM.yy HH:mm', { locale: de }) : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{m.fields.cpu_auslastung ?? '—'}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{m.fields.heap_speicher_mb ?? '—'}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{m.fields.antwortzeit_ms ?? '—'}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{m.fields.fehleranzahl ?? '—'}</td>
                          <td className="px-4 py-2.5">
                            {m.fields.bewertung ? (
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${getBewertungColor(m.fields.bewertung.key)}`}>
                                {m.fields.bewertung.key === 'ok' && <IconCircleCheck size={12} className="shrink-0" />}
                                {m.fields.bewertung.key === 'warnung' && <IconAlertTriangle size={12} className="shrink-0" />}
                                {m.fields.bewertung.key === 'kritisch' && <IconCircleX size={12} className="shrink-0" />}
                                {m.fields.bewertung.label}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex gap-1 justify-end">
                              <button
                                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => { setEditMessung(m); setMessungDialogOpen(true); }}
                                title="Bearbeiten"
                              >
                                <IconPencil size={13} />
                              </button>
                              <button
                                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                onClick={() => setDeleteMessungTarget(m)}
                                title="Löschen"
                              >
                                <IconTrash size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card flex flex-col items-center justify-center py-20 gap-3 text-center">
            <IconServer size={48} className="text-muted-foreground" stroke={1.5} />
            <p className="text-sm text-muted-foreground">Wähle eine Anwendung aus, um Details und Metriken zu sehen.</p>
            <Button size="sm" onClick={() => { setEditApp(null); setAppDialogOpen(true); }}>
              <IconPlus size={14} className="mr-1 shrink-0" /> Anwendung hinzufügen
            </Button>
          </div>
        )}
      </div>

      {/* Dialoge */}
      <UeberwachteAnwendungenDialog
        open={appDialogOpen}
        onClose={() => { setAppDialogOpen(false); setEditApp(null); }}
        onSubmit={async (fields) => {
          if (editApp) {
            await LivingAppsService.updateUeberwachteAnwendungenEntry(editApp.record_id, fields);
          } else {
            await LivingAppsService.createUeberwachteAnwendungenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editApp?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['UeberwachteAnwendungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['UeberwachteAnwendungen']}
      />

      <MessungenDialog
        open={messungDialogOpen}
        onClose={() => { setMessungDialogOpen(false); setEditMessung(null); }}
        onSubmit={async (fields) => {
          if (editMessung) {
            await LivingAppsService.updateMessungenEntry(editMessung.record_id, fields);
          } else {
            await LivingAppsService.createMessungenEntry({
              ...fields,
              anwendung: effectiveSelectedId ? createRecordUrl(APP_IDS.UEBERWACHTE_ANWENDUNGEN, effectiveSelectedId) : fields.anwendung,
            });
          }
          fetchAll();
        }}
        defaultValues={editMessung ? editMessung.fields : (effectiveSelectedId ? { anwendung: createRecordUrl(APP_IDS.UEBERWACHTE_ANWENDUNGEN, effectiveSelectedId) } : undefined)}
        ueberwachte_anwendungenList={ueberwachteAnwendungen}
        enablePhotoScan={AI_PHOTO_SCAN['Messungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Messungen']}
      />

      <ConfirmDialog
        open={!!deleteAppTarget}
        title="Anwendung löschen"
        description={`Soll die Anwendung "${deleteAppTarget?.fields.name ?? ''}" wirklich gelöscht werden?`}
        onConfirm={async () => {
          if (!deleteAppTarget) return;
          await LivingAppsService.deleteUeberwachteAnwendungenEntry(deleteAppTarget.record_id);
          if (selectedAppId === deleteAppTarget.record_id) setSelectedAppId(null);
          setDeleteAppTarget(null);
          fetchAll();
        }}
        onClose={() => setDeleteAppTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteMessungTarget}
        title="Messung löschen"
        description="Soll diese Messung wirklich gelöscht werden?"
        onConfirm={async () => {
          if (!deleteMessungTarget) return;
          await LivingAppsService.deleteMessungenEntry(deleteMessungTarget.record_id);
          setDeleteMessungTarget(null);
          fetchAll();
        }}
        onClose={() => setDeleteMessungTarget(null)}
      />
    </div>
  );
}

function MetricCard({ label, value, icon, sub }: { label: string; value: string; icon: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 flex flex-col gap-1 overflow-hidden">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <span className="text-2xl font-700 truncate">{value}</span>
      {sub && <span className="text-xs text-muted-foreground truncate">{sub}</span>}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
