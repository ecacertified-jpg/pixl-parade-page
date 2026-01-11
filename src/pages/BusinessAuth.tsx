import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Store, ArrowLeft, Loader2, Phone, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

// Schéma pour la connexion (téléphone uniquement)
const signInSchema = z.object({
  phone: z.string().regex(/^[0-9]{8,10}$/, 'Format de téléphone invalide (8-10 chiffres)'),
  countryCode: z.string().default('+225'),
});

// Schéma pour l'inscription business (téléphone + infos business)
const signUpSchema = z.object({
  firstName: z.string().min(2, 'Le prénom est requis (min 2 caractères)'),
  lastName: z.string().min(2, 'Le nom est requis (min 2 caractères)'),
  businessName: z.string().min(2, 'Le nom d\'entreprise est requis (min 2 caractères)'),
  businessType: z.string().optional(),
  phone: z.string().regex(/^[0-9]{8,10}$/, 'Format de téléphone invalide (8-10 chiffres)'),
  countryCode: z.string().default('+225'),
  address: z.string().optional(),
  description: z.string().optional(),
});

// Schéma pour vérification OTP
const otpSchema = z.object({
  otp: z.string().length(6, 'Le code doit contenir 6 chiffres'),
});

// Schéma pour compléter l'inscription (sans téléphone car déjà authentifié via OTP)
const completeRegistrationSchema = z.object({
  firstName: z.string().min(2, 'Le prénom est requis (min 2 caractères)'),
  lastName: z.string().min(2, 'Le nom est requis (min 2 caractères)'),
  businessName: z.string().min(2, 'Le nom d\'entreprise est requis (min 2 caractères)'),
  businessType: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;
type OtpFormData = z.infer<typeof otpSchema>;
type CompleteRegistrationFormData = z.infer<typeof completeRegistrationSchema>;

const BusinessAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [businessNameError, setBusinessNameError] = useState<string | null>(null);
  const [showCompleteRegistration, setShowCompleteRegistration] = useState(false);
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);
  const [authenticatedPhone, setAuthenticatedPhone] = useState<string | null>(null);
  
  // États pour OTP
  const [otpSent, setOtpSent] = useState(false);
  const [currentPhone, setCurrentPhone] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [signupFormData, setSignupFormData] = useState<SignUpFormData | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [countryCode, setCountryCode] = useState('+225');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUserMode, refreshSession } = useAuth();

  // Forms
  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { countryCode: '+225' },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { countryCode: '+225' },
  });

  const completeRegistrationForm = useForm<CompleteRegistrationFormData>({
    resolver: zodResolver(completeRegistrationSchema),
  });

  const businessType = signUpForm.watch('businessType');

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Redirect based on business account status
  useEffect(() => {
    if (user) {
      checkExistingBusinessAccount();
    }
  }, [user, navigate]);


  // Detect referral code from URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('referral_code', refCode);
    }
  }, [searchParams]);

  const checkExistingBusinessAccount = async () => {
    if (!user) return;
    
    try {
      const { data: businessAccounts, error } = await supabase
        .from('business_accounts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (error) {
        console.error('Error checking business account:', error);
        return;
      }

      if (businessAccounts && businessAccounts.length > 0) {
        setUserMode('business');
        navigate('/business-account', { replace: true });
      } else {
        // No business account found - try to link by email/phone
        const linkResult = await tryLinkBusinessAccountByEmail();
        if (linkResult?.linked) {
          setUserMode('business');
          navigate('/business-account', { replace: true });
        }
      }
    } catch (error) {
      console.error('Error checking business account:', error);
    }
  };

  const tryLinkBusinessAccountByEmail = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('link-business-account-to-user');
      if (error) {
        console.error('Error invoking link function:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error linking business account:', error);
      return null;
    }
  };

  const checkBusinessNameUniqueness = async (businessName: string) => {
    if (!businessName || businessName.trim().length === 0) {
      setBusinessNameError(null);
      return true;
    }

    try {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id')
        .ilike('business_name', businessName.trim())
        .eq('status', 'active')
        .limit(1);

      if (error) {
        console.error('Error checking business name:', error);
        return true;
      }

      if (data && data.length > 0) {
        setBusinessNameError('Ce nom d\'entreprise est déjà utilisé. Veuillez en choisir un autre.');
        return false;
      }

      setBusinessNameError(null);
      return true;
    } catch (error) {
      console.error('Error checking business name:', error);
      return true;
    }
  };

  // Envoyer OTP pour connexion
  const sendOtpSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    const fullPhone = `${countryCode}${data.phone}`;
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      });

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setCurrentPhone(fullPhone);
      setOtpSent(true);
      setAuthMode('signin');
      setCountdown(120);
      toast({
        title: 'Code envoyé',
        description: `Un code de vérification a été envoyé au ${fullPhone}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.message || 'Une erreur s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Envoyer OTP pour inscription
  const sendOtpSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    
    // Vérifier l'unicité du nom d'entreprise
    const isUnique = await checkBusinessNameUniqueness(data.businessName);
    if (!isUnique) {
      setIsLoading(false);
      toast({
        title: 'Nom d\'entreprise déjà utilisé',
        description: 'Ce nom d\'entreprise est déjà enregistré. Veuillez en choisir un autre.',
        variant: 'destructive',
      });
      return;
    }

    const fullPhone = `${countryCode}${data.phone}`;
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            is_business: true,
          },
        },
      });

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Sauvegarder les données du formulaire pour après vérification
      setSignupFormData(data);
      setCurrentPhone(fullPhone);
      setOtpSent(true);
      setAuthMode('signup');
      setCountdown(120);
      toast({
        title: 'Code envoyé',
        description: `Un code de vérification a été envoyé au ${fullPhone}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.message || 'Une erreur s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Vérifier OTP
  const verifyOtp = async () => {
    if (otpValue.length !== 6) {
      toast({
        title: 'Code incomplet',
        description: 'Veuillez entrer les 6 chiffres du code',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: authData, error } = await supabase.auth.verifyOtp({
        phone: currentPhone,
        token: otpValue,
        type: 'sms',
      });

      if (error) {
        toast({
          title: 'Erreur de vérification',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      if (authData.user) {
        // Si c'est une inscription, créer le business_account
        if (authMode === 'signup' && signupFormData) {
          const { error: businessError } = await supabase
            .from('business_accounts')
            .insert({
              user_id: authData.user.id,
              business_name: signupFormData.businessName,
              business_type: signupFormData.businessType || '',
              phone: currentPhone,
              address: signupFormData.address || '',
              description: signupFormData.description || '',
              is_active: true,
              status: 'active',
            });

          if (businessError) {
            console.error('Error creating business account:', businessError);
            
            if (businessError.code === '23505' || businessError.message?.includes('duplicate')) {
              // Business account already exists - continue
              console.log('Business account already exists, continuing...');
            } else {
              toast({
                title: 'Erreur de création',
                description: `Impossible de créer le compte business: ${businessError.message}`,
                variant: 'destructive',
              });
              return;
            }
          }

          setUserMode('business');
          await refreshSession();
          
          toast({
            title: 'Bienvenue !',
            description: 'Votre espace business est maintenant prêt.',
          });
          navigate('/business-account?onboarding=true', { replace: true });
        } else {
          // Connexion - vérifier si un business account existe
          const { data: businessAccounts } = await supabase
            .from('business_accounts')
            .select('id')
            .eq('user_id', authData.user.id)
            .limit(1);

          if (!businessAccounts || businessAccounts.length === 0) {
            // Pas de compte business - montrer le formulaire de complétion
            setAuthenticatedUserId(authData.user.id);
            setAuthenticatedPhone(currentPhone);
            setShowCompleteRegistration(true);
            setOtpSent(false);
            toast({
              title: 'Inscription incomplète',
              description: 'Votre compte existe mais l\'inscription business n\'est pas terminée. Veuillez la compléter.',
            });
            return;
          }

          setUserMode('business');
          toast({
            title: 'Connexion réussie',
            description: 'Bienvenue dans votre espace business',
          });
          navigate('/business-account', { replace: true });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.message || 'Une erreur s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Renvoyer OTP
  const resendOtp = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: currentPhone,
      });

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setCountdown(120);
      toast({
        title: 'Code renvoyé',
        description: `Un nouveau code a été envoyé au ${currentPhone}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.message || 'Une erreur s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Réinitialiser le flux OTP
  const resetOtpFlow = () => {
    setOtpSent(false);
    setOtpValue('');
    setCurrentPhone('');
    setCountdown(0);
    setSignupFormData(null);
  };

  // Compléter l'inscription business (après connexion sans business account)
  const completeBusinessRegistration = async (formData: CompleteRegistrationFormData) => {
    if (!authenticatedUserId) return;
    
    setIsLoading(true);
    try {
      // Vérifier l'unicité du nom d'entreprise
      const isUnique = await checkBusinessNameUniqueness(formData.businessName);
      if (!isUnique) {
        setIsLoading(false);
        return;
      }

      const { error: businessError } = await supabase
        .from('business_accounts')
        .insert({
          user_id: authenticatedUserId,
          business_name: formData.businessName,
          business_type: formData.businessType || '',
          phone: authenticatedPhone || '',
          address: formData.address || '',
          description: formData.description || '',
          is_active: true,
          status: 'active',
        });

      if (businessError) {
        console.error('Error creating business account:', businessError);
        toast({
          title: 'Erreur',
          description: 'Impossible de créer le compte business: ' + businessError.message,
          variant: 'destructive',
        });
        return;
      }

      setUserMode('business');
      toast({
        title: 'Bienvenue !',
        description: 'Votre espace business est maintenant prêt.',
      });
      navigate('/business-account?onboarding=true', { replace: true });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const businessTypes = [
    'Bijouterie',
    'Parfumerie',
    'Technologie',
    'Gastronomie',
    'Mode',
    'Artisanat',
    'Services',
    'Autre'
  ];

  const countryCodes = [
    { code: '+225', country: 'CI', flag: '🇨🇮' },
    { code: '+33', country: 'FR', flag: '🇫🇷' },
    { code: '+1', country: 'US', flag: '🇺🇸' },
    { code: '+44', country: 'GB', flag: '🇬🇧' },
    { code: '+32', country: 'BE', flag: '🇧🇪' },
    { code: '+41', country: 'CH', flag: '🇨🇭' },
  ];

  // Formulaire de complétion d'inscription (après connexion OTP sans business account)
  if (showCompleteRegistration) {
    return (
      <div className="min-h-screen flex items-start justify-center bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4 pt-8">
        <Card className="w-full max-w-lg shadow-lg border-primary/20">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Store className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl font-poppins font-bold text-primary">
                Finalisez votre inscription
              </CardTitle>
            </div>
            <CardDescription className="text-base">
              Bienvenue ! Complétez votre profil business pour continuer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={completeRegistrationForm.handleSubmit(completeBusinessRegistration)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="complete-firstName" className="flex items-center gap-1">
                    Prénom <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="complete-firstName"
                    placeholder="Votre prénom"
                    {...completeRegistrationForm.register('firstName')}
                  />
                  {completeRegistrationForm.formState.errors.firstName && (
                    <p className="text-sm text-destructive">
                      {completeRegistrationForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complete-lastName" className="flex items-center gap-1">
                    Nom <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="complete-lastName"
                    placeholder="Votre nom"
                    {...completeRegistrationForm.register('lastName')}
                  />
                  {completeRegistrationForm.formState.errors.lastName && (
                    <p className="text-sm text-destructive">
                      {completeRegistrationForm.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complete-businessName" className="flex items-center gap-1">
                  Nom de l'entreprise <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="complete-businessName"
                  placeholder="Mon Enterprise SARL"
                  {...completeRegistrationForm.register('businessName')}
                  onBlur={(e) => checkBusinessNameUniqueness(e.target.value)}
                />
                {completeRegistrationForm.formState.errors.businessName && (
                  <p className="text-sm text-destructive">
                    {completeRegistrationForm.formState.errors.businessName.message}
                  </p>
                )}
                {businessNameError && (
                  <p className="text-sm text-destructive">{businessNameError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="complete-businessType">Type d'activité</Label>
                <Select onValueChange={(value) => completeRegistrationForm.setValue('businessType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez votre activité" />
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

              <div className="space-y-2">
                <Label htmlFor="complete-address">Adresse</Label>
                <Input
                  id="complete-address"
                  placeholder="Cocody, Abidjan"
                  {...completeRegistrationForm.register('address')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complete-description">Description (optionnel)</Label>
                <Textarea
                  id="complete-description"
                  placeholder="Décrivez votre activité..."
                  rows={3}
                  {...completeRegistrationForm.register('description')}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Compléter mon inscription'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Écran de vérification OTP
  if (otpSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
        <Card className="w-full max-w-md shadow-lg border-primary/20">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Phone className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-poppins font-bold text-primary">
                Vérification
              </CardTitle>
            </div>
            <CardDescription className="text-base">
              {authMode === 'signup' ? (
                <>
                  Dernière étape ! Entrez le code à 6 chiffres envoyé au
                  <br />
                  <span className="font-medium text-foreground">{currentPhone}</span>
                  <br />
                  <span className="text-xs text-muted-foreground mt-1 block">
                    Votre compte business sera créé après vérification
                  </span>
                </>
              ) : (
                <>
                  Entrez le code à 6 chiffres envoyé au
                  <br />
                  <span className="font-medium text-foreground">{currentPhone}</span>
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={(value) => setOtpValue(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={verifyOtp}
              className="w-full"
              disabled={isLoading || otpValue.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {authMode === 'signup' ? 'Création du compte...' : 'Vérification...'}
                </>
              ) : (
                authMode === 'signup' ? 'Créer mon compte business' : 'Se connecter'
              )}
            </Button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={resendOtp}
                disabled={countdown > 0 || isLoading}
                className={cn(
                  "text-sm",
                  countdown > 0
                    ? "text-muted-foreground cursor-not-allowed"
                    : "text-primary hover:underline"
                )}
              >
                {countdown > 0
                  ? `Renvoyer le code dans ${countdown}s`
                  : 'Renvoyer le code'}
              </button>

              <div>
                <button
                  type="button"
                  onClick={resetOtpFlow}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 mx-auto"
                >
                  <Edit2 className="h-3 w-3" />
                  Modifier le numéro
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulaire principal (connexion / inscription)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Store className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold">Business JOIE DE VIVRE</CardTitle>
          </div>
          <CardDescription>
            Créez votre compte business ou connectez-vous à votre espace vendeur
          </CardDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/auth')}
            className="mt-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Compte client
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription Business</TabsTrigger>
            </TabsList>
            
            {/* Onglet Connexion */}
            <TabsContent value="signin">
              <form onSubmit={signInForm.handleSubmit(sendOtpSignIn)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-phone">Numéro de téléphone</Label>
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countryCodes.map((cc) => (
                          <SelectItem key={cc.code} value={cc.code}>
                            {cc.flag} {cc.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="signin-phone"
                      type="tel"
                      placeholder="07 XX XX XX XX"
                      {...signInForm.register('phone')}
                      className="flex-1"
                    />
                  </div>
                  {signInForm.formState.errors.phone && (
                    <p className="text-sm text-destructive">
                      {signInForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi du code...
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-4 w-4" />
                      Envoyer le code
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            {/* Onglet Inscription */}
            <TabsContent value="signup">
              <form onSubmit={signUpForm.handleSubmit(sendOtpSignUp)} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="flex items-center gap-1">
                      Prénom <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Votre prénom"
                      {...signUpForm.register('firstName')}
                      className={cn(signUpForm.formState.errors.firstName && "border-destructive")}
                    />
                    {signUpForm.formState.errors.firstName && (
                      <p className="text-sm text-destructive">{signUpForm.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="flex items-center gap-1">
                      Nom <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Votre nom"
                      {...signUpForm.register('lastName')}
                      className={cn(signUpForm.formState.errors.lastName && "border-destructive")}
                    />
                    {signUpForm.formState.errors.lastName && (
                      <p className="text-sm text-destructive">{signUpForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessName" className="flex items-center gap-1">
                    Nom de l'entreprise <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="businessName"
                    placeholder="Mon Enterprise SARL"
                    {...signUpForm.register('businessName')}
                    onBlur={(e) => checkBusinessNameUniqueness(e.target.value)}
                    className={cn((signUpForm.formState.errors.businessName || businessNameError) && "border-destructive")}
                  />
                  {signUpForm.formState.errors.businessName && (
                    <p className="text-sm text-destructive">{signUpForm.formState.errors.businessName.message}</p>
                  )}
                  {businessNameError && (
                    <p className="text-sm text-destructive">{businessNameError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">Type d'activité</Label>
                  <Select onValueChange={(value) => signUpForm.setValue('businessType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre activité" />
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

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    Téléphone <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countryCodes.map((cc) => (
                          <SelectItem key={cc.code} value={cc.code}>
                            {cc.flag} {cc.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="07 XX XX XX XX"
                      {...signUpForm.register('phone')}
                      className="flex-1"
                    />
                  </div>
                  {signUpForm.formState.errors.phone && (
                    <p className="text-sm text-destructive">{signUpForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    placeholder="Cocody, Abidjan"
                    {...signUpForm.register('address')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optionnel)</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre activité..."
                    rows={3}
                    {...signUpForm.register('description')}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi du code...
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-4 w-4" />
                      Continuer - Vérifier mon numéro
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Un code de vérification sera envoyé à votre téléphone
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessAuth;
