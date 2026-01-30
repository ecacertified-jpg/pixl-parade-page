import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Building2, Shield, User } from 'lucide-react';
import { logAdminAction } from '@/utils/auditLogger';
import { LocationPicker } from '@/components/LocationPicker';

interface Business {
  id: string;
  business_name: string;
  business_type: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  description: string | null;
  website_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  status: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
}

interface UserProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
}

interface AdminEditBusinessModalProps {
  business: Business | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBusinessUpdated: () => void;
}

const businessTypes = [
  'Pâtisserie',
  'Boulangerie',
  'Fleuriste',
  'Bijouterie',
  'Restaurant',
  'Traiteur',
  'Photographe',
  'Décorateur',
  'Spa & Bien-être',
  'Mode & Accessoires',
  'Électronique',
  'Artisanat',
  'Autre',
];

export function AdminEditBusinessModal({ 
  business,
  open, 
  onOpenChange, 
  onBusinessUpdated 
}: AdminEditBusinessModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: '',
    phone: '',
    email: '',
    address: '',
    description: '',
    website_url: '',
    is_verified: false,
    is_active: true,
    status: 'active',
    user_id: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  useEffect(() => {
    if (open && business) {
      setFormData({
        business_name: business.business_name,
        business_type: business.business_type || '',
        phone: business.phone || '',
        email: business.email || '',
        address: business.address || '',
        description: business.description || '',
        website_url: business.website_url || '',
        is_verified: business.is_verified,
        is_active: business.is_active,
        status: business.status,
        user_id: business.user_id,
        latitude: business.latitude,
        longitude: business.longitude,
      });
      loadUsers();
    }
  }, [open, business]);

  const loadUsers = async () => {
    // Load users who could own a business
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .order('first_name');

    if (!error && data) {
      setUsers(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    
    if (!formData.business_name) {
      toast.error('Le nom du business est obligatoire');
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        business_name: formData.business_name.trim(),
        business_type: formData.business_type || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        description: formData.description.trim() || null,
        website_url: formData.website_url.trim() || null,
        is_verified: formData.is_verified,
        is_active: formData.is_active,
        status: formData.status,
        latitude: formData.latitude,
        longitude: formData.longitude,
      };

      // Only update user_id if it changed (ownership transfer)
      if (formData.user_id !== business.user_id) {
        updateData.user_id = formData.user_id;
      }

      const { error: updateError } = await supabase
        .from('business_accounts')
        .update(updateData)
        .eq('id', business.id);

      if (updateError) throw updateError;

      // If ownership was transferred, also update products
      if (formData.user_id !== business.user_id) {
        await supabase
          .from('products')
          .update({ business_owner_id: formData.user_id })
          .eq('business_account_id', business.id);
      }

      // Log admin action
      const changes = [];
      if (formData.business_name !== business.business_name) changes.push('nom');
      if (formData.is_verified !== business.is_verified) changes.push('vérification');
      if (formData.is_active !== business.is_active) changes.push('statut actif');
      if (formData.user_id !== business.user_id) changes.push('propriétaire');
      if (formData.address !== business.address) changes.push('adresse');
      if (formData.latitude !== business.latitude || formData.longitude !== business.longitude) {
        changes.push('coordonnées GPS');
      }

      await logAdminAction(
        'update_business',
        'business_account',
        business.id,
        `Business "${formData.business_name}" modifié (${changes.join(', ') || 'détails'})`,
        { business_id: business.id, changes }
      );

      toast.success('Business mis à jour avec succès');
      onBusinessUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating business:', error);
      toast.error('Erreur lors de la mise à jour du business');
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = (user: UserProfile) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.user_id.substring(0, 8) + '...';
  };

  if (!business) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Modifier le business (Admin)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Business Name */}
          <div className="space-y-2">
            <Label>Nom du business *</Label>
            <Input
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              placeholder="Nom du business"
            />
          </div>

          {/* Business Type */}
          <div className="space-y-2">
            <Label>Type de business</Label>
            <Select 
              value={formData.business_type} 
              onValueChange={(value) => setFormData({ ...formData, business_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {businessTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+225 07 00 00 00 00"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@business.com"
              />
            </div>
          </div>

          {/* Localisation (Carte + Adresse) */}
          <LocationPicker
            address={formData.address}
            latitude={formData.latitude}
            longitude={formData.longitude}
            onAddressChange={(addr) => setFormData({ ...formData, address: addr })}
            onCoordinatesChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
            countryCode="CI"
            label="Localisation de la boutique (Admin)"
          />

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du business..."
              rows={3}
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label>Site web</Label>
            <Input
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              placeholder="https://www.example.com"
            />
          </div>

          {/* Owner Selection */}
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Propriétaire du business
            </Label>
            <Select 
              value={formData.user_id} 
              onValueChange={(value) => setFormData({ ...formData, user_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un propriétaire" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {getUserDisplayName(user)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.user_id !== business.user_id && (
              <p className="text-xs text-amber-600">
                ⚠️ Changer le propriétaire transférera aussi tous les produits
              </p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <div>
                  <Label>Business vérifié</Label>
                  <p className="text-xs text-muted-foreground">
                    Badge de vérification visible
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.is_verified}
                onCheckedChange={(checked) => setFormData({ ...formData, is_verified: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Business actif</Label>
                <p className="text-xs text-muted-foreground">
                  Visible sur la plateforme
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
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
