import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Granularity, getPresetDateRange, getRecommendedGranularity } from '@/hooks/useRegistrationTrends';

type PeriodPreset = '7d' | '30d' | '90d' | '1y' | 'custom';

interface PeriodSelectorProps {
  startDate: Date;
  endDate: Date;
  granularity: Granularity;
  onPeriodChange: (startDate: Date, endDate: Date) => void;
  onGranularityChange: (granularity: Granularity) => void;
}

export function PeriodSelector({
  startDate,
  endDate,
  granularity,
  onPeriodChange,
  onGranularityChange,
}: PeriodSelectorProps) {
  const handlePresetChange = (preset: PeriodPreset) => {
    if (preset === 'custom') return;
    
    const { startDate: newStart, endDate: newEnd } = getPresetDateRange(preset);
    onPeriodChange(newStart, newEnd);
    
    // Auto-adjust granularity
    const recommended = getRecommendedGranularity(newStart, newEnd);
    onGranularityChange(recommended);
  };

  const getCurrentPreset = (): PeriodPreset => {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 7) return '7d';
    if (days === 30) return '30d';
    if (days === 90) return '90d';
    if (days >= 360 && days <= 370) return '1y';
    return 'custom';
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={getCurrentPreset() === '7d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetChange('7d')}
        >
          7 jours
        </Button>
        <Button
          variant={getCurrentPreset() === '30d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetChange('30d')}
        >
          30 jours
        </Button>
        <Button
          variant={getCurrentPreset() === '90d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetChange('90d')}
        >
          90 jours
        </Button>
        <Button
          variant={getCurrentPreset() === '1y' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetChange('1y')}
        >
          1 an
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={getCurrentPreset() === 'custom' ? 'default' : 'outline'}
              size="sm"
              className={cn('gap-2')}
            >
              <CalendarIcon className="h-4 w-4" />
              {getCurrentPreset() === 'custom' ? (
                <span className="hidden sm:inline">
                  {format(startDate, 'd MMM', { locale: fr })} - {format(endDate, 'd MMM', { locale: fr })}
                </span>
              ) : (
                <span className="hidden sm:inline">Personnalisé</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: startDate, to: endDate }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  onPeriodChange(range.from, range.to);
                  const recommended = getRecommendedGranularity(range.from, range.to);
                  onGranularityChange(recommended);
                }
              }}
              numberOfMonths={2}
              locale={fr}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Granularité :</span>
        <ToggleGroup
          type="single"
          value={granularity}
          onValueChange={(value) => value && onGranularityChange(value as Granularity)}
        >
          <ToggleGroupItem value="day" size="sm">
            Jour
          </ToggleGroupItem>
          <ToggleGroupItem value="week" size="sm">
            Semaine
          </ToggleGroupItem>
          <ToggleGroupItem value="month" size="sm">
            Mois
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
