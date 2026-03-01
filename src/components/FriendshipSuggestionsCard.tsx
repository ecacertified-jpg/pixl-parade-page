import { UserCheck, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { isValidImageUrl } from '@/lib/utils';
import { FriendshipSuggestion } from '@/hooks/useFriendshipSuggestions';
import { motion, AnimatePresence } from 'framer-motion';

interface FriendshipSuggestionsCardProps {
  suggestions: FriendshipSuggestion[];
  onConfirm: (contactId: string, linkedUserId: string) => void;
  onDismiss: (contactId: string) => void;
}

export function FriendshipSuggestionsCard({
  suggestions,
  onConfirm,
  onDismiss,
}: FriendshipSuggestionsCardProps) {
  if (suggestions.length === 0) return null;

  return (
    <Card className="mb-3 border-primary/20 bg-primary/5">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2 font-medium">
          <UserCheck className="h-4 w-4 text-primary" />
          Relations à confirmer ({suggestions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        <AnimatePresence mode="popLayout">
          {suggestions.map((s) => {
            const profileName = s.profileFirstName
              ? `${s.profileFirstName} ${s.profileLastName || ''}`.trim()
              : null;
            const initials = (profileName || s.contactName)
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <motion.div
                key={s.contactId}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 rounded-lg bg-card p-2.5"
              >
                <Avatar className="h-9 w-9">
                  {isValidImageUrl(s.profileAvatarUrl) && (
                    <AvatarImage src={s.profileAvatarUrl!} alt={profileName || s.contactName} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.contactName}</p>
                  {profileName && profileName !== s.contactName && (
                    <p className="text-xs text-muted-foreground truncate">
                      Profil : {profileName}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => onDismiss(s.contactId)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs px-2.5 gap-1"
                    onClick={() => onConfirm(s.contactId, s.linkedUserId)}
                  >
                    <UserCheck className="h-3 w-3" />
                    Confirmer
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
