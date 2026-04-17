import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Gift, Heart, Loader2, ShoppingBag, UserPlus } from 'lucide-react';
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
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!isOpen || !isExternalBeneficiary || !beneficiaryUserId) return;

    let cancelled = false;
    const fetchBeneficiaryFavorites = async () => {
      setExternalLoading(true);
      setAccessDenied(false);
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id, product_id, products (id, name, description, price, currency, image_url)')
        .eq('user_id', beneficiaryUserId)
        .order('priority_level', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('Error loading beneficiary wishlist:', error);
        setAccessDenied(true);
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

  const beneficiaryDisplayName = (() => {
    const f = beneficiaryFirstName?.trim() || '';
    const l = beneficiaryLastName?.trim() || '';
    return `${f} ${l}`.trim();
  })();

  const handleCreateFund = (fav: FavoriteItem) => {
    const product = fav.product;
    if (!product) return;

    let beneficiaryName: string;
    let beneficiaryId: string | undefined;
    let isSelfFund: boolean;

    if (isExternalBeneficiary) {
      beneficiaryName = beneficiaryDisplayName || 'Bénéficiaire';
      beneficiaryId = beneficiaryUserId;
      isSelfFund = false;
    } else {
      const firstName = user?.user_metadata?.first_name || user?.user_metadata?.firstName || '';
      const lastName = user?.user_metadata?.last_name || user?.user_metadata?.lastName || '';
      beneficiaryName = `${firstName} ${lastName}`.trim() || 'Moi-même';
      beneficiaryId = user?.id;
      isSelfFund = true;
    }

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

  const subtitle = isExternalBeneficiary
    ? `Choisissez un article pour créer une cagnotte${beneficiaryFirstName ? ` pour ${beneficiaryFirstName}` : ''}`
    : 'Choisissez un article pour créer votre cagnotte';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-poppins flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 min-h-[200px]">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {!loading && favorites.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                {isExternalBeneficiary ? (
                  <UserPlus className="h-8 w-8 text-primary" />
                ) : (
                  <ShoppingBag className="h-8 w-8 text-primary" />
                )}
              </div>
              {isExternalBeneficiary ? (
                <p className="text-sm text-muted-foreground mb-4">
                  {accessDenied
                    ? `Vous devez être ami avec ${beneficiaryFirstName || 'cette personne'} pour voir sa liste de souhaits.`
                    : `${beneficiaryFirstName || 'Cette personne'} n'a pas encore d'articles dans sa liste de souhaits.`}
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
            <div className="space-y-3 pb-2">
              {favorites.map((fav) => {
                const product = fav.product;
                if (!product) return null;

                return (
                  <div
                    key={fav.id}
                    className="border border-border/60 rounded-xl p-3 hover:border-primary/30 transition-colors"
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
                      >
                        Créer
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
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
