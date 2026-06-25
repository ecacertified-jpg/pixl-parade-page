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

/**
 * Bottom-anchored hero overlay for event pages (mariage, diplôme, baptême, …).
 * Mirrors the birthday hero layout: avatars on the left, title + countdown on the right.
 */
export function EventHeroOverlay({ page, creatorProfile, isWedding, emoji }: Props) {
  const hasSpouse = isWedding && !!page.spouse_first_name;
  const initial = (creatorProfile?.first_name || page.title || "?").charAt(0).toUpperCase();

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 p-4 md:p-6">
      <div className="flex items-end gap-3">
        {/* Avatar(s) */}
        <div className="relative flex items-center">
          <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-white shadow-soft ring-2 ring-white/20">
            {creatorProfile?.avatar_url ? (
              <img
                src={creatorProfile.avatar_url}
                alt={creatorProfile.first_name || ""}
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              <AvatarFallback className="bg-primary/20 text-primary font-poppins font-bold text-lg">
                {initial}
              </AvatarFallback>
            )}
          </Avatar>
          {hasSpouse && (
            <>
              <Heart className="h-4 w-4 md:h-5 md:w-5 text-heart drop-shadow mx-1" />
              <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-white shadow-soft ring-2 ring-white/20">
                {page.spouse_avatar_url ? (
                  <img
                    src={page.spouse_avatar_url}
                    alt={page.spouse_first_name || ""}
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <AvatarFallback className="bg-accent/20 text-accent font-poppins font-bold text-lg">
                    {(page.spouse_first_name || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
            </>
          )}
        </div>

        {/* Title + countdown */}
        <div className="flex-1 min-w-0 pb-1">
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-3xl font-bold font-poppins text-white drop-shadow-lg truncate"
          >
            {emoji} {page.title}
          </motion.h1>
          {page.event_date && (
            <div className="mt-1">
              <EventCountdown eventDate={page.event_date} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}