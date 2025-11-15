import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, BarChart3, Share2, MoreVertical } from 'lucide-react';
import { ReferralCode } from '@/hooks/useReferralCodes';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ReferralCodeCardProps {
  code: ReferralCode;
  onViewStats?: (code: ReferralCode) => void;
  onShare?: (code: ReferralCode) => void;
  onToggleActive?: (code: ReferralCode) => void;
  onDelete?: (code: ReferralCode) => void;
}

export const ReferralCodeCard = ({
  code,
  onViewStats,
  onShare,
  onToggleActive,
  onDelete,
}: ReferralCodeCardProps) => {
  const copyCode = () => {
    const link = `${window.location.origin}/auth?ref=${code.code}`;
    navigator.clipboard.writeText(link);
    toast.success('Lien copié !');
  };

  const conversionRate =
    code.clicks_count > 0
      ? ((code.signups_count / code.clicks_count) * 100).toFixed(1)
      : '0';

  return (
    <Card className={!code.is_active ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <code className="text-lg font-bold text-primary">{code.code}</code>
              {code.is_primary && (
                <Badge variant="secondary" className="text-xs">
                  Principal
                </Badge>
              )}
              {!code.is_active && (
                <Badge variant="outline" className="text-xs">
                  Inactif
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{code.label || 'Sans label'}</p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewStats?.(code)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Voir les stats
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare?.(code)}>
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </DropdownMenuItem>
              {!code.is_primary && (
                <>
                  <DropdownMenuItem onClick={() => onToggleActive?.(code)}>
                    {code.is_active ? 'Désactiver' : 'Activer'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(code)}
                    className="text-destructive"
                  >
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{code.signups_count}</div>
            <div className="text-xs text-muted-foreground">Inscrits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{code.clicks_count}</div>
            <div className="text-xs text-muted-foreground">Clics</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{conversionRate}%</div>
            <div className="text-xs text-muted-foreground">Taux</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={copyCode}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copier
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewStats?.(code)}
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Stats
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
