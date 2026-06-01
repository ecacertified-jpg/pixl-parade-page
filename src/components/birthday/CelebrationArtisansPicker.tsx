import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CELEBRATION_ARTISAN_ROLES } from '@/data/celebration-artisan-roles';
import type { CelebrationArtisan } from '@/types/celebrationArtisan';
import { cn } from '@/lib/utils';

interface Props {
  initial?: CelebrationArtisan[];
  onSave: (artisans: CelebrationArtisan[]) => void | Promise<void>;
  onSkip?: () => void;
  saving?: boolean;
  title?: string;
  description?: string;
  /** Hide skip button (e.g. inside a non-blocking form). */
  hideSkip?: boolean;
  continueLabel?: string;
}

export const CelebrationArtisansPicker = ({
  initial = [],
  onSave,
  onSkip,
  saving,
  title = 'Qui contribue à rendre cette célébration spéciale ?',
  description = 'Étape facultative — citez les prestataires qui participent à votre événement.',
  hideSkip,
  continueLabel = 'Continuer',
}: Props) => {
  const initialMap = useMemo(() => {
    const m: Record<string, string> = {};
    initial.forEach((a) => {
      if (a?.role) m[a.role] = a.name ?? '';
    });
    return m;
  }, [initial]);

  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const s: Record<string, boolean> = {};
    Object.keys(initialMap).forEach((k) => (s[k] = true));
    return s;
  });
  const [names, setNames] = useState<Record<string, string>>(initialMap);

  const toggle = (key: string) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContinue = () => {
    const artisans: CelebrationArtisan[] = CELEBRATION_ARTISAN_ROLES
      .filter((r) => selected[r.key])
      .map((r) => ({
        role: r.key,
        role_label: r.label,
        name: (names[r.key] || '').trim() || undefined,
      }));
    onSave(artisans);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-poppins text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground font-nunito mt-1">{description}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {CELEBRATION_ARTISAN_ROLES.map((role) => {
          const isOn = !!selected[role.key];
          return (
            <button
              key={role.key}
              type="button"
              onClick={() => toggle(role.key)}
              className={cn(
                'min-h-[44px] rounded-2xl border px-3 py-2 text-sm font-nunito text-left transition-colors',
                isOn
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-card border-border text-foreground hover:bg-secondary/40'
              )}
              aria-pressed={isOn}
            >
              <span className="mr-1.5">{role.emoji}</span>
              {role.label}
            </button>
          );
        })}
      </div>

      {CELEBRATION_ARTISAN_ROLES.some((r) => selected[r.key]) && (
        <Card className="p-3 space-y-2 bg-secondary/30 border-secondary">
          {CELEBRATION_ARTISAN_ROLES.filter((r) => selected[r.key]).map((role) => (
            <div key={role.key} className="flex items-center gap-2">
              <span className="text-base w-6 text-center" aria-hidden>
                {role.emoji}
              </span>
              <label className="sr-only" htmlFor={`artisan-${role.key}`}>
                Nom du {role.label}
              </label>
              <Input
                id={`artisan-${role.key}`}
                value={names[role.key] || ''}
                onChange={(e) =>
                  setNames((prev) => ({ ...prev, [role.key]: e.target.value }))
                }
                placeholder={`Nom du ${role.label.toLowerCase()} (facultatif)`}
                className="h-10"
              />
            </div>
          ))}
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
        {!hideSkip && onSkip && (
          <Button type="button" variant="ghost" onClick={onSkip} disabled={saving}>
            Ignorer cette étape
          </Button>
        )}
        <Button type="button" onClick={handleContinue} disabled={saving}>
          {saving ? 'Enregistrement…' : continueLabel}
        </Button>
      </div>
    </div>
  );
};