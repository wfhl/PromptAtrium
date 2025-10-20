import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  open: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ImageLightbox({ images, currentIndex, open, onClose, onNavigate }: ImageLightboxProps) {
  const goToPrevious = useCallback(() => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    onNavigate(newIndex);
  }, [currentIndex, images.length, onNavigate]);

  const goToNext = useCallback(() => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    onNavigate(newIndex);
  }, [currentIndex, images.length, onNavigate]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, goToPrevious, goToNext]);

  const currentImage = images[currentIndex];
  
  // Handle different image URL formats
  const getImageSrc = (imageUrl: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    } else if (imageUrl.startsWith('/objects/')) {
      return `/api/objects/serve${imageUrl}`;
    } else if (imageUrl.startsWith('/api/')) {
      return imageUrl;
    } else if (imageUrl.startsWith('/')) {
      return imageUrl;
    } else {
      return `/api/objects/serve/${encodeURIComponent(imageUrl)}`;
    }
  };

  // Don't render if no valid image
  if (!currentImage || currentIndex < 0 || currentIndex >= images.length) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0"
        aria-describedby="lightbox-description"
      >
        <DialogTitle className="sr-only">Image Viewer</DialogTitle>
        <div className="sr-only" id="lightbox-description">
          Viewing image {currentIndex + 1} of {images.length}. Use arrow keys to navigate between images, Escape to close.
        </div>

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
          data-testid="button-close-lightbox"
          aria-label="Close lightbox"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Previous Button */}
        {images.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
            data-testid="button-previous-image"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}

        {/* Next Button */}
        {images.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12"
            data-testid="button-next-image"
            aria-label="Next image"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}

        {/* Image */}
        <div className="flex items-center justify-center w-full h-[90vh] p-4">
          <img
            src={getImageSrc(currentImage)}
            alt={`Image ${currentIndex + 1} of ${images.length}`}
            className="max-w-full max-h-full object-contain"
            data-testid="lightbox-image"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.dataset.fallbackTried && !currentImage.startsWith('http')) {
                target.dataset.fallbackTried = 'true';
                target.src = currentImage;
              }
            }}
          />
        </div>

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
