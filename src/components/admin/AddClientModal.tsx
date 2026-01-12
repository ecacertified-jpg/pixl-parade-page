import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, Phone, MapPin, Calendar, AlertTriangle, Copy } from 'lucide-react';
import { IVORY_COAST_CITIES } from '@/utils/ivoryCoastCities';
import { useDuplicateAccountDetection } from '@/hooks/useDuplicateAccountDetection';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface DuplicateWarning {
  type: string;
  profiles: Array<{ user_id: string; first_name: string; last_name: string; city: string }>;
}

export function AddClientModal({ open, onOpenChange, onSuccess }: AddClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [birthday, setBirthday] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  
  const { checkForDuplicate, isChecking } = useDuplicateAccountDetection();

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setCity('');
    setBirthday('');
    setDuplicateWarning(null);
    setTempPassword(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleCheckDuplicates = async () => {
    if (!phone) return;
    
    const result = await checkForDuplicate(phone, firstName, city);
    if (result.hasPotentialDuplicate) {
      setDuplicateWarning({
        type: result.duplicateType || 'unknown',
        profiles: result.matchingProfiles
      });
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent, force = false) => {
    e.preventDefault();
    
    if (!firstName.trim() || !phone.trim()) {
      toast.error('Le prénom et le téléphone sont requis');
      return;
    }

    // Check for duplicates first if not forcing
    if (!force && !duplicateWarning) {
      await handleCheckDuplicates();
      const result = await checkForDuplicate(phone, firstName, city);
      if (result.hasPotentialDuplicate) {
        setDuplicateWarning({
          type: result.duplicateType || 'unknown',
          profiles: result.matchingProfiles
        });
        return; // Let user decide
      }
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
          type: 'client',
          first_name: firstName.trim(),
          last_name: lastName.trim() || undefined,
          phone: phone.trim(),
          city: city || undefined,
          birthday: birthday || undefined
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.error) {
        if (response.data.existing_user) {
          toast.error(`Un utilisateur avec ce téléphone existe déjà: ${response.data.existing_user.first_name} ${response.data.existing_user.last_name || ''}`);
        } else {
          toast.error(response.data.error);
        }
        return;
      }

      // Show success with temp password
      setTempPassword(response.data.temp_password);
      toast.success('Compte client créé avec succès !');
      onSuccess();

    } catch (error: any) {
      console.error('Error creating client:', error);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Ajouter un client
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau compte client. L'utilisateur pourra se connecter avec son numéro de téléphone.
          </DialogDescription>
        </DialogHeader>

        {tempPassword ? (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                <p className="font-medium mb-2">Compte créé avec succès !</p>
                <p className="text-sm mb-3">Mot de passe temporaire à communiquer au client :</p>
                <div className="flex items-center gap-2 bg-white p-2 rounded border">
                  <code className="flex-1 font-mono text-lg">{tempPassword}</code>
                  <Button variant="ghost" size="sm" onClick={copyPassword}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs mt-2 text-muted-foreground">
                  L'utilisateur peut aussi utiliser l'OTP sur son téléphone pour se connecter.
                </p>
              </AlertDescription>
            </Alert>
            <Button onClick={handleClose} className="w-full">
              Fermer
            </Button>
          </div>
        ) : (
          <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
            {duplicateWarning && (
              <Alert variant="destructive" className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <p className="font-medium">Doublon potentiel détecté</p>
                  <p className="text-sm">
                    {duplicateWarning.type === 'phone' && 'Un compte avec ce numéro existe déjà.'}
                    {duplicateWarning.type === 'name' && 'Un compte avec ce prénom existe dans cette ville.'}
                    {duplicateWarning.type === 'both' && 'Un compte similaire existe déjà.'}
                  </p>
                  {duplicateWarning.profiles.length > 0 && (
                    <ul className="text-xs mt-1">
                      {duplicateWarning.profiles.slice(0, 2).map(p => (
                        <li key={p.user_id}>• {p.first_name} {p.last_name} ({p.city || 'Ville non renseignée'})</li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Prénom"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Nom"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Téléphone *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={handleCheckDuplicates}
                  placeholder="+225 07 XX XX XX XX"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Ville
                </Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {IVORY_COAST_CITIES.map((c) => (
                      <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthday" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Date de naissance
                </Label>
                <Input
                  id="birthday"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Annuler
              </Button>
              {duplicateWarning ? (
                <Button 
                  type="button" 
                  onClick={(e) => handleSubmit(e, true)} 
                  disabled={loading}
                  variant="destructive"
                  className="flex-1"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer quand même
                </Button>
              ) : (
                <Button type="submit" disabled={loading || isChecking} className="flex-1">
                  {(loading || isChecking) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer le compte
                </Button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
