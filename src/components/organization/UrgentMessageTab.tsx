import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Megaphone, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useUrgentMessage } from '@/hooks/useUrgentMessage';
import type { OrganizationPageType } from '@/types/organization';
import { cn } from '@/lib/utils';

interface Props {
  pageType: OrganizationPageType;
  pageId: string;
  canEdit: boolean;
  /** Default datetime ISO if known (event_date or birthday). */
  defaultEventAt?: string | null;
}

const MAX = 280;

/** Convert ISO -> "YYYY-MM-DDTHH:mm" for <input type=datetime-local>. */
const toLocalInput = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const UrgentMessageTab = ({ pageType, pageId, canEdit, defaultEventAt }: Props) => {
  const { data, loading, saving, save, deactivate } = useUrgentMessage(pageType, pageId);
  const [message, setMessage] = useState('');
  const [withDate, setWithDate] = useState(false);
  const [localDt, setLocalDt] = useState('');

  useEffect(() => {
    if (data) {
      setMessage(data.message);
      setWithDate(!!data.event_at);
      setLocalDt(toLocalInput(data.event_at));
    } else {
      setMessage('');
      setWithDate(!!defaultEventAt);
      setLocalDt(toLocalInput(defaultEventAt));
    }
  }, [data, defaultEventAt]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSave = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      toast.error('Écris un message avant d\'enregistrer');
      return;
    }
    let iso: string | null = null;
    if (withDate) {
      if (!localDt) {
        toast.error('Choisis la date et l\'heure de l\'événement');
        return;
      }
      const d = new Date(localDt);
      if (Number.isNaN(d.getTime())) {
        toast.error('Date invalide');
        return;
      }
      if (d.getTime() <= Date.now()) {
        toast.error('La date doit être dans le futur');
        return;
      }
      iso = d.toISOString();
    }
    const { error } = await save(trimmed, iso);
    if (error) {
      toast.error('Impossible d\'enregistrer le message');
      return;
    }
    toast.success('Message publié ✨');
  };

  const handleDelete = async () => {
    const { error } = await deactivate();
    if (error) {
      toast.error('Suppression impossible');
      return;
    }
    toast.success('Message retiré');
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 border-primary/20 bg-gradient-to-br from-secondary/30 to-background">
        <div className="flex items-start gap-2 mb-3">
          <Megaphone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <h3 className="font-poppins font-semibold text-sm">Message d'info importante</h3>
            <p className="text-xs text-muted-foreground font-nunito">
              Affiché en rouge clignotant sur ta page. Idéal pour rappeler l'heure, l'adresse, ou un changement de dernière minute.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="urgent-msg" className="text-xs">Ton message</Label>
            <Textarea
              id="urgent-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
              placeholder="Ex. RDV à 19h précises au Sofitel, dress-code blanc & or 🤍"
              rows={3}
              disabled={!canEdit}
              className="mt-1 resize-none"
            />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">
              {message.length} / {MAX}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
            <div>
              <Label htmlFor="urgent-with-date" className="text-sm">Définir une date d'expiration</Label>
              <p className="text-[11px] text-muted-foreground">
                Le message disparaît automatiquement à cette date.
              </p>
            </div>
            <Switch
              id="urgent-with-date"
              checked={withDate}
              onCheckedChange={setWithDate}
              disabled={!canEdit}
            />
          </div>

          {withDate && (
            <div>
              <Label htmlFor="urgent-dt" className="text-xs">Date et heure de l'événement</Label>
              <Input
                id="urgent-dt"
                type="datetime-local"
                value={localDt}
                onChange={(e) => setLocalDt(e.target.value)}
                disabled={!canEdit}
                className="mt-1"
              />
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
            {data && (
              <Button
                type="button"
                variant="outline"
                className="sm:flex-1 text-destructive border-destructive/40 hover:bg-destructive/5"
                onClick={handleDelete}
                disabled={!canEdit || saving}
              >
                <Trash2 className="h-4 w-4 mr-1.5" /> Retirer
              </Button>
            )}
            <Button
              type="button"
              className="sm:flex-[2]"
              onClick={handleSave}
              disabled={!canEdit || saving || !message.trim()}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Megaphone className="h-4 w-4 mr-1.5" />}
              {data ? 'Mettre à jour' : 'Publier le message'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Live preview */}
      {message.trim() && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 px-1">Aperçu sur ta page :</p>
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl border-2 border-destructive bg-destructive text-destructive-foreground shadow-lg px-4 py-3 animate-urgent-blink'
            )}
          >
            <div className="relative flex items-start gap-3">
              <div className="rounded-full bg-destructive-foreground/15 p-1.5 shrink-0 mt-0.5">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-poppins text-sm font-semibold uppercase tracking-wide opacity-90">
                  Info importante
                </p>
                <p className="font-nunito text-sm leading-snug mt-0.5 whitespace-pre-wrap break-words">
                  {message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};