import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ruler } from "lucide-react";
import { UserPreferences } from "@/hooks/useUserPreferences";

interface SizesSectionProps {
  preferences: UserPreferences | null;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const SHOE_SIZES = Array.from({ length: 20 }, (_, i) => (35 + i).toString());
const RING_SIZES = Array.from({ length: 15 }, (_, i) => (50 + i * 2).toString());

export const SizesSection = ({ preferences, onUpdate }: SizesSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-5 w-5 text-primary" />
          Tailles & Mesures
        </CardTitle>
        <CardDescription>
          Aidez vos amis à choisir la bonne taille pour leurs cadeaux
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="clothing-size">Taille de vêtement</Label>
          <Select
            value={preferences?.clothing_size || ''}
            onValueChange={(value) => onUpdate({ clothing_size: value })}
          >
            <SelectTrigger id="clothing-size">
              <SelectValue placeholder="Sélectionnez votre taille" />
            </SelectTrigger>
            <SelectContent>
              {CLOTHING_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shoe-size">Pointure</Label>
          <Select
            value={preferences?.shoe_size || ''}
            onValueChange={(value) => onUpdate({ shoe_size: value })}
          >
            <SelectTrigger id="shoe-size">
              <SelectValue placeholder="Sélectionnez votre pointure" />
            </SelectTrigger>
            <SelectContent>
              {SHOE_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ring-size">Tour de doigt (bijoux)</Label>
          <Select
            value={preferences?.ring_size || ''}
            onValueChange={(value) => onUpdate({ ring_size: value })}
          >
            <SelectTrigger id="ring-size">
              <SelectValue placeholder="Sélectionnez votre tour de doigt" />
            </SelectTrigger>
            <SelectContent>
              {RING_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {size} mm
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
