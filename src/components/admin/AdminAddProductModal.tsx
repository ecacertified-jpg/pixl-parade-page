import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Package, Image as ImageIcon, Video } from 'lucide-react';
import { logAdminAction } from '@/utils/auditLogger';
import { MultiImageUploader, ImageItem } from '@/components/MultiImageUploader';
import { MultiVideoUploader } from '@/components/MultiVideoUploader';
import { VideoItem, videoItemToProductVideo, ProductVideo, productVideoToVideoItem } from '@/types/video';

interface Business {
  id: string;
  business_name: string;
  user_id: string;
}

interface Category {
  id: string;
  name: string;
  name_fr: string;
}

interface DuplicateProduct {
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
  business_account_id: string;
}

interface AdminAddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded: () => void;
  preselectedBusinessId?: string;
  duplicateFromProduct?: DuplicateProduct | null;
}

export function AdminAddProductModal({ 
  open, 
  onOpenChange, 
  onProductAdded,
  preselectedBusinessId,
  duplicateFromProduct
}: AdminAddProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Multi image uploader state
  const [productImages, setProductImages] = useState<ImageItem[]>([]);
  
  // Multi video uploader state
  const [productVideos, setProductVideos] = useState<VideoItem[]>([]);
  
  const [formData, setFormData] = useState({
    business_id: preselectedBusinessId || '',
    name: '',
    description: '',
    price: '',
    stock_quantity: '10',
    category_id: '',
    is_experience: false,
    experience_type: '',
    location_name: '',
    is_active: true,
  });

  useEffect(() => {
    if (open) {
      loadBusinesses();
      loadCategories();
      
      // Handle duplication pre-fill
      if (duplicateFromProduct) {
        setFormData({
          business_id: duplicateFromProduct.business_account_id || preselectedBusinessId || '',
          name: `Copie de ${duplicateFromProduct.name}`,
          description: duplicateFromProduct.description || '',
          price: String(duplicateFromProduct.price),
          stock_quantity: String(duplicateFromProduct.stock_quantity),
          category_id: duplicateFromProduct.category_id || '',
          is_experience: duplicateFromProduct.is_experience,
          experience_type: duplicateFromProduct.experience_type || '',
          location_name: duplicateFromProduct.location_name || '',
          is_active: duplicateFromProduct.is_active,
        });
        
        // Pre-fill images from URLs
        if (duplicateFromProduct.images && duplicateFromProduct.images.length > 0) {
          const imageItems: ImageItem[] = duplicateFromProduct.images.map((url, index) => ({
            id: `existing-${index}-${Date.now()}`,
            url,
            isExisting: true,
          }));
          setProductImages(imageItems);
        } else if (duplicateFromProduct.image_url) {
          setProductImages([{
            id: `existing-0-${Date.now()}`,
            url: duplicateFromProduct.image_url,
            isExisting: true,
          }]);
        }
        
        // Pre-fill videos
        if (duplicateFromProduct.videos && duplicateFromProduct.videos.length > 0) {
          const videoItems: VideoItem[] = duplicateFromProduct.videos.map(productVideoToVideoItem);
          setProductVideos(videoItems);
        }
      } else if (preselectedBusinessId) {
        setFormData(prev => ({ ...prev, business_id: preselectedBusinessId }));
      }
    } else {
      // Reset when modal closes
      resetForm();
    }
  }, [open, preselectedBusinessId, duplicateFromProduct]);

  const loadBusinesses = async () => {
    const { data, error } = await supabase
      .from('business_accounts')
      .select('id, business_name, user_id')
      .eq('is_active', true)
      .order('business_name');

    if (!error && data) {
      setBusinesses(data);
    }
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, name_fr')
      .order('name_fr');

    if (!error && data) {
      setCategories(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.business_id || !formData.name || !formData.price) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      // Find the business to get the owner's user_id
      const selectedBusiness = businesses.find(b => b.id === formData.business_id);
      if (!selectedBusiness) {
        throw new Error('Business non trouvé');
      }

      // Upload all images to storage
      const uploadedImageUrls: string[] = [];
      
      for (const image of productImages) {
        if (image.file) {
          // Upload new image
          const fileExt = image.file.name.split('.').pop();
          const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
          const filePath = `products/${formData.business_id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, image.file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);
          
          uploadedImageUrls.push(urlData.publicUrl);
        } else if (image.url) {
          // Use existing URL (e.g., from existing image)
          uploadedImageUrls.push(image.url);
        }
      }

      // Convert videos to database format
      const videosForDb = productVideos.map(videoItemToProductVideo);
      
      // Get first video info for display
      const firstVideo = productVideos[0];

      // Create product - business_id is required, business_account_id is the same
      const { data: insertedProduct, error: insertError } = await supabase
        .from('products')
        .insert({
          business_id: formData.business_id,
          business_account_id: formData.business_id,
          business_owner_id: selectedBusiness.user_id,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          category_id: formData.category_id || null,
          is_experience: formData.is_experience,
          experience_type: formData.is_experience ? formData.experience_type : null,
          location_name: formData.is_experience ? formData.location_name : null,
          is_active: formData.is_active,
          // Images
          image_url: uploadedImageUrls[0] || null,
          images: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
          // Videos
          videos: videosForDb.length > 0 ? videosForDb : null,
          video_url: firstVideo?.url || null,
          video_thumbnail_url: firstVideo?.thumbnailUrl || null,
          video_uploaded_at: firstVideo ? new Date().toISOString() : null,
          currency: 'XOF',
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Notifier les followers du nouveau produit
      if (insertedProduct?.id && formData.is_active) {
        try {
          await supabase.functions.invoke('notify-new-product', {
            body: {
              productId: insertedProduct.id,
              productName: formData.name,
              businessId: formData.business_id,
              businessName: selectedBusiness.business_name,
              productImage: uploadedImageUrls[0] || null
            }
          });
          console.log('✅ Followers notifiés du nouveau produit');
        } catch (notifyError) {
          console.error('Error notifying followers:', notifyError);
          // Ne pas bloquer si la notification échoue
        }
      }

      // IndexNow: Soumettre le produit pour indexation rapide
      if (insertedProduct?.id && formData.is_active) {
        try {
          await supabase.functions.invoke('indexnow-notify', {
            body: {
              urls: [`https://joiedevivre-africa.com/product/${insertedProduct.id}`],
              entityType: 'product',
              entityId: insertedProduct.id,
              priority: 'high'
            }
          });
          console.log('✅ IndexNow: Produit soumis pour indexation');
        } catch (indexNowError) {
          console.error('IndexNow notification failed:', indexNowError);
          // Ne pas bloquer si IndexNow échoue
        }
      }

      // Log admin action
      await logAdminAction(
        'create_product',
        'product',
        insertedProduct?.id || null,
        `Produit "${formData.name}" créé pour ${selectedBusiness.business_name}`,
        { 
          business_id: formData.business_id, 
          product_name: formData.name,
          images_count: uploadedImageUrls.length,
          videos_count: productVideos.length
        }
      );

      toast.success('Produit ajouté avec succès');
      resetForm();
      onProductAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Erreur lors de la création du produit');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      business_id: preselectedBusinessId || '',
      name: '',
      description: '',
      price: '',
      stock_quantity: '10',
      category_id: '',
      is_experience: false,
      experience_type: '',
      location_name: '',
      is_active: true,
    });
    setProductImages([]);
    setProductVideos([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {duplicateFromProduct ? 'Dupliquer un produit (Admin)' : 'Ajouter un produit (Admin)'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Business Selection */}
          <div className="space-y-2">
            <Label>Business *</Label>
            <Select 
              value={formData.business_id} 
              onValueChange={(value) => setFormData({ ...formData, business_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un business" />
              </SelectTrigger>
              <SelectContent>
                {businesses.map((business) => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.business_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label>Nom du produit *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Gâteau d'anniversaire personnalisé"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du produit..."
              rows={3}
            />
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prix (XOF) *</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="15000"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Stock</Label>
              <Input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                placeholder="10"
                min="0"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select 
              value={formData.category_id} 
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name_fr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Experience Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <Label>C'est une expérience</Label>
              <p className="text-xs text-muted-foreground">
                Spa, atelier, événement, etc.
              </p>
            </div>
            <Switch
              checked={formData.is_experience}
              onCheckedChange={(checked) => setFormData({ ...formData, is_experience: checked })}
            />
          </div>

          {/* Experience Fields */}
          {formData.is_experience && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type d'expérience</Label>
                <Input
                  value={formData.experience_type}
                  onChange={(e) => setFormData({ ...formData, experience_type: e.target.value })}
                  placeholder="Spa, Atelier..."
                />
              </div>
              <div className="space-y-2">
                <Label>Lieu</Label>
                <Input
                  value={formData.location_name}
                  onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                  placeholder="Abidjan, Cocody..."
                />
              </div>
            </div>
          )}

          {/* Images Upload Section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Images du produit
            </Label>
            <MultiImageUploader
              images={productImages}
              onChange={setProductImages}
              maxImages={5}
              disabled={loading}
            />
          </div>

          {/* Videos Upload Section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Vidéos du produit
            </Label>
            <div className="text-xs text-muted-foreground mb-2">
              Ajoutez des vidéos avec miniatures personnalisées. La miniature de la première vidéo sera utilisée comme couverture dans la boutique.
            </div>
            <MultiVideoUploader
              videos={productVideos}
              onChange={setProductVideos}
              maxVideos={5}
              productType={formData.is_experience ? 'experience' : 'product'}
              disabled={loading}
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <Label>Produit actif</Label>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter le produit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
