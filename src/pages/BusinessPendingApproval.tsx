import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, ArrowLeft, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const BusinessPendingApproval = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Check if account has been approved
    const checkApprovalStatus = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('business_accounts')
        .select('is_active')
        .eq('user_id', user.id)
        .single();

      if (data?.is_active) {
        // Account has been approved, redirect to business account
        navigate('/business-account', { replace: true });
      }
    };

    checkApprovalStatus();

    // Set up real-time subscription to check for approval
    const channel = supabase
      .channel('business-approval')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'business_accounts',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          if (payload.new.is_active) {
            navigate('/business-account', { replace: true });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

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
          {/* Process Steps */}
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

          {/* Info Card */}
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

          {/* Contact Info */}
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

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil client
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="secondary"
              className="flex-1"
            >
              Actualiser le statut
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessPendingApproval;
