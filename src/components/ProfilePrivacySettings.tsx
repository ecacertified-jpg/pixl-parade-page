import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Globe, Users, Lock } from 'lucide-react';
import { toast } from 'sonner';

type PrivacySetting = 'public' | 'friends' | 'private';

interface PrivacyOption {
  value: PrivacySetting;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const privacyOptions: PrivacyOption[] = [
  {
    value: 'public',
    label: 'Public',
    description: 'Tout le monde peut voir votre profil',
    icon: <Globe className="h-5 w-5 text-green-500" />
  },
  {
    value: 'friends',
    label: 'Amis uniquement',
    description: 'Seuls vos amis peuvent voir votre profil',
    icon: <Users className="h-5 w-5 text-blue-500" />
  },
  {
    value: 'private',
    label: 'Privé',
    description: 'Personne ne peut voir votre profil sauf vous',
    icon: <Lock className="h-5 w-5 text-orange-500" />
  }
];

export function ProfilePrivacySettings() {
  const [privacySetting, setPrivacySetting] = useState<PrivacySetting>('public');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrivacySetting();
  }, []);

  const loadPrivacySetting = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('privacy_setting')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      if (data?.privacy_setting) {
        setPrivacySetting(data.privacy_setting as PrivacySetting);
      }
    } catch (error) {
      console.error('Error loading privacy setting:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrivacySetting = async (value: PrivacySetting) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ privacy_setting: value })
        .eq('user_id', user.id);

      if (error) throw error;

      setPrivacySetting(value);
      toast.success('Paramètre de confidentialité mis à jour');
    } catch (error) {
      console.error('Error updating privacy setting:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Confidentialité du profil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Confidentialité du profil
        </CardTitle>
        <CardDescription>
          Contrôlez qui peut voir votre profil et vos informations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={privacySetting}
          onValueChange={(value) => updatePrivacySetting(value as PrivacySetting)}
          className="space-y-3"
          disabled={saving}
        >
          {privacyOptions.map((option) => (
            <Label
              key={option.value}
              htmlFor={option.value}
              className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                privacySetting === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span className="font-medium">{option.label}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {option.description}
                </p>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
