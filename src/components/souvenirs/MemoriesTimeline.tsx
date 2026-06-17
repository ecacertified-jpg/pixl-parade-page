import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Play, Mic } from 'lucide-react';
import type { MemoryItem } from '@/hooks/useAggregatedMemories';
import { EMOTION_META, type MemoryEmotion } from '@/data/memory-emotions';

interface Props {
  items: MemoryItem[];
}

const EMOTIONS: (MemoryEmotion | 'all')[] = ['all', 'joie', 'amour', 'famille', 'fierte', 'gratitude', 'nostalgie'];

export function MemoriesTimeline({ items }: Props) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<MemoryEmotion | 'all'>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((it) => it.emotion === filter)),
    [items, filter],
  );

  const groups = useMemo(() => {
    const m = new Map<string, MemoryItem[]>();
    filtered.forEach((it) => {
      const key = format(new Date(it.createdAt), 'yyyy-MM');
      const arr = m.get(key) ?? [];
      arr.push(it);
      m.set(key, arr);
    });
    return Array.from(m.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {EMOTIONS.map((e) => {
          const active = filter === e;
          const label = e === 'all' ? 'Tous' : `${EMOTION_META[e].emoji} ${EMOTION_META[e].label}`;
          return (
            <button
              key={e}
              onClick={() => setFilter(e)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border hover:bg-muted'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {groups.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 text-sm">Aucun souvenir pour ce filtre.</p>
      ) : (
        groups.map(([monthKey, list]) => (
          <section key={monthKey}>
            <h3 className="font-poppins text-sm font-medium text-muted-foreground mb-3 sticky top-0 bg-background/90 backdrop-blur py-1 z-10">
              {format(new Date(monthKey + '-01'), 'MMMM yyyy', { locale: fr })}
            </h3>
            <div className="space-y-3">
              {list.map((it) => {
                const meta = EMOTION_META[it.emotion];
                return (
                  <button
                    key={`${it.source}-${it.id}`}
                    onClick={() =>
                      navigate(`/${it.source === 'birthday' ? 'birthday' : 'event'}/${it.pageSlug}`)
                    }
                    className="w-full flex gap-3 bg-card rounded-xl p-3 text-left hover:shadow-card transition-shadow"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0 relative">
                      {it.mediaType === 'audio' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30">
                          <Mic className="h-6 w-6 text-primary-foreground" />
                        </div>
                      ) : (
                        <img
                          src={it.thumbnailUrl ?? it.mediaUrl}
                          alt={it.pageTitle}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      )}
                      {it.mediaType === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${meta.color}`}>
                          {meta.emoji} {meta.label}
                        </span>
                      </div>
                      <p className="font-poppins text-sm font-medium line-clamp-1">{it.pageTitle}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(it.createdAt), { addSuffix: true, locale: fr })}
                      </p>
                      {it.memoryText && (
                        <p className="text-xs text-muted-foreground italic mt-1 line-clamp-2">"{it.memoryText}"</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}