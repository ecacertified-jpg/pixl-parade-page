import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FullscreenGalleryProps {
  images: string[];
  alt: string;
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute bottom-24 right-4 flex flex-col gap-2 z-50">
      <Button
        size="icon"
        variant="secondary"
        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0"
        onClick={() => zoomIn()}
      >
        <ZoomIn className="h-5 w-5" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0"
        onClick={() => zoomOut()}
      >
        <ZoomOut className="h-5 w-5" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0"
        onClick={() => resetTransform()}
      >
        <RotateCcw className="h-5 w-5" />
      </Button>
    </div>
  );
}

export function FullscreenGallery({
  images,
  alt,
  initialIndex,
  isOpen,
  onClose,
}: FullscreenGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [transformKey, setTransformKey] = useState(0);

  // Sync with initialIndex when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setTransformKey((k) => k + 1); // Reset zoom on navigation
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setTransformKey((k) => k + 1); // Reset zoom on navigation
  }, [images.length]);

  const goToFirst = useCallback(() => {
    setCurrentIndex(0);
    setTransformKey((k) => k + 1);
  }, []);

  const goToLast = useCallback(() => {
    setCurrentIndex(images.length - 1);
    setTransformKey((k) => k + 1);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for navigation keys
      if (["ArrowLeft", "ArrowRight", "Escape", "Home", "End"].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case "ArrowLeft":
          goToPrev();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case "Escape":
          onClose();
          break;
        case "Home":
          goToFirst();
          break;
        case "End":
          goToLast();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, goToPrev, goToNext, goToFirst, goToLast, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black z-[100] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white h-10 w-10 rounded-full"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Image counter */}
        <div className="absolute top-4 left-4 z-50 bg-black/60 text-white text-sm px-3 py-1.5 rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white h-12 w-12 rounded-full"
              onClick={goToPrev}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white h-12 w-12 rounded-full"
              onClick={goToNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </>
        )}

        {/* Zoomable image */}
        <TransformWrapper
          key={transformKey}
          initialScale={1}
          minScale={0.5}
          maxScale={6}
          centerOnInit
          doubleClick={{ mode: "toggle", step: 2 }}
        >
          <ZoomControls />
          <TransformComponent
            wrapperClass="!w-full !h-full"
            contentClass="!w-full !h-full flex items-center justify-center"
          >
            <motion.img
              key={currentIndex}
              src={images[currentIndex]}
              alt={`${alt} - ${currentIndex + 1}`}
              className="max-h-[85vh] max-w-[90vw] object-contain select-none"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              draggable={false}
            />
          </TransformComponent>
        </TransformWrapper>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 p-2 bg-black/40 backdrop-blur-sm rounded-lg max-w-[90vw] overflow-x-auto">
            {images.map((src, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setTransformKey((k) => k + 1);
                }}
                className={cn(
                  "flex-shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-all",
                  index === currentIndex
                    ? "border-white ring-2 ring-white/50"
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        )}

        {/* Keyboard shortcuts help */}
        <div className="absolute bottom-4 right-4 z-50 text-white/50 text-xs hidden md:block">
          ← → Naviguer • Esc Fermer • Double-clic Zoom
        </div>

        {/* Click backdrop to close (outside image area) */}
        <div
          className="absolute inset-0 -z-10"
          onClick={onClose}
        />
      </motion.div>
    </AnimatePresence>
  );
}
