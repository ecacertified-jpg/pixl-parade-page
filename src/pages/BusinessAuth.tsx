import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Store, ArrowLeft, Mail, RefreshCw, Eye, EyeOff, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';

const businessAuthSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  firstName: z.string().min(1, 'Le prénom est requis').optional(),
  lastName: z.string().min(1, 'Le nom est requis').optional(),
  businessName: z.string().min(1, 'Le nom de l\'entreprise est requis').optional(),
  businessType: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
});

type BusinessAuthFormData = z.infer<typeof businessAuthSchema>;

const BusinessAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [businessNameError, setBusinessNameError] = useState<string | null>(null);
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [showCompleteRegistration, setShowCompleteRegistration] = useState(false);
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);
  const [authenticatedEmail, setAuthenticatedEmail] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [recoverySession, setRecoverySession] = useState<Session | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUserMode, refreshSession } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<BusinessAuthFormData>({
    resolver: zodResolver(businessAuthSchema),
  });

  const businessType = watch('businessType');

  // Detect PASSWORD_RECOVERY event for password reset
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, 'Has session:', !!session);
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('PASSWORD_RECOVERY event detected');
        setIsResetMode(true);
        setRecoverySession(session);
      }
    });

    // Check if coming from reset link with reset=true param
    const resetParam = searchParams.get('reset');
    if (resetParam === 'true') {
      // Vérifier si on a déjà une session active
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('Reset param detected, current session:', !!session);
        if (session) {
          setIsResetMode(true);
          setRecoverySession(session);
        }
      });
    }

    return () => subscription.unsubscribe();
  }, [searchParams]);

  // Redirect based on business account status (only if not in reset mode)
  useEffect(() => {
    if (user && !isResetMode) {
      checkExistingBusinessAccount();
    }
  }, [user, navigate, isResetMode]);

  const checkExistingBusinessAccount = async () => {
    if (!user) return;
    
    try {
      // Récupérer TOUS les comptes business de l'utilisateur
      const { data: businessAccounts, error } = await supabase
        .from('business_accounts')
        .select('id, is_active, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error checking business account:', error);
        return;
      }

      if (businessAccounts && businessAccounts.length > 0) {
        // Trouver le compte actif ou le plus récent en attente
        const activeAccount = businessAccounts.find(acc => acc.is_active);
        const pendingAccount = businessAccounts.find(acc => acc.status === 'pending' || acc.status === 'resubmitted');
        
        if (activeAccount) {
          navigate('/business-account', { replace: true });
        } else if (pendingAccount) {
          navigate('/business-pending-approval', { replace: true });
        } else {
          // Tous les comptes sont rejetés/inactifs, rediriger vers le dashboard business
          navigate('/business-account', { replace: true });
        }
      }
      // Si aucun compte, laisser afficher le formulaire
    } catch (error) {
      console.error('Error checking business account:', error);
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
        .in('status', ['pending', 'active', 'resubmitted'])
        .limit(1);

      if (error) {
        console.error('Error checking business name:', error);
        return true; // Allow submission if check fails
      }

      if (data && data.length > 0) {
        setBusinessNameError('Ce nom d\'entreprise est déjà utilisé. Veuillez en choisir un autre.');
        return false;
      }

      setBusinessNameError(null);
      return true;
    } catch (error) {
      console.error('Error checking business name:', error);
      return true; // Allow submission if check fails
    }
  };

  const signIn = async (data: BusinessAuthFormData) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Erreur de connexion',
            description: 'Email ou mot de passe incorrect',
            variant: 'destructive',
          });
        } else if (error.message.includes('Email not confirmed')) {
          setShowResendButton(true);
          setResendEmail(data.email);
          toast({
            title: 'Email non confirmé',
            description: 'Veuillez confirmer votre email. Vous pouvez demander un nouvel email de confirmation ci-dessous.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erreur',
            description: error.message,
            variant: 'destructive',
          });
        }
        return;
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer les informations utilisateur',
          variant: 'destructive',
        });
        return;
      }

      // Check if there's a pending registration to process (email just verified)
      const newBusinessId = await processPendingRegistration(currentUser.id);
      
      if (newBusinessId) {
        toast({
          title: 'Compte créé avec succès',
          description: 'Votre email a été vérifié. Votre compte est maintenant en attente d\'approbation.',
        });
        setUserMode('business');
        navigate('/business-pending-approval', { replace: true });
        return;
      }

      // Check if business account exists - gérer plusieurs comptes
      const { data: businessAccounts, error: businessError } = await supabase
        .from('business_accounts')
        .select('is_active, status')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (businessError || !businessAccounts || businessAccounts.length === 0) {
        // Pas de compte business - proposer d'en créer un
        setAuthenticatedUserId(currentUser.id);
        setAuthenticatedEmail(currentUser.email || null);
        setShowCompleteRegistration(true);
        toast({
          title: 'Inscription incomplète',
          description: 'Votre compte existe mais l\'inscription business n\'est pas terminée. Veuillez la compléter ci-dessous.',
        });
        return;
      }

      // L'utilisateur a au moins un compte business - trouver le bon
      const activeAccount = businessAccounts.find(acc => acc.is_active);
      const pendingAccount = businessAccounts.find(acc => acc.status === 'pending' || acc.status === 'resubmitted');

      setUserMode('business');
      
      if (activeAccount) {
        toast({
          title: 'Connexion réussie',
          description: 'Bienvenue dans votre espace business',
        });
        navigate('/business-account', { replace: true });
      } else if (pendingAccount) {
        toast({
          title: 'Compte en attente',
          description: 'Votre compte est en attente d\'approbation',
        });
        navigate('/business-pending-approval', { replace: true });
      } else {
        // Comptes rejetés/inactifs - aller au dashboard pour voir le statut
        navigate('/business-account', { replace: true });
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

  const resendConfirmationEmail = async () => {
    if (!resendEmail) return;
    
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/business-auth`
        }
      });
      
      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Email envoyé',
          description: 'Un nouvel email de confirmation a été envoyé. Vérifiez votre boîte de réception.',
        });
        setShowResendButton(false);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer l\'email de confirmation',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  const sendPasswordResetEmail = async () => {
    if (!forgotPasswordEmail.trim()) {
      toast({
        title: 'Email requis',
        description: 'Veuillez entrer votre email pour réinitialiser votre mot de passe.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/business-auth?reset=true`,
      });

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Email envoyé',
          description: 'Un email de réinitialisation vous a été envoyé. Vérifiez votre boîte de réception.',
        });
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer l\'email de réinitialisation.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const updatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir les deux champs de mot de passe.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Mots de passe différents',
        description: 'Les deux mots de passe ne correspondent pas.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Mot de passe trop court',
        description: 'Le mot de passe doit contenir au moins 6 caractères.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // Vérifier qu'on a une session active
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && !recoverySession) {
        toast({
          title: 'Session expirée',
          description: 'Le lien de réinitialisation a expiré. Veuillez en demander un nouveau.',
          variant: 'destructive',
        });
        setIsResetMode(false);
        setRecoverySession(null);
        setShowForgotPassword(true);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        console.error('Password update error:', error);
        
        if (error.message.includes('session') || error.message.includes('Auth') || error.message.includes('missing')) {
          toast({
            title: 'Session expirée',
            description: 'Le lien a expiré. Veuillez demander un nouveau lien de réinitialisation.',
            variant: 'destructive',
          });
          setIsResetMode(false);
          setRecoverySession(null);
          setShowForgotPassword(true);
        } else {
          toast({
            title: 'Erreur',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Mot de passe modifié ✓',
          description: 'Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter.',
        });
        setIsResetMode(false);
        setNewPassword('');
        setConfirmPassword('');
        setRecoverySession(null);
        navigate('/business-auth', { replace: true });
      }
    } catch (error) {
      console.error('Password update exception:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le mot de passe. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const processPendingRegistration = async (userId: string) => {
    try {
      const { data: businessId, error } = await supabase.rpc('process_pending_business_registration', {
        p_user_id: userId
      });
      
      if (error) {
        console.error('Error processing pending registration:', error);
        return null;
      }
      
      return businessId;
    } catch (error) {
      console.error('Error processing pending registration:', error);
      return null;
    }
  };

  const signUp = async (data: BusinessAuthFormData) => {
    try {
      setIsLoading(true);

      // Vérifier l'unicité du nom d'entreprise avant de créer le compte
      const isUnique = await checkBusinessNameUniqueness(data.businessName || '');
      if (!isUnique) {
        setIsLoading(false);
        toast({
          title: 'Nom d\'entreprise déjà utilisé',
          description: 'Ce nom d\'entreprise est déjà enregistré. Veuillez en choisir un autre.',
          variant: 'destructive',
        });
        return;
      }

      const redirectUrl = `${window.location.origin}/business-auth`;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            is_business: true,
            pending_business_name: data.businessName,
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: 'Compte existant',
            description: 'Un compte avec cet email existe déjà. Essayez de vous connecter.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erreur',
            description: error.message,
            variant: 'destructive',
          });
        }
        return;
      }

      // Si l'utilisateur est créé mais sans session (confirmation email requise)
      if (authData.user && !authData.session) {
        // Store pending registration data for after email verification
        const { error: pendingError } = await supabase
          .from('pending_business_registrations')
          .insert({
            user_id: authData.user.id,
            email: data.email,
            business_name: data.businessName || '',
            business_type: data.businessType || null,
            phone: data.phone || null,
            address: data.address || null,
            description: data.description || null,
            first_name: data.firstName || null,
            last_name: data.lastName || null,
          });

        if (pendingError) {
          console.error('Error storing pending registration:', pendingError);
          // Still show success message since the auth account was created
        }

        toast({
          title: 'Vérifiez votre email',
          description: 'Un email de confirmation a été envoyé. Confirmez votre email pour finaliser votre inscription.',
        });
        navigate('/business-pending-approval', { replace: true });
        return;
      }

      // Si une session est retournée (email confirmation disabled), créer directement le compte
      if (authData.user && authData.session) {
        try {
          await supabase.auth.setSession({
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
          });

          const { error: businessError } = await supabase
            .from('business_accounts')
            .insert({
              user_id: authData.user.id,
              business_name: data.businessName || '',
              business_type: data.businessType || '',
              phone: data.phone || '',
              address: data.address || '',
              description: data.description || '',
              email: data.email,
              is_active: false,
              status: 'pending',
            });

          if (businessError) {
            console.error('Error creating business account:', businessError);
            
            if (businessError.code === '42501' || businessError.message?.includes('row-level security') || businessError.message?.includes('RLS')) {
              toast({
                title: 'Erreur de sécurité',
                description: 'Votre session n\'est pas correctement authentifiée. Veuillez vous déconnecter et réessayer.',
                variant: 'destructive',
              });
            } else if (businessError.code === '23505' || businessError.message?.includes('duplicate')) {
              toast({
                title: 'Compte déjà existant',
                description: 'Un compte prestataire existe déjà pour cet utilisateur.',
                variant: 'destructive',
              });
            } else if (businessError.code === '23503') {
              toast({
                title: 'Erreur de référence',
                description: 'Les données de référence sont invalides. Veuillez réessayer.',
                variant: 'destructive',
              });
            } else {
              toast({
                title: 'Erreur de création',
                description: `Impossible de créer le compte prestataire: ${businessError.message || 'Erreur inconnue'}`,
                variant: 'destructive',
              });
            }
            return;
          }

          // Notify admins
          const { data: admins } = await supabase
            .from('admin_users')
            .select('user_id')
            .eq('is_active', true);

          if (admins && admins.length > 0) {
            const notifications = admins.map(admin => ({
              user_id: admin.user_id,
              notification_type: 'new_business_pending_approval',
              title: '🏪 Nouveau prestataire en attente',
              message: `${data.businessName || 'Un nouveau prestataire'} vient de s'inscrire et attend votre approbation`,
              scheduled_for: new Date().toISOString(),
              delivery_methods: ['push', 'in_app'],
              metadata: {
                business_name: data.businessName,
                business_type: data.businessType,
                business_user_id: authData.user.id,
                action_url: '/admin/businesses',
              }
            }));
            
            await supabase.from('scheduled_notifications').insert(notifications);
          }

          setUserMode('business');
          await refreshSession();
        } catch (businessCreationError) {
          console.error('Error creating business account:', businessCreationError);
          toast({
            title: 'Erreur',
            description: 'Une erreur s\'est produite lors de la création du compte.',
            variant: 'destructive',
          });
          return;
        }
      }

      toast({
        title: 'Inscription soumise',
        description: 'Votre compte est en attente d\'approbation par l\'équipe JOIE DE VIVRE',
      });
      
      navigate('/business-pending-approval', { replace: true });
      reset();
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

  const completeBusinessRegistration = async (formData: BusinessAuthFormData) => {
    if (!authenticatedUserId) return;
    
    setIsLoading(true);
    try {
      // Vérifier l'unicité du nom d'entreprise
      const isUnique = await checkBusinessNameUniqueness(formData.businessName || '');
      if (!isUnique) {
        setIsLoading(false);
        return;
      }

      const { error: businessError } = await supabase
        .from('business_accounts')
        .insert({
          user_id: authenticatedUserId,
          business_name: formData.businessName || '',
          business_type: formData.businessType || '',
          phone: formData.phone || '',
          address: formData.address || '',
          description: formData.description || '',
          email: authenticatedEmail,
          is_active: false,
          status: 'pending',
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

      // Notify admins
      const { data: admins } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('is_active', true);

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.user_id,
          notification_type: 'new_business_pending_approval',
          title: '🏪 Nouveau prestataire en attente',
          message: `${formData.businessName || 'Un nouveau prestataire'} vient de s'inscrire et attend votre approbation`,
          scheduled_for: new Date().toISOString(),
          delivery_methods: ['push', 'in_app'],
          metadata: {
            business_name: formData.businessName,
            business_type: formData.businessType,
            business_user_id: authenticatedUserId,
            action_url: '/admin/businesses',
          }
        }));
        
        await supabase.from('scheduled_notifications').insert(notifications);
      }

      setUserMode('business');
      toast({
        title: 'Inscription complétée',
        description: 'Votre compte business est maintenant en attente d\'approbation',
      });
      navigate('/business-pending-approval', { replace: true });
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

  // If in reset mode, show the password reset form
  if (isResetMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
        <Card className="w-full max-w-md shadow-lg border-primary/20">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <KeyRound className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-poppins font-bold text-primary">
                Nouveau mot de passe
              </CardTitle>
            </div>
            <CardDescription>
              Choisissez un nouveau mot de passe pour votre compte business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            
            {!recoverySession && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <p className="font-medium">⚠️ Session de récupération non détectée</p>
                <p className="mt-1">Si vous rencontrez une erreur, demandez un nouveau lien de réinitialisation.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={() => {
                    setIsResetMode(false);
                    setRecoverySession(null);
                    setShowForgotPassword(true);
                    navigate('/business-auth', { replace: true });
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Demander un nouveau lien
                </Button>
              </div>
            )}

            <Button
              onClick={updatePassword}
              disabled={isUpdatingPassword}
              className="w-full"
            >
              {isUpdatingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsResetMode(false);
                setNewPassword('');
                setConfirmPassword('');
                setRecoverySession(null);
                navigate('/business-auth', { replace: true });
              }}
              className="w-full text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            
            <TabsContent value="signin">
              <form onSubmit={handleSubmit(signIn)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@business-email.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                {/* Mot de passe oublié */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(!showForgotPassword)}
                    className="text-sm text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                {showForgotPassword && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-800">
                          Réinitialiser votre mot de passe
                        </p>
                        <p className="text-sm text-blue-700">
                          Entrez votre email et nous vous enverrons un lien de réinitialisation.
                        </p>
                      </div>
                    </div>
                    <Input
                      type="email"
                      placeholder="votre@business-email.com"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="bg-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={sendPasswordResetEmail}
                      disabled={isSendingReset}
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Mail className={cn("h-4 w-4 mr-2", isSendingReset && "animate-pulse")} />
                      {isSendingReset ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                    </Button>
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </Button>

                {showResendButton && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Mail className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-amber-800">
                          Email non confirmé
                        </p>
                        <p className="text-sm text-amber-700">
                          Votre email n'a pas encore été confirmé. Vérifiez votre boîte de réception ou demandez un nouvel email.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resendConfirmationEmail}
                      disabled={isResending}
                      className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-2", isResending && "animate-spin")} />
                      {isResending ? 'Envoi en cours...' : 'Renvoyer l\'email de confirmation'}
                    </Button>
                  </div>
                )}

                {showCompleteRegistration && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-start gap-2">
                      <Store className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-800">
                          Complétez votre inscription business
                        </p>
                        <p className="text-sm text-blue-700">
                          Votre compte utilisateur existe ({authenticatedEmail}), mais l'inscription business n'est pas terminée.
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="complete-businessName">Nom de l'entreprise *</Label>
                        <Input
                          id="complete-businessName"
                          placeholder="Mon Enterprise SARL"
                          {...register('businessName')}
                          onBlur={(e) => checkBusinessNameUniqueness(e.target.value)}
                        />
                        {businessNameError && (
                          <p className="text-sm text-destructive">{businessNameError}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="complete-businessType">Type d'activité</Label>
                        <Select onValueChange={(value) => setValue('businessType', value)}>
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
                        <Label htmlFor="complete-phone">Téléphone</Label>
                        <Input
                          id="complete-phone"
                          placeholder="+225 XX XX XX XX XX"
                          {...register('phone')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="complete-address">Adresse</Label>
                        <Input
                          id="complete-address"
                          placeholder="Cocody, Abidjan"
                          {...register('address')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="complete-description">Description</Label>
                        <Textarea
                          id="complete-description"
                          placeholder="Décrivez votre activité..."
                          rows={2}
                          {...register('description')}
                        />
                      </div>

                      <Button
                        type="button"
                        className="w-full"
                        onClick={handleSubmit(completeBusinessRegistration)}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Création...' : 'Compléter mon inscription'}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSubmit(signUp)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      placeholder="Prénom"
                      {...register('firstName')}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      placeholder="Nom"
                      {...register('lastName')}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessName">Nom de l'entreprise *</Label>
                  <Input
                    id="businessName"
                    placeholder="Mon Enterprise SARL"
                    {...register('businessName')}
                    onBlur={(e) => checkBusinessNameUniqueness(e.target.value)}
                  />
                  {errors.businessName && (
                    <p className="text-sm text-destructive">{errors.businessName.message}</p>
                  )}
                  {businessNameError && (
                    <p className="text-sm text-destructive">{businessNameError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">Type d'activité</Label>
                  <Select onValueChange={(value) => setValue('businessType', value)}>
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
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    placeholder="+225 XX XX XX XX XX"
                    {...register('phone')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    placeholder="Cocody, Abidjan"
                    {...register('address')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optionnel)</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre activité..."
                    rows={3}
                    {...register('description')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@business-email.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Création...' : 'Créer mon compte business'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessAuth;