import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Send, Copy } from 'lucide-react';
import { useEventGuests } from '@/hooks/useOrganizationData';
import { GUEST_STATUS_LABELS, type OrganizationPageType, type EventGuestStatus } from '@/types/organization';
import { toast } from 'sonner';
import { getAppBaseUrl } from '@/utils/appUrl';

interface Props { pageType: OrganizationPageType; pageId: string; canEdit: boolean; }

export const GuestsList = ({ pageType, pageId, canEdit }: Props) => {
  const { items, loading, insert, update, remove } = useEventGuests(pageType, pageId);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const stats = useMemo(() => {
    const total = items.length;
    const confirmed = items.filter((g) => g.status === 'confirmed').length;
    const declined = items.filter((g) => g.status === 'declined').length;
    const rate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    return { total, confirmed, declined, rate };
  }, [items]);

  const add = async () => {
    if (!name.trim()) return;
    await insert({ name: name.trim(), phone: phone.trim() || null, status: 'invited' } as any);
    setName(''); setPhone('');
  };

  const rsvpUrl = (token: string) => `${getAppBaseUrl()}/rsvp/${token}`;

  const sendWhatsApp = (g: any) => {
    const token = g.rsvp_token;
    if (!token) { toast.error('Aucun lien RSVP disponible'); return; }
    const msg = `Salut ${g.name.split(' ')[0]} 👋\n\nTu es invité(e) à mon événement 🎉\nMerci de confirmer ta présence ici :\n${rsvpUrl(token)}`;
    const cleanPhone = (g.phone || '').replace(/[^\d]/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const copyLink = async (g: any) => {
    if (!g.rsvp_token) { toast.error('Aucun lien RSVP'); return; }
    await navigator.clipboard.writeText(rsvpUrl(g.rsvp_token));
    toast.success('Lien RSVP copié 💌');
  };

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <Card className="p-4 rounded-2xl bg-gradient-to-br from-secondary/40 to-background">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Invités</p>
              <p className="font-poppins font-semibold">{stats.total}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Confirmés</p>
              <p className="font-poppins font-semibold text-primary">{stats.confirmed}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Taux</p>
              <p className="font-poppins font-semibold">{stats.rate}%</p>
            </div>
          </div>
        </Card>
      )}

      {canEdit && (
        <Card className="p-3 space-y-2 rounded-2xl">
          <Input placeholder="Nom de l'invité" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          <Input placeholder="Téléphone (optionnel)" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
          <Button size="sm" onClick={add} disabled={!name.trim()}><Plus className="h-4 w-4" /> Ajouter</Button>
        </Card>
      )}

      {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-muted-foreground italic text-center py-6">Pas encore d'invités. 💌</p>
      )}

      <ul className="space-y-2">
        {items.map((g) => (
          <li key={g.id}>
            <Card className="p-3 rounded-2xl space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-nunito text-sm font-medium">{g.name}</p>
                  {g.phone && <p className="text-xs text-muted-foreground">{g.phone}</p>}
                  {(g as any).rsvp_response && (
                    <p className="text-[11px] text-primary font-medium mt-0.5">
                      {(g as any).rsvp_response === 'yes' && '✓ A confirmé'}
                      {(g as any).rsvp_response === 'no' && '✗ Ne viendra pas'}
                      {(g as any).rsvp_response === 'maybe' && '? Peut-être'}
                      {(g as any).rsvp_plus_ones > 0 && ` (+${(g as any).rsvp_plus_ones})`}
                    </p>
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
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => sendWhatsApp(g)}>
                    <Send className="h-3 w-3 mr-1" /> WhatsApp
                  </Button>
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