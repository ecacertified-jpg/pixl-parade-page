import { Button } from '@/components/ui/button';

type SimplePeriod = 'today' | '7days' | '30days' | '90days';

interface SimplePeriodSelectorProps {
  value: SimplePeriod;
  onChange: (period: SimplePeriod) => void;
}

export function SimplePeriodSelector({ value, onChange }: SimplePeriodSelectorProps) {
  const periods: { key: SimplePeriod; label: string }[] = [
    { key: 'today', label: "Aujourd'hui" },
    { key: '7days', label: '7 jours' },
    { key: '30days', label: '30 jours' },
    { key: '90days', label: '90 jours' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <Button
          key={period.key}
          variant={value === period.key ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(period.key)}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}
