import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Download, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface InvoiceRow {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
  period_start: string | null;
  period_end: string | null;
  external_id: string | null;
  provider: string;
  metadata: any;
  created_at: string;
}

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtAmount = (a: number, c: string) =>
  c === 'XOF'
    ? `${new Intl.NumberFormat('fr-FR').format(a)} FCFA`
    : `${a.toFixed(2).replace('.', ',')} ${c}`;

export default function Invoices() {
  const { user } = useAuth();
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['subscription-invoices', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('subscription_invoices')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as InvoiceRow[];
    },
  });

  const handlePrint = (inv: InvoiceRow) => {
    const cycle = (inv.metadata as any)?.billing_cycle === 'yearly' ? 'Annuel' : 'Mensuel';
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Reçu JDV ${inv.id.slice(0, 8)}</title>
      <style>body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:24px;color:#222}
      h1{font-size:22px;margin:0 0 4px}.muted{color:#777;font-size:13px}
      table{width:100%;border-collapse:collapse;margin-top:24px}td,th{padding:10px 8px;border-bottom:1px solid #eee;text-align:left;font-size:14px}
      .total{font-weight:700;font-size:18px;color:#7A5DC7}.badge{display:inline-block;padding:2px 10px;border-radius:999px;background:#E8E2F5;color:#7A5DC7;font-size:12px}
      </style></head><body>
      <h1>JOIE DE VIVRE — Reçu de paiement</h1>
      <p class="muted">Reçu n° <strong>${inv.id.slice(0, 8).toUpperCase()}</strong> · Émis le ${fmtDate(inv.created_at)}</p>
      <table>
        <tr><th>Statut</th><td><span class="badge">${inv.status === 'paid' ? 'Payé' : inv.status}</span></td></tr>
        <tr><th>Moyen de paiement</th><td>Wave (${(inv.provider || 'wave').toUpperCase()})</td></tr>
        <tr><th>Référence transaction</th><td>${inv.external_id || '—'}</td></tr>
        <tr><th>Cycle de facturation</th><td>${cycle}</td></tr>
        <tr><th>Période couverte</th><td>${fmtDate(inv.period_start)} → ${fmtDate(inv.period_end)}</td></tr>
        <tr><th>Payé le</th><td>${fmtDate(inv.paid_at)}</td></tr>
        <tr><th>Montant</th><td class="total">${fmtAmount(Number(inv.amount), inv.currency)}</td></tr>
      </table>
      <p class="muted" style="margin-top:32px">Merci de célébrer avec JDV 💛 — joiedevivre-africa.com</p>
      <script>window.onload=()=>window.print()</script></body></html>`;
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4 gap-2">
          <Link to="/subscription"><ArrowLeft className="h-4 w-4" /> Mon abonnement</Link>
        </Button>
        <header className="mb-6">
          <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/15">Factures</Badge>
          <h1 className="font-poppins text-3xl font-semibold">Historique de facturation</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tous tes paiements Wave validés.</p>
        </header>

        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground">Chargement…</p>
        ) : invoices.length === 0 ? (
          <Card className="p-10 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
            <p className="font-medium">Aucune facture pour le moment</p>
            <p className="mt-1 text-sm text-muted-foreground">Tes paiements Wave apparaîtront ici dès qu'ils seront validés.</p>
            <Button asChild className="mt-4"><Link to="/pricing?return_to=/invoices">Passe à un plan supérieur</Link></Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <Card key={inv.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{fmtAmount(Number(inv.amount), inv.currency)} · {(inv.metadata as any)?.billing_cycle === 'yearly' ? 'Annuel' : 'Mensuel'}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(inv.period_start)} → {fmtDate(inv.period_end)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={inv.status === 'paid' ? 'secondary' : 'outline'} className="capitalize">{inv.status === 'paid' ? 'Payé' : inv.status}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => handlePrint(inv)} className="gap-1">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Reçu</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}