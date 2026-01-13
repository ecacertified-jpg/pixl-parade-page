import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ZoomableImage } from "@/components/ZoomableImage";
import { FullscreenGallery } from "@/components/FullscreenGallery";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageGallery({ images, alt, className }: ImageGalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasSwiped, setHasSwiped] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isMobile = useIsMobile();

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

  // If no images, show placeholder
  if (!images || images.length === 0) {
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

  // Single image - show with fullscreen option
  if (images.length === 1) {
    return (
      <div className="relative">
        <ZoomableImage
          src={images[0]}
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
          images={images}
          alt={alt}
          initialIndex={0}
          isOpen={isFullscreen}
          onClose={closeFullscreen}
        />
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
          {images.map((src, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0">
              <ZoomableImage
                src={src}
                alt={`${alt} - ${index + 1}`}
                className={className}
              />
            </div>
          ))}
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
        {images.map((_, index) => (
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
        {selectedIndex + 1} / {images.length}
      </div>

      {/* Fullscreen Gallery */}
      <FullscreenGallery
        images={images}
        alt={alt}
        initialIndex={selectedIndex}
        isOpen={isFullscreen}
        onClose={closeFullscreen}
      />
    </div>
  );
}
