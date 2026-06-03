import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EventCountdown } from "@/components/EventCountdown";

interface Page {
  title: string;
  description?: string | null;
  event_date?: string | null;
  spouse_first_name?: string | null;
  spouse_avatar_url?: string | null;
}

interface CreatorProfile {
  first_name: string;
  avatar_url: string | null;
}

interface Props {
  page: Page;
  creatorProfile: CreatorProfile | null;
  isWedding: boolean;
  emoji: string;
}

/** Bottom-anchored hero overlay shared by event pages (mariage, etc.). */
export function EventHeroOverlay({ page, creatorProfile, isWedding, emoji }: Props) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 p-4 md:p-6">
      <div className="flex flex-col items-center text-center">
        {(creatorProfile || page.spouse_first_name) && (
          <div className="flex items-center justify-center gap-2 mb-3">
            {creatorProfile && (
              <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-white shadow-soft ring-2 ring-white/20">
                {creatorProfile.avatar_url && (
                  <img
                    src={creatorProfile.avatar_url}
                    alt={creatorProfile.first_name || ""}
                    className="h-full w-full object-cover rounded-full"
                  />
                )}
                <AvatarFallback className="bg-primary/20 text-primary font-poppins font-bold text-lg">
                  {(creatorProfile.first_name || "?").charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
            {isWedding && page.spouse_first_name && (
              <>
                <Heart className="h-5 w-5 text-heart drop-shadow" />
                <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-white shadow-soft ring-2 ring-white/20">
                  {page.spouse_avatar_url && (
                    <img
                      src={page.spouse_avatar_url}
                      alt={page.spouse_first_name}
                      className="h-full w-full object-cover rounded-full"
                    />
                  )}
                  <AvatarFallback className="bg-accent/20 text-accent font-poppins font-bold text-lg">
                    {page.spouse_first_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </>
            )}
          </div>
        )}

        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="text-2xl md:text-4xl font-bold font-poppins text-white drop-shadow-lg"
        >
          {emoji} {page.title}
        </motion.h1>

        {page.description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm md:text-base text-white/90 mt-1 font-nunito drop-shadow"
          >
            {page.description}
          </motion.p>
        )}

        {page.event_date && <EventCountdown eventDate={page.event_date} />}
      </div>
    </div>
  );
}