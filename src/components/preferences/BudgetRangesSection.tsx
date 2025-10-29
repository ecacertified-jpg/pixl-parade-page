import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { DollarSign } from "lucide-react";
import { UserPreferences } from "@/hooks/useUserPreferences";

interface BudgetRangesSectionProps {
  preferences: UserPreferences | null;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

const OCCASIONS = [
  { key: 'birthday', label: 'Anniversaire', icon: '🎂' },
  { key: 'wedding', label: 'Mariage', icon: '💍' },
  { key: 'promotion', label: 'Promotion', icon: '🎓' },
  { key: 'general', label: 'Général', icon: '🎁' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(value);
};

export const BudgetRangesSection = ({ preferences, onUpdate }: BudgetRangesSectionProps) => {
  const priceRanges = preferences?.price_ranges || {};

  const updateRange = (occasion: string, min: number, max: number) => {
    onUpdate({
      price_ranges: {
        ...priceRanges,
        [occasion]: { min, max },
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Budgets Préférés
        </CardTitle>
        <CardDescription>
          Indiquez les fourchettes de prix que vous préférez selon les occasions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {OCCASIONS.map(({ key, label, icon }) => {
          const range = priceRanges[key as keyof typeof priceRanges] || { min: 5000, max: 50000 };
          const values = [range.min, range.max];

          return (
            <div key={key} className="space-y-3">
              <Label className="flex items-center gap-2 text-base">
                <span>{icon}</span>
                {label}
              </Label>
              <div className="space-y-2">
                <Slider
                  value={values}
                  onValueChange={([min, max]) => updateRange(key, min, max)}
                  min={0}
                  max={150000}
                  step={5000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatCurrency(values[0])}</span>
                  <span>{formatCurrency(values[1])}</span>
                </div>
              </div>
            </div>
          );
        })}

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 Ces budgets aident vos amis à choisir des cadeaux adaptés. 
            Ils restent des suggestions et ne sont pas obligatoires.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
