import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus, Phone, Store, CalendarCheck, Wallet, MessageCircle } from 'lucide-react';
import { useEventVendors } from '@/hooks/useOrganizationData';
import { CELEBRATION_ARTISAN_ROLES, getArtisanRole } from '@/data/celebration-artisan-roles';
import type { OrganizationPageType } from '@/types/organization';
import { BrowseJDVModal } from './BrowseJDVModal';
import { toast } from 'sonner';

interface Props { pageType: OrganizationPageType; pageId: string; canEdit: boolean; }

const BOOKING_LABELS: Record<string, { label: string; emoji: string; cls: string }> = {
  proposed:  { label: 'Proposé',  emoji: '💡', cls: 'bg-muted text-foreground' },
  contacted: { label: 'Contacté', emoji: '💬', cls: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Confirmé', emoji: '✅', cls: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Annulé',   emoji: '✖️', cls: 'bg-red-100 text-red-800' },
};

const fmtXOF = (n?: number | null) =>
  typeof n === 'number'
    ? new Intl.NumberFormat('fr-FR').format(n) + ' XOF'
    : '—';

export const VendorsList = ({ pageType, pageId, canEdit }: Props) => {
  const { items, loading, insert, remove, update } = useEventVendors(pageType, pageId);
  const [category, setCategory] = useState('organisateur');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [browseOpen, setBrowseOpen] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    await insert({ category, name: name.trim(), phone: phone.trim() || null, notes: notes.trim() || null } as any);
    setName(''); setPhone(''); setNotes('');
  };

  const pickFromJDV = async (b: { id: string; business_name: string; business_type: string | null }) => {
    await insert({
      category,
      name: b.business_name,
      business_account_id: b.id,
      booking_status: 'proposed',
      notes: b.business_type ? `Prestataire JDV — ${b.business_type}` : 'Prestataire JDV',
    } as any);
    toast.success(`${b.business_name} ajouté · contacte JDV pour le devis`);
  };

  const contactJDV = (v: any) => {
    const text = encodeURIComponent(
      `Bonjour JDV 👋\nJe souhaite réserver le prestataire « ${v.name} » pour mon événement.\nMerci de m'envoyer un devis.`,
    );
    update(v.id, { booking_status: 'contacted', contact_logged_at: new Date().toISOString() } as any);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3">
      {canEdit && (
        <Card className="p-3 space-y-2 rounded-2xl">
          <div className="flex flex-wrap gap-1.5">
            {CELEBRATION_ARTISAN_ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setCategory(r.key)}
                className={`px-2.5 py-1 rounded-full text-xs font-nunito border transition-colors ${
                  category === r.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-transparent'
                }`}
              >
                {r.emoji} {r.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setBrowseOpen(true)}>
              <Store className="h-4 w-4 mr-1" /> Réserver via JDV
            </Button>
            <Button size="sm" onClick={add} disabled={!name.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Ajouter saisie libre
            </Button>
          </div>
          <Input placeholder="Nom du prestataire" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          <Input placeholder="Téléphone (optionnel)" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
          <Textarea placeholder="Observations" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} className="resize-none" rows={2} />
        </Card>
      )}

      {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-muted-foreground italic text-center py-6">Pas encore de prestataires. 🎨</p>
      )}

      <ul className="space-y-2">
        {(items as any[]).map((v) => {
          const role = getArtisanRole(v.category);
          const status = BOOKING_LABELS[v.booking_status ?? 'proposed'] ?? BOOKING_LABELS.proposed;
          const isJdv = !!v.business_account_id;
          return (
            <li key={v.id}>
              <Card className="p-3 rounded-2xl space-y-2">
                <div className="flex items-start gap-3">
                  <div className="text-2xl" aria-hidden>{role?.emoji ?? '🎁'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-nunito text-sm font-medium text-foreground">{v.name}</p>
                      {isJdv && (
                        <Badge variant="secondary" className="text-[10px] h-5">
                          <Store className="h-3 w-3 mr-0.5" /> JDV
                        </Badge>
                      )}
                      <Badge className={`text-[10px] h-5 ${status.cls}`}>{status.emoji} {status.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{role?.label ?? v.category}</p>
                    {!isJdv && v.phone && (
                      <a href={`tel:${v.phone}`} className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                        <Phone className="h-3 w-3" /> {v.phone}
                      </a>
                    )}
                    {v.notes && <p className="text-xs text-muted-foreground mt-1 italic">{v.notes}</p>}
                  </div>
                  {canEdit && (
                    <Button size="icon" variant="ghost" onClick={() => remove(v.id)} className="h-7 w-7">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {canEdit && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Select
                      value={v.booking_status ?? 'proposed'}
                      onValueChange={(val) => update(v.id, { booking_status: val } as any)}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(BOOKING_LABELS).map(([k, l]) => (
                          <SelectItem key={k} value={k}>{l.emoji} {l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isJdv && (
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => contactJDV(v)}>
                        <MessageCircle className="h-3.5 w-3.5 mr-1" /> Contacter JDV
                      </Button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Wallet className="h-3 w-3" /> Devis
                    <Input
                      type="number" min={0} step={500} disabled={!canEdit}
                      value={v.quote_amount ?? ''}
                      onChange={(e) => update(v.id, { quote_amount: e.target.value ? Number(e.target.value) : null } as any)}
                      className="h-7 text-xs ml-1"
                      placeholder={fmtXOF(null)}
                    />
                  </label>
                  <label className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <CalendarCheck className="h-3 w-3" /> Acompte
                    <Input
                      type="number" min={0} step={500} disabled={!canEdit}
                      value={v.deposit_amount ?? ''}
                      onChange={(e) => update(v.id, {
                        deposit_amount: e.target.value ? Number(e.target.value) : null,
                        deposit_paid_at: e.target.value ? new Date().toISOString() : null,
                      } as any)}
                      className="h-7 text-xs ml-1"
                      placeholder={fmtXOF(null)}
                    />
                  </label>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <BrowseJDVModal
        open={browseOpen}
        onOpenChange={setBrowseOpen}
        defaultCategory={category}
        onSelect={pickFromJDV}
      />
    </div>
  );
};