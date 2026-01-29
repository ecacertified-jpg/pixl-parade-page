import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Package, Pencil, Plus, Video, ImageIcon, Box, AlertCircle } from 'lucide-react';
import { AdminEditProductModal } from './AdminEditProductModal';
import { AdminAddProductModal } from './AdminAddProductModal';
import { ProductVideo } from '@/types/video';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  category_id: string | null;
  is_experience: boolean;
  experience_type: string | null;
  location_name: string | null;
  is_active: boolean;
  image_url: string | null;
  images?: string[] | null;
  videos?: ProductVideo[] | null;
  video_url?: string | null;
  video_thumbnail_url?: string | null;
  business_account_id: string;
}

interface AdminProductsModalProps {
  businessId: string | null;
  businessName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductsUpdated?: () => void;
}

export function AdminProductsModal({
  businessId,
  businessName,
  open,
  onOpenChange,
  onProductsUpdated
}: AdminProductsModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [addProductOpen, setAddProductOpen] = useState(false);

  useEffect(() => {
    if (open && businessId) {
      fetchProducts();
    }
  }, [open, businessId]);

  const fetchProducts = async () => {
    if (!businessId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price, stock_quantity, category_id, is_experience, experience_type, location_name, is_active, image_url, images, videos, video_url, video_thumbnail_url, business_account_id')
        .eq('business_account_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map data to match our Product interface
      const mappedProducts: Product[] = (data || []).map(p => ({
        ...p,
        images: Array.isArray(p.images) ? p.images as string[] : null,
        videos: Array.isArray(p.videos) ? p.videos as unknown as ProductVideo[] : null,
      }));
      
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const handleProductUpdated = () => {
    fetchProducts();
    onProductsUpdated?.();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' F';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] sm:max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produits de {businessName}
            </DialogTitle>
          </DialogHeader>

          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => setAddProductOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter un produit
            </Button>
          </div>

          <div className="min-h-0 flex-1 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pr-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun produit pour ce prestataire</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setAddProductOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter le premier produit
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {products.map((product) => {
                  const hasVideo = !!(product.video_url || (product.videos && product.videos.length > 0));
                  const thumbnail = product.video_thumbnail_url || product.image_url;
                  
                  return (
                    <div 
                      key={product.id} 
                      className="group relative bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Product Image/Video Thumbnail */}
                      <div className="relative aspect-square bg-muted">
                        {thumbnail ? (
                          <img 
                            src={thumbnail} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                          </div>
                        )}
                        
                        {/* Badges overlay */}
                        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                          {hasVideo && (
                            <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
                              <Video className="h-3 w-3 mr-1" />
                              Vidéo
                            </Badge>
                          )}
                          {!product.is_active && (
                            <Badge variant="destructive">
                              Inactif
                            </Badge>
                          )}
                          {product.stock_quantity === 0 && (
                            <Badge variant="outline" className="bg-orange-500/90 text-white border-0">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Rupture
                            </Badge>
                          )}
                        </div>

                        {/* Edit button overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => setEditingProduct(product)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                          </Button>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-3">
                        <h3 className="font-medium text-sm truncate">{product.name}</h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-primary font-semibold text-sm">
                            {formatPrice(product.price)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Stock: {product.stock_quantity}
                          </span>
                        </div>
                        {product.is_experience && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {product.experience_type || 'Expérience'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              {products.length} produit{products.length !== 1 ? 's' : ''}
            </span>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <AdminEditProductModal
        product={editingProduct}
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        onProductUpdated={handleProductUpdated}
      />

      {/* Add Product Modal */}
      {businessId && (
        <AdminAddProductModal
          preselectedBusinessId={businessId}
          open={addProductOpen}
          onOpenChange={setAddProductOpen}
          onProductAdded={handleProductUpdated}
        />
      )}
    </>
  );
}
