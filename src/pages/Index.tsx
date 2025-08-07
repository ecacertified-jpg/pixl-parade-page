import { Bell, Mail, User, Gift } from "lucide-react";
import { NotificationCard } from "@/components/NotificationCard";
import { WelcomeSection } from "@/components/WelcomeSection";
import { ActionCard } from "@/components/ActionCard";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();

  const handleGiftAction = () => {
    toast({
      title: "Cadeau sélectionné !",
      description: "Redirection vers les options de cadeaux...",
    });
  };

  const handleDashboard = () => {
    toast({
      title: "Tableau de bord",
      description: "Accès à votre espace personnel...",
    });
  };

  const handleOfferGift = () => {
    toast({
      title: "Offrir un cadeau",
      description: "Parcourez notre sélection de cadeaux...",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              JOIE DE VIVRE
            </h1>
            <p className="text-sm text-muted-foreground">Célébrez ensemble</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-6 w-6 text-muted-foreground" />
              <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                1
              </div>
            </div>
            <Mail className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* Notification Card */}
        <NotificationCard
          title="Anniversaire de Fatou"
          subtitle="Événement à venir"
          daysLeft={5}
          onAction={handleGiftAction}
        />

        {/* Welcome Section */}
        <WelcomeSection userName="Aminata" />

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-4">
          <ActionCard
            title="Mon Tableau de Bord"
            subtitle="Gérez vos amis et événements"
            icon={User}
            variant="primary"
            onClick={handleDashboard}
          />
          
          <ActionCard
            title="Offrir un Cadeau"
            subtitle="Parcourez et offrez"
            icon={Gift}
            variant="success"
            onClick={handleOfferGift}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
