import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Store, Gift, Loader2, Shield } from 'lucide-react';
import { getAllCountries } from '@/config/countries';
import { useCountry } from '@/contexts/CountryContext';
import { handleSmartRedirect } from '@/utils/authRedirect';
import { useReferralTracking } from '@/hooks/useReferralTracking';
import { Separator } from '@/components/ui/separator';
import { useDuplicateAccountDetection, type DuplicateCheckResult, type MatchingProfile } from '@/hooks/useDuplicateAccountDetection';
import { DuplicateAccountModal } from '@/components/DuplicateAccountModal';
import { useAccountLinking } from '@/hooks/useAccountLinking';

const phoneRegex = /^[0-9]{10}$/;

const signInSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Le numéro doit contenir 10 chiffres'),
  countryCode: z.string().default('+225'),
});

const signUpSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  birthday: z.string().optional(),
  city: z.string().min(1, 'La ville est requise').optional(),
  phone: z.string().regex(phoneRegex, 'Le numéro doit contenir 10 chiffres'),
  countryCode: z.string().default('+225'),
  otp: z.string().optional(),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'Le code doit contenir 6 chiffres'),
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin';
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [currentPhone, setCurrentPhone] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(initialTab);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  
  // États pour détection des doublons
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  const [pendingSignUpData, setPendingSignUpData] = useState<SignUpFormData | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { country } = useCountry();
  const { trackReferralEvent, getActiveReferralCode, setActiveReferralCode } = useReferralTracking();
  const { checkForDuplicate, isChecking } = useDuplicateAccountDetection();
  const { checkExistingAccount } = useAccountLinking();
  const [isServerChecking, setIsServerChecking] = useState(false);

  // Liste des pays depuis la configuration
  const countries = getAllCountries();

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { countryCode: country.phonePrefix }
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { countryCode: country.phonePrefix }
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  // Redirect if already authenticated - check for returnUrl first
  useEffect(() => {
    if (user) {
      const returnUrl = localStorage.getItem('returnUrl');
      if (returnUrl) {
        localStorage.removeItem('returnUrl');
        navigate(returnUrl);
      } else {
        handleSmartRedirect(user, navigate);
      }
    }
  }, [user, navigate]);

  // Detect and validate referral code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    
    if (refParam) {
      supabase
        .from('referral_codes')
        .select('code')
        .eq('code', refParam)
        .eq('is_active', true)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setReferralCode(refParam);
            setActiveReferralCode(refParam);
            trackReferralEvent(refParam, 'view');
          }
        });
    } else {
      const stored = getActiveReferralCode();
      if (stored) {
        setReferralCode(stored);
      }
    }
  }, []);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendOtpSignIn = async (data: SignInFormData) => {
    try {
      setIsLoading(true);
      const fullPhone = `${data.countryCode}${data.phone}`;
      
      console.log('📱 [OTP Sign-In] Sending OTP to:', fullPhone);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      });

      if (error) {
        console.error('❌ [OTP Sign-In] Send error:', {
          message: error.message,
          status: error.status,
          code: error.code,
          name: error.name,
        });
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ [OTP Sign-In] OTP sent successfully to:', fullPhone);
      setCurrentPhone(fullPhone);
      setOtpSent(true);
      setCountdown(60);
      toast({
        title: 'Code envoyé',
        description: 'Un code de vérification a été envoyé par SMS. Le SMS peut prendre jusqu\'à 2 minutes.',
      });
    } catch (error: any) {
      console.error('💥 [OTP Sign-In] Unexpected error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (data: SignUpFormData) => {
    await sendOtpSignUp(data, false);
  };

  const sendOtpSignUp = async (data: SignUpFormData, skipDuplicateCheck: boolean) => {
    try {
      setIsLoading(true);
      const fullPhone = `${data.countryCode}${data.phone}`;
      
      // Vérification des doublons avant inscription (sauf si on a déjà vérifié)
      if (!skipDuplicateCheck) {
        console.log('🔍 [Duplicate Check] Checking for existing accounts via server...');
        setIsServerChecking(true);
        
        // 1. D'abord vérification serveur (plus fiable car accède à auth.users)
        const serverResult = await checkExistingAccount(fullPhone, undefined, data.firstName, data.city);
        setIsServerChecking(false);
        
        if (serverResult && serverResult.exists && serverResult.accounts.length > 0) {
          console.log('⚠️ [Server Check] Found existing account:', serverResult);
          
          // Convertir le résultat serveur en format DuplicateCheckResult
          const matchingProfiles: MatchingProfile[] = serverResult.accounts.map((acc: any) => ({
            id: acc.user_id,
            user_id: acc.user_id,
            first_name: acc.first_name,
            last_name: acc.last_name,
            phone: acc.phone,
            city: acc.city,
            avatar_url: acc.avatar_url,
            created_at: acc.created_at,
            has_google: acc.auth_methods?.includes('google') || false,
            has_phone: acc.auth_methods?.includes('phone') || false,
          }));

          const duplicateCheck: DuplicateCheckResult = {
            hasPotentialDuplicate: true,
            duplicateType: serverResult.accounts[0]?.is_exact_phone_match ? 'phone' : 'name',
            matchingProfiles,
            confidence: serverResult.confidence,
          };
          
          setDuplicateResult(duplicateCheck);
          setPendingSignUpData(data);
          setShowDuplicateModal(true);
          setIsLoading(false);
          return;
        }
        
        // 2. Fallback: vérification client-side (profiles publics)
        const duplicateCheck = await checkForDuplicate(fullPhone, data.firstName, data.city);
        
        if (duplicateCheck.hasPotentialDuplicate) {
          console.log('⚠️ [Client Check] Found potential duplicate:', duplicateCheck);
          setDuplicateResult(duplicateCheck);
          setPendingSignUpData(data);
          setShowDuplicateModal(true);
          setIsLoading(false);
          return;
        }
      }
      
      console.log('📱 [OTP Sign-Up] Sending OTP to:', fullPhone, 'with metadata:', {
        first_name: data.firstName,
        city: data.city,
      });
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
        options: {
          data: {
            first_name: data.firstName,
            birthday: data.birthday,
            city: data.city,
            phone: fullPhone,
          },
        },
      });

      if (error) {
        console.error('❌ [OTP Sign-Up] Send error:', {
          message: error.message,
          status: error.status,
          code: error.code,
          name: error.name,
        });
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ [OTP Sign-Up] OTP sent successfully to:', fullPhone);
      setCurrentPhone(fullPhone);
      setOtpSent(true);
      setAuthMode('signup');
      setCountdown(60);
      toast({
        title: 'Code envoyé',
        description: 'Un code de vérification a été envoyé par SMS. Le SMS peut prendre jusqu\'à 2 minutes.',
      });
    } catch (error: any) {
      console.error('💥 [OTP Sign-Up] Unexpected error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers pour le modal de doublon
  const handleDuplicateLoginWithPhone = (phone: string) => {
    setShowDuplicateModal(false);
    setDuplicateResult(null);
    setPendingSignUpData(null);
    // Passer en mode connexion et pré-remplir le numéro
    setAuthMode('signin');
    const phoneDigits = phone.replace(/^\+\d{1,3}/, '');
    signInForm.setValue('phone', phoneDigits.slice(-10));
    toast({
      title: 'Connexion',
      description: 'Envoyez un code de vérification pour vous connecter',
    });
  };

  const handleDuplicateLoginWithGoogle = () => {
    setShowDuplicateModal(false);
    setDuplicateResult(null);
    setPendingSignUpData(null);
    signInWithGoogle();
  };

  const handleDuplicateContinueAnyway = () => {
    setShowDuplicateModal(false);
    if (pendingSignUpData) {
      // Continuer l'inscription en sautant la vérification des doublons
      sendOtpSignUp(pendingSignUpData, true);
    }
    setDuplicateResult(null);
    setPendingSignUpData(null);
  };

  const verifyOtp = async (data: OtpFormData) => {
    try {
      setIsLoading(true);
      
      console.log('🔐 [OTP Verify] Verifying OTP:', {
        phone: currentPhone,
        tokenLength: data.otp.length,
        tokenPreview: data.otp.substring(0, 2) + '****',
      });
      
      const { data: authData, error } = await supabase.auth.verifyOtp({
        phone: currentPhone,
        token: data.otp,
        type: 'sms',
      });

      if (error) {
        console.error('❌ [OTP Verify] Verification failed:', {
          message: error.message,
          status: error.status,
          code: error.code,
          name: error.name,
        });
        toast({
          title: 'Code invalide',
          description: error.message || 'Le code saisi est incorrect ou expiré',
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ [OTP Verify] Verification successful, user:', authData.user?.id);

      if (authData.user) {
        // Check if this is a new signup by checking profile creation time
        const { data: profileData } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('user_id', authData.user.id)
          .single();

        const isNewSignup = profileData && 
          (new Date().getTime() - new Date(profileData.created_at).getTime()) < 60000; // Less than 1 minute old

        // Send welcome email for new signups
        if (isNewSignup || authMode === 'signup') {
          const userEmail = authData.user.email || authData.user.phone;
          const userName = authData.user.user_metadata?.first_name || 'utilisateur';
          
          if (userEmail) {
            try {
              await supabase.functions.invoke('send-welcome-email', {
                body: {
                  user_email: userEmail,
                  user_name: userName,
                }
              });
              console.log('Welcome email sent successfully');
            } catch (emailError) {
              console.error('Error sending welcome email:', emailError);
              // Don't block signup if email fails
            }
          }
        }

        toast({
          title: authMode === 'signup' ? 'Compte créé' : 'Connexion réussie',
          description: authMode === 'signup' ? 'Votre compte a été créé avec succès' : 'Vous êtes maintenant connecté',
        });
        
        // If new signup, add onboarding parameter
        if (isNewSignup || authMode === 'signup') {
          const redirectPath = await (async () => {
            try {
              const { data: businessAccount } = await supabase
                .from('business_accounts')
                .select('id')
                .eq('user_id', authData.user.id)
                .eq('is_active', true)
                .limit(1)
                .maybeSingle();
              
              return businessAccount ? '/business-account' : '/dashboard';
            } catch {
              return '/dashboard';
            }
          })();
          navigate(`${redirectPath}?onboarding=true`);
        } else {
          await handleSmartRedirect(authData.user, navigate);
        }
      }
    } catch (error: any) {
      console.error('💥 [OTP Verify] Unexpected error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (countdown > 0) return;
    
    try {
      setIsLoading(true);
      
      console.log('🔄 [OTP Resend] Resending OTP to:', currentPhone);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: currentPhone,
      });

      if (error) {
        console.error('❌ [OTP Resend] Error:', {
          message: error.message,
          status: error.status,
          code: error.code,
        });
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ [OTP Resend] OTP resent successfully');
      setCountdown(60);
      toast({
        title: 'Code renvoyé',
        description: 'Un nouveau code a été envoyé par SMS. Le SMS peut prendre jusqu\'à 2 minutes.',
      });
    } catch (error: any) {
      console.error('💥 [OTP Resend] Unexpected error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetOtpFlow = () => {
    setOtpSent(false);
    setCurrentPhone('');
    setCountdown(0);
    otpForm.reset();
  };

  const signInWithGoogle = async () => {
    // Détecter si on est dans le preview Lovable (évite l'avertissement WebView de Google)
    const isLovablePreview = window.location.hostname.includes('lovableproject.com') 
      || window.location.hostname.includes('lovable.app')
      || window.location.hostname.includes('localhost');
    
    if (isLovablePreview) {
      toast({
        title: 'Authentification Google',
        description: 'L\'authentification Google n\'est pas disponible dans l\'aperçu. Veuillez ouvrir le site en production.',
        action: (
          <a 
            href="https://joiedevivre-africa.com/auth" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            Ouvrir joiedevivre-africa.com →
          </a>
        ),
        duration: 15000,
      });
      return;
    }
    
    setIsGoogleLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast({
          title: 'Erreur Google Auth',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erreur inattendue',
        description: error?.message || 'Une erreur s\'est produite lors de la connexion Google.',
        variant: 'destructive',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Google icon component
  const GoogleIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Joie de Vivre</CardTitle>
          <CardDescription>
            Connectez-vous ou créez un compte pour commencer
          </CardDescription>
          
          {referralCode && (
            <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-center flex items-center justify-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                <span>Invité via le code <strong className="text-primary">{referralCode}</strong></span>
              </p>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/business-auth?tab=${authMode}`)}
            className="mt-2 text-sm"
          >
            <Store className="h-4 w-4 mr-2" />
            Espace Business
          </Button>
        </CardHeader>
        <CardContent>
          {!otpSent ? (
            <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'signin' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={authMode}
                  initial={{ opacity: 0, x: authMode === 'signup' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: authMode === 'signup' ? -20 : 20 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  {authMode === 'signin' ? (
                    <div className="mt-2">
                      <form onSubmit={signInForm.handleSubmit(sendOtpSignIn)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signin-phone">Téléphone <span className="text-destructive">*</span></Label>
                          <div className="flex gap-2">
                            <Select 
                              value={signInForm.watch('countryCode')} 
                              onValueChange={(value) => signInForm.setValue('countryCode', value)}
                            >
                              <SelectTrigger className="w-[110px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {countries.map((c) => (
                                  <SelectItem key={c.code} value={c.phonePrefix}>
                                    {c.flag} {c.phonePrefix}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              id="signin-phone"
                              type="tel"
                              placeholder="07 XX XX XX XX"
                              maxLength={10}
                              {...signInForm.register('phone')}
                              className="flex-1"
                            />
                          </div>
                          {signInForm.formState.errors.phone && (
                            <p className="text-sm text-destructive">{signInForm.formState.errors.phone.message}</p>
                          )}
                        </div>
                        
                        <Button type="submit" className="w-full" disabled={isLoading || isChecking || isServerChecking}>
                          {isLoading || isChecking || isServerChecking ? 'Vérification...' : 'Envoyer le code'}
                        </Button>

                        <div className="relative my-4">
                          <Separator />
                          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                            ou
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          disabled={isGoogleLoading}
                          onClick={signInWithGoogle}
                        >
                          {isGoogleLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <GoogleIcon />
                          )}
                          <span className="ml-2">Continuer avec Google</span>
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <form onSubmit={signUpForm.handleSubmit(handleSignUpSubmit)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">Prénom</Label>
                          <Input
                            id="firstName"
                            placeholder="Prénom"
                            {...signUpForm.register('firstName')}
                          />
                          {signUpForm.formState.errors.firstName && (
                            <p className="text-sm text-destructive">{signUpForm.formState.errors.firstName.message}</p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="birthday">Date d'anniversaire</Label>
                            <Input
                              id="birthday"
                              type="date"
                              {...signUpForm.register('birthday')}
                            />
                            {signUpForm.formState.errors.birthday && (
                              <p className="text-sm text-destructive">{signUpForm.formState.errors.birthday.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="city">Lieu de livraison</Label>
                            <Input
                              id="city"
                              placeholder="Votre ville"
                              {...signUpForm.register('city')}
                            />
                            {signUpForm.formState.errors.city && (
                              <p className="text-sm text-destructive">{signUpForm.formState.errors.city.message}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="signup-phone">Téléphone <span className="text-destructive">*</span></Label>
                          <div className="flex gap-2">
                            <Select 
                              value={signUpForm.watch('countryCode')} 
                              onValueChange={(value) => signUpForm.setValue('countryCode', value)}
                            >
                              <SelectTrigger className="w-[110px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {countries.map((c) => (
                                  <SelectItem key={c.code} value={c.phonePrefix}>
                                    {c.flag} {c.phonePrefix}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              id="signup-phone"
                              type="tel"
                              placeholder="07 XX XX XX XX"
                              maxLength={10}
                              {...signUpForm.register('phone')}
                              className="flex-1"
                            />
                          </div>
                          {signUpForm.formState.errors.phone && (
                            <p className="text-sm text-destructive">{signUpForm.formState.errors.phone.message}</p>
                          )}
                        </div>
                        
                        <Button type="submit" className="w-full" disabled={isLoading || isChecking || isServerChecking}>
                          {isLoading || isChecking || isServerChecking ? 'Vérification...' : 'Envoyer le code'}
                        </Button>

                        <div className="relative my-4">
                          <Separator />
                          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                            ou
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          disabled={isGoogleLoading}
                          onClick={signInWithGoogle}
                        >
                          {isGoogleLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <GoogleIcon />
                          )}
                          <span className="ml-2">S'inscrire avec Google</span>
                        </Button>
                      </form>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </Tabs>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Vérification du numéro</h3>
                <p className="text-sm text-muted-foreground">
                  Code envoyé au {currentPhone}
                </p>
              </div>
              
              <form onSubmit={otpForm.handleSubmit(verifyOtp)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Code de vérification</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otpForm.watch('otp') || ''}
                      onChange={(value) => otpForm.setValue('otp', value)}
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
                  {otpForm.formState.errors.otp && (
                    <p className="text-sm text-destructive text-center">{otpForm.formState.errors.otp.message}</p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Vérification...' : 'Vérifier'}
                </Button>
              </form>
              
              <div className="space-y-2">
                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resendOtp}
                    disabled={countdown > 0 || isLoading}
                  >
                    {countdown > 0 ? `Renvoyer dans ${countdown}s` : 'Renvoyer le code'}
                  </Button>
                </div>
                
                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetOtpFlow}
                  >
                    Modifier le numéro
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Lien discret vers l'admin */}
          <div className="mt-6 pt-4 border-t border-muted">
            <button
              type="button"
              onClick={() => navigate('/admin-auth')}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 w-full opacity-60 hover:opacity-100"
            >
              <Shield className="h-3 w-3" />
              Administration
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de détection des doublons */}
      <DuplicateAccountModal
        isOpen={showDuplicateModal}
        onClose={() => {
          setShowDuplicateModal(false);
          setPendingSignUpData(null);
          setDuplicateResult(null);
        }}
        duplicateResult={duplicateResult}
        onLoginWithGoogle={handleDuplicateLoginWithGoogle}
        onLoginWithPhone={handleDuplicateLoginWithPhone}
        onContinueAnyway={handleDuplicateContinueAnyway}
      />
    </div>
  );
};

export default Auth;