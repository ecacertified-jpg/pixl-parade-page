import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles } from "lucide-react";
import type { CelebrationPageType } from "@/hooks/useCelebrationFeed";

interface Props {
  pageType?: CelebrationPageType;
  pageId?: string | null;
  onPublish: (input: {
    kind: "text";
    content: string;
  }) => Promise<unknown>;
  triggerLabel?: string;
  fullWidth?: boolean;
}

export function ComposerSheet({ onPublish, triggerLabel = "Publier une célébration", fullWidth }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const publish = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    const ok = await onPublish({ kind: "text", content: text.trim() });
    setSubmitting(false);
    if (ok) {
      setText("");
      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          disabled={!user}
          className={fullWidth ? "w-full gap-2" : "gap-2"}
          size="lg"
        >
          <Sparkles className="h-4 w-4" />
          {user ? triggerLabel : "Connecte-toi pour célébrer"}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh]">
        <SheetHeader>
          <SheetTitle className="font-poppins">Écrire une célébration ✨</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Dis-leur qu'ils sont aimés, vus, célébrés…"
            rows={6}
            maxLength={1000}
            className="resize-none text-base"
            autoFocus
          />
          <p className="text-xs text-muted-foreground text-right">{text.length}/1000</p>
          <Button
            onClick={publish}
            disabled={!text.trim() || submitting}
            className="w-full"
            size="lg"
          >
            {submitting ? "Publication…" : "💖 Publier la célébration"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}