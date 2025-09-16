import React, { useState, useEffect, useRef, useCallback } from "react";

function VariableWidthCarousel() {
  // Sample image data - replace with your actual images
  const slideData = [
    { id: 1, src: "https://picsum.photos/400/300?random=1", alt: "Image 1" },
    { id: 2, src: "https://picsum.photos/300/300?random=2", alt: "Image 2" },
    { id: 3, src: "https://picsum.photos/500/300?random=3", alt: "Image 3" },
    { id: 4, src: "https://picsum.photos/350/300?random=4", alt: "Image 4" },
    { id: 5, src: "https://picsum.photos/450/300?random=5", alt: "Image 5" },
    { id: 6, src: "https://picsum.photos/280/300?random=6", alt: "Image 6" },
    { id: 7, src: "https://picsum.photos/380/300?random=7", alt: "Image 7" },
    { id: 8, src: "https://picsum.photos/320/300?random=8", alt: "Image 8" }
  ];

  const [slides, setSlides] = useState([]);
  const [translateX, setTranslateX] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  
  const sliderRef = useRef(null);
  const containerRef = useRef(null);
  const lastWheelTime = useRef(0);
  
  const FIXED_HEIGHT = 200;
  const GAP = 20;
  
  // Drag state
  const dragState = useRef({
    startX: 0,
    startTranslateX: 0,
    velocityTracker: [],
    isClick: true
  });
  
  const animationRef = useRef(null);

  // Load images and calculate widths based on aspect ratio
  useEffect(() => {
    const loadImages = async () => {
      const loadedSlides = await Promise.all(
        slideData.map((slideItem) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              const aspectRatio = img.naturalWidth / img.naturalHeight;
              const calculatedWidth = Math.round(FIXED_HEIGHT * aspectRatio);
              resolve({
                ...slideItem,
                width: calculatedWidth,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight
              });
            };
            img.onerror = () => {
              // Fallback width if image fails to load
              resolve({
                ...slideItem,
                width: 200,
                naturalWidth: 200,
                naturalHeight: 200
              });
            };
            img.src = slideItem.src;
          });
        })
      );
      
      setSlides(loadedSlides);
      setImagesLoaded(true);
    };

    loadImages();
  }, []);

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
  const constrainPosition = (position) => {
    const { min, max } = getScrollLimits();
    return Math.max(min, Math.min(max, position));
  };

  // Smooth scroll by a certain amount
  const scrollBy = useCallback((amount) => {
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
    
    const animate = (currentTime) => {
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
    const scrollAmount = containerWidth * 0.8; // Scroll by 80% of container width
    scrollBy(scrollAmount);
  }, [scrollBy, containerWidth]);

  // Navigate right (show next images)
  const scrollRight = useCallback(() => {
    const scrollAmount = -containerWidth * 0.8;
    scrollBy(scrollAmount);
  }, [scrollBy, containerWidth]);

  // Start drag
  const handleDragStart = useCallback((clientX) => {
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
  const handleDragMove = useCallback((clientX) => {
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
      let currentVelocity = velocity * 300; // Scale velocity
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
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e) => {
    e.preventDefault();
    handleDragMove(e.clientX);
  }, [handleDragMove]);

  const handleMouseUp = useCallback((e) => {
    e.preventDefault();
    handleDragEnd();
  }, [handleDragEnd]);

  // Touch events
  const handleTouchStart = useCallback((e) => {
    handleDragStart(e.touches[0].clientX);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    handleDragMove(e.touches[0].clientX);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse wheel
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    const now = Date.now();
    if (now - lastWheelTime.current < 100) return; // More responsive wheel
    lastWheelTime.current = now;
    
    const scrollAmount = e.deltaY > 0 ? -100 : 100; // Scroll in smaller increments
    const newPosition = constrainPosition(translateX + scrollAmount);
    setTranslateX(newPosition);
  }, [translateX]);

  // Global event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      
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

  // Show loading state while images are loading
  if (!imagesLoaded || slides.length === 0) {
    return (
      <div style={{ 
        padding: "20px", 
        backgroundColor: "#f8f9fa",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "300px"
      }}>
        <div style={{
          fontSize: "18px",
          color: "#666",
          textAlign: "center"
        }}>
          Loading images...
        </div>
      </div>
    );
  }

  // Check if scrolling is possible
  const canScrollLeft = translateX < 0;
  const canScrollRight = translateX > getScrollLimits().min;

  return (
    <div style={{ 
      padding: "20px", 
      backgroundColor: "#f8f9fa",
      fontFamily: "Arial, sans-serif"
    }}>
      <div 
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "1000px",
          margin: "0 auto",
          overflow: "hidden",
          borderRadius: "12px",
          cursor: isDragging ? "grabbing" : "grab"
        }}
      >
        {/* Navigation Arrows */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            disabled={isTransitioning || isDragging}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              cursor: "pointer",
              fontSize: "18px",
              color: "#333",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              opacity: isTransitioning || isDragging ? 0.5 : 1
            }}
          >
            ‹
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={scrollRight}
            disabled={isTransitioning || isDragging}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              cursor: "pointer",
              fontSize: "18px",
              color: "#333",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              opacity: isTransitioning || isDragging ? 0.5 : 1
            }}
          >
            ›
          </button>
        )}

        {/* Slides Container */}
        <div 
          ref={sliderRef}
          style={{
            height: `${FIXED_HEIGHT + 40}px`,
            position: "relative",
            overflow: "hidden"
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            transform: `translateX(${translateX}px)`,
            gap: `${GAP}px`,
            userSelect: "none",
            willChange: "transform"
          }}>
            {slides.map((slide) => (
              <div 
                key={slide.id} 
                style={{ 
                  width: `${slide.width}px`,
                  height: `${FIXED_HEIGHT}px`,
                  flexShrink: 0,
                  cursor: isDragging ? "grabbing" : "pointer"
                }}
              >
                <img
                  src={slide.src}
                  alt={slide.alt}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.2s ease",
                    pointerEvents: "none"
                  }}
                  onMouseEnter={(e) => {
                    if (!isDragging) {
                      e.target.style.boxShadow = "0 8px 15px rgba(0, 0, 0, 0.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VariableWidthCarousel;