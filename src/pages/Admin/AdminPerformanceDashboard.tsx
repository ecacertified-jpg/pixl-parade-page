import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Users, BarChart3 } from 'lucide-react';
import { useAdminPerformance, UseAdminPerformanceOptions } from '@/hooks/useAdminPerformance';
import { AdminPerformanceKPICards } from '@/components/admin/AdminPerformanceKPICards';
import { AdminPerformanceTable } from '@/components/admin/AdminPerformanceTable';
import { AdminActionBreakdownPie } from '@/components/admin/AdminActionBreakdownPie';
import { CountryPerformanceCards } from '@/components/admin/CountryPerformanceCards';
import { exportToCSV, ExportColumn } from '@/utils/exportUtils';
import { useAdmin } from '@/hooks/useAdmin';
import { useAdminCountry } from '@/contexts/AdminCountryContext';

const PERIODS: { value: UseAdminPerformanceOptions['period']; label: string }[] = [
  { value: 'today', label: "Aujourd'hui" },
  { value: '7days', label: '7 derniers jours' },
  { value: '30days', label: '30 derniers jours' },
  { value: '90days', label: '90 derniers jours' },
];

export default function AdminPerformanceDashboard() {
  const [period, setPeriod] = useState<UseAdminPerformanceOptions['period']>('30days');
  const { selectedCountry } = useAdminCountry();
  const { isSuperAdmin } = useAdmin();

  const { adminPerformance, kpis, loading, refetch } = useAdminPerformance({
    period,
    countryFilter: selectedCountry,
  });

  const handleExport = () => {
    const columns: ExportColumn<typeof adminPerformance[0]>[] = [
      { key: 'adminName', header: 'Administrateur' },
      { key: 'role', header: 'Rôle' },
      { 
        key: 'assignedCountries', 
        header: 'Pays assignés',
        format: (value) => value ? value.join(', ') : 'Tous'
      },
      { key: 'totalActions', header: 'Actions totales' },
      { 
        key: 'avgResponseTimeMinutes', 
        header: 'Temps de réponse moyen (min)',
        format: (value) => value !== null ? Math.round(value).toString() : 'N/A'
      },
      { key: 'notificationsProcessed', header: 'Notifications traitées' },
      { key: 'performanceScore', header: 'Score de performance (%)' },
      { 
        key: 'actionBreakdown', 
        header: 'Approbations',
        format: (value) => value.approvals.toString()
      },
      { 
        key: 'actionBreakdown', 
        header: 'Suppressions',
        format: (value) => value.deletions.toString()
      },
    ];

    exportToCSV(adminPerformance, columns, 'performance-admins');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-primary" />
              Performance des administrateurs
            </h1>
            <p className="text-muted-foreground mt-1">
              Tableau de bord des KPIs de gestion par admin régional
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" onClick={refetch} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button variant="outline" onClick={handleExport} disabled={loading || adminPerformance.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <AdminPerformanceKPICards kpis={kpis} loading={loading} />

        {/* Admin Ranking Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Classement des administrateurs
            </CardTitle>
            <CardDescription>
              Classement basé sur le score de performance (activité, temps de réponse, notifications traitées)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminPerformanceTable data={adminPerformance} loading={loading} />
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Action Breakdown Pie */}
          <AdminActionBreakdownPie data={kpis.actionsByType} loading={loading} />

          {/* Performance Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Résumé de la période</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Admins actifs</p>
                  <p className="text-2xl font-bold">
                    {adminPerformance.filter(a => a.totalActions > 0).length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    sur {adminPerformance.length} total
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Score moyen</p>
                  <p className="text-2xl font-bold">
                    {adminPerformance.length > 0
                      ? Math.round(adminPerformance.reduce((s, a) => s + a.performanceScore, 0) / adminPerformance.length)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    performance équipe
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <h4 className="font-medium text-sm">Indicateurs de performance</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Excellent (&gt;80%): Temps &lt;2h, activité élevée</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Moyen (50-80%): Temps 2-6h, activité modérée</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>À améliorer (&lt;50%): Temps &gt;6h, faible activité</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Country Performance */}
        {isSuperAdmin && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Performance par pays</h2>
            <CountryPerformanceCards data={adminPerformance} loading={loading} />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
