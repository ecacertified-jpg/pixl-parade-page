import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ForecastMethod, ForecastMethodInfo } from '@/hooks/useForecastEngine';
import { TrendingUp, BarChart3, Percent, Calendar } from 'lucide-react';

interface ForecastMethodSelectorProps {
  methods: ForecastMethodInfo[];
  selectedMethod: ForecastMethod;
  onMethodChange: (method: ForecastMethod) => void;
  recommendedMethod?: ForecastMethod;
}

const METHOD_ICONS: Record<ForecastMethod, React.ReactNode> = {
  linear: <TrendingUp className="h-4 w-4" />,
  moving_average: <BarChart3 className="h-4 w-4" />,
  growth_rate: <Percent className="h-4 w-4" />,
  seasonal: <Calendar className="h-4 w-4" />
};

export function ForecastMethodSelector({
  methods,
  selectedMethod,
  onMethodChange,
  recommendedMethod
}: ForecastMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Méthode de prévision</Label>
      <RadioGroup
        value={selectedMethod}
        onValueChange={(value) => onMethodChange(value as ForecastMethod)}
        className="grid gap-2"
      >
        {methods.map((method) => (
          <div
            key={method.id}
            className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
              selectedMethod === method.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <RadioGroupItem value={method.id} id={method.id} className="mt-0.5" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                {METHOD_ICONS[method.id]}
                <Label htmlFor={method.id} className="font-medium cursor-pointer">
                  {method.name}
                </Label>
                {recommendedMethod === method.id && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Recommandé
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{method.description}</p>
              <p className="text-xs text-muted-foreground/80">
                Idéal pour : {method.bestFor}
              </p>
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
