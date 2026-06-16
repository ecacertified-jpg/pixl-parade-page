import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Send, Copy, Download, BellRing } from 'lucide-react';
import { useEventGuests } from '@/hooks/useOrganizationData';
import { GUEST_STATUS_LABELS, type OrganizationPageType, type EventGuestStatus } from '@/types/organization';
import { toast } from 'sonner';
import { getAppBaseUrl } from '@/utils/appUrl';
import { supabase } from '@/integrations/supabase/client';

const DIETARY_LABEL: Record<string, string> = {
  vegetarien: '🥗 Végétarien',
  vegan: '🌱 Vegan',
  sans_porc: '🚫🐖 Sans porc',
  halal: '☪️ Halal',
  sans_gluten: '🌾 Sans gluten',
};
const dietaryDisplay = (v?: string | null) => (v ? DIETARY_LABEL[v] ?? `🍽️ ${v}` : null);

interface Props { pageType: OrganizationPageType; pageId: string; canEdit: boolean; }

export const GuestsList = ({ pageType, pageId, canEdit }: Props) => {
  const { items, loading, insert, update, remove } = useEventGuests(pageType, pageId);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'yes' | 'no' | 'maybe'>('all');

  const stats = useMemo(() => {
    const total = items.length;
    const confirmed = items.filter((g) => g.status === 'confirmed').length;
    const declined = items.filter((g) => g.status === 'declined').length;
    const pending = items.filter((g) => !(g as any).rsvp_response).length;
    const totalSeats = items.reduce(
      (s, g) => s + ((g as any).rsvp_response === 'yes' ? 1 + ((g as any).rsvp_plus_ones || 0) : 0),
      0,
    );
    const rate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    return { total, confirmed, declined, pending, rate, totalSeats };
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'pending') return items.filter((g) => !(g as any).rsvp_response);
    return items.filter((g) => (g as any).rsvp_response === filter);
  }, [items, filter]);

  const add = async () => {
    if (!name.trim()) return;
    await insert({ name: name.trim(), phone: phone.trim() || null, status: 'invited' } as any);
    setName(''); setPhone('');
  };

  const rsvpUrl = (token: string) => `${getAppBaseUrl()}/rsvp/${token}`;

  const sendWhatsApp = async (g: any, isReminder = false) => {
    const token = g.rsvp_token;
    if (!token) { toast.error('Aucun lien RSVP disponible'); return; }
    const firstName = g.name.split(' ')[0];
    const msg = isReminder
      ? `Coucou ${firstName} 💛\n\nPetit rappel doux : je n'ai pas encore ta réponse pour mon événement 🥹\nTu peux confirmer en 10 secondes ici :\n${rsvpUrl(token)}\n\nMerci d'avance ✨`
      : `Salut ${firstName} 👋\n\nTu es invité(e) à mon événement 🎉\nMerci de confirmer ta présence ici :\n${rsvpUrl(token)}`;
    const cleanPhone = (g.phone || '').replace(/[^\d]/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    if (isReminder) {
      await (supabase as any).rpc('mark_rsvp_reminder_sent', { _guest_id: g.id });
    }
  };

  const copyLink = async (g: any) => {
    if (!g.rsvp_token) { toast.error('Aucun lien RSVP'); return; }
    await navigator.clipboard.writeText(rsvpUrl(g.rsvp_token));
    toast.success('Lien RSVP copié 💌');
  };

  const exportCsv = () => {
    const headers = ['Nom', 'Téléphone', 'Statut', 'Réponse', 'Accompagnants', 'Noms accompagnants', 'Régime', 'Message', 'Relances'];
    const rows = items.map((g: any) => [
      g.name,
      g.phone || '',
      g.status,
      g.rsvp_response || '',
      g.rsvp_plus_ones || 0,
      (g.plus_one_names || []).join(' / '),
      g.dietary_preference || '',
      (g.rsvp_message || '').replace(/\n/g, ' '),
      g.reminder_count || 0,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `invites-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const remindAllPending = () => {
    const pending = items.filter((g: any) => !g.rsvp_response && g.rsvp_token && g.phone);
    if (pending.length === 0) { toast.info('Aucun invité à relancer 🎉'); return; }
    toast.success(`Ouverture de ${pending.length} discussion(s) WhatsApp…`);
    pending.forEach((g, i) => setTimeout(() => sendWhatsApp(g, true), i * 400));
  };

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <Card className="p-4 rounded-2xl bg-gradient-to-br from-secondary/40 to-background">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Invités</p>
              <p className="font-poppins font-semibold">{stats.total}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Confirmés</p>
              <p className="font-poppins font-semibold text-primary">{stats.confirmed}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Couverts</p>
              <p className="font-poppins font-semibold">{stats.totalSeats}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Taux</p>
              <p className="font-poppins font-semibold">{stats.rate}%</p>
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={remindAllPending} disabled={stats.pending === 0}>
                <BellRing className="h-3.5 w-3.5 mr-1" /> Relancer {stats.pending > 0 ? `(${stats.pending})` : ''}
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={exportCsv}>
                <Download className="h-3.5 w-3.5 mr-1" /> CSV
              </Button>
            </div>
          )}
        </Card>
      )}

      {canEdit && (
        <Card className="p-3 space-y-2 rounded-2xl">
          <Input placeholder="Nom de l'invité" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          <Input placeholder="Téléphone (optionnel)" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
          <Button size="sm" onClick={add} disabled={!name.trim()}><Plus className="h-4 w-4" /> Ajouter</Button>
        </Card>
      )}

      {items.length > 0 && (
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous ({stats.total})</SelectItem>
            <SelectItem value="pending">⏳ En attente ({stats.pending})</SelectItem>
            <SelectItem value="yes">✓ Confirmés ({stats.confirmed})</SelectItem>
            <SelectItem value="maybe">? Peut-être</SelectItem>
            <SelectItem value="no">✗ Refusés ({stats.declined})</SelectItem>
          </SelectContent>
        </Select>
      )}

      {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-muted-foreground italic text-center py-6">Pas encore d'invités. 💌</p>
      )}

      <ul className="space-y-2">
        {filtered.map((g: any) => (
          <li key={g.id}>
            <Card className="p-3 rounded-2xl space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-nunito text-sm font-medium">{g.name}</p>
                  {g.phone && <p className="text-xs text-muted-foreground">{g.phone}</p>}
                  {g.rsvp_response && (
                    <p className="text-[11px] text-primary font-medium mt-0.5">
                      {g.rsvp_response === 'yes' && '✓ A confirmé'}
                      {g.rsvp_response === 'no' && '✗ Ne viendra pas'}
                      {g.rsvp_response === 'maybe' && '? Peut-être'}
                      {g.rsvp_plus_ones > 0 && ` (+${g.rsvp_plus_ones})`}
                    </p>
                  )}
                  {g.plus_one_names?.length > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      avec {g.plus_one_names.join(', ')}
                    </p>
                  )}
                  {dietaryDisplay(g.dietary_preference) && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{dietaryDisplay(g.dietary_preference)}</p>
                  )}
                  {g.reminder_count > 0 && (
                    <p className="text-[10px] text-amber-600 mt-0.5">🔔 Relancé {g.reminder_count}×</p>
                  )}
                </div>
                <Select
                  value={g.status}
                  onValueChange={(v) => canEdit && update(g.id, { status: v as EventGuestStatus } as any)}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(GUEST_STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {canEdit && (
                  <Button size="icon" variant="ghost" onClick={() => remove(g.id)} className="h-7 w-7">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              {canEdit && (
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => sendWhatsApp(g, false)}>
                    <Send className="h-3 w-3 mr-1" /> Inviter
                  </Button>
                  {!g.rsvp_response && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => sendWhatsApp(g, true)}>
                      <BellRing className="h-3 w-3 mr-1" /> Relancer
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => copyLink(g)}>
                    <Copy className="h-3 w-3 mr-1" /> Lien
                  </Button>
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
};