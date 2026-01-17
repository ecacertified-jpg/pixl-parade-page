import { useState, useEffect } from "react";
import { Share2, TrendingUp, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface SharedProduct {
  productId: string;
  productName: string;
  productImage: string;
  totalShares: number;
  sharesThisWeek: number;
  topPlatform: string;
}

interface MostSharedProductsProps {
  businessId: string;
}

const platformLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  sms: 'SMS',
  email: 'Email',
  native: 'Partage natif',
  copy_link: 'Lien copié',
};

export function MostSharedProducts({ businessId }: MostSharedProductsProps) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<SharedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchMostShared = async () => {
      if (!businessId) {
        setLoading(false);
        return;
      }

      try {
        // First get products for this business
        const { data: businessProducts, error: productsError } = await supabase
          .from('products')
          .select('id, name, image_url')
          .eq('business_account_id', businessId)
          .eq('is_active', true);

        if (productsError || !businessProducts || businessProducts.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        const productIds = businessProducts.map(p => p.id);
        const productMap = new Map(businessProducts.map(p => [p.id, p]));

        // Get all shares for these products
        const { data: shares, error: sharesError } = await supabase
          .from('product_shares')
          .select('product_id, share_platform, created_at')
          .in('product_id', productIds);

        if (sharesError) {
          console.error('Error fetching shares:', sharesError);
          setProducts([]);
          setLoading(false);
          return;
        }

        if (!shares || shares.length === 0) {
          setProducts([]);
          setPlatformStats({});
          setLoading(false);
          return;
        }

        // Calculate stats per product
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const productStats: Record<string, { total: number; week: number; platforms: Record<string, number> }> = {};
        const overallPlatforms: Record<string, number> = {};

        shares.forEach((share) => {
          const pid = share.product_id;
          if (!productStats[pid]) {
            productStats[pid] = { total: 0, week: 0, platforms: {} };
          }
          
          productStats[pid].total++;
          
          const createdAt = new Date(share.created_at);
          if (createdAt >= weekAgo) {
            productStats[pid].week++;
          }
          
          const platform = share.share_platform;
          productStats[pid].platforms[platform] = (productStats[pid].platforms[platform] || 0) + 1;
          overallPlatforms[platform] = (overallPlatforms[platform] || 0) + 1;
        });

        // Build top 5 products
        const sortedProducts = Object.entries(productStats)
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 5)
          .map(([productId, stats]) => {
            const product = productMap.get(productId);
            const topPlatform = Object.entries(stats.platforms).sort((a, b) => b[1] - a[1])[0]?.[0] || 'whatsapp';
            
            return {
              productId,
              productName: product?.name || 'Produit inconnu',
              productImage: product?.image_url || '/placeholder.svg',
              totalShares: stats.total,
              sharesThisWeek: stats.week,
              topPlatform,
            };
          });

        setProducts(sortedProducts);
        setPlatformStats(overallPlatforms);
      } catch (error) {
        console.error('Error fetching most shared products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMostShared();
  }, [businessId]);

  const totalShares = Object.values(platformStats).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Produits les plus partagés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Produits les plus partagés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Share2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun partage enregistré</p>
            <p className="text-xs mt-1">Les partages de vos produits apparaîtront ici</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Produits les plus partagés
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {totalShares} partage{totalShares > 1 ? 's' : ''} total
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Products list */}
        <div className="space-y-3">
          {products.map((product, index) => (
            <div key={product.productId} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 text-center">
                <span className={`text-sm font-bold ${index < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {index + 1}.
                </span>
              </div>
              <img
                src={product.productImage}
                alt={product.productName}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.productName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{product.totalShares} partage{product.totalShares > 1 ? 's' : ''}</span>
                  {product.sharesThisWeek > 0 && (
                    <Badge variant="outline" className="text-xs py-0 px-1 flex items-center gap-0.5">
                      <TrendingUp className="h-2.5 w-2.5" />
                      +{product.sharesThisWeek} sem.
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => navigate(`/p/${product.productId}`)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Platform breakdown */}
        {totalShares > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Répartition par plateforme</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(platformStats)
                .sort((a, b) => b[1] - a[1])
                .map(([platform, count]) => {
                  const percentage = Math.round((count / totalShares) * 100);
                  return (
                    <Badge key={platform} variant="outline" className="text-xs">
                      {platformLabels[platform] || platform}: {percentage}%
                    </Badge>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
