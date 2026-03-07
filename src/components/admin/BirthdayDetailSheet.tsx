import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Phone, Mail, MapPin, Calendar, Gift, Users, AlertTriangle, Cake, FileText, Heart, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { BirthdayEntry } from '@/hooks/useAdminBirthdays';

interface BirthdayDetailSheetProps {
  entry: BirthdayEntry | null;
  open: boolean;
  onClose: () => void;
}

function getUrgencyVariant(daysUntil: number): 'destructive' | 'default' | 'secondary' | 'outline' {
  if (daysUntil === 0) return 'destructive';
  if (daysUntil <= 3) return 'default';
  if (daysUntil <= 7) return 'secondary';
  return 'outline';
}

function getUrgencyLabel(daysUntil: number): string {
  if (daysUntil === 0) return "Aujourd'hui 🎂";
  if (daysUntil === 1) return 'Demain';
  return `Dans ${daysUntil} jours`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatBirthday(dateStr: string): string {
  const parts = dateStr.split('-');
  const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]}`;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

export function BirthdayDetailSheet({ entry, open, onClose }: BirthdayDetailSheetProps) {
  const navigate = useNavigate();

  if (!entry) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              {entry.avatarUrl && <AvatarImage src={entry.avatarUrl} alt={entry.name} />}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(entry.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <SheetTitle className="text-left truncate">{entry.name}</SheetTitle>
              <SheetDescription className="text-left flex items-center gap-2 mt-1">
                <Badge variant={entry.type === 'user' ? 'default' : 'outline'} className="text-xs">
                  {entry.type === 'user' ? (
                    <><Users className="h-3 w-3 mr-1" /> Utilisateur</>
                  ) : (
                    <><Gift className="h-3 w-3 mr-1" /> Contact</>
                  )}
                </Badge>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Birthday urgency */}
        <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-3 mb-4">
          <Cake className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">{formatBirthday(entry.birthday)}</p>
            <Badge variant={getUrgencyVariant(entry.daysUntil)} className="mt-1">
              {getUrgencyLabel(entry.daysUntil)}
            </Badge>
          </div>
        </div>

        <Separator className="my-2" />

        {/* Details */}
        <div className="space-y-1 mt-3">
          <InfoRow icon={Phone} label="Téléphone" value={entry.phone} />
          <InfoRow icon={Mail} label="Email" value={entry.email} />
          <InfoRow icon={MapPin} label="Ville" value={[entry.city, entry.countryCode].filter(Boolean).join(', ')} />
          <InfoRow icon={FileText} label="Bio" value={entry.bio} />
          <InfoRow icon={Heart} label="Relation" value={entry.relationship} />
          <InfoRow icon={FileText} label="Notes" value={entry.notes} />

          {entry.type === 'contact' && entry.ownerName && (
            <InfoRow icon={User} label="Propriétaire du contact" value={entry.ownerName} />
          )}

          <InfoRow icon={Calendar} label="Inscrit le" value={formatDate(entry.createdAt)} />

          {entry.type === 'user' && entry.totalBirthdaysCelebrated != null && (
            <InfoRow icon={Cake} label="Anniversaires célébrés" value={String(entry.totalBirthdaysCelebrated)} />
          )}

          {entry.type === 'user' && entry.isSuspended && (
            <div className="flex items-center gap-2 py-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <Badge variant="destructive">Compte suspendu</Badge>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <Button
          className="w-full"
          variant="outline"
          onClick={() => {
            onClose();
            if (entry.type === 'user') {
              navigate('/admin/users');
            } else if (entry.ownerId) {
              navigate('/admin/users');
            }
          }}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Voir dans la gestion utilisateurs
        </Button>
      </SheetContent>
    </Sheet>
  );
}
