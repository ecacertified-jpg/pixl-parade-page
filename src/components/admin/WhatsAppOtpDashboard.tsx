import { useState } from 'react';
import { useWhatsAppOtpStats, OtpCountryData, OtpRecentEntry } from '@/hooks/useWhatsAppOtpStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const COUNTRY_MAP: Record<string, { name: string; flag: string }> = {
  CI: { name: "Côte d'Ivoire", flag: '🇨🇮' },
  BJ: { name: 'Bénin', flag: '🇧🇯' },
  SN: { name: 'Sénégal', flag: '🇸🇳' },
  TG: { name: 'Togo', flag: '🇹🇬' },
  ML: { name: 'Mali', flag: '🇲🇱' },
  BF: { name: 'Burkina Faso', flag: '🇧🇫' },
  OTHER: { name: 'Autre', flag: '🌍' },
};

const PIE_COLORS = ['hsl(259, 58%, 59%)', 'hsl(330, 70%, 65%)', 'hsl(45, 88%, 63%)', 'hsl(142, 76%, 36%)', 'hsl(200, 70%, 50%)', 'hsl(15, 80%, 55%)', 'hsl(0, 0%, 60%)'];

function getCountryFromPhone(phone: string): string {
  if (phone.startsWith('+225')) return 'CI';
  if (phone.startsWith('+229')) return 'BJ';
  if (phone.startsWith('+221')) return 'SN';
  if (phone.startsWith('+228')) return 'TG';
  if (phone.startsWith('+223')) return 'ML';
  if (phone.startsWith('+226')) return 'BF';
  return 'OTHER';
}

export function WhatsAppOtpDashboard() {
  const [period, setPeriod] = useState(30);
  const { data: stats, isLoading, error } = useWhatsAppOtpStats(period);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Erreur lors du chargement des statistiques OTP.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <Tabs value={String(period)} onValueChange={(v) => setPeriod(Number(v))}>
        <TabsList>
          <TabsTrigger value="7">7 jours</TabsTrigger>
          <TabsTrigger value="30">30 jours</TabsTrigger>
          <TabsTrigger value="90">90 jours</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Send} label="OTP envoyés" value={stats.total_sent} />
        <KpiCard icon={CheckCircle2} label="Taux de succès" value={`${stats.success_rate}%`} accent />
        <KpiCard icon={Clock} label="Temps moyen" value={`${stats.avg_verification_seconds}s`} />
        <KpiCard icon={XCircle} label="OTP expirés" value={stats.total_expired} variant="destructive" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart - daily trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Évolution quotidienne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.daily}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => format(new Date(v), 'dd/MM', { locale: fr })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    labelFormatter={(v) => format(new Date(v as string), 'dd MMM yyyy', { locale: fr })}
                    contentStyle={{ borderRadius: '0.5rem', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area type="monotone" dataKey="sent" name="Envoyés" stroke="hsl(259, 58%, 59%)" fill="hsl(259, 58%, 59%)" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="verified" name="Vérifiés" stroke="hsl(142, 76%, 36%)" fill="hsl(142, 76%, 36%)" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - country distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Par pays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.by_country}
                    dataKey="total"
                    nameKey="country_code"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ country_code, total }: OtpCountryData) =>
                      `${COUNTRY_MAP[country_code]?.flag || '🌍'} ${total}`
                    }
                  >
                    {stats.by_country.map((entry, i) => (
                      <Cell key={entry.country_code} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value: string) => COUNTRY_MAP[value]?.name || value}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [value, COUNTRY_MAP[name]?.name || name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent OTPs table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Derniers OTP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Pays</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Temps</TableHead>
                  <TableHead>Tentatives</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recent.map((otp: OtpRecentEntry) => {
                  const country = getCountryFromPhone(otp.phone);
                  return (
                    <TableRow key={otp.id}>
                      <TableCell className="font-mono text-sm">
                        {otp.phone.slice(0, 4)}****{otp.phone.slice(-3)}
                      </TableCell>
                      <TableCell>
                        <span>{COUNTRY_MAP[country]?.flag} {COUNTRY_MAP[country]?.name}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(otp.created_at), 'dd/MM HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={otp.status} />
                      </TableCell>
                      <TableCell>
                        {otp.verification_seconds != null ? `${otp.verification_seconds}s` : '—'}
                      </TableCell>
                      <TableCell>{otp.attempts}</TableCell>
                    </TableRow>
                  );
                })}
                {stats.recent.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Aucun OTP sur cette période
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, accent, variant }: {
  icon: any;
  label: string;
  value: string | number;
  accent?: boolean;
  variant?: 'destructive';
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${accent ? 'bg-primary/10' : variant === 'destructive' ? 'bg-destructive/10' : 'bg-muted'}`}>
            <Icon className={`h-5 w-5 ${accent ? 'text-primary' : variant === 'destructive' ? 'text-destructive' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'verified':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Vérifié</Badge>;
    case 'expired':
      return <Badge variant="destructive">Expiré</Badge>;
    default:
      return <Badge variant="secondary">En attente</Badge>;
  }
}
