import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building2, User, Phone, MapPin, Mail, FileText, Copy, Check } from 'lucide-react';
import { IVORY_COAST_CITIES } from '@/utils/ivoryCoastCities';
import { useDuplicateAccountDetection } from '@/hooks/useDuplicateAccountDetection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

interface AddBusinessAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const BUSINESS_TYPES = [
  'Pâtisserie',
  'Fleuriste',
  'Bijouterie',
  'Boutique cadeaux',
  'Décoration',
  'Traiteur',
  'Photographe',
  'Événementiel',
  'Mode & Accessoires',
  'Beauté & Bien-être',
  'Restaurant',
  'Autre'
];

export function AddBusinessAccountModal({ open, onOpenChange, onSuccess }: AddBusinessAccountModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Owner fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  
  // Business fields
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  
  // Options
  const [isActive, setIsActive] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  
  const { checkForDuplicate, isChecking } = useDuplicateAccountDetection();

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setCity('');
    setBusinessName('');
    setBusinessType('');
    setBusinessEmail('');
    setBusinessAddress('');
    setBusinessDescription('');
    setIsActive(true);
    setIsVerified(false);
    setTempPassword(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !phone.trim() || !businessName.trim()) {
      toast.error('Le prénom, téléphone et nom du business sont requis');
      return;
    }

    // Check for duplicate phone
    const result = await checkForDuplicate(phone);
    if (result.hasPotentialDuplicate && result.duplicateType === 'phone') {
      toast.error('Un compte avec ce numéro de téléphone existe déjà');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expirée');
        return;
      }

      const response = await supabase.functions.invoke('admin-create-user', {
        body: {
          type: 'business',
          first_name: firstName.trim(),
          last_name: lastName.trim() || undefined,
          phone: phone.trim(),
          city: city || undefined,
          business_name: businessName.trim(),
          business_type: businessType || undefined,
          business_email: businessEmail.trim() || undefined,
          business_address: businessAddress.trim() || undefined,
          business_description: businessDescription.trim() || undefined,
          is_active: isActive,
          is_verified: isVerified
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }

      setTempPassword(response.data.temp_password);
      toast.success('Compte prestataire créé avec succès !');
      onSuccess();

    } catch (error: any) {
      console.error('Error creating business account:', error);
      toast.error(error.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      toast.success('Mot de passe copié !');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Ajouter un prestataire
          </DialogTitle>
          <DialogDescription>
            Créez un compte utilisateur et un compte business associé.
          </DialogDescription>
        </DialogHeader>

        {tempPassword ? (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                <p className="font-medium mb-2">Compte prestataire créé avec succès !</p>
                <p className="text-sm mb-1">
                  <strong>{businessName}</strong> - {firstName} {lastName}
                </p>
                <p className="text-sm mb-3">Mot de passe temporaire :</p>
                <div className="flex items-center gap-2 bg-white p-2 rounded border">
                  <code className="flex-1 font-mono text-lg">{tempPassword}</code>
                  <Button variant="ghost" size="sm" onClick={copyPassword}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs mt-2 text-muted-foreground">
                  Le prestataire peut aussi utiliser l'OTP sur son téléphone.
                </p>
              </AlertDescription>
            </Alert>
            <Button onClick={handleClose} className="w-full">
              Fermer
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Owner Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Propriétaire
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Prénom"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Nom"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Téléphone *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+225 07 XX XX XX XX"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Ville
                  </Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {IVORY_COAST_CITIES.map((c) => (
                        <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Business Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Business
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessName">Nom du business *</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Nom de l'entreprise"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="businessType">Type</Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type de business" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="businessEmail" className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="email@business.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessAddress">Adresse</Label>
                <Input
                  id="businessAddress"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="Adresse du business"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessDescription" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Description
                </Label>
                <Textarea
                  id="businessDescription"
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder="Description du business..."
                  rows={2}
                  maxLength={500}
                />
              </div>
            </div>

            <Separator />

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Activer immédiatement</Label>
                  <p className="text-xs text-muted-foreground">Le compte sera actif dès sa création</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-1">
                    <Check className="h-3 w-3" /> Marquer comme vérifié
                  </Label>
                  <p className="text-xs text-muted-foreground">Le badge vérifié sera affiché</p>
                </div>
                <Switch checked={isVerified} onCheckedChange={setIsVerified} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" disabled={loading || isChecking} className="flex-1">
                {(loading || isChecking) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer le compte
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
