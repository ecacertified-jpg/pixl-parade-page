import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertTriangle, Phone, Mail, UserCheck, UserPlus } from 'lucide-react';
import type { DuplicateCheckResult, MatchingProfile } from '@/hooks/useDuplicateAccountDetection';

interface DuplicateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicateResult: DuplicateCheckResult | null;
  onLoginWithGoogle: () => void;
  onLoginWithPhone: (phone: string) => void;
  onContinueAnyway: () => void;
}

export function DuplicateAccountModal({
  isOpen,
  onClose,
  duplicateResult,
  onLoginWithGoogle,
  onLoginWithPhone,
  onContinueAnyway,
}: DuplicateAccountModalProps) {
  if (!duplicateResult || !duplicateResult.hasPotentialDuplicate) {
    return null;
  }

  const { matchingProfiles, duplicateType, confidence } = duplicateResult;
  const primaryMatch = matchingProfiles[0];

  const getConfidenceColor = () => {
    switch (confidence) {
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getConfidenceText = () => {
    switch (confidence) {
      case 'high':
        return 'Correspondance exacte';
      case 'medium':
        return 'Correspondance probable';
      default:
        return 'Correspondance possible';
    }
  };

  const getModalTitle = () => {
    if (duplicateType === 'phone') {
      return 'Ce numéro est déjà associé à un compte';
    }
    if (duplicateType === 'name') {
      return 'Un compte similaire existe déjà';
    }
    return 'Un compte semble déjà exister';
  };

  const getModalDescription = () => {
    if (duplicateType === 'phone') {
      return 'Ce numéro de téléphone est déjà utilisé. Voulez-vous vous connecter à ce compte existant ?';
    }
    return 'Nous avons trouvé un compte avec des informations similaires. Est-ce le vôtre ?';
  };

  const getInitials = (profile: MatchingProfile) => {
    const first = profile.first_name?.charAt(0)?.toUpperCase() || '';
    const last = profile.last_name?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <AlertDialogTitle className="text-left">{getModalTitle()}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {getModalDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Profil trouvé */}
        <div className="my-4 p-4 bg-secondary/50 rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={primaryMatch.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(primaryMatch)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {primaryMatch.first_name} {primaryMatch.last_name}
              </p>
              {primaryMatch.city && (
                <p className="text-sm text-muted-foreground truncate">{primaryMatch.city}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Membre depuis {formatDate(primaryMatch.created_at)}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className={getConfidenceColor()}>
              {getConfidenceText()}
            </Badge>
            {primaryMatch.has_phone && (
              <Badge variant="secondary" className="gap-1">
                <Phone className="h-3 w-3" />
                Téléphone
              </Badge>
            )}
            {primaryMatch.has_google && (
              <Badge variant="secondary" className="gap-1">
                <Mail className="h-3 w-3" />
                Google
              </Badge>
            )}
          </div>
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          {/* Boutons de connexion au compte existant */}
          {primaryMatch.has_phone && primaryMatch.phone && (
            <Button
              className="w-full gap-2"
              onClick={() => onLoginWithPhone(primaryMatch.phone!)}
            >
              <UserCheck className="h-4 w-4" />
              C'est mon compte - Me connecter
            </Button>
          )}

          {primaryMatch.has_google && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onLoginWithGoogle}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              C'est mon compte - Me connecter avec Google
            </Button>
          )}

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Continuer quand même */}
          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground"
            onClick={onContinueAnyway}
          >
            <UserPlus className="h-4 w-4" />
            Ce n'est pas moi - Continuer l'inscription
          </Button>

          <AlertDialogCancel className="w-full mt-2">Annuler</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
