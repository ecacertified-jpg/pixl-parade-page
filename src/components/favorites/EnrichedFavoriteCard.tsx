import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import { EnrichedFavorite, PriorityLevel, OccasionType } from "@/hooks/useFavorites";

interface EnrichedFavoriteCardProps {
  favorite: EnrichedFavorite;
  onUpdatePriority: (favoriteId: string, priority: PriorityLevel) => void;
  onUpdateOccasion: (favoriteId: string, occasion: OccasionType | null) => void;
  onToggleAlternatives: (favoriteId: string, accept: boolean) => void;
  onUpdateContextUsage: (favoriteId: string, contexts: string[]) => void;
  onUpdateNotes: (favoriteId: string, notes: string) => void;
  onRemove: (favoriteId: string) => void;
  onAddToCart: (productId: string) => void;
}

const priorityConfig = {
  urgent: { label: '🔥 Urgent', color: 'border-l-destructive', bgColor: 'bg-destructive/5' },
  high: { label: '⭐ Prioritaire', color: 'border-l-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-950/20' },
  medium: { label: '📌 Moyen', color: 'border-l-primary', bgColor: 'bg-primary/5' },
  low: { label: '💭 Faible', color: 'border-l-muted', bgColor: 'bg-muted/20' },
};

const contextOptions = [
  { value: 'work', label: 'Travail', emoji: '💼' },
  { value: 'casual', label: 'Décontracté', emoji: '👕' },
  { value: 'sport', label: 'Sport', emoji: '⚽' },
  { value: 'formal', label: 'Formel', emoji: '👔' },
  { value: 'home', label: 'Maison', emoji: '🏠' },
  { value: 'outdoor', label: 'Extérieur', emoji: '🌳' },
];

export function EnrichedFavoriteCard({
  favorite,
  onUpdatePriority,
  onUpdateOccasion,
  onToggleAlternatives,
  onUpdateContextUsage,
  onUpdateNotes,
  onRemove,
  onAddToCart
}: EnrichedFavoriteCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(favorite.notes || '');

  const priorityStyle = priorityConfig[favorite.priority_level];
  const product = favorite.product;

  const handleNotesBlur = () => {
    if (notes !== favorite.notes) {
      onUpdateNotes(favorite.id, notes);
    }
  };

  const toggleContext = (context: string) => {
    const current = favorite.context_usage || [];
    const updated = current.includes(context)
      ? current.filter(c => c !== context)
      : [...current, context];
    onUpdateContextUsage(favorite.id, updated);
  };

  if (!product) return null;

  return (
    <Card className={`overflow-hidden border-l-4 ${priorityStyle.color} ${priorityStyle.bgColor} transition-all`}>
      <div className="p-4">
        {/* Main info - Always visible */}
        <div className="flex gap-4">
          <img
            src={product.image_url || '/placeholder.svg'}
            alt={product.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{product.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
            <p className="font-bold text-primary mt-2">
              {product.price.toLocaleString()} {product.currency}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onRemove(favorite.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 space-y-4 pt-4 border-t">
            {/* Priority */}
            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select
                value={favorite.priority_level}
                onValueChange={(value) => onUpdatePriority(favorite.id, value as PriorityLevel)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">🔥 Urgent</SelectItem>
                  <SelectItem value="high">⭐ Prioritaire</SelectItem>
                  <SelectItem value="medium">📌 Moyen</SelectItem>
                  <SelectItem value="low">💭 Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Occasion */}
            <div className="space-y-2">
              <Label>Occasion</Label>
              <Select
                value={favorite.occasion_type || 'none'}
                onValueChange={(value) => onUpdateOccasion(favorite.id, value === 'none' ? null : value as OccasionType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une occasion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  <SelectItem value="birthday">🎂 Anniversaire</SelectItem>
                  <SelectItem value="wedding">💍 Mariage</SelectItem>
                  <SelectItem value="promotion">🎉 Promotion</SelectItem>
                  <SelectItem value="achievement">🎓 Réussite</SelectItem>
                  <SelectItem value="christmas">🎄 Noël</SelectItem>
                  <SelectItem value="valentines">💝 Saint-Valentin</SelectItem>
                  <SelectItem value="other">🎁 Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Accept alternatives */}
            <div className="flex items-center justify-between">
              <Label>J'accepte des alternatives similaires</Label>
              <Switch
                checked={favorite.accept_alternatives}
                onCheckedChange={(checked) => onToggleAlternatives(favorite.id, checked)}
              />
            </div>

            {/* Context usage */}
            <div className="space-y-2">
              <Label>Contexte d'utilisation</Label>
              <div className="flex flex-wrap gap-2">
                {contextOptions.map((context) => (
                  <Badge
                    key={context.value}
                    variant={favorite.context_usage?.includes(context.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleContext(context.value)}
                  >
                    {context.emoji} {context.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes personnelles</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Ajouter des précisions (taille, couleur préférée, etc.)"
                className="min-h-[80px]"
              />
            </div>

            {/* Actions */}
            <Button
              className="w-full"
              onClick={() => onAddToCart(product.id)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Ajouter au panier
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}