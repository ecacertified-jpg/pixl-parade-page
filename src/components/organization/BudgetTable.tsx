import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { useEventBudget } from '@/hooks/useOrganizationData';
import type { OrganizationPageType } from '@/types/organization';

interface Props { pageType: OrganizationPageType; pageId: string; canEdit: boolean; }

const fmt = (n: number, c = 'XOF') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(n);

export const BudgetTable = ({ pageType, pageId, canEdit }: Props) => {
  const { items, loading, insert, update, remove } = useEventBudget(pageType, pageId);
  const [category, setCategory] = useState('');
  const [planned, setPlanned] = useState('');

  const totals = useMemo(() => {
    const p = items.reduce((s, i) => s + Number(i.planned_amount || 0), 0);
    const s = items.reduce((sum, i) => sum + Number(i.spent_amount || 0), 0);
    return { planned: p, spent: s, diff: p - s, currency: items[0]?.currency ?? 'XOF' };
  }, [items]);

  const add = async () => {
    if (!category.trim()) return;
    await insert({ category: category.trim(), planned_amount: Number(planned) || 0, spent_amount: 0 } as any);
    setCategory(''); setPlanned('');
  };

  const pct = totals.planned > 0 ? Math.min(100, (totals.spent / totals.planned) * 100) : 0;

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <Card className="p-4 rounded-2xl bg-gradient-to-br from-secondary/40 to-background">
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Prévu</p>
              <p className="font-poppins font-semibold text-sm">{fmt(totals.planned, totals.currency)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Dépensé</p>
              <p className="font-poppins font-semibold text-sm">{fmt(totals.spent, totals.currency)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Reste</p>
              <p className={`font-poppins font-semibold text-sm ${totals.diff < 0 ? 'text-destructive' : 'text-foreground'}`}>
                {fmt(totals.diff, totals.currency)}
              </p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </Card>
      )}

      {canEdit && (
        <Card className="p-3 space-y-2 rounded-2xl">
          <Input placeholder="Catégorie (Décoration, Traiteur…)" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={80} />
          <Input type="number" placeholder="Montant prévu" value={planned} onChange={(e) => setPlanned(e.target.value)} />
          <Button size="sm" onClick={add} disabled={!category.trim()}><Plus className="h-4 w-4" /> Ajouter</Button>
        </Card>
      )}

      {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-muted-foreground italic text-center py-6">Pas encore de budget défini. 💰</p>
      )}

      <ul className="space-y-2">
        {items.map((b) => (
          <li key={b.id}>
            <Card className="p-3 rounded-2xl">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="font-nunito text-sm font-medium">{b.category}</p>
                {canEdit && (
                  <Button size="icon" variant="ghost" onClick={() => remove(b.id)} className="h-7 w-7">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase">Prévu</label>
                  <Input
                    type="number"
                    value={String(b.planned_amount)}
                    onChange={(e) => update(b.id, { planned_amount: Number(e.target.value) || 0 } as any)}
                    disabled={!canEdit}
                    className="h-8"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase">Dépensé</label>
                  <Input
                    type="number"
                    value={String(b.spent_amount)}
                    onChange={(e) => update(b.id, { spent_amount: Number(e.target.value) || 0 } as any)}
                    disabled={!canEdit}
                    className="h-8"
                  />
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
};