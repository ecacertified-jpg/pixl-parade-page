import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SimplePeriodSelector } from '@/components/admin/SimplePeriodSelector';
import { useWhatsAppTemplateStats, getCountryName } from '@/hooks/useWhatsAppTemplateStats';
import { RefreshCw, Send, CheckCircle, XCircle, LayoutGrid, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type Period = 'today' | '7days' | '30days' | '90days';

export default function WhatsAppTemplateDashboard() {
  const [period, setPeriod] = useState<Period>('30days');
  const { data, isLoading, refetch } = useWhatsAppTemplateStats(period);

  const kpis = data?.kpis;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-poppins">Templates WhatsApp</h1>
            <p className="text-sm text-muted-foreground">Suivi des taux de succès par template et par pays</p>
          </div>
          <div className="flex items-center gap-3">
            <SimplePeriodSelector value={period} onChange={setPeriod} />
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="Total envoyés" value={kpis?.total ?? 0} icon={<Send className="h-5 w-5" />} loading={isLoading} />
          <KpiCard title="Taux de succès" value={`${kpis?.success_rate ?? 0}%`} icon={<CheckCircle className="h-5 w-5" />} loading={isLoading} color={getSuccessColor(kpis?.success_rate ?? 100)} />
          <KpiCard title="Templates actifs" value={kpis?.templates_count ?? 0} icon={<LayoutGrid className="h-5 w-5" />} loading={isLoading} />
          <KpiCard title="Échecs" value={kpis?.failed ?? 0} icon={<XCircle className="h-5 w-5" />} loading={isLoading} color="text-destructive" />
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendance quotidienne</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.daily && data.daily.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.daily}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" tickFormatter={(d) => format(new Date(d), 'dd MMM', { locale: fr })} className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip labelFormatter={(d) => format(new Date(d as string), 'dd MMMM yyyy', { locale: fr })} />
                  <Area type="monotone" dataKey="sent" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.3)" name="Envoyés" />
                  <Area type="monotone" dataKey="failed" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.3)" name="Échoués" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Aucune donnée pour cette période</p>
            )}
          </CardContent>
        </Card>

        {/* Tables */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* By template */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Par template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.by_template?.length ? data.by_template.map((t) => (
                  <div key={t.template_name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate max-w-[200px]">{t.template_name}</span>
                      <span className={getSuccessColor(t.success_rate)}>{t.success_rate}%</span>
                    </div>
                    <Progress value={t.success_rate} className="h-2" indicatorClassName={getProgressColor(t.success_rate)} />
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{t.sent} ✓</span>
                      <span>{t.failed} ✗</span>
                      <span>{t.total} total</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-muted-foreground py-6">Aucune donnée</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* By country */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Par pays</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.by_country?.length ? data.by_country.map((c) => (
                  <div key={c.country_prefix} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{getCountryName(c.country_prefix)} <span className="text-muted-foreground">({c.country_prefix})</span></span>
                      <span className={getSuccessColor(c.success_rate)}>{c.success_rate}%</span>
                    </div>
                    <Progress value={c.success_rate} className="h-2" indicatorClassName={getProgressColor(c.success_rate)} />
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{c.sent} ✓</span>
                      <span>{c.failed} ✗</span>
                      <span>{c.total} total</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-muted-foreground py-6">Aucune donnée</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top errors */}
        {data?.top_errors && data.top_errors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Top erreurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="pb-2 font-medium">Template</th>
                      <th className="pb-2 font-medium">Erreur</th>
                      <th className="pb-2 font-medium text-right">Occurrences</th>
                      <th className="pb-2 font-medium text-right">Dernière</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_errors.map((e, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 font-medium">{e.template_name}</td>
                        <td className="py-2 text-muted-foreground max-w-[300px] truncate">{e.error_message}</td>
                        <td className="py-2 text-right text-destructive font-semibold">{e.occurrences}</td>
                        <td className="py-2 text-right text-muted-foreground">{format(new Date(e.last_occurrence), 'dd/MM HH:mm')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

function KpiCard({ title, value, icon, loading, color }: { title: string; value: string | number; icon: React.ReactNode; loading: boolean; color?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color || ''}`}>{loading ? '...' : value}</p>
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function getSuccessColor(rate: number): string {
  if (rate >= 95) return 'text-green-600';
  if (rate >= 80) return 'text-yellow-600';
  return 'text-destructive';
}

function getProgressColor(rate: number): string {
  if (rate >= 95) return 'bg-green-500';
  if (rate >= 80) return 'bg-yellow-500';
  return 'bg-destructive';
}
