import { Lock, Unlock, Trash2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { MemoryCapsule } from '@/hooks/useMemoryCapsules';

interface Props {
  capsule: MemoryCapsule;
  onDelete?: () => void;
}

export function CapsuleCard({ capsule, onDelete }: Props) {
  const navigate = useNavigate();
  const unlockDate = new Date(capsule.unlock_date + 'T00:00:00');
  const daysLeft = differenceInDays(unlockDate, new Date());
  const unlocked = capsule.is_unlocked || daysLeft <= 0;
  const cover = capsule.media_refs.find((r) => r.thumbnailUrl)?.thumbnailUrl;

  return (
    <div className="relative bg-gradient-to-br from-primary/15 via-accent/15 to-secondary/30 rounded-2xl overflow-hidden shadow-card">
      <div className="aspect-[5/3] relative">
        {cover ? (
          <img
            src={cover}
            alt={capsule.title}
            className={`w-full h-full object-cover ${unlocked ? '' : 'blur-md scale-110'}`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30" />
        )}
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
          {unlocked ? <Unlock className="h-10 w-10 mb-2" /> : <Lock className="h-10 w-10 mb-2" />}
          <p className="font-poppins font-semibold text-lg px-4 text-center line-clamp-2">{capsule.title}</p>
          {!unlocked ? (
            <p className="text-sm mt-1 opacity-90">
              Ouverture {format(unlockDate, 'd MMMM yyyy', { locale: fr })}
              {daysLeft > 0 ? ` · J-${daysLeft}` : ''}
            </p>
          ) : (
            <p className="text-sm mt-1 opacity-90">Capsule ouverte 🎁</p>
          )}
        </div>
      </div>
      <div className="p-3 flex items-center justify-between gap-2">
        <Button
          size="sm"
          variant={unlocked ? 'default' : 'outline'}
          onClick={() => navigate(`/souvenirs/capsule/${capsule.id}`)}
        >
          {unlocked ? 'Découvrir' : 'Voir le compte à rebours'}
        </Button>
        {onDelete && (
          <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Supprimer">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
}