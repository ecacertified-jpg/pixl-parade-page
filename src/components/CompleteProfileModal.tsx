import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parse, isValid as isValidDate } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, Gift, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import LocationSelector from '@/components/LocationSelector';

interface CompleteProfileModalProps {
  open: boolean;
  onComplete: () => void;
  initialData?: {
    firstName?: string;
    lastName?: string;
  };
}

export function CompleteProfileModal({ open, onComplete, initialData }: CompleteProfileModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [birthday, setBirthday] = useState<Date | undefined>();
  const [city, setCity] = useState('');
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [birthdayInput, setBirthdayInput] = useState('');

  // Synchroniser l'input quand la date est sélectionnée via calendrier
  useEffect(() => {
    if (birthday) {
      setBirthdayInput(format(birthday, "dd/MM/yyyy"));
    }
  }, [birthday]);

  // Handler pour la saisie clavier avec auto-formatage
  const handleBirthdayInputChange = (value: string) => {
    // Garder uniquement les chiffres
    let digits = value.replace(/\D/g, '');
    
    // Limiter à 8 chiffres (jjmmaaaa)
    digits = digits.slice(0, 8);
    
    // Formater automatiquement avec les slashes
    let formatted = digits;
    if (digits.length > 2) {
      formatted = digits.slice(0, 2) + '/' + digits.slice(2);
    }
    if (digits.length > 4) {
      formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
    }
    
    setBirthdayInput(formatted);

    // Valider et convertir en Date si format complet (10 caractères: jj/mm/aaaa)
    if (formatted.length === 10) {
      const parsedDate = parse(formatted, "dd/MM/yyyy", new Date());
      if (isValidDate(parsedDate) && parsedDate <= new Date() && parsedDate.getFullYear() >= 1920) {
        setBirthday(parsedDate);
      }
    }
  };

  const isValid = birthday && city.trim().length > 0;

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
      const updateData: Record<string, string | null> = {
        birthday: birthday ? format(birthday, 'yyyy-MM-dd') : null,
        city: city.trim(),
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
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              <span>Date d'anniversaire</span>
              <span className="text-xs text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="jj/mm/aaaa"
                value={birthdayInput}
                onChange={(e) => handleBirthdayInputChange(e.target.value)}
                maxLength={10}
                className="flex-1"
              />
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    type="button"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={birthday}
                    onSelect={(date) => {
                      setBirthday(date);
                      if (date) setBirthdayInput(format(date, "dd/MM/yyyy"));
                      setCalendarOpen(false);
                    }}
                    locale={fr}
                    captionLayout="dropdown-buttons"
                    fromYear={1920}
                    toYear={new Date().getFullYear()}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-xs text-muted-foreground">
              Tapez la date ou utilisez le calendrier
            </p>
          </div>

          {/* City/Delivery Location (required) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Ville ou quartier de livraison</span>
              <span className="text-xs text-destructive">*</span>
            </Label>
            <LocationSelector
              value={city}
              onChange={setCity}
              placeholder="Sélectionnez ou ajoutez votre ville"
              showAddButton
            />
            <p className="text-xs text-muted-foreground">
              Pour faciliter la livraison de vos cadeaux surprises !
            </p>
          </div>
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
