import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import type { BirthdayPageItem } from '@/hooks/useBirthdayPages';

interface BirthdayGridCardProps {
  page: BirthdayPageItem;
}

export function BirthdayGridCard({ page }: BirthdayGridCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/birthday/${page.slug}`)}
      className="relative w-full overflow-hidden rounded-sm group focus:outline-none"
    >
      <AspectRatio ratio={3 / 4}>
        {page.cover_image_url ? (
          <img
            src={page.cover_image_url}
            alt={page.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/60 via-accent/50 to-secondary flex items-center justify-center">
            <span className="text-4xl">🎂</span>
          </div>
        )}

        {/* Bottom overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 pt-8">
          <p className="text-white text-xs font-semibold font-poppins truncate">
            {page.first_name}
          </p>
          <p className="text-white/70 text-[10px] font-nunito">
            {page.celebration_year}
          </p>
        </div>

        {/* Wishes badge */}
        {page.wishes_count > 0 && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5">
            <MessageCircle className="h-2.5 w-2.5 text-white" />
            <span className="text-[9px] text-white font-medium">{page.wishes_count}</span>
          </div>
        )}
      </AspectRatio>
    </button>
  );
}
