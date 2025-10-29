import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Lock } from "lucide-react";
import { UserPreferences } from "@/hooks/useUserPreferences";

interface PrivacySectionProps {
  preferences: UserPreferences | null;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

export const PrivacySection = ({ preferences, onUpdate }: PrivacySectionProps) => {
  const visibilitySettings = preferences?.visibility_settings || {
    show_favorites_to_friends: true,
    show_sizes: true,
    show_price_ranges: true,
    allow_suggestions: true,
  };

  const updateSetting = (key: keyof typeof visibilitySettings, value: boolean) => {
    onUpdate({
      visibility_settings: {
        ...visibilitySettings,
        [key]: value,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          Confidentialité
        </CardTitle>
        <CardDescription>
          Contrôlez qui peut voir vos préférences et vos favoris
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-favorites">Partager mes favoris avec mes amis</Label>
            <p className="text-sm text-muted-foreground">
              Vos amis pourront voir votre wishlist pour mieux choisir leurs cadeaux
            </p>
          </div>
          <Switch
            id="show-favorites"
            checked={visibilitySettings.show_favorites_to_friends}
            onCheckedChange={(checked) => updateSetting('show_favorites_to_friends', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-sizes">Partager mes tailles</Label>
            <p className="text-sm text-muted-foreground">
              Permet à vos amis de commander la bonne taille
            </p>
          </div>
          <Switch
            id="show-sizes"
            checked={visibilitySettings.show_sizes}
            onCheckedChange={(checked) => updateSetting('show_sizes', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-prices">Partager mes budgets préférés</Label>
            <p className="text-sm text-muted-foreground">
              Guide vos amis sur le budget approprié selon l'occasion
            </p>
          </div>
          <Switch
            id="show-prices"
            checked={visibilitySettings.show_price_ranges}
            onCheckedChange={(checked) => updateSetting('show_price_ranges', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="allow-suggestions">Recevoir des suggestions</Label>
            <p className="text-sm text-muted-foreground">
              Recevez des notifications sur les nouveaux produits correspondant à vos goûts
            </p>
          </div>
          <Switch
            id="allow-suggestions"
            checked={visibilitySettings.allow_suggestions}
            onCheckedChange={(checked) => updateSetting('allow_suggestions', checked)}
          />
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            🔒 Vos préférences ne sont visibles que par les personnes avec qui vous avez établi une relation d'amitié sur JOIE DE VIVRE.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
