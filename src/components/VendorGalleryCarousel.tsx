import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Expand, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FullscreenGallery } from '@/components/FullscreenGallery';
import { VideoPlayer } from '@/components/VideoPlayer';

export interface GalleryMediaItem {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl: string | null;
  title: string | null;
}

interface VendorGalleryCarouselProps {
  items: GalleryMediaItem[];
  businessName: string;
}

export function VendorGalleryCarousel({ items, businessName }: VendorGalleryCarouselProps) {
  const [mainRef, mainApi] = useEmblaCarousel({ loop: true, dragFree: false });
  const [thumbRef, thumbApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>('');

  // Sync carousel state
  const onSelect = useCallback(() => {
    if (!mainApi) return;
    const index = mainApi.selectedScrollSnap();
    setSelectedIndex(index);
    thumbApi?.scrollTo(index);
  }, [mainApi, thumbApi]);

  useEffect(() => {
    if (!mainApi) return;
    onSelect();
    mainApi.on('select', onSelect);
    mainApi.on('reInit', onSelect);
    return () => {
      mainApi.off('select', onSelect);
    };
  }, [mainApi, onSelect]);

  const scrollPrev = useCallback(() => {
    mainApi?.scrollPrev();
  }, [mainApi]);

  const scrollNext = useCallback(() => {
    mainApi?.scrollNext();
  }, [mainApi]);

  const scrollTo = useCallback(
    (index: number) => {
      mainApi?.scrollTo(index);
    },
    [mainApi]
  );

  const handleMediaClick = (item: GalleryMediaItem) => {
    if (item.mediaType === 'video') {
      setCurrentVideoUrl(item.mediaUrl);
      setCurrentVideoTitle(item.title || businessName);
      setIsVideoOpen(true);
    } else {
      setIsFullscreenOpen(true);
    }
  };

  // Get only images for fullscreen gallery
  const imageItems = items.filter((item) => item.mediaType === 'image');
  const currentImageIndex = imageItems.findIndex(
    (img) => img.id === items[selectedIndex]?.id
  );

  if (!items || items.length === 0) {
    return null;
  }

  // Single item - no carousel needed
  if (items.length === 1) {
    const item = items[0];
    const displayImage = item.mediaType === 'video' ? item.thumbnailUrl || item.mediaUrl : item.mediaUrl;

    return (
      <div className="relative rounded-xl overflow-hidden shadow-soft">
        <div className="aspect-[16/10] relative">
          <img
            src={displayImage}
            alt={item.title || businessName}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => handleMediaClick(item)}
          />
          {item.mediaType === 'video' && (
            <div
              className="absolute inset-0 bg-black/20 flex items-center justify-center cursor-pointer hover:bg-black/30 transition-colors"
              onClick={() => handleMediaClick(item)}
            >
              <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <Play className="h-8 w-8 text-white fill-white ml-1" />
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white h-9 w-9 rounded-full"
            onClick={() => handleMediaClick(item)}
          >
            <Expand className="h-4 w-4" />
          </Button>
        </div>

        {item.mediaType === 'video' && (
          <VideoPlayer
            videoUrl={item.mediaUrl}
            isOpen={isVideoOpen}
            onClose={() => setIsVideoOpen(false)}
            title={currentVideoTitle}
          />
        )}

        {item.mediaType === 'image' && (
          <FullscreenGallery
            images={[item.mediaUrl]}
            alt={businessName}
            initialIndex={0}
            isOpen={isFullscreenOpen}
            onClose={() => setIsFullscreenOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden shadow-soft bg-card">
      {/* Main carousel */}
      <div className="overflow-hidden" ref={mainRef}>
        <div className="flex">
          {items.map((item, index) => {
            const displayImage =
              item.mediaType === 'video'
                ? item.thumbnailUrl || item.mediaUrl
                : item.mediaUrl;

            return (
              <div key={item.id} className="flex-[0_0_100%] min-w-0">
                <div className="aspect-[16/10] relative">
                  <img
                    src={displayImage}
                    alt={item.title || `${businessName} - ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => handleMediaClick(item)}
                  />
                  {item.mediaType === 'video' && (
                    <div
                      className="absolute inset-0 bg-black/20 flex items-center justify-center cursor-pointer hover:bg-black/30 transition-colors"
                      onClick={() => handleMediaClick(item)}
                    >
                      <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                        <Play className="h-8 w-8 text-white fill-white ml-1" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overlay controls */}
      <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-medium">
        {selectedIndex + 1}/{items.length}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white h-9 w-9 rounded-full"
        onClick={() => {
          if (items[selectedIndex]?.mediaType === 'image') {
            setIsFullscreenOpen(true);
          } else {
            handleMediaClick(items[selectedIndex]);
          }
        }}
      >
        <Expand className="h-4 w-4" />
      </Button>

      {/* Navigation arrows - desktop only */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white h-10 w-10 rounded-full hidden md:flex"
        onClick={scrollPrev}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white h-10 w-10 rounded-full hidden md:flex"
        onClick={scrollNext}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Pagination dots */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              index === selectedIndex
                ? 'bg-white w-4'
                : 'bg-white/50 hover:bg-white/70'
            )}
          />
        ))}
      </div>

      {/* Thumbnail bar */}
      <div className="bg-black/40 backdrop-blur-sm px-2 py-2">
        <div className="overflow-hidden" ref={thumbRef}>
          <div className="flex gap-2">
            {items.map((item, index) => {
              const thumbImage =
                item.mediaType === 'video'
                  ? item.thumbnailUrl || item.mediaUrl
                  : item.mediaUrl;

              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(index)}
                  className={cn(
                    'flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all relative',
                    index === selectedIndex
                      ? 'border-white ring-1 ring-white/50'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                >
                  <img
                    src={thumbImage}
                    alt=""
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {item.mediaType === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="h-3 w-3 text-white fill-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Swipe indicator - mobile only */}
      <AnimatePresence>
        {selectedIndex === 0 && (
          <motion.div
            className="absolute bottom-20 right-4 text-white/60 text-xs flex items-center gap-1 md:hidden"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5 }}
          >
            Glisser pour voir plus
            <ChevronRight className="h-3 w-3" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video player modal */}
      {currentVideoUrl && (
        <VideoPlayer
          videoUrl={currentVideoUrl}
          isOpen={isVideoOpen}
          onClose={() => {
            setIsVideoOpen(false);
            setCurrentVideoUrl(null);
          }}
          title={currentVideoTitle}
        />
      )}

      {/* Fullscreen gallery for images */}
      {imageItems.length > 0 && (
        <FullscreenGallery
          images={imageItems.map((img) => img.mediaUrl)}
          alt={businessName}
          initialIndex={Math.max(0, currentImageIndex)}
          isOpen={isFullscreenOpen}
          onClose={() => setIsFullscreenOpen(false)}
        />
      )}
    </div>
  );
}
