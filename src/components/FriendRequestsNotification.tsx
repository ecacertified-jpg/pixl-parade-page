import { useState } from "react";
import { UserPlus, Check, X, Loader2, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isValidImageUrl } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { type FriendRequest } from "@/hooks/useFriendRequests";

interface FriendRequestsNotificationProps {
  requests: FriendRequest[];
  onAccept: (requestId: string, requesterId: string) => Promise<boolean>;
  onDecline: (requestId: string) => Promise<boolean>;
}

export function FriendRequestsNotification({
  requests,
  onAccept,
  onDecline,
}: FriendRequestsNotificationProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (requests.length === 0) return null;

  const handleAccept = async (req: FriendRequest) => {
    setActionLoading(`accept-${req.id}`);
    await onAccept(req.id, req.requester_id);
    setActionLoading(null);
  };

  const handleDecline = async (req: FriendRequest) => {
    setActionLoading(`decline-${req.id}`);
    await onDecline(req.id);
    setActionLoading(null);
  };

  return (
    <Card className="mb-3 border-primary/20 bg-primary/5">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="relative">
            <UserPlus className="h-4 w-4 text-primary" />
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {requests.length}
            </span>
          </div>
          <span>Demandes d'amitié reçues</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        <AnimatePresence>
          {requests.map((req) => {
            const name = [req.profile?.first_name, req.profile?.last_name]
              .filter(Boolean)
              .join(" ") || "Utilisateur";
            const initials = name.split(" ").map(n => n[0]).join("").toUpperCase();

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3 p-2 rounded-lg bg-card"
              >
                <Avatar className="w-10 h-10 mt-0.5">
                  {isValidImageUrl(req.profile?.avatar_url) && (
                    <AvatarImage src={req.profile!.avatar_url!} alt={name} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{name}</p>
                  {req.message && (
                    <p className="text-xs text-muted-foreground flex items-start gap-1 mt-0.5">
                      <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{req.message}</span>
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      size="sm"
                      className="h-7 gap-1 text-xs"
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
                      className="h-7 gap-1 text-xs"
                      disabled={actionLoading !== null}
                      onClick={() => handleDecline(req)}
                    >
                      {actionLoading === `decline-${req.id}` ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      Refuser
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
