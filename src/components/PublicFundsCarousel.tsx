import { Plus, Heart, Users, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useCollectiveFunds } from "@/hooks/useCollectiveFunds";
import { Skeleton } from "@/components/ui/skeleton";

export function PublicFundsCarousel() {
  const navigate = useNavigate();
  const { funds, loading } = useCollectiveFunds();

  // Filter for active funds that could be public or from friends
  const publicFunds = funds.filter(fund => fund.status === 'active').slice(0, 5);

  const handleAddFund = () => {
    navigate("/dashboard");
  };

  const handleContribute = (fundId: string) => {
    navigate(`/collective-checkout?fundId=${fundId}`);
  };

  if (loading) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Cagnottes publiques
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-64">
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Heart className="h-5 w-5 text-primary" />
        Cagnottes publiques
      </h3>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Add Fund Card */}
        <Card 
          className="flex-shrink-0 w-52 h-40 bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-dashed border-primary/30 hover:border-primary/50 cursor-pointer transition-all duration-300 hover:shadow-soft flex flex-col items-center justify-center gap-3 group"
          onClick={handleAddFund}
        >
          <div className="bg-primary/10 p-3 rounded-full group-hover:bg-primary/20 transition-colors">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground text-sm">Ajouter une cagnotte</p>
            <p className="text-xs text-muted-foreground mt-1">Créer ensemble</p>
          </div>
        </Card>

        {/* Funds Cards */}
        {publicFunds.map((fund) => {
          const progress = (fund.currentAmount / fund.targetAmount) * 100;
          
          return (
            <Card key={fund.id} className="flex-shrink-0 w-64 h-40 bg-card/80 backdrop-blur-sm border border-border/50 shadow-card overflow-hidden group hover:shadow-soft transition-all duration-300">
              <div className="p-4 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground text-sm leading-tight line-clamp-2">
                      {fund.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      pour {fund.beneficiaryName}
                    </p>
                  </div>
                  {fund.productImage && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ml-2">
                      <img 
                        src={fund.productImage} 
                        alt={fund.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-primary">
                      {fund.currentAmount.toLocaleString()} {fund.currency}
                    </span>
                    <span className="text-muted-foreground">
                      {fund.targetAmount.toLocaleString()} {fund.currency}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {fund.contributors.length} contributeur{fund.contributors.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleContribute(fund.id)}
                    className="h-7 px-3 text-xs bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  >
                    <Gift className="h-3 w-3 mr-1" />
                    Contribuer
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}