import { Zap, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ImageFormat = 'webp' | 'jpeg' | 'png' | 'original';

interface FormatBadgeProps {
  format: ImageFormat;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

const formatConfig: Record<ImageFormat, { 
  label: string; 
  color: string;
  Icon: typeof Zap | typeof ImageIcon;
}> = {
  webp: { 
    label: 'WebP', 
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Icon: Zap
  },
  jpeg: { 
    label: 'JPEG', 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Icon: ImageIcon
  },
  png: { 
    label: 'PNG', 
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    Icon: ImageIcon
  },
  original: { 
    label: 'Original', 
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    Icon: ImageIcon
  }
};

export function FormatBadge({ 
  format, 
  size = 'sm', 
  showIcon = true,
  className 
}: FormatBadgeProps) {
  const config = formatConfig[format];
  const { label, color, Icon } = config;
  
  return (
    <Badge 
      variant="secondary"
      className={cn(
        "font-mono border-0",
        size === 'sm' ? 'text-[8px] px-1 py-0' : 'text-xs px-2 py-0.5',
        color,
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(
          size === 'sm' ? 'h-2 w-2 mr-0.5' : 'h-3 w-3 mr-1'
        )} />
      )}
      {label}
    </Badge>
  );
}
