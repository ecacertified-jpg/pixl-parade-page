import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EventCountdown } from "@/components/EventCountdown";
import { EditAvatarModal } from "@/components/EditAvatarModal";
import { SpouseAvatarUploader } from "@/components/event/SpouseAvatarUploader";

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
  isOwner?: boolean;
  pageId?: string;
  creatorId?: string;
  onCreatorAvatarChange?: (url: string | null) => void;
  onSpouseAvatarChange?: (url: string | null) => void;
}

/**
 * Bottom-anchored hero overlay for event pages (mariage, diplôme, baptême, …).
 * For weddings, avatars are stacked vertically with a slight overlap to save
 * horizontal space for the event title.
 */
export function EventHeroOverlay({
  page,
  creatorProfile,
  isWedding,
  emoji,
  isOwner = false,
  pageId,
  creatorId,
  onCreatorAvatarChange,
  onSpouseAvatarChange,
}: Props) {
  const hasSpouse = isWedding && !!page.spouse_first_name;
  const initial = (creatorProfile?.first_name || page.title || "?").charAt(0).toUpperCase();
  const [showFullTitle, setShowFullTitle] = useState(false);
  const [editingCreator, setEditingCreator] = useState(false);
  const [editingSpouse, setEditingSpouse] = useState(false);

  const CameraBadge = () => (
    <span
      aria-hidden
      className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center ring-2 ring-white shadow-soft"
    >
      <Camera className="h-3.5 w-3.5" />
    </span>
  );

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 p-4 md:p-6">
      <div className="flex items-end gap-3">
        {/* Avatar(s) */}
        <div className={hasSpouse ? "relative flex flex-col items-center" : "relative"}>
          <button
            type="button"
            onClick={() => isOwner && creatorId && setEditingCreator(true)}
            disabled={!isOwner}
            aria-label={isOwner ? "Modifier ma photo" : undefined}
            className={`relative rounded-full ${isOwner ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary" : "cursor-default"}`}
          >
            <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-white shadow-soft ring-2 ring-white/20">
              {creatorProfile?.avatar_url && (
                <AvatarImage
                  src={creatorProfile.avatar_url}
                  alt={creatorProfile.first_name || ""}
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-primary/20 text-primary font-poppins font-bold text-lg">
                {initial}
              </AvatarFallback>
            </Avatar>
            {isOwner && <CameraBadge />}
          </button>
          {hasSpouse && (
            <button
              type="button"
              onClick={() => isOwner && pageId && setEditingSpouse(true)}
              disabled={!isOwner}
              aria-label={isOwner ? "Modifier la photo du/de la conjoint·e" : undefined}
              className={`relative -mt-3 md:-mt-4 rounded-full ${isOwner ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary" : "cursor-default"}`}
            >
              <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-white shadow-soft ring-2 ring-white/20">
                {page.spouse_avatar_url && (
                  <AvatarImage
                    src={page.spouse_avatar_url}
                    alt={page.spouse_first_name || ""}
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="bg-accent/20 text-accent font-poppins font-bold text-lg">
                  {(page.spouse_first_name || "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOwner && <CameraBadge />}
            </button>
          )}
        </div>

        {/* Title + countdown */}
        <div className="flex-1 min-w-0 pb-1">
          <TooltipProvider delayDuration={150}>
            <Tooltip open={showFullTitle} onOpenChange={setShowFullTitle}>
              <TooltipTrigger asChild>
                <motion.h1
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-left text-xl md:text-3xl font-bold font-poppins text-white drop-shadow-lg truncate cursor-pointer"
                  onClick={() => setShowFullTitle((v) => !v)}
                >
                  {emoji} {page.title}
                </motion.h1>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={8}
                className="max-w-[80vw] md:max-w-md whitespace-normal break-words"
              >
                <p className="font-poppins font-semibold text-sm md:text-base">
                  {emoji} {page.title}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <AnimatePresence>
            {!showFullTitle && page.event_date && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-1"
              >
                <EventCountdown eventDate={page.event_date} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {isOwner && creatorId && (
        <EditAvatarModal
          isOpen={editingCreator}
          onClose={() => setEditingCreator(false)}
          userId={creatorId}
          currentAvatarUrl={creatorProfile?.avatar_url || undefined}
          onAvatarUpdate={(url) => onCreatorAvatarChange?.(url || null)}
        />
      )}
      {isOwner && pageId && creatorId && hasSpouse && (
        <SpouseAvatarUploader
          isOpen={editingSpouse}
          onClose={() => setEditingSpouse(false)}
          pageId={pageId}
          creatorId={creatorId}
          currentUrl={page.spouse_avatar_url || null}
          onChange={(url) => onSpouseAvatarChange?.(url)}
        />
      )}
    </div>
  );
}