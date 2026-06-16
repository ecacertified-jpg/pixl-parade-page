import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, Wallet, Users, Palette, AlertTriangle, CalendarClock, Sparkles,
} from 'lucide-react';
import {
  useEventTasks, useEventBudget, useEventGuests, useEventVendors, useEventTables,
} from '@/hooks/useOrganizationData';
import type { OrganizationPageType } from '@/types/organization';

interface Props { pageType: OrganizationPageType; pageId: string; }

const fmtXOF = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' XOF';

const daysUntil = (iso: string | null): number | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(d); target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
};

export const OrganizationDashboard = ({ pageType, pageId }: Props) => {
  const { items: tasks,    loading: l1 } = useEventTasks(pageType, pageId);
  const { items: budget,   loading: l2 } = useEventBudget(pageType, pageId);
  const { items: guests,   loading: l3 } = useEventGuests(pageType, pageId);
  const { items: vendors,  loading: l4 } = useEventVendors(pageType, pageId);
  const { items: tables,   loading: l5 } = useEventTables(pageType, pageId);
  const loading = l1 || l2 || l3 || l4 || l5;

  const stats = useMemo(() => {
    const tDone = tasks.filter((t: any) => t.status === 'done').length;
    const tPct  = tasks.length ? Math.round((tDone / tasks.length) * 100) : 0;

    const planned = budget.reduce((s: number, b: any) => s + Number(b.planned_amount || 0), 0);
    const spent   = budget.reduce((s: number, b: any) => s + Number(b.spent_amount   || 0), 0);
    const bPct    = planned > 0 ? Math.round((spent / planned) * 100) : 0;

    const gConfirmed = guests.filter((g: any) => g.status === 'confirmed' || g.rsvp_response === 'yes').length;
    const gDeclined  = guests.filter((g: any) => g.status === 'declined'  || g.rsvp_response === 'no').length;
    const gPlusOnes  = guests.reduce((s: number, g: any) => s + Number(g.rsvp_plus_ones || 0), 0);
    const gTotalHeads = gConfirmed + gPlusOnes;
    const gPct = guests.length ? Math.round((gConfirmed / guests.length) * 100) : 0;

    const vConfirmed = vendors.filter((v: any) => v.booking_status === 'confirmed').length;
    const vQuote     = vendors.reduce((s: number, v: any) => s + Number(v.quote_amount   || 0), 0);
    const vDeposit   = vendors.reduce((s: number, v: any) => s + Number(v.deposit_amount || 0), 0);

    const seatsCap   = tables.reduce((s: number, t: any) => s + Number(t.capacity || 0), 0);
    const seatsTaken = guests.filter((g: any) => g.table_id).length;

    return {
      tDone, tTotal: tasks.length, tPct,
      planned, spent, bPct, bOver: spent > planned && planned > 0,
      gConfirmed, gDeclined, gPlusOnes, gTotalHeads, gPct,
      vConfirmed, vTotal: vendors.length, vQuote, vDeposit,
      seatsCap, seatsTaken,
    };
  }, [tasks, budget, guests, vendors, tables]);

  const alerts = useMemo(() => {
    const out: { kind: 'warn' | 'info'; text: string }[] = [];

    // Tasks due soon
    const upcoming = tasks
      .filter((t: any) => t.status !== 'done' && t.due_date)
      .map((t: any) => ({ t, d: daysUntil(t.due_date) }))
      .filter((x) => x.d !== null && x.d! <= 7);
    upcoming.forEach((x) =>
      out.push({
        kind: x.d! < 0 ? 'warn' : 'info',
        text: x.d! < 0
          ? `Tâche en retard : « ${x.t.title} » (J${x.d})`
          : `Tâche dans ${x.d}j : « ${x.t.title} »`,
      }),
    );

    if (stats.bOver) out.push({ kind: 'warn', text: `Budget dépassé de ${fmtXOF(stats.spent - stats.planned)}` });
    else if (stats.planned > 0 && stats.bPct >= 80)
      out.push({ kind: 'info', text: `Budget consommé à ${stats.bPct} %` });

    const vendorsToContact = vendors.filter((v: any) => v.booking_status === 'proposed').length;
    if (vendorsToContact > 0)
      out.push({ kind: 'info', text: `${vendorsToContact} prestataire(s) à contacter` });

    const unassigned = guests.filter((g: any) =>
      (g.status === 'confirmed' || g.rsvp_response === 'yes') && !g.table_id,
    ).length;
    if (unassigned > 0 && tables.length > 0)
      out.push({ kind: 'info', text: `${unassigned} invité(s) confirmé(s) sans table` });

    return out;
  }, [tasks, vendors, guests, tables, stats]);

  if (loading) return <p className="text-sm text-muted-foreground">Chargement…</p>;

  if (!tasks.length && !budget.length && !guests.length && !vendors.length) {
    return (
      <Card className="p-6 rounded-2xl text-center">
        <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Commence par ajouter des tâches, un budget ou des invités pour voir ton tableau de bord ✨
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          label="Préparatifs"
          value={`${stats.tDone}/${stats.tTotal}`}
          progress={stats.tPct}
          hint={`${stats.tPct} % fait`}
        />
        <StatCard
          icon={<Wallet className="h-4 w-4 text-amber-600" />}
          label="Budget"
          value={fmtXOF(stats.spent)}
          progress={Math.min(stats.bPct, 100)}
          hint={stats.planned ? `sur ${fmtXOF(stats.planned)}` : 'aucun budget défini'}
          danger={stats.bOver}
        />
        <StatCard
          icon={<Users className="h-4 w-4 text-pink-600" />}
          label="Invités confirmés"
          value={`${stats.gConfirmed}`}
          progress={stats.gPct}
          hint={
            stats.gPlusOnes
              ? `+${stats.gPlusOnes} accomp. · ${stats.gTotalHeads} pers.`
              : `${stats.gDeclined} refus`
          }
        />
        <StatCard
          icon={<Palette className="h-4 w-4 text-violet-600" />}
          label="Prestataires"
          value={`${stats.vConfirmed}/${stats.vTotal}`}
          progress={stats.vTotal ? Math.round((stats.vConfirmed / stats.vTotal) * 100) : 0}
          hint={stats.vQuote ? `Devis ${fmtXOF(stats.vQuote)}` : 'aucun devis'}
        />
      </div>

      {(stats.vQuote > 0 || stats.vDeposit > 0 || stats.seatsCap > 0) && (
        <Card className="p-3 rounded-2xl space-y-2">
          {stats.vQuote > 0 && (
            <Row
              icon={<Wallet className="h-4 w-4 text-amber-600" />}
              label="Acompte prestataires"
              value={`${fmtXOF(stats.vDeposit)} / ${fmtXOF(stats.vQuote)}`}
            />
          )}
          {stats.seatsCap > 0 && (
            <Row
              icon={<Users className="h-4 w-4 text-pink-600" />}
              label="Plan de table"
              value={`${stats.seatsTaken}/${stats.seatsCap} places assignées`}
            />
          )}
        </Card>
      )}

      {alerts.length > 0 && (
        <Card className="p-3 rounded-2xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">
            <CalendarClock className="h-3.5 w-3.5" /> À surveiller
          </div>
          {alerts.slice(0, 6).map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {a.kind === 'warn'
                ? <AlertTriangle className="h-3.5 w-3.5 text-red-600 mt-0.5 shrink-0" />
                : <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />}
              <span className={a.kind === 'warn' ? 'text-red-700' : 'text-muted-foreground'}>
                {a.text}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

const StatCard = ({
  icon, label, value, progress, hint, danger,
}: {
  icon: React.ReactNode; label: string; value: string;
  progress: number; hint?: string; danger?: boolean;
}) => (
  <Card className="p-3 rounded-2xl space-y-1.5">
    <div className="flex items-center justify-between gap-1">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon} {label}
      </div>
      {danger && <Badge variant="destructive" className="text-[9px] h-4">!</Badge>}
    </div>
    <div className="font-poppins text-lg font-semibold text-foreground leading-tight">
      {value}
    </div>
    <Progress value={progress} className={`h-1.5 ${danger ? '[&>div]:bg-red-500' : ''}`} />
    {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
  </Card>
);

const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center justify-between text-xs">
    <div className="flex items-center gap-1.5 text-muted-foreground">{icon} {label}</div>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);