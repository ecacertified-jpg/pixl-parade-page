import { Heart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function FavoriteArticlesSection() {
  return (
    <Card className="p-4 mb-6 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
          <h3 className="font-semibold text-foreground">Mes articles préférés</h3>
        </div>
        <Button variant="outline" size="sm" className="text-pink-600 border-pink-300 hover:bg-pink-50">
          Voir tout
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">
        Vos amis peuvent voir cette liste pour mieux vous gâter ! 😍
      </p>
      
      <div className="flex items-center gap-2 text-sm">
        <span className="text-orange-500">✨</span>
        <span className="text-orange-600 font-medium">3 articles dans votre liste de souhaits</span>
      </div>
    </Card>
  );
}