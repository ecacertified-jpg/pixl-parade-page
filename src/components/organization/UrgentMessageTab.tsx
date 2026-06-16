import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Megaphone, Trash2, Plus, ArrowUp, ArrowDown, Pencil, X, AlertTriangle, Bell, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  useUrgentMessages,
  type UrgentMessage,
  type UrgentPriority,
} from '@/hooks/useUrgentMessages';
import type { OrganizationPageType } from '@/types/organization';
import { cn } from '@/lib/utils';

interface Props {
  pageType: OrganizationPageType;
  pageId: string;
  canEdit: boolean;
  defaultEventAt?: string | null;
}

const MAX = 280;

const PRIORITY_LABEL: Record<UrgentPriority, string> = {
  high: '🔴 Urgent (rouge clignotant)',
  medium: '🟠 Important (orange)',
  low: '🟣 Info (violet)',
};

const PRIORITY_ICON: Record<UrgentPriority, typeof AlertTriangle> = {
  high: AlertTriangle,
  medium: Bell,
  low: Info,
};

const PRIORITY_TONE: Record<UrgentPriority, string> = {
  high: 'bg-destructive text-destructive-foreground',
  medium: 'bg-amber-500 text-white',
  low: 'bg-primary/15 text-primary',
};

const toLocalInput = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface FormState {
  message: string;
  priority: UrgentPriority;
  withDate: boolean;
  localDt: string;
}

const emptyForm = (defaultEventAt?: string | null): FormState => ({
  message: '',
  priority: 'high',
  withDate: !!defaultEventAt,
  localDt: toLocalInput(defaultEventAt),
});

export const UrgentMessageTab = ({ pageType, pageId, canEdit, defaultEventAt }: Props) => {
  const { items, loading, busy, create, update, remove, reorder } = useUrgentMessages(pageType, pageId);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(defaultEventAt));

  useEffect(() => {
    if (!showForm) setForm(emptyForm(defaultEventAt));
  }, [showForm, defaultEventAt]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(defaultEventAt));
    setShowForm(true);
  };

  const openEdit = (m: UrgentMessage) => {
    setEditingId(m.id);
    setForm({
      message: m.message,
      priority: m.priority,
      withDate: !!m.event_at,
      localDt: toLocalInput(m.event_at),
    });
    setShowForm(true);
  };

  const validate = (): { ok: true; event_at: string | null } | { ok: false } => {
    const trimmed = form.message.trim();
    if (!trimmed) { toast.error('Écris un message'); return { ok: false }; }
    let iso: string | null = null;
    if (form.withDate) {
      if (!form.localDt) { toast.error('Choisis la date / heure'); return { ok: false }; }
      const d = new Date(form.localDt);
      if (Number.isNaN(d.getTime())) { toast.error('Date invalide'); return { ok: false }; }
      if (d.getTime() <= Date.now()) { toast.error('La date doit être dans le futur'); return { ok: false }; }
      iso = d.toISOString();
    }
    return { ok: true, event_at: iso };
  };

  const submit = async () => {
    const v = validate();
    if (!v.ok) return;
    if (editingId) {
      const { error } = await update(editingId, {
        message: form.message,
        event_at: v.event_at,
        priority: form.priority,
      });
      if (error) return toast.error('Modification impossible');
      toast.success('Message mis à jour');
    } else {
      const nextOrder = (items[items.length - 1]?.display_order ?? -1) + 1;
      const { error } = await create({
        message: form.message,
        event_at: v.event_at,
        priority: form.priority,
        display_order: nextOrder,
      });
      if (error) return toast.error('Création impossible');
      toast.success('Message publié ✨');
    }
    setShowForm(false);
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 px-1">
        <div>
          <h3 className="font-poppins font-semibold text-sm flex items-center gap-1.5">
            <Megaphone className="h-4 w-4 text-primary" /> Messages d'info
          </h3>
          <p className="text-xs text-muted-foreground">
            Plusieurs messages possibles. Affichés du plus urgent au plus informatif.
          </p>
        </div>
        {canEdit && !showForm && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Ajouter
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && canEdit && (
        <Card className="p-4 border-primary/30 bg-gradient-to-br from-secondary/30 to-background space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-poppins text-sm font-semibold">
              {editingId ? 'Modifier le message' : 'Nouveau message'}
            </p>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setShowForm(false); setEditingId(null); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <Label htmlFor="urgent-prio" className="text-xs">Priorité</Label>
            <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as UrgentPriority }))}>
              <SelectTrigger id="urgent-prio" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['high', 'medium', 'low'] as UrgentPriority[]).map((p) => (
                  <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="urgent-msg" className="text-xs">Message</Label>
            <Textarea
              id="urgent-msg"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value.slice(0, MAX) }))}
              placeholder="Ex. RDV à 19h précises, dress-code blanc & or 🤍"
              rows={3}
              className="mt-1 resize-none"
            />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">{form.message.length} / {MAX}</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
            <div>
              <Label htmlFor="urgent-with-date" className="text-sm">Date d'expiration</Label>
              <p className="text-[11px] text-muted-foreground">Le message disparaît à cette date.</p>
            </div>
            <Switch
              id="urgent-with-date"
              checked={form.withDate}
              onCheckedChange={(v) => setForm((f) => ({ ...f, withDate: v }))}
            />
          </div>

          {form.withDate && (
            <div>
              <Label htmlFor="urgent-dt" className="text-xs">Date et heure</Label>
              <Input
                id="urgent-dt"
                type="datetime-local"
                value={form.localDt}
                onChange={(e) => setForm((f) => ({ ...f, localDt: e.target.value }))}
                className="mt-1"
              />
            </div>
          )}

          <Button onClick={submit} disabled={busy || !form.message.trim()} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Megaphone className="h-4 w-4 mr-1.5" />}
            {editingId ? 'Enregistrer' : 'Publier'}
          </Button>
        </Card>
      )}

      {/* List */}
      {items.length === 0 && !showForm && (
        <Card className="p-6 text-center border-dashed">
          <Megaphone className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Aucun message pour le moment.</p>
          {canEdit && (
            <Button size="sm" variant="ghost" className="mt-2" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> Créer le premier message
            </Button>
          )}
        </Card>
      )}

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((m, i) => {
            const Icon = PRIORITY_ICON[m.priority];
            return (
              <li key={m.id}>
                <Card className="p-3">
                  <div className="flex items-start gap-2">
                    <div className={cn('rounded-full p-1.5 shrink-0', PRIORITY_TONE[m.priority])}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Badge variant="outline" className="text-[10px] py-0 h-4">{PRIORITY_LABEL[m.priority].split(' ')[0]}</Badge>
                        <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                      </div>
                      <p className="text-sm font-nunito whitespace-pre-wrap break-words">{m.message}</p>
                      {m.event_at && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          ⏰ Expire le {new Date(m.event_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex flex-col gap-1 shrink-0">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0 || busy} onClick={() => reorder(m.id, -1)}>
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === items.length - 1 || busy} onClick={() => reorder(m.id, 1)}>
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            disabled={busy}
                            onClick={async () => {
                              const { error } = await remove(m.id);
                              if (error) toast.error('Suppression impossible');
                              else toast.success('Message retiré');
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};