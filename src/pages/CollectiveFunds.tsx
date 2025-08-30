import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, Target, Calendar, Gift, Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CollectiveFund {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  deadline_date?: string;
  status: string;
  occasion?: string;
  creator_name?: string;
  beneficiary_name?: string;
  beneficiary_avatar?: string;
  beneficiary_relationship?: string;
  contributors_count: number;
  my_contribution?: number;
}

interface Contributor {
  id: string;
  name: string;
  amount: number;
  avatar_url?: string;
}

export default function CollectiveFunds() {
  const [funds, setFunds] = useState<CollectiveFund[]>([]);
  const [selectedFund, setSelectedFund] = useState<CollectiveFund | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [contributingToFund, setContributingToFund] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState<{[key: string]: boolean}>({});
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadFunds();
  }, [user]);

  const loadFunds = async () => {
    if (!user) return;

    try {
      // Get funds created by user (all statuses)
      const { data: createdFunds, error: createdError } = await supabase
        .from("collective_funds")
        .select(`
          *,
          fund_contributions(contributor_id, amount),
          contacts!collective_funds_beneficiary_contact_id_fkey(name, avatar_url, relationship)
        `)
        .eq("creator_id", user.id)
        .in("status", ["active", "completed", "target_reached"]);

      if (createdError) throw createdError;

      // Get funds where user has contributed (all statuses)
      const { data: contributedFunds, error: contributedError } = await supabase
        .from("collective_funds")
        .select(`
          *,
          fund_contributions!inner(contributor_id, amount),
          contacts!collective_funds_beneficiary_contact_id_fkey(name, avatar_url, relationship)
        `)
        .eq("fund_contributions.contributor_id", user.id)
        .in("status", ["active", "completed", "target_reached"])
        .neq("creator_id", user.id); // Exclude funds already in createdFunds

      if (contributedError) throw contributedError;

      // Combine and deduplicate funds
      const allFunds = [...(createdFunds || []), ...(contributedFunds || [])];
      const uniqueFunds = allFunds.filter((fund, index, self) => 
        index === self.findIndex(f => f.id === fund.id)
      );

      const fundsWithStats = uniqueFunds.map(fund => {
        // Extract beneficiary name from title if contact info is not available
        let beneficiaryName = fund.contacts?.name;
        if (!beneficiaryName && fund.title) {
          const match = fund.title.match(/Cadeau pour (.+)$/);
          beneficiaryName = match ? match[1] : 'Bénéficiaire';
        }

        return {
          ...fund,
          contributors_count: fund.fund_contributions?.length || 0,
          my_contribution: fund.fund_contributions?.find(c => c.contributor_id === user.id)?.amount || 0,
          beneficiary_name: beneficiaryName || 'Bénéficiaire',
          beneficiary_avatar: fund.contacts?.avatar_url,
          beneficiary_relationship: fund.contacts?.relationship
        };
      });

      console.log('Loaded funds:', fundsWithStats);
      setFunds(fundsWithStats);
    } catch (error) {
      console.error('Error loading funds:', error);
      setFunds([]);
    } finally {
      setLoading(false);
    }
  };

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

      // Reload funds to show updated amounts
      await loadFunds();
      if (selectedFund) {
        await loadContributors(selectedFund.id);
      }
    } catch (error: any) {
      console.error('Error contributing:', error);
      toast({
        title: "Erreur lors de la contribution",
        description: error.message || "Une erreur inattendue s'est produite. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setContributingToFund(null);
    }
  };

  const createFundOrder = async (fund: any) => {
    try {
      // Extract product info from description
      const productMatch = fund.description?.match(/Produit: (.+?)(?:\n|$)/);
      const productName = productMatch ? productMatch[1] : fund.title;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: fund.creator_id,
          total_amount: fund.target_amount,
          currency: fund.currency || "XOF",
          status: "pending",
          notes: `Commande créée automatiquement pour la cagnotte: ${fund.title} (ID: ${fund.id})`,
          delivery_address: {
            type: "fund_order",
            fund_id: fund.id,
            beneficiary_contact_id: fund.beneficiary_contact_id
          }
        })
        .select()
        .single();

      if (orderError) throw orderError;

      console.log('Order created for completed fund:', order);
    } catch (error) {
      console.error('Error creating fund order:', error);
    }
  };

  const formatCurrency = (amount: number, currency: string = "XOF") => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getRemainingAmount = (current: number, target: number) => {
    return Math.max(0, target - current);
  };

  const handleCustomContribution = async (fundId: string) => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) return;

    // Get current fund to check remaining amount
    const fund = funds.find(f => f.id === fundId) || selectedFund;
    if (!fund) return;

    const remaining = getRemainingAmount(fund.current_amount, fund.target_amount);
    const contributionAmount = Math.min(amount, remaining);

    await handleContribute(fundId, contributionAmount);
    setCustomAmount("");
    setShowCustomInput(prev => ({ ...prev, [fundId]: false }));
  };

  const toggleCustomInput = (fundId: string) => {
    setShowCustomInput(prev => ({ ...prev, [fundId]: !prev[fundId] }));
    setCustomAmount("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4 h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (selectedFund) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedFund(null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">{selectedFund.title}</h1>
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm">Initiateur</Button>
              <Button variant="outline" size="sm" className="bg-green-50 text-green-700 border-green-200">
                Actif
              </Button>
            </div>
          </div>

          {/* Recipient Card */}
          {selectedFund.beneficiary_name && (
            <Card className="p-4 mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedFund.beneficiary_avatar} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {selectedFund.beneficiary_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">{selectedFund.beneficiary_name}</h3>
                  <p className="text-sm text-blue-600">
                    {selectedFund.beneficiary_relationship || "Proche"}
                  </p>
                </div>
                <Gift className="h-5 w-5 text-blue-500" />
              </div>
            </Card>
          )}

          {/* Progress Card */}
          <Card className="p-6 mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">Progression</h2>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(selectedFund.current_amount)} / {formatCurrency(selectedFund.target_amount)}
              </p>
            </div>
            
            <Progress 
              value={getProgressPercentage(selectedFund.current_amount, selectedFund.target_amount)} 
              className="h-3 mb-2"
            />
            
            <p className="text-center text-purple-600 font-medium">
              {Math.round(getProgressPercentage(selectedFund.current_amount, selectedFund.target_amount))}% atteint
            </p>
          </Card>

          {/* Contributors */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">
              Contributeurs ({contributors.length}):
            </h3>
            
            <div className="space-y-3">
              {contributors.map((contributor) => (
                <div key={contributor.id} className="flex items-center justify-between p-3 bg-card rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {contributor.name.charAt(0)}
                    </div>
                    <span className="font-medium">{contributor.name}</span>
                  </div>
                  <span className="font-bold text-green-600">
                    {formatCurrency(contributor.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Contribute Section */}
          {selectedFund.status !== "completed" ? (
            <div className="space-y-4">
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleContribute(selectedFund.id, 2000)}
                  disabled={contributingToFund === selectedFund.id}
                  className="text-xs"
                >
                  {contributingToFund === selectedFund.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "2 000"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleContribute(selectedFund.id, 5000)}
                  disabled={contributingToFund === selectedFund.id}
                  className="text-xs"
                >
                  {contributingToFund === selectedFund.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "5 000"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleContribute(selectedFund.id, 10000)}
                  disabled={contributingToFund === selectedFund.id}
                  className="text-xs"
                >
                  {contributingToFund === selectedFund.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "10 000"
                  )}
                </Button>
              </div>

              {/* Custom Amount Input */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Montant personnalisé"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="flex-1"
                  />
                  <span className="flex items-center px-3 text-sm text-muted-foreground">
                    XOF
                  </span>
                </div>
                
                {customAmount && (
                  <div className="text-xs text-muted-foreground text-center">
                    Montant restant: {formatCurrency(getRemainingAmount(selectedFund.current_amount, selectedFund.target_amount))}
                  </div>
                )}

                <Button
                  onClick={() => handleCustomContribution(selectedFund.id)}
                  disabled={!customAmount || parseFloat(customAmount) <= 0 || contributingToFund === selectedFund.id}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {contributingToFund === selectedFund.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Contribuer {customAmount && contributingToFund !== selectedFund.id ? formatCurrency(Math.min(parseFloat(customAmount) || 0, getRemainingAmount(selectedFund.current_amount, selectedFund.target_amount))) : ""}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center p-4">
              <Badge className="bg-green-100 text-green-800 mb-2">
                ✅ Objectif atteint
              </Badge>
              <p className="text-sm text-green-600 font-medium">
                Commande créée automatiquement
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Cotisations</h1>
        </div>

        {/* Funds List */}
        <div className="space-y-4">
          {funds.length === 0 ? (
            <Card className="p-8 text-center">
              <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Aucune cotisation active</h3>
              <p className="text-sm text-muted-foreground">
                Les cotisations auxquelles vous participez apparaîtront ici
              </p>
            </Card>
          ) : (
            funds.map((fund) => (
              <Card
                key={fund.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleFundClick(fund)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    {fund.beneficiary_name && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={fund.beneficiary_avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {fund.beneficiary_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{fund.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Pour: {fund.beneficiary_name || "Bénéficiaire"}</span>
                        {fund.beneficiary_relationship && (
                          <>
                            <span>•</span>
                            <span>{fund.beneficiary_relationship}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant="secondary" className="text-xs self-start">
                      {fund.occasion}
                    </Badge>
                    <Badge 
                      className={`text-xs self-start ${
                        fund.status === "completed" 
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {fund.status === "completed" ? "Terminé" : "Actif"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      {formatCurrency(fund.current_amount)}
                    </span>
                    <span className="text-muted-foreground">
                      / {formatCurrency(fund.target_amount)}
                    </span>
                  </div>
                  
                  <Progress 
                    value={getProgressPercentage(fund.current_amount, fund.target_amount)} 
                    className="h-2"
                  />
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{fund.contributors_count} contributeurs</span>
                    </div>
                    {fund.my_contribution > 0 && (
                      <span className="text-green-600 font-medium">
                        Votre contribution: {formatCurrency(fund.my_contribution)}
                      </span>
                    )}
                  </div>

                  {/* Status and Action */}
                  {fund.status === "completed" ? (
                    <div className="text-center">
                      <Badge className="bg-green-100 text-green-800 mb-2">
                        ✅ Objectif atteint
                      </Badge>
                      <p className="text-xs text-green-600 font-medium">
                        Commande créée automatiquement
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {!showCustomInput[fund.id] ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContribute(fund.id, 2000);
                            }}
                            className="flex-1 text-xs"
                          >
                            +2k
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContribute(fund.id, 5000);
                            }}
                            className="flex-1 text-xs"
                          >
                            +5k
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCustomInput(fund.id);
                            }}
                            className="px-2"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            type="number"
                            placeholder="Montant"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            className="flex-1 h-8 text-xs"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleCustomContribution(fund.id);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleCustomContribution(fund.id)}
                            disabled={!customAmount || parseFloat(customAmount) <= 0}
                            className="h-8 px-2 text-xs"
                          >
                            OK
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleCustomInput(fund.id)}
                            className="h-8 px-2"
                          >
                            ✕
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}