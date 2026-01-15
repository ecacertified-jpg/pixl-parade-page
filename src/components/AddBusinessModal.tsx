import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";
import { toast } from "sonner";
import { CitySelector } from "@/components/CitySelector";
import DeliveryZoneManager from "@/components/DeliveryZoneManager";
import type { Business } from "@/types/business";

interface AddBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBusinessAdded: () => void;
  editingBusiness?: Business | null;
}

const businessTypes = [
  "Bijouterie", "Parfumerie", "Tech & Électronique", "Mode & Vêtements",
  "Artisanat", "Alimentation & Gourmet", "Cosmétiques", "Décoration",
  "Librairie & Papeterie", "Autre"
];

const daysOfWeek = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const dayLabels: Record<string, string> = {
  lundi: "Lundi", mardi: "Mardi", mercredi: "Mercredi", jeudi: "Jeudi",
  vendredi: "Vendredi", samedi: "Samedi", dimanche: "Dimanche"
};

const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return [`${hour}:00`, `${hour}:30`];
}).flat();

export function AddBusinessModal({ isOpen, onClose, onBusinessAdded, editingBusiness }: AddBusinessModalProps) {
  const { user } = useAuth();
  const { countryCode } = useCountry();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Business>({
    business_name: "",
    business_type: "",
    phone: "",
    address: "",
    description: "",
    logo_url: "",
    website_url: "",
    email: "",
    opening_hours: {
      lundi: { open: "09:00", close: "18:00" },
      mardi: { open: "09:00", close: "18:00" },
      mercredi: { open: "09:00", close: "18:00" },
      jeudi: { open: "09:00", close: "18:00" },
      vendredi: { open: "09:00", close: "18:00" },
      samedi: { open: "09:00", close: "18:00" },
      dimanche: { open: "09:00", close: "18:00", closed: true }
    },
    delivery_zones: [{ name: "Zone standard", radius: 15, cost: 2000, active: true }],
    payment_info: { mobile_money: "", account_holder: "" },
    delivery_settings: { free_delivery_threshold: 25000, standard_cost: 2000 }
  });

  // Load business data when editing
  useEffect(() => {
    if (editingBusiness && isOpen) {
      setFormData(editingBusiness);
    } else if (!editingBusiness && isOpen) {
      // Reset form when adding new business
      setFormData({
        business_name: "",
        business_type: "",
        phone: "",
        address: "",
        description: "",
        logo_url: "",
        website_url: "",
        email: "",
        opening_hours: {
          lundi: { open: "09:00", close: "18:00" },
          mardi: { open: "09:00", close: "18:00" },
          mercredi: { open: "09:00", close: "18:00" },
          jeudi: { open: "09:00", close: "18:00" },
          vendredi: { open: "09:00", close: "18:00" },
          samedi: { open: "09:00", close: "18:00" },
          dimanche: { open: "09:00", close: "18:00", closed: true }
        },
        delivery_zones: [{ name: "Zone standard", radius: 15, cost: 2000, active: true }],
        payment_info: { mobile_money: "", account_holder: "" },
        delivery_settings: { free_delivery_threshold: 25000, standard_cost: 2000 }
      });
    }
  }, [editingBusiness, isOpen]);

  const handleInputChange = (field: keyof Business, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOpeningHoursChange = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours[day],
          [field]: value
        }
      }
    }));
  };

  const handleDeliveryZonesChange = (zones: Array<{ name: string; radius: number; cost: number; active?: boolean }>) => {
    setFormData(prev => ({ ...prev, delivery_zones: zones }));
  };

  const handlePaymentInfoChange = (field: keyof Business['payment_info'], value: string) => {
    setFormData(prev => ({
      ...prev,
      payment_info: {
        ...prev.payment_info,
        [field]: value
      }
    }));
  };

  const handleDeliverySettingsChange = (field: keyof Business['delivery_settings'], value: number) => {
    setFormData(prev => ({
      ...prev,
      delivery_settings: {
        ...prev.delivery_settings,
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour ajouter un business");
      return;
    }

    if (!formData.business_name || formData.business_name.trim() === '') {
      toast.error("Le nom du business est obligatoire");
      return;
    }

    if (!formData.business_type) {
      toast.error("Le type de business est obligatoire");
      return;
    }

    setLoading(true);

    try {
      let data, error;
      
      if (editingBusiness) {
        // Update existing business
        const result = await supabase
          .from('business_accounts')
          .update({
            business_name: formData.business_name,
            business_type: formData.business_type,
            phone: formData.phone,
            address: formData.address,
            description: formData.description,
            logo_url: formData.logo_url,
            website_url: formData.website_url,
            email: formData.email,
            opening_hours: formData.opening_hours,
            delivery_zones: formData.delivery_zones,
            payment_info: formData.payment_info,
            delivery_settings: formData.delivery_settings
          })
          .eq('id', editingBusiness.id)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      } else {
        // Create new business with country_code
        const result = await supabase
          .from('business_accounts')
          .insert({
            user_id: user.id,
            business_name: formData.business_name,
            business_type: formData.business_type,
            phone: formData.phone,
            address: formData.address,
            description: formData.description,
            logo_url: formData.logo_url,
            website_url: formData.website_url,
            email: formData.email,
            opening_hours: formData.opening_hours,
            delivery_zones: formData.delivery_zones,
            payment_info: formData.payment_info,
            delivery_settings: formData.delivery_settings,
            is_active: true,
            is_verified: false,
            status: 'active',
            country_code: countryCode
          })
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error saving business:', error);
        toast.error(`Erreur lors de la ${editingBusiness ? 'modification' : 'création'} du business`);
        return;
      }

      toast.success(`Business ${editingBusiness ? 'modifié' : 'créé'} avec succès!`);
      
      // Reset form
      setFormData({
        business_name: "",
        business_type: "",
        phone: "",
        address: "",
        description: "",
        logo_url: "",
        website_url: "",
        email: "",
        opening_hours: {
          lundi: { open: "09:00", close: "18:00" },
          mardi: { open: "09:00", close: "18:00" },
          mercredi: { open: "09:00", close: "18:00" },
          jeudi: { open: "09:00", close: "18:00" },
          vendredi: { open: "09:00", close: "18:00" },
          samedi: { open: "09:00", close: "18:00" },
          dimanche: { open: "09:00", close: "18:00", closed: true }
        },
        delivery_zones: [{ name: "Zone standard", radius: 15, cost: 2000, active: true }],
        payment_info: { mobile_money: "", account_holder: "" },
        delivery_settings: { free_delivery_threshold: 25000, standard_cost: 2000 }
      });
      
      onBusinessAdded(); // Recharge Config ET le sélecteur via event
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {editingBusiness ? 'Modifier le business' : 'Ajouter un nouveau business'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informations générales */}
          <Card className="p-4">
            <h3 className="font-medium mb-4">Informations générales</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business_name">Nom du business *</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    placeholder="Ex: Boutique Élégance Abidjan"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="business_type">Type de business *</Label>
                  <Select value={formData.business_type} onValueChange={(value) => handleInputChange('business_type', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+225 07 XX XX XX XX"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contact@business.com"
                    className="mt-1"
                  />
                </div>
              </div>

              <CitySelector
                value={formData.address}
                onChange={(value) => handleInputChange('address', value)}
                label="Adresse"
                placeholder="Sélectionnez l'emplacement"
                allowCustom
                showRegions
              />

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Décrivez votre business..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Horaires d'ouverture */}
          <Card className="p-4">
            <h3 className="font-medium mb-4">Horaires d'ouverture</h3>
            <div className="space-y-3">
              {daysOfWeek.map(day => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium">{dayLabels[day]}</div>
                  <Checkbox
                    checked={!formData.opening_hours[day]?.closed}
                    onCheckedChange={(checked) => handleOpeningHoursChange(day, 'closed', !checked)}
                  />
                  {!formData.opening_hours[day]?.closed && (
                    <div className="flex items-center gap-2">
                      <Select 
                        value={formData.opening_hours[day]?.open} 
                        onValueChange={(value) => handleOpeningHoursChange(day, 'open', value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm">à</span>
                      <Select 
                        value={formData.opening_hours[day]?.close} 
                        onValueChange={(value) => handleOpeningHoursChange(day, 'close', value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {formData.opening_hours[day]?.closed && (
                    <Badge variant="secondary">Fermé</Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Zones de livraison */}
          <Card className="p-4">
            <h3 className="font-medium mb-4">Zones de livraison</h3>
            <DeliveryZoneManager
              zones={formData.delivery_zones}
              onChange={handleDeliveryZonesChange}
            />
          </Card>

          {/* Paramètres de livraison */}
          <Card className="p-4">
            <h3 className="font-medium mb-4">Paramètres de livraison</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="free_threshold">Seuil livraison gratuite (FCFA)</Label>
                <Input
                  id="free_threshold"
                  type="number"
                  value={formData.delivery_settings.free_delivery_threshold}
                  onChange={(e) => handleDeliverySettingsChange('free_delivery_threshold', parseInt(e.target.value) || 0)}
                  placeholder="25000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="standard_cost">Coût standard (FCFA)</Label>
                <Input
                  id="standard_cost"
                  type="number"
                  value={formData.delivery_settings.standard_cost}
                  onChange={(e) => handleDeliverySettingsChange('standard_cost', parseInt(e.target.value) || 0)}
                  placeholder="2000"
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Informations de paiement */}
          <Card className="p-4">
            <h3 className="font-medium mb-4">Informations de paiement</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mobile_money">Mobile Money</Label>
                <Input
                  id="mobile_money"
                  value={formData.payment_info.mobile_money}
                  onChange={(e) => handlePaymentInfoChange('mobile_money', e.target.value)}
                  placeholder="07 XX XX XX XX"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="account_holder">Nom du titulaire</Label>
                <Input
                  id="account_holder"
                  value={formData.payment_info.account_holder}
                  onChange={(e) => handlePaymentInfoChange('account_holder', e.target.value)}
                  placeholder="Nom complet"
                  className="mt-1"
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? `${editingBusiness ? 'Modification' : 'Ajout'} en cours...` : editingBusiness ? 'Modifier' : 'Ajouter'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}