import { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyDraftBirthdayPage } from "@/hooks/useMyDraftBirthdayPage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

export function PublishMyBirthdayPageBanner() {
  const { draft, refresh } = useMyDraftBirthdayPage();
  const [publishing, setPublishing] = useState(false);

  if (!draft) return null;

  const handlePublish = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      const { error } = await supabase
        .from('birthday_pages')
        .update({
          published_at: new Date().toISOString(),
          published_via_onboarding: true,
        })
        .eq('id', draft.id);
      if (error) throw error;

      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.4 },
        colors: ['#a855f7', '#ec4899', '#f97316', '#22c55e'],
      });
      toast.success("Ta page d'anniversaire est publiée ! 🎉");
      window.dispatchEvent(new Event('feed-refresh'));
      await refresh();
    } catch (err: any) {
      console.error('Publish draft error:', err);
      toast.error("Erreur lors de la publication");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="mb-4 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 flex items-center gap-3"
      >
        <div className="shrink-0 h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">
            Ta page d'anniversaire est prête
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Publie-la pour qu'elle apparaisse dans le fil.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handlePublish}
          disabled={publishing}
          className="shrink-0 h-8 text-xs gap-1.5"
        >
          {publishing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Publier
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
