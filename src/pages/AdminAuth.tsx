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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';

const adminLoginSchema = z.object({
  email: z.string().email('Email invalide').max(255, 'Email trop long'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères').max(100, 'Mot de passe trop long'),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

const AdminAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const form = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  });

  // Check if user is already logged in and is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('role, is_active')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminData?.is_active) {
          navigate('/admin');
        } else {
          // L'utilisateur est connecté mais n'est pas admin → Déconnecter
          await supabase.auth.signOut();
          toast({
            title: 'Accès refusé',
            description: 'Ce compte n\'a pas les privilèges administrateur',
            variant: 'destructive',
          });
        }
      }
    };
    
    checkAdminStatus();
  }, [user, navigate, toast]);

  const signInWithGoogle = async () => {
    try {
      setIsGoogleLoading(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin-auth`,
        },
      });

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: AdminLoginFormData) => {
    try {
      setIsLoading(true);

      // Sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        toast({
          title: 'Erreur de connexion',
          description: authError.message === 'Invalid login credentials' 
            ? 'Email ou mot de passe incorrect' 
            : authError.message,
          variant: 'destructive',
        });
        return;
      }

      if (!authData.user) {
        toast({
          title: 'Erreur',
          description: 'Utilisateur non trouvé',
          variant: 'destructive',
        });
        return;
      }

      // Check if user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('role, is_active')
        .eq('user_id', authData.user.id)
        .single();

      if (adminError || !adminData) {
        // Sign out if not admin
        await supabase.auth.signOut();
        toast({
          title: 'Accès refusé',
          description: 'Ce compte n\'a pas les privilèges administrateur',
          variant: 'destructive',
        });
        return;
      }

      if (!adminData.is_active) {
        await supabase.auth.signOut();
        toast({
          title: 'Compte désactivé',
          description: 'Votre compte administrateur a été désactivé',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Connexion réussie',
        description: `Bienvenue, vous êtes connecté en tant que ${adminData.role === 'super_admin' ? 'Super Admin' : 'Modérateur'}`,
      });

      navigate('/admin');
    } catch (error) {
      console.error('Admin login error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Administration</CardTitle>
          <CardDescription className="text-slate-400">
            Connexion réservée aux administrateurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                {...form.register('email')}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                autoComplete="email"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...form.register('password')}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90" 
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-2 text-slate-400">ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-slate-600 text-slate-200 hover:bg-slate-700"
            onClick={signInWithGoogle}
            disabled={isGoogleLoading || isLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Se connecter avec Google
          </Button>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/auth')}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la connexion utilisateur
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuth;
