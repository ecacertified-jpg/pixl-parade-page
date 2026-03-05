import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OnlineUser } from '@/hooks/useOnlineUsers';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi } from 'lucide-react';

interface RealtimeOnlineUsersProps {
  users: OnlineUser[];
}

function getInitials(first: string, last: string) {
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || '?';
}

function getTimeSince(isoDate: string) {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
  if (diff < 1) return 'à l\'instant';
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff / 60)}h${diff % 60 > 0 ? `${diff % 60}m` : ''}`;
}

export function RealtimeOnlineUsers({ users }: RealtimeOnlineUsersProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="relative">
            <Wifi className="h-5 w-5 text-emerald-500" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          Utilisateurs en ligne
          <span className="ml-auto text-2xl font-bold text-foreground">
            {users.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Aucun utilisateur en ligne
          </p>
        ) : (
          <ScrollArea className="h-[300px] pr-2">
            <AnimatePresence mode="popLayout">
              {users.map((user) => (
                <motion.div
                  key={user.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 py-2 px-1 border-b border-border/50 last:border-0"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(user.first_name, user.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Connecté {getTimeSince(user.connected_at)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
