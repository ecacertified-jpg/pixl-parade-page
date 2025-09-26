import { Gift, PartyPopper, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function WhatDoYouWantCard() {
  const navigate = useNavigate();

  const handleOfferGift = () => {
    navigate("/shop");
  };

  const handleCelebrate = () => {
    // Navigate to create event/post page or show modal
    navigate("/dashboard");
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-card p-6 rounded-2xl">
      {/* Header with sparkles */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <h2 className="text-lg font-semibold text-foreground text-center">
            Que voulez-vous célébrer aujourd'hui ?
          </h2>
          <Sparkles className="h-5 w-5 text-secondary animate-pulse" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-4">
        {/* Offer Gift Button */}
        <Button
          onClick={handleOfferGift}
          variant="outline"
          className="h-auto py-6 px-4 flex flex-col items-center gap-3 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:from-primary/10 hover:to-primary/15 hover:border-primary/30 transition-all duration-300 hover:shadow-soft group"
        >
          <div className="bg-primary/10 p-3 rounded-full group-hover:bg-primary/20 transition-colors">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground text-sm">Offrir</p>
            <p className="text-xs text-muted-foreground mt-1">Faire plaisir à quelqu'un</p>
          </div>
        </Button>

        {/* Celebrate Button */}
        <Button
          onClick={handleCelebrate}
          variant="outline"
          className="h-auto py-6 px-4 flex flex-col items-center gap-3 bg-gradient-to-br from-secondary/5 to-accent/10 border-secondary/20 hover:from-secondary/10 hover:to-accent/15 hover:border-secondary/30 transition-all duration-300 hover:shadow-soft group"
        >
          <div className="bg-secondary/10 p-3 rounded-full group-hover:bg-secondary/20 transition-colors">
            <PartyPopper className="h-6 w-6 text-secondary" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground text-sm">Célébrer</p>
            <p className="text-xs text-muted-foreground mt-1">Partager la joie</p>
          </div>
        </Button>
      </div>
    </Card>
  );
}