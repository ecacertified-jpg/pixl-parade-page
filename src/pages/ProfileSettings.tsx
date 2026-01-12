import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, MapPin, Save, Camera, Gift, AlertCircle, Settings, Lock, Link2 } from "lucide-react";
import { ForceUpdateButton } from "@/components/ForceUpdateButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LocationSelector from "@/components/LocationSelector";
import { EditAvatarModal } from "@/components/EditAvatarModal";
import { ProfilePrivacySettings } from "@/components/ProfilePrivacySettings";
import { BirthdayPicker } from "@/components/ui/birthday-picker";
import { format, parse, isValid } from "date-fns";

// Validation functions
const validatePhone = (phone: string): string | null => {
  if (!phone || phone.trim() === "") return null; // Empty is valid
  
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, "");
  
  // Check for valid characters (digits, spaces, +, -, parentheses)
  const validCharsRegex = /^[\+]?[0-9\s\-\(\)]+$/;
  if (!validCharsRegex.test(phone)) {
    return "Caractères non autorisés. Utilisez uniquement des chiffres, espaces, +, - ou parenthèses";
  }
  
  // Ivory Coast format: 10 digits (e.g., 0707070707) or with country code (+225 0707070707 = 13 digits)
  if (digitsOnly.length === 10) {
    // Local format: should start with 0
    if (!digitsOnly.startsWith("0")) {
      return "Le numéro local doit commencer par 0 (ex: 07 07 07 07 07)";
    }
    return null; // Valid Ivory Coast local number
  }
  
  if (digitsOnly.length === 13 && digitsOnly.startsWith("225")) {
    return null; // Valid with country code +225
  }
  
  if (digitsOnly.length < 10) {
    return "Le numéro doit contenir 10 chiffres (ex: 07 07 07 07 07)";
  }
  
  if (digitsOnly.length > 13) {
    return "Le numéro contient trop de chiffres";
  }
  
  return "Format invalide. Exemples valides: 0707070707 ou +225 0707070707";
};

