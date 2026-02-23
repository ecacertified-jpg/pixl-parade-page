import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Gift, Calendar, Heart, ShoppingCart, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useContactGiftHistory } from "@/hooks/useContactGiftHistory";
import { AIRecommendationsSection } from "@/components/AIRecommendationsSection";
import { ContactWishlistSection } from "@/components/ContactWishlistSection";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { SEOHead, SEO_CONFIGS } from "@/components/SEOHead";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Contact {
  id: string;
  name: string;
  birthday: string | null;
  avatar_url: string | null;
  relationship: string | null;
  phone: string | null;
  email: string | null;
}

export default function GiftIdeas() {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [contactLoading, setContactLoading] = useState(true);
  const { gifts, stats, loading: historyLoading } = useContactGiftHistory(contactId);
  const { addItem } = useCart();
  const { addFavorite } = useFavorites();

  useEffect(() => {
    if (!contactId) return;

    const fetchContact = async () => {
      setContactLoading(true);
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, birthday, avatar_url, relationship, phone, email")
        .eq("id", contactId)
        .single();

      if (!error && data) {
        setContact(data);
      }
      setContactLoading(false);
    };

    fetchContact();
  }, [contactId]);

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url,
      quantity: 1,
    });
  };

  const handleAddToFavorites = (productId: string) => {
    addFavorite(productId);
  };

  const getRelationshipLabel = (relationship: string | null) => {
    const labels: Record<string, string> = {
      family: "Famille",
      friend: "Ami(e)",
      colleague: "Collègue",
      neighbor: "Voisin(e)",
      other: "Autre",
    };
    return relationship ? labels[relationship] || relationship : "Contact";
  };

  const getOccasionLabel = (occasion: string | null) => {
    const labels: Record<string, string> = {
      birthday: "Anniversaire",
      wedding: "Mariage",
      promotion: "Promotion",
      academic: "Réussite académique",
      christmas: "Noël",
      valentine: "Saint-Valentin",
      other: "Autre",
    };
    return occasion ? labels[occasion] || occasion : "Occasion";
  };

  if (contactLoading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
        <Gift className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Contact non trouvé</p>
        <Button variant="link" onClick={() => navigate(-1)}>
          Retour
        </Button>
      </div>
    );
  }

  return (
    <>
    <SEOHead 
      {...SEO_CONFIGS.giftIdeas}
      title={`Idées cadeaux pour ${contact.name} | JOIE DE VIVRE`}
      description={`Trouvez le cadeau parfait pour ${contact.name}. Suggestions personnalisées basées sur l'historique et les préférences.`}
    />
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Idées cadeaux</h1>
            <p className="text-sm text-muted-foreground">pour {contact.name}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Contact Profile Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={contact.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                  {contact.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{contact.name}</h2>
                <Badge variant="secondary" className="mt-1">
                  {getRelationshipLabel(contact.relationship)}
                </Badge>
                {contact.birthday && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Anniversaire : {format(new Date(contact.birthday), "d MMMM", { locale: fr })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Gift Stats */}
            {stats.totalGifts > 0 && (
              <div className="mt-4 pt-4 border-t border-primary/10">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{stats.totalGifts}</p>
                    <p className="text-xs text-muted-foreground">Cadeaux offerts</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {stats.totalSpent.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">XOF dépensés</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {stats.favoriteOccasion ? getOccasionLabel(stats.favoriteOccasion) : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">Occasion fav.</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gift History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="h-5 w-5 text-pink-500" />
              Cadeaux déjà offerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : gifts.length > 0 ? (
              <ScrollArea className="max-h-48">
                <div className="space-y-3">
                  {gifts.map((gift) => (
                    <div
                      key={gift.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      {gift.products?.image_url ? (
                        <img
                          src={gift.products.image_url}
                          alt={gift.gift_name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Gift className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{gift.gift_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {getOccasionLabel(gift.occasion)}
                          </Badge>
                          <span>·</span>
                          <span>{format(new Date(gift.gift_date), "MMM yyyy", { locale: fr })}</span>
                        </div>
                      </div>
                      {gift.amount && (
                        <span className="text-sm font-medium text-primary">
                          {gift.amount.toLocaleString()} XOF
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun cadeau offert pour le moment</p>
                <p className="text-xs mt-1">Les suggestions seront plus personnalisées après votre premier cadeau</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Wishlist */}
        <ContactWishlistSection
          contactId={contactId}
          contactName={contact.name}
          onSelectProduct={(item) => {
            if (item.product) {
              handleAddToCart({
                id: item.product.id,
                name: item.product.name,
                price: item.product.price,
                image_url: item.product.image_url,
              });
            }
          }}
        />

        {/* AI Recommendations */}
        <AIRecommendationsSection
          defaultContactId={contactId}
          contactName={contact.name}
          onAddToCart={handleAddToCart}
          onAddToFavorites={handleAddToFavorites}
        />
      </div>
    </div>
    </>
  );
}
