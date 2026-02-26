import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminCountryRestrictionAlert } from '@/components/admin/AdminCountryRestrictionAlert';
import { SimplePeriodSelector } from '@/components/admin/SimplePeriodSelector';
import { useMessagingDeliveryStats } from '@/hooks/useMessagingDeliveryStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Send, MessageSquare, Smartphone, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(142, 76%, 36%)', 'hsl(45, 88%, 63%)'];

const COUNTRY_NAMES: Record<string, string> = {
  '+225': 'Côte d\'Ivoire',
  '+221': 'Sénégal',
  '+229': 'Bénin',
  '+228': 'Togo',
  '+223': 'Mali',
  '+226': 'Burkina Faso',
};

export default function MessagingDeliveryDashboard() {
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | '90days'>('30days');
  const { data, isLoading, refetch } = useMessagingDeliveryStats(period);

  const kpis = data?.kpis;

  const pieChannelData = kpis ? [
    { name: 'WhatsApp', value: kpis.whatsapp_sent + kpis.whatsapp_failed },
    { name: 'SMS', value: kpis.sms_sent + kpis.sms_failed },
  ].filter(d => d.value > 0) : [];

  const pieStatusData = kpis ? [
    { name: 'Envoyés', value: kpis.total_sent },
    { name: 'Échoués', value: kpis.total_failed },
  ].filter(d => d.value > 0) : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Délivrabilité SMS & WhatsApp"
          description="Monitoring des envois de notifications par canal"
        />
        <AdminCountryRestrictionAlert />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <SimplePeriodSelector value={period} onChange={setPeriod} />
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Rafraîchir
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Send className="h-4 w-4" />
                Total envoyés
              </div>
              <p className="text-2xl font-bold font-poppins mt-1">{kpis?.total ?? '-'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MessageSquare className="h-4 w-4" />
                WhatsApp OK
              </div>
              <p className="text-2xl font-bold font-poppins mt-1 text-green-600">{kpis?.whatsapp_success_rate ?? 0}%</p>
              <p className="text-xs text-muted-foreground">{kpis?.whatsapp_sent ?? 0} / {(kpis?.whatsapp_sent ?? 0) + (kpis?.whatsapp_failed ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Smartphone className="h-4 w-4" />
                SMS OK
              </div>
              <p className="text-2xl font-bold font-poppins mt-1 text-blue-600">{kpis?.sms_success_rate ?? 0}%</p>
              <p className="text-xs text-muted-foreground">{kpis?.sms_sent ?? 0} / {(kpis?.sms_sent ?? 0) + (kpis?.sms_failed ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <AlertTriangle className="h-4 w-4" />
                Échecs
              </div>
              <p className="text-2xl font-bold font-poppins mt-1 text-destructive">{kpis?.total_failed ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Area Chart - Daily Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-poppins">Tendances quotidiennes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data?.daily ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), 'd MMM', { locale: fr })} />
                <YAxis />
                <Tooltip labelFormatter={(v) => format(new Date(v as string), 'dd MMM yyyy', { locale: fr })} />
                <Area type="monotone" dataKey="whatsapp_sent" name="WA envoyés" stackId="1" stroke="hsl(142, 76%, 36%)" fill="hsl(142, 76%, 36%)" fillOpacity={0.6} />
                <Area type="monotone" dataKey="whatsapp_failed" name="WA échoués" stackId="2" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.4} />
                <Area type="monotone" dataKey="sms_sent" name="SMS envoyés" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                <Area type="monotone" dataKey="sms_failed" name="SMS échoués" stackId="2" stroke="hsl(45, 88%, 63%)" fill="hsl(45, 88%, 63%)" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-poppins">Répartition par canal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieChannelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieChannelData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-poppins">Répartition par statut</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieStatusData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? 'hsl(142, 76%, 36%)' : 'hsl(var(--destructive))'} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Table by alert type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-poppins">Par type d'alerte</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">WA ✓</TableHead>
                  <TableHead className="text-right">WA ✗</TableHead>
                  <TableHead className="text-right">SMS ✓</TableHead>
                  <TableHead className="text-right">SMS ✗</TableHead>
                  <TableHead className="text-right">Taux succès</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.by_alert_type ?? []).map((row) => (
                  <TableRow key={row.alert_type}>
                    <TableCell className="font-medium">{row.alert_type}</TableCell>
                    <TableCell className="text-right text-green-600">{row.wa_sent}</TableCell>
                    <TableCell className="text-right text-destructive">{row.wa_failed}</TableCell>
                    <TableCell className="text-right text-blue-600">{row.sms_sent}</TableCell>
                    <TableCell className="text-right text-destructive">{row.sms_failed}</TableCell>
                    <TableCell className="text-right font-semibold">{row.success_rate}%</TableCell>
                  </TableRow>
                ))}
                {(data?.by_alert_type ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Aucune donnée</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Table by country */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-poppins">Par pays (préfixe téléphonique)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Préfixe</TableHead>
                  <TableHead>Pays</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">WhatsApp</TableHead>
                  <TableHead className="text-right">SMS</TableHead>
                  <TableHead className="text-right">Taux succès</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.by_country ?? []).map((row) => (
                  <TableRow key={row.country_prefix}>
                    <TableCell className="font-mono font-medium">{row.country_prefix}</TableCell>
                    <TableCell>{COUNTRY_NAMES[row.country_prefix] ?? 'Autre'}</TableCell>
                    <TableCell className="text-right">{row.total}</TableCell>
                    <TableCell className="text-right">{row.whatsapp_count}</TableCell>
                    <TableCell className="text-right">{row.sms_count}</TableCell>
                    <TableCell className="text-right font-semibold">{row.success_rate}%</TableCell>
                  </TableRow>
                ))}
                {(data?.by_country ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Aucune donnée</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top errors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-poppins flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Erreurs récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message d'erreur</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-right">Occurrences</TableHead>
                  <TableHead className="text-right">Dernière</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.top_errors ?? []).map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="max-w-xs truncate text-sm">{row.error_message}</TableCell>
                    <TableCell>{row.channel}</TableCell>
                    <TableCell className="text-right font-semibold">{row.occurrences}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {format(new Date(row.last_occurrence), 'dd/MM HH:mm', { locale: fr })}
                    </TableCell>
                  </TableRow>
                ))}
                {(data?.top_errors ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      <CheckCircle className="h-5 w-5 inline mr-2 text-green-600" />
                      Aucune erreur sur la période
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
