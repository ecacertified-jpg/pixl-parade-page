import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Loader2, Users, Search, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMyFriends } from '@/hooks/useMyFriends';

interface FriendFund {
  id: string;
  title: string;
  description: string | null;
  current_amount: number;
  target_amount: number;
  occasion: string | null;
  creator_id: string;
  creator_name?: string | null;
  creator_avatar?: string | null;
}

interface FriendsFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FriendsFundsModal({ isOpen, onClose }: FriendsFundsModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { friends } = useMyFriends();
  const [funds, setFunds] = useState<FriendFund[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    const friendIds = friends.map((f) => f.user_id);
    if (friendIds.length === 0) {
      setFunds([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('collective_funds')
          .select('id, title, description, current_amount, target_amount, occasion, creator_id')
          .in('creator_id', friendIds)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;

        const items = (data || []) as FriendFund[];
        // enrich with creator info from friends list
        const enriched = items.map((f) => {
          const c = friends.find((x) => x.user_id === f.creator_id);
          return {
            ...f,
            creator_name: c?.first_name || null,
            creator_avatar: c?.avatar_url || null,
          };
        });
        if (!cancelled) setFunds(enriched);
      } catch (err) {
        console.error('FriendsFundsModal load error', err);
        if (!cancelled) setFunds([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, user, friends]);

  const handleContribute = (fundId: string) => {
    onClose();
    navigate(`/f/${fundId}`);
  };

  const formatAmount = (n: number) => new Intl.NumberFormat('fr-FR').format(n || 0);
  const progressPercent = (f: FriendFund) =>
    !f.target_amount ? 0 : Math.min(100, Math.round((f.current_amount / f.target_amount) * 100));

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-poppins flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Cagnottes de mes amis
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Toutes les cagnottes créées par tes amis auxquelles tu peux contribuer.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {!loading && funds.length === 0 && (
            <div className="text-center py-8 space-y-3">
              <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {friends.length === 0
                  ? "Ajoute d'abord des amis pour voir leurs cagnottes."
                  : "Aucune cagnotte active pour le moment chez tes amis."}
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    navigate('/shop');
                  }}
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  Parcourir la boutique
                </Button>
              </div>
            </div>
          )}

          {!loading &&
            funds.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleContribute(f.id)}
                className="w-full text-left rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-md transition-all p-4"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={f.creator_avatar || undefined} alt={f.creator_name || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {(f.creator_name || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-foreground truncate">{f.title}</p>
                      {f.occasion && (
                        <Badge variant="secondary" className="text-[10px]">
                          {f.occasion}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      par {f.creator_name || 'Un(e) ami(e)'}
                    </p>
                    {f.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {f.description}
                      </p>
                    )}
                    <div className="mt-2 space-y-1">
                      <Progress value={progressPercent(f)} className="h-1.5" />
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-semibold text-primary">
                          {formatAmount(f.current_amount)} XOF
                        </span>
                        <span>/ {formatAmount(f.target_amount)} XOF</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}