import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ForecastResult, useForecastEngine } from '@/hooks/useForecastEngine';
import { Check, TrendingUp, Users, Store, DollarSign, ShoppingCart } from 'lucide-react';

interface ForecastSuggestionCardProps {
  metricType: string;
  forecasts: ForecastResult[];
  onApply: (selectedMonths: number[], forecasts: ForecastResult[]) => void;
  isApplying?: boolean;
}

const MONTH_LABELS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const METRIC_CONFIG: Record<string, { label: string; icon: React.ReactNode; format: (v: number) => string }> = {
  users: {
    label: 'Utilisateurs',
    icon: <Users className="h-5 w-5" />,
    format: (v) => v.toLocaleString('fr-FR')
  },
  businesses: {
    label: 'Entreprises',
    icon: <Store className="h-5 w-5" />,
    format: (v) => v.toLocaleString('fr-FR')
  },
  revenue: {
    label: 'Revenus',
    icon: <DollarSign className="h-5 w-5" />,
    format: (v) => {
      if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M FCFA`;
      if (v >= 1000) return `${(v / 1000).toFixed(0)}K FCFA`;
      return `${v.toLocaleString('fr-FR')} FCFA`;
    }
  },
  orders: {
    label: 'Commandes',
    icon: <ShoppingCart className="h-5 w-5" />,
    format: (v) => v.toLocaleString('fr-FR')
  }
};

export function ForecastSuggestionCard({
  metricType,
  forecasts,
  onApply,
  isApplying
}: ForecastSuggestionCardProps) {
  const [selectedMonths, setSelectedMonths] = useState<number[]>(
    forecasts.map(f => f.month)
  );
  const { getConfidenceColor, getConfidenceBgColor } = useForecastEngine();

  const config = METRIC_CONFIG[metricType] || {
    label: metricType,
    icon: <TrendingUp className="h-5 w-5" />,
    format: (v: number) => v.toLocaleString('fr-FR')
  };

  const toggleMonth = (month: number) => {
    setSelectedMonths(prev => 
      prev.includes(month)
        ? prev.filter(m => m !== month)
        : [...prev, month].sort((a, b) => a - b)
    );
  };

  const toggleAll = () => {
    if (selectedMonths.length === 12) {
      setSelectedMonths([]);
    } else {
      setSelectedMonths(forecasts.map(f => f.month));
    }
  };

  // Calculate average confidence
  const avgConfidence = forecasts.reduce((acc, f) => {
    const score = f.confidence === 'high' ? 3 : f.confidence === 'medium' ? 2 : 1;
    return acc + score;
  }, 0) / forecasts.length;

  const overallConfidence = avgConfidence >= 2.5 ? 'high' : avgConfidence >= 1.5 ? 'medium' : 'low';
  const confidencePercent = Math.round((avgConfidence / 3) * 100);

  const handleApply = () => {
    const selectedForecasts = forecasts.filter(f => selectedMonths.includes(f.month));
    onApply(selectedMonths, selectedForecasts);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {config.icon}
            </div>
            <CardTitle className="text-lg">{config.label}</CardTitle>
          </div>
          <Badge className={`${getConfidenceBgColor(overallConfidence)} ${getConfidenceColor(overallConfidence)} border-0`}>
            Confiance: {confidencePercent}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={selectedMonths.length === 12}
              onCheckedChange={toggleAll}
            />
            <span className="text-muted-foreground">Tout sélectionner</span>
          </label>
          <span className="text-muted-foreground">
            {selectedMonths.length}/12 mois sélectionnés
          </span>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-5 gap-px bg-muted text-xs font-medium">
            <div className="bg-background p-2"></div>
            <div className="bg-background p-2">Mois</div>
            <div className="bg-background p-2 text-right">Prévu</div>
            <div className="bg-background p-2 text-center">Confiance</div>
            <div className="bg-background p-2 text-center">Intervalle</div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {forecasts.map((forecast) => (
              <div
                key={forecast.month}
                className={`grid grid-cols-5 gap-px bg-muted text-sm ${
                  selectedMonths.includes(forecast.month) ? 'bg-primary/5' : ''
                }`}
              >
                <div className="bg-background p-2 flex items-center justify-center">
                  <Checkbox
                    checked={selectedMonths.includes(forecast.month)}
                    onCheckedChange={() => toggleMonth(forecast.month)}
                  />
                </div>
                <div className="bg-background p-2 font-medium">
                  {MONTH_LABELS[forecast.month - 1]}
                </div>
                <div className="bg-background p-2 text-right font-mono">
                  {config.format(forecast.predicted)}
                </div>
                <div className="bg-background p-2 flex justify-center">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getConfidenceColor(forecast.confidence)}`}
                  >
                    {forecast.confidence === 'high' ? 'Haute' : forecast.confidence === 'medium' ? 'Moyenne' : 'Basse'}
                  </Badge>
                </div>
                <div className="bg-background p-2 text-center text-xs text-muted-foreground">
                  {config.format(forecast.lowerBound)} - {config.format(forecast.upperBound)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleApply}
          disabled={selectedMonths.length === 0 || isApplying}
          className="w-full"
        >
          <Check className="h-4 w-4 mr-2" />
          Appliquer {selectedMonths.length > 0 ? `(${selectedMonths.length} mois)` : ''}
        </Button>
      </CardContent>
    </Card>
  );
}
