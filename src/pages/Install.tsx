import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Smartphone, Share, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Application installée !</CardTitle>
            <CardDescription>
              Joie de Vivre est maintenant installée sur votre appareil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/home")} className="w-full">
              Continuer vers l'application
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Installer l'application</h1>
              <p className="text-sm text-muted-foreground">Accès rapide et mode hors-ligne</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-0">
          <CardContent className="pt-6 text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Smartphone className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Joie de Vivre sur votre écran</h2>
            <p className="text-muted-foreground text-sm">
              Installez l'application pour un accès instantané et consultez vos favoris même sans connexion internet
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Accès instantané</h3>
                  <p className="text-sm text-muted-foreground">
                    Lancez l'application directement depuis votre écran d'accueil
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Mode hors-ligne</h3>
                  <p className="text-sm text-muted-foreground">
                    Consultez vos favoris et cagnottes même sans connexion internet
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Install Instructions */}
        {deferredPrompt ? (
          <Button onClick={handleInstallClick} className="w-full h-14 text-lg">
            <Download className="h-5 w-5 mr-2" />
            Installer Joie de Vivre
          </Button>
        ) : isIOS ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Share className="h-5 w-5" />
                Installation sur iPhone/iPad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  1
                </div>
                <p className="text-sm">
                  Appuyez sur le bouton <strong>Partager</strong> <Share className="h-4 w-4 inline" /> en bas de Safari
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  2
                </div>
                <p className="text-sm">
                  Faites défiler et sélectionnez <strong>Sur l'écran d'accueil</strong> <Plus className="h-4 w-4 inline" />
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  3
                </div>
                <p className="text-sm">
                  Appuyez sur <strong>Ajouter</strong> en haut à droite
                </p>
              </div>
            </CardContent>
          </Card>
        ) : isAndroid ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Installation sur Android</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  1
                </div>
                <p className="text-sm">
                  Appuyez sur le menu <strong>⋮</strong> en haut à droite de Chrome
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  2
                </div>
                <p className="text-sm">
                  Sélectionnez <strong>Installer l'application</strong> ou <strong>Ajouter à l'écran d'accueil</strong>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  3
                </div>
                <p className="text-sm">
                  Confirmez l'installation
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>Ouvrez cette page sur votre téléphone pour installer l'application</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Install;
