import { useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Play, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { getVideoPlatformInfo } from '@/utils/videoHelpers';

interface VideoCarouselItem {
  url: string;
  thumbnailUrl: string | null;
  source: string;
  title?: string;
}

interface VideoCarouselProps {
  videos: VideoCarouselItem[];
  productName: string;
  className?: string;
}

export function VideoCarousel({ videos, productName, className }: VideoCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const isMobile = useIsMobile();

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const openVideo = (index: number) => {
    setSelectedVideoIndex(index);
  };

  const closeVideo = () => {
    setSelectedVideoIndex(null);
  };

  if (!videos || videos.length === 0) {
    return null;
  }

  const getSourceBadge = (source: string) => {
    const platformInfo = getVideoPlatformInfo(
      source === 'youtube' ? 'https://youtube.com' : 
      source === 'vimeo' ? 'https://vimeo.com' : ''
    );

    if (source === 'youtube' || source === 'vimeo') {
      return (
        <Badge 
          variant="secondary" 
          className="absolute bottom-1 left-1 text-[9px] px-1 py-0 text-white"
          style={{ backgroundColor: platformInfo.color }}
        >
          {platformInfo.name}
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Video className="h-4 w-4" />
        <span>{videos.length} vidéo{videos.length > 1 ? 's' : ''}</span>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-2">
            {videos.map((video, index) => (
              <div
                key={index}
                className="flex-[0_0_auto] w-24 h-16 md:w-28 md:h-18 cursor-pointer"
                onClick={() => openVideo(index)}
              >
                <div className="relative w-full h-full rounded-lg overflow-hidden border border-border group hover:border-primary transition-colors">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title || `Vidéo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Video className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}

                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Source badge */}
                  {getSourceBadge(video.source)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation arrows (desktop only, when more than 3 videos) */}
        {!isMobile && videos.length > 3 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background rounded-full h-7 w-7 shadow-md"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background rounded-full h-7 w-7 shadow-md"
              onClick={scrollNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedVideoIndex !== null && (
        <VideoPlayer
          videoUrl={videos[selectedVideoIndex].url}
          isOpen={true}
          onClose={closeVideo}
          title={videos[selectedVideoIndex].title || `${productName} - Vidéo ${selectedVideoIndex + 1}`}
        />
      )}
    </div>
  );
}
