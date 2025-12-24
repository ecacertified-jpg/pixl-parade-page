import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMonthlyComparison, MonthlyMetrics } from '@/hooks/useMonthlyComparison';
import { VariationBadge, ObjectiveAttainmentBadge } from './VariationBadge';
import { SparklineChart } from './SparklineChart';
import { Download, Users, Building2, DollarSign, ShoppingCart, Gift, Loader2 } from 'lucide-react';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('fr-FR').format(num);
};

const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(num) + ' XOF';
};

const colorMap: Record<string, string> = {
  users: 'hsl(var(--primary))',
  businesses: 'hsl(259, 58%, 59%)',
  revenue: 'hsl(142, 76%, 36%)',
  orders: 'hsl(45, 88%, 50%)',
  funds: 'hsl(330, 70%, 60%)'
};

export function MonthlyComparisonTable() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { metrics, totals, loading } = useMonthlyComparison(selectedYear);

  const exportToCSV = () => {
    const headers = [
      'Mois',
      'Utilisateurs', 'Δ M-1 (%)', 'Obj Utilisateurs', 'Atteinte (%)',
      'Business', 'Δ M-1 (%)', 'Obj Business', 'Atteinte (%)',
      'Revenus (XOF)', 'Δ M-1 (%)', 'Obj Revenus', 'Atteinte (%)',
      'Commandes', 'Δ M-1 (%)', 'Obj Commandes', 'Atteinte (%)',
      'Cagnottes', 'Δ M-1 (%)', 'Obj Cagnottes', 'Atteinte (%)'
    ];

    const rows = metrics.map(m => [
      m.label,
      m.users, m.usersVariationM1 ?? '', m.usersObjective ?? '', m.usersVsObjective ?? '',
      m.businesses, m.businessesVariationM1 ?? '', m.businessesObjective ?? '', m.businessesVsObjective ?? '',
      m.revenue, m.revenueVariationM1 ?? '', m.revenueObjective ?? '', m.revenueVsObjective ?? '',
      m.orders, m.ordersVariationM1 ?? '', m.ordersObjective ?? '', m.ordersVsObjective ?? '',
      m.funds, m.fundsVariationM1 ?? '', m.fundsObjective ?? '', m.fundsVsObjective ?? ''
    ]);

    if (totals) {
      rows.push([
        'TOTAL',
        totals.users, '', totals.usersObjective, totals.usersVsObjective ?? '',
        totals.businesses, '', totals.businessesObjective, totals.businessesVsObjective ?? '',
        totals.revenue, '', totals.revenueObjective, totals.revenueVsObjective ?? '',
        totals.orders, '', totals.ordersObjective, totals.ordersVsObjective ?? '',
        totals.funds, '', totals.fundsObjective, totals.fundsVsObjective ?? ''
      ]);
    }

    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comparatif-mensuel-${selectedYear}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          📊 Tableau comparatif mensuel
        </CardTitle>
        <div className="flex items-center gap-3">
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="users" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Utilisateurs</span>
            </TabsTrigger>
            <TabsTrigger value="businesses" className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Business</span>
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Revenus</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Commandes</span>
            </TabsTrigger>
            <TabsTrigger value="funds" className="flex items-center gap-1">
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">Cagnottes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <MetricTable
              metrics={metrics}
              totals={totals}
              metricKey="users"
              formatValue={formatNumber}
            />
          </TabsContent>

          <TabsContent value="businesses">
            <MetricTable
              metrics={metrics}
              totals={totals}
              metricKey="businesses"
              formatValue={formatNumber}
            />
          </TabsContent>

          <TabsContent value="revenue">
            <MetricTable
              metrics={metrics}
              totals={totals}
              metricKey="revenue"
              formatValue={formatCurrency}
            />
          </TabsContent>

          <TabsContent value="orders">
            <MetricTable
              metrics={metrics}
              totals={totals}
              metricKey="orders"
              formatValue={formatNumber}
            />
          </TabsContent>

          <TabsContent value="funds">
            <MetricTable
              metrics={metrics}
              totals={totals}
              metricKey="funds"
              formatValue={formatNumber}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface MetricTableProps {
  metrics: MonthlyMetrics[];
  totals: any;
  metricKey: 'users' | 'businesses' | 'revenue' | 'orders' | 'funds';
  formatValue: (n: number) => string;
}

function MetricTable({ metrics, totals, metricKey, formatValue }: MetricTableProps) {
  const getValue = (m: any, suffix: string) => m[`${metricKey}${suffix}`];
  const color = colorMap[metricKey];

  // Build sparkline data for each row showing cumulative progression
  const getSparklineData = (upToIndex: number) => {
    return metrics.slice(0, upToIndex + 1).map(m => getValue(m, '') as number);
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Mois</TableHead>
            <TableHead className="text-right">Réel</TableHead>
            <TableHead className="text-right">Δ M-1</TableHead>
            <TableHead className="text-right">Δ Y-1</TableHead>
            <TableHead className="w-[100px]">Tendance</TableHead>
            <TableHead className="text-right">Objectif</TableHead>
            <TableHead className="text-right">Atteinte</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((m, index) => (
            <TableRow key={m.month}>
              <TableCell className="font-medium capitalize">{m.label}</TableCell>
              <TableCell className="text-right font-semibold">
                {formatValue(getValue(m, ''))}
              </TableCell>
              <TableCell className="text-right">
                <VariationBadge value={getValue(m, 'VariationM1')} />
              </TableCell>
              <TableCell className="text-right">
                <VariationBadge value={getValue(m, 'VariationY1')} />
              </TableCell>
              <TableCell>
                <SparklineChart
                  data={getSparklineData(index)}
                  color={color}
                  height={24}
                  showArea={false}
                  showDot={false}
                />
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {getValue(m, 'Objective') ? formatValue(getValue(m, 'Objective')) : '—'}
              </TableCell>
              <TableCell className="text-right">
                <ObjectiveAttainmentBadge value={getValue(m, 'VsObjective')} />
              </TableCell>
            </TableRow>
          ))}
          {totals && (
            <TableRow className="bg-muted/50 font-bold">
              <TableCell>TOTAL</TableCell>
              <TableCell className="text-right">
                {formatValue(totals[metricKey])}
              </TableCell>
              <TableCell className="text-right">—</TableCell>
              <TableCell className="text-right">—</TableCell>
              <TableCell>
                <SparklineChart
                  data={metrics.map(m => getValue(m, '') as number)}
                  color={color}
                  height={24}
                  showArea={true}
                  showDot={true}
                />
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {totals[`${metricKey}Objective`] ? formatValue(totals[`${metricKey}Objective`]) : '—'}
              </TableCell>
              <TableCell className="text-right">
                <ObjectiveAttainmentBadge value={totals[`${metricKey}VsObjective`]} />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
