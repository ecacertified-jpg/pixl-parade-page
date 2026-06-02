import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { ORGANIZER_ROLE_LABELS } from '@/types/organization';

const OrganizerAccept = () => {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      // Public select: invite_token is unique & secret. We rely on RLS allowing
      // owners/managers to see, plus user_id=auth.uid() once linked. Before link,
      // we need a service-side lookup — fallback: fetch minimal info via RPC-less
      // direct select using the anon row only after the user signs in & is linked.
      // V1 simple flow: require login first; then attempt acceptance via RPC.
      setLoading(false);
    })();
  }, [token]);

  const accept = async () => {
    if (!token || !user) {
      navigate(`/auth?redirect=/organisation/accept/${token}`);
      return;
    }
    setAccepting(true);
    // Link this invite to the current user (matches by token + status pending)
    // We use update; RLS allows owner only — so we need a server-side path.
    // V1: call an edge function for safety.
    const { data, error } = await supabase.functions.invoke('accept-organizer-invite', {
      body: { token },
    });
    setAccepting(false);
    if (error || !data?.success) {
      toast.error(data?.error ?? "Impossible d'accepter cette invitation");
      return;
    }
    toast.success('Bienvenue dans l\'équipe ! 🎉');
    const pageType = data.page_type;
    const slug = data.slug;
    navigate(pageType === 'birthday' ? `/birthday/${slug}` : `/event/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-6 rounded-2xl text-center space-y-4">
        <div className="text-5xl">💛</div>
        <h1 className="font-poppins text-xl font-semibold">Invitation à co-organiser</h1>
        <p className="text-sm text-muted-foreground font-nunito">
          Quelqu'un t'invite à rejoindre les coulisses d'une célébration sur Joie de Vivre.
        </p>
        <Button className="w-full" onClick={accept} disabled={accepting}>
          {accepting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {user ? 'Accepter et rejoindre' : 'Se connecter pour accepter'}
        </Button>
      </Card>
    </div>
  );
};

export default OrganizerAccept;