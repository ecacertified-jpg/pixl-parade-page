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
            <Card key={fund.id} className="flex-shrink-0 w-64 bg-white rounded-2xl shadow-lg border-0 overflow-hidden hover:shadow-xl transition-all duration-300">
              {/* Product Image */}
              <div className="h-32 bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden">
                {fund.productImage ? (
                  <img 
                    src={fund.productImage} 
                    alt={fund.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gift className="h-8 w-8 text-pink-300" />
                  </div>
                )}
              </div>
              
              <div className="p-4 space-y-3">
                {/* Title and Beneficiary */}
                <div className="text-center">
                  <h4 className="font-semibold text-gray-900 text-base">
                    {fund.productName || fund.title} pour {fund.beneficiaryName}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {fund.occasion} dans 5 jours
                  </p>
                </div>

                {/* Amount Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-bold text-pink-600">
                      {fund.currentAmount.toLocaleString()} {fund.currency}
                    </span>
                    <span className="text-sm text-gray-400">
                      {fund.targetAmount.toLocaleString()} {fund.currency}
                    </span>
                  </div>
                  
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Contributors and Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {fund.contributors.length} contributeur{fund.contributors.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <Button
                    onClick={() => handleContribute(fund.id)}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-4 py-2 text-sm font-medium rounded-full border-0"
                  >
                    <Gift className="h-4 w-4 mr-1" />
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