import { useEffect, useState } from 'react';
import { Sparkles, MessageCircle, Gauge, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBusinessQualityScore } from '@/hooks/useBusinessQualityScore';
import { BusinessAssistantChat } from './BusinessAssistantChat';
import { BusinessQualityPanel } from './BusinessQualityPanel';
import { cn } from '@/lib/utils';

interface BusinessAssistantFABProps {
  businessId?: string | null;
  step?: string; // current wizard step (optional)
  onAction?: (action: string) => void; // e.g. 'open-add-product'
  defaultTab?: 'chat' | 'score';
  /** Called whenever the assistant finishes a response or score recomputes — useful to refresh wizard checklist. */
  onAssistantUpdate?: () => void;
}

export function BusinessAssistantFAB({
  businessId, step, onAction, defaultTab = 'chat', onAssistantUpdate,
}: BusinessAssistantFABProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'chat' | 'score'>(defaultTab);
  const [seedPrompt, setSeedPrompt] = useState<string | undefined>(undefined);
  const { score, snapshot, improvements, loading, refetch } = useBusinessQualityScore(businessId);

  // Refetch when opening
  useEffect(() => {
    if (open) refetch();
  }, [open, refetch]);

  const askFromPanel = (prompt: string) => {
    setSeedPrompt(prompt);
    setTab('chat');
  };

  const handleAction = (action: string) => {
    onAction?.(action);
    if (action === 'open-add-product') setOpen(false);
  };

  const handleAssistantTurnEnd = async () => {
    await refetch();
    onAssistantUpdate?.();
  };

  const highCount = improvements.filter((i) => i.impact === 'high').length;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed z-40 bottom-5 right-5 group',
          'w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent',
          'shadow-soft hover:shadow-lg hover:scale-105 active:scale-95',
          'flex items-center justify-center text-primary-foreground',
          'transition-all duration-200',
        )}
        aria-label="Ouvrir l'assistant business"
      >
        <Sparkles className="w-6 h-6" />
        {highCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-background">
            {highCount}
          </span>
        )}
        <span className="absolute right-full mr-3 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block">
          Assistant boutique
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={cn(
            'p-0 flex flex-col gap-0',
            isMobile ? 'h-[90vh] rounded-t-2xl' : 'w-full sm:max-w-md',
          )}
        >
          <SheetHeader className="px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center justify-between gap-2">
              <SheetTitle className="font-poppins text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Assistant boutique
              </SheetTitle>
              <Button
                variant="ghost" size="icon" className="h-8 w-8"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </SheetHeader>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as 'chat' | 'score')}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="grid grid-cols-2 mx-4 mt-3 mb-0">
              <TabsTrigger value="chat" className="gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                Discuter
              </TabsTrigger>
              <TabsTrigger value="score" className="gap-1.5">
                <Gauge className="w-3.5 h-3.5" />
                Score
                {!loading && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'ml-1 text-[10px] h-4 px-1.5',
                      score >= 80 ? 'bg-success/10 text-success border-success/30'
                        : score >= 50 ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                        : 'bg-destructive/10 text-destructive border-destructive/30',
                    )}
                  >
                    {score}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 mt-3 mx-0 min-h-0 data-[state=inactive]:hidden">
              <BusinessAssistantChat
                snapshot={snapshot}
                step={step}
                initialPrompt={seedPrompt}
                key={seedPrompt || 'chat'}
                onResponseComplete={handleAssistantTurnEnd}
              />
            </TabsContent>

            <TabsContent value="score" className="flex-1 mt-3 mx-0 min-h-0 data-[state=inactive]:hidden">
              <BusinessQualityPanel
                score={score}
                loading={loading}
                improvements={improvements}
                snapshot={snapshot}
                onAction={handleAction}
                onAskAssistant={askFromPanel}
              />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  );
}