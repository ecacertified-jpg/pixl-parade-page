import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { SimplePeriodSelector } from '@/components/admin/SimplePeriodSelector';
import { ExportButton } from '@/components/admin/ExportButton';
import { exportToCSV, ExportColumn, formatNumberFr, formatDateFr, formatCurrencyXOF } from '@/utils/exportUtils';
import { DollarSign, Users, TrendingUp, Percent, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

type SimplePeriod = 'today' | '7days' | '30days' | '90days';

function getPeriodDays(period: SimplePeriod): number {
  switch (period) {
    case 'today': return 1;
    case '7days': return 7;
    case '30days': return 30;
    case '90days': return 90;
  }
}

interface SplitRow {
  id: string;
  created_at: string;
  total_client_amount: number;
  vendor_amount: number;
  platform_amount: number;
  markup_rate: number;
  vendor_transfer_status: string;
  platform_transfer_status: string;
  currency: string;
  payment_method: string;
  vendor_transfer_ref: string | null;
  platform_transfer_ref: string | null;
  business_orders: {
    id: string;
    business_accounts: {
      business_name: string;
    } | null;
  } | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  simulated: { label: 'Simulé', variant: 'secondary' },
  pending: { label: 'En attente', variant: 'outline' },
  completed: { label: 'Complété', variant: 'default' },
  failed: { label: 'Échoué', variant: 'destructive' },
  received: { label: 'Reçu', variant: 'default' },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function CommissionsDashboard() {
  const [period, setPeriod] = useState<SimplePeriod>('30days');
  const [transferModal, setTransferModal] = useState<{ open: boolean; splitId: string; businessName: string }>({ open: false, splitId: '', businessName: '' });
  const [transferRef, setTransferRef] = useState('');
  const queryClient = useQueryClient();

  const startDate = useMemo(() => {
    return subDays(new Date(), getPeriodDays(period)).toISOString();
  }, [period]);

  const { data: splits = [], isLoading } = useQuery({
    queryKey: ['admin-commissions', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_splits')
        .select('*, business_orders(id, business_accounts(business_name))')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as SplitRow[];
    },
  });

  const markTransferMutation = useMutation({
    mutationFn: async ({ splitId, ref }: { splitId: string; ref: string }) => {
      const { error } = await supabase
        .from('payment_splits')
        .update({
          vendor_transfer_status: 'completed',
          vendor_transfer_ref: ref || null,
        })
        .eq('id', splitId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Transfert marqué comme complété');
      queryClient.invalidateQueries({ queryKey: ['admin-commissions'] });
      setTransferModal({ open: false, splitId: '', businessName: '' });
      setTransferRef('');
    },
    onError: (err: Error) => {
      toast.error('Erreur: ' + err.message);
    },
  });

  const kpis = useMemo(() => {
    const totalPlatform = splits.reduce((s, r) => s + r.platform_amount, 0);
    const totalVendor = splits.reduce((s, r) => s + r.vendor_amount, 0);
    const avgMarkup = splits.length > 0
      ? splits.reduce((s, r) => s + r.markup_rate, 0) / splits.length
      : 0;
    return { totalPlatform, totalVendor, count: splits.length, avgMarkup };
  }, [splits]);

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    splits.forEach((s) => {
      const day = format(new Date(s.created_at), 'yyyy-MM-dd');
      map.set(day, (map.get(day) || 0) + s.platform_amount);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date: format(new Date(date), 'd MMM', { locale: fr }),
        commission: amount,
      }));
  }, [splits]);

  const handleExport = () => {
    const columns: ExportColumn<SplitRow>[] = [
      { key: 'created_at', header: 'Date', format: (v) => formatDateFr(v) },
      { key: 'business_orders', header: 'Prestataire', format: (_, r) => r.business_orders?.business_accounts?.business_name || '-' },
      { key: 'total_client_amount', header: 'Montant client', format: (v) => formatCurrencyXOF(v) },
      { key: 'vendor_amount', header: 'Part prestataire', format: (v) => formatCurrencyXOF(v) },
      { key: 'platform_amount', header: 'Commission JDV', format: (v) => formatCurrencyXOF(v) },
      { key: 'markup_rate', header: 'Markup %', format: (v) => `${(v * 100).toFixed(1)}%` },
      { key: 'vendor_transfer_status', header: 'Statut vendeur' },
      { key: 'platform_transfer_status', header: 'Statut plateforme' },
    ];
    exportToCSV(splits, columns, 'commissions_jdv');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold font-poppins">Commissions JDV</h1>
            <p className="text-sm text-muted-foreground">Historique des splits de paiement Wave</p>
          </div>
          <div className="flex items-center gap-3">
            <SimplePeriodSelector value={period} onChange={setPeriod} />
            <ExportButton onExportCSV={handleExport} disabled={splits.length === 0} />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Commission JDV</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumberFr(kpis.totalPlatform)} <span className="text-sm font-normal text-muted-foreground">XOF</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Versé prestataires</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumberFr(kpis.totalVendor)} <span className="text-sm font-normal text-muted-foreground">XOF</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Markup moyen</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(kpis.avgMarkup * 100).toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {chartData.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Évolution des commissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => formatNumberFr(v)} />
                    <Tooltip formatter={(v: number) => [formatCurrencyXOF(v), 'Commission']} />
                    <Area type="monotone" dataKey="commission" className="fill-primary/20 stroke-primary" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détail des splits</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Chargement…</p>
            ) : splits.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucun split sur cette période</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Prestataire</TableHead>
                      <TableHead className="text-right">Client</TableHead>
                      <TableHead className="text-right">Prestataire</TableHead>
                      <TableHead className="text-right">JDV</TableHead>
                      <TableHead className="text-right">Markup</TableHead>
                      <TableHead>Vendeur</TableHead>
                      <TableHead>Plateforme</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {splits.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(s.created_at), 'dd/MM/yy HH:mm')}
                        </TableCell>
                        <TableCell className="text-sm">
                          {s.business_orders?.business_accounts?.business_name || '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm">{formatNumberFr(s.total_client_amount)}</TableCell>
                        <TableCell className="text-right text-sm">{formatNumberFr(s.vendor_amount)}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatNumberFr(s.platform_amount)}</TableCell>
                        <TableCell className="text-right text-sm">{(s.markup_rate * 100).toFixed(1)}%</TableCell>
                        <TableCell><StatusBadge status={s.vendor_transfer_status} /></TableCell>
                        <TableCell><StatusBadge status={s.platform_transfer_status} /></TableCell>
                        <TableCell>
                          {s.vendor_transfer_status === 'pending' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs gap-1"
                              onClick={() => setTransferModal({
                                open: true,
                                splitId: s.id,
                                businessName: s.business_orders?.business_accounts?.business_name || 'Prestataire',
                              })}
                            >
                              <CheckCircle className="h-3 w-3" />
                              Transféré
                            </Button>
                          ) : s.vendor_transfer_status === 'completed' && s.vendor_transfer_ref ? (
                            <span className="text-xs text-muted-foreground">Réf: {s.vendor_transfer_ref}</span>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transfer confirmation modal */}
      <Dialog open={transferModal.open} onOpenChange={(open) => !open && setTransferModal({ open: false, splitId: '', businessName: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le transfert au prestataire</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Confirmez que vous avez transféré le montant à <strong>{transferModal.businessName}</strong> via Wave ou Mobile Money.
          </p>
          <Input
            placeholder="Référence du transfert (optionnel)"
            value={transferRef}
            onChange={(e) => setTransferRef(e.target.value)}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTransferModal({ open: false, splitId: '', businessName: '' })}>
              Annuler
            </Button>
            <Button
              onClick={() => markTransferMutation.mutate({ splitId: transferModal.splitId, ref: transferRef })}
              disabled={markTransferMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {markTransferMutation.isPending ? 'Envoi...' : 'Confirmer le transfert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}