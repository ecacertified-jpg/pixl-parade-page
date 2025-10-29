import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette } from "lucide-react";
import { UserPreferences } from "@/hooks/useUserPreferences";
import { cn } from "@/lib/utils";

interface ColorsSectionProps {
  preferences: UserPreferences | null;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

const AVAILABLE_COLORS = [
  { name: 'Rouge', value: 'red', hex: '#EF4444' },
  { name: 'Rose', value: 'pink', hex: '#EC4899' },
  { name: 'Orange', value: 'orange', hex: '#F97316' },
  { name: 'Jaune', value: 'yellow', hex: '#EAB308' },
  { name: 'Vert', value: 'green', hex: '#10B981' },
  { name: 'Bleu', value: 'blue', hex: '#3B82F6' },
  { name: 'Indigo', value: 'indigo', hex: '#6366F1' },
  { name: 'Violet', value: 'purple', hex: '#A855F7' },
  { name: 'Noir', value: 'black', hex: '#1F2937' },
  { name: 'Blanc', value: 'white', hex: '#F9FAFB' },
  { name: 'Gris', value: 'gray', hex: '#6B7280' },
  { name: 'Or', value: 'gold', hex: '#D4AF37' },
  { name: 'Argent', value: 'silver', hex: '#C0C0C0' },
];

export const ColorsSection = ({ preferences, onUpdate }: ColorsSectionProps) => {
  const favoriteColors = preferences?.favorite_colors || [];

  const toggleColor = (colorValue: string) => {
    const currentColors = [...favoriteColors];
    const index = currentColors.indexOf(colorValue);
    
    if (index > -1) {
      currentColors.splice(index, 1);
    } else {
      if (currentColors.length >= 5) {
        return; // Limite de 5 couleurs
      }
      currentColors.push(colorValue);
    }
    
    onUpdate({ favorite_colors: currentColors });
  };

  const getColorName = (value: string) => {
    return AVAILABLE_COLORS.find(c => c.value === value)?.name || value;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Couleurs Favorites
        </CardTitle>
        <CardDescription>
          Sélectionnez jusqu'à 5 couleurs que vous aimez (vêtements, accessoires, décoration)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {favoriteColors.map((color) => (
            <Badge key={color} variant="secondary" className="gap-2 px-3 py-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-background"
                style={{ 
                  backgroundColor: AVAILABLE_COLORS.find(c => c.value === color)?.hex 
                }}
              />
              {getColorName(color)}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {AVAILABLE_COLORS.map((color) => {
            const isSelected = favoriteColors.includes(color.value);
            const isAtLimit = favoriteColors.length >= 5 && !isSelected;

            return (
              <button
                key={color.value}
                onClick={() => !isAtLimit && toggleColor(color.value)}
                disabled={isAtLimit}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                  isSelected 
                    ? "border-primary bg-primary/10 shadow-sm" 
                    : "border-border hover:border-primary/50",
                  isAtLimit && "opacity-50 cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full border-2",
                    isSelected ? "border-primary ring-2 ring-primary/20" : "border-background",
                    color.value === 'white' && "border-border"
                  )}
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-xs font-medium text-center">{color.name}</span>
              </button>
            );
          })}
        </div>

        {favoriteColors.length >= 5 && (
          <p className="text-sm text-muted-foreground text-center">
            Vous avez atteint la limite de 5 couleurs favorites
          </p>
        )}
      </CardContent>
    </Card>
  );
};
