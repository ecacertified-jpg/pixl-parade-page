import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Users, Package, DollarSign } from "lucide-react";
import { BusinessCollaborativeGiftModal } from "./BusinessCollaborativeGiftModal";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url?: string;
  business_owner_id: string;
  category_id?: string;
  category_name?: string;
  stock?: number;
  is_active?: boolean;
}

interface BusinessProductCardProps {
  product: Product;
  businessId: string;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
}

export function BusinessProductCard({ 
  product, 
  businessId,
  onEdit, 
  onDelete 
}: BusinessProductCardProps) {
  const [showCollectiveModal, setShowCollectiveModal] = useState(false);

  // Debug logs
  console.log('🎨 [BusinessProductCard] Rendering product card:', {
    productName: product.name,
    productId: product.id,
    businessId: businessId,
    hasBusinessId: !!businessId,
    businessIdType: typeof businessId,
    businessIdValue: businessId
  });

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
    if (!businessId) {
      console.error('Business ID is required to create collective fund');
      return;
    }
    setShowCollectiveModal(true);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {/* Product Image */}
        {product.image_url && (
          <div className="aspect-video bg-muted relative overflow-hidden">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {!product.is_active && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="destructive">Inactif</Badge>
              </div>
            )}
          </div>
        )}

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
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>Stock: {product.stock}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {(() => {
              console.log('🔘 [BusinessProductCard] Rendering button for product:', product.name);
              console.log('🔘 [BusinessProductCard] Button businessId:', businessId);
              console.log('🔘 [BusinessProductCard] Button disabled:', !businessId);
              return null;
            })()}
            
             <Button
               onClick={handleCreateCollective}
               disabled={!businessId}
               className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
               title={!businessId ? "ID business requis pour créer une cotisation" : ""}
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
        businessId={businessId}
        onBack={() => setShowCollectiveModal(false)}
      />
    </>
  );
}