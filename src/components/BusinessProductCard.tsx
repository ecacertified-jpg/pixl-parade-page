import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Users, Package, DollarSign, Cake, Play } from "lucide-react";
import { BusinessCollaborativeGiftModal } from "./BusinessCollaborativeGiftModal";
import { ProductRatingDisplay } from "./ProductRatingDisplay";
import { RatingModal } from "./RatingModal";
import { BirthdayAlertProductBadge } from "./BirthdayAlertProductBadge";
import { VideoPlayer } from "./VideoPlayer";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessBirthdayAlerts, BirthdayAlert } from "@/hooks/useBusinessBirthdayAlerts";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url?: string;
  video_url?: string | null;
  video_thumbnail_url?: string | null;
  business_owner_id: string;
  category_id?: string;
  category_name?: string;
  stock?: number;
  is_active?: boolean;
}

interface BusinessProductCardProps {
  product: Product;
  businessId?: string;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
}

export function BusinessProductCard({ 
  product, 
  businessId,
  onEdit, 
  onDelete 
}: BusinessProductCardProps) {
  const { user, loading: authLoading } = useAuth();
  const [showCollectiveModal, setShowCollectiveModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const { getAlertsForProduct, dismissAlert } = useBusinessBirthdayAlerts(businessId);

  // Get birthday alerts for this specific product
  const productAlerts = getAlertsForProduct(product.id);
  const hasAlert = productAlerts.length > 0;

  // Use user.id as primary businessId, businessId prop as fallback
  const effectiveBusinessId = businessId || user?.id;

  // Debug logs - comprehensive
  useEffect(() => {
    console.log('🔘 [BusinessProductCard] === COMPREHENSIVE DEBUG ===');
    console.log('🔘 [BusinessProductCard] Product:', product.name);
    console.log('🔘 [BusinessProductCard] businessId prop:', businessId);
    console.log('🔘 [BusinessProductCard] user?.id:', user?.id);
    console.log('🔘 [BusinessProductCard] effectiveBusinessId:', effectiveBusinessId);
    console.log('🔘 [BusinessProductCard] authLoading:', authLoading);
    console.log('🔘 [BusinessProductCard] user object:', user);
    console.log('🔘 [BusinessProductCard] Button should be enabled:', !authLoading && !!effectiveBusinessId);
    console.log('🔘 [BusinessProductCard] === END DEBUG ===');
  }, [businessId, user?.id, effectiveBusinessId, authLoading, product.name]);

  // Don't render if still loading auth
  if (authLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Chargement...</p>
        </div>
      </Card>
    );
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(product);
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm(`Êtes-vous sûr de vouloir supprimer "${product.name}" ?`)) {
      onDelete(product.id);
    }
  };

  const handleCreateCollective = () => {
    if (!effectiveBusinessId) {
      console.error('Business ID is required to create collective fund');
      return;
    }
    console.log('🎯 [BusinessProductCard] Creating collective fund with businessId:', effectiveBusinessId);
    setShowCollectiveModal(true);
  };

  return (
    <>
      <Card className={`overflow-hidden hover:shadow-lg transition-shadow relative ${hasAlert ? 'ring-2 ring-primary/50' : ''}`}>
        {/* Birthday Alert Badge */}
        {hasAlert && (
          <BirthdayAlertProductBadge
            alert={productAlerts[0]}
            onCreateFund={() => setShowCollectiveModal(true)}
            onDismiss={dismissAlert}
            compact
          />
        )}
        
        {/* Product Image */}
        <div className="aspect-square bg-muted relative overflow-hidden border-b">
          {product.video_thumbnail_url || product.image_url ? (
            <div className="relative w-full h-full">
              <img
                src={product.video_thumbnail_url || product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.video_url && (
                <div 
                  className="absolute inset-0 bg-black/20 flex items-center justify-center cursor-pointer hover:bg-black/30 transition-colors"
                  onClick={() => setShowVideoPlayer(true)}
                >
                  <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                    <Play className="h-7 w-7 text-white fill-white ml-1" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Package className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          {!product.is_active && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive">
                {product.stock === 0 ? '⚠️ Rupture de stock' : 'Inactif'}
              </Badge>
            </div>
          )}
          {product.is_active && product.stock && product.stock <= 5 && product.stock > 0 && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
                📦 Stock faible: {product.stock}
              </Badge>
            </div>
          )}
          {product.video_url && (
            <Badge className="absolute top-2 left-2 bg-purple-600 text-white">
              🎬 Vidéo
            </Badge>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Product Info */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold leading-tight">{product.name}</h3>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEdit}
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-600">
                  {product.price.toLocaleString()} {product.currency || 'XOF'}
                </span>
              </div>
              
              {product.category_name && (
                <Badge variant="outline" className="text-xs">
                  {product.category_name}
                </Badge>
              )}
            </div>

            {product.stock !== undefined && (
              <div className="flex items-center gap-1 text-sm">
                <Package className={`h-4 w-4 ${
                  product.stock === 0 
                    ? 'text-destructive' 
                    : product.stock <= 5 
                      ? 'text-orange-500' 
                      : 'text-muted-foreground'
                }`} />
                <span className={
                  product.stock === 0 
                    ? 'text-destructive font-semibold' 
                    : product.stock <= 5 
                      ? 'text-orange-500 font-semibold' 
                      : 'text-muted-foreground'
                }>
                  Stock: {product.stock}
                  {product.stock === 0 && ' - Rupture'}
                  {product.stock > 0 && product.stock <= 5 && ' - Stock faible'}
                </span>
              </div>
            )}

            {/* Product Rating */}
            <div className="pt-2 border-t">
              <ProductRatingDisplay
                productId={product.id}
                onWriteReview={() => setShowRatingModal(true)}
                compact
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleCreateCollective}
              disabled={authLoading || !effectiveBusinessId}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title={authLoading ? "Chargement..." : !effectiveBusinessId ? "Connexion requise" : "Créer une cotisation collaborative pour ce produit"}
            >
              <Users className="h-4 w-4 mr-2" />
              Créer une cotisation
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Organisez une cotisation pour offrir ce produit à un client
            </p>
          </div>
        </div>
      </Card>

      <BusinessCollaborativeGiftModal
        isOpen={showCollectiveModal}
        onClose={() => setShowCollectiveModal(false)}
        product={product}
        businessId={effectiveBusinessId || ''}
        onBack={() => setShowCollectiveModal(false)}
      />

      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        productId={product.id}
        productName={product.name}
      />

      {product.video_url && (
        <VideoPlayer
          videoUrl={product.video_url}
          isOpen={showVideoPlayer}
          onClose={() => setShowVideoPlayer(false)}
          title={product.name}
        />
      )}
    </>
  );
}