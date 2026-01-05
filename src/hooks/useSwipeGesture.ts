import { useState, useCallback, useRef } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  velocityThreshold?: number;
  maxOffset?: number;
}

interface SwipeState {
  isSwiping: boolean;
  swipeOffset: number;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  velocityThreshold = 0.3,
  maxOffset = 120,
}: SwipeConfig) {
  const [state, setState] = useState<SwipeState>({ isSwiping: false, swipeOffset: 0 });
  const startRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    isHorizontalSwipe.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startRef.current.x;
    const deltaY = touch.clientY - startRef.current.y;

    // Determine swipe direction on first significant move
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    // Only handle horizontal swipes
    if (isHorizontalSwipe.current) {
      e.preventDefault();
      const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
      setState({ isSwiping: true, swipeOffset: clampedOffset });
    }
  }, [maxOffset]);

  const handleTouchEnd = useCallback(() => {
    if (!startRef.current || !isHorizontalSwipe.current) {
      setState({ isSwiping: false, swipeOffset: 0 });
      startRef.current = null;
      isHorizontalSwipe.current = null;
      return;
    }

    const { swipeOffset } = state;
    const elapsed = Date.now() - startRef.current.time;
    const velocity = Math.abs(swipeOffset) / elapsed;

    const shouldTrigger = Math.abs(swipeOffset) >= threshold || velocity >= velocityThreshold;

    if (shouldTrigger) {
      if (swipeOffset < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (swipeOffset > 0 && onSwipeRight) {
        onSwipeRight();
      }
    }

    setState({ isSwiping: false, swipeOffset: 0 });
    startRef.current = null;
    isHorizontalSwipe.current = null;
  }, [state.swipeOffset, threshold, velocityThreshold, onSwipeLeft, onSwipeRight]);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isSwiping: state.isSwiping,
    swipeOffset: state.swipeOffset,
  };
}
