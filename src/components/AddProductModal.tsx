import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSelectedBusiness } from "@/contexts/SelectedBusinessContext";
import { toast } from "sonner";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

export function AddProductModal({ isOpen, onClose, onProductAdded }: AddProductModalProps) {
  const { user } = useAuth();
  const { selectedBusinessId } = useSelectedBusiness();
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_name: "",
    stock_quantity: "",
    business_id: "",
    is_experience: false
  });

  const [businesses, setBusinesses] = useState<Array<{ id: string; business_name: string }>>([]);

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

  const allCategories = formData.is_experience ? experienceCategories : productCategories;

  // Load businesses when modal opens and subscribe to realtime changes
  useEffect(() => {
    if (!isOpen || !user) return;
    
    // Load initial data
    loadBusinesses();
    
    // Subscribe to realtime changes for business_accounts
    const channel = supabase
      .channel('business-accounts-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'business_accounts',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('✅ Nouveau business détecté via Realtime:', payload.new);
        console.log('📋 Business name:', payload.new.business_name);
        loadBusinesses(); // Recharger la liste automatiquement
      })
      .subscribe((status) => {
        console.log('📡 Statut souscription Realtime:', status);
      });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, user]);

  const loadBusinesses = async () => {
    if (!user) {
      console.log('❌ Pas d\'utilisateur connecté pour loadBusinesses');
      return;
    }

    console.log('🔍 Chargement des business pour user_id:', user.id);

    try {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, business_name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('business_name');

      console.log('📊 Résultat requête business_accounts:', { 
        data, 
        error, 
        count: data?.length,
        userIdUsed: user.id 
      });

      if (error) {
        console.error('❌ Erreur lors du chargement des business:', error);
        throw error;
      }
      
      console.log(`✅ ${data?.length || 0} business chargé(s):`, data?.map(b => b.business_name));
      setBusinesses(data || []);
      
      if (data?.length === 0) {
        console.log('⚠️ Aucun business actif trouvé. Créez-en un dans Config > Business');
        toast.info('Aucun business trouvé. Créez d\'abord un business dans la section Config.');
      }
    } catch (error) {
      console.error('💥 Exception lors du chargement des business:', error);
      toast.error('Erreur lors du chargement des business');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'is_experience') {
      setFormData(prev => ({ ...prev, [field]: value === 'true', category_name: "" }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour ajouter un produit");
      return;
    }

    if (!formData.name || !formData.price || !formData.business_id || !formData.category_name) {
      toast.error("Veuillez remplir tous les champs obligatoires (nom, prix, business et catégorie)");
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
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.error("Erreur lors de l'upload de l'image");
          return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);
        
        imageUrl = urlData.publicUrl;
      }

      // Get business address to extract location
      const { data: businessData } = await supabase
        .from('business_accounts')
        .select('address')
        .eq('id', formData.business_id)
        .single();
      
      // Extract location name from address (e.g., "Cocody" from "Cocody, Abidjan")
      let locationName = null;
      if (businessData?.address) {
        locationName = businessData.address.split(',')[0].trim();
        
        // Check if location exists in business_locations
        const { data: existingLocation } = await supabase
          .from('business_locations')
          .select('id')
          .eq('name', locationName)
          .maybeSingle();
        
        // Add location if it doesn't exist
        if (!existingLocation && locationName) {
          await supabase
            .from('business_locations')
            .insert({
              name: locationName,
              created_by: user.id,
              is_public: true
            });
          
          console.log(`✅ Nouveau lieu ajouté: ${locationName}`);
        }
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
          business_account_id: selectedBusinessId || formData.business_id, // Link to selected business
          business_id: formData.business_id,
          category_name: formData.category_name,
          is_experience: formData.is_experience,
          is_active: true,
          location_name: locationName
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
        category_name: "",
        stock_quantity: "",
        business_id: "",
        is_experience: false
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
            <Label htmlFor="business">Business *</Label>
            <Select value={formData.business_id} onValueChange={(value) => handleInputChange('business_id', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner un business" />
              </SelectTrigger>
              <SelectContent>
                {businesses.map(business => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.business_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox
                id="is_experience"
                checked={formData.is_experience}
                onCheckedChange={(checked) => handleInputChange('is_experience', checked.toString())}
              />
              <Label htmlFor="is_experience" className="cursor-pointer">
                C'est une expérience (service, réservation)
              </Label>
            </div>
          </div>

          <div>
            <Label htmlFor="category">Catégorie *</Label>
            <Select value={formData.category_name} onValueChange={(value) => handleInputChange('category_name', value)}>
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