import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Clock, Video, Sparkles, Package, Loader2 } from 'lucide-react';
import { useVideoDurationLimits, VideoDurationLimits, formatMaxDuration } from '@/hooks/useVideoDurationLimits';

export function VideoDurationLimitsSettings() {
  const { limits, isLoading, updateLimits, isUpdating } = useVideoDurationLimits();
  
  const [localLimits, setLocalLimits] = useState<VideoDurationLimits>({
    defaultSeconds: 180,
    experienceSeconds: 300,
    productSeconds: 120,
    enabled: true,
  });

  // Sync local state with fetched limits
  useEffect(() => {
    if (limits) {
      setLocalLimits(limits);
    }
  }, [limits]);

  const handleSave = () => {
    // Validate limits
    if (localLimits.defaultSeconds < 60 || localLimits.defaultSeconds > 600) {
      return;
    }
    if (localLimits.experienceSeconds < 60 || localLimits.experienceSeconds > 600) {
      return;
    }
    if (localLimits.productSeconds < 60 || localLimits.productSeconds > 600) {
      return;
    }

    updateLimits(localLimits);
  };

  const handleMinutesChange = (field: keyof VideoDurationLimits, minutes: number) => {
    const seconds = Math.max(60, Math.min(600, minutes * 60));
    setLocalLimits(prev => ({ ...prev, [field]: seconds }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          <CardTitle>Limites de durée des vidéos</CardTitle>
        </div>
        <CardDescription>
          Configurez la durée maximale des vidéos par type de produit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="space-y-0.5">
            <Label className="font-medium">Limites par type de produit</Label>
            <p className="text-sm text-muted-foreground">
              {localLimits.enabled 
                ? 'Appliquer des limites différentes selon le type' 
                : 'Utiliser la même limite pour tous les produits'}
            </p>
          </div>
          <Switch
            checked={localLimits.enabled}
            onCheckedChange={(checked) => 
              setLocalLimits(prev => ({ ...prev, enabled: checked }))
            }
          />
        </div>

        {/* Duration inputs */}
        <div className="space-y-4">
          {localLimits.enabled && (
            <>
              {/* Experience limit */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <Label className="font-medium">Expériences</Label>
                    <p className="text-sm text-muted-foreground">
                      Spa, formations, événements...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={Math.round(localLimits.experienceSeconds / 60)}
                    onChange={(e) => handleMinutesChange('experienceSeconds', parseInt(e.target.value) || 1)}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>

              {/* Product limit */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <Label className="font-medium">Produits physiques</Label>
                    <p className="text-sm text-muted-foreground">
                      Bijoux, vêtements, électronique...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={Math.round(localLimits.productSeconds / 60)}
                    onChange={(e) => handleMinutesChange('productSeconds', parseInt(e.target.value) || 1)}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>
            </>
          )}

          {/* Default limit */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <Label className="font-medium">
                  {localLimits.enabled ? 'Par défaut' : 'Limite globale'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {localLimits.enabled 
                    ? 'Si le type n\'est pas spécifié'
                    : 'Appliquée à tous les produits'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={10}
                value={Math.round(localLimits.defaultSeconds / 60)}
                onChange={(e) => handleMinutesChange('defaultSeconds', parseInt(e.target.value) || 1)}
                className="w-20 text-center"
              />
              <span className="text-sm text-muted-foreground">min</span>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <p className="text-sm font-medium">Aperçu des limites :</p>
          <div className="flex flex-wrap gap-2 text-sm">
            {localLimits.enabled ? (
              <>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                  Expériences : {formatMaxDuration(localLimits.experienceSeconds)}
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                  Produits : {formatMaxDuration(localLimits.productSeconds)}
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                  Défaut : {formatMaxDuration(localLimits.defaultSeconds)}
                </span>
              </>
            ) : (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                Tous : {formatMaxDuration(localLimits.defaultSeconds)}
              </span>
            )}
          </div>
        </div>

        {/* Save button */}
        <Button onClick={handleSave} disabled={isUpdating} className="w-full">
          {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Enregistrer les limites
        </Button>
      </CardContent>
    </Card>
  );
}
