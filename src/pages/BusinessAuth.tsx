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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Store, ArrowLeft, Loader2, Phone, Edit2, Check, Mail, Eye, EyeOff } from 'lucide-react';
import { getAllCountries } from '@/config/countries';
import { useCountry } from '@/contexts/CountryContext';
import { cn } from '@/lib/utils';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useDuplicateAccountDetection, type DuplicateCheckResult } from '@/hooks/useDuplicateAccountDetection';
import { DuplicateAccountModal } from '@/components/DuplicateAccountModal';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { SEOHead } from '@/components/SEOHead';
import { HowToSchema } from '@/components/schema';
import { SoftwareApplicationSchema, SpeakableSchema } from '@/components/schema/SoftwareApplicationSchema';
import { useAcquisitionTracking } from '@/hooks/useAcquisitionTracking';
import { AddressSelector, type AddressResult } from '@/components/AddressSelector';

// Progress Indicator Component
const ProgressIndicator = ({ progress, step }: { progress: number; step: string }) => {
  return (
    <div className="space-y-3 mb-6 p-4 bg-secondary/30 rounded-xl">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{step}</span>
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
      <div className="flex justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          {progress >= 25 ? <Check className="h-3 w-3 text-green-500" /> : <span className="h-3 w-3 rounded-full bg-muted-foreground/30" />}
          <span>Identité</span>
        </div>
        <div className="flex items-center gap-1">
          {progress >= 50 ? <Check className="h-3 w-3 text-green-500" /> : <span className="h-3 w-3 rounded-full bg-muted-foreground/30" />}
          <span>Business</span>
        </div>
        <div className="flex items-center gap-1">
          {progress >= 75 ? <Check className="h-3 w-3 text-green-500" /> : <span className="h-3 w-3 rounded-full bg-muted-foreground/30" />}
          <span>Contact</span>
        </div>
        <div className="flex items-center gap-1">
          {progress === 100 ? <Check className="h-3 w-3 text-green-500" /> : <span className="h-3 w-3 rounded-full bg-muted-foreground/30" />}
          <span>Validation</span>
        </div>
      </div>
    </div>
  );
};

// Signup Progress Indicator with form integration
const SignupProgressIndicator = ({ signUpForm }: { signUpForm: any }) => {
  const values = signUpForm.watch();
  
  // Calculate progress based on filled required fields
  let filledFields = 0;
  const totalRequiredFields = 4; // firstName, lastName, businessName, phone
  
  if (values.firstName && values.firstName.length >= 2) filledFields++;
  if (values.lastName && values.lastName.length >= 2) filledFields++;
  if (values.businessName && values.businessName.length >= 2) filledFields++;
  if (values.phone && /^[0-9]{8,10}$/.test(values.phone)) filledFields++;
  
  const progress = Math.round((filledFields / totalRequiredFields) * 100);
  
  const getStepLabel = (progress: number) => {
    if (progress === 0) return 'Commencez votre inscription';
    if (progress < 50) return 'Informations personnelles';
    if (progress < 75) return 'Informations business';
    if (progress < 100) return 'Presque terminé !';
    return 'Prêt pour la vérification';
  };

  return <ProgressIndicator progress={progress} step={getStepLabel(progress)} />;
};

