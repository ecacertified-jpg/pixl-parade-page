import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Store, ArrowLeft } from 'lucide-react';

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
  const { toast } = useToast();
  const navigate = useNavigate();
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

  // Redirect based on business account status
  useEffect(() => {
    if (user) {
      checkExistingBusinessAccount();
    }
  }, [user, navigate]);

  const checkExistingBusinessAccount = async () => {
    if (!user) return;
    
    try {
      const { data: businessAccount } = await supabase
        .from('business_accounts')
        .select('id, is_active')
        .eq('user_id', user.id)
        .single();

      if (businessAccount) {
        // Redirect based on approval status
        if (!businessAccount.is_active) {
          navigate('/business-pending-approval', { replace: true });
        } else {
          navigate('/business-account', { replace: true });
        }
      }
      // If no business account, let them access the form
    } catch (error) {
      // Error likely means no business account exists, which is fine
      console.log('No existing business account found, showing form');
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
        } else {
          toast({
            title: 'Erreur',
            description: error.message,
            variant: 'destructive',
          });
        }
        return;
      }

      // Check if account is approved
      const { data: businessAccount } = await supabase
        .from('business_accounts')
        .select('is_active')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      setUserMode('business');
      
      if (!businessAccount?.is_active) {
        toast({
          title: 'Compte en attente',
          description: 'Votre compte est en attente d\'approbation',
        });
        navigate('/business-pending-approval', { replace: true });
      } else {
        toast({
          title: 'Connexion réussie',
          description: 'Bienvenue dans votre espace business',
        });
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

      const redirectUrl = `${window.location.origin}/business-account`;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            is_business: true,
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
        toast({
          title: 'Vérifiez votre email',
          description: 'Un email de confirmation a été envoyé. Veuillez le confirmer pour activer votre compte.',
        });
        navigate('/business-pending-approval', { replace: true });
        return;
      }

      // Si une session est retournée, définir explicitement la session avant de créer le compte business
      if (authData.user && authData.session) {
        try {
          // Définir explicitement la nouvelle session pour que auth.uid() soit correct
          await supabase.auth.setSession({
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
          });

          // Maintenant créer le compte business avec la bonne session
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
              is_active: false, // Compte en attente d'approbation
              status: 'pending',
            });

          if (businessError) {
            console.error('Error creating business account:', businessError);
            
            // Detect RLS policy violation
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

          // Récupérer tous les admins actifs et leur envoyer une notification
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
      
      // Redirect to pending approval page
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
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </Button>
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