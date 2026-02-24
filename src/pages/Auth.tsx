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
import { Store, Gift, Loader2, Shield, Mail, Phone, Eye, EyeOff, Check, User, MapPin, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getAllCountries, getCountryConfig } from '@/config/countries';
import { useCountry, useCountrySafe } from '@/contexts/CountryContext';
import { handleSmartRedirect } from '@/utils/authRedirect';
import { useReferralTracking } from '@/hooks/useReferralTracking';
import { Separator } from '@/components/ui/separator';
import { useDuplicateAccountDetection, type DuplicateCheckResult, type MatchingProfile } from '@/hooks/useDuplicateAccountDetection';
import { DuplicateAccountModal } from '@/components/DuplicateAccountModal';
import { useAccountLinking } from '@/hooks/useAccountLinking';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { OtpMethodSelector, useWhatsAppFallback, WhatsAppAutoIndicator, type OtpMethod } from '@/components/auth/OtpMethodSelector';
import { SEOHead, SEO_CONFIGS } from '@/components/SEOHead';
import { SoftwareApplicationSchema, SpeakableSchema } from '@/components/schema/SoftwareApplicationSchema';
import { useAcquisitionTracking } from '@/hooks/useAcquisitionTracking';
import { AddressSelector, type AddressResult } from '@/components/AddressSelector';
import { BirthdayPicker } from '@/components/ui/birthday-picker';
import { format } from 'date-fns';
import { processAdminAutoAssign } from '@/utils/adminAutoAssign';