// Complete Registration Progress Indicator (for Google Auth completion form)
const CompleteRegistrationProgressIndicator = ({ 
  form, 
  isGoogleAuth 
}: { 
  form: any; 
  isGoogleAuth: boolean;
}) => {
  const values = form.watch();
  
  // Champs requis : firstName, lastName, businessName
  // + phone si Google Auth (optionnel mais compte pour la progression)
  let filledFields = 0;
  const totalRequiredFields = 3; // Toujours 3 requis (firstName, lastName, businessName)
  
  if (values.firstName && values.firstName.length >= 2) filledFields++;
  if (values.lastName && values.lastName.length >= 2) filledFields++;
  if (values.businessName && values.businessName.length >= 2) filledFields++;
  
  // Bonus pour champs optionnels (ajoute un pourcentage supplémentaire)
  let bonusProgress = 0;
  if (isGoogleAuth && values.phone && /^[0-9]{8,10}$/.test(values.phone)) bonusProgress += 10;
  if (values.businessType) bonusProgress += 5;
  if (values.address) bonusProgress += 3;
  if (values.description) bonusProgress += 2;
  
  const baseProgress = Math.round((filledFields / totalRequiredFields) * 80); // 80% max pour champs requis
  const progress = Math.min(100, baseProgress + bonusProgress);
  
  const getStepLabel = (progress: number) => {
    if (progress === 0) return 'Complétez votre profil';
    if (progress < 30) return 'Informations personnelles';
    if (progress < 60) return 'Informations business';
    if (progress < 80) return 'Presque terminé !';
    return 'Prêt à finaliser !';
  };

  const isIdentityComplete = values.firstName?.length >= 2 && values.lastName?.length >= 2;
  const isBusinessComplete = values.businessName?.length >= 2;
  const isContactComplete = isGoogleAuth ? (values.phone && /^[0-9]{8,10}$/.test(values.phone)) : true;
  const isReady = isIdentityComplete && isBusinessComplete;

  return (
    <div className="space-y-3 mb-6 p-4 bg-secondary/30 rounded-xl">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{getStepLabel(progress)}</span>
        <span className="text-sm font-semibold text-primary">{progress}%</span>
      </div>
      <Progress 
        value={progress} 
        className="h-2" 
        indicatorClassName={cn(
          "transition-all duration-500",
          progress >= 80 ? "bg-green-500" : "bg-primary"
        )}
      />
      <div className={cn(
        "flex text-xs text-muted-foreground",
        isGoogleAuth ? "justify-between" : "justify-around"
      )}>
        <div className="flex items-center gap-1">
          {isIdentityComplete 
            ? <Check className="h-3 w-3 text-green-500" /> 
            : <span className="h-3 w-3 rounded-full bg-muted-foreground/30" />}
          <span>Identité</span>
        </div>
        <div className="flex items-center gap-1">
          {isBusinessComplete 
            ? <Check className="h-3 w-3 text-green-500" /> 
            : <span className="h-3 w-3 rounded-full bg-muted-foreground/30" />}
          <span>Business</span>
        </div>
        {isGoogleAuth && (
          <div className="flex items-center gap-1">
            {isContactComplete
              ? <Check className="h-3 w-3 text-green-500" /> 
              : <span className="h-3 w-3 rounded-full bg-muted-foreground/30" />}
            <span>Contact</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          {isReady 
            ? <Check className="h-3 w-3 text-green-500" /> 
            : <span className="h-3 w-3 rounded-full bg-muted-foreground/30" />}
          <span>Prêt</span>
        </div>
      </div>
    </div>
  );
};

// Google Icon component
const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

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

// Schéma pour compléter l'inscription (téléphone optionnel pour Google Auth)
const completeRegistrationSchema = z.object({
  firstName: z.string().min(2, 'Le prénom est requis (min 2 caractères)'),
  lastName: z.string().min(2, 'Le nom est requis (min 2 caractères)'),
  businessName: z.string().min(2, 'Le nom d\'entreprise est requis (min 2 caractères)'),
  businessType: z.string().optional(),
  phone: z.string().regex(/^[0-9]{8,10}$/, 'Format invalide').optional().or(z.literal('')),
  address: z.string().optional(),
  description: z.string().optional(),
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;
type OtpFormData = z.infer<typeof otpSchema>;
type CompleteRegistrationFormData = z.infer<typeof completeRegistrationSchema>;

// Email auth schemas for business
const emailSignInSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

const emailSignUpSchema = z.object({
  firstName: z.string().min(2, 'Le prénom est requis (min 2 caractères)'),
  lastName: z.string().min(2, 'Le nom est requis (min 2 caractères)'),
  businessName: z.string().min(2, 'Le nom d\'entreprise est requis (min 2 caractères)'),
  businessType: z.string().optional(),
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
  address: z.string().optional(),
  description: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type EmailSignInFormData = z.infer<typeof emailSignInSchema>;
type EmailSignUpFormData = z.infer<typeof emailSignUpSchema>;

const BusinessAuth = () => {
  const { country } = useCountry();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [businessNameError, setBusinessNameError] = useState<string | null>(null);
  const [showCompleteRegistration, setShowCompleteRegistration] = useState(false);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [completePhoneCountryCode, setCompletePhoneCountryCode] = useState(country.phonePrefix);
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);
  const [authenticatedPhone, setAuthenticatedPhone] = useState<string | null>(null);
  
  // États pour OTP
  const [otpSent, setOtpSent] = useState(false);
  const [currentPhone, setCurrentPhone] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [signupFormData, setSignupFormData] = useState<SignUpFormData | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [countryCode, setCountryCode] = useState(country.phonePrefix);
  
  // États pour détection des doublons
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  const [pendingSignUpData, setPendingSignUpData] = useState<SignUpFormData | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin';
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(initialTab);
  const { user, setUserMode, refreshSession } = useAuth();
  const { checkForDuplicate, isChecking } = useDuplicateAccountDetection();
  const { trackSignUp } = useGoogleAnalytics();

  // Forms
  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { countryCode: country.phonePrefix },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { countryCode: country.phonePrefix },
  });

  const completeRegistrationForm = useForm<CompleteRegistrationFormData>({
    resolver: zodResolver(completeRegistrationSchema),
  });

  const emailSignInForm = useForm<EmailSignInFormData>({
    resolver: zodResolver(emailSignInSchema),
  });

  const emailSignUpForm = useForm<EmailSignUpFormData>({
    resolver: zodResolver(emailSignUpSchema),
  });

  // Auth input method selector
  const [authInputMethod, setAuthInputMethod] = useState<'phone' | 'email'>('phone');
  
  // Password visibility toggles
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);

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
        } else {
          // No business account - show completion form for Google Auth users
          setAuthenticatedUserId(user.id);
          setAuthenticatedPhone(user.phone || '');
          setIsGoogleAuth(!user.phone); // Google Auth users don't have phone
          setShowCompleteRegistration(true);
          
          // Pre-fill form with Google data
          const firstName = user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.given_name || '';
          const lastName = user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || user.user_metadata?.family_name || '';
          
          completeRegistrationForm.setValue('firstName', firstName);
          completeRegistrationForm.setValue('lastName', lastName);
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

  // Connexion avec Google
  const signInWithGoogle = async () => {
    const isLovablePreview = window.location.hostname.includes('lovableproject.com') 
      || window.location.hostname.includes('lovable.app')
      || window.location.hostname.includes('localhost');
    
    if (isLovablePreview) {
      toast({
        title: 'Authentification Google',
        description: 'L\'authentification Google n\'est pas disponible dans l\'aperçu.',
        action: (
          <a 
            href="https://joiedevivre-africa.com/business-auth" 
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
          redirectTo: `${window.location.origin}/business-auth`,
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
        description: error?.message || 'Une erreur s\'est produite.',
        variant: 'destructive',
      });
    } finally {
      setIsGoogleLoading(false);
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

  // Handler pour le formulaire d'inscription
  const handleSignUpSubmit = async (data: SignUpFormData) => {
    await sendOtpSignUp(data, false);
  };

  // Envoyer OTP pour inscription
  const sendOtpSignUp = async (data: SignUpFormData, skipDuplicateCheck: boolean) => {
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
    
    // Vérification des doublons avant inscription (sauf si on a déjà vérifié)
    if (!skipDuplicateCheck) {
      console.log('🔍 [Business Duplicate Check] Checking for existing accounts...');
      const duplicateCheck = await checkForDuplicate(fullPhone, data.firstName);
      
      if (duplicateCheck.hasPotentialDuplicate) {
        console.log('⚠️ [Business Duplicate Check] Found potential duplicate:', duplicateCheck);
        setDuplicateResult(duplicateCheck);
        setPendingSignUpData(data);
        setShowDuplicateModal(true);
        setIsLoading(false);
        return;
      }
    }
    
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

      // Déterminer le téléphone : OTP phone ou formulaire phone (Google Auth)
      const phoneToUse = authenticatedPhone || (formData.phone ? `${completePhoneCountryCode}${formData.phone}` : '');

      // Récupérer le country_code du profil utilisateur
      const { data: profileData } = await supabase
        .from('profiles')
        .select('country_code')
        .eq('user_id', authenticatedUserId)
        .single();

      const { error: businessError } = await supabase
        .from('business_accounts')
        .insert({
          user_id: authenticatedUserId,
          business_name: formData.businessName,
          business_type: formData.businessType || '',
          phone: phoneToUse,
          email: user?.email || '',
          address: formData.address || '',
          description: formData.description || '',
          is_active: true,
          status: 'active',
          country_code: profileData?.country_code || null,
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
      
      // Track business signup in Google Analytics
      trackSignUp('phone_business');
      
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
        // Check for existing business account
        const { data: businessAccounts } = await supabase
          .from('business_accounts')
          .select('id')
          .eq('user_id', authData.user.id)
          .limit(1);

        if (businessAccounts && businessAccounts.length > 0) {
          setUserMode('business');
          toast({ title: 'Connexion réussie', description: 'Bienvenue dans votre espace business' });
          navigate('/business-account', { replace: true });
        } else {
          setAuthenticatedUserId(authData.user.id);
          setAuthenticatedPhone('');
          setIsGoogleAuth(true);
          setShowCompleteRegistration(true);
          
          const firstName = authData.user.user_metadata?.first_name || '';
          const lastName = authData.user.user_metadata?.last_name || '';
          completeRegistrationForm.setValue('firstName', firstName);
          completeRegistrationForm.setValue('lastName', lastName);
        }
      }
    } catch (error: any) {
      toast({ title: 'Erreur', description: error?.message || 'Une erreur inattendue s\'est produite', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (data: EmailSignUpFormData) => {
    setIsLoading(true);
    
    const isUnique = await checkBusinessNameUniqueness(data.businessName);
    if (!isUnique) {
      setIsLoading(false);
      toast({ title: 'Nom d\'entreprise déjà utilisé', description: 'Ce nom est déjà enregistré.', variant: 'destructive' });
      return;
    }

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            is_business: true,
          },
          emailRedirectTo: `${window.location.origin}/business-auth`,
        },
      });

      if (error) {
        toast({ title: 'Erreur d\'inscription', description: error.message, variant: 'destructive' });
        return;
      }

      if (authData.user) {
        if (authData.user.identities?.length === 0) {
          toast({ title: 'Email déjà utilisé', description: 'Un compte existe déjà avec cette adresse email.', variant: 'destructive' });
          return;
        }

        if (!authData.session) {
          toast({
            title: 'Vérifiez votre email',
            description: 'Un email de confirmation a été envoyé. Cliquez sur le lien pour activer votre compte, puis revenez ici.',
          });
        } else {
          // Create business account immediately
          const { data: profileData } = await supabase
            .from('profiles')
            .select('country_code')
            .eq('user_id', authData.user.id)
            .single();

          const { error: businessError } = await supabase
            .from('business_accounts')
            .insert({
              user_id: authData.user.id,
              business_name: data.businessName,
              business_type: data.businessType || '',
              email: data.email,
              address: data.address || '',
              description: data.description || '',
              is_active: true,
              status: 'active',
              country_code: profileData?.country_code || null,
            });

          if (businessError && businessError.code !== '23505') {
            console.error('Error creating business account:', businessError);
          }

          setUserMode('business');
          trackSignUp('email_business');
          toast({ title: 'Bienvenue !', description: 'Votre espace business est maintenant prêt.' });
          navigate('/business-account?onboarding=true', { replace: true });
        }
      }
    } catch (error: any) {
      toast({ title: 'Erreur', description: error?.message || 'Une erreur inattendue s\'est produite', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = emailSignInForm.getValues('email');
    if (!email) {
      toast({ title: 'Email requis', description: 'Veuillez entrer votre adresse email', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Email envoyé', description: 'Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation.' });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error?.message || 'Une erreur inattendue', variant: 'destructive' });
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

  // Générer les codes pays dynamiquement depuis la configuration
  const countryCodes = getAllCountries().map(c => ({
    code: c.phonePrefix,
    country: c.code,
    flag: c.flag
  }));

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
            {/* Progress Indicator */}
            <CompleteRegistrationProgressIndicator 
              form={completeRegistrationForm} 
              isGoogleAuth={isGoogleAuth}
            />
            
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

              {/* Téléphone (affiché uniquement pour Google Auth) */}
              {isGoogleAuth && (
                <div className="space-y-2">
                  <Label htmlFor="complete-phone" className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-primary" />
                    Téléphone <span className="text-xs text-muted-foreground">(optionnel)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Select 
                      value={completePhoneCountryCode}
                      onValueChange={setCompletePhoneCountryCode}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countryCodes.map(({ code, flag }) => (
                          <SelectItem key={code} value={code}>
                            {flag} {code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="complete-phone"
                      placeholder="0701020304"
                      {...completeRegistrationForm.register('phone')}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pour recevoir les notifications de commandes par SMS
                  </p>
                </div>
              )}

              <AddressSelector
                onAddressChange={(data: AddressResult) => {
                  completeRegistrationForm.setValue('address', data.fullAddress);
                }}
                label="Adresse de la boutique"
                cityLabel="Ville / Commune"
                neighborhoodLabel="Quartier"
                required={false}
                showCoordinates={false}
              />

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
      {/* SEO Head for Business Registration */}
      <SEOHead
        title="Devenir Vendeur Partenaire | JOIE DE VIVRE"
        description="Inscrivez-vous comme vendeur partenaire sur JOIE DE VIVRE. Créez votre boutique en ligne et vendez vos produits à travers la plateforme de cadeaux collaboratifs en Afrique."
      />

      {/* HowTo Schema - Guide pour devenir vendeur partenaire */}
      <HowToSchema
        id="devenir-vendeur-partenaire"
        name="Comment devenir vendeur partenaire sur JOIE DE VIVRE"
        description="Guide complet étape par étape pour créer votre compte vendeur, configurer votre boutique et commencer à vendre vos produits sur la plateforme de cadeaux collaboratifs."
        totalTime="PT10M"
        steps={[
          {
            name: "Accédez à l'espace vendeur",
            text: "Rendez-vous sur la page d'inscription vendeur via le lien 'Devenir vendeur' ou 'Espace vendeur' depuis le menu principal de JOIE DE VIVRE.",
          },
          {
            name: "Renseignez vos informations personnelles",
            text: "Entrez votre prénom et votre nom. Ces informations seront utilisées pour identifier le responsable du compte vendeur.",
          },
          {
            name: "Créez votre profil business",
            text: "Indiquez le nom de votre entreprise ou boutique ainsi que votre type d'activité (pâtisserie, fleuriste, décoration, etc.). Le nom d'entreprise doit être unique sur la plateforme.",
          },
          {
            name: "Vérifiez votre numéro de téléphone",
            text: "Entrez votre numéro de téléphone mobile. Vous recevrez un code de vérification par SMS à 6 chiffres que vous devrez saisir pour confirmer votre identité.",
          },
          {
            name: "Soumettez votre demande",
            text: "Après vérification de votre téléphone, votre demande d'inscription est automatiquement soumise à notre équipe de validation.",
          },
          {
            name: "Attendez la validation",
            text: "Notre équipe examine votre demande sous 24 à 48 heures. Vous recevrez une notification par SMS et email une fois votre compte approuvé.",
          },
          {
            name: "Configurez votre boutique",
            text: "Une fois approuvé, accédez à votre tableau de bord vendeur pour ajouter votre logo, configurer vos zones de livraison et commencer à ajouter vos produits.",
          },
        ]}
        tool={[
          { name: "Smartphone ou ordinateur" },
          { name: "Connexion internet" },
          { name: "Application SMS pour recevoir le code de vérification" },
        ]}
        supply={[
          { name: "Numéro de téléphone mobile valide" },
          { name: "Nom d'entreprise unique" },
          { name: "Informations sur votre activité" },
        ]}
      />
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
            onClick={() => navigate(`/auth?tab=${authMode}`)}
            className="mt-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Compte client
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription Business</TabsTrigger>
            </TabsList>

            {/* Method selector: Phone or Email */}
            <div className="flex gap-2 mt-4 mb-2">
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
            </div>
            
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
                    {authInputMethod === 'phone' ? (
                      <form onSubmit={signInForm.handleSubmit(sendOtpSignIn)} className="space-y-4">
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
                    ) : (
                      <form onSubmit={emailSignInForm.handleSubmit(handleEmailSignIn)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="biz-signin-email">Email <span className="text-destructive">*</span></Label>
                          <Input
                            id="biz-signin-email"
                            type="email"
                            placeholder="votre@email.com"
                            {...emailSignInForm.register('email')}
                          />
                          {emailSignInForm.formState.errors.email && (
                            <p className="text-sm text-destructive">{emailSignInForm.formState.errors.email.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="biz-signin-password">Mot de passe <span className="text-destructive">*</span></Label>
                          <div className="relative">
                            <Input
                              id="biz-signin-password"
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
                          <button type="button" onClick={handleForgotPassword} className="text-sm text-primary hover:underline" disabled={isLoading}>
                            Mot de passe oublié ?
                          </button>
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? 'Connexion...' : 'Se connecter'}
                        </Button>
                      </form>
                    )}

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
                  </div>
                ) : (
                  <div className="mt-4">
                    {authInputMethod === 'phone' ? (
                      <>
                        <SignupProgressIndicator signUpForm={signUpForm} />
                        <form onSubmit={signUpForm.handleSubmit(handleSignUpSubmit)} className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="firstName" className="flex items-center gap-1">Prénom <span className="text-destructive">*</span></Label>
                              <Input id="firstName" placeholder="Votre prénom" {...signUpForm.register('firstName')} className={cn(signUpForm.formState.errors.firstName && "border-destructive")} />
                              {signUpForm.formState.errors.firstName && <p className="text-sm text-destructive">{signUpForm.formState.errors.firstName.message}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="lastName" className="flex items-center gap-1">Nom <span className="text-destructive">*</span></Label>
                              <Input id="lastName" placeholder="Votre nom" {...signUpForm.register('lastName')} className={cn(signUpForm.formState.errors.lastName && "border-destructive")} />
                              {signUpForm.formState.errors.lastName && <p className="text-sm text-destructive">{signUpForm.formState.errors.lastName.message}</p>}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="businessName" className="flex items-center gap-1">Nom de l'entreprise <span className="text-destructive">*</span></Label>
                            <Input id="businessName" placeholder="Mon Enterprise SARL" {...signUpForm.register('businessName')} onBlur={(e) => checkBusinessNameUniqueness(e.target.value)} className={cn((signUpForm.formState.errors.businessName || businessNameError) && "border-destructive")} />
                            {signUpForm.formState.errors.businessName && <p className="text-sm text-destructive">{signUpForm.formState.errors.businessName.message}</p>}
                            {businessNameError && <p className="text-sm text-destructive">{businessNameError}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="businessType">Type d'activité</Label>
                            <Select onValueChange={(value) => signUpForm.setValue('businessType', value)}>
                              <SelectTrigger><SelectValue placeholder="Sélectionnez votre activité" /></SelectTrigger>
                              <SelectContent>{businessTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center gap-1">Téléphone <span className="text-destructive">*</span></Label>
                            <div className="flex gap-2">
                              <Select value={countryCode} onValueChange={setCountryCode}>
                                <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                                <SelectContent>{countryCodes.map((cc) => (<SelectItem key={cc.code} value={cc.code}>{cc.flag} {cc.code}</SelectItem>))}</SelectContent>
                              </Select>
                              <Input id="phone" type="tel" placeholder="07 XX XX XX XX" {...signUpForm.register('phone')} className="flex-1" />
                            </div>
                            {signUpForm.formState.errors.phone && <p className="text-sm text-destructive">{signUpForm.formState.errors.phone.message}</p>}
                          </div>
                          <AddressSelector onAddressChange={(data: AddressResult) => { signUpForm.setValue('address', data.fullAddress); }} label="Adresse de la boutique" cityLabel="Ville / Commune" neighborhoodLabel="Quartier" required={false} showCoordinates={false} />
                          <div className="space-y-2">
                            <Label htmlFor="description">Description (optionnel)</Label>
                            <Textarea id="description" placeholder="Décrivez votre activité..." rows={3} {...signUpForm.register('description')} />
                          </div>
                          <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi du code...</>) : (<><Phone className="mr-2 h-4 w-4" />Continuer - Vérifier mon numéro</>)}
                          </Button>
                          <p className="text-xs text-muted-foreground text-center mt-2">Un code de vérification sera envoyé à votre téléphone</p>
                        </form>
                      </>
                    ) : (
                      <form onSubmit={emailSignUpForm.handleSubmit(handleEmailSignUp)} className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">Prénom <span className="text-destructive">*</span></Label>
                            <Input placeholder="Votre prénom" {...emailSignUpForm.register('firstName')} />
                            {emailSignUpForm.formState.errors.firstName && <p className="text-sm text-destructive">{emailSignUpForm.formState.errors.firstName.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">Nom <span className="text-destructive">*</span></Label>
                            <Input placeholder="Votre nom" {...emailSignUpForm.register('lastName')} />
                            {emailSignUpForm.formState.errors.lastName && <p className="text-sm text-destructive">{emailSignUpForm.formState.errors.lastName.message}</p>}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">Nom de l'entreprise <span className="text-destructive">*</span></Label>
                          <Input placeholder="Mon Enterprise SARL" {...emailSignUpForm.register('businessName')} />
                          {emailSignUpForm.formState.errors.businessName && <p className="text-sm text-destructive">{emailSignUpForm.formState.errors.businessName.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>Type d'activité</Label>
                          <Select onValueChange={(value) => emailSignUpForm.setValue('businessType', value)}>
                            <SelectTrigger><SelectValue placeholder="Sélectionnez votre activité" /></SelectTrigger>
                            <SelectContent>{businessTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">Email <span className="text-destructive">*</span></Label>
                          <Input type="email" placeholder="votre@email.com" {...emailSignUpForm.register('email')} />
                          {emailSignUpForm.formState.errors.email && <p className="text-sm text-destructive">{emailSignUpForm.formState.errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">Mot de passe <span className="text-destructive">*</span></Label>
                          <div className="relative">
                            <Input type={showSignUpPassword ? 'text' : 'password'} placeholder="Minimum 8 caractères" className="pr-10" {...emailSignUpForm.register('password')} />
                            <button type="button" onClick={() => setShowSignUpPassword(!showSignUpPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {emailSignUpForm.formState.errors.password && <p className="text-sm text-destructive">{emailSignUpForm.formState.errors.password.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">Confirmer le mot de passe <span className="text-destructive">*</span></Label>
                          <div className="relative">
                            <Input type={showSignUpConfirmPassword ? 'text' : 'password'} placeholder="Retapez le mot de passe" className="pr-10" {...emailSignUpForm.register('confirmPassword')} />
                            <button type="button" onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              {showSignUpConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {emailSignUpForm.formState.errors.confirmPassword && <p className="text-sm text-destructive">{emailSignUpForm.formState.errors.confirmPassword.message}</p>}
                        </div>
                        <AddressSelector onAddressChange={(data: AddressResult) => { emailSignUpForm.setValue('address', data.fullAddress); }} label="Adresse de la boutique" cityLabel="Ville / Commune" neighborhoodLabel="Quartier" required={false} showCoordinates={false} />
                        <div className="space-y-2">
                          <Label>Description (optionnel)</Label>
                          <Textarea placeholder="Décrivez votre activité..." rows={3} {...emailSignUpForm.register('description')} />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? 'Inscription...' : 'Créer mon compte business'}
                        </Button>
                      </form>
                    )}

                    <div className="relative my-4">
                      <Separator />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">ou</span>
                    </div>

                    <Button type="button" variant="outline" className="w-full" disabled={isGoogleLoading} onClick={signInWithGoogle}>
                      {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <GoogleIcon />}
                      <span className="ml-2">S'inscrire avec Google</span>
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </Tabs>
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
      {/* Enhanced Schema.org for B2B registration */}
      <SoftwareApplicationSchema variant="business" />
      <SpeakableSchema 
        pageName="business-auth" 
        cssSelectors={[".card-title", ".card-description", ".text-2xl"]} 
      />
    </div>
  );
};

export default BusinessAuth;
