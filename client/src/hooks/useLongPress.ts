import { useRef, useCallback } from 'react';

interface LongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  threshold?: number; // milliseconds
}

export function useLongPress({
  onLongPress,
  onClick,
  threshold = 500
}: LongPressOptions) {
  const isLongPress = useRef(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    // Only prevent default on touch to avoid text selection, not on mouse events
    if ('touches' in e) {
      e.preventDefault();
    }
    
    // Record start position
    if ('touches' in e) {
      startPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    } else {
      startPos.current = {
        x: e.clientX,
        y: e.clientY
      };
    }

    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, threshold);
  }, [onLongPress, threshold]);

  const cancel = useCallback((e?: React.TouchEvent | React.MouseEvent) => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    // Check if finger/mouse moved too much (treat as scroll/swipe)
    if (e && startPos.current) {
      const currentPos = 'touches' in e 
        ? { x: e.touches[0]?.clientX || 0, y: e.touches[0]?.clientY || 0 }
        : { x: e.clientX, y: e.clientY };
      
      const distance = Math.sqrt(
        Math.pow(currentPos.x - startPos.current.x, 2) + 
        Math.pow(currentPos.y - startPos.current.y, 2)
      );

      // If moved more than 10 pixels, treat as scroll/swipe
      if (distance > 10) {
        isLongPress.current = false;
      }
    }
  }, []);

  const end = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    if (!isLongPress.current && onClick) {
      onClick();
    }

    isLongPress.current = false;
    startPos.current = null;
  }, [onClick]);

  return {
    onTouchStart: start,
    onTouchMove: cancel,
    onTouchEnd: end,
    onMouseDown: start,
    onMouseMove: cancel,
    onMouseUp: end,
    onMouseLeave: cancel,
    onTouchCancel: cancel,
  };
}