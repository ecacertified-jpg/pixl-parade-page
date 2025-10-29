import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Plus, X } from "lucide-react";
import { useState } from "react";
import { UserPreferences } from "@/hooks/useUserPreferences";

interface AllergiesSectionProps {
  preferences: UserPreferences | null;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

const COMMON_ALLERGIES = [
  'Lactose',
  'Gluten',
  'Arachides',
  'Fruits à coque',
  'Nickel (bijoux)',
  'Parfums floraux',
  'Fruits de mer',
];

const DIETARY_RESTRICTIONS = [
  'Végétarien',
  'Végétalien',
  'Halal',
  'Casher',
  'Sans gluten',
  'Sans lactose',
];

export const AllergiesSection = ({ preferences, onUpdate }: AllergiesSectionProps) => {
  const [newAllergy, setNewAllergy] = useState('');
  const [newRestriction, setNewRestriction] = useState('');

  const addAllergy = (allergy: string) => {
    if (!allergy.trim()) return;
    const currentAllergies = preferences?.allergies || [];
    if (!currentAllergies.includes(allergy)) {
      onUpdate({ allergies: [...currentAllergies, allergy] });
    }
    setNewAllergy('');
  };

  const removeAllergy = (allergy: string) => {
    const currentAllergies = preferences?.allergies || [];
    onUpdate({ allergies: currentAllergies.filter((a) => a !== allergy) });
  };

  const addRestriction = (restriction: string) => {
    if (!restriction.trim()) return;
    const currentRestrictions = preferences?.dietary_restrictions || [];
    if (!currentRestrictions.includes(restriction)) {
      onUpdate({ dietary_restrictions: [...currentRestrictions, restriction] });
    }
    setNewRestriction('');
  };

  const removeRestriction = (restriction: string) => {
    const currentRestrictions = preferences?.dietary_restrictions || [];
    onUpdate({ dietary_restrictions: currentRestrictions.filter((r) => r !== restriction) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Allergies & Restrictions
        </CardTitle>
        <CardDescription>
          Informez vos amis de vos allergies pour éviter les mauvaises surprises
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Allergies */}
        <div className="space-y-3">
          <Label>Allergies connues</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {(preferences?.allergies || []).map((allergy) => (
              <Badge key={allergy} variant="destructive" className="gap-1">
                {allergy}
                <button onClick={() => removeAllergy(allergy)} className="ml-1 hover:text-destructive-foreground">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Ajouter une allergie..."
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addAllergy(newAllergy)}
            />
            <Button onClick={() => addAllergy(newAllergy)} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {COMMON_ALLERGIES.map((allergy) => (
              <Badge
                key={allergy}
                variant="outline"
                className="cursor-pointer hover:bg-muted"
                onClick={() => addAllergy(allergy)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {allergy}
              </Badge>
            ))}
          </div>
        </div>

        {/* Restrictions alimentaires */}
        <div className="space-y-3">
          <Label>Restrictions alimentaires</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {(preferences?.dietary_restrictions || []).map((restriction) => (
              <Badge key={restriction} variant="secondary" className="gap-1">
                {restriction}
                <button onClick={() => removeRestriction(restriction)} className="ml-1 hover:text-secondary-foreground">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Ajouter une restriction..."
              value={newRestriction}
              onChange={(e) => setNewRestriction(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addRestriction(newRestriction)}
            />
            <Button onClick={() => addRestriction(newRestriction)} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {DIETARY_RESTRICTIONS.map((restriction) => (
              <Badge
                key={restriction}
                variant="outline"
                className="cursor-pointer hover:bg-muted"
                onClick={() => addRestriction(restriction)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {restriction}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
