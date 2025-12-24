import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealtimeConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
}

export function RealtimeConnectionStatus({ isConnected, isConnecting }: RealtimeConnectionStatusProps) {
  if (isConnecting) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Connexion...</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-2",
      isConnected ? "text-green-600" : "text-destructive"
    )}>
      <div className="relative">
        {isConnected ? (
          <>
            <Wifi className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          </>
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
      </div>
      <span className="text-sm font-medium">
        {isConnected ? 'En ligne' : 'Déconnecté'}
      </span>
    </div>
  );
}
