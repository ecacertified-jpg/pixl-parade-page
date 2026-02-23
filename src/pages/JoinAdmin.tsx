import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

const JoinAdmin = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) { setError(true); return; }

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
        return;
      }

      // Increment clicks
      await supabase.rpc('increment_share_code_stat', { p_code: code, p_field: 'clicks_count' });

      // Store in sessionStorage
      sessionStorage.setItem('jdv_admin_ref', code);

      // Redirect to auth with admin_ref param
      navigate(`/auth?admin_ref=${code}`, { replace: true });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Redirection en cours...</p>
      </div>
    </div>
  );
};

export default JoinAdmin;
