import { Gift, PartyPopper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { ValueModal } from "@/components/ValueModal";
import { CelebrateMenu } from "@/components/CelebrateMenu";
import { supabase } from "@/integrations/supabase/client";

export function WhatDoYouWantCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showValueModal, setShowValueModal] = useState(false);
  const { data: profile } = useUserProfile(user?.id);
  
  const handleOfferGift = () => {
    const dontShow = localStorage.getItem('jdv_value_modal_dont_show');
    
    if (dontShow === 'true') {
      navigate("/shop");
    } else {
      setShowValueModal(true);
    }
  };
  return <Card className="backdrop-blur-sm border border-border/50 shadow-card p-6 rounded-2xl bg-sky-50">
      {/* Header with profile and question */}
      <div className="flex items-center gap-3 mb-6">
        <OptimizedAvatar
          userId={user?.id}
          avatarUrl={profile?.avatar_url}
          name={profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : user?.email || 'User'}
          size={48}
        />
        <h2 className="text-lg font-medium text-gray-500">
          Que voulez-vous célébrer aujourd'hui ?
        </h2>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Offer Gift Button */}
        <Button onClick={handleOfferGift} variant="outline" className="h-auto py-4 px-4 flex items-center justify-center gap-3 border border-border rounded-2xl transition-all duration-200 hover:shadow-md bg-neutral-50">
          <Gift className="h-5 w-5 text-primary" />
          <span className="font-medium text-foreground">Offrir</span>
        </Button>

        {/* Celebrate Button */}
        <CelebrateMenu>
          <Button variant="outline" className="h-auto py-4 px-4 flex items-center justify-center gap-3 border border-border rounded-2xl transition-all duration-200 hover:shadow-md bg-neutral-50">
            <PartyPopper className="h-5 w-5 text-secondary" />
            <span className="font-medium text-foreground">Célébrer</span>
          </Button>
        </CelebrateMenu>
      </div>

      <ValueModal isOpen={showValueModal} onClose={() => setShowValueModal(false)} />
    </Card>;
}