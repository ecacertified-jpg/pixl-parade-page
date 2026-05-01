import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Gift, Heart, Loader2, ShoppingBag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FavoriteProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string | null;
  image_url: string | null;
}

interface FavoriteItem {
  id: string;
  product: FavoriteProduct | null;
}

interface WishlistFundPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFundCreated?: () => void;
  beneficiaryUserId?: string;
  beneficiaryFirstName?: string;
  beneficiaryLastName?: string;
  beneficiaryAvatarUrl?: string;
}

export function WishlistFundPickerModal({
  isOpen,
  onClose,
  onFundCreated,
  beneficiaryUserId,
  beneficiaryFirstName,
  beneficiaryLastName,
  beneficiaryAvatarUrl,
}: WishlistFundPickerModalProps) {
  const navigate = useNavigate();
  const { favorites: ownFavorites, loading: ownLoading } = useFavorites();
  const { addItem } = useCart();
  const { user } = useAuth();

  const isExternalBeneficiary = !!beneficiaryUserId && beneficiaryUserId !== user?.id;

  const [externalFavorites, setExternalFavorites] = useState<FavoriteItem[]>([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [creatingFundFor, setCreatingFundFor] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  useEffect(() => {
    if (!isOpen || !isExternalBeneficiary || !beneficiaryUserId) return;

    let cancelled = false;
    const fetchBeneficiaryFavorites = async () => {
      setExternalLoading(true);
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id, product_id, products (id, name, description, price, currency, image_url)')
        .eq('user_id', beneficiaryUserId)
        .order('priority_level', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('Error loading beneficiary wishlist:', error);
        setExternalFavorites([]);
      } else {
        const items: FavoriteItem[] = (data || []).map((it: any) => ({
          id: it.id,
          product: it.products,
        }));
        setExternalFavorites(items);
      }
      setExternalLoading(false);
    };

    fetchBeneficiaryFavorites();
    return () => {
      cancelled = true;
    };
  }, [isOpen, isExternalBeneficiary, beneficiaryUserId]);

  const favorites = isExternalBeneficiary ? externalFavorites : ownFavorites;
  const loading = isExternalBeneficiary ? externalLoading : ownLoading;
  const itemCount = favorites.filter((f) => f.product).length;

  // Detect if scroll hint should appear (more than ~3 items visible)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      setShowScrollHint(false);
      return;
    }
    const update = () => {
      const hasOverflow = el.scrollHeight - el.clientHeight > 8;
      const notAtBottom = el.scrollTop + el.clientHeight < el.scrollHeight - 8;
      setShowScrollHint(hasOverflow && notAtBottom);
    };
    update();
    el.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [favorites, loading, isOpen]);

  const beneficiaryDisplayName = (() => {
    const f = beneficiaryFirstName?.trim() || '';
    const l = beneficiaryLastName?.trim() || '';
    return `${f} ${l}`.trim();
  })();

  const handleCreateFund = async (fav: FavoriteItem) => {
    const product = fav.product;
    if (!product) return;

    // External beneficiary (friend) → create a PUBLIC collective fund directly,
    // do NOT route through the single-buyer checkout.
    if (isExternalBeneficiary && beneficiaryUserId) {
      if (!user) {
        toast.error('Connectez-vous pour créer une cagnotte');
        return;
      }
      setCreatingFundFor(fav.id);
      try {
        // Lookup the product's business to keep parity with the existing flow
        let businessAccountId: string | null = null;
        const { data: productRow } = await supabase
          .from('products')
          .select('id, business_account_id')
          .eq('id', product.id)
          .maybeSingle();
        if (productRow?.business_account_id) {
          businessAccountId = productRow.business_account_id as string;
        }

        const beneficiaryName = beneficiaryDisplayName || 'Bénéficiaire';

        const { data: fundData, error: fundError } = await supabase
          .from('collective_funds')
          .insert({
            creator_id: user.id,
            title: `${product.name} pour ${beneficiaryName}`,
            description: product.description || `Cadeau collectif pour ${beneficiaryName}`,
            target_amount: product.price,
            currency: product.currency || 'XOF',
            occasion: 'birthday',
            status: 'active',
            is_public: true,
            business_product_id: product.id,
            created_by_business_id: businessAccountId,
          } as any)
          .select('id')
          .single();

        if (fundError || !fundData) {
          console.error('Fund creation error:', fundError);
          toast.error("Impossible de créer la cagnotte. Veuillez réessayer.");
          return;
        }

        // Best-effort: link to business_collective_funds
        if (businessAccountId) {
          try {
            await supabase.from('business_collective_funds').insert({
              fund_id: fundData.id,
              business_id: businessAccountId,
              product_id: product.id,
            } as any);
          } catch (e) {
            console.warn('business_collective_funds insert failed (non-blocking):', e);
          }
        }

        // Best-effort: link the fund to the friend's active birthday page
        try {
          await supabase.functions.invoke('link-fund-to-birthday-page', {
            body: {
              fund_id: fundData.id,
              beneficiary_user_id: beneficiaryUserId,
            },
          });
        } catch (e) {
          console.warn('link-fund-to-birthday-page failed (non-blocking):', e);
        }

        toast.success(`Cagnotte créée pour ${beneficiaryName} !`);
        onClose();
        onFundCreated?.();
        navigate(`/f/${fundData.id}`);
      } finally {
        setCreatingFundFor(null);
      }
      return;
    }

    // Self-fund: keep existing cart-based flow
    let beneficiaryName: string;
    let beneficiaryId: string | undefined;
    let isSelfFund: boolean;

    const firstName = user?.user_metadata?.first_name || user?.user_metadata?.firstName || '';
    const lastName = user?.user_metadata?.last_name || user?.user_metadata?.lastName || '';
    beneficiaryName = `${firstName} ${lastName}`.trim() || 'Moi-même';
    beneficiaryId = user?.id;
    isSelfFund = true;

    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || undefined,
      currency: product.currency || 'XOF',
      description: product.description || undefined,
      isCollaborativeGift: true,
      isSelfFund,
      beneficiaryName,
      beneficiaryId,
    });

    onClose();
    onFundCreated?.();
    navigate('/cart');
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-FR').format(price);

  const title = isExternalBeneficiary
    ? `Liste de souhaits${beneficiaryFirstName ? ` de ${beneficiaryFirstName}` : ''}`
    : 'Ma liste de souhaits';

  const baseSubtitle = isExternalBeneficiary
    ? `Choisissez un article pour créer une cagnotte${beneficiaryFirstName ? ` pour ${beneficiaryFirstName}` : ''}`
    : 'Choisissez un article pour créer votre cagnotte';
  const subtitle = itemCount > 0
    ? `${itemCount} article${itemCount > 1 ? 's' : ''} — ${baseSubtitle}`
    : baseSubtitle;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md h-[85vh] min-h-[500px] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-poppins flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex-1 min-h-0">
          <div ref={scrollRef} className="absolute inset-0 overflow-y-auto px-6">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {!loading && favorites.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              {isExternalBeneficiary ? (
                <p className="text-sm text-muted-foreground mb-4">
                  Aucun article à afficher pour le moment.
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Votre liste de souhaits est vide
                  </p>
                  <Button
                    size="sm"
                    onClick={() => { onClose(); navigate('/favorites'); }}
                  >
                    Ajouter des articles
                  </Button>
                </>
              )}
            </div>
          )}

          {!loading && favorites.length > 0 && (
            <div className="space-y-2 py-2 pb-6">
              {favorites.map((fav) => {
                const product = fav.product;
                if (!product) return null;

                return (
                  <div
                    key={fav.id}
                    className="border border-border/60 rounded-xl p-2.5 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex gap-3 items-center">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-14 h-14 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Gift className="h-6 w-6 text-primary" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{product.name}</h4>
                        <p className="text-xs text-primary font-semibold mt-0.5">
                          {formatPrice(product.price)} {product.currency || 'XOF'}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        className="h-8 text-xs shrink-0"
                        onClick={() => handleCreateFund(fav)}
                        disabled={creatingFundFor === fav.id}
                      >
                        {creatingFundFor === fav.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          'Créer'
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>

          {showScrollHint && (
            <>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
              <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 animate-bounce">
                <div className="rounded-full bg-primary/15 p-1">
                  <ChevronDown className="h-4 w-4 text-primary" />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="border-t px-6 py-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            Retour
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
