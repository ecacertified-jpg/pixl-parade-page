import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Building2, User } from 'lucide-react';
import { logAdminAction } from '@/utils/auditLogger';

interface UserWithBusiness {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  business_count: number;
}

interface AdminAddBusinessToOwnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBusinessAdded: () => void;
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

export function AdminAddBusinessToOwnerModal({ 
  open, 
  onOpenChange, 
  onBusinessAdded 
}: AdminAddBusinessToOwnerModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserWithBusiness[]>([]);
  
  const [formData, setFormData] = useState({
    user_id: '',
    business_name: '',
    business_type: '',
    phone: '',
    email: '',
    address: '',
    description: '',
    website_url: '',
  });

  useEffect(() => {
    if (open) {
      loadUsersWithBusinesses();
    }
  }, [open]);

  const loadUsersWithBusinesses = async () => {
    try {
      // First get all profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name');

      if (profileError) throw profileError;

      // Then get business counts per user
      const { data: businesses, error: bizError } = await supabase
        .from('business_accounts')
        .select('user_id');

      if (bizError) throw bizError;

      // Count businesses per user
      const businessCounts: Record<string, number> = {};
      businesses?.forEach(b => {
        businessCounts[b.user_id] = (businessCounts[b.user_id] || 0) + 1;
      });

      // Combine data
      const usersWithCounts = profiles?.map(p => ({
        user_id: p.user_id,
        first_name: p.first_name,
        last_name: p.last_name,
        business_count: businessCounts[p.user_id] || 0,
      })) || [];

      // Sort: users with businesses first, then alphabetically
      usersWithCounts.sort((a, b) => {
        if (a.business_count > 0 && b.business_count === 0) return -1;
        if (a.business_count === 0 && b.business_count > 0) return 1;
        const nameA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
        const nameB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setUsers(usersWithCounts);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.user_id || !formData.business_name) {
      toast.error('Veuillez sélectionner un propriétaire et entrer un nom');
      return;
    }

    setLoading(true);
    try {
      const { error: insertError } = await supabase
        .from('business_accounts')
        .insert({
          user_id: formData.user_id,
          business_name: formData.business_name.trim(),
          business_type: formData.business_type || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          description: formData.description.trim() || null,
          website_url: formData.website_url.trim() || null,
          is_active: true,
          is_verified: false,
          status: 'active',
        });

      if (insertError) throw insertError;

      // Find user name for log
      const selectedUser = users.find(u => u.user_id === formData.user_id);
      const userName = selectedUser 
        ? `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() 
        : formData.user_id;

      // Log admin action
      await logAdminAction(
        'create_business_for_owner',
        'business_account',
        null,
        `Business "${formData.business_name}" créé pour ${userName}`,
        { user_id: formData.user_id, business_name: formData.business_name }
      );

      toast.success('Business ajouté avec succès');
      resetForm();
      onBusinessAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating business:', error);
      toast.error('Erreur lors de la création du business');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      business_name: '',
      business_type: '',
      phone: '',
      email: '',
      address: '',
      description: '',
      website_url: '',
    });
  };

  const getUserDisplayName = (user: UserWithBusiness) => {
    const name = user.first_name || user.last_name 
      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
      : user.user_id.substring(0, 8) + '...';
    
    if (user.business_count > 0) {
      return `${name} (${user.business_count} business)`;
    }
    return name;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Ajouter un business à un prestataire
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Owner Selection */}
          <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Propriétaire du business *
            </Label>
            <Select 
              value={formData.user_id} 
              onValueChange={(value) => setFormData({ ...formData, user_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {getUserDisplayName(user)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Les utilisateurs avec des businesses existants sont affichés en premier
            </p>
          </div>

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

          {/* Address */}
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Adresse du business"
            />
          </div>

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

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer le business
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
