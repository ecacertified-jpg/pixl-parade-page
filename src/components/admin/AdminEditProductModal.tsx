import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MultiImageUploader, ImageItem } from '@/components/MultiImageUploader';
import { MultiVideoUploader } from '@/components/MultiVideoUploader';
import { VideoItem, ProductVideo, productVideoToVideoItem, videoItemToProductVideo } from '@/types/video';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Package, Trash2 } from 'lucide-react';
import { logAdminAction } from '@/utils/auditLogger';

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
  video_uploaded_at?: string | null;
  business_account_id: string;
}

interface Category {
  id: string;
  name: string;
  name_fr: string;
}

interface AdminEditProductModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated: () => void;
}

export function AdminEditProductModal({ 
  product,
  open, 
  onOpenChange, 
  onProductUpdated 
}: AdminEditProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productImages, setProductImages] = useState<ImageItem[]>([]);
  const [productVideos, setProductVideos] = useState<VideoItem[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category_id: '',
    is_experience: false,
    experience_type: '',
    location_name: '',
    is_active: true,
  });

  useEffect(() => {
    if (open && product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        stock_quantity: product.stock_quantity.toString(),
        category_id: product.category_id || '',
        is_experience: product.is_experience || false,
        experience_type: product.experience_type || '',
        location_name: product.location_name || '',
        is_active: product.is_active,
      });
      
      // Load existing images
      const existingImages: ImageItem[] = [];
      if (product.image_url) {
        existingImages.push({
          id: 'main-image',
          url: product.image_url,
          isExisting: true
        });
      }
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach((url, index) => {
          if (url !== product.image_url) {
            existingImages.push({
              id: `existing-${index}`,
              url,
              isExisting: true
            });
          }
        });
      }
      setProductImages(existingImages);
      
      // Load existing videos
      if (product.videos && Array.isArray(product.videos)) {
        const existingVideos = (product.videos as ProductVideo[]).map(productVideoToVideoItem);
        setProductVideos(existingVideos);
      } else if (product.video_url) {
        // Fallback for old format
        setProductVideos([{
          id: 'legacy-video',
          url: product.video_url,
          thumbnailUrl: product.video_thumbnail_url || null,
          source: 'direct',
          order: 0,
          isExisting: true,
        }]);
      } else {
        setProductVideos([]);
      }
      
      loadCategories();
    }
  }, [open, product]);

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
    if (!product) return;
    
    if (!formData.name || !formData.price) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      // Upload new images
      const uploadedUrls: string[] = [];
      
      for (const image of productImages) {
        if (image.file) {
          const fileExt = image.file.name.split('.').pop();
          const fileName = `${Date.now()}_${uploadedUrls.length}.${fileExt}`;
          const filePath = `products/${product.business_account_id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, image.file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);
          
          uploadedUrls.push(urlData.publicUrl);
        } else if (image.url && image.isExisting) {
          uploadedUrls.push(image.url);
        }
      }

      // Convert videos to database format
      const videosForDb = productVideos.map(videoItemToProductVideo) as unknown as import('@/integrations/supabase/types').Json;
      const firstVideo = productVideos[0];
      
      // Check if video has changed (new video added or first video changed)
      const originalFirstVideoUrl = product.video_url;
      const newFirstVideoUrl = firstVideo?.url;
      const videoHasChanged = originalFirstVideoUrl !== newFirstVideoUrl;

      // Update product
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          category_id: formData.category_id || null,
          is_experience: formData.is_experience,
          experience_type: formData.is_experience ? formData.experience_type : null,
          location_name: formData.is_experience ? formData.location_name : null,
          is_active: formData.is_active,
          image_url: uploadedUrls[0] || null,
          images: uploadedUrls,
          videos: videosForDb,
          video_url: firstVideo?.url || null,
          video_thumbnail_url: firstVideo?.thumbnailUrl || null,
          video_uploaded_at: videoHasChanged && firstVideo ? new Date().toISOString() : product.video_uploaded_at,
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      // Log admin action
      // IndexNow: Soumettre le produit pour indexation si activé
      if (formData.is_active) {
        try {
          await supabase.functions.invoke('indexnow-notify', {
            body: {
              urls: [`https://joiedevivre-africa.com/product/${product.id}`],
              entityType: 'product',
              entityId: product.id,
              priority: 'normal'
            }
          });
          console.log('✅ IndexNow: Produit soumis pour indexation');
        } catch (indexNowError) {
          console.error('IndexNow notification failed:', indexNowError);
        }
      }

      await logAdminAction(
        'update_product',
        'product',
        product.id,
        `Produit "${formData.name}" modifié`,
        { product_id: product.id, product_name: formData.name }
      );

      toast.success('Produit mis à jour avec succès');
      onProductUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Erreur lors de la mise à jour du produit');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      // Log admin action
      await logAdminAction(
        'delete_product',
        'product',
        product.id,
        `Produit "${product.name}" supprimé`,
        { product_id: product.id, product_name: product.name }
      );

      toast.success('Produit supprimé avec succès');
      onProductUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erreur lors de la suppression du produit');
    } finally {
      setDeleting(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Modifier le produit (Admin)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Images du produit</Label>
            <MultiImageUploader
              images={productImages}
              onChange={setProductImages}
              maxImages={5}
              disabled={loading}
            />
          </div>

          {/* Video Upload */}
          <div className="space-y-2">
            <MultiVideoUploader
              videos={productVideos}
              onChange={setProductVideos}
              maxVideos={5}
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={deleting}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer le produit ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Le produit "{product.name}" sera définitivement supprimé.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
