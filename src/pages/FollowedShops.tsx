import { ArrowLeft, Store, BellOff, Package, Loader2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useFollowedShops } from '@/hooks/useFollowedShops';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function FollowedShops() {
  const navigate = useNavigate();
  const { shops, loading, unfollowShop } = useFollowedShops();

  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString('fr-FR')} ${currency}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">Mes boutiques suivies</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="bg-primary/10 rounded-lg p-4 flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Boutiques suivies</p>
            <p className="text-2xl font-bold">{shops.length}</p>
          </div>
        </div>

        {/* Empty state */}
        {shops.length === 0 && (
          <Card className="p-8 text-center">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucune boutique suivie</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Suivez vos boutiques préférées pour recevoir des notifications sur leurs nouveaux produits
            </p>
            <Button onClick={() => navigate('/shop')}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Découvrir des boutiques
            </Button>
          </Card>
        )}

        {/* Shop list */}
        <div className="space-y-4">
          {shops.map(shop => (
            <Card key={shop.id} className="overflow-hidden">
              {/* Shop header */}
              <div className="p-4 border-b border-border/50">
                <div className="flex items-start gap-3">
                  <Avatar 
                    className="h-12 w-12 cursor-pointer" 
                    onClick={() => navigate(`/boutique/${shop.businessId}`)}
                  >
                    <AvatarImage src={shop.logoUrl || undefined} alt={shop.businessName} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {shop.businessName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="font-semibold truncate cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/boutique/${shop.businessId}`)}
                    >
                      {shop.businessName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {shop.businessType && (
                        <Badge variant="secondary" className="text-xs">
                          {shop.businessType}
                        </Badge>
                      )}
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {shop.totalProductCount} produit{shop.totalProductCount > 1 ? 's' : ''}
                      </span>
                    </div>
                    {shop.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {shop.description}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => unfollowShop(shop.businessId, shop.businessName)}
                  >
                    <BellOff className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Ne plus suivre</span>
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  Suivi depuis {formatDistanceToNow(new Date(shop.followedAt), { locale: fr, addSuffix: false })}
                </p>
              </div>

              {/* Latest products */}
              {shop.latestProducts.length > 0 && (
                <div className="p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium">Derniers produits</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-7"
                      onClick={() => navigate(`/boutique/${shop.businessId}`)}
                    >
                      Voir tout →
                    </Button>
                  </div>
                  
                  <ScrollArea className="w-full">
                    <div className="flex gap-3 pb-2">
                      {shop.latestProducts.map(product => (
                        <div 
                          key={product.id} 
                          className="shrink-0 w-24 cursor-pointer group"
                          onClick={() => navigate(`/shop?product=${product.id}`)}
                        >
                          <div className="aspect-square rounded-lg bg-muted overflow-hidden mb-1.5">
                            {product.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-medium truncate">{product.name}</p>
                          <p className="text-xs text-primary font-semibold">
                            {formatPrice(product.price, product.currency)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              )}

              {shop.latestProducts.length === 0 && (
                <div className="p-4 bg-muted/30 text-center">
                  <p className="text-sm text-muted-foreground">
                    Aucun produit disponible pour le moment
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
