import { Gift, PartyPopper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
export function WhatDoYouWantCard() {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const handleOfferGift = () => {
    navigate("/shop");
  };
  const handleCelebrate = () => {
    // Navigate to create event/post page or show modal
    navigate("/dashboard");
  };
  return <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-card p-6 rounded-2xl">
      {/* Header with profile and question */}
      <div className="flex items-center gap-3 mb-6">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user?.user_metadata?.avatar_url} alt="Profile" />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-medium text-gray-400">
          Que voulez-vous célébrer aujourd'hui ?
        </h2>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Offer Gift Button */}
        <Button onClick={handleOfferGift} variant="outline" className="h-auto py-4 px-4 flex items-center justify-center gap-3 bg-card hover:bg-muted/50 border border-border rounded-2xl transition-all duration-200 hover:shadow-md">
          <Gift className="h-5 w-5 text-primary" />
          <span className="font-medium text-foreground">Offrir</span>
        </Button>

        {/* Celebrate Button */}
        <Button onClick={handleCelebrate} variant="outline" className="h-auto py-4 px-4 flex items-center justify-center gap-3 bg-card hover:bg-muted/50 border border-border rounded-2xl transition-all duration-200 hover:shadow-md">
          <PartyPopper className="h-5 w-5 text-secondary" />
          <span className="font-medium text-foreground">Célébrer</span>
        </Button>
      </div>
    </Card>;
}