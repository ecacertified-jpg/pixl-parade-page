import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserPreferences {
  id: string;
  user_id: string;
  clothing_size?: string;
  shoe_size?: string;
  ring_size?: string;
  allergies: string[];
  dietary_restrictions: string[];
  favorite_colors: string[];
  price_ranges: {
    birthday?: { min: number; max: number };
    wedding?: { min: number; max: number };
    promotion?: { min: number; max: number };
    general?: { min: number; max: number };
  };
  visibility_settings: {
    show_favorites_to_friends: boolean;
    show_sizes: boolean;
    show_price_ranges: boolean;
    allow_suggestions: boolean;
  };
  created_at: string;
  updated_at: string;
}

export const useUserPreferences = (userId?: string) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const targetUserId = userId || user?.id;

  const loadPreferences = async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences(data as UserPreferences);
      } else {
        // Créer des préférences par défaut si elles n'existent pas
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_preferences')
          .insert([{ user_id: targetUserId }])
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newPrefs as UserPreferences);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des préférences:', error);
      toast.error('Impossible de charger les préférences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!targetUserId) return false;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', targetUserId)
        .select()
        .single();

      if (error) throw error;

      setPreferences(data as UserPreferences);
      toast.success('Préférences mises à jour avec succès');
      return true;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Impossible de mettre à jour les préférences');
      return false;
    }
  };

  const getCompletionScore = () => {
    if (!preferences) return 0;
    
    let score = 0;
    const fields = [
      preferences.clothing_size,
      preferences.shoe_size,
      preferences.favorite_colors.length > 0,
      preferences.allergies.length > 0 || preferences.dietary_restrictions.length > 0,
      preferences.price_ranges.birthday || preferences.price_ranges.general,
    ];
    
    const completedFields = fields.filter(Boolean).length;
    score = Math.round((completedFields / fields.length) * 100);
    
    return score;
  };

  useEffect(() => {
    loadPreferences();
  }, [targetUserId]);

  return {
    preferences,
    loading,
    updatePreferences,
    refresh: loadPreferences,
    completionScore: getCompletionScore(),
  };
};
