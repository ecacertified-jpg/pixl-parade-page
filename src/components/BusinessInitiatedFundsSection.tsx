import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Target, Users, Phone, MapPin, Package, UserCheck, UserX, Clock, Gift } from "lucide-react";
import { useBusinessCollectiveFunds } from "@/hooks/useBusinessCollectiveFunds";
interface Contributor {
  id: string;
  name: string;
  amount: number;
}
interface BusinessInitiatedFund {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  status: string;
  occasion?: string;
  deadline_date?: string;
  product_name: string;
  product_image?: string;
  product_price: number;
  beneficiary_name: string;
  beneficiary_phone?: string;
  beneficiary_address?: string;
  contributors: Contributor[];
  non_contributors: Array<{
    id: string;
    name: string;
  }>;
}
export function BusinessInitiatedFundsSection() {
  const {
    user
  } = useAuth();
  const {
    funds: businessFunds,
    loading
  } = useBusinessCollectiveFunds();
  const [fundsWithDetails, setFundsWithDetails] = useState<BusinessInitiatedFund[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  useEffect(() => {
    console.log('🎯 [DEBUG] BusinessInitiatedFundsSection - businessFunds changed:', businessFunds.length);
    console.log('🎯 [DEBUG] BusinessInitiatedFundsSection - funds:', businessFunds);
    if (businessFunds.length > 0) {
      loadFundDetails();
    } else {
      setFundsWithDetails([]);
    }
  }, [businessFunds]);
  const loadFundDetails = async () => {
    setLoadingDetails(true);
    try {
      const detailedFunds: BusinessInitiatedFund[] = [];
      for (const fund of businessFunds) {
        if (!fund.fund || !fund.product || !fund.beneficiary) continue;

        // Get contributors for this fund
        const {
          data: contributions,
          error: contribError
        } = await supabase.from('fund_contributions').select(`
            id,
            amount,
            contributor_id
          `).eq('fund_id', fund.fund_id);
        if (contribError) {
          console.error('Error loading contributions:', contribError);
          continue;
        }

        // Get contributor profiles separately
        const contributors: Contributor[] = [];
        for (const contrib of contributions || []) {
          const {
            data: profile
          } = await supabase.from('public_profiles').select('first_name').eq('user_id', contrib.contributor_id).single();
          contributors.push({
            id: contrib.contributor_id,
            name: profile?.first_name || 'Anonyme',
            amount: contrib.amount
          });
        }

        // Get potential contributors (friends of beneficiary who haven't contributed)
        const {
          data: friendsData
        } = await supabase.from('contact_relationships').select('user_a, user_b').or(`user_a.eq.${fund.beneficiary_user_id},user_b.eq.${fund.beneficiary_user_id}`).eq('can_see_funds', true);
        const contributorIds = contributors.map(c => c.id);
        const nonContributors = [];
        if (friendsData) {
          for (const relation of friendsData) {
            const friendId = relation.user_a === fund.beneficiary_user_id ? relation.user_b : relation.user_a;
            if (!contributorIds.includes(friendId)) {
              const {
                data: friendProfile
              } = await supabase.from('public_profiles').select('first_name').eq('user_id', friendId).single();
              nonContributors.push({
                id: friendId,
                name: friendProfile?.first_name || 'Ami'
              });
            }
          }
        }
        detailedFunds.push({
          id: fund.id,
          title: fund.fund.title,
          target_amount: fund.fund.target_amount,
          current_amount: fund.fund.current_amount || 0,
          currency: fund.fund.currency,
          status: fund.fund.status,
          occasion: fund.fund.occasion,
          deadline_date: fund.fund.deadline_date,
          product_name: fund.product.name,
          product_image: fund.product.image_url,
          product_price: fund.product.price,
          beneficiary_name: fund.beneficiary ? `${fund.beneficiary.first_name || ''} ${fund.beneficiary.last_name || ''}`.trim() || 'Bénéficiaire' : 'Bénéficiaire',
          beneficiary_phone: fund.beneficiary?.phone,
          beneficiary_address: '',
          // Would need to be added to profiles table
          contributors,
          non_contributors: nonContributors
        });
      }
      setFundsWithDetails(detailedFunds);
    } catch (error) {
      console.error('Error loading fund details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };
  const getStatusBadge = (status: string, current: number, target: number) => {
    const progress = current / target * 100;
    if (progress >= 100) {
      return <Badge className="bg-green-500">Objectif atteint</Badge>;
    } else if (status === 'expired') {
      return <Badge variant="destructive">Expirée</Badge>;
    } else {
      return <Badge variant="secondary">En cours</Badge>;
    }
  };
  if (loading || loadingDetails) {
    return <div className="text-center py-8">
        <div className="text-muted-foreground">Chargement des cotisations...</div>
      </div>;
  }
  if (fundsWithDetails.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-6">
      {fundsWithDetails.map(fund => {
        const progress = fund.current_amount / fund.target_amount * 100;
        const isCompleted = progress >= 100;
        
        return (
          <Card key={fund.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{fund.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Bénéficiaire: {fund.beneficiary_name}
                </p>
              </div>
              {getStatusBadge(fund.status, fund.current_amount, fund.target_amount)}
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progression</span>
                  <span className="font-medium">
                    {fund.current_amount} / {fund.target_amount} {fund.currency}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              {fund.contributors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Contributeurs ({fund.contributors.length})
                  </h4>
                  <div className="space-y-2">
                    {fund.contributors.map(contributor => (
                      <div key={contributor.id} className="flex items-center justify-between text-sm">
                        <span>{contributor.name}</span>
                        <span className="font-medium">{contributor.amount} {fund.currency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}