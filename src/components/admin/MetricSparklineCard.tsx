import { Card, CardContent } from '@/components/ui/card';
import { SparklineChart } from './SparklineChart';
import { VariationBadge } from './VariationBadge';
import { Users, Building2, DollarSign, ShoppingCart, Gift, Target, LucideIcon } from 'lucide-react';

interface MetricSparklineCardProps {
  title: string;
  icon: 'users' | 'business' | 'revenue' | 'orders' | 'funds';
  values: number[];
  total: number;
  variation: number | null;
  objective?: number | null;
  attainment?: number | null;
  formatValue?: (value: number) => string;
}

const iconMap: Record<string, LucideIcon> = {
  users: Users,
  business: Building2,
  revenue: DollarSign,
  orders: ShoppingCart,
  funds: Gift
};

const colorMap: Record<string, string> = {
  users: 'hsl(var(--primary))',
  business: 'hsl(259, 58%, 59%)',
  revenue: 'hsl(142, 76%, 36%)',
  orders: 'hsl(45, 88%, 50%)',
  funds: 'hsl(330, 70%, 60%)'
};

export function MetricSparklineCard({
  title,
  icon,
  values,
  total,
  variation,
  objective,
  attainment,
  formatValue = (v) => v.toLocaleString('fr-FR')
}: MetricSparklineCardProps) {
  const Icon = iconMap[icon];
  const color = colorMap[icon];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
          </div>
          <VariationBadge value={variation} size="sm" />
        </div>

        {/* Value */}
        <div className="mb-3">
          <p className="text-2xl font-bold">{formatValue(total)}</p>
        </div>

        {/* Sparkline */}
        <SparklineChart 
          data={values} 
          color={color} 
          height={50}
          showArea={true}
          showDot={true}
        />

        {/* Objective */}
        {objective !== null && objective !== undefined && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Target className="h-3 w-3" />
                <span>Objectif: {formatValue(objective)}</span>
              </div>
              {attainment !== null && attainment !== undefined && (
                <span 
                  className={`font-medium ${
                    attainment >= 100 
                      ? 'text-green-600' 
                      : attainment >= 75 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                  }`}
                >
                  {attainment.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
