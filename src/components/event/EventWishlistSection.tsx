import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Gift, Plus, Trash2, ExternalLink, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Item {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  product_url: string | null;
  price_estimate: number | null;
  currency: string;
  reserved_by: string | null;
  reserved_by_name: string | null;
}

interface Props {
  eventId: string;
  isOwner: boolean;
}

export function EventWishlistSection({ eventId, isOwner }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', image_url: '', product_url: '', price_estimate: '' });

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('event_wishlist_items')
      .select('*')
      .eq('event_id', eventId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) console.error(error);
    setItems((data ?? []) as Item[]);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [eventId]);

  const addItem = async () => {
    if (!form.title.trim()) { toast.error('Titre requis'); return; }
    const { error } = await (supabase as any).from('event_wishlist_items').insert({
      event_id: eventId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      product_url: form.product_url.trim() || null,
      price_estimate: form.price_estimate ? Number(form.price_estimate) : null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Ajouté à la liste 🎁');
    setOpen(false);
    setForm({ title: '', description: '', image_url: '', product_url: '', price_estimate: '' });
    fetchItems();
  };

  const removeItem = async (id: string) => {
    const { error } = await (supabase as any).from('event_wishlist_items').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    fetchItems();
  };

  const reserve = async (item: Item) => {
    if (!user) { toast.error('Connecte-toi pour réserver'); return; }
    const isReservedByMe = item.reserved_by === user.id;
    const update = isReservedByMe
      ? { reserved_by: null, reserved_by_name: null, reserved_at: null }
      : { reserved_by: user.id, reserved_by_name: user.user_metadata?.first_name || user.email, reserved_at: new Date().toISOString() };
    const { error } = await (supabase as any).from('event_wishlist_items').update(update).eq('id', item.id);
    if (error) { toast.error(error.message); return; }
    toast.success(isReservedByMe ? 'Réservation annulée' : 'Cadeau réservé ✨');
    fetchItems();
  };

  return (
    <Card className="p-5 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h2 className="font-bold font-poppins">Liste de souhaits</h2>
        </div>
        {isOwner && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/wishlist-catalog?eventId=${eventId}&from=event`)}
          >
            <Plus className="h-4 w-4 mr-1" /> Ajouter
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          {isOwner ? 'Aucun souhait pour l\'instant. Ajoute ce que tu rêverais de recevoir 💝' : 'Pas encore de liste de souhaits.'}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isReservedByMe = user && item.reserved_by === user.id;
            const isReserved = !!item.reserved_by;
            return (
              <div key={item.id} className="flex gap-3 p-3 rounded-lg border bg-card">
                {item.image_url && (
                  <img src={item.image_url} alt={item.title} className="w-16 h-16 rounded object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.title}</div>
                  {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    {item.price_estimate != null && (
                      <span className="text-xs font-semibold text-primary">{Number(item.price_estimate).toLocaleString('fr-FR')} {item.currency}</span>
                    )}
                    {item.product_url && (
                      <a href={item.product_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary inline-flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> Voir
                      </a>
                    )}
                  </div>
                  {isReserved && !isOwner && (
                    <div className="text-xs mt-1 text-muted-foreground">
                      {isReservedByMe ? '✨ Réservé par toi' : 'Déjà réservé'}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {!isOwner && (isReservedByMe || !isReserved) && (
                    <Button size="sm" variant={isReservedByMe ? 'outline' : 'default'} onClick={() => reserve(item)}>
                      {isReservedByMe ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                    </Button>
                  )}
                  {isOwner && (
                    <Button size="sm" variant="ghost" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un souhait</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Titre *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Description (optionnelle)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input placeholder="URL de l'image" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            <Input placeholder="Lien produit (URL)" value={form.product_url} onChange={(e) => setForm({ ...form, product_url: e.target.value })} />
            <Input type="number" placeholder="Prix estimé (XOF)" value={form.price_estimate} onChange={(e) => setForm({ ...form, price_estimate: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={addItem}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}