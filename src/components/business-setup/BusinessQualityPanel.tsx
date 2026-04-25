import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { QualityImprovement, BusinessQualitySnapshot } from '@/hooks/useBusinessQualityScore';
import { cn } from '@/lib/utils';

interface BusinessQualityPanelProps {
  score: number;
  loading: boolean;
  improvements: QualityImprovement[];
  snapshot: BusinessQualitySnapshot | null;
  onAction?: (action: string) => void;
  onAskAssistant?: (prompt: string) => void;
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-amber-500';
  return 'text-destructive';
}

function impactBadge(impact: QualityImprovement['impact']) {
  if (impact === 'high') return { label: 'Priorité haute', className: 'bg-destructive/10 text-destructive border-destructive/30' };
  if (impact === 'medium') return { label: 'Important', className: 'bg-amber-500/10 text-amber-600 border-amber-500/30' };
  return { label: 'Bonus', className: 'bg-muted text-muted-foreground border-border' };
}

export function BusinessQualityPanel({
  score, loading, improvements, snapshot, onAction, onAskAssistant,
}: BusinessQualityPanelProps) {
  const navigate = useNavigate();
  const completed = 100 - improvements.reduce((sum, i) => sum + i.points, 0);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Score header */}
      <div className="p-5 border-b border-border bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
              <circle
                cx="40" cy="40" r="34"
                stroke="hsl(var(--primary))"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - score / 100)}
                className="transition-all duration-500"
              />
            </svg>
            <span className={cn('font-poppins font-bold text-xl', scoreColor(score))}>
              {loading ? '…' : score}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-nunito">
              Score de qualité
            </p>
            <p className="font-poppins font-semibold text-base">
              {score >= 80 ? '🌟 Boutique exemplaire'
                : score >= 50 ? '🚀 En bonne voie'
                : '✨ À améliorer'}
            </p>
            <Progress value={score} className="h-1.5 mt-2" />
          </div>
        </div>
        {snapshot && snapshot.product_count > 0 && (
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {snapshot.product_count} produit{snapshot.product_count > 1 ? 's' : ''} •{' '}
            {snapshot.delivery_zones_count} zone{snapshot.delivery_zones_count > 1 ? 's' : ''} de livraison
          </p>
        )}
      </div>

      {/* Improvements list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {loading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
          {!loading && improvements.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <CheckCircle2 className="w-12 h-12 mx-auto text-success" />
              <p className="font-poppins font-semibold">Boutique optimisée 🎉</p>
              <p className="text-sm text-muted-foreground">
                Toutes les recommandations sont validées.
              </p>
            </div>
          )}

          {!loading && improvements.length > 0 && (
            <>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 mb-1">
                {improvements.length} amélioration{improvements.length > 1 ? 's' : ''} suggérée{improvements.length > 1 ? 's' : ''}
              </p>
              {improvements.map((imp) => {
                const badge = impactBadge(imp.impact);
                return (
                  <div
                    key={imp.id}
                    className="rounded-lg border border-border bg-card p-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Badge variant="outline" className={cn('text-[10px]', badge.className)}>
                        {badge.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto">+{imp.points} pts</span>
                    </div>
                    <p className="text-sm font-medium leading-snug mb-2">{imp.label}</p>
                    {imp.cta && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 w-full justify-between"
                        onClick={() => {
                          if (imp.cta?.action === 'open-chat-description') {
                            onAskAssistant?.('Rédige une description vendeuse pour ma boutique en 2 lignes.');
                          } else if (imp.cta?.action === 'open-chat-product-desc') {
                            onAskAssistant?.('Aide-moi à décrire mes produits avec des phrases courtes et vendeuses.');
                          } else if (imp.cta?.action === 'open-add-product') {
                            onAction?.('open-add-product');
                          } else if (imp.cta?.route) {
                            navigate(imp.cta.route);
                          }
                        }}
                      >
                        <span className="flex items-center gap-1">
                          {imp.cta.action?.startsWith('open-chat') && <Sparkles className="w-3 h-3" />}
                          {imp.cta.label}
                        </span>
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}