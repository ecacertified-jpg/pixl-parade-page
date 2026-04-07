import { useNavigate } from 'react-router-dom';
import { Gift, Heart, Loader2, ShoppingBag } from 'lucide-react';
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

interface WishlistFundPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFundCreated?: () => void;
}

export function WishlistFundPickerModal({ isOpen, onClose, onFundCreated }: WishlistFundPickerModalProps) {
  const navigate = useNavigate();
  const { favorites, loading } = useFavorites();
  const { addItem } = useCart();
  const { user } = useAuth();

  const handleCreateFund = (fav: typeof favorites[0]) => {
    const product = fav.product;
    if (!product) return;

    const firstName = user?.user_metadata?.first_name || user?.user_metadata?.firstName || '';
    const lastName = user?.user_metadata?.last_name || user?.user_metadata?.lastName || '';
    const beneficiaryName = `${firstName} ${lastName}`.trim() || 'Moi-même';

    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || undefined,
      currency: product.currency || 'XOF',
      description: product.description || undefined,
      isCollaborativeGift: true,
      isSelfFund: true,
      beneficiaryName,
      beneficiaryId: user?.id,
    });

    onClose();
    onFundCreated?.();
    navigate('/cart');
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-FR').format(price);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-poppins flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Ma liste de souhaits
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Choisissez un article pour créer votre cagnotte
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
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Votre liste de souhaits est vide
              </p>
              <Button
                size="sm"
                onClick={() => { onClose(); navigate('/favorites'); }}
              >
                Ajouter des articles
              </Button>
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
