import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { getArtisanRole } from '@/data/celebration-artisan-roles';
import type { CelebrationArtisan } from '@/types/celebrationArtisan';

interface Props {
  artisans?: CelebrationArtisan[] | null;
}

export const CelebrationArtisansSection = ({ artisans }: Props) => {
  const list = Array.isArray(artisans) ? artisans : [];
  if (list.length === 0) return null;

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

        <p className="mt-3 text-xs text-muted-foreground font-nunito italic">
          Bientôt : retrouvez et contactez ces professionnels.
        </p>
      </Card>
    </section>
  );
};