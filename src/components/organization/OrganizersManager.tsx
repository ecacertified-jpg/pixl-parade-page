import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Share2 } from 'lucide-react';
import { useEventOrganizers } from '@/hooks/useOrganizationData';
import { ORGANIZER_ROLE_LABELS, type OrganizationPageType, type OrganizerRole } from '@/types/organization';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PhoneInput } from '@/components/ui/phone-input';

interface Props { pageType: OrganizationPageType; pageId: string; canEdit: boolean; pageTitle?: string; }

export const OrganizersManager = ({ pageType, pageId, canEdit, pageTitle }: Props) => {
  const { user } = useAuth();
  const { items, loading, insert, remove } = useEventOrganizers(pageType, pageId);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<OrganizerRole>('admin');

  const add = async () => {
    if (!name.trim() || !user) return;
    const created = await insert({
      invited_name: name.trim(),
      invited_phone: phone.trim() || null,
      role,
      status: 'pending',
      invited_by: user.id,
    } as any);
    if (created) {
      setName(''); setPhone('');
      // Build wa.me share link
      if (phone.trim() && (created as any).invite_token) {
        const url = `${window.location.origin}/organisation/accept/${(created as any).invite_token}`;
        const text = `Bonjour ${name.trim()}, je t'invite à co-organiser ${pageTitle ? `« ${pageTitle} »` : 'mon événement'} sur Joie de Vivre 🎉\n\nAccepte ici : ${url}`;
        const wa = `https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(text)}`;
        window.open(wa, '_blank');
      }
      toast.success('Invitation prête à être envoyée');
    }
  };

  const shareAgain = (token: string | null, displayName: string | null, phone: string | null) => {
    if (!token) return;
    const url = `${window.location.origin}/organisation/accept/${token}`;
    const text = `Bonjour ${displayName ?? ''}, rejoins-moi pour co-organiser ${pageTitle ? `« ${pageTitle} »` : 'mon événement'} sur Joie de Vivre 🎉\n\n${url}`;
    if (phone) {
      window.open(`https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Invitation copiée');
    }
  };

  return (
    <div className="space-y-3">
      {canEdit && (
        <Card className="p-3 space-y-2 rounded-2xl">
          <Input placeholder="Nom du co-organisateur" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          <PhoneInput value={phone} onChange={setPhone} placeholder="Téléphone (WhatsApp)" />
          <Select value={role} onValueChange={(v) => setRole(v as OrganizerRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ORGANIZER_ROLE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={add} disabled={!name.trim()}>
            <Plus className="h-4 w-4" /> Inviter
          </Button>
          <p className="text-[11px] text-muted-foreground italic">
            Un lien WhatsApp sera ouvert pour partager l'invitation.
          </p>
        </Card>
      )}

      {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-muted-foreground italic text-center py-6">
          Tu es seul aux commandes pour le moment. Invite ton équipe de cœur 💛
        </p>
      )}

      <ul className="space-y-2">
        {items.map((o) => {
          const r = ORGANIZER_ROLE_LABELS[o.role];
          return (
            <li key={o.id}>
              <Card className="p-3 rounded-2xl flex items-center gap-3">
                <div className="text-2xl">{r.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-nunito text-sm font-medium">{o.invited_name ?? 'Co-organisateur'}</p>
                  <p className="text-xs text-muted-foreground">{r.label} · {o.status === 'accepted' ? '✅ Accepté' : '⏳ En attente'}</p>
                  {o.invited_phone && <p className="text-[11px] text-muted-foreground">{o.invited_phone}</p>}
                </div>
                {canEdit && o.status === 'pending' && (
                  <Button size="icon" variant="ghost" onClick={() => shareAgain(o.invite_token, o.invited_name, o.invited_phone)} className="h-7 w-7">
                    <Share2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                {canEdit && (
                  <Button size="icon" variant="ghost" onClick={() => remove(o.id)} className="h-7 w-7">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
};