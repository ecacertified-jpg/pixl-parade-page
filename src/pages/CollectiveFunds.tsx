import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Target, Calendar, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadFunds();
  }, [user]);

  const loadFunds = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("collective_funds")
        .select(`
          *,
          fund_contributions(contributor_id, amount),
          contacts!collective_funds_beneficiary_contact_id_fkey(name, avatar_url, relationship)
        `)
        .or(`creator_id.eq.${user.id},fund_contributions.contributor_id.eq.${user.id}`)
        .eq("status", "active");

      if (error) throw error;

      const fundsWithStats = data?.map(fund => ({
        ...fund,
        contributors_count: fund.fund_contributions?.length || 0,
        my_contribution: fund.fund_contributions?.find(c => c.contributor_id === user.id)?.amount || 0,
        beneficiary_name: fund.contacts?.name || "Bénéficiaire",
        beneficiary_avatar: fund.contacts?.avatar_url,
        beneficiary_relationship: fund.contacts?.relationship
      })) || [];

      setFunds(fundsWithStats);
    } catch (error) {
      console.error('Error loading funds:', error);
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
    if (!user) return;

    try {
      const { error } = await supabase
        .from("fund_contributions")
        .insert({
          fund_id: fundId,
          contributor_id: user.id,
          amount,
          currency: "XOF"
        });

      if (error) throw error;

      // Reload funds to show updated amounts
      await loadFunds();
      if (selectedFund) {
        await loadContributors(selectedFund.id);
      }
    } catch (error) {
      console.error('Error contributing:', error);
    }
  };

  const formatCurrency = (amount: number, currency: string = "XOF") => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
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

          {/* Contribute Button */}
          <div className="space-y-3">
            <Button
              onClick={() => handleContribute(selectedFund.id, 5000)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Contribuer 5 000 XOF
            </Button>
            
            <Button
              onClick={() => handleContribute(selectedFund.id, 10000)}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              Contribuer 10 000 XOF
            </Button>
          </div>
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
                  <Badge variant="secondary" className="text-xs">
                    {fund.occasion}
                  </Badge>
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
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
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
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}