import { useNavigate } from 'react-router-dom';
import { ImageIcon } from 'lucide-react';
import type { MemoryAlbum } from '@/hooks/useAggregatedMemories';
import { EMOTION_META } from '@/data/memory-emotions';

interface Props {
  albums: MemoryAlbum[];
}

export function MemoriesAlbumsGrid({ albums }: Props) {
  const navigate = useNavigate();

  if (albums.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="font-poppins text-lg">Aucun album encore</p>
        <p className="text-sm mt-2">Crée une page d'anniversaire ou d'événement pour commencer.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {albums.map((album) => {
        const meta = EMOTION_META[album.emotion];
        const goTo = () =>
          navigate(`/${album.source === 'birthday' ? 'birthday' : 'event'}/${album.slug}`);
        return (
          <button
            key={`${album.source}-${album.pageId}`}
            onClick={goTo}
            className="text-left bg-card rounded-xl overflow-hidden shadow-card hover:shadow-soft transition-shadow"
          >
            <div className="aspect-square bg-muted relative">
              {album.coverUrl ? (
                <img src={album.coverUrl} alt={album.title} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-10 w-10" />
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                {album.count} {album.count > 1 ? 'souvenirs' : 'souvenir'}
              </div>
              <div className="absolute top-2 right-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${meta.color}`}>{meta.emoji}</span>
              </div>
            </div>
            <div className="p-3">
              <p className="font-poppins font-medium text-sm line-clamp-1">{album.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{album.year}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}