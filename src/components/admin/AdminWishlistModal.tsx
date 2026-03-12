import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Gift, ShoppingCart, Sparkles, Info, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CreateSurpriseFundModal } from "@/components/CreateSurpriseFundModal";

interface WishlistProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
}

interface WishlistItem {
  id: string;
  product_id: string;
  priority_level: string;
  occasion_type: string | null;
  accept_alternatives: boolean;
  notes: string | null;
  context_usage: string[];
  product: WishlistProduct | null;
}

interface ContactWithWishlist {
  contactId: string;
  contactName: string;
  linkedUserId: string;
  items: WishlistItem[];
}

interface AdminWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700 border-red-200" },
  high: { label: "Prioritaire", color: "bg-orange-100 text-orange-700 border-orange-200" },
  medium: { label: "Moyen", color: "bg-blue-100 text-blue-700 border-blue-200" },
  low: { label: "Faible", color: "bg-muted text-muted-foreground border-border" },
};

const occasionLabels: Record<string, string> = {
  birthday: "Anniversaire",
  wedding: "Mariage",
  promotion: "Promotion",
  achievement: "Réussite",
  christmas: "Noël",
  valentines: "Saint-Valentin",
  other: "Autre",
};

function mapFavorites(data: any[]): WishlistItem[] {
  return (data || []).map((item: any) => ({
    id: item.id,
    product_id: item.product_id,
    priority_level: item.priority_level,
    occasion_type: item.occasion_type,
    accept_alternatives: item.accept_alternatives,
    notes: item.notes,
    context_usage: item.context_usage || [],
    product: item.products,
  }));
}

export function AdminWishlistModal({ isOpen, onClose, userId, userName }: AdminWishlistModalProps) {
  const [loading, setLoading] = useState(true);
  const [personalWishlist, setPersonalWishlist] = useState<WishlistItem[]>([]);
  const [contactWishlists, setContactWishlists] = useState<ContactWithWishlist[]>([]);
  const [fundModal, setFundModal] = useState<{
    open: boolean;
    beneficiaryContactId?: string;
    beneficiaryName?: string;
    occasion?: 'birthday' | 'wedding' | 'promotion' | 'other';
  }>({ open: false });

  useEffect(() => {
    if (isOpen && userId) {
      loadAllWishlists();
    }
  }, [isOpen, userId]);

  const loadAllWishlists = async () => {
    setLoading(true);
    try {
      // 1. Load user's personal wishlist
      const { data: personalData } = await supabase
        .from('user_favorites')
        .select('id, product_id, priority_level, occasion_type, accept_alternatives, notes, context_usage, products (id, name, description, price, currency, image_url)')
        .eq('user_id', userId)
        .order('priority_level', { ascending: true });

      setPersonalWishlist(mapFavorites(personalData || []));

      // 2. Load user's contacts with linked_user_id
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name, linked_user_id')
        .eq('user_id', userId)
        .not('linked_user_id', 'is', null);

      if (contacts && contacts.length > 0) {
        const contactResults: ContactWithWishlist[] = [];

        for (const contact of contacts) {
          if (!contact.linked_user_id) continue;

          const { data: favs } = await supabase
            .from('user_favorites')
            .select('id, product_id, priority_level, occasion_type, accept_alternatives, notes, context_usage, products (id, name, description, price, currency, image_url)')
            .eq('user_id', contact.linked_user_id)
            .order('priority_level', { ascending: true });

          const items = mapFavorites(favs || []);
          if (items.length > 0) {
            contactResults.push({
              contactId: contact.id,
              contactName: contact.name,
              linkedUserId: contact.linked_user_id,
              items,
            });
          }
        }

        setContactWishlists(contactResults);
      } else {
        setContactWishlists([]);
      }
    } catch (err) {
      console.error('Error loading wishlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFund = (item: WishlistItem, beneficiaryContactId?: string, beneficiaryName?: string) => {
    setFundModal({
      open: true,
      beneficiaryContactId,
      beneficiaryName: beneficiaryName || userName,
      occasion: (item.occasion_type as any) || undefined,
    });
  };

  const totalItems = personalWishlist.length + contactWishlists.reduce((s, c) => s + c.items.length, 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Souhaits de {userName}
            </DialogTitle>
            <DialogDescription>
              {totalItems} article{totalItems !== 1 ? 's' : ''} au total dans les listes de souhaits
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[65vh] pr-2">
            {loading ? (
              <div className="space-y-3 p-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : totalItems === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Aucun souhait trouvé</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ni {userName} ni ses contacts n'ont de liste de souhaits
                </p>
              </div>
            ) : (
              <div className="space-y-6 p-1">
                {/* Personal wishlist */}
                {personalWishlist.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <Heart className="h-4 w-4 text-primary" />
                      Souhaits personnels de {userName}
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {personalWishlist.length}
                      </Badge>
                    </h3>
                    <div className="space-y-2">
                      {personalWishlist.map((item) => (
                        <WishlistItemRow
                          key={item.id}
                          item={item}
                          onCreateFund={() => handleCreateFund(item, undefined, userName)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact wishlists */}
                {contactWishlists.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-primary" />
                      Souhaits des contacts de {userName}
                    </h3>
                    <div className="space-y-4">
                      {contactWishlists.map((cw) => (
                        <div key={cw.contactId}>
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                            <Gift className="h-3.5 w-3.5" />
                            {cw.contactName}
                            <Badge variant="outline" className="text-[10px] ml-1">{cw.items.length}</Badge>
                          </p>
                          <div className="space-y-2">
                            {cw.items.map((item) => (
                              <WishlistItemRow
                                key={item.id}
                                item={item}
                                onCreateFund={() => handleCreateFund(item, cw.contactId, cw.contactName)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <CreateSurpriseFundModal
        isOpen={fundModal.open}
        onClose={() => setFundModal({ open: false })}
        beneficiaryContactId={fundModal.beneficiaryContactId}
        beneficiaryName={fundModal.beneficiaryName}
        occasion={fundModal.occasion}
        onSuccess={() => setFundModal({ open: false })}
      />
    </>
  );
}

function WishlistItemRow({ item, onCreateFund }: { item: WishlistItem; onCreateFund: () => void }) {
  const priority = priorityConfig[item.priority_level] || priorityConfig.medium;

  return (
    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
      {item.product?.image_url ? (
        <img
          src={item.product.image_url}
          alt={item.product?.name || "Produit"}
          className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Gift className="h-5 w-5 text-primary" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {item.product?.name || "Produit indisponible"}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <Badge variant="outline" className={`text-xs ${priority.color}`}>
            {priority.label}
          </Badge>
          {item.occasion_type && (
            <Badge variant="outline" className="text-xs">
              {occasionLabels[item.occasion_type] || item.occasion_type}
            </Badge>
          )}
          {item.accept_alternatives && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Info className="h-3 w-3" />
              Alternatives OK
            </span>
          )}
        </div>
        {item.notes && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">« {item.notes} »</p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {item.product && (
          <span className="text-sm font-semibold text-primary whitespace-nowrap">
            {item.product.price.toLocaleString()} {item.product.currency}
          </span>
        )}
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onCreateFund}>
          <ShoppingCart className="h-3 w-3" />
          Créer une cagnotte
        </Button>
      </div>
    </div>
  );
}
