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
import { Loader2, Package, Upload, X } from 'lucide-react';
import { logAdminAction } from '@/utils/auditLogger';

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

interface AdminAddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded: () => void;
  preselectedBusinessId?: string;
}

export function AdminAddProductModal({ 
  open, 
  onOpenChange, 
  onProductAdded,
  preselectedBusinessId 
}: AdminAddProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
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
      if (preselectedBusinessId) {
        setFormData(prev => ({ ...prev, business_id: preselectedBusinessId }));
      }
    }
  }, [open, preselectedBusinessId]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
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

      let imageUrl = null;
      
      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `products/${formData.business_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);
        
        imageUrl = urlData.publicUrl;
      }

      // Create product - business_id is required, business_account_id is the same
      const { error: insertError } = await supabase
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
          image_url: imageUrl,
          currency: 'XOF',
        });

      if (insertError) throw insertError;

      // Log admin action
      await logAdminAction(
        'create_product',
        'product',
        null,
        `Produit "${formData.name}" créé pour ${selectedBusiness.business_name}`,
        { business_id: formData.business_id, product_name: formData.name }
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
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ajouter un produit (Admin)
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

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Image du produit</Label>
            {imagePreview ? (
              <div className="relative w-full h-40 rounded-lg overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Cliquer pour ajouter une image</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            )}
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
