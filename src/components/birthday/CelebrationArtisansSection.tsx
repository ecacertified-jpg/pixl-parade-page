import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Pencil, Plus } from 'lucide-react';
import { getArtisanRole } from '@/data/celebration-artisan-roles';
import { getArtisanCounterLabel } from '@/utils/artisanCounter';
import type { CelebrationArtisan } from '@/types/celebrationArtisan';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CelebrationArtisansPicker } from './CelebrationArtisansPicker';

interface Props {
  artisans?: CelebrationArtisan[] | null;
  /** When provided, owner sees edit affordance to update DB. */
  editable?: {
    pageId: string;
    table: 'birthday_pages' | 'event_pages';
    onUpdated?: (next: CelebrationArtisan[]) => void;
  };
}

export const CelebrationArtisansSection = ({ artisans, editable }: Props) => {
  const list = Array.isArray(artisans) ? artisans : [];
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async (next: CelebrationArtisan[]) => {
    if (!editable) return;
    setSaving(true);
    const { error } = await supabase
      .from(editable.table)
      .update({ celebration_artisans: next as any } as any)
      .eq('id', editable.pageId);
    setSaving(false);
    if (error) {
      toast.error("Impossible d'enregistrer les artisans");
      return;
    }
    toast.success('Artisans enregistrés');
    editable.onUpdated?.(next);
    setOpen(false);
  };

  // Owner with empty list: show small CTA card
  if (list.length === 0) {
    if (!editable) return null;
    return (
      <section className="px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-2xl border border-dashed border-primary/30 bg-secondary/20 px-4 py-3 text-sm font-nunito text-muted-foreground hover:bg-secondary/30 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter les artisans de cette célébration
        </button>
        <ArtisansEditDialog
          open={open}
          onOpenChange={setOpen}
          initial={list}
          saving={saving}
          onSave={save}
        />
      </section>
    );
  }

  return (
    <section aria-labelledby="artisans-title" className="px-4 py-3">
      <Card className="rounded-2xl p-4 shadow-soft border-secondary bg-gradient-to-br from-secondary/40 to-background">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2
            id="artisans-title"
            className="font-poppins text-base font-semibold text-foreground"
          >
            Les artisans de cette célébration
          </h2>
        </div>

        <ul className="space-y-1.5">
          {list.map((a, i) => {
            const role = getArtisanRole(a.role);
            const emoji = role?.emoji ?? '🎁';
            const label = a.role_label || role?.label || 'Prestataire';
            return (
              <li
                key={`${a.role}-${i}`}
                className="font-nunito text-sm text-foreground flex items-baseline gap-2"
              >
                <span aria-hidden>{emoji}</span>
                <span className="font-medium">{label}</span>
                {a.name && (
                  <>
                    <span className="text-muted-foreground">:</span>
                    <span>{a.name}</span>
                  </>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground font-nunito italic">
            Bientôt : retrouvez et contactez ces professionnels.
          </p>
          {editable && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Modifier
            </Button>
          )}
        </div>
      </Card>
      <ArtisansEditDialog
        open={open}
        onOpenChange={setOpen}
        initial={list}
        saving={saving}
        onSave={save}
      />
    </section>
  );
};

interface DialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: CelebrationArtisan[];
  saving: boolean;
  onSave: (next: CelebrationArtisan[]) => void | Promise<void>;
}

const ArtisansEditDialog = ({ open, onOpenChange, initial, saving, onSave }: DialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="font-poppins">Artisans de la célébration</DialogTitle>
      </DialogHeader>
      <CelebrationArtisansPicker
        initial={initial}
        saving={saving}
        onSave={onSave}
        onSkip={() => onOpenChange(false)}
        continueLabel="Enregistrer"
      />
    </DialogContent>
  </Dialog>
);