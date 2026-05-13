import { Calendar, UserCheck, UserPlus, Star, Play } from "lucide-react";
import { FeedCardActions } from "@/components/FeedCardActions";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FeedPage, FeedMedia } from "@/hooks/usePagesFeed";
import { useAuth } from "@/contexts/AuthContext";

const OCCASION_ICONS: Record<string, string> = {
  Anniversaire: '🎂',
  Mariage: '💒',
  Baptême: '👶',
  Fiançailles: '💍',
  Diplôme: '🎓',
  Promotion: '🎉',
  Événement: '🎊',
};

const OCCASION_GRADIENTS: Record<string, string> = {
  Anniversaire: 'from-violet-500 to-pink-500',
  Mariage: 'from-rose-400 to-amber-300',
  Baptême: 'from-sky-400 to-cyan-300',
  Fiançailles: 'from-amber-400 to-rose-400',
  Diplôme: 'from-emerald-500 to-teal-400',
  Promotion: 'from-orange-400 to-yellow-400',
  Événement: 'from-indigo-500 to-purple-400',
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
  isFollowing: boolean;
  onToggleFollow: () => void;
}

export function PageFeedCard({ page, isFollowing, onToggleFollow }: PageFeedCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwnPage = user?.id === page.creator.user_id;
  const icon = OCCASION_ICONS[page.occasion] || OCCASION_ICONS['Événement'];
  const gradient = OCCASION_GRADIENTS[page.occasion] || OCCASION_GRADIENTS['Événement'];
  const creatorName = [page.creator.first_name, page.creator.last_name].filter(Boolean).join(' ') || 'Utilisateur';
  const initials = (page.creator.first_name?.[0] || '') + (page.creator.last_name?.[0] || '');

  const fundProgress = page.fund
    ? Math.min(100, Math.round((page.fund.current_amount / page.fund.target_amount) * 100))
    : 0;

  const hasVisual = page.cover_image_url || page.album_preview.length > 0;

  const handleNavigate = () => {
    if (page.type === 'birthday') {
      navigate(`/birthday/${page.slug}`);
    } else {
      navigate(`/event/${page.slug}`);
    }
  };

  const renderThumb = (m: FeedMedia, className: string, key: number | string, extraCount?: number) => (
    <div key={key} className={`relative overflow-hidden ${className}`}>
      <img src={m.url} alt="" className="w-full h-full object-cover" loading="lazy" />
      {m.type === 'video' && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
          <div className="bg-black/40 rounded-full p-2">
            <Play className="h-5 w-5 text-white" fill="white" />
          </div>
        </div>
      )}
      {extraCount && extraCount > 0 && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
          <span className="text-white text-xl font-semibold">+{extraCount}</span>
        </div>
      )}
    </div>
  );

  const media = page.album_preview;
  const extra = Math.max(0, page.album_count - 4);

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-shadow">
      {/* Header: creator info */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/u/${page.creator.user_id}/pages`);
          }}
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label={`Voir les pages de ${creatorName}`}
        >
          <Avatar className="h-10 w-10 ring-2 ring-transparent hover:ring-primary/40 transition-all">
            <AvatarImage src={page.creator.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {initials || '?'}
            </AvatarFallback>
          </Avatar>
        </button>
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/u/${page.creator.user_id}/pages`);
            }}
            className="text-left hover:underline focus:outline-none focus:underline"
          >
            <p className="text-sm font-semibold truncate">{creatorName}</p>
          </button>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <p className="text-xs text-muted-foreground">{formatRelativeDate(page.created_at)}</p>
            {isOwnPage && (
              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary text-primary-foreground border-transparent gap-0.5">
                <Star className="h-2.5 w-2.5 fill-current" />
                Ma page
              </Badge>
            )}
            {!isOwnPage && page.is_friend && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                Ami
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-lg hidden sm:inline">{icon}</span>
          {!isOwnPage && (
            <Button
              variant={isFollowing ? "secondary" : "outline"}
              size="sm"
              className="h-7 text-xs gap-1 px-2"
              onClick={(e) => { e.stopPropagation(); onToggleFollow(); }}
            >
              {isFollowing ? <UserCheck className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
              <span className="hidden sm:inline">{isFollowing ? 'Suivi' : 'Suivre'}</span>
            </Button>
          )}
        </div>
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

      {/* Cover image, album grid, or placeholder */}
      <div className="px-4 pb-3">
        {media.length >= 4 ? (
          <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden aspect-square cursor-pointer" onClick={handleNavigate}>
            {media.slice(0, 4).map((m, i) =>
              renderThumb(m, 'w-full h-full', i, i === 3 ? extra : 0)
            )}
          </div>
        ) : media.length === 3 ? (
          <div className="grid grid-cols-2 grid-rows-2 gap-1 rounded-xl overflow-hidden aspect-square cursor-pointer" onClick={handleNavigate}>
            {renderThumb(media[0], 'row-span-2 w-full h-full', 0)}
            {renderThumb(media[1], 'w-full h-full', 1)}
            {renderThumb(media[2], 'w-full h-full', 2)}
          </div>
        ) : media.length === 2 ? (
          <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden aspect-square cursor-pointer" onClick={handleNavigate}>
            {media.map((m, i) => renderThumb(m, 'w-full h-full', i))}
          </div>
        ) : media.length === 1 ? (
          <div className="rounded-xl overflow-hidden aspect-video cursor-pointer" onClick={handleNavigate}>
            {renderThumb(media[0], 'w-full h-full', 0)}
          </div>
        ) : page.cover_image_url ? (
          <img
            src={page.cover_image_url}
            alt={page.title}
            className="w-full rounded-xl aspect-video object-cover cursor-pointer"
            loading="lazy"
            onClick={handleNavigate}
          />
        ) : (
          /* Placeholder gradient for pages without images */
          <div
            className={`w-full rounded-xl aspect-video bg-gradient-to-br ${gradient} flex items-center justify-center cursor-pointer`}
            onClick={handleNavigate}
          >
            <span className="text-5xl drop-shadow-lg">{icon}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <FeedCardActions page={page} />
    </Card>
  );
}
