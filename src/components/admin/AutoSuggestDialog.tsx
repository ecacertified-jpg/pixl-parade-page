import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCountryPerformance } from '@/hooks/useCountryPerformance';
import { useCountryObjectives } from '@/hooks/useCountryObjectives';
import { useForecastEngine, ForecastMethod } from '@/hooks/useForecastEngine';
import { Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface AutoSuggestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countryCode: string;
  countryName: string;
  flag: string;
  year: number;
  onSuccess?: () => void;
}

const METRICS = ['users', 'businesses', 'revenue', 'orders'] as const;
const METRIC_LABELS: Record<string, string> = {
  users: 'Utilisateurs',
  businesses: 'Entreprises',
  revenue: 'Revenus',
  orders: 'Commandes'
};

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export function AutoSuggestDialog({
  open,
  onOpenChange,
  countryCode,
  countryName,
  flag,
  year,
  onSuccess
}: AutoSuggestDialogProps) {
  const [adjustmentFactor, setAdjustmentFactor] = useState(0);
  const [roundValues, setRoundValues] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  const { trends, loading: performanceLoading } = useCountryPerformance();
  const { bulkSetObjectives } = useCountryObjectives(year, countryCode);
  const { generateForecast, methods, selectedMethod, setSelectedMethod, getBestMethod } = useForecastEngine();

  // Get historical data for the country
  const countryTrends = useMemo(() => {
    const countryData = trends[countryCode] || [];
    return countryData;
  }, [trends, countryCode]);

  // Get recommended method
  const recommendedMethod = useMemo(() => {
    if (countryTrends.length === 0) return 'linear' as ForecastMethod;
    const values = countryTrends.map(t => t.users);
    return getBestMethod(values);
  }, [countryTrends, getBestMethod]);

  // Generate forecasts for all metrics with adjustments
  const forecasts = useMemo(() => {
    const result: Record<string, number[]> = {};
    
    METRICS.forEach(metric => {
      const historicalData = countryTrends.map(t => ({
        month: t.month,
        label: t.month.slice(0, 3),
        value: metric === 'users' ? t.users :
               metric === 'businesses' ? t.businesses :
               metric === 'revenue' ? t.revenue :
               t.orders
      }));

      const forecastResults = generateForecast({
        historicalData,
        metricType: metric,
        countryCode,
        targetYear: year
      }, selectedMethod);

      result[metric] = forecastResults.map(f => {
        let value = f.predicted * (1 + adjustmentFactor / 100);
        if (roundValues) {
          if (metric === 'revenue') {
            value = Math.round(value / 100000) * 100000;
          } else {
            value = Math.round(value / 10) * 10;
          }
        }
        return Math.max(0, Math.round(value));
      });
    });
    
    return result;
  }, [countryTrends, selectedMethod, adjustmentFactor, roundValues, countryCode, year, generateForecast]);

  const handleApply = async () => {
    setIsApplying(true);
    
    try {
      const objectives = METRICS.flatMap(metric =>
        forecasts[metric].map((value, index) => ({
          year,
          month: index + 1,
          metricType: metric,
          targetValue: value,
          countryCode
        }))
      );

      await bulkSetObjectives(objectives);
      
      toast.success(`Objectifs ${year} appliqués pour ${flag} ${countryName}`);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error applying suggestions:', error);
      toast.error('Erreur lors de l\'application des suggestions');
    } finally {
      setIsApplying(false);
    }
  };

  const formatValue = (metric: string, value: number) => {
    if (metric === 'revenue') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toLocaleString('fr-FR');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Suggestions automatiques d'objectifs
          </DialogTitle>
          <DialogDescription>
            Pays : {flag} {countryName} • Année cible : {year}
          </DialogDescription>
        </DialogHeader>

        {performanceLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Méthode de prévision</Label>
              <Select
                value={selectedMethod}
                onValueChange={(v) => setSelectedMethod(v as ForecastMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methods.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                      {m.id === recommendedMethod && ' ⭐ Recommandé'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Facteur d'ajustement</Label>
                  <span className="text-sm font-medium">
                    {adjustmentFactor > 0 ? '+' : ''}{adjustmentFactor}%
                  </span>
                </div>
                <Slider
                  value={[adjustmentFactor]}
                  onValueChange={([v]) => setAdjustmentFactor(v)}
                  min={-30}
                  max={50}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Ajustez les prévisions pour des objectifs plus ambitieux (+) ou conservateurs (-)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="round"
                  checked={roundValues}
                  onCheckedChange={(checked) => setRoundValues(checked === true)}
                />
                <Label htmlFor="round" className="text-sm cursor-pointer">
                  Arrondir les valeurs
                </Label>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-2 text-sm font-medium">
                Aperçu des objectifs suggérés
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left font-medium">Métrique</th>
                      {MONTH_LABELS.map(m => (
                        <th key={m} className="p-2 text-right font-medium">{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {METRICS.map(metric => (
                      <tr key={metric} className="border-b">
                        <td className="p-2 font-medium">{METRIC_LABELS[metric]}</td>
                        {forecasts[metric].map((value, index) => (
                          <td key={index} className="p-2 text-right font-mono text-xs">
                            {formatValue(metric, value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>
                {countryTrends.length} mois de données historiques analysés
                {adjustmentFactor !== 0 && ` • Ajustement de ${adjustmentFactor > 0 ? '+' : ''}${adjustmentFactor}%`}
              </span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleApply} disabled={isApplying || performanceLoading}>
            {isApplying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Application...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Appliquer les suggestions
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
