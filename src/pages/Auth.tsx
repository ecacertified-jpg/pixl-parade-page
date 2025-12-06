import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useEffect } from 'react';
import { Store, Gift, Shield } from 'lucide-react';
import { handleSmartRedirect, getRedirectPath } from '@/utils/authRedirect';
import { useReferralTracking } from '@/hooks/useReferralTracking';

const phoneRegex = /^(\+225)?[0-9]{8,10}$/;

const signInSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Format de téléphone invalide (+225XXXXXXXX)'),
  countryCode: z.string().default('+225'),
});

const signUpSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  birthday: z.string().optional(),
  city: z.string().min(1, 'La ville est requise').optional(),
  phone: z.string().regex(phoneRegex, 'Format de téléphone invalide (+225XXXXXXXX)'),
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
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [currentPhone, setCurrentPhone] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackReferralEvent, getActiveReferralCode, setActiveReferralCode } = useReferralTracking();

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { countryCode: '+225' }
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { countryCode: '+225' }
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      handleSmartRedirect(user, navigate);
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
      setCountdown(60);
      toast({
        title: 'Code envoyé',
        description: 'Un code de vérification a été envoyé par SMS',
      });
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

  const sendOtpSignUp = async (data: SignUpFormData) => {
    try {
      setIsLoading(true);
      const fullPhone = `${data.countryCode}${data.phone}`;
      
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
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setCurrentPhone(fullPhone);
      setOtpSent(true);
      setAuthMode('signup');
      setCountdown(60);
      toast({
        title: 'Code envoyé',
        description: 'Un code de vérification a été envoyé par SMS',
      });
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

  const verifyOtp = async (data: OtpFormData) => {
    try {
      setIsLoading(true);
      
      const { data: authData, error } = await supabase.auth.verifyOtp({
        phone: currentPhone,
        token: data.otp,
        type: 'sms',
      });

      if (error) {
        toast({
          title: 'Code invalide',
          description: 'Le code saisi est incorrect ou expiré',
          variant: 'destructive',
        });
        return;
      }

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

  const resendOtp = async () => {
    if (countdown > 0) return;
    
    try {
      setIsLoading(true);
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

      setCountdown(60);
      toast({
        title: 'Code renvoyé',
        description: 'Un nouveau code a été envoyé par SMS',
      });
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

  const resetOtpFlow = () => {
    setOtpSent(false);
    setCurrentPhone('');
    setCountdown(0);
    otpForm.reset();
  };

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
            onClick={() => navigate('/business-auth')}
            className="mt-2 text-sm"
          >
            <Store className="h-4 w-4 mr-2" />
            Espace Business
          </Button>
        </CardHeader>
        <CardContent>
          {!otpSent ? (
            <Tabs defaultValue="signin" onValueChange={(value) => setAuthMode(value as 'signin' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={signInForm.handleSubmit(sendOtpSignIn)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-phone">Numéro de téléphone</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={signInForm.watch('countryCode')} 
                        onValueChange={(value) => signInForm.setValue('countryCode', value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+225">🇨🇮 +225</SelectItem>
                          <SelectItem value="+33">🇫🇷 +33</SelectItem>
                          <SelectItem value="+1">🇺🇸 +1</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="signin-phone"
                        type="tel"
                        placeholder="01234567"
                        {...signInForm.register('phone')}
                        className="flex-1"
                      />
                    </div>
                    {signInForm.formState.errors.phone && (
                      <p className="text-sm text-destructive">{signInForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Envoi...' : 'Envoyer le code'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={signUpForm.handleSubmit(sendOtpSignUp)} className="space-y-4">
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
                      <Label htmlFor="city">Ville ou quartier</Label>
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
                    <Label htmlFor="signup-phone">Numéro de téléphone</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={signUpForm.watch('countryCode')} 
                        onValueChange={(value) => signUpForm.setValue('countryCode', value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+225">🇨🇮 +225</SelectItem>
                          <SelectItem value="+33">🇫🇷 +33</SelectItem>
                          <SelectItem value="+1">🇺🇸 +1</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="01234567"
                        {...signUpForm.register('phone')}
                        className="flex-1"
                      />
                    </div>
                    {signUpForm.formState.errors.phone && (
                      <p className="text-sm text-destructive">{signUpForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Envoi...' : 'Envoyer le code'}
                  </Button>
                </form>
              </TabsContent>
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
    </div>
  );
};

export default Auth;