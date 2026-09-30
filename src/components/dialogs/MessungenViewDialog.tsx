import type { Messungen, UeberwachteAnwendungen } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface MessungenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Messungen | null;
  onEdit: (record: Messungen) => void;
  ueberwachte_anwendungenList: UeberwachteAnwendungen[];
}

export function MessungenViewDialog({ open, onClose, record, onEdit, ueberwachte_anwendungenList }: MessungenViewDialogProps) {
  function getUeberwachteAnwendungenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return ueberwachte_anwendungenList.find(r => r.record_id === id)?.fields.name ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Messungen anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anwendung</Label>
            <p className="text-sm">{getUeberwachteAnwendungenDisplayName(record.fields.anwendung)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zeitpunkt der Messung</Label>
            <p className="text-sm">{formatDate(record.fields.zeitpunkt)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">CPU-Auslastung (%)</Label>
            <p className="text-sm">{record.fields.cpu_auslastung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Heap-Speicher (MB)</Label>
            <p className="text-sm">{record.fields.heap_speicher_mb ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gesamtspeicher (MB)</Label>
            <p className="text-sm">{record.fields.gesamtspeicher_mb ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Event-Loop-Verzögerung (ms)</Label>
            <p className="text-sm">{record.fields.event_loop_verzoegerung_ms ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Antwortzeit (ms)</Label>
            <p className="text-sm">{record.fields.antwortzeit_ms ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anzahl aktiver Anfragen</Label>
            <p className="text-sm">{record.fields.aktive_anfragen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Fehleranzahl</Label>
            <p className="text-sm">{record.fields.fehleranzahl ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bewertung</Label>
            <Badge variant="secondary">{record.fields.bewertung?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notizen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.notizen ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}