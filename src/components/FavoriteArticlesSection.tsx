import { useState, useEffect, useRef } from "react";
import { Heart, Flame, ShoppingBag, AlertTriangle, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import confetti from "canvas-confetti";
import { triggerCelebrationFeedback } from "@/utils/celebrationFeedback";

export function FavoriteArticlesSection() {
  const { stats, loading } = useFavorites();
  const { friends } = useDashboardData();
  const { user } = useAuth();

  const showUrgency = friends.length >= 2 && stats.total < 3;

  const prevTotal = useRef(stats.total);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!user?.id || loading) return;
    const key = `wishlist_completion_celebrated_${user.id}`;
    const alreadyCelebrated = localStorage.getItem(key) === "true";

    if (prevTotal.current < 3 && stats.total >= 3 && !alreadyCelebrated) {
      setShowCelebration(true);
      localStorage.setItem(key, "true");
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      triggerCelebrationFeedback({ sound: "tada", vibration: "celebration" });
    }
    prevTotal.current = stats.total;
  }, [stats.total, loading, user?.id]);

  const dismissCelebration = () => setShowCelebration(false);

  return (
    <Card className={`p-4 mb-6 transition-all duration-300 ${
      showCelebration
        ? "border-2 border-success bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
        : showUrgency
          ? "animate-pulse border-2 border-destructive bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20"
          : "bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-pink-200/50"
    }`}>
      {showCelebration && (
        <Alert className="mb-3 border-success/50 bg-success/10">
          <PartyPopper className="h-4 w-4 text-success" />
          <AlertDescription className="text-sm font-medium text-foreground">
            🎉 Bravo ! Votre liste de souhaits est prête ! Votre profil est maintenant complet pour rappeler à vos proches les événements qui marquent votre vie et les célébrer ensemble.
            <Button variant="outline" size="sm" className="ml-3 mt-2 text-success border-success/30 hover:bg-success/10" onClick={dismissCelebration}>
              Compris !
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!showCelebration && showUrgency && (
        <Alert variant="destructive" className="mb-3 border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm font-medium">
            ⚠️ Alerte : Ajoutez au moins 3 produits à votre liste de souhaits pour désactiver cette alerte !
            <span className="block text-xs mt-1 opacity-80">
              Vos amis ont besoin de savoir ce qui vous ferait plaisir 🎁
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Heart className={`h-5 w-5 ${showCelebration ? "text-success fill-success" : showUrgency ? "text-destructive fill-destructive" : "text-pink-500 fill-pink-500"}`} />
          <h3 className="font-semibold text-foreground">Ma liste de souhaits</h3>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/wishlist-catalog">
            <Button
              variant={showUrgency && !showCelebration ? "destructive" : "outline"}
              size="sm"
              className={showUrgency && !showCelebration
                ? "animate-bounce shadow-lg"
                : "text-primary border-primary/30 hover:bg-primary/10"
              }
            >
              <ShoppingBag className="h-3.5 w-3.5 mr-1" />
              Parcourir
            </Button>
          </Link>
          <Link to="/favorites">
            <Button variant="outline" size="sm" className="text-pink-600 border-pink-300 hover:bg-pink-50">
              Voir tout
            </Button>
          </Link>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">
        Vos amis peuvent voir cette liste pour mieux vous gâter ! 😍
      </p>
      
      {loading ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Chargement...</span>
        </div>
      ) : (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-orange-500">✨</span>
            <span className={`font-medium ${showUrgency ? "text-destructive dark:text-red-400" : "text-orange-600 dark:text-orange-400"}`}>
              {stats.total} article{stats.total > 1 ? 's' : ''} dans votre liste
              {showUrgency && ` (min. 3 requis)`}
            </span>
          </div>
          {stats.urgent > 0 && (
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-destructive" />
              <span className="text-destructive font-medium">
                {stats.urgent} urgent{stats.urgent > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
