import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "install_banner_dismissed";
const DISMISS_DURATION_DAYS = 7;

export const InstallBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed as PWA
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isInstalled) {
      setIsVisible(false);
      return;
    }

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissedDate = parseInt(dismissedAt, 10);
      const daysPassed = (Date.now() - dismissedDate) / (1000 * 60 * 60 * 24);
      if (daysPassed < DISMISS_DURATION_DAYS) {
        setIsVisible(false);
        return;
      }
    }

    setIsVisible(true);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsVisible(false);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      navigate("/install");
    }
  };

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-primary/15 via-accent/10 to-secondary/15 rounded-xl p-3 border border-primary/20 shadow-sm">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/50 transition-colors"
        aria-label="Fermer"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
      
      <div className="flex items-center gap-3 pr-6">
        <div className="flex-shrink-0 p-2 bg-primary/20 rounded-lg">
          <Smartphone className="h-5 w-5 text-primary animate-pulse" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Installez l'app pour un accès rapide !
          </p>
          <p className="text-xs text-muted-foreground">
            Accessible depuis votre écran d'accueil
          </p>
        </div>
        
        <Button 
          size="sm" 
          onClick={handleInstall}
          className="flex-shrink-0 gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Installer
        </Button>
      </div>
    </div>
  );
};
