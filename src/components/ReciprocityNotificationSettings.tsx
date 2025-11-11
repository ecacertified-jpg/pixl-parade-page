import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Heart, TrendingUp, Users, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ReciprocityNotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifyOnFriendFund, setNotifyOnFriendFund] = useState(true);
  const [minReciprocityScore, setMinReciprocityScore] = useState(30);
  const [notifyHighPriority, setNotifyHighPriority] = useState(true);
  const [reciprocityScore, setReciprocityScore] = useState<number | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadPreferences();
      loadUserScore();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_reciprocity_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setNotifyOnFriendFund(data.notify_on_friend_fund ?? true);
        setMinReciprocityScore(data.min_reciprocity_score ?? 30);
        setNotifyHighPriority(data.notify_high_priority_only ?? true);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserScore = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('reciprocity_scores')
        .select('generosity_score')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setReciprocityScore(Number(data.generosity_score));
      }
    } catch (error) {
      console.error('Error loading user score:', error);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_reciprocity_preferences')
        .upsert({
          user_id: user.id,
          notify_on_friend_fund: notifyOnFriendFund,
          min_reciprocity_score: minReciprocityScore,
          notify_high_priority_only: notifyHighPriority,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Préférences enregistrées',
        description: 'Vos préférences de notification ont été mises à jour',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder vos préférences',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'outline';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Champion';
    if (score >= 60) return 'Généreux';
    if (score >= 40) return 'Contributeur';
    return 'Nouveau';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-16" />
          <Skeleton className="h-24" />
          <Skeleton className="h-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Notifications de Réciprocité
            </CardTitle>
            <CardDescription className="mt-2">
              Recevez des alertes intelligentes quand vos amis proches ont besoin d'aide
            </CardDescription>
          </div>
          {reciprocityScore !== null && (
            <Badge variant={getScoreBadgeVariant(reciprocityScore)} className="text-sm">
              <TrendingUp className="h-3 w-3 mr-1" />
              Score: {reciprocityScore.toFixed(0)}
              <span className="ml-1 text-xs">({getScoreLabel(reciprocityScore)})</span>
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Activer les notifications */}
        <div className="flex items-center justify-between space-x-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <Label htmlFor="notify-friend" className="font-medium">
                Notifications d'opportunités
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Recevez une notification quand un ami avec qui vous avez un bon historique
                      d'échange crée une nouvelle cagnotte
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">
              Alertes basées sur votre score de réciprocité avec vos amis
            </p>
          </div>
          <Switch
            id="notify-friend"
            checked={notifyOnFriendFund}
            onCheckedChange={setNotifyOnFriendFund}
          />
        </div>

        {/* Score minimum */}
        {notifyOnFriendFund && (
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Score minimum de réciprocité
                </Label>
                <p className="text-xs text-muted-foreground">
                  Recevoir des notifications uniquement pour les amis avec ce score minimum
                </p>
              </div>
              <Badge variant="outline" className="text-base font-bold">
                {minReciprocityScore}
              </Badge>
            </div>

            <Slider
              value={[minReciprocityScore]}
              onValueChange={(value) => setMinReciprocityScore(value[0])}
              min={0}
              max={100}
              step={10}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tous (0)</span>
              <span>Contributeurs (40)</span>
              <span>Généreux (60)</span>
              <span>Champions (80+)</span>
            </div>
          </div>
        )}

        {/* Priorité haute uniquement */}
        {notifyOnFriendFund && (
          <div className="flex items-center justify-between space-x-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex-1 space-y-1">
              <Label htmlFor="high-priority" className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                Haute priorité uniquement
              </Label>
              <p className="text-sm text-muted-foreground">
                Limiter aux amis avec lesquels vous avez le plus fort historique de réciprocité
              </p>
            </div>
            <Switch
              id="high-priority"
              checked={notifyHighPriority}
              onCheckedChange={setNotifyHighPriority}
            />
          </div>
        )}

        {/* Exemples de notifications */}
        {notifyOnFriendFund && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm font-medium mb-2">Exemple de notification :</p>
            <div className="bg-background rounded-lg p-3 shadow-sm border">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-lg">
                  🎂
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Sarah a besoin de votre aide</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sarah a créé une cagnotte "Cadeau d'anniversaire". Vous avez un score de
                    réciprocité de 85 avec cette personne.
                  </p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Contribution suggérée: 15K XOF
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end pt-4">
          <Button onClick={savePreferences} disabled={saving || !notifyOnFriendFund}>
            {saving ? 'Enregistrement...' : 'Enregistrer les préférences'}
          </Button>
        </div>

        {/* Info sur le score */}
        {reciprocityScore !== null && reciprocityScore < 40 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 <strong>Astuce :</strong> Votre score de réciprocité augmentera en contribuant à
              plus de cagnottes. Plus votre score est élevé, plus vous recevrez de notifications
              pertinentes !
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
