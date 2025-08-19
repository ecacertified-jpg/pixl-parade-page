import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

export function AddProductModal({ isOpen, onClose, onProductAdded }: AddProductModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    stock_quantity: ""
  });

  const categories = [
    { id: "bijoux", name: "Bijoux" },
    { id: "parfums", name: "Parfums" },
    { id: "tech", name: "Tech" },
    { id: "mode", name: "Mode" },
    { id: "artisanat", name: "Artisanat" },
    { id: "gourmet", name: "Gourmet" }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour ajouter un produit");
      return;
    }

    if (!formData.name || !formData.price) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);

    try {
      // Upload image if selected
      let imageUrl = null;
      if (selectedFiles && selectedFiles.length > 0) {
        const file = selectedFiles[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `product_${Date.now()}.${fileExt}`;
        
        // For now, we'll use a placeholder image URL
        // In a real implementation, you would upload to Supabase Storage
        imageUrl = "/placeholder-product.jpg";
      }

      // Create product in database
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          currency: 'XOF',
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          image_url: imageUrl,
          business_owner_id: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding product:', error);
        toast.error("Erreur lors de l'ajout du produit");
        return;
      }

      toast.success("Produit ajouté avec succès!");
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        category_id: "",
        stock_quantity: ""
      });
      setSelectedFiles(null);
      
      onProductAdded();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau produit</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Nom du produit *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Bracelet Doré Élégance"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="category">Catégorie *</Label>
            <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price">Prix (FCFA) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="15000"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                placeholder="10"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Description détaillée du produit..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="image">Image du produit</Label>
            <div className="mt-1">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
              />
              {selectedFiles && selectedFiles.length > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  {selectedFiles.length} fichier(s) sélectionné(s)
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? (
              "Ajout en cours..."
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Ajouter
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}