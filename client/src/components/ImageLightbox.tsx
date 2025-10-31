import { useEffect, useCallback, useState } from "react";
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
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

  // Reset loading and error states when image changes
  useEffect(() => {
    setIsLoading(true);
    setImageError(false);
  }, [currentIndex]);

  const currentImage = images[currentIndex];
  
  // Handle different image URL formats
  const getImageSrc = (imageUrl: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    } else if (imageUrl.startsWith('/objects/')) {
      // Remove the /objects/ prefix before adding /api/objects/serve
      const pathWithoutObjects = imageUrl.slice('/objects/'.length);
      return `/api/objects/serve/${encodeURIComponent(pathWithoutObjects)}`;
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
        className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0 [&>button:first-of-type]:hidden"
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
        <div className="flex items-center justify-center w-full h-[90vh] p-4 relative">
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
          
          {/* Error state */}
          {imageError && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <p className="text-lg mb-2">Failed to load image</p>
                <p className="text-sm opacity-75">{currentImage}</p>
              </div>
            </div>
          )}
          
          {/* Image */}
          <img
            key={`${currentImage}-${currentIndex}`} // Force re-render on image change
            src={getImageSrc(currentImage)}
            alt={`Image ${currentIndex + 1} of ${images.length}`}
            className={`max-w-full max-h-full object-contain ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
            data-testid="lightbox-image"
            onLoad={() => {
              setIsLoading(false);
              setImageError(false);
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              // First try with fallback for non-http URLs
              if (!target.dataset.fallbackTried && !currentImage.startsWith('http')) {
                target.dataset.fallbackTried = 'true';
                target.src = currentImage;
              } else {
                // If fallback also failed, show error state
                setIsLoading(false);
                setImageError(true);
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
