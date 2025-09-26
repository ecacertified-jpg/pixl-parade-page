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
            <div key={i} className="flex-shrink-0 w-48">
              <Skeleton className="h-32 w-full rounded-xl" />
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

      <div className="space-y-4">
        {/* Action Buttons Section - Vertical Layout */}
        <div className="flex flex-col gap-3">
          {/* Add Fund Card */}
          <Card 
            className="w-48 h-24 bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-dashed border-primary/30 hover:border-primary/50 cursor-pointer transition-all duration-300 hover:shadow-soft flex flex-row items-center gap-3 group px-4"
            onClick={handleAddFund}
          >
            <div className="bg-primary/10 p-2.5 rounded-full group-hover:bg-primary/20 transition-colors">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">Ajouter une cagnotte</p>
              <p className="text-xs text-muted-foreground">Créer ensemble</p>
            </div>
          </Card>

          {/* Create Friends Circle Card */}
          <Card 
            className="w-48 h-24 bg-gradient-to-br from-accent/5 to-muted/5 border-2 border-dashed border-accent/30 hover:border-accent/50 cursor-pointer transition-all duration-300 hover:shadow-soft flex flex-row items-center gap-3 group px-4"
            onClick={() => navigate("/dashboard")}
          >
            <div className="bg-accent/10 p-2.5 rounded-full group-hover:bg-accent/20 transition-colors">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">Créer son cercle d'amis</p>
              <p className="text-xs text-muted-foreground">Partager la joie</p>
            </div>
          </Card>
        </div>

        {/* Funds Cards - Horizontal Scroll */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {/* Funds Cards */}
          {publicFunds.map((fund) => {
            const progress = (fund.currentAmount / fund.targetAmount) * 100;
            
            return (
              <Card key={fund.id} className="flex-shrink-0 w-44 bg-white rounded-xl shadow-md border-0 overflow-hidden hover:shadow-lg transition-all duration-300">
                {/* Product Image */}
                <div className="h-20 bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden">
                  {fund.productImage ? (
                    <img 
                      src={fund.productImage} 
                      alt={fund.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gift className="h-6 w-6 text-pink-300" />
                    </div>
                  )}
                </div>
                
                <div className="p-2.5 space-y-2">
                  {/* Title and Beneficiary - Single Line */}
                  <h4 className="font-semibold text-gray-900 text-xs leading-tight text-center truncate">
                    {fund.productName || fund.title} pour {fund.beneficiaryName}
                  </h4>
                  
                  {/* Occasion - Single Line */}
                  <p className="text-xs text-gray-500 text-center truncate">
                    {fund.occasion} dans 5 jours
                  </p>

                  {/* Amount Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-pink-600">
                        {fund.currentAmount.toLocaleString()} {fund.currency}
                      </span>
                      <span className="text-xs text-gray-400">
                        {fund.targetAmount.toLocaleString()} {fund.currency}
                      </span>
                    </div>
                    
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Contributors */}
                  <div className="flex items-center justify-center gap-1 text-gray-500">
                    <Users className="h-3 w-3" />
                    <span className="text-xs">
                      {fund.contributors.length} contributeur{fund.contributors.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {/* Centered Button */}
                  <div className="flex justify-center pt-1">
                    <Button
                      onClick={() => handleContribute(fund.id)}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-4 py-1.5 text-xs font-medium rounded-full border-0"
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
    </div>
  );
}