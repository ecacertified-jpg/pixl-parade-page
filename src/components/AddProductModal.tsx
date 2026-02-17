import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Tag, Loader2 } from "lucide-react";
import { MultiImageUploader, ImageItem } from "@/components/MultiImageUploader";
import { MultiVideoUploader } from "@/components/MultiVideoUploader";
import { VideoItem, videoItemToProductVideo } from "@/types/video";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";
import { useSelectedBusiness } from "@/contexts/SelectedBusinessContext";
import { useBusinessCategories } from "@/hooks/useBusinessCategories";
import { useVideoDurationLimits, getMaxDurationForProduct } from "@/hooks/useVideoDurationLimits";
import { toast } from "sonner";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

export function AddProductModal({ isOpen, onClose, onProductAdded }: AddProductModalProps) {
  const { user } = useAuth();
  const { countryCode } = useCountry();
  const { selectedBusinessId } = useSelectedBusiness();
  const { categories: businessCategories } = useBusinessCategories();
  const { limits: videoDurationLimits } = useVideoDurationLimits();
  const [loading, setLoading] = useState(false);
  const [productImages, setProductImages] = useState<ImageItem[]>([]);
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [productVideos, setProductVideos] = useState<VideoItem[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_name: "",
    business_category_id: "",
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

  // Removed - now using MultiImageUploader

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

    if (!formData.name.trim()) {
      toast.error("Le nom du produit est obligatoire");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Le prix du produit est obligatoire et doit être supérieur à 0");
      return;
    }
    if (!formData.business_id) {
      toast.error("Veuillez sélectionner un business");
      return;
    }

    if (!useCustomCategory && !formData.category_name) {
      toast.error("Veuillez sélectionner une catégorie prédéfinie");
      return;
    }

    if (useCustomCategory && !formData.business_category_id) {
      toast.error("Veuillez sélectionner une catégorie personnalisée");
      return;
    }

    setLoading(true);

    try {
      // Upload all images
      const uploadedUrls: string[] = [];
      
      for (const image of productImages) {
        if (image.file) {
          const fileExt = image.file.name.split('.').pop();
          const fileName = `product_${Date.now()}_${uploadedUrls.length}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(fileName, image.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            toast.error("Erreur lors de l'upload d'une image");
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('products')
            .getPublicUrl(fileName);
          
          uploadedUrls.push(urlData.publicUrl);
        }
      }
      
      const imageUrl = uploadedUrls[0] || null;

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

      // Convert videos to database format
      const videosForDb = productVideos.map(videoItemToProductVideo) as unknown as import('@/integrations/supabase/types').Json;
      const firstVideo = productVideos[0];
      // Create product in database with country_code and videos
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          currency: 'XOF',
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          image_url: imageUrl,
          images: uploadedUrls,
          videos: videosForDb,
          video_url: firstVideo?.url || null,
          video_thumbnail_url: firstVideo?.thumbnailUrl || null,
          business_owner_id: user.id,
          business_account_id: selectedBusinessId || formData.business_id,
          business_id: formData.business_id,
          category_name: useCustomCategory ? null : formData.category_name,
          business_category_id: useCustomCategory ? formData.business_category_id : null,
          is_experience: formData.is_experience,
          is_active: true,
          location_name: locationName,
          country_code: countryCode
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding product:', error);
        if (error.code === '23505') {
          toast.error("Un produit avec ce nom existe déjà");
        } else if (error.code === '23503') {
          toast.error("La catégorie ou le business sélectionné n'existe plus. Rafraîchissez la page.");
        } else if (error.code === '23502') {
          toast.error("Un champ obligatoire est manquant : " + (error.details || error.message));
        } else {
          toast.error("Erreur lors de l'ajout : " + (error.message || "erreur inconnue"));
        }
        return;
      }

      // Notifier les followers du nouveau produit
      if (data?.id) {
        try {
          await supabase.functions.invoke('notify-new-product', {
            body: {
              productId: data.id,
              productName: formData.name,
              businessId: selectedBusinessId || formData.business_id,
              productImage: imageUrl
            }
          });
          console.log('✅ Followers notifiés du nouveau produit');
        } catch (notifyError) {
          console.error('Error notifying followers:', notifyError);
          // Ne pas bloquer si la notification échoue
        }

        // IndexNow: Soumettre le produit pour indexation rapide
        try {
          await supabase.functions.invoke('indexnow-notify', {
            body: {
              urls: [`https://joiedevivre-africa.com/product/${data.id}`],
              entityType: 'product',
              entityId: data.id,
              priority: 'high'
            }
          });
          console.log('✅ IndexNow: Produit soumis pour indexation');
        } catch (indexNowError) {
          console.error('IndexNow notification failed:', indexNowError);
          // Ne pas bloquer si IndexNow échoue
        }
      }

      toast.success("Produit ajouté avec succès!");
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        category_name: "",
        business_category_id: "",
        stock_quantity: "",
        business_id: "",
        is_experience: false
      });
      setProductImages([]);
      setUseCustomCategory(false);
      setProductVideos([]);
      
      onProductAdded();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error("Erreur lors de l'ajout du produit : " + errorMessage);
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Type de catégorie</Label>
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomCategory(false);
                    setFormData({ ...formData, business_category_id: '', category_name: '' });
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
                    setFormData({ ...formData, category_name: '', business_category_id: '' });
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
                <Label htmlFor="custom_category">Catégorie personnalisée *</Label>
                {businessCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    Aucune catégorie personnalisée. Créez-en une dans l'onglet Configuration.
                  </p>
                ) : (
                  <Select 
                    value={formData.business_category_id} 
                    onValueChange={(value) => handleInputChange('business_category_id', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner une catégorie personnalisée" />
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
                <Label htmlFor="category">Catégorie prédéfinie *</Label>
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
            )}
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
            <Label>Images du produit</Label>
            <div className="mt-1">
              <MultiImageUploader
                images={productImages}
                onChange={setProductImages}
                maxImages={5}
                disabled={loading}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <MultiVideoUploader
              videos={productVideos}
              onChange={setProductVideos}
              maxVideos={5}
              maxDurationSeconds={getMaxDurationForProduct(videoDurationLimits, formData.is_experience)}
              productType={formData.is_experience ? 'experience' : 'product'}
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ajout en cours...
              </>
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