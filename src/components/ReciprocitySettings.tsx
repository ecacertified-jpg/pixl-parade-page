import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings } from 'lucide-react';

interface ReciprocityPreferences {
  enable_reciprocity_system: boolean;
  enable_for_birthdays: boolean;
  enable_for_academic: boolean;
  enable_for_weddings: boolean;
  enable_for_promotions: boolean;
  show_generosity_badge: boolean;
}

export function ReciprocitySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<ReciprocityPreferences>({
    enable_reciprocity_system: true,
    enable_for_birthdays: true,
    enable_for_academic: false,
    enable_for_weddings: false,
    enable_for_promotions: false,
    show_generosity_badge: true,
  });

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_reciprocity_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          enable_reciprocity_system: data.enable_reciprocity_system,
          enable_for_birthdays: data.enable_for_birthdays,
          enable_for_academic: data.enable_for_academic,
          enable_for_weddings: data.enable_for_weddings,
          enable_for_promotions: data.enable_for_promotions,
          show_generosity_badge: data.show_generosity_badge,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_reciprocity_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Préférences enregistrées",
        description: "Vos préférences de réciprocité ont été mises à jour.",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer vos préférences.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Préférences de réciprocité</h3>
      </div>

      <div className="space-y-6">
        {/* Activer/Désactiver le système */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable-system" className="text-base font-medium">
              Système de réciprocité
            </Label>
            <p className="text-sm text-muted-foreground">
              Recevoir des notifications quand quelqu'un pour qui vous avez contribué crée une cagnotte
            </p>
          </div>
          <Switch
            id="enable-system"
            checked={preferences.enable_reciprocity_system}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, enable_reciprocity_system: checked }))
            }
          />
        </div>

        {/* Options par occasion */}
        {preferences.enable_reciprocity_system && (
          <div className="space-y-4 pl-4 border-l-2 border-border">
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Occasions concernées
              </Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="birthdays"
                    checked={preferences.enable_for_birthdays}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, enable_for_birthdays: checked as boolean }))
                    }
                  />
                  <Label
                    htmlFor="birthdays"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Anniversaires 🎂
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="academic"
                    checked={preferences.enable_for_academic}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, enable_for_academic: checked as boolean }))
                    }
                  />
                  <Label
                    htmlFor="academic"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Réussites académiques 🎓
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="weddings"
                    checked={preferences.enable_for_weddings}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, enable_for_weddings: checked as boolean }))
                    }
                  />
                  <Label
                    htmlFor="weddings"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Mariages 💍
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="promotions"
                    checked={preferences.enable_for_promotions}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, enable_for_promotions: checked as boolean }))
                    }
                  />
                  <Label
                    htmlFor="promotions"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Promotions professionnelles 📈
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Affichage du badge */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-badge" className="text-base font-medium">
              Afficher mon badge public
            </Label>
            <p className="text-sm text-muted-foreground">
              Votre badge de générosité sera visible par vos amis
            </p>
          </div>
          <Switch
            id="show-badge"
            checked={preferences.show_generosity_badge}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, show_generosity_badge: checked }))
            }
          />
        </div>

        {/* Bouton de sauvegarde */}
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer les préférences'
          )}
        </Button>
      </div>
    </Card>
  );
}
