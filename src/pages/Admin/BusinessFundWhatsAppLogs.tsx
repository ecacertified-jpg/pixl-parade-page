import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useBusinessFundWhatsAppLogs } from '@/hooks/useBusinessFundWhatsAppLogs';
import { SimplePeriodSelector } from '@/components/admin/SimplePeriodSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Send, CheckCircle, XCircle, Percent, MessageSquare, Users, Store } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return phone;
  const last4 = phone.slice(-4);
  const prefix = phone.slice(0, phone.indexOf(' ') > 0 ? phone.indexOf(' ') + 1 : 4);
  return `${prefix} ** ** ** ${last4.slice(0, 2)} ${last4.slice(2)}`;
}

type TemplateType = 'joiedevivre_group_contribution' | 'joiedevivre_fund_ready';

interface ColumnConfig {
  headers: string[];
  extract: (params: unknown) => Record<string, string | undefined>;
}

const COLUMN_CONFIGS: Record<TemplateType, ColumnConfig> = {
  joiedevivre_group_contribution: {
    headers: ['Bénéficiaire', 'Montant', 'Produit'],
    extract: (params) => {
      const arr = Array.isArray(params) ? params : [];
      return { beneficiaire: arr[1], montant: arr[2], produit: arr[3] };
    },
  },
  joiedevivre_fund_ready: {
    headers: ['Titre cagnotte', 'Montant', 'Produit', 'Bénéficiaire'],
    extract: (params) => {
      const arr = Array.isArray(params) ? params : [];
      return { titre: arr[1], montant: arr[2], produit: arr[3], beneficiaire: arr[4] };
    },
  },
};

function LogsTab({ templateName, period }: { templateName: TemplateType; period: 'today' | '7days' | '30days' | '90days' }) {
  const { logs, kpis, isLoading, refetch } = useBusinessFundWhatsAppLogs(period, templateName);
  const config = COLUMN_CONFIGS[templateName];

  const kpiCards = [
    { label: 'Total envois', value: kpis.total, icon: Send, color: 'text-primary' },
    { label: 'Succès', value: kpis.success, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Échecs', value: kpis.failed, icon: XCircle, color: 'text-destructive' },
    { label: 'Taux succès', value: `${kpis.successRate}%`, icon: Percent, color: 'text-accent' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Logs d'envoi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 && !isLoading ? (
            <p className="text-center text-muted-foreground py-8">Aucun log sur cette période</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Destinataire</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Statut</TableHead>
                    {config.headers.map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                    <TableHead>Erreur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const params = config.extract(log.body_params);
                    const paramValues = Object.values(params);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{maskPhone(log.recipient_phone)}</TableCell>
                        <TableCell>{log.country_prefix || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                            {log.status === 'sent' ? 'Succès' : 'Échec'}
                          </Badge>
                        </TableCell>
                        {paramValues.map((v, i) => (
                          <TableCell key={i} className="text-xs max-w-[150px] truncate">{v || '—'}</TableCell>
                        ))}
                        <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                          {log.error_message || '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function BusinessFundWhatsAppLogs() {
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | '90days'>('30days');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-poppins">WA Cagnottes Business</h1>
            <p className="text-sm text-muted-foreground">Suivi des envois WhatsApp : invitations amis & notifications prestataires</p>
          </div>
          <SimplePeriodSelector value={period} onChange={setPeriod} />
        </div>

        <Tabs defaultValue="contribution" className="w-full">
          <TabsList>
            <TabsTrigger value="contribution" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Invitations amis
            </TabsTrigger>
            <TabsTrigger value="fund_ready" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Notification prestataire
            </TabsTrigger>
          </TabsList>
          <TabsContent value="contribution">
            <LogsTab templateName="joiedevivre_group_contribution" period={period} />
          </TabsContent>
          <TabsContent value="fund_ready">
            <LogsTab templateName="joiedevivre_fund_ready" period={period} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
