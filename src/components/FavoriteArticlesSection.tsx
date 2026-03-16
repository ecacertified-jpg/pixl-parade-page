import { Heart, Flame, ShoppingBag, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function FavoriteArticlesSection() {
  const { stats, loading } = useFavorites();
  const { friends } = useDashboardData();

  const showUrgency = friends.length >= 2 && stats.total < 3;

  return (
    <Card className={`p-4 mb-6 transition-all duration-300 ${
      showUrgency
        ? "animate-pulse border-2 border-destructive bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20"
        : "bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-pink-200/50"
    }`}>
      {showUrgency && (
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
          <Heart className={`h-5 w-5 ${showUrgency ? "text-destructive fill-destructive" : "text-pink-500 fill-pink-500"}`} />
          <h3 className="font-semibold text-foreground">Ma liste de souhaits</h3>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/wishlist-catalog">
            <Button
              variant={showUrgency ? "destructive" : "outline"}
              size="sm"
              className={showUrgency
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
