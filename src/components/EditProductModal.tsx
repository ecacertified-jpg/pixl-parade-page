import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MultiImageUploader, ImageItem } from "@/components/MultiImageUploader";
import { VideoUploader } from "@/components/VideoUploader";
import { Loader2, Package, Trash2, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessCategories } from "@/hooks/useBusinessCategories";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock_quantity?: number;
  stock?: number;
  category_name?: string | null;
  business_category_id?: string | null;
  is_experience?: boolean;
  experience_type?: string | null;
  location_name?: string | null;
  is_active?: boolean;
  image_url?: string | null;
  images?: string[] | null;
  video_url?: string | null;
  video_thumbnail_url?: string | null;
  business_id?: string;
  business_account_id?: string;
}

interface EditProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: () => void;
}

const productCategories = [
  "Bijoux & Accessoires",
  "Parfums & Beauté",
  "Tech & Électronique",
  "Mode & Vêtements",
  "Artisanat Ivoirien",
  "Gastronomie & Délices",
  "Décoration & Maison",
  "Loisirs & Divertissement",
  "Bébé & Enfants",
  "Affaires & Bureau"
];

const experienceCategories = [
  "Restaurants & Gastronomie",
  "Bien-être & Spa",
  "Séjours & Hébergement",
  "Événements & Célébrations",
  "Formation & Développement",
  "Expériences VIP",
  "Souvenirs & Photographie",
  "Culture & Loisirs",
  "Mariage & Fiançailles",
  "Occasions Spéciales"
];

export function EditProductModal({ product, isOpen, onClose, onProductUpdated }: EditProductModalProps) {
  const { user } = useAuth();
  const { categories: businessCategories } = useBusinessCategories();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [productImages, setProductImages] = useState<ImageItem[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    category_name: "",
    business_category_id: "",
    is_experience: false,
    experience_type: "",
    location_name: "",
    is_active: true,
  });

  // Load product data when modal opens
  useEffect(() => {
    if (isOpen && product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        stock_quantity: (product.stock_quantity ?? product.stock ?? 0).toString(),
        category_name: product.category_name || "",
        business_category_id: product.business_category_id || "",
        is_experience: product.is_experience || false,
        experience_type: product.experience_type || "",
        location_name: product.location_name || "",
        is_active: product.is_active ?? true,
      });
      
      setUseCustomCategory(!!product.business_category_id);
      
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
      
      // Load existing video
      setVideoUrl(product.video_url || null);
      setVideoThumbnailUrl(product.video_thumbnail_url || null);
    }
  }, [isOpen, product]);

  const allCategories = formData.is_experience ? experienceCategories : productCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !user) return;
    
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
          // New file to upload
          const fileExt = image.file.name.split('.').pop();
          const fileName = `product_${Date.now()}_${uploadedUrls.length}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(fileName, image.file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('products')
            .getPublicUrl(fileName);
          
          uploadedUrls.push(urlData.publicUrl);
        } else if (image.url && image.isExisting) {
          // Existing image URL
          uploadedUrls.push(image.url);
        }
      }

      // Update product
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          category_name: useCustomCategory ? null : formData.category_name,
          business_category_id: useCustomCategory ? formData.business_category_id : null,
          is_experience: formData.is_experience,
          experience_type: formData.is_experience ? formData.experience_type : null,
          location_name: formData.is_experience ? formData.location_name : null,
          is_active: formData.is_active,
          image_url: uploadedUrls[0] || null,
          images: uploadedUrls,
          video_url: videoUrl,
          video_thumbnail_url: videoThumbnailUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      toast.success('Produit mis à jour avec succès');
      onProductUpdated();
      onClose();
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

      if (error) {
        // Handle foreign key constraint violation
        if (error.code === '23503') {
          toast.error('Impossible de supprimer ce produit car il fait partie de commandes existantes.');
          
          if (confirm('Voulez-vous le désactiver à la place ?')) {
            const { error: updateError } = await supabase
              .from('products')
              .update({ is_active: false })
              .eq('id', product.id);
              
            if (!updateError) {
              toast.success('Produit désactivé avec succès');
              onProductUpdated();
              onClose();
            }
          }
          return;
        }
        throw error;
      }

      toast.success('Produit supprimé avec succès');
      onProductUpdated();
      onClose();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erreur lors de la suppression du produit');
    } finally {
      setDeleting(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Modifier le produit
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name */}
          <div className="space-y-2">
            <Label>Nom du produit *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Bracelet Doré Élégance"
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

          {/* Category Type Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Type de catégorie</Label>
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomCategory(false);
                    setFormData({ ...formData, business_category_id: '' });
                  }}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    !useCustomCategory 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Prédéfinie
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomCategory(true);
                    setFormData({ ...formData, category_name: '' });
                  }}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    useCustomCategory 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <Tag className="h-3 w-3 mr-1 inline" />
                  Personnalisée
                </button>
              </div>
            </div>

            {useCustomCategory ? (
              <div>
                <Label>Catégorie personnalisée</Label>
                {businessCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    Aucune catégorie personnalisée disponible.
                  </p>
                ) : (
                  <Select 
                    value={formData.business_category_id} 
                    onValueChange={(value) => setFormData({ ...formData, business_category_id: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-3 w-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : (
              <div>
                <Label>Catégorie prédéfinie</Label>
                <Select 
                  value={formData.category_name} 
                  onValueChange={(value) => setFormData({ ...formData, category_name: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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

          {/* Multi-Image Upload */}
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
          <div className="border-t pt-4">
            <VideoUploader
              videoUrl={videoUrl}
              thumbnailUrl={videoThumbnailUrl}
              onVideoChange={setVideoUrl}
              onThumbnailChange={setVideoThumbnailUrl}
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
                <Button type="button" variant="destructive" size="icon" disabled={deleting}>
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
                  <AlertDialogAction 
                    onClick={handleDelete} 
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
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
