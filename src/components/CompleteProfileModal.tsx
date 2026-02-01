import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Gift, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import { AddressSelector, type AddressResult } from '@/components/AddressSelector';
import { BirthdayPicker } from '@/components/ui/birthday-picker';
import { PhoneInput, createPhoneData, parseFullPhoneNumber, type PhoneData } from '@/components/PhoneInput';
import { useCountry } from '@/contexts/CountryContext';

interface CompleteProfileModalProps {
  open: boolean;
  onComplete: () => void;
  initialData?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

export function CompleteProfileModal({ open, onComplete, initialData }: CompleteProfileModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { country } = useCountry();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [birthday, setBirthday] = useState<Date | undefined>();
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  
  // State for address selection
  const [addressData, setAddressData] = useState<AddressResult | null>(null);
  
  // Initialiser avec le numéro existant ou le préfixe du pays détecté
  const [phoneData, setPhoneData] = useState<PhoneData>(() => {
    if (initialData?.phone) {
      return parseFullPhoneNumber(initialData.phone);
    }
    return createPhoneData(country.phonePrefix);
  });

  const isValid = birthday && addressData?.city && phoneData.isValid;

  const triggerCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#7A5DC7', '#FAD4E1', '#C084FC', '#F7C948', '#FF4D6D']
    });
  };

  const handleSubmit = async () => {
    if (!user || !isValid) return;

    setIsSubmitting(true);

    try {
      const updateData: Record<string, string | number | null> = {
        birthday: birthday ? format(birthday, 'yyyy-MM-dd') : null,
        city: addressData?.city || null,
        neighborhood: addressData?.neighborhood || null,
        latitude: addressData?.latitude || null,
        longitude: addressData?.longitude || null,
        phone: phoneData.nationalNumber ? `${phoneData.countryCode}${phoneData.nationalNumber}` : null,
      };

      // Update first_name only if provided
      if (firstName.trim()) {
        updateData.first_name = firstName.trim();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de sauvegarder votre profil',
          variant: 'destructive',
        });
        return;
      }

      // Trigger celebration
      triggerCelebration();

      toast({
        title: '🎉 Profil complété !',
        description: 'Bienvenue dans la communauté JOIE DE VIVRE',
      });

      onComplete();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md [&>button]:hidden max-h-[90vh] overflow-hidden flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center flex-shrink-0">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            Bienvenue ! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Pour mieux vous accompagner dans vos célébrations, nous avons besoin de quelques informations.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable form area */}
        <div className="flex-1 overflow-y-auto space-y-6 py-4 min-h-0">
          {/* First Name (optional, pre-filled from Google) */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="flex items-center gap-2">
              <span>Prénom</span>
              <span className="text-xs text-muted-foreground">(optionnel)</span>
            </Label>
            <Input
              id="firstName"
              placeholder="Votre prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          {/* Birthday (required) */}
          <BirthdayPicker
            label="Date d'anniversaire"
            labelIcon={<Gift className="h-4 w-4 text-primary" />}
            required
            value={birthday}
            onChange={setBirthday}
          />

          {/* City/Delivery Location (required) */}
          <AddressSelector
            onAddressChange={setAddressData}
            label="Lieu de livraison"
            cityLabel="Ville / Commune"
            neighborhoodLabel="Quartier"
            required
          />
          <p className="text-xs text-muted-foreground -mt-2">
            Pour faciliter la livraison de vos cadeaux surprises !
          </p>

          {/* Phone (required) */}
          <PhoneInput
            value={phoneData}
            onChange={setPhoneData}
            label="Numéro de téléphone"
            required
            showValidation
          />
          <p className="text-xs text-muted-foreground -mt-4">
            Pour recevoir vos rappels d'anniversaire par SMS
          </p>
        </div>

        {/* Footer toujours visible */}
        <div className="flex-shrink-0 pt-4 border-t border-border">
          <Button 
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Enregistrement...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Compléter mon profil
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-2">
            Ces informations sont obligatoires pour profiter de toutes les fonctionnalités.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
