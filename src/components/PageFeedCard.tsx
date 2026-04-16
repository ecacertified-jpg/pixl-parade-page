import { Camera, Gift, Calendar, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { FeedPage } from "@/hooks/usePagesFeed";

const OCCASION_ICONS: Record<string, string> = {
  Anniversaire: '🎂',
  Mariage: '💒',
  Baptême: '👶',
  Fiançailles: '💍',
  Diplôme: '🎓',
  Promotion: '🎉',
  Événement: '🎊',
};

function formatRelativeDate(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

interface PageFeedCardProps {
  page: FeedPage;
}

export function PageFeedCard({ page }: PageFeedCardProps) {
  const navigate = useNavigate();
  const icon = OCCASION_ICONS[page.occasion] || OCCASION_ICONS['Événement'];
  const creatorName = [page.creator.first_name, page.creator.last_name].filter(Boolean).join(' ') || 'Utilisateur';
  const initials = (page.creator.first_name?.[0] || '') + (page.creator.last_name?.[0] || '');

  const fundProgress = page.fund
    ? Math.min(100, Math.round((page.fund.current_amount / page.fund.target_amount) * 100))
    : 0;

  const handleNavigate = () => {
    if (page.type === 'birthday') {
      navigate(`/birthday/${page.slug}`);
    } else {
      navigate(`/event/${page.slug}`);
    }
  };

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-shadow">
      {/* Header: creator info */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <Avatar className="h-10 w-10">
          <AvatarImage src={page.creator.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {initials || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{creatorName}</p>
          <p className="text-xs text-muted-foreground">{formatRelativeDate(page.created_at)}</p>
        </div>
        <span className="text-lg">{icon}</span>
      </div>

      {/* Title + occasion */}
      <div className="px-4 pb-2">
        <h4 className="font-semibold text-base">{page.title}</h4>
        {page.event_date && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="h-3 w-3" />
            {new Date(page.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Cover image or album grid */}
      {page.cover_image_url || page.album_preview.length > 0 ? (
        <div className="px-4 pb-3">
          {page.album_preview.length >= 4 ? (
            <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden aspect-square cursor-pointer" onClick={handleNavigate}>
              {page.album_preview.slice(0, 4).map((url, i) => (
                <img key={i} src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              ))}
            </div>
          ) : page.cover_image_url ? (
            <img
              src={page.cover_image_url}
              alt={page.title}
              className="w-full rounded-xl aspect-video object-cover cursor-pointer"
              loading="lazy"
              onClick={handleNavigate}
            />
          ) : page.album_preview.length > 0 ? (
            <div className={`grid ${page.album_preview.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-1 rounded-xl overflow-hidden cursor-pointer`} onClick={handleNavigate}>
              {page.album_preview.map((url, i) => (
                <img key={i} src={url} alt="" className="w-full aspect-square object-cover" loading="lazy" />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Stats row */}
      <div className="px-4 pb-2 flex items-center gap-4 text-xs text-muted-foreground">
        {page.album_count > 0 && (
          <span className="flex items-center gap-1">
            <Camera className="h-3.5 w-3.5" />
            {page.album_count} souvenir{page.album_count > 1 ? 's' : ''}
          </span>
        )}
        {page.fund && (
          <span className="flex items-center gap-1">
            <Gift className="h-3.5 w-3.5" />
            Cagnotte
          </span>
        )}
      </div>

      {/* Fund progress */}
      {page.fund && (
        <div className="px-4 pb-3 space-y-1">
          <Progress value={fundProgress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{page.fund.current_amount.toLocaleString('fr-FR')} {page.fund.currency}</span>
            <span>{fundProgress}% de {page.fund.target_amount.toLocaleString('fr-FR')} {page.fund.currency}</span>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="px-4 pb-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={handleNavigate}
        >
          Voir la page
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
