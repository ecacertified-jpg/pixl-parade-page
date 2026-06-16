import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Loader2, Search, Sparkles, Crown, Image as ImageIcon, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

type Status = 'pending' | 'paid' | 'activated' | 'cancelled' | 'refunded';
type Kind = 'boost' | 'vip_badge' | 'premium_card' | 'digital_gift';

interface Row {
  id: string;
  user_id: string;
  kind: Kind;
  post_id: string | null;
  amount_xof: number;
  duration_hours: number | null;
  status: Status;
  wave_reference: string | null;
  metadata: Record<string, unknown> | null;
  activated_at: string | null;
  created_at: string;
  profile?: { first_name: string | null; last_name: string | null; phone: string | null } | null;
}

const KIND_LABEL: Record<Kind, string> = {
  boost: 'Boost',
  vip_badge: 'Badge VIP',
  premium_card: 'Carte premium',
  digital_gift: 'Cadeau digital',
};

const KIND_ICON: Record<Kind, React.ComponentType<{ className?: string }>> = {
  boost: Sparkles,
  vip_badge: Crown,
  premium_card: ImageIcon,
  digital_gift: Gift,
};

function usePremiumOrders(status: Status) {
  return useQuery({
    queryKey: ['admin-celebration-premium-orders', status],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('celebration_premium_orders')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      const rows = (data ?? []) as Row[];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      if (userIds.length) {
        const { data: profiles } = await (supabase as any)
          .from('profiles')
          .select('user_id, first_name, last_name, phone')
          .in('user_id', userIds);
        const byId = new Map<string, Row['profile']>(
          (profiles ?? []).map((p: any) => [p.user_id as string, p as Row['profile']]),
        );
        for (const r of rows) r.profile = byId.get(r.user_id) ?? null;
      }
      return rows;
    },
    refetchInterval: 30_000,
  });
}

export default function CelebrationPremiumOrders() {
  const [tab, setTab] = useState<Status>('pending');
  const [search, setSearch] = useState('');
  const { data: rows = [], isLoading } = usePremiumOrders(tab);
  const qc = useQueryClient();

  const [activateRow, setActivateRow] = useState<Row | null>(null);
  const [waveRef, setWaveRef] = useState('');

  const invoke = useMutation({
    mutationFn: async (req: { order_id: string; action: 'activate' | 'cancel' | 'refund'; wave_reference?: string }) => {
      const { data, error } = await supabase.functions.invoke('activate-celebration-premium-order', { body: req });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: (_d, vars) => {
      toast.success(
        vars.action === 'activate'
          ? 'Commande activée ✨'
          : vars.action === 'refund'
          ? 'Commande remboursée'
          : 'Commande annulée',
      );
      qc.invalidateQueries({ queryKey: ['admin-celebration-premium-orders'] });
      setActivateRow(null);
      setWaveRef('');
    },
    onError: (e: any) => toast.error(e?.message || 'Erreur'),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const full = `${r.profile?.first_name ?? ''} ${r.profile?.last_name ?? ''}`.toLowerCase();
      return (
        full.includes(q) ||
        (r.profile?.phone ?? '').toLowerCase().includes(q) ||
        (r.wave_reference ?? '').toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const pendingCount = usePremiumOrders('pending').data?.length ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-poppins text-2xl font-semibold">Commandes Premium · Célébrer</h1>
          <p className="text-sm text-muted-foreground">
            Valide les paiements Wave pour activer boosts, badges VIP, cartes premium et cadeaux.
          </p>
        </div>
        <Badge variant="secondary">{pendingCount} en attente</Badge>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="activated">Activées</TabsTrigger>
          <TabsTrigger value="cancelled">Annulées</TabsTrigger>
          <TabsTrigger value="refunded">Remboursées</TabsTrigger>
        </TabsList>

        <div className="my-4 flex items-center gap-2 rounded-lg border bg-background/50 px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Recherche nom, téléphone, référence ou id"
            className="border-0 focus-visible:ring-0"
          />
        </div>

        <TabsContent value={tab} className="space-y-3">
          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Aucune commande</p>
          ) : (
            filtered.map((row) => {
              const Icon = KIND_ICON[row.kind];
              return (
                <Card key={row.id} className="p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <p className="font-medium">
                          {row.profile?.first_name ?? ''} {row.profile?.last_name ?? ''}
                        </p>
                        <Badge variant="outline">{KIND_LABEL[row.kind]}</Badge>
                        {row.duration_hours && (
                          <Badge variant="secondary">{row.duration_hours} h</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row.profile?.phone ?? '—'} · {new Date(row.created_at).toLocaleString('fr-FR')}
                      </p>
                      {row.post_id && (
                        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                          post {row.post_id.slice(0, 8)}…
                        </p>
                      )}
                      {row.wave_reference && (
                        <p className="mt-1 text-xs">
                          Réf. Wave : <span className="font-mono">{row.wave_reference}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-poppins text-lg font-semibold">
                          {new Intl.NumberFormat('fr-FR').format(row.amount_xof)} FCFA
                        </p>
                      </div>
                      {row.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setActivateRow(row)}>
                            <Check className="mr-1 h-4 w-4" /> Activer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => invoke.mutate({ order_id: row.id, action: 'cancel' })}
                            disabled={invoke.isPending}
                          >
                            <X className="mr-1 h-4 w-4" /> Annuler
                          </Button>
                        </div>
                      )}
                      {row.status === 'activated' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => invoke.mutate({ order_id: row.id, action: 'refund' })}
                          disabled={invoke.isPending}
                        >
                          Rembourser
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!activateRow} onOpenChange={(v) => !v && setActivateRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activer la commande</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Active <strong>{activateRow ? KIND_LABEL[activateRow.kind] : ''}</strong> pour{' '}
              <strong>
                {activateRow?.profile?.first_name} {activateRow?.profile?.last_name}
              </strong>{' '}
              ({activateRow ? new Intl.NumberFormat('fr-FR').format(activateRow.amount_xof) : 0} FCFA).
            </p>
            <Input
              value={waveRef}
              onChange={(e) => setWaveRef(e.target.value)}
              placeholder="Référence transaction Wave (optionnel)"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActivateRow(null)}>
              Annuler
            </Button>
            <Button
              onClick={() =>
                activateRow &&
                invoke.mutate({
                  order_id: activateRow.id,
                  action: 'activate',
                  wave_reference: waveRef || undefined,
                })
              }
              disabled={invoke.isPending}
            >
              {invoke.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Activer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}