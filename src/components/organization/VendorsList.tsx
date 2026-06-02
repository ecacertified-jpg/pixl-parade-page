import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Trash2, Plus, Phone } from 'lucide-react';
import { useEventVendors } from '@/hooks/useOrganizationData';
import { CELEBRATION_ARTISAN_ROLES, getArtisanRole } from '@/data/celebration-artisan-roles';
import type { OrganizationPageType } from '@/types/organization';

interface Props { pageType: OrganizationPageType; pageId: string; canEdit: boolean; }

export const VendorsList = ({ pageType, pageId, canEdit }: Props) => {
  const { items, loading, insert, remove } = useEventVendors(pageType, pageId);
  const [category, setCategory] = useState('organisateur');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const add = async () => {
    if (!name.trim()) return;
    await insert({ category, name: name.trim(), phone: phone.trim() || null, notes: notes.trim() || null } as any);
    setName(''); setPhone(''); setNotes('');
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
          <Input placeholder="Nom du prestataire" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          <Input placeholder="Téléphone (optionnel)" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
          <Textarea placeholder="Observations" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} className="resize-none" rows={2} />
          <Button size="sm" onClick={add} disabled={!name.trim()}><Plus className="h-4 w-4" /> Ajouter</Button>
        </Card>
      )}

      {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-muted-foreground italic text-center py-6">Pas encore de prestataires. 🎨</p>
      )}

      <ul className="space-y-2">
        {items.map((v) => {
          const role = getArtisanRole(v.category);
          return (
            <li key={v.id}>
              <Card className="p-3 rounded-2xl flex items-start gap-3">
                <div className="text-2xl" aria-hidden>{role?.emoji ?? '🎁'}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-nunito text-sm font-medium text-foreground">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{role?.label ?? v.category}</p>
                  {v.phone && (
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
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
};