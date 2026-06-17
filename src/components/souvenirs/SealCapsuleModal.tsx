import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format, addMonths, addYears } from 'date-fns';
import { Check } from 'lucide-react';
import type { MemoryItem } from '@/hooks/useAggregatedMemories';
import { useMemoryCapsules } from '@/hooks/useMemoryCapsules';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableItems: MemoryItem[];
}

const UNLOCK_PRESETS = [
  { label: '3 mois', getDate: () => format(addMonths(new Date(), 3), 'yyyy-MM-dd') },
  { label: '6 mois', getDate: () => format(addMonths(new Date(), 6), 'yyyy-MM-dd') },
  { label: '1 an', getDate: () => format(addYears(new Date(), 1), 'yyyy-MM-dd') },
  { label: '5 ans', getDate: () => format(addYears(new Date(), 5), 'yyyy-MM-dd') },
  { label: '10 ans', getDate: () => format(addYears(new Date(), 10), 'yyyy-MM-dd') },
];

export function SealCapsuleModal({ open, onOpenChange, availableItems }: Props) {
  const { seal } = useMemoryCapsules();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [unlockDate, setUnlockDate] = useState(UNLOCK_PRESETS[2].getDate());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const items = useMemo(() => availableItems.filter((it) => it.mediaType !== 'audio').slice(0, 60), [availableItems]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSeal = async () => {
    if (!title.trim()) return;
    const media_refs = items
      .filter((it) => selected.has(`${it.source}:${it.id}`))
      .map((it) => ({ source: it.source, photoId: it.id, thumbnailUrl: it.thumbnailUrl }));

    await seal.mutateAsync({
      title: title.trim(),
      message: message.trim(),
      media_refs,
      unlock_date: unlockDate,
      recipients: [],
    });
    setTitle('');
    setMessage('');
    setSelected(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-poppins">Sceller une capsule temporelle 🔒</DialogTitle>
          <DialogDescription>
            Choisis tes plus beaux souvenirs et un message. Tout sera scellé jusqu'à la date d'ouverture.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="capsule-title">Titre</Label>
            <Input
              id="capsule-title"
              placeholder="Ex: Pour mon moi de 2030"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </div>

          <div>
            <Label htmlFor="capsule-message">Message à ton futur toi</Label>
            <Textarea
              id="capsule-message"
              placeholder="Souviens-toi de…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </div>

          <div>
            <Label>Date d'ouverture</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {UNLOCK_PRESETS.map((p) => {
                const date = p.getDate();
                const active = unlockDate === date;
                return (
                  <button
                    type="button"
                    key={p.label}
                    onClick={() => setUnlockDate(date)}
                    className={`text-xs px-3 py-1.5 rounded-full border ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card border-border hover:bg-muted'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <Input
              type="date"
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              className="mt-2"
              min={format(addMonths(new Date(), 1), 'yyyy-MM-dd')}
            />
          </div>

          <div>
            <Label>Souvenirs à inclure ({selected.size} sélectionné{selected.size > 1 ? 's' : ''})</Label>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-2">Aucun souvenir disponible pour le moment.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 mt-2 max-h-60 overflow-y-auto">
                {items.map((it) => {
                  const key = `${it.source}:${it.id}`;
                  const isSel = selected.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggle(key)}
                      className={`relative aspect-square rounded-md overflow-hidden border-2 ${
                        isSel ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={it.thumbnailUrl ?? it.mediaUrl}
                        alt={it.pageTitle}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      {isSel && (
                        <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                          <Check className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSeal} disabled={!title.trim() || seal.isPending}>
              {seal.isPending ? 'Scellement…' : 'Sceller la capsule'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}