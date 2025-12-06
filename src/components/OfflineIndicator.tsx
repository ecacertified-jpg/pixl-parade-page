import { WifiOff, Wifi } from "lucide-react";
import { useOfflineData } from "@/hooks/useOfflineData";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const { isOnline, lastSync } = useOfflineData();
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // Show "back online" message briefly
      setShowBanner(true);
      const timer = setTimeout(() => {
        setShowBanner(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!showBanner) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-all duration-300",
        isOnline
          ? "bg-green-500 text-white"
          : "bg-amber-500 text-white"
      )}
    >
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Connexion rétablie</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>
              Mode hors-ligne
              {lastSync && (
                <span className="ml-1 text-xs opacity-80">
                  (dernière sync: {new Date(lastSync).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})
                </span>
              )}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
