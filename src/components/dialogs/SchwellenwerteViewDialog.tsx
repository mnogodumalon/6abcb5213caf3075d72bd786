import type { Schwellenwerte, UeberwachteAnwendungen } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';

interface SchwellenwerteViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Schwellenwerte | null;
  onEdit: (record: Schwellenwerte) => void;
  ueberwachte_anwendungenList: UeberwachteAnwendungen[];
}

export function SchwellenwerteViewDialog({ open, onClose, record, onEdit, ueberwachte_anwendungenList }: SchwellenwerteViewDialogProps) {
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
          <DialogTitle>Schwellenwerte anzeigen</DialogTitle>
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
            <Label className="text-xs text-muted-foreground">Metrik</Label>
            <Badge variant="secondary">{record.fields.metrik?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Einheit</Label>
            <p className="text-sm">{record.fields.einheit ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Warngrenze</Label>
            <p className="text-sm">{record.fields.warngrenze ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kritische Grenze</Label>
            <p className="text-sm">{record.fields.kritische_grenze ?? '—'}</p>
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