import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Store, Phone, MapPin, Clock, Save, Camera, Globe, Mail, Truck, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBusinessAccount } from "@/hooks/useBusinessAccount";
import { LocationPicker } from "@/components/LocationPicker";

const BUSINESS_TYPES = [
  { value: "artisanat", label: "Artisanat" },
  { value: "bijoux", label: "Bijouterie" },
  { value: "parfums", label: "Parfums & Cosmétiques" },
  { value: "tech", label: "Tech & Électronique" },
  { value: "gastronomie", label: "Gastronomie" },
  { value: "mode", label: "Mode & Vêtements" },
  { value: "decoration", label: "Décoration" },
  { value: "services", label: "Services" },
  { value: "autre", label: "Autre" },
];

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const BusinessProfileSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { countryCode } = useCountry();
  const { toast } = useToast();
  const { businessAccount, loading: businessLoading, refetch } = useBusinessAccount();
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [business, setBusiness] = useState({
    business_name: "",
    business_type: "",
    description: "",
    logo_url: "",
    email: "",
    phone: "",
    address: "",
    website_url: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  useEffect(() => {
    if (businessAccount) {
      setBusiness({
        business_name: businessAccount.business_name || "",
        business_type: businessAccount.business_type || "",
        description: businessAccount.description || "",
        logo_url: businessAccount.logo_url || "",
        email: businessAccount.email || "",
        phone: businessAccount.phone || "",
        address: businessAccount.address || "",
        website_url: businessAccount.website_url || "",
        latitude: (businessAccount as any).latitude ?? null,
        longitude: (businessAccount as any).longitude ?? null,
      });
    }
  }, [businessAccount]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id || !businessAccount?.id) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Format non supporté",
        description: "Utilisez une image JPG, PNG, WebP ou GIF.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale est de 2 Mo.",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;
      
      // Delete existing logo if present
      if (business.logo_url) {
        const oldPath = business.logo_url.split('/business-logos/')[1];
        if (oldPath) {
          await supabase.storage.from('business-logos').remove([oldPath]);
        }
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-logos')
        .getPublicUrl(fileName);

      // Update business account
      const { error: updateError } = await supabase
        .from('business_accounts')
        .update({ logo_url: publicUrl })
        .eq('id', businessAccount.id);

      if (updateError) throw updateError;

      setBusiness({ ...business, logo_url: publicUrl });
      toast({
        title: "Logo mis à jour",
        description: "Votre logo a été enregistré avec succès.",
      });
      refetch();
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le logo.",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!businessAccount?.id || !business.logo_url) return;

    setUploadingLogo(true);
    try {
      // Remove from storage
      const path = business.logo_url.split('/business-logos/')[1];
      if (path) {
        await supabase.storage.from('business-logos').remove([path]);
      }

      // Update business account
      const { error } = await supabase
        .from('business_accounts')
        .update({ logo_url: null })
        .eq('id', businessAccount.id);

      if (error) throw error;

      setBusiness({ ...business, logo_url: '' });
      toast({
        title: "Logo supprimé",
        description: "Votre logo a été supprimé.",
      });
      refetch();
    } catch (error) {
      console.error('Error removing logo:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le logo.",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id || !businessAccount?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("business_accounts")
        .update({
          business_name: business.business_name,
          business_type: business.business_type,
          description: business.description,
          email: business.email,
          phone: business.phone,
          address: business.address,
          website_url: business.website_url,
          latitude: business.latitude,
          longitude: business.longitude,
        })
        .eq("id", businessAccount.id);
      
      if (error) throw error;
      
      toast({
        title: "Profil mis à jour",
        description: "Les informations de votre entreprise ont été enregistrées.",
      });
      refetch();
    } catch (error) {
      console.error("Error updating business:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil entreprise.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (businessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!businessAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Aucun compte prestataire</h2>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore de compte prestataire.
            </p>
            <Button onClick={() => navigate("/business-auth")}>
              Créer un compte prestataire
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Paramètres entreprise</h1>
              <p className="text-sm text-muted-foreground">Gérez les informations de votre entreprise</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger value="business" className="text-xs sm:text-sm">
              <Store className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Entreprise</span>
              <span className="sm:hidden">Infos</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-xs sm:text-sm">
              <Phone className="h-4 w-4 mr-1 sm:mr-2" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="delivery" className="text-xs sm:text-sm">
              <Truck className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Livraison</span>
              <span className="sm:hidden">Livr.</span>
            </TabsTrigger>
          </TabsList>

          {/* Business Information Tab */}
          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Logo de l'entreprise</CardTitle>
                <CardDescription>Votre logo sera affiché sur vos produits</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-6">
                <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center overflow-hidden">
                  {business.logo_url ? (
                    <img src={business.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="h-10 w-10 text-primary" />
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 mr-2" />
                    )}
                    {business.logo_url ? "Changer" : "Ajouter"}
                  </Button>
                  {business.logo_url && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={handleRemoveLogo}
                      disabled={uploadingLogo}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations entreprise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Nom de l'entreprise</Label>
                  <Input
                    id="business_name"
                    value={business.business_name}
                    onChange={(e) => setBusiness({ ...business, business_name: e.target.value })}
                    placeholder="Nom de votre entreprise"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business_type">Type d'activité</Label>
                  <Select
                    value={business.business_type}
                    onValueChange={(value) => setBusiness({ ...business, business_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={business.description}
                    onChange={(e) => setBusiness({ ...business, description: e.target.value })}
                    placeholder="Décrivez votre activité..."
                    className="resize-none"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coordonnées professionnelles</CardTitle>
                <CardDescription>Ces informations seront visibles par vos clients</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email professionnel</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={business.email}
                      onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                      placeholder="contact@entreprise.com"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={business.phone}
                      onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                      placeholder="+225 XX XX XX XX"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      value={business.address}
                      onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                      placeholder="Adresse de votre entreprise"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Location Picker */}
                <LocationPicker
                  address={business.address}
                  latitude={business.latitude}
                  longitude={business.longitude}
                  onAddressChange={(value) => setBusiness({ ...business, address: value })}
                  onCoordinatesChange={(lat, lng) => setBusiness({ ...business, latitude: lat, longitude: lng })}
                  countryCode={countryCode}
                  label="Position GPS de l'entreprise"
                />

                <div className="space-y-2">
                  <Label htmlFor="website">Site web (optionnel)</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      value={business.website_url}
                      onChange={(e) => setBusiness({ ...business, website_url: e.target.value })}
                      placeholder="https://www.monsite.com"
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Tab */}
          <TabsContent value="delivery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Paramètres de livraison</CardTitle>
                <CardDescription>Configurez vos options de livraison</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Gérez vos zones de livraison, tarifs et horaires d'ouverture depuis le tableau de bord business.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/business-account")}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Accéder au tableau de bord
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Horaires d'ouverture</CardTitle>
                <CardDescription>Définissez vos horaires de disponibilité</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    La gestion des horaires sera bientôt disponible
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="mt-6">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer les modifications
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BusinessProfileSettings;
