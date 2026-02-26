import { Plus, Heart, Users, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useCollectiveFunds } from "@/hooks/useCollectiveFunds";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { ValuePropositionModal } from "@/components/ValuePropositionModal";
import { ContributionModal } from "@/components/ContributionModal";
import { ShopForCollectiveGiftModal } from "@/components/ShopForCollectiveGiftModal";
import { isValidImageUrl, getDaysUntilBirthday } from "@/lib/utils";

// Fonction pour afficher le texte d'anniversaire
const getBirthdayText = (birthdayDate: string | Date | null | undefined, beneficiaryName?: string): string => {
  if (!birthdayDate && beneficiaryName) {
    return `Pour ${beneficiaryName}`;
  }
  if (!birthdayDate) return "Cadeau surprise";
  
  const diffDays = getDaysUntilBirthday(birthdayDate);
  return `Anniv. dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
};
export function PublicFundsCarousel() {
  const navigate = useNavigate();
  const {
    funds,
    loading,
    refreshFunds
  } = useCollectiveFunds();

  const [showValueModal, setShowValueModal] = useState(false);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showValueModalForNewFund, setShowValueModalForNewFund] = useState(false);
  const [showShopForCollectiveGift, setShowShopForCollectiveGift] = useState(false);
  const [selectedFund, setSelectedFund] = useState<{
    id: string;
    title: string;
    beneficiaryName: string;
    targetAmount: number;
    currentAmount: number;
    currency: string;
    creatorId?: string;
    occasion?: string;
  } | null>(null);

  // Filter and prioritize funds: friends' public funds first, then others, all active
  const publicFunds = funds.filter(fund => fund.status === 'active' && (fund.isPublic || fund.priority <= 3)).sort((a, b) => (a.priority || 4) - (b.priority || 4)).slice(0, 5);
  
  const handleAddFund = () => {
    setShowValueModalForNewFund(true);
  };

  const handleOpenShopForCollectiveGift = () => {
    setShowValueModalForNewFund(false);
    setShowShopForCollectiveGift(true);
  };
  
  const handleContribute = (fund: any) => {
    setSelectedFund({
      id: fund.id,
      title: fund.productName || fund.title,
      beneficiaryName: fund.beneficiaryName,
      targetAmount: fund.targetAmount,
      currentAmount: fund.currentAmount,
      currency: fund.currency,
      creatorId: fund.creatorId,
      occasion: fund.occasion
    });
    setShowValueModal(true);
  };

  const handleOpenContributionModal = () => {
    setShowContributionModal(true);
  };
  if (loading) {
    return <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Cagnottes publiques
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3].map(i => <div key={i} className="flex-shrink-0 w-48">
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>)}
        </div>
      </div>;
  }
  return <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-400">
        <Heart className="h-5 w-5 text-primary" />
        Cagnottes publiques
      </h3>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Actions Card */}
        <Card className="flex-shrink-0 w-48 bg-white rounded-xl shadow-md border-0 overflow-hidden hover:shadow-lg transition-all duration-300">
          <div className="p-4 space-y-3">
            {/* Add Fund Button */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-dashed border-pink-200 hover:border-pink-300 cursor-pointer transition-all duration-300 rounded-lg p-3 flex flex-col items-center text-center group" onClick={handleAddFund}>
              <div className="bg-pink-500 p-2 rounded-full mb-2 group-hover:bg-pink-600 transition-colors">
                <Plus className="h-4 w-4 text-white" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">Ajouter une cagnotte</p>
              <p className="text-xs text-pink-600">Créer ensemble</p>
            </div>

            {/* Create Friends Circle Button */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-dashed border-purple-200 hover:border-purple-300 cursor-pointer transition-all duration-300 rounded-lg p-3 flex flex-col items-center text-center group" onClick={() => navigate("/dashboard")}>
              <div className="bg-purple-500 p-2 rounded-full mb-2 group-hover:bg-purple-600 transition-colors">
                <Users className="h-4 w-4 text-white" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">Créer son cercle d'amis</p>
              <p className="text-xs text-purple-600">Partager la joie</p>
            </div>
          </div>
        </Card>

        {/* Funds Cards */}
        {publicFunds.map(fund => {
        const progress = fund.currentAmount / fund.targetAmount * 100;
        return <Card key={fund.id} className="flex-shrink-0 w-44 bg-white rounded-xl shadow-md border-0 overflow-hidden hover:shadow-lg transition-all duration-300">
              {/* Product Image */}
              <div className="h-20 bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden">
                {isValidImageUrl(fund.productImage) ? <img src={fund.productImage} alt={fund.productName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">
                    <Gift className="h-6 w-6 text-pink-300" />
                  </div>}
              </div>
              
              <div className="p-2.5 space-y-2">
                {/* Title and Beneficiary - Single Line */}
                <h4 className="font-semibold text-gray-900 text-xs leading-tight text-center truncate">
                  {fund.productName || fund.title} pour {fund.beneficiaryName}
                </h4>
                
                {/* Occasion - Single Line */}
                <p className="text-xs text-gray-500 text-center truncate">
                  {getBirthdayText(fund.beneficiaryBirthday, fund.beneficiaryName)}
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
                    <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500" style={{
                  width: `${Math.min(progress, 100)}%`
                }} />
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
                  <Button onClick={() => handleContribute(fund)} className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-xs font-medium rounded-full border-0 px-[24px] py-0 mx-[10px] my-[13px]">
                    <Gift className="h-3 w-3 mr-1" />
                    Contribuer
                  </Button>
                </div>
              </div>
            </Card>;
      })}
      </div>

      {/* Value Proposition Modal */}
      {selectedFund && (
        <ValuePropositionModal
          isOpen={showValueModal}
          onClose={() => setShowValueModal(false)}
          onContinue={handleOpenContributionModal}
          fundTitle={selectedFund.title}
          beneficiaryName={selectedFund.beneficiaryName}
        />
      )}

      {/* Contribution Modal */}
      {selectedFund && (
        <ContributionModal
          isOpen={showContributionModal}
          onClose={() => setShowContributionModal(false)}
          fundId={selectedFund.id}
          fundTitle={selectedFund.title}
          targetAmount={selectedFund.targetAmount}
          currentAmount={selectedFund.currentAmount}
          currency={selectedFund.currency}
          isFromPublicFund={true}
          fundCreatorId={selectedFund.creatorId}
          occasion={selectedFund.occasion}
          onContributionSuccess={() => {
            refreshFunds();
            setShowContributionModal(false);
          }}
        />
      )}

      {/* Value Proposition Modal for Creating New Fund */}
      <ValuePropositionModal
        isOpen={showValueModalForNewFund}
        onClose={() => setShowValueModalForNewFund(false)}
        onContinue={handleOpenShopForCollectiveGift}
        fundTitle="Créer une cagnotte"
        beneficiaryName=""
        isForCreatingFund={true}
      />

      {/* Shop Modal for Collective Gift */}
      <ShopForCollectiveGiftModal
        isOpen={showShopForCollectiveGift}
        onClose={() => setShowShopForCollectiveGift(false)}
      />
    </div>;
}