import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Gift, Sparkles, Loader2, Check, MapPin, Phone } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
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
          <div className="mx-auto mb-1 w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-center">
            Complétez votre profil 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            3 infos pour profiter de toutes les fonctionnalités.
          </DialogDescription>
        </DialogHeader>

        {/* Compact progress indicator */}
        {(() => {
          const checks = [!!birthday, !!(addressData?.city), !!phoneData.isValid];
          const filledCount = checks.filter(Boolean).length;
          const progress = Math.round((filledCount / 3) * 100);
          const StepIcons = [Gift, MapPin, Phone];
          return (
            <div className="flex items-center gap-3 px-3 py-2 bg-secondary/30 rounded-lg flex-shrink-0">
              <div className="flex items-center gap-2">
                {checks.map((done, i) => {
                  const Icon = StepIcons[i];
                  return done
                    ? <Check key={i} className="h-4 w-4 text-green-500" />
                    : <Icon key={i} className="h-4 w-4 text-muted-foreground/40" />;
                })}
              </div>
              <Progress value={progress} className="h-1.5 flex-1" indicatorClassName={cn("transition-all duration-500", progress === 100 ? "bg-green-500" : "bg-primary")} />
              <span className="text-xs font-semibold text-primary">{progress}%</span>
            </div>
          );
        })()}

        {/* Scrollable form area */}
        <div className="flex-1 overflow-y-auto space-y-4 py-2 min-h-0">
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
            allowCountryOverride={false}
          />

          {/* Phone (required) */}
          <PhoneInput
            value={phoneData}
            onChange={setPhoneData}
            label="Numéro de téléphone"
            required
            showValidation
          />
        </div>

        {/* Footer compact */}
        <div className="flex-shrink-0 pt-3 border-t border-border">
          <Button 
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