const validateBirthday = (birthday: string): string | null => {
  if (!birthday || birthday.trim() === "") return null; // Empty is valid
  const date = new Date(birthday);
  const now = new Date();
  
  if (isNaN(date.getTime())) {
    return "Date invalide";
  }
  
  if (date > now) {
    return "La date de naissance ne peut pas être dans le futur";
  }
  
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120);
  if (date < minDate) {
    return "Date de naissance invalide";
  }
  
  return null;
};

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  
  // Validation errors state
  const [errors, setErrors] = useState({
    phone: null as string | null,
    birthday: null as string | null,
  });
  
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    bio: "",
    avatar_url: "",
    phone: "",
    birthday: "",
    city: "",
  });
  const [birthdayDate, setBirthdayDate] = useState<Date | undefined>();

  // Synchroniser birthdayDate quand profile.birthday change
  useEffect(() => {
    if (profile.birthday) {
      const parsedBirthday = parse(profile.birthday, "yyyy-MM-dd", new Date());
      if (isValid(parsedBirthday)) {
        setBirthdayDate(parsedBirthday);
      }
    } else {
      setBirthdayDate(undefined);
    }
  }, [profile.birthday]);

  const handleBirthdayDateChange = (date: Date | undefined) => {
    setBirthdayDate(date);
    if (date) {
      handleBirthdayChange(format(date, "yyyy-MM-dd"));
    } else {
      handleBirthdayChange("");
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
          setProfile({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            bio: data.bio || "",
            avatar_url: data.avatar_url || "",
            phone: data.phone || "",
            birthday: data.birthday || "",
            city: data.city || "",
          });
          // Synchroniser birthdayDate
          if (data.birthday) {
            const parsedBirthday = parse(data.birthday, "yyyy-MM-dd", new Date());
            if (isValid(parsedBirthday)) {
              setBirthdayDate(parsedBirthday);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // Validate fields on change
  const handlePhoneChange = (value: string) => {
    setProfile({ ...profile, phone: value });
    setErrors({ ...errors, phone: validatePhone(value) });
  };

  const handleBirthdayChange = (value: string) => {
    setProfile({ ...profile, birthday: value });
    setErrors({ ...errors, birthday: validateBirthday(value) });
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    // Validate all fields before saving
    const phoneError = validatePhone(profile.phone);
    const birthdayError = validateBirthday(profile.birthday);
    
    setErrors({
      phone: phoneError,
      birthday: birthdayError,
    });
    
    if (phoneError || birthdayError) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs avant d'enregistrer.",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          bio: profile.bio,
          phone: profile.phone,
          birthday: profile.birthday || null,
          city: profile.city,
        })
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setProfile({ ...profile, avatar_url: newAvatarUrl });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
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
              <h1 className="text-xl font-semibold text-foreground">Paramètres du profil</h1>
              <p className="text-sm text-muted-foreground">Gérez vos informations personnelles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-muted">
            <TabsTrigger value="personal" className="text-xs sm:text-sm">
              <User className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Infos</span>
              <span className="sm:hidden">Infos</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-xs sm:text-sm">
              <Phone className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Contact</span>
              <span className="sm:hidden">Tel</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="text-xs sm:text-sm">
              <Lock className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Confidentialité</span>
              <span className="sm:hidden">Privé</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs sm:text-sm">
              <Gift className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Préférences</span>
              <span className="sm:hidden">Prefs</span>
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Photo de profil</CardTitle>
                <CardDescription>Votre photo sera visible par vos amis</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-6">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => setIsAvatarModalOpen(true)}
                >
                  <Avatar className="w-20 h-20">
                    {profile.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt="Avatar" />
                    )}
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      <User className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                <Button variant="outline" onClick={() => setIsAvatarModalOpen(true)}>
                  Changer la photo
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input
                      id="first_name"
                      value={profile.first_name}
                      onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                      id="last_name"
                      value={profile.last_name}
                      onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                      placeholder="Votre nom"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Parlez de vous en quelques mots..."
                    className="resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {profile.bio.length}/200 caractères
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coordonnées</CardTitle>
                <CardDescription>Ces informations aident vos amis à vous contacter</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="+225 XX XX XX XX"
                      className={`pl-10 ${errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <BirthdayPicker
                  label="Date de naissance"
                  value={birthdayDate}
                  onChange={handleBirthdayDateChange}
                  error={errors.birthday || undefined}
                  helperText="Votre date d'anniversaire sera partagée avec vos proches"
                />

                <div className="space-y-2">
                  <Label>Ville de résidence</Label>
                  <LocationSelector
                    value={profile.city}
                    onChange={(value) => setProfile({ ...profile, city: value })}
                    placeholder="Sélectionnez votre ville"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Méthodes de connexion */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Méthodes de connexion
                </CardTitle>
                <CardDescription>
                  Gérez vos différentes façons de vous connecter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 text-sm">
                  Liez plusieurs méthodes de connexion pour sécuriser votre compte et éviter de perdre l'accès.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/account-linking")}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Gérer mes méthodes de connexion
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <ProfilePrivacySettings />
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Préférences cadeaux</CardTitle>
                <CardDescription>Aidez vos amis à mieux vous connaître</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Définissez vos tailles, allergies, couleurs préférées et budgets pour aider vos proches à choisir les meilleurs cadeaux.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/preferences")}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Gérer mes préférences cadeaux
                </Button>
              </CardContent>
            </Card>

            {/* Application Update Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Application
                </CardTitle>
                <CardDescription>Gérer les mises à jour de l'application</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 text-sm">
                  Si vous ne voyez pas les dernières modifications, utilisez ce bouton pour forcer la mise à jour.
                </p>
                <ForceUpdateButton />
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

      {/* Avatar Modal */}
      <EditAvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        userId={user?.id || ""}
        currentAvatarUrl={profile.avatar_url}
        onAvatarUpdate={handleAvatarUpdate}
      />
    </div>
  );
};

export default ProfileSettings;
