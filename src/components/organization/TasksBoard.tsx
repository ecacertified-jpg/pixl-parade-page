import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';
import { useEventTasks } from '@/hooks/useOrganizationData';
import { TASK_STATUS_LABELS, type OrganizationPageType, type EventTaskStatus } from '@/types/organization';
import confetti from 'canvas-confetti';

interface Props { pageType: OrganizationPageType; pageId: string; canEdit: boolean; }

export const TasksBoard = ({ pageType, pageId, canEdit }: Props) => {
  const { items, loading, insert, update, remove } = useEventTasks(pageType, pageId);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');

  const add = async () => {
    if (!title.trim()) return;
    await insert({ title: title.trim(), due_date: due || null, status: 'todo' } as any);
    setTitle(''); setDue('');
  };

  const toggle = async (id: string, status: EventTaskStatus) => {
    const next: EventTaskStatus = status === 'done' ? 'todo' : 'done';
    await update(id, { status: next } as any);
    if (next === 'done') confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
  };

  const done = items.filter((t) => t.status === 'done').length;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-nunito">
        {done}/{items.length} préparatifs terminés ✨
      </p>

      {canEdit && (
        <Card className="p-3 space-y-2 rounded-2xl">
          <Input
            placeholder="Ex : Réserver la salle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />
          <div className="flex gap-2">
            <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="flex-1" />
            <Button size="sm" onClick={add} disabled={!title.trim()}>
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          </div>
        </Card>
      )}

      {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-muted-foreground italic text-center py-6">
          Aucune tâche pour l'instant. Tout reste à imaginer ! 💫
        </p>
      )}

      <ul className="space-y-2">
        {items.map((t) => (
          <li key={t.id}>
            <Card className="p-3 rounded-2xl flex items-start gap-3">
              <Checkbox
                checked={t.status === 'done'}
                onCheckedChange={() => canEdit && toggle(t.id, t.status)}
                disabled={!canEdit}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className={`font-nunito text-sm ${t.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {t.title}
                </p>
                <div className="flex gap-2 items-center text-xs text-muted-foreground mt-1">
                  <span>{TASK_STATUS_LABELS[t.status].emoji} {TASK_STATUS_LABELS[t.status].label}</span>
                  {t.due_date && <span>· 📅 {new Date(t.due_date).toLocaleDateString('fr-FR')}</span>}
                </div>
              </div>
              {canEdit && (
                <Button size="icon" variant="ghost" onClick={() => remove(t.id)} className="h-7 w-7">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
};