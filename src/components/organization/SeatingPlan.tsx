import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus, Download, Users, ArmchairIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useEventGuests, useEventTables } from '@/hooks/useOrganizationData';
import {
  TABLE_SHAPE_LABELS,
  type EventTableShape, type OrganizationPageType,
} from '@/types/organization';

interface Props { pageType: OrganizationPageType; pageId: string; canEdit: boolean }

export const SeatingPlan = ({ pageType, pageId, canEdit }: Props) => {
  const tables = useEventTables(pageType, pageId);
  const guests = useEventGuests(pageType, pageId);

  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(8);
  const [shape, setShape] = useState<EventTableShape>('round');

  const assignedByTable = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const g of guests.items as any[]) {
      if (g.table_id) {
        const arr = map.get(g.table_id) ?? [];
        arr.push(g);
        map.set(g.table_id, arr);
      }
    }
    return map;
  }, [guests.items]);

  const unassigned = useMemo(
    () => (guests.items as any[]).filter((g) => !g.table_id),
    [guests.items],
  );

  const totalCapacity = useMemo(
    () => (tables.items as any[]).reduce((s, t) => s + (t.capacity || 0), 0),
    [tables.items],
  );
  const totalAssigned = useMemo(
    () => (guests.items as any[]).filter((g) => g.table_id).length,
    [guests.items],
  );

  const addTable = async () => {
    if (!name.trim()) { toast.error('Donne un nom à la table'); return; }
    await tables.insert({ name: name.trim(), capacity, shape } as any);
    setName(''); setCapacity(8); setShape('round');
  };

  const assign = async (guestId: string, tableId: string | null) => {
    await guests.update(guestId, { table_id: tableId } as any);
  };

  const removeTable = async (id: string) => {
    if (!confirm('Supprimer cette table ? Les invités assignés seront libérés.')) return;
    await tables.remove(id);
    await guests.refetch();
  };

  const exportCsv = () => {
    const lines = ['Table;Capacite;Invite;Telephone;Place'];
    for (const t of tables.items as any[]) {
      const list = assignedByTable.get(t.id) ?? [];
      if (list.length === 0) {
        lines.push(`${t.name};${t.capacity};;;`);
      } else {
        for (const g of list) {
          lines.push(`${t.name};${t.capacity};${g.name};${g.phone ?? ''};${g.seat_number ?? ''}`);
        }
      }
    }
    for (const g of unassigned) {
      lines.push(`Sans table;;${g.name};${g.phone ?? ''};`);
    }
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `plan-de-table-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (tables.loading || guests.loading) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>;
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center"><div className="text-xs text-muted-foreground">Tables</div><div className="font-poppins text-xl font-semibold">{tables.items.length}</div></Card>
        <Card className="p-3 text-center"><div className="text-xs text-muted-foreground">Places</div><div className="font-poppins text-xl font-semibold">{totalAssigned}/{totalCapacity}</div></Card>
        <Card className="p-3 text-center"><div className="text-xs text-muted-foreground">Sans table</div><div className="font-poppins text-xl font-semibold text-amber-600">{unassigned.length}</div></Card>
      </div>

      {/* Add table */}
      {canEdit && (
        <Card className="p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input placeholder="Nom (ex: Famille mariée)" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              type="number" min={1} max={50}
              placeholder="Capacité" value={capacity}
              onChange={(e) => setCapacity(Math.max(1, Number(e.target.value) || 1))}
            />
            <Select value={shape} onValueChange={(v) => setShape(v as EventTableShape)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TABLE_SHAPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={addTable} className="flex-1"><Plus className="h-4 w-4 mr-1" /> Ajouter une table</Button>
            <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> Export</Button>
          </div>
        </Card>
      )}

      {/* Tables */}
      {tables.items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          Aucune table pour l'instant. Ajoute ta première table 🪑
        </p>
      )}

      {(tables.items as any[]).map((t) => {
        const seated = assignedByTable.get(t.id) ?? [];
        const full = seated.length >= t.capacity;
        return (
          <Card key={t.id} className="p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-poppins font-semibold flex items-center gap-1.5 truncate">
                  {TABLE_SHAPE_LABELS[t.shape as EventTableShape]?.emoji ?? '🪑'} {t.name}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> {seated.length}/{t.capacity} places
                  {full && <span className="text-amber-600 font-medium">· complète</span>}
                </div>
              </div>
              {canEdit && (
                <Button size="icon" variant="ghost" onClick={() => removeTable(t.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>

            {seated.length > 0 && (
              <ul className="space-y-1">
                {seated.map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-2 bg-secondary/30 rounded-md px-2 py-1.5 text-sm">
                    <span className="flex items-center gap-1.5 truncate">
                      <ArmchairIcon className="h-3.5 w-3.5 text-muted-foreground" /> {g.name}
                    </span>
                    {canEdit && (
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => assign(g.id, null)}>
                        Retirer
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}

      {/* Unassigned */}
      {tables.items.length > 0 && unassigned.length > 0 && (
        <Card className="p-3 space-y-2 border-amber-300 bg-amber-50/40">
          <h3 className="font-poppins text-sm font-semibold">À placer ({unassigned.length})</h3>
          <ul className="space-y-1.5">
            {unassigned.map((g) => (
              <li key={g.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">{g.name}</span>
                {canEdit && (
                  <Select onValueChange={(v) => assign(g.id, v)}>
                    <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue placeholder="Assigner…" /></SelectTrigger>
                    <SelectContent>
                      {(tables.items as any[]).map((t) => {
                        const used = (assignedByTable.get(t.id)?.length ?? 0);
                        const isFull = used >= t.capacity;
                        return (
                          <SelectItem key={t.id} value={t.id} disabled={isFull}>
                            {t.name} ({used}/{t.capacity}){isFull ? ' · complète' : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};