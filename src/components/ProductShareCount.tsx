import { Share2 } from "lucide-react";
import { useProductShares } from "@/hooks/useProductShares";
import { cn } from "@/lib/utils";

interface ProductShareCountProps {
  productId: string;
  compact?: boolean;
  showIcon?: boolean;
  className?: string;
}

export function ProductShareCount({ 
  productId, 
  compact = false,
  showIcon = true,
  className,
}: ProductShareCountProps) {
  const { stats, loading } = useProductShares(productId);
  
  // Don't show anything if loading, no stats, or zero shares
  if (loading || !stats || stats.totalShares === 0) return null;
  
  if (compact) {
    return (
      <span className={cn(
        "text-xs text-muted-foreground flex items-center gap-1",
        className
      )}>
        {showIcon && <Share2 className="h-3 w-3" />}
        {stats.totalShares}
      </span>
    );
  }
  
  return (
    <div className={cn(
      "flex items-center gap-1 text-sm text-muted-foreground",
      className
    )}>
      {showIcon && <Share2 className="h-4 w-4" />}
      <span>{stats.totalShares} partage{stats.totalShares > 1 ? 's' : ''}</span>
    </div>
  );
}
