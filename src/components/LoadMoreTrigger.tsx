import { useEffect, useRef } from 'react';

interface LoadMoreTriggerProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  rootMargin?: string;
}

export function LoadMoreTrigger({ 
  onLoadMore, 
  hasMore, 
  isLoading,
  rootMargin = '200px'
}: LoadMoreTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || !hasMore || isLoading) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin, threshold: 0 }
    );
    
    observer.observe(trigger);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoading, rootMargin]);
  
  if (!hasMore) return null;
  
  return <div ref={triggerRef} className="h-1" aria-hidden="true" />;
}
