import { Play, Mic, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MemoryItem } from '@/hooks/useAggregatedMemories';
import { EMOTION_META } from '@/data/memory-emotions';
import { useFamilyVault } from '@/hooks/useFamilyVault';

interface Props {
  items: MemoryItem[];
}

export function MemoriesGallery({ items }: Props) {
  const navigate = useNavigate();
  const { share } = useFamilyVault();

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="font-poppins text-lg">Aucun souvenir encore</p>
        <p className="text-sm mt-2">Tes photos d'anniversaires et d'événements apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2">
      {items.map((it) => {
        const meta = EMOTION_META[it.emotion];
        const goTo = () => navigate(`/${it.source === 'birthday' ? 'birthday' : 'event'}/${it.pageSlug}`);
        return (
          <div
            key={`${it.source}-${it.id}`}
            className="relative aspect-square overflow-hidden rounded-lg bg-muted group"
          >
            <button onClick={goTo} className="absolute inset-0 w-full h-full">
            {it.mediaType === 'audio' ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30">
                <Mic className="h-8 w-8 text-primary-foreground" />
              </div>
            ) : (
              <img
                src={it.thumbnailUrl ?? it.mediaUrl}
                alt={it.caption ?? it.pageTitle}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            )}
            </button>
            {it.mediaType === 'video' && (
              <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1 pointer-events-none">
                <Play className="h-3 w-3 text-white" />
              </div>
            )}
            <div className="absolute bottom-1 left-1 pointer-events-none">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${meta.color}`}>{meta.emoji}</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                share.mutate({ memory_source: it.source, memory_id: it.id });
              }}
              title="Ajouter au coffre familial"
              className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            >
              <Users className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}