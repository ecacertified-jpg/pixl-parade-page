import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AmountSuggestion {
  amount: number;
  label: string;
  reason: string;
}

interface SmartAmountSuggestionsProps {
  suggestions: AmountSuggestion[];
  loading: boolean;
  hasHistory: boolean;
  reciprocityScore: number | null;
  onSelectAmount: (amount: number) => void;
  currentAmount?: string;
}

export function SmartAmountSuggestions({
  suggestions,
  loading,
  hasHistory,
  reciprocityScore,
  onSelectAmount,
  currentAmount,
}: SmartAmountSuggestionsProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Suggestions intelligentes</span>
        {hasHistory && (
          <Badge variant="secondary" className="text-xs">
            <History className="h-3 w-3 mr-1" />
            Basé sur votre historique
          </Badge>
        )}
        {reciprocityScore && reciprocityScore >= 70 && (
          <Badge variant="default" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Score {reciprocityScore.toFixed(0)}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {suggestions.map((suggestion, index) => {
          const isSelected = currentAmount === suggestion.amount.toString();
          return (
            <Button
              key={index}
              type="button"
              variant={isSelected ? 'default' : 'outline'}
              className={`h-auto flex-col items-start p-3 relative overflow-hidden transition-all ${
                isSelected
                  ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
                  : 'hover:bg-accent hover:border-primary/50'
              }`}
              onClick={() => onSelectAmount(suggestion.amount)}
            >
              {index === 0 && hasHistory && (
                <div className="absolute top-1 right-1">
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                </div>
              )}
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-lg font-bold">
                  {(suggestion.amount / 1000).toFixed(0)}K
                </span>
                <span className="text-xs opacity-70">XOF</span>
              </div>
              <div className="text-xs font-medium mb-1">{suggestion.label}</div>
              <div className="text-[10px] opacity-70 leading-tight">
                {suggestion.reason}
              </div>
            </Button>
          );
        })}
      </div>

      {hasHistory && reciprocityScore && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Ces suggestions sont personnalisées selon votre historique de contributions et votre
          score de réciprocité
        </div>
      )}
    </div>
  );
}
