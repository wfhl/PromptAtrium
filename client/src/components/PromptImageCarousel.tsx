import React, { useState, useEffect, useRef, useCallback } from "react";
import { ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PromptImageCarouselProps {
  images: string[];
  promptName: string;
  onImageClick?: (imageUrl: string) => void;
}

export function PromptImageCarousel({ images, promptName, onImageClick }: PromptImageCarouselProps) {
  const [slides, setSlides] = useState<any[]>([]);
  const [translateX, setTranslateX] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastWheelTime = useRef(0);
  
  const FIXED_HEIGHT = 150; // Smaller height for prompt cards
  const GAP = 12;
  
  // Drag state
  const dragState = useRef({
    startX: 0,
    startTranslateX: 0,
    velocityTracker: [] as { x: number; time: number }[],
    isClick: true
  });
  
  const animationRef = useRef<number | null>(null);

  // Load images and calculate widths based on aspect ratio
  useEffect(() => {
    const loadImages = async () => {
      const loadedSlides = await Promise.all(
        images.map((imageUrl, index) => {
          return new Promise<any>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const aspectRatio = img.naturalWidth / img.naturalHeight;
              const calculatedWidth = Math.round(FIXED_HEIGHT * aspectRatio);
              
              // Handle different image URL formats
              let imageSrc = imageUrl;
              if (imageUrl.startsWith('http')) {
                imageSrc = imageUrl;
              } else if (imageUrl.startsWith('/api/dev-storage/')) {
                // Dev storage paths should be used directly
                imageSrc = imageUrl;
              } else if (imageUrl.startsWith('/')) {
                // Other absolute paths
                imageSrc = imageUrl;
              } else {
                // Relative paths need the objects/serve prefix
                imageSrc = `/api/objects/serve/${encodeURIComponent(imageUrl)}`;
              }
              
              resolve({
                id: index,
                src: imageSrc,
                originalUrl: imageUrl,
                alt: `Example ${index + 1} for ${promptName}`,
                width: calculatedWidth,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight
              });
            };
            img.onerror = () => {
              // Handle different image URL formats for fallback
              let imageSrc = imageUrl;
              if (imageUrl.startsWith('http')) {
                imageSrc = imageUrl;
              } else if (imageUrl.startsWith('/api/dev-storage/')) {
                // Dev storage paths should be used directly
                imageSrc = imageUrl;
              } else if (imageUrl.startsWith('/')) {
                // Other absolute paths
                imageSrc = imageUrl;
              } else {
                // Relative paths need the objects/serve prefix
                imageSrc = `/api/objects/serve/${encodeURIComponent(imageUrl)}`;
              }
              
              // Fallback width if image fails to load
              resolve({
                id: index,
                src: imageSrc,
                originalUrl: imageUrl,
                alt: `Example ${index + 1} for ${promptName}`,
                width: 150,
                naturalWidth: 150,
                naturalHeight: 150
              });
            };
            
            // Set the img.src with the same logic
            if (imageUrl.startsWith('http')) {
              img.src = imageUrl;
            } else if (imageUrl.startsWith('/api/dev-storage/')) {
              img.src = imageUrl;
            } else if (imageUrl.startsWith('/')) {
              img.src = imageUrl;
            } else {
              img.src = `/api/objects/serve/${encodeURIComponent(imageUrl)}`;
            }
          });
        })
      );
      
      setSlides(loadedSlides);
      setImagesLoaded(true);
    };

    if (images && images.length > 0) {
      loadImages();
    }
  }, [images, promptName]);

  // Update container width on resize
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, []);

  // Calculate total content width and scroll limits
  const getTotalContentWidth = () => {
    return slides.reduce((total, slide) => total + slide.width + GAP, 0) - GAP;
  };

  const getScrollLimits = () => {
    const totalWidth = getTotalContentWidth();
    const maxScroll = Math.max(0, totalWidth - containerWidth);
    return { min: -maxScroll, max: 0 };
  };

  // Constrain scroll position within limits
  const constrainPosition = (position: number) => {
    const { min, max } = getScrollLimits();
    return Math.max(min, Math.min(max, position));
  };

  // Smooth scroll by a certain amount
  const scrollBy = useCallback((amount: number) => {
    if (slides.length === 0) return;
    
    const newPosition = constrainPosition(translateX + amount);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    setIsTransitioning(true);
    
    const startPosition = translateX;
    const distance = newPosition - startPosition;
    const duration = 400;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easeOutCubic for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentPosition = startPosition + (distance * easeProgress);
      
      setTranslateX(currentPosition);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsTransitioning(false);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [translateX, slides.length]);

  // Navigate left (show previous images)
  const scrollLeft = useCallback(() => {
    const scrollAmount = containerWidth * 0.8;
    scrollBy(scrollAmount);
  }, [scrollBy, containerWidth]);

  // Navigate right (show next images)
  const scrollRight = useCallback(() => {
    const scrollAmount = -containerWidth * 0.8;
    scrollBy(scrollAmount);
  }, [scrollBy, containerWidth]);

  // Start drag
  const handleDragStart = useCallback((clientX: number) => {
    if (isTransitioning || slides.length === 0) return;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    setIsDragging(true);
    dragState.current = {
      startX: clientX,
      startTranslateX: translateX,
      velocityTracker: [{ x: clientX, time: performance.now() }],
      isClick: true
    };
  }, [translateX, isTransitioning, slides.length]);

  // Handle drag move
  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging || slides.length === 0) return;
    
    const deltaX = clientX - dragState.current.startX;
    
    // Mark as not a click if moved more than 8px
    if (Math.abs(deltaX) > 8) {
      dragState.current.isClick = false;
    }
    
    const newPosition = constrainPosition(dragState.current.startTranslateX + deltaX);
    setTranslateX(newPosition);
    
    // Track velocity
    const now = performance.now();
    dragState.current.velocityTracker.push({ x: clientX, time: now });
    
    // Keep only recent points for velocity calculation
    dragState.current.velocityTracker = dragState.current.velocityTracker
      .filter(point => now - point.time < 100);
  }, [isDragging, slides.length]);

  // End drag with momentum
  const handleDragEnd = useCallback(() => {
    if (!isDragging || slides.length === 0) return;
    
    setIsDragging(false);
    
    // If it was just a click, don't apply momentum
    if (dragState.current.isClick) {
      return;
    }
    
    // Calculate velocity
    const { velocityTracker } = dragState.current;
    let velocity = 0;
    
    if (velocityTracker.length >= 2) {
      const recent = velocityTracker.slice(-3);
      const first = recent[0];
      const last = recent[recent.length - 1];
      const timeDiff = last.time - first.time;
      
      if (timeDiff > 0) {
        velocity = (last.x - first.x) / timeDiff;
      }
    }
    
    // Apply momentum if velocity is significant
    const minVelocity = 0.5;
    
    if (Math.abs(velocity) > minVelocity) {
      // Start momentum animation
      let currentVelocity = velocity * 300;
      let currentPosition = translateX;
      const friction = 0.95;
      
      const momentumAnimate = () => {
        currentVelocity *= friction;
        const newPosition = constrainPosition(currentPosition + currentVelocity / 60);
        
        // If we hit a boundary, reduce velocity more aggressively
        if (newPosition !== currentPosition + currentVelocity / 60) {
          currentVelocity *= 0.3;
        }
        
        currentPosition = newPosition;
        setTranslateX(currentPosition);
        
        if (Math.abs(currentVelocity) > 10) {
          animationRef.current = requestAnimationFrame(momentumAnimate);
        }
      };
      
      animationRef.current = requestAnimationFrame(momentumAnimate);
    }
  }, [isDragging, translateX, slides.length]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    e.preventDefault();
    handleDragMove(e.clientX);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleDragMove(e.touches[0].clientX);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse wheel
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    const now = Date.now();
    if (now - lastWheelTime.current < 100) return;
    lastWheelTime.current = now;
    
    const scrollAmount = e.deltaY > 0 ? -100 : 100;
    const newPosition = constrainPosition(translateX + scrollAmount);
    setTranslateX(newPosition);
  }, [translateX]);

  // Global event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Handle image click
  const handleImageClick = useCallback((slide: any, e: React.MouseEvent) => {
    // Only trigger if it was a click (not a drag)
    if (dragState.current.isClick) {
      e.stopPropagation();
      if (onImageClick) {
        onImageClick(slide.originalUrl);
      }
    }
  }, [onImageClick]);

  if (!images || images.length === 0) {
    return null;
  }

  // Show loading state while images are loading
  if (!imagesLoaded || slides.length === 0) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-muted-foreground">Loading images...</span>
        </div>
        <div className="h-[150px] bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  // Check if scrolling is possible
  const canScrollLeft = translateX < 0;
  const canScrollRight = translateX > getScrollLimits().min;
  const needsScroll = getTotalContentWidth() > containerWidth;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-muted-foreground">
          Example Images ({slides.length})
        </span>
      </div>
      
      <div 
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg"
        style={{ cursor: isDragging ? "grabbing" : needsScroll ? "grab" : "default" }}
      >
        {/* Navigation Arrows */}
        {needsScroll && canScrollLeft && (
          <Button
            size="sm"
            variant="secondary"
            onClick={scrollLeft}
            disabled={isTransitioning || isDragging}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-background/90 hover:bg-background shadow-lg"
            style={{ opacity: isTransitioning || isDragging ? 0.5 : 1 }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {needsScroll && canScrollRight && (
          <Button
            size="sm"
            variant="secondary"
            onClick={scrollRight}
            disabled={isTransitioning || isDragging}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-background/90 hover:bg-background shadow-lg"
            style={{ opacity: isTransitioning || isDragging ? 0.5 : 1 }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Slides Container */}
        <div 
          ref={sliderRef}
          style={{ height: `${FIXED_HEIGHT}px` }}
          className="relative"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="flex items-center h-full select-none"
            style={{
              transform: `translateX(${translateX}px)`,
              gap: `${GAP}px`,
              willChange: "transform"
            }}
          >
            {slides.map((slide) => (
              <div 
                key={slide.id}
                className="flex-shrink-0 relative group"
                style={{ 
                  width: `${slide.width}px`,
                  height: `${FIXED_HEIGHT}px`,
                  cursor: isDragging ? "grabbing" : "pointer"
                }}
                onClick={(e) => handleImageClick(slide, e)}
              >
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="w-full h-full object-cover rounded-md shadow-sm transition-shadow duration-200 pointer-events-none"
                  style={{
                    boxShadow: isDragging ? "0 2px 4px rgba(0, 0, 0, 0.1)" : undefined
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // Try fallback URL if not already tried
                    if (!target.dataset.fallbackTried && !slide.originalUrl.startsWith('http')) {
                      target.dataset.fallbackTried = 'true';
                      target.src = slide.originalUrl;
                    } else {
                      target.style.display = 'none';
                      // Add fallback or placeholder
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'fallback absolute inset-0 flex items-center justify-center bg-muted rounded-md';
                        fallback.innerHTML = '<span class="text-muted-foreground text-xs">Image unavailable</span>';
                        parent.appendChild(fallback);
                      }
                    }
                  }}
                />
                {!isDragging && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center rounded-md">
                    <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}