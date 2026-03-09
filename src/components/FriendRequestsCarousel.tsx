import { useState } from "react";
import { UserPlus, Check, X, Loader2, MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isValidImageUrl } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { type FriendRequest } from "@/hooks/useFriendRequests";

interface FriendRequestsCarouselProps {
  requests: FriendRequest[];
  onAccept: (requestId: string, requesterId: string) => Promise<boolean>;
  onDecline: (requestId: string) => Promise<boolean>;
}

export function FriendRequestsCarousel({
  requests,
  onAccept,
  onDecline,
}: FriendRequestsCarouselProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleRequests = requests.filter((r) => !dismissed.has(r.id));

  if (visibleRequests.length === 0) return null;

  const handleAccept = async (req: FriendRequest) => {
    setActionLoading(`accept-${req.id}`);
    const ok = await onAccept(req.id, req.requester_id);
    if (ok) setDismissed((prev) => new Set(prev).add(req.id));
    setActionLoading(null);
  };

  const handleDecline = async (req: FriendRequest) => {
    setActionLoading(`decline-${req.id}`);
    const ok = await onDecline(req.id);
    if (ok) setDismissed((prev) => new Set(prev).add(req.id));
    setActionLoading(null);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="relative">
          <UserPlus className="h-4 w-4 text-primary" />
          <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
            {visibleRequests.length}
          </span>
        </div>
        <h3 className="text-sm font-semibold font-poppins">
          Demandes d'amitié
        </h3>
      </div>

      <Carousel
        opts={{ align: "start", dragFree: true }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          <AnimatePresence>
            {visibleRequests.map((req) => {
              const name =
                [req.profile?.first_name, req.profile?.last_name]
                  .filter(Boolean)
                  .join(" ") || "Utilisateur";
              const initials = name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase();

              return (
                <CarouselItem
                  key={req.id}
                  className="pl-2 basis-[200px] md:basis-[220px]"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl border border-primary/15 bg-card p-3 flex flex-col items-center gap-2 shadow-card"
                  >
                    <Avatar className="w-14 h-14">
                      {isValidImageUrl(req.profile?.avatar_url) && (
                        <AvatarImage
                          src={req.profile!.avatar_url!}
                          alt={name}
                        />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-poppins">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <p className="text-sm font-semibold font-poppins text-center truncate w-full">
                      {name}
                    </p>

                    {req.mutualFriendsCount > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {req.mutualFriendsCount} ami{req.mutualFriendsCount > 1 ? "s" : ""} en commun
                      </span>
                    )}

                    {req.message && (
                      <p className="text-[11px] text-muted-foreground flex items-start gap-1 text-center line-clamp-2">
                        <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{req.message}</span>
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 w-full mt-1">
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs gap-1"
                        disabled={actionLoading !== null}
                        onClick={() => handleAccept(req)}
                      >
                        {actionLoading === `accept-${req.id}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        Accepter
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        disabled={actionLoading !== null}
                        onClick={() => handleDecline(req)}
                      >
                        {actionLoading === `decline-${req.id}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                </CarouselItem>
              );
            })}
          </AnimatePresence>
        </CarouselContent>
      </Carousel>
    </div>
  );
}
