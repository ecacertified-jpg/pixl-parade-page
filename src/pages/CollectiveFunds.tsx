import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, Target, Calendar, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CollectiveFund {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  deadline_date?: string;
  occasion?: string;
  beneficiary_contact_id?: string;
  creator_id: string;
  status: string;
  currency: string;
  isOwner?: boolean;
  hasContributed?: boolean;
}

interface Contributor {
  id: string;
  name: string;
  amount: number;
  avatar_url?: string;
}

export default function CollectiveFunds() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [funds, setFunds] = useState<CollectiveFund[]>([]);
  const [selectedFund, setSelectedFund] = useState<CollectiveFund | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contributingToFund, setContributingToFund] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState<string | null>(null);

  const loadFunds = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch all accessible funds (own funds + friends' funds with can_see_funds = true)
      const { data: accessibleFunds, error: fundsError } = await supabase
        .from("collective_funds")
        .select("*")
        .order("created_at", { ascending: false });

      if (fundsError) {
        console.error('Error fetching funds:', fundsError);
        throw new Error(`Erreur lors du chargement des cotisations: ${fundsError.message}`);
      }

      // Process funds and mark ownership
      const allFunds = accessibleFunds?.map(fund => ({
        ...fund,
        isOwner: fund.creator_id === user.id,
        hasContributed: false // Cette information sera mise à jour si nécessaire
      })) || [];

      setFunds(allFunds);
    } catch (error: any) {
      console.error('Error loading funds:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les cotisations. Veuillez réessayer.",
        variant: "destructive"
      });
      setFunds([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFunds();
  }, [user]);

  const loadContributors = async (fundId: string) => {
    try {
      const { data, error } = await supabase
        .from("fund_contributions")
        .select("amount, contributor_id")
        .eq("fund_id", fundId);

      if (error) throw error;

      // For now, use mock names based on contributor_id
      const contributors = data?.map((contribution, index) => ({
        id: contribution.contributor_id,
        name: index === 0 ? "Moi" : `Contributeur ${index + 1}`,
        amount: contribution.amount,
        avatar_url: null
      })) || [];

      setContributors(contributors);
    } catch (error) {
      console.error('Error loading contributors:', error);
      // Fallback to mock data
      const mockContributors = [
        { id: "1", name: "Moi", amount: 15000, avatar_url: null },
        { id: "2", name: "Fatou Bamba", amount: 12000, avatar_url: null },
        { id: "3", name: "Kofi Asante", amount: 8000, avatar_url: null }
      ];
      setContributors(mockContributors);
    }
  };

  const handleFundClick = async (fund: CollectiveFund) => {
    setSelectedFund(fund);
    await loadContributors(fund.id);
  };

  const handleContribute = async (fundId: string, amount: number) => {
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Veuillez vous connecter pour contribuer",
        variant: "destructive"
      });
      return;
    }

    // Validation du montant
    if (amount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Le montant doit être supérieur à 0",
        variant: "destructive"
      });
      return;
    }

    setContributingToFund(fundId);

    try {
      console.log('Contributing to fund:', fundId, 'amount:', amount);

      // Get current fund data
      const { data: fundData, error: fundError } = await supabase
        .from("collective_funds")
        .select("*")
        .eq("id", fundId)
        .single();

      if (fundError) {
        console.error('Fund fetch error:', fundError);
        throw new Error("Impossible de récupérer les données de la cotisation");
      }

      if (fundData.status !== "active") {
        throw new Error("Cette cotisation n'est plus active");
      }

      // Vérifier le montant restant
      const remaining = getRemainingAmount(fundData.current_amount || 0, fundData.target_amount);
      if (remaining <= 0) {
        throw new Error("L'objectif de cette cotisation a déjà été atteint");
      }

      const contributionAmount = Math.min(amount, remaining);
      const newTotal = (fundData.current_amount || 0) + contributionAmount;
      const targetReached = newTotal >= fundData.target_amount;

      console.log('Inserting contribution:', {
        fund_id: fundId,
        contributor_id: user.id,
        amount: contributionAmount,
        currency: "XOF"
      });

      // Add contribution
      const { error } = await supabase
        .from("fund_contributions")
        .insert({
          fund_id: fundId,
          contributor_id: user.id,
          amount: contributionAmount,
          currency: "XOF"
        });

      if (error) {
        console.error('Contribution insert error:', error);
        if (error.message.includes('RLS') || error.message.includes('policy')) {
          throw new Error("Vous n'avez pas l'autorisation de contribuer à cette cotisation. Assurez-vous d'être ami avec le créateur.");
        }
        throw new Error(`Erreur lors de l'ajout de la contribution: ${error.message}`);
      }

      console.log('Contribution added successfully');

      // If target is reached, create order and update status
      if (targetReached && fundData.status === "active") {
        await createFundOrder(fundData);
        
        // Update fund status
        await supabase
          .from("collective_funds")
          .update({ status: "completed" })
          .eq("id", fundId);

        toast({
          title: "🎉 Objectif atteint !",
          description: `Votre contribution de ${formatCurrency(contributionAmount)} a permis d'atteindre l'objectif de la cotisation !`
        });
      } else {
        toast({
          title: "Contribution ajoutée !",
          description: `Votre contribution de ${formatCurrency(contributionAmount)} a été ajoutée avec succès.`
        });
      }

      // Reload data
      await loadFunds();
      if (selectedFund && selectedFund.id === fundId) {
        await loadContributors(fundId);
      }

    } catch (error: any) {
      console.error('Error contributing to fund:', error);
      let errorMessage = "Impossible d'ajouter votre contribution";
      
      if (error.message.includes("autorisation") || error.message.includes("RLS") || error.message.includes("policy")) {
        errorMessage = "Vous n'êtes pas autorisé à contribuer à cette cotisation. Contactez le créateur pour qu'il vous ajoute comme ami.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur de contribution",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setContributingToFund(null);
    }
  };

  const createFundOrder = async (fundData: any) => {
    try {
      // Mock order creation
      console.log('Creating order for completed fund:', fundData.id);
      
      // Here you would typically create an order in your orders table
      // For now, we'll just log the action
    } catch (error) {
      console.error('Error creating fund order:', error);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString()} FCFA`;
  };

  const getProgressPercentage = (current: number, target: number): number => {
    return Math.min((current / target) * 100, 100);
  };

  const getRemainingAmount = (current: number, target: number): number => {
    return Math.max(target - current, 0);
  };

  const handleCustomContribution = async (fundId: string) => {
    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez saisir un montant valide",
        variant: "destructive"
      });
      return;
    }
    
    await handleContribute(fundId, amount);
    setCustomAmount("");
    setShowCustomInput(null);
  };

  const toggleCustomInput = (fundId: string) => {
    setShowCustomInput(showCustomInput === fundId ? null : fundId);
    setCustomAmount("");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (selectedFund) {
    const progressPercentage = getProgressPercentage(selectedFund.current_amount, selectedFund.target_amount);
    const remainingAmount = getRemainingAmount(selectedFund.current_amount, selectedFund.target_amount);
    const isCompleted = selectedFund.current_amount >= selectedFund.target_amount;

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedFund(null)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux cotisations
        </Button>

        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-2xl font-bold">{selectedFund.title}</h1>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedFund.isOwner ? "Votre cotisation" : "Cotisation d'ami"}
                  </span>
                  {!selectedFund.isOwner && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      Privée
                    </span>
                  )}
                </div>
              </div>
              {selectedFund.description && (
                <p className="text-muted-foreground">{selectedFund.description}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Progression</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(selectedFund.current_amount)} / {formatCurrency(selectedFund.target_amount)}
                </span>
              </div>
              
              <Progress value={progressPercentage} className="h-3" />
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{progressPercentage.toFixed(1)}% de l'objectif atteint</span>
                <span>
                  {isCompleted 
                    ? "🎉 Objectif atteint !" 
                    : `Plus que ${formatCurrency(remainingAmount)} à collecter`
                  }
                </span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contributeurs ({contributors.length})
              </h3>
              
              <div className="space-y-3">
                {contributors.map((contributor) => (
                  <div key={contributor.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {contributor.name.charAt(0)}
                      </div>
                      <span className="font-medium">{contributor.name}</span>
                    </div>
                    <span className="text-primary font-semibold">
                      {formatCurrency(contributor.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {!isCompleted && (
              <div>
                <h3 className="font-semibold mb-4">Contribuer à cette cotisation</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[5000, 10000, 15000, 25000].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => handleContribute(selectedFund.id, amount)}
                      disabled={contributingToFund === selectedFund.id}
                    >
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                </div>

                <div className="space-y-3">
                  <Button
                    variant="secondary"
                    onClick={() => toggleCustomInput(selectedFund.id)}
                    className="w-full"
                  >
                    {showCustomInput === selectedFund.id ? "Annuler" : "Autre montant"}
                  </Button>

                  {showCustomInput === selectedFund.id && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Montant en FCFA"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleCustomContribution(selectedFund.id)}
                        disabled={contributingToFund === selectedFund.id || !customAmount}
                      >
                        {contributingToFund === selectedFund.id ? "..." : "Contribuer"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cotisations</h1>
        <p className="text-muted-foreground">
          Découvrez les cotisations de vos amis et contribuez ensemble pour des cadeaux mémorables
        </p>
      </div>

      {funds.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Gift className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Aucune cotisation disponible</h3>
              <p className="text-muted-foreground">
                Créez votre première cotisation ou ajoutez des amis pour voir leurs cotisations
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {funds.map((fund) => {
            const progressPercentage = getProgressPercentage(fund.current_amount, fund.target_amount);
            const remainingAmount = getRemainingAmount(fund.current_amount, fund.target_amount);
            const isCompleted = fund.current_amount >= fund.target_amount;

            return (
              <Card key={fund.id} className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">{fund.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {fund.isOwner ? "Votre cotisation" : "Cotisation d'ami"}
                      </span>
                      {!fund.isOwner && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Privée
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {fund.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{fund.description}</p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Objectif: {formatCurrency(fund.target_amount)}</span>
                      <span className="font-semibold">{progressPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(fund.current_amount)} collectés
                      {!isCompleted && ` • Plus que ${formatCurrency(remainingAmount)}`}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {fund.occasion && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {fund.occasion}
                        </span>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleFundClick(fund)}
                      variant={isCompleted ? "secondary" : "default"}
                    >
                      {isCompleted ? "Voir" : "Contribuer"}
                    </Button>
                  </div>

                  {!isCompleted && (
                    <div className="space-y-3">
                      {/* Boutons rapides */}
                      <div className="grid grid-cols-3 gap-2">
                        {[5000, 10000, 15000].map((amount) => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContribute(fund.id, amount);
                            }}
                            disabled={contributingToFund === fund.id}
                            className="text-xs"
                          >
                            {amount >= 1000 ? `${amount/1000}K` : amount}
                          </Button>
                        ))}
                      </div>
                      
                      {/* Montant personnalisé */}
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Autre montant"
                          value={showCustomInput === fund.id ? customAmount : ""}
                          onChange={(e) => {
                            setCustomAmount(e.target.value);
                            if (showCustomInput !== fund.id) {
                              setShowCustomInput(fund.id);
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCustomInput(fund.id);
                          }}
                          className="flex-1 text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCustomContribution(fund.id);
                          }}
                          disabled={contributingToFund === fund.id || !customAmount || showCustomInput !== fund.id}
                        >
                          {contributingToFund === fund.id ? "..." : "Contribuer"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
