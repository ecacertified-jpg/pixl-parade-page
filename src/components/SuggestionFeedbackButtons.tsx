import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ThumbsUp, ThumbsDown, Check, ShoppingCart, Bookmark, X } from "lucide-react";
import { useSuggestionFeedback, FeedbackType } from "@/hooks/useSuggestionFeedback";
import { cn } from "@/lib/utils";

interface SuggestionFeedbackButtonsProps {
  productId: string;
  recommendationId?: string;
  contactId?: string;
  occasion?: string;
  matchScore?: number;
  price?: number;
  source?: string;
  size?: "sm" | "default";
  showLabels?: boolean;
  onFeedbackRecorded?: (type: FeedbackType) => void;
}

export function SuggestionFeedbackButtons({
  productId,
  recommendationId,
  contactId,
  occasion,
  matchScore,
  price,
  source = "recommendation",
  size = "default",
  showLabels = true,
  onFeedbackRecorded,
}: SuggestionFeedbackButtonsProps) {
  const { recordFeedback, getProductFeedback, REJECTION_REASONS } = useSuggestionFeedback();
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectReasons, setShowRejectReasons] = useState(false);

  const currentFeedback = getProductFeedback(productId);

  const handleFeedback = async (feedbackType: FeedbackType, reason?: string) => {
    setIsLoading(true);
    try {
      const success = await recordFeedback({
        productId,
        recommendationId,
        contactId,
        occasion,
        feedbackType,
        feedbackReason: reason,
        matchScore,
        priceAtFeedback: price,
        source,
      });

      if (success) {
        onFeedbackRecorded?.(feedbackType);
        setShowRejectReasons(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const buttonSize = size === "sm" ? "h-7 px-2 text-xs" : "h-8 px-3 text-sm";

  // Si un feedback existe déjà, afficher un badge
  if (currentFeedback) {
    const feedbackConfig: Record<FeedbackType, { label: string; icon: React.ReactNode; className: string }> = {
      accepted: {
        label: "Intéressé",
        icon: <ThumbsUp className={iconSize} />,
        className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      },
      rejected: {
        label: "Pas pour moi",
        icon: <ThumbsDown className={iconSize} />,
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      },
      purchased: {
        label: "Acheté",
        icon: <ShoppingCart className={iconSize} />,
        className: "bg-primary/10 text-primary",
      },
      saved: {
        label: "Sauvegardé",
        icon: <Bookmark className={iconSize} />,
        className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      },
    };

    const config = feedbackConfig[currentFeedback];

    return (
      <Badge variant="secondary" className={cn("gap-1", config.className)}>
        {config.icon}
        {showLabels && config.label}
        <button
          onClick={() => handleFeedback(currentFeedback)}
          className="ml-1 hover:bg-black/10 rounded p-0.5"
          title="Annuler"
        >
          <X className="w-3 h-3" />
        </button>
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Bouton Accepter */}
      <Button
        variant="outline"
        size="sm"
        className={cn(
          buttonSize,
          "gap-1 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-300",
          "dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30"
        )}
        onClick={() => handleFeedback("accepted")}
        disabled={isLoading}
      >
        <ThumbsUp className={iconSize} />
        {showLabels && "Intéressé"}
      </Button>

      {/* Bouton Refuser avec menu de raisons */}
      <Popover open={showRejectReasons} onOpenChange={setShowRejectReasons}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              buttonSize,
              "gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300",
              "dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
            )}
            disabled={isLoading}
          >
            <ThumbsDown className={iconSize} />
            {showLabels && "Pas pour moi"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-2 py-1">
              Pourquoi ? (optionnel)
            </p>
            {REJECTION_REASONS.map((reason) => (
              <Button
                key={reason.value}
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 text-sm"
                onClick={() => handleFeedback("rejected", reason.value)}
                disabled={isLoading}
              >
                {reason.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8 text-sm text-muted-foreground"
              onClick={() => handleFeedback("rejected")}
              disabled={isLoading}
            >
              Ignorer sans raison
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Bouton Sauvegarder (optionnel, plus petit) */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(buttonSize, "gap-1 text-muted-foreground hover:text-amber-600")}
        onClick={() => handleFeedback("saved")}
        disabled={isLoading}
        title="Sauvegarder pour plus tard"
      >
        <Bookmark className={iconSize} />
      </Button>
    </div>
  );
}