// Client Signup Progress Indicator
const ClientSignupProgressIndicator = ({ 
  steps,
  completedChecks 
}: { 
  steps: { label: string; isComplete: boolean; icon: LucideIcon }[];
  completedChecks: boolean[];
}) => {
  const filledCount = completedChecks.filter(Boolean).length;
  const progress = Math.round((filledCount / completedChecks.length) * 100);
  
  const getStepLabel = (p: number) => {
    if (p === 0) return 'Commencez votre inscription';
    if (p < 50) return 'Continuez...';
    if (p < 100) return 'Presque terminé !';
    return 'Prêt !';
  };

  return (
    <div className="space-y-3 mb-4 p-4 bg-secondary/30 rounded-xl">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{getStepLabel(progress)}</span>
        <span className="text-sm font-semibold text-primary">{progress}%</span>
      </div>
      <Progress 
        value={progress} 
        className="h-2" 
        indicatorClassName={cn(
          "transition-all duration-500",
          progress === 100 ? "bg-green-500" : "bg-primary"
        )}
      />
      <div className="grid grid-cols-3 gap-2 md:flex md:justify-between text-xs text-muted-foreground">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 text-center">
           {step.isComplete 
              ? <Check className="h-4 w-4 text-green-500" /> 
              : <step.icon className="h-4 w-4 text-muted-foreground/50" />}
            <span>{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Phone signup progress wrapper
const PhoneSignupProgress = ({ form }: { form: any }) => {
  const values = form.watch();
  const checks = [
    !!(values.firstName && values.firstName.length >= 1),
    !!values.birthday,
    !!(values.city && values.city.length >= 1),
    !!(values.phone && /^[0-9]{8,10}$/.test(values.phone)),
  ];
  const steps = [
    { label: 'Identité', isComplete: checks[0], icon: User },
    { label: 'Anniversaire', isComplete: checks[1], icon: Gift },
    { label: 'Localisation', isComplete: checks[2], icon: MapPin },
    { label: 'Téléphone', isComplete: checks[3], icon: Phone },
  ];
  return <ClientSignupProgressIndicator steps={steps} completedChecks={checks} />;
};

// Email signup progress wrapper
const EmailSignupProgress = ({ form }: { form: any }) => {
  const values = form.watch();
  const checks = [
    !!(values.firstName && values.firstName.length >= 1),
    !!values.birthday,
    !!(values.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)),
    !!(values.password && values.password.length >= 8 && values.confirmPassword === values.password),
  ];
  const steps = [
    { label: 'Identité', isComplete: checks[0], icon: User },
    { label: 'Anniversaire', isComplete: checks[1], icon: Gift },
    { label: 'Email', isComplete: checks[2], icon: Mail },
    { label: 'Mot de passe', isComplete: checks[3], icon: Lock },
  ];
  return <ClientSignupProgressIndicator steps={steps} completedChecks={checks} />;
};

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

// Email auth schemas
const emailSignInSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

const emailSignUpSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  birthday: z.string().optional(),
  city: z.string().min(1, 'La ville est requise').optional(),
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;
type OtpFormData = z.infer<typeof otpSchema>;
type EmailSignInFormData = z.infer<typeof emailSignInSchema>;
type EmailSignUpFormData = z.infer<typeof emailSignUpSchema>;

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
  
  // États pour WhatsApp OTP fallback
  const [otpMethod, setOtpMethod] = useState<OtpMethod | null>(null);
  const [pendingFormData, setPendingFormData] = useState<SignUpFormData | SignInFormData | null>(null);
  
  // États pour détection des doublons
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  const [pendingSignUpData, setPendingSignUpData] = useState<SignUpFormData | null>(null);
  
  // Auth method selector: phone or email
  const [authInputMethod, setAuthInputMethod] = useState<'phone' | 'email'>('email');
  
  // Password visibility toggles
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const countryContext = useCountrySafe();
  const country = countryContext?.country ?? { code: 'CI', name: 'Côte d\'Ivoire', phonePrefix: '+225', currency: 'XOF', flag: '🇨🇮' };
  const { trackReferralEvent, getActiveReferralCode, setActiveReferralCode } = useReferralTracking();
  const { checkForDuplicate, isChecking } = useDuplicateAccountDetection();
  const { checkExistingAccount } = useAccountLinking();
  const { trackSignUp, trackLogin } = useGoogleAnalytics();
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

  const emailSignInForm = useForm<EmailSignInFormData>({
    resolver: zodResolver(emailSignInSchema),
  });

  const emailSignUpForm = useForm<EmailSignUpFormData>({
    resolver: zodResolver(emailSignUpSchema),
  });

  // Redirect if already authenticated - check for returnUrl first
  useEffect(() => {
    if (user) {
      const handleRedirect = async () => {
        // Process admin auto-assign if admin_ref is present
        const adminRef = searchParams.get('admin_ref') || sessionStorage.getItem('jdv_admin_ref');
        if (adminRef) {
          await processAdminAutoAssign(user.id);
        }

        const returnUrl = localStorage.getItem('returnUrl');
        if (returnUrl) {
          localStorage.removeItem('returnUrl');
          navigate(returnUrl);
        } else {
          handleSmartRedirect(user, navigate);
        }
      };
      handleRedirect();
    }
  }, [user, navigate, searchParams]);

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

  // Check if WhatsApp fallback should be shown
  const currentCountryCode = signInForm.watch('countryCode') || signUpForm.watch('countryCode') || country.phonePrefix;
  const { showFallback, defaultMethod, smsAvailable, autoWhatsApp } = useWhatsAppFallback(currentCountryCode);

  const sendOtpSignIn = async (data: SignInFormData) => {
    const fullPhone = `${data.countryCode}${data.phone}`;
    
    // Auto-WhatsApp: send directly without selector (BJ, TG, ML, BF)
    if (autoWhatsApp) {
      setOtpMethod('whatsapp');
      await sendWhatsAppOtp(fullPhone, 'signin');
      return;
    }
    
    // Check if we need to show method selector (CI, SN)
    if (showFallback && !otpMethod) {
      setPendingFormData(data);
      return;
    }
    
    // Use selected method or default
    const method = otpMethod || defaultMethod;
    
    if (method === 'whatsapp') {
      await sendWhatsAppOtp(fullPhone, 'signin');
    } else {
      await sendSmsOtp(fullPhone, 'signin');
    }
  };

  const sendSmsOtp = async (fullPhone: string, purpose: 'signin' | 'signup', metadata?: any) => {
    try {
      setIsLoading(true);
      
      console.log('📱 [SMS OTP] Sending OTP to:', fullPhone);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
        options: metadata ? { data: metadata } : undefined,
      });

      if (error) {
        console.error('❌ [SMS OTP] Send error:', error);
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ [SMS OTP] OTP sent successfully to:', fullPhone);
      setCurrentPhone(fullPhone);
      setOtpSent(true);
      setCountdown(300);
      toast({
        title: 'Code envoyé',
        description: 'Un code de vérification a été envoyé par SMS. Le SMS peut prendre jusqu\'à 2 minutes.',
      });
    } catch (error: any) {
      console.error('💥 [SMS OTP] Unexpected error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendWhatsAppOtp = async (fullPhone: string, purpose: 'signin' | 'signup', metadata?: any) => {
    try {
      setIsLoading(true);
      
      console.log('📱 [WhatsApp OTP] Sending OTP to:', fullPhone);
      
      const { data: result, error } = await supabase.functions.invoke('send-whatsapp-otp', {
        body: {
          phone: fullPhone,
          purpose,
          user_metadata: metadata,
        },
      });

      if (error || !result?.success) {
        console.error('❌ [WhatsApp OTP] Send error:', error || result?.error);
        toast({
          title: 'Erreur',
          description: result?.message || 'Impossible d\'envoyer le code WhatsApp',
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ [WhatsApp OTP] OTP sent successfully to:', fullPhone);
      setCurrentPhone(fullPhone);
      setOtpSent(true);
      setCountdown(300);
      toast({
        title: 'Code envoyé via WhatsApp',
        description: 'Un code de vérification a été envoyé sur votre WhatsApp.',
      });
    } catch (error: any) {
      console.error('💥 [WhatsApp OTP] Unexpected error:', error);
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
    const fullPhone = `${data.countryCode}${data.phone}`;
    
    // Auto-WhatsApp: send directly without selector (BJ, TG, ML, BF)
    if (autoWhatsApp) {
      setOtpMethod('whatsapp');
      await sendOtpSignUp(data, false);
      return;
    }
    
    // Check if we need to show method selector (CI, SN)
    if (showFallback && !otpMethod) {
      setPendingFormData(data);
      setAuthMode('signup');
      return;
    }
    
    await sendOtpSignUp(data, false);
  };

  // Handle method selection
  const handleMethodSelect = async (method: OtpMethod) => {
    setOtpMethod(method);
    
    if (pendingFormData) {
      if ('firstName' in pendingFormData) {
        // It's a signup form
        const data = pendingFormData as SignUpFormData;
        const fullPhone = `${data.countryCode}${data.phone}`;
        const metadata = {
          first_name: data.firstName,
          birthday: data.birthday,
          city: data.city,
          phone: fullPhone,
        };
        
        if (method === 'whatsapp') {
          await sendWhatsAppOtp(fullPhone, 'signup', metadata);
        } else {
          await sendSmsOtp(fullPhone, 'signup', metadata);
        }
      } else {
        // It's a signin form
        const data = pendingFormData as SignInFormData;
        const fullPhone = `${data.countryCode}${data.phone}`;
        
        if (method === 'whatsapp') {
          await sendWhatsAppOtp(fullPhone, 'signin');
        } else {
          await sendSmsOtp(fullPhone, 'signin');
        }
      }
      setPendingFormData(null);
    }
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
      
      // Use selected method or default
      const method = otpMethod || defaultMethod;
      const metadata = {
        first_name: data.firstName,
        birthday: data.birthday,
        city: data.city,
        phone: fullPhone,
      };
      
      if (method === 'whatsapp') {
        await sendWhatsAppOtp(fullPhone, 'signup', metadata);
      } else {
        await sendSmsOtp(fullPhone, 'signup', metadata);
      }
      
      setAuthMode('signup');
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
      
      // Check if we're using WhatsApp OTP
      const method = otpMethod || defaultMethod;
      
      if (method === 'whatsapp') {
        // Verify via WhatsApp edge function
        console.log('🔐 [WhatsApp OTP Verify] Verifying code for:', currentPhone);
        
        const { data: result, error } = await supabase.functions.invoke('verify-whatsapp-otp', {
          body: {
            phone: currentPhone,
            code: data.otp,
          },
        });

        if (error || !result?.success) {
          console.error('❌ [WhatsApp OTP Verify] Failed:', error || result?.error);
          toast({
            title: 'Code invalide',
            description: result?.message || 'Le code saisi est incorrect ou expiré',
            variant: 'destructive',
          });
          return;
        }

        console.log('✅ [WhatsApp OTP Verify] Success, user:', result.user_id);

        // If we got tokens, set the session
        if (result.access_token && result.refresh_token) {
          await supabase.auth.setSession({
            access_token: result.access_token,
            refresh_token: result.refresh_token,
          });
        } else if (result.requires_reauth) {
          // Fallback: user exists but we couldn't create session
          // Try SMS-based signin for this user
          toast({
            title: 'Vérification réussie',
            description: 'Votre compte est vérifié. Connexion en cours...',
          });
          
          // Trigger SMS OTP for this phone to complete auth
          const { error: smsError } = await supabase.auth.signInWithOtp({
            phone: currentPhone,
          });
          
          if (smsError) {
            toast({
              title: 'Connexion',
              description: 'Compte vérifié. Veuillez vous reconnecter via SMS.',
            });
            resetOtpFlow();
            return;
          }
          
          toast({
            title: 'Code SMS envoyé',
            description: 'Un code SMS vous a été envoyé pour finaliser la connexion.',
          });
          setOtpMethod('sms');
          setCountdown(300);
          return;
        }

        // Track signup or login
        if (result.is_new_user || authMode === 'signup') {
          trackSignUp('whatsapp');
          
          // Send welcome email
          try {
            await supabase.functions.invoke('send-welcome-email', {
              body: {
                user_email: currentPhone,
                user_name: 'utilisateur',
              }
            });
          } catch (e) {
            console.error('Error sending welcome email:', e);
          }
        } else {
          trackLogin('whatsapp');
        }

        toast({
          title: authMode === 'signup' ? 'Compte créé' : 'Connexion réussie',
          description: authMode === 'signup' ? 'Votre compte a été créé avec succès' : 'Vous êtes maintenant connecté',
        });

        // Auto-assign to admin if admin_ref present
        if (result.user_id) await processAdminAutoAssign(result.user_id);
        navigate(result.is_new_user ? '/dashboard?onboarding=true' : '/dashboard');
        return;
      }
      
      // Standard SMS OTP verification
      console.log('🔐 [SMS OTP Verify] Verifying OTP:', {
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
        console.error('❌ [SMS OTP Verify] Verification failed:', {
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

      console.log('✅ [SMS OTP Verify] Verification successful, user:', authData.user?.id);

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

        // Track signup or login in Google Analytics
        if (isNewSignup || authMode === 'signup') {
          trackSignUp('phone');
        } else {
          trackLogin('phone');
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
          await processAdminAutoAssign(authData.user.id);
          navigate(`${redirectPath}?onboarding=true`);
        } else {
          await processAdminAutoAssign(authData.user.id);
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
      setCountdown(300);
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

  // Email auth handlers
  const handleEmailSignIn = async (data: EmailSignInFormData) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast({
          title: 'Erreur de connexion',
          description: error.message === 'Invalid login credentials' 
            ? 'Email ou mot de passe incorrect' 
            : error.message,
          variant: 'destructive',
        });
        return;
      }

      if (authData.user) {
        trackLogin('email');
        toast({
          title: 'Connexion réussie',
          description: 'Vous êtes maintenant connecté',
        });
        await processAdminAutoAssign(authData.user.id);
        await handleSmartRedirect(authData.user, navigate);
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.message || 'Une erreur inattendue s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (data: EmailSignUpFormData) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            birthday: data.birthday,
            city: data.city,
          },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) {
        if (error.message?.includes('User already registered') || (error as any)?.code === 'user_already_exists') {
          toast({
            title: 'Compte existant',
            description: 'Un compte existe déjà avec cet email. Veuillez vous connecter.',
          });
          setAuthMode('signin');
        } else {
          toast({
            title: 'Erreur d\'inscription',
            description: error.message,
            variant: 'destructive',
          });
        }
        return;
      }

      if (authData.user) {
        trackSignUp('email');
        
        // Send welcome email
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: {
              user_email: data.email,
              user_name: data.firstName,
            }
          });
        } catch (e) {
          console.error('Error sending welcome email:', e);
        }

        // Check if email confirmation is required
        if (authData.user.identities?.length === 0) {
          toast({
            title: 'Email déjà utilisé',
            description: 'Un compte existe déjà avec cette adresse email.',
            variant: 'destructive',
          });
          return;
        }

        if (!authData.session) {
          toast({
            title: 'Vérifiez votre email',
            description: 'Un email de confirmation a été envoyé à votre adresse. Cliquez sur le lien pour activer votre compte.',
          });
        } else {
          toast({
            title: 'Compte créé',
            description: 'Votre compte a été créé avec succès !',
          });
          await processAdminAutoAssign(authData.user.id);
          navigate('/dashboard?onboarding=true');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.message || 'Une erreur inattendue s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = emailSignInForm.getValues('email');
    if (!email) {
      toast({
        title: 'Email requis',
        description: 'Veuillez entrer votre adresse email pour réinitialiser le mot de passe',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Email envoyé',
        description: 'Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.message || 'Une erreur inattendue s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };


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
          {/* Étape 1: Sélection de méthode OTP (pour pays avec fallback WhatsApp) */}
          {!otpSent && pendingFormData && showFallback ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Mode de vérification</h3>
                <p className="text-sm text-muted-foreground">
                  Choisissez comment recevoir votre code de vérification
                </p>
              </div>
              
              <OtpMethodSelector
                countryCode={currentCountryCode}
                selectedMethod={otpMethod}
                onSelectMethod={handleMethodSelect}
                disabled={isLoading}
              />
              
              {otpMethod && (
                <Button
                  onClick={() => handleMethodSelect(otpMethod)}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Envoi en cours...
                    </>
                  ) : (
                    `Recevoir le code par ${otpMethod === 'whatsapp' ? 'WhatsApp' : 'SMS'}`
                  )}
                </Button>
              )}
              
              <Button
                variant="ghost"
                onClick={() => {
                  setPendingFormData(null);
                  setOtpMethod(null);
                }}
                className="w-full"
              >
                ← Retour au formulaire
              </Button>
            </motion.div>
          ) : !otpSent ? (
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
                    <div className="mt-4">
                      {/* Google button first */}
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

                      <div className="relative my-4">
                        <Separator />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                          ou
                        </span>
                      </div>

                      {/* Method selector: Email first, then Phone */}
                      <div className="flex gap-2 mb-4">
                        <Button
                          type="button"
                          variant={authInputMethod === 'email' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={() => setAuthInputMethod('email')}
                        >
                          <Mail className="h-4 w-4" />
                          Email
                        </Button>
                        <Button
                          type="button"
                          variant={authInputMethod === 'phone' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={() => setAuthInputMethod('phone')}
                        >
                          <Phone className="h-4 w-4" />
                          Téléphone
                        </Button>
                      </div>

                      {authInputMethod === 'phone' ? (
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
                          
                          <WhatsAppAutoIndicator phonePrefix={currentCountryCode} />
                          
                          <Button type="submit" className="w-full" disabled={isLoading || isChecking || isServerChecking}>
                            {isLoading || isChecking || isServerChecking ? 'Vérification...' : 'Envoyer le code'}
                          </Button>
                        </form>
                      ) : (
                        <form onSubmit={emailSignInForm.handleSubmit(handleEmailSignIn)} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="signin-email">Email <span className="text-destructive">*</span></Label>
                            <Input
                              id="signin-email"
                              type="email"
                              placeholder="votre@email.com"
                              {...emailSignInForm.register('email')}
                            />
                            {emailSignInForm.formState.errors.email && (
                              <p className="text-sm text-destructive">{emailSignInForm.formState.errors.email.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="signin-password">Mot de passe <span className="text-destructive">*</span></Label>
                            <div className="relative">
                              <Input
                                id="signin-password"
                                type={showSignInPassword ? 'text' : 'password'}
                                placeholder="Votre mot de passe"
                                className="pr-10"
                                {...emailSignInForm.register('password')}
                              />
                              <button
                                type="button"
                                onClick={() => setShowSignInPassword(!showSignInPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            {emailSignInForm.formState.errors.password && (
                              <p className="text-sm text-destructive">{emailSignInForm.formState.errors.password.message}</p>
                            )}
                          </div>

                          <div className="text-right">
                            <button
                              type="button"
                              onClick={handleForgotPassword}
                              className="text-sm text-primary hover:underline"
                              disabled={isLoading}
                            >
                              Mot de passe oublié ?
                            </button>
                          </div>
                          
                          <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Connexion...' : 'Se connecter'}
                          </Button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4">
                      {/* Google button first */}
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

                      <div className="relative my-4">
                        <Separator />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                          ou
                        </span>
                      </div>

                      {/* Method selector: Email first, then Phone */}
                      <div className="flex gap-2 mb-4">
                        <Button
                          type="button"
                          variant={authInputMethod === 'email' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={() => setAuthInputMethod('email')}
                        >
                          <Mail className="h-4 w-4" />
                          Email
                        </Button>
                        <Button
                          type="button"
                          variant={authInputMethod === 'phone' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={() => setAuthInputMethod('phone')}
                        >
                          <Phone className="h-4 w-4" />
                          Téléphone
                        </Button>
                      </div>

                      {authInputMethod === 'phone' ? (
                        <>
                        <PhoneSignupProgress form={signUpForm} />
                        <form onSubmit={signUpForm.handleSubmit(handleSignUpSubmit)} className="space-y-4" noValidate>
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
                          
                          <BirthdayPicker
                            label="Date d'anniversaire"
                            labelIcon={<Gift className="h-4 w-4 text-primary" />}
                            value={signUpForm.watch('birthday') ? new Date(signUpForm.watch('birthday') + 'T00:00:00') : undefined}
                            onChange={(date) => signUpForm.setValue('birthday', date ? format(date, 'yyyy-MM-dd') : '', { shouldValidate: true })}
                          />
                          
                          <AddressSelector
                            onAddressChange={(data: AddressResult) => {
                              signUpForm.setValue('city', data.fullAddress);
                            }}
                            label="Lieu de livraison"
                            cityLabel="Ville / Commune"
                            neighborhoodLabel="Quartier (optionnel)"
                            required={false}
                            showCoordinates={false}
                          />
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
                          
                          <WhatsAppAutoIndicator phonePrefix={currentCountryCode} />
                          
                          <Button type="submit" className="w-full" disabled={isLoading || isChecking || isServerChecking}>
                            {isLoading || isChecking || isServerChecking ? 'Vérification...' : 'Envoyer le code'}
                          </Button>
                        </form>
                        </>
                      ) : (
                        <>
                        <EmailSignupProgress form={emailSignUpForm} />
                        <form onSubmit={emailSignUpForm.handleSubmit(handleEmailSignUp)} className="space-y-4" noValidate>
                          <div className="space-y-2">
                            <Label htmlFor="email-firstName">Prénom <span className="text-destructive">*</span></Label>
                            <Input
                              id="email-firstName"
                              placeholder="Prénom"
                              {...emailSignUpForm.register('firstName')}
                            />
                            {emailSignUpForm.formState.errors.firstName && (
                              <p className="text-sm text-destructive">{emailSignUpForm.formState.errors.firstName.message}</p>
                            )}
                          </div>
                          
                          <BirthdayPicker
                            label="Date d'anniversaire"
                            labelIcon={<Gift className="h-4 w-4 text-primary" />}
                            value={emailSignUpForm.watch('birthday') ? new Date(emailSignUpForm.watch('birthday') + 'T00:00:00') : undefined}
                            onChange={(date) => emailSignUpForm.setValue('birthday', date ? format(date, 'yyyy-MM-dd') : '', { shouldValidate: true })}
                          />
                          
                          <AddressSelector
                            onAddressChange={(data: AddressResult) => {
                              emailSignUpForm.setValue('city', data.fullAddress);
                            }}
                            label="Lieu de livraison"
                            cityLabel="Ville / Commune"
                            neighborhoodLabel="Quartier (optionnel)"
                            required={false}
                            showCoordinates={false}
                          />

                          <div className="space-y-2">
                            <Label htmlFor="email-signup-email">Email <span className="text-destructive">*</span></Label>
                            <Input
                              id="email-signup-email"
                              type="email"
                              placeholder="votre@email.com"
                              {...emailSignUpForm.register('email')}
                            />
                            {emailSignUpForm.formState.errors.email && (
                              <p className="text-sm text-destructive">{emailSignUpForm.formState.errors.email.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email-signup-password">Mot de passe <span className="text-destructive">*</span></Label>
                            <div className="relative">
                              <Input
                                id="email-signup-password"
                                type={showSignUpPassword ? 'text' : 'password'}
                                placeholder="Minimum 8 caractères"
                                className="pr-10"
                                {...emailSignUpForm.register('password')}
                              />
                              <button
                                type="button"
                                onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            {emailSignUpForm.formState.errors.password && (
                              <p className="text-sm text-destructive">{emailSignUpForm.formState.errors.password.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email-signup-confirm">Confirmer le mot de passe <span className="text-destructive">*</span></Label>
                            <div className="relative">
                              <Input
                                id="email-signup-confirm"
                                type={showSignUpConfirmPassword ? 'text' : 'password'}
                                placeholder="Retapez le mot de passe"
                                className="pr-10"
                                {...emailSignUpForm.register('confirmPassword')}
                              />
                              <button
                                type="button"
                                onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showSignUpConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            {emailSignUpForm.formState.errors.confirmPassword && (
                              <p className="text-sm text-destructive">{emailSignUpForm.formState.errors.confirmPassword.message}</p>
                            )}
                          </div>
                          
                          <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Inscription...' : 'Créer mon compte'}
                          </Button>
                        </form>
                        </>
                      )}
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
                    {countdown > 0 ? `Renvoyer dans ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}` : 'Renvoyer le code'}
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
      {/* SEO & Schema.org for registration page */}
      <SEOHead
        title="Connexion & Inscription | Créer Compte Gratuit"
        description="Connectez-vous ou créez un compte gratuit pour créer des cagnottes collectives et offrir des cadeaux en groupe. Paiement Mobile Money."
        keywords="inscription cagnotte, créer compte gratuit, connexion Joie de Vivre, s'inscrire cadeaux collectifs"
        aiContentType="landing"
        aiSummary="Page d'inscription et de connexion pour créer des cagnottes collectives gratuitement."
        audience="consumers"
      />
      <SoftwareApplicationSchema variant="customer" />
      <SpeakableSchema 
        pageName="auth" 
        cssSelectors={[".card-title", ".card-description"]} 
      />
    </div>
  );
};

export default Auth;