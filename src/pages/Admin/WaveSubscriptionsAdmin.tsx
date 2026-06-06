import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Loader2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

type Status = 'pending' | 'confirmed' | 'rejected' | 'expired';

interface WaveRow {
  id: string;
  user_id: string;
  plan_tier: 'essentiel' | 'premium';
  billing_cycle: 'monthly' | 'yearly';
  amount_xof: number;
  status: Status;
  transaction_reference: string | null;
  reviewer_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  profile?: { first_name: string | null; last_name: string | null; phone: string | null; country_code: string | null } | null;
}

function useWaveRequests(status: Status) {
  return useQuery({
    queryKey: ['admin-wave-requests', status],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('wave_subscription_requests')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      const rows = (data ?? []) as WaveRow[];

      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      if (userIds.length) {
        const { data: profiles } = await (supabase as any)
          .from('profiles')
          .select('user_id, first_name, last_name, phone, country_code')
          .in('user_id', userIds);
        const byId = new Map<string, NonNullable<WaveRow['profile']>>(
          (profiles ?? []).map((p: any) => [p.user_id as string, p as NonNullable<WaveRow['profile']>]),
        );
        for (const r of rows) r.profile = byId.get(r.user_id) ?? null;
      }
      return rows;
    },
    refetchInterval: 30_000,
  });
}

export default function WaveSubscriptionsAdmin() {
  const [tab, setTab] = useState<Status>('pending');
  const [search, setSearch] = useState('');
  const { data: rows = [], isLoading, refetch } = useWaveRequests(tab);
  const qc = useQueryClient();

  const [confirmRow, setConfirmRow] = useState<WaveRow | null>(null);
  const [rejectRow, setRejectRow] = useState<WaveRow | null>(null);
  const [txRef, setTxRef] = useState('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  const confirmMut = useMutation({
    mutationFn: async (req: { request_id: string; transaction_reference?: string; reviewer_notes?: string }) => {
      const { data, error } = await supabase.functions.invoke('confirm-wave-subscription', { body: req });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      toast.success('Abonnement activé ✨');
      qc.invalidateQueries({ queryKey: ['admin-wave-requests'] });
      setConfirmRow(null);
      setTxRef('');
      setNotes('');
    },
    onError: (e: any) => toast.error(e?.message || 'Erreur'),
  });

  const rejectMut = useMutation({
    mutationFn: async (req: { request_id: string; reason: string }) => {
      const { data, error } = await supabase.functions.invoke('reject-wave-subscription', { body: req });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      toast.success('Demande rejetée');
      qc.invalidateQueries({ queryKey: ['admin-wave-requests'] });
      setRejectRow(null);
      setReason('');
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
        (r.transaction_reference ?? '').toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const pendingCount = useWaveRequests('pending').data?.length ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-poppins text-2xl font-semibold">Abonnements Wave</h1>
          <p className="text-sm text-muted-foreground">
            Valide ou rejette les paiements Wave reçus pour activer les abonnements JDV.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{pendingCount} en attente</Badge>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmées</TabsTrigger>
          <TabsTrigger value="rejected">Rejetées</TabsTrigger>
          <TabsTrigger value="expired">Expirées</TabsTrigger>
        </TabsList>

        <div className="my-4 flex items-center gap-2 rounded-lg border bg-background/50 px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Recherche nom, téléphone ou référence"
            className="border-0 focus-visible:ring-0"
          />
        </div>

        <TabsContent value={tab} className="space-y-3">
          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Aucune demande</p>
          ) : (
            filtered.map((row) => (
              <Card key={row.id} className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {row.profile?.first_name ?? ''} {row.profile?.last_name ?? ''}
                      </p>
                      <Badge variant="outline" className="capitalize">{row.plan_tier}</Badge>
                      <Badge variant="secondary">{row.billing_cycle === 'yearly' ? 'Annuel' : 'Mensuel'}</Badge>
                      {row.profile?.country_code && <Badge variant="outline">{row.profile.country_code}</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.profile?.phone ?? '—'} · {new Date(row.created_at).toLocaleString('fr-FR')}
                    </p>
                    {row.transaction_reference && (
                      <p className="mt-1 text-xs">Réf. TX : <span className="font-mono">{row.transaction_reference}</span></p>
                    )}
                    {row.reviewer_notes && (
                      <p className="mt-1 text-xs text-muted-foreground">Note : {row.reviewer_notes}</p>
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
                        <Button size="sm" onClick={() => setConfirmRow(row)}>
                          <Check className="mr-1 h-4 w-4" /> Confirmer
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setRejectRow(row)}>
                          <X className="mr-1 h-4 w-4" /> Rejeter
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Confirm dialog */}
      <Dialog open={!!confirmRow} onOpenChange={(v) => !v && setConfirmRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le paiement Wave</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Active le plan <strong className="capitalize">{confirmRow?.plan_tier}</strong> ({confirmRow?.billing_cycle === 'yearly' ? 'Annuel' : 'Mensuel'}) pour{' '}
              <strong>{confirmRow?.profile?.first_name} {confirmRow?.profile?.last_name}</strong>.
            </p>
            <Input
              value={txRef}
              onChange={(e) => setTxRef(e.target.value)}
              placeholder="Référence transaction Wave (optionnel)"
            />
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Note interne (optionnel)"
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmRow(null)}>Annuler</Button>
            <Button
              onClick={() =>
                confirmRow &&
                confirmMut.mutate({
                  request_id: confirmRow.id,
                  transaction_reference: txRef || undefined,
                  reviewer_notes: notes || undefined,
                })
              }
              disabled={confirmMut.isPending}
            >
              {confirmMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Activer l'abonnement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectRow} onOpenChange={(v) => !v && setRejectRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Raison (sera envoyée à l'utilisateur via WhatsApp)"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectRow(null)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() =>
                rejectRow && reason.trim().length >= 3 &&
                rejectMut.mutate({ request_id: rejectRow.id, reason: reason.trim() })
              }
              disabled={rejectMut.isPending || reason.trim().length < 3}
            >
              {rejectMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}