import { Gift, PartyPopper, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ValueModal } from "@/components/ValueModal";
import { CelebrateMenu } from "@/components/CelebrateMenu";
import { supabase } from "@/integrations/supabase/client";
import { useUpcomingBirthdays } from "@/hooks/useUpcomingBirthdays";
import { useCelebrationFeedback } from "@/hooks/useCelebrationFeedback";
import confetti from "canvas-confetti";

export function WhatDoYouWantCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showValueModal, setShowValueModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const { birthdays } = useUpcomingBirthdays(7);
  const giftButtonRef = useRef<HTMLButtonElement>(null);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  const { triggerFeedback } = useCelebrationFeedback();

  const hasUpcomingBirthdays = birthdays.length > 0;
  const closestBirthday = birthdays[0];
  const isVeryUrgent = closestBirthday && closestBirthday.daysUntil <= 3;
  const isToday = closestBirthday && closestBirthday.daysUntil === 0;

  useEffect(() => {
    if (user?.id) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url, first_name, last_name')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setAvatarUrl(data.avatar_url);
          setUserName(`${data.first_name || ''} ${data.last_name || ''}`.trim());
        }
      };
      fetchProfile();
    }
  }, [user?.id]);

  // Trigger confetti and sound/vibration when there are upcoming birthdays
  useEffect(() => {
    if (hasUpcomingBirthdays && !hasTriggeredConfetti && giftButtonRef.current) {
      const rect = giftButtonRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      setTimeout(() => {
        confetti({
          particleCount: isVeryUrgent ? 40 : 20,
          spread: 70,
          origin: { x, y },
          colors: ['#8b5cf6', '#ec4899', '#fbbf24', '#34d399'],
          scalar: 0.8,
          gravity: 1.2,
        });

        // Trigger sound and vibration based on urgency
        triggerFeedback({
          sound: isToday ? 'tada' : isVeryUrgent ? 'chime' : 'pop',
          vibration: isToday ? 'birthday' : isVeryUrgent ? 'urgent' : 'gentle',
        });
      }, 800);

      setHasTriggeredConfetti(true);
    }
  }, [hasUpcomingBirthdays, hasTriggeredConfetti, isVeryUrgent, isToday, triggerFeedback]);
  
  const handleOfferGift = () => {
    // Trigger confetti and celebration feedback on click if there are upcoming birthdays
    if (hasUpcomingBirthdays && giftButtonRef.current) {
      const rect = giftButtonRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 60,
        spread: 100,
        origin: { x, y },
        colors: ['#8b5cf6', '#ec4899', '#fbbf24', '#34d399', '#f472b6'],
      });

      // Trigger celebration sound and vibration
      triggerFeedback({
        sound: 'tada',
        vibration: 'celebration',
      });
    }

    const dontShow = localStorage.getItem('jdv_value_modal_dont_show');
    
    if (dontShow === 'true') {
      navigate("/shop");
    } else {
      setShowValueModal(true);
    }
  };

  return (
    <Card className="backdrop-blur-sm border border-border/50 shadow-card p-6 rounded-2xl bg-sky-50">
      {/* Header with profile and question */}
      <div className="flex items-center gap-3 mb-6">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatarUrl || undefined} alt="Profile" />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {userName ? userName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-medium text-gray-500">
          Que voulez-vous célébrer aujourd'hui ?
        </h2>
      </div>

      {/* Upcoming birthday alert */}
      <AnimatePresence>
        {hasUpcomingBirthdays && closestBirthday && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl border border-pink-200"
          >
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                className="text-xl"
              >
                🎂
              </motion.span>
              <span className="text-sm font-medium text-pink-700">
                {closestBirthday.daysUntil === 0 
                  ? `C'est l'anniversaire de ${closestBirthday.name} !`
                  : closestBirthday.daysUntil === 1
                    ? `Anniversaire de ${closestBirthday.name} demain !`
                    : `Anniversaire de ${closestBirthday.name} dans ${closestBirthday.daysUntil}j`
                }
              </span>
              {birthdays.length > 1 && (
                <Badge variant="secondary" className="ml-auto text-xs bg-pink-200 text-pink-700">
                  +{birthdays.length - 1}
                </Badge>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Offer Gift Button - with animation when birthdays are upcoming */}
        <div className="relative">
          {/* Glow effect for upcoming birthdays */}
          {hasUpcomingBirthdays && (
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-400 to-purple-400"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.1, 0.3],
              }}
              transition={{
                duration: isVeryUrgent ? 1 : 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
          
          <motion.div
            animate={hasUpcomingBirthdays ? {
              scale: [1, 1.02, 1],
            } : {}}
            transition={{
              duration: isVeryUrgent ? 0.8 : 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Button 
              ref={giftButtonRef}
              onClick={handleOfferGift} 
              variant="outline" 
              className={`relative z-10 h-auto py-4 px-4 w-full flex items-center justify-center gap-3 border rounded-2xl transition-all duration-200 hover:shadow-md ${
                hasUpcomingBirthdays 
                  ? 'bg-gradient-to-r from-pink-50 to-purple-50 border-pink-300 hover:from-pink-100 hover:to-purple-100' 
                  : 'bg-neutral-50 border-border'
              }`}
            >
              {/* Sparkles for very urgent */}
              {isVeryUrgent && (
                <>
                  <motion.div
                    className="absolute top-1 right-2"
                    animate={{ 
                      scale: [0, 1, 0],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    <Sparkles className="h-3 w-3 text-yellow-500" />
                  </motion.div>
                  <motion.div
                    className="absolute bottom-1 left-2"
                    animate={{ 
                      scale: [0, 1, 0],
                      rotate: [0, -180, -360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: 0.7,
                    }}
                  >
                    <Sparkles className="h-3 w-3 text-pink-500" />
                  </motion.div>
                </>
              )}
              
              <Gift className={`h-5 w-5 ${hasUpcomingBirthdays ? 'text-pink-500' : 'text-primary'}`} />
              <span className="font-medium text-foreground">Offrir</span>
              {hasUpcomingBirthdays && (
                <Badge className="ml-1 bg-pink-500 text-white text-xs">
                  {birthdays.length}
                </Badge>
              )}
            </Button>
          </motion.div>
        </div>

        {/* Celebrate Button */}
        <CelebrateMenu>
          <Button variant="outline" className="h-auto py-4 px-4 flex items-center justify-center gap-3 border border-border rounded-2xl transition-all duration-200 hover:shadow-md bg-neutral-50">
            <PartyPopper className="h-5 w-5 text-secondary" />
            <span className="font-medium text-foreground">Célébrer</span>
          </Button>
        </CelebrateMenu>
      </div>

      <ValueModal isOpen={showValueModal} onClose={() => setShowValueModal(false)} />
    </Card>
  );
}