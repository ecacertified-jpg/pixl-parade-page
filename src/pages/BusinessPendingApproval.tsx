import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, ArrowLeft, Phone, Mail, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ResubmitBusinessForm } from '@/components/ResubmitBusinessForm';
import { toast } from 'sonner';

interface BusinessAccount {
  id: string;
  is_active: boolean;
  status: string;
  rejection_reason: string | null;
  rejection_date: string | null;
  business_name: string;
  business_type: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  email: string | null;
  corrections_message: string | null;
}

const BusinessPendingApproval = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [businessAccount, setBusinessAccount] = useState<BusinessAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [noAccountFound, setNoAccountFound] = useState(false);
  const [isRelinking, setIsRelinking] = useState(false);

  // Try to link business account by email (if mismatch exists)
  const tryRelinkAccount = useCallback(async () => {
    if (!user) return null;
    
    setIsRelinking(true);
    console.log('🔗 Attempting to relink business account by email...');
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.log('❌ No active session for relinking');
        return null;
      }

      const { data, error } = await supabase.functions.invoke('link-business-account-to-user', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });

      if (error) {
        console.error('Error invoking link-business-account-to-user:', error);
        return null;
      }

      console.log('🔗 Link result:', data);
      return data;
    } catch (err) {
      console.error('Exception during relinking:', err);
      return null;
    } finally {
      setIsRelinking(false);
    }
  }, [user]);

  // Handle manual refresh button click
  const handleRefreshStatus = async () => {
    const linkResult = await tryRelinkAccount();
    
    if (linkResult?.linked) {
      // Re-fetch after linking
      const { data } = await supabase
        .from('business_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setBusinessAccount(data);
        if ((data.status === 'approved' || data.status === 'active') && data.is_active !== false) {
          toast.success('Votre compte a été approuvé !');
          navigate('/business-account', { replace: true });
          return;
        }
      }
    }
    
    // Also try direct fetch
    await fetchBusinessAccount();
    toast.info('Statut mis à jour');
  };

  const fetchBusinessAccount = async () => {
    if (!user) {
      navigate('/business-auth', { replace: true });
      return;
    }

    try {
      setLoading(true);
      console.log('📋 Fetching business account for user:', user.id);
      
      // Use order + limit to avoid "multiple rows" error with maybeSingle
      const { data, error } = await supabase
        .from('business_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching business account:', error);
        toast.error('Erreur lors de la récupération du compte');
        navigate('/business-auth', { replace: true });
        return;
      }

      console.log('📋 Fetch result:', data);

      // If no data found by user_id, or if data is not approved/active, try relinking
      if (!data || (data.status !== 'approved' && data.status !== 'active')) {
        console.log('🔗 No approved account found by user_id, attempting relink...');
        const linkResult = await tryRelinkAccount();
        
        if (linkResult?.linked && !linkResult?.already_linked) {
          console.log('🔗 Relink successful, re-fetching...');
          // Re-fetch after successful linking
          const { data: relinkedData } = await supabase
            .from('business_accounts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (relinkedData) {
            if ((relinkedData.status === 'approved' || relinkedData.status === 'active') && relinkedData.is_active) {
              toast.success('Votre compte a été approuvé !');
              navigate('/business-account', { replace: true });
              return;
            }
            setBusinessAccount(relinkedData);
            setLoading(false);
            return;
          }
        } else if (linkResult?.linked && linkResult?.already_linked) {
          // Check the status from the link result
          if ((linkResult.status === 'approved' || linkResult.status === 'active') && linkResult.is_active !== false) {
            toast.success('Votre compte a été approuvé !');
            navigate('/business-account', { replace: true });
            return;
          }
        }
      }

      // If no business account exists for this user
      if (!data) {
        setNoAccountFound(true);
        setLoading(false);
        return;
      }

      // If the account is approved or active, redirect to dashboard
      if ((data.status === 'approved' || data.status === 'active') && data.is_active) {
        navigate('/business-account', { replace: true });
        return;
      }

      setBusinessAccount(data);
    } catch (error) {
      console.error('Error fetching business account:', error);
      toast.error('Erreur lors de la récupération du compte');
      navigate('/business-auth', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/business-auth', { replace: true });
      return;
    }
    
    fetchBusinessAccount();

    // Set up real-time subscription only if user exists
    const channel = supabase
      .channel('business-approval')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'business_accounts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as BusinessAccount;
          // Accept both 'approved' and 'active' status for immediate redirection
          if ((newData.status === 'approved' || newData.status === 'active') && newData.is_active) {
            toast.success('Votre compte a été approuvé !');
            navigate('/business-account', { replace: true });
          } else {
            setBusinessAccount(newData);
            setNoAccountFound(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no business account found, show message with option to create one
  if (noAccountFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-16 w-16 text-amber-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Aucun compte prestataire trouvé</CardTitle>
            <CardDescription className="text-base mt-2">
              Vous n'avez pas encore de compte prestataire associé à ce profil.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Pour accéder à l'espace prestataire, vous devez d'abord créer un compte business.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate('/business-auth')}
                className="w-full"
              >
                Créer un compte prestataire
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If rejected, show resubmission form
  if (businessAccount?.status === 'rejected' && businessAccount?.rejection_reason) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>

          <ResubmitBusinessForm
            businessId={businessAccount.id}
            rejectionReason={businessAccount.rejection_reason}
            rejectionDate={businessAccount.rejection_date || new Date().toISOString()}
            initialData={{
              business_name: businessAccount.business_name,
              business_type: businessAccount.business_type,
              phone: businessAccount.phone,
              address: businessAccount.address,
              description: businessAccount.description,
              email: businessAccount.email,
            }}
            onSuccess={() => {
              fetchBusinessAccount();
            }}
          />
        </div>
      </div>
    );
  }

  // If resubmitted, show pending status with special message
  if (businessAccount?.status === 'resubmitted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Clock className="h-16 w-16 text-primary animate-pulse" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Demande réinscrite en cours d'examen</CardTitle>
            <CardDescription className="text-lg mt-2">
              Votre demande mise à jour est en cours de validation par l'équipe JOIE DE VIVRE
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-500">
                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-green-700 dark:text-green-400">Demande réinscrite</h3>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    Votre nouvelle demande avec corrections a été soumise avec succès
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-primary/10 rounded-lg border-2 border-primary">
                <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold">Validation en cours</h3>
                  <p className="text-sm text-muted-foreground">
                    Notre équipe examine votre demande réinscrite
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>Délai estimé :</strong> 24-48 heures
                  </p>
                </div>
              </div>
            </div>

            <Card className="bg-accent/5 border-accent">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-3">Corrections soumises :</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {businessAccount.corrections_message}
                </p>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1 w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil client
              </Button>
              <Button
                onClick={handleRefreshStatus}
                variant="secondary"
                className="flex-1 w-full sm:w-auto"
                disabled={isRelinking}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRelinking ? 'animate-spin' : ''}`} />
                {isRelinking ? 'Vérification...' : 'Mettre à jour mon statut'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default pending approval state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Clock className="h-16 w-16 text-primary animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Compte en attente d'approbation</CardTitle>
          <CardDescription className="text-lg mt-2">
            Votre compte business est en cours de validation par l'équipe JOIE DE VIVRE
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold">Inscription réussie</h3>
                <p className="text-sm text-muted-foreground">
                  Votre compte a été créé avec succès
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-primary/10 rounded-lg border-2 border-primary">
              <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold">Validation en cours</h3>
                <p className="text-sm text-muted-foreground">
                  Notre équipe vérifie vos informations
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong>Délai estimé :</strong> 24-48 heures
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg opacity-50">
              <CheckCircle className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold">Accès à Mon Espace Business</h3>
                <p className="text-sm text-muted-foreground">
                  Vous pourrez gérer vos produits et commandes
                </p>
              </div>
            </div>
          </div>

          <Card className="bg-accent/5 border-accent">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-3">Que se passe-t-il ensuite ?</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>Notre équipe examine votre demande d'inscription</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>Vous recevrez une notification dès que votre compte sera approuvé</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>Une fois approuvé, vous pourrez immédiatement accéder à votre espace business</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Des questions sur votre demande ?
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <a 
                href="tel:+2250000000000" 
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                Appelez-nous
              </a>
              <a 
                href="mailto:business@joiedevivre.com" 
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                Écrivez-nous
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="flex-1 w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil client
            </Button>
            <Button
              onClick={handleRefreshStatus}
              variant="secondary"
              className="flex-1 w-full sm:w-auto"
              disabled={isRelinking}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRelinking ? 'animate-spin' : ''}`} />
              {isRelinking ? 'Vérification...' : 'Mettre à jour mon statut'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessPendingApproval;
