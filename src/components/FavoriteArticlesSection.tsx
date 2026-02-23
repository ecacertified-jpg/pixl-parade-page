import { Heart, Flame, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";

export function FavoriteArticlesSection() {
  const { stats, loading } = useFavorites();

  return (
    <Card className="p-4 mb-6 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-pink-200/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
          <h3 className="font-semibold text-foreground">Ma liste de souhaits</h3>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/wishlist-catalog">
            <Button variant="outline" size="sm" className="text-primary border-primary/30 hover:bg-primary/10">
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
            <span className="text-orange-600 font-medium dark:text-orange-400">
              {stats.total} article{stats.total > 1 ? 's' : ''} dans votre liste
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