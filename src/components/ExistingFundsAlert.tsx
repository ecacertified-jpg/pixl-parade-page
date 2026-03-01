import { AlertTriangle, Users, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { differenceInDays, parseISO } from "date-fns";
import type { ExistingFund } from "@/hooks/useExistingFundsForBeneficiary";

interface ExistingFundsAlertProps {
  funds: ExistingFund[];
  beneficiaryName: string;
  onJoinFund: (fundId: string) => void;
  onCreateAnyway: () => void;
  loading?: boolean;
}

export function ExistingFundsAlert({
  funds,
  beneficiaryName,
  onJoinFund,
  onCreateAnyway,
  loading,
}: ExistingFundsAlertProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="text-sm text-muted-foreground">Vérification des cagnottes existantes...</div>
      </div>
    );
  }

  if (funds.length === 0) return null;

  const getDaysRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    const days = differenceInDays(parseISO(deadline), new Date());
    if (days < 0) return null;
    if (days === 0) return "Expire aujourd'hui";
    if (days === 1) return "1 jour restant";
    return `${days} jours restants`;
  };

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-medium text-amber-800 dark:text-amber-300 text-sm">
            {funds.length === 1
              ? `Une cagnotte existe déjà pour ${beneficiaryName}`
              : `${funds.length} cagnottes existent déjà pour ${beneficiaryName}`}
          </h4>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
            Vous pouvez rejoindre une cagnotte existante au lieu d'en créer une nouvelle
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {funds.map((fund) => {
          const progress = fund.targetAmount > 0
            ? Math.min((fund.currentAmount / fund.targetAmount) * 100, 100)
            : 0;
          const creatorName = `${fund.creatorFirstName} ${fund.creatorLastName}`.trim() || 'Quelqu\'un';
          const daysRemaining = getDaysRemaining(fund.deadlineDate);

          return (
            <div
              key={fund.id}
              className="rounded-md border border-amber-200 dark:border-amber-800 bg-white dark:bg-background p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-sm truncate flex-1">{fund.title}</h5>
              </div>

              <div className="space-y-1">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{fund.currentAmount.toLocaleString()} {fund.currency}</span>
                  <span>Objectif : {fund.targetAmount.toLocaleString()} {fund.currency}</span>
                </div>
                {daysRemaining && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{daysRemaining}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>Créée par {creatorName}</span>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs"
                  onClick={() => onJoinFund(fund.id)}
                >
                  Contribuer
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={onCreateAnyway}
      >
        Créer une nouvelle cagnotte quand même
      </Button>
    </div>
  );
}
