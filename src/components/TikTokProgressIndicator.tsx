import { cn } from '@/lib/utils';

interface TikTokProgressIndicatorProps {
  totalPosts: number;
  currentIndex: number;
  onDotClick?: (index: number) => void;
}

export function TikTokProgressIndicator({ 
  totalPosts, 
  currentIndex, 
  onDotClick 
}: TikTokProgressIndicatorProps) {
  const maxVisibleDots = 10;
  const showCompressed = totalPosts > maxVisibleDots;

  if (totalPosts <= 1) return null;

  return (
    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 py-4">
      {showCompressed ? (
        // Mode compressé : barre de progression verticale
        <div className="relative w-1 h-28 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 w-full bg-white rounded-full transition-all duration-300 ease-out"
            style={{ height: `${((currentIndex + 1) / totalPosts) * 100}%` }}
          />
        </div>
      ) : (
        // Mode dots : jusqu'à 10 publications
        <div className="flex flex-col items-center gap-2">
          {Array.from({ length: totalPosts }).map((_, index) => (
            <button
              key={index}
              onClick={() => onDotClick?.(index)}
              aria-label={`Aller à la publication ${index + 1}`}
              className={cn(
                "rounded-full transition-all duration-300 ease-out",
                index === currentIndex
                  ? "w-2 h-2 bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.5)]"
                  : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      )}
      
      {/* Compteur de position */}
      <span className="text-white/60 text-[10px] mt-1 font-medium tabular-nums">
        {currentIndex + 1}/{totalPosts}
      </span>
    </div>
  );
}
