import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ThumbsUp,
  ThumbsDown,
  ShoppingCart,
  Bookmark,
  Trash2,
  RotateCcw,
  TrendingUp,
  History,
  Sparkles,
} from "lucide-react";
import { useSuggestionFeedback, FeedbackType } from "@/hooks/useSuggestionFeedback";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function SuggestionFeedbackHistory() {
  const {
    feedbackHistory,
    stats,
    loading,
    deleteFeedback,
    resetAllFeedback,
    refreshFeedback,
  } = useSuggestionFeedback();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    await resetAllFeedback();
    setIsResetting(false);
  };

  const feedbackIcons: Record<FeedbackType, React.ReactNode> = {
    accepted: <ThumbsUp className="w-4 h-4 text-green-500" />,
    rejected: <ThumbsDown className="w-4 h-4 text-red-500" />,
    purchased: <ShoppingCart className="w-4 h-4 text-primary" />,
    saved: <Bookmark className="w-4 h-4 text-amber-500" />,
  };

  const feedbackLabels: Record<FeedbackType, string> = {
    accepted: "Intéressé",
    rejected: "Pas pour moi",
    purchased: "Acheté",
    saved: "Sauvegardé",
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-32 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const totalFeedback = stats
    ? stats.accepted_count + stats.rejected_count + stats.purchased_count + stats.saved_count
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Préférences IA</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshFeedback()}
              className="h-8"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            {totalFeedback > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Réinitialiser les préférences ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera tout votre historique de feedback. 
                      L'IA recommencera ses recommandations à zéro.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleReset}
                      disabled={isResetting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Réinitialiser
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        <CardDescription>
          Vos retours améliorent les suggestions de cadeaux
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Statistiques rapides */}
        {stats && totalFeedback > 0 ? (
          <>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {stats.accepted_count}
                </div>
                <div className="text-xs text-muted-foreground">Acceptées</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {stats.rejected_count}
                </div>
                <div className="text-xs text-muted-foreground">Refusées</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-2 text-center">
                <div className="text-lg font-semibold text-primary">
                  {stats.purchased_count}
                </div>
                <div className="text-xs text-muted-foreground">Achetés</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
                <div className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                  {stats.saved_count}
                </div>
                <div className="text-xs text-muted-foreground">Sauvés</div>
              </div>
            </div>

            {/* Score d'apprentissage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Qualité des recommandations
                </span>
                <span className="font-medium">
                  {totalFeedback > 10 ? "Excellente" : totalFeedback > 5 ? "Bonne" : "En apprentissage"}
                </span>
              </div>
              <Progress 
                value={Math.min(100, (totalFeedback / 20) * 100)} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground">
                Plus vous donnez de retours, meilleures seront les suggestions
              </p>
            </div>

            {/* Catégories préférées */}
            {stats.preferred_categories.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Catégories préférées</p>
                <div className="flex flex-wrap gap-1.5">
                  {stats.preferred_categories.slice(0, 5).map((cat, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {cat.category} ({cat.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Raisons de refus fréquentes */}
            {stats.top_rejection_reasons.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Raisons de refus fréquentes</p>
                <div className="flex flex-wrap gap-1.5">
                  {stats.top_rejection_reasons.slice(0, 3).map((reason, i) => (
                    <Badge key={i} variant="outline" className="text-xs text-muted-foreground">
                      {reason.reason === "too_expensive" && "Trop cher"}
                      {reason.reason === "not_their_style" && "Pas leur style"}
                      {reason.reason === "already_gifted" && "Déjà offert"}
                      {reason.reason === "not_interested" && "Pas intéressé"}
                      {reason.reason === "other" && "Autre"}
                      {!["too_expensive", "not_their_style", "already_gifted", "not_interested", "other"].includes(reason.reason) && reason.reason}
                      {" "}({reason.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun feedback enregistré</p>
            <p className="text-xs mt-1">
              Donnez votre avis sur les suggestions pour améliorer les recommandations
            </p>
          </div>
        )}

        {/* Historique récent */}
        {feedbackHistory.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-1">
              <History className="w-4 h-4" />
              Historique récent
            </p>
            <ScrollArea className="h-[180px]">
              <div className="space-y-2 pr-4">
                {feedbackHistory.slice(0, 10).map((feedback) => (
                  <div
                    key={feedback.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg border",
                      feedback.feedback_type === "rejected" && "bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30",
                      feedback.feedback_type === "accepted" && "bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30",
                      feedback.feedback_type === "purchased" && "bg-primary/5 border-primary/20",
                      feedback.feedback_type === "saved" && "bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30"
                    )}
                  >
                    {feedback.product?.image_url ? (
                      <img
                        src={feedback.product.image_url}
                        alt={feedback.product.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        {feedbackIcons[feedback.feedback_type]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {feedback.product?.name || "Produit"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {feedbackIcons[feedback.feedback_type]}
                        <span>{feedbackLabels[feedback.feedback_type]}</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(feedback.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteFeedback(feedback.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
