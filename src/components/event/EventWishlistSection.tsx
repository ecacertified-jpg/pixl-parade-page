import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Gift, Plus, Trash2, ExternalLink, Check, X, Eye, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { WishlistFundPickerModal } from '@/components/WishlistFundPickerModal';
import { useFavorites } from '@/hooks/useFavorites';

interface Item {
  id: string;
  product_id?: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  product_url: string | null;
  price_estimate: number | null;
  currency: string;
  business_account_id?: string | null;
  reserved_by: string | null;
  reserved_by_name: string | null;
}

interface Props {
  eventId: string;
  eventSlug?: string;
  isOwner: boolean;
  ownerUserId?: string;
  ownerName?: string | null;
}

export function EventWishlistSection({ eventId, eventSlug, isOwner, ownerUserId, ownerName }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const [items, setItems] = useState<Item[]>([]);
  const [ownerFavorites, setOwnerFavorites] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerFavoritesLoading, setOwnerFavoritesLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
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

  useEffect(() => {
    if (!ownerUserId || isOwner) {
      setOwnerFavorites([]);
      return;
    }

    let cancelled = false;
    const fetchOwnerFavorites = async () => {
      setOwnerFavoritesLoading(true);
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          id,
          product_id,
          notes,
          products (id, name, description, price, currency, image_url, business_account_id)
        `)
        .eq('user_id', ownerUserId)
        .order('priority_level', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('Error loading event owner wishlist:', error);
        setOwnerFavorites([]);
      } else {
        const mapped = (data || [])
          .map((f: any) => ({
            id: `fav-${f.id}`,
            product_id: f.product_id,
            title: f.products?.name || 'Article',
            description: f.notes || f.products?.description || null,
            image_url: f.products?.image_url || null,
            product_url: null,
            price_estimate: f.products?.price ?? null,
            currency: f.products?.currency || 'XOF',
            business_account_id: f.products?.business_account_id || null,
            reserved_by: null,
            reserved_by_name: null,
          }))
          .filter((item) => item.title && item.title !== 'Article');
        setOwnerFavorites(mapped);
      }
      setOwnerFavoritesLoading(false);
    };

    fetchOwnerFavorites();
    return () => { cancelled = true; };
  }, [ownerUserId, isOwner]);

  const favoriteItems: Item[] = (favorites || []).map((f) => ({
    id: `fav-${f.id}`,
    product_id: f.product_id,
    title: f.product?.name || 'Article',
    description: f.product?.description || null,
    image_url: f.product?.image_url || null,
    product_url: null,
    price_estimate: f.product?.price ?? null,
    currency: f.product?.currency || 'XOF',
    business_account_id: null,
    reserved_by: null,
    reserved_by_name: null,
  }));
  const allItems: Item[] = [...items, ...(isOwner ? favoriteItems : ownerFavorites)];
  const totalCount = allItems.length;
  const isListLoading = loading || ownerFavoritesLoading;

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

  const createFundForItem = async (item: Item) => {
    if (!ownerUserId) { toast.error('Bénéficiaire introuvable'); return; }
    if (!user) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      navigate(`/auth?tab=signup&returnTo=${encodeURIComponent(returnTo)}&intent=create_fund`);
      return;
    }
    setCreatingFor(item.id);
    try {
      const beneficiary = ownerName?.trim() || 'le célébré';
      const { data: fundData, error } = await (supabase as any)
        .from('collective_funds')
        .insert({
          creator_id: user.id,
          title: `${item.title} pour ${beneficiary}`,
          description: item.description || `Cadeau collectif pour ${beneficiary}`,
          target_amount: item.price_estimate || 0,
          currency: item.currency || 'XOF',
          occasion: 'other',
          status: 'active',
          is_public: true,
          is_external_product: !!item.product_url,
          external_product_url: item.product_url || null,
          external_product_name: item.title,
          external_product_image_url: item.image_url || null,
          business_product_id: item.product_id || null,
          created_by_business_id: item.business_account_id || null,
        })
        .select('id')
        .single();
      if (error || !fundData) {
        console.error(error);
        toast.error("Impossible de créer la cagnotte");
        return;
      }
      toast.success(`Cagnotte créée pour ${beneficiary} ✨`);
      navigate(`/f/${fundData.id}`);
    } finally {
      setCreatingFor(null);
    }
  };

  return (
    <Card className="p-5 border-primary/20">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Gift className="h-5 w-5 text-primary shrink-0" />
          <h2 className="font-bold font-poppins text-base truncate">Liste de souhaits</h2>
        </div>
        {isOwner && (
          <div className="flex items-center gap-1 ml-auto">
            {user && totalCount > 0 && (
              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowPicker(true)} title="Voir ma liste">
                <Eye className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Voir</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2"
              onClick={() => {
                const returnTo = eventSlug ? `/event/${eventSlug}` : '';
                const params = new URLSearchParams({ eventId, from: 'event' });
                if (returnTo) params.set('returnTo', returnTo);
                navigate(`/wishlist-catalog?${params.toString()}`);
              }}
            >
              <Plus className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Ajouter</span>
            </Button>
          </div>
        )}
      </div>

      {isListLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : allItems.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          {isOwner ? 'Aucun souhait pour l\'instant. Ajoute ce que tu rêverais de recevoir 💝' : 'Pas encore de liste de souhaits.'}
        </p>
      ) : (
        <div className="relative -mr-1">
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 md:max-h-none md:overflow-visible md:pr-0">
          {allItems.map((item) => {
            const isReservedByMe = user && item.reserved_by === user.id;
            const isReserved = !!item.reserved_by;
            const isFav = item.id.startsWith('fav-');
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
                  {!isOwner && ownerUserId && (
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 gap-1"
                      disabled={creatingFor === item.id}
                      onClick={() => createFundForItem(item)}
                      title="Créer une cagnotte pour cet article"
                    >
                      {creatingFor === item.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Gift className="h-3 w-3" />
                      )}
                      <span className="text-xs">Créer</span>
                    </Button>
                  )}
                  {!isOwner && !isFav && (isReservedByMe || !isReserved) && (
                    <Button size="sm" variant={isReservedByMe ? 'outline' : 'default'} onClick={() => reserve(item)}>
                      {isReservedByMe ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                    </Button>
                  )}
                  {isOwner && !isFav && (
                    <Button size="sm" variant="ghost" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
          {allItems.length > 3 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent md:hidden" aria-hidden />
          )}
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

      <WishlistFundPickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
      />
    </Card>
  );
}