import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Gift, User, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { processAdminAutoAssign } from '@/utils/adminAutoAssign';
import logoJv from '@/assets/logo-jv.svg';

const JoinAdmin = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showChoice, setShowChoice] = useState(false);

  useEffect(() => {
    if (!code) { setError(true); setLoading(false); return; }

    const process = async () => {
      // Verify code exists
      const { data, error: fetchError } = await supabase
        .from('admin_share_codes')
        .select('code')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError || !data) {
        setError(true);
        setLoading(false);
        return;
      }

      // Increment clicks
      await supabase.rpc('increment_share_code_stat', { p_code: code, p_field: 'clicks_count' });

      // Store in sessionStorage
      sessionStorage.setItem('jdv_admin_ref', code);

      // Check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // User already authenticated → assign directly and redirect to dashboard
        await processAdminAutoAssign(session.user.id);
        navigate('/dashboard', { replace: true });
      } else {
        // Not logged in → show choice screen
        setLoading(false);
        setShowChoice(true);
      }
    };

    process();
  }, [code, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <Gift className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-semibold font-poppins">Lien invalide</h1>
          <p className="text-muted-foreground">
            Ce lien de partage n'existe pas ou n'est plus actif.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/auth')}>S'inscrire</Button>
            <Button variant="outline" onClick={() => navigate('/business-auth')}>
              Espace entreprise
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Vérification en cours...</p>
        </div>
      </div>
    );
  }

  if (showChoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo & Welcome */}
          <div className="text-center space-y-3">
            <img src={logoJv} alt="Joie de Vivre" className="h-16 w-16 mx-auto" />
            <h1 className="text-2xl font-semibold font-poppins text-foreground">
              Bienvenue sur JOIE DE VIVRE
            </h1>
            <p className="text-muted-foreground text-sm">
              Vous avez été invité(e) à rejoindre la plateforme. Comment souhaitez-vous vous inscrire ?
            </p>
          </div>

          {/* Choice Cards */}
          <div className="grid gap-4">
            <Card
              className="p-6 cursor-pointer hover:shadow-soft transition-all duration-200 hover:scale-[1.02] border-2 border-transparent hover:border-primary/30"
              onClick={() => navigate(`/auth?admin_ref=${code}`)}
            >
              <div className="flex items-center gap-4">
                <div className="bg-secondary w-14 h-14 rounded-2xl flex items-center justify-center shrink-0">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground font-poppins">Je suis un client</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Offrez des cadeaux à vos proches et célébrez les moments heureux
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className="p-6 cursor-pointer hover:shadow-soft transition-all duration-200 hover:scale-[1.02] border-2 border-transparent hover:border-primary/30"
              onClick={() => navigate(`/business-auth?admin_ref=${code}&tab=signup`)}
            >
              <div className="flex items-center gap-4">
                <div className="bg-accent/20 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0">
                  <Store className="h-7 w-7 text-accent" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground font-poppins">Je suis un prestataire</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Vendez vos produits et services sur la plateforme
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default JoinAdmin;
