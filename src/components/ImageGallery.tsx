import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Expand, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ZoomableImage } from "@/components/ZoomableImage";
import { FullscreenGallery } from "@/components/FullscreenGallery";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
  videoUrl?: string | null;
  videoThumbnailUrl?: string | null;
}

export function ImageGallery({ images, alt, className, videoUrl, videoThumbnailUrl }: ImageGalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasSwiped, setHasSwiped] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // If video exists with thumbnail, use thumbnail as first image
  const hasVideo = !!videoUrl;
  const displayImages = hasVideo && videoThumbnailUrl 
    ? [videoThumbnailUrl, ...images.filter(img => img !== videoThumbnailUrl)]
    : images;

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setHasSwiped(true);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index);
  }, [emblaApi]);

  const openFullscreen = useCallback(() => {
    setIsFullscreen(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  // If no images, show placeholder or video thumbnail
  if ((!images || images.length === 0) && !hasVideo) {
    return (
      <div className="relative">
        <ZoomableImage
          src="/lovable-uploads/placeholder.png"
          alt={alt}
          className={className}
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 z-30 bg-black/60 hover:bg-black/80 text-white rounded-full h-8 w-8"
          onClick={openFullscreen}
        >
          <Expand className="h-4 w-4" />
        </Button>
        <FullscreenGallery
          images={["/lovable-uploads/placeholder.png"]}
          alt={alt}
          initialIndex={0}
          isOpen={isFullscreen}
          onClose={closeFullscreen}
        />
      </div>
    );
  }

  // Video only (no images)
  if (hasVideo && displayImages.length === 0) {
    return (
      <div className="relative">
        <div 
          className="relative cursor-pointer"
          onClick={() => setIsVideoOpen(true)}
        >
          <img
            src={videoThumbnailUrl || "/lovable-uploads/placeholder.png"}
            alt={alt}
            className={cn(className, "w-full object-cover")}
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
              <Play className="h-8 w-8 text-white fill-white ml-1" />
            </div>
          </div>
        </div>
        <VideoPlayer
          videoUrl={videoUrl}
          isOpen={isVideoOpen}
          onClose={() => setIsVideoOpen(false)}
          title={alt}
        />
      </div>
    );
  }

  // Single image (or video thumbnail as single item) - show with fullscreen option
  if (displayImages.length === 1) {
    const isVideoThumbnail = hasVideo && displayImages[0] === videoThumbnailUrl;
    
    return (
      <div className="relative">
        {isVideoThumbnail ? (
          <div 
            className="relative cursor-pointer"
            onClick={() => setIsVideoOpen(true)}
          >
            <img
              src={displayImages[0]}
              alt={alt}
              className={cn(className, "w-full object-cover")}
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <Play className="h-8 w-8 text-white fill-white ml-1" />
              </div>
            </div>
          </div>
        ) : (
          <ZoomableImage
            src={displayImages[0]}
            alt={alt}
            className={className}
          />
        )}
        {!isVideoThumbnail && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-30 bg-black/60 hover:bg-black/80 text-white rounded-full h-8 w-8"
            onClick={openFullscreen}
          >
            <Expand className="h-4 w-4" />
          </Button>
        )}
        <FullscreenGallery
          images={images}
          alt={alt}
          initialIndex={0}
          isOpen={isFullscreen}
          onClose={closeFullscreen}
        />
        {hasVideo && (
          <VideoPlayer
            videoUrl={videoUrl}
            isOpen={isVideoOpen}
            onClose={() => setIsVideoOpen(false)}
            title={alt}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Fullscreen button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-12 z-30 bg-black/60 hover:bg-black/80 text-white rounded-full h-8 w-8"
        onClick={openFullscreen}
      >
        <Expand className="h-4 w-4" />
      </Button>

      {/* Carousel container */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {displayImages.map((src, index) => {
            const isVideoThumbnail = hasVideo && index === 0 && src === videoThumbnailUrl;
            
            return (
              <div key={index} className="flex-[0_0_100%] min-w-0">
                {isVideoThumbnail ? (
                  <div 
                    className="relative cursor-pointer"
                    onClick={() => setIsVideoOpen(true)}
                  >
                    <img
                      src={src}
                      alt={`${alt} - Vidéo`}
                      className={cn(className, "w-full object-cover")}
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                        <Play className="h-8 w-8 text-white fill-white ml-1" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <ZoomableImage
                    src={src}
                    alt={`${alt} - ${index + 1}`}
                    className={className}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation arrows (desktop only) */}
      {!isMobile && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white rounded-full h-10 w-10 shadow-md"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white rounded-full h-10 w-10 shadow-md"
            onClick={scrollNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Swipe indicator (mobile only, disappears after first swipe) */}
      {isMobile && !hasSwiped && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 
                        bg-black/60 text-white text-xs px-3 py-1.5 rounded-full
                        animate-pulse flex items-center gap-2 pointer-events-none">
          <span>👈</span>
          <span>Glissez pour voir plus</span>
          <span>👉</span>
        </div>
      )}

      {/* Pagination dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
        {displayImages.map((_, index) => (
          <button
            key={index}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === selectedIndex
                ? "bg-white w-4"
                : "bg-white/50 w-2 hover:bg-white/70"
            )}
            onClick={() => scrollTo(index)}
            aria-label={`Aller à l'image ${index + 1}`}
          />
        ))}
      </div>

      {/* Image counter */}
      <div className="absolute top-3 left-3 z-30 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full pointer-events-none">
        {selectedIndex + 1} / {displayImages.length}
      </div>

      {/* Fullscreen Gallery */}
      <FullscreenGallery
        images={images}
        alt={alt}
        initialIndex={selectedIndex}
        isOpen={isFullscreen}
        onClose={closeFullscreen}
      />

      {/* Video Player */}
      {hasVideo && (
        <VideoPlayer
          videoUrl={videoUrl}
          isOpen={isVideoOpen}
          onClose={() => setIsVideoOpen(false)}
          title={alt}
        />
      )}
    </div>
  );
}
