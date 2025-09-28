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
          } = await supabase.from('profiles').select('first_name, last_name').eq('user_id', contrib.contributor_id).single();
          contributors.push({
            id: contrib.contributor_id,
            name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Anonyme' : 'Anonyme',
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
              } = await supabase.from('profiles').select('first_name, last_name').eq('user_id', friendId).single();
              nonContributors.push({
                id: friendId,
                name: friendProfile ? `${friendProfile.first_name || ''} ${friendProfile.last_name || ''}`.trim() || 'Ami' : 'Ami'
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
    return;
  }
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Cotisations initiées ({fundsWithDetails.length})</h3>
        <Badge variant="secondary">{fundsWithDetails.filter(f => f.status === 'active').length} actives</Badge>
      </div>

      {fundsWithDetails.map(fund => {
      const progress = fund.current_amount / fund.target_amount * 100;
      const isCompleted = progress >= 100;
      return <Card key={fund.id} className="p-6 border border-border/50 hover:shadow-md transition-all duration-200">
            {/* Header avec titre et statut */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{fund.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    Pour {fund.beneficiary_name}
                  </p>
                </div>
              </div>
              {getStatusBadge(fund.status, fund.current_amount, fund.target_amount)}
            </div>

            {/* Résumé du produit */}
            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{fund.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Prix: {fund.product_price.toLocaleString()} {fund.currency}
                  </p>
                </div>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-medium">
                  {fund.current_amount.toLocaleString()} / {fund.target_amount.toLocaleString()} {fund.currency}
                </span>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(progress)}% de l'objectif atteint
              </p>
            </div>

            {/* Informations du bénéficiaire et livraison */}
            <div className="mb-4 space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-sm text-blue-800 mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Informations de contact et livraison
                </h4>
                
                {fund.beneficiary_phone && <div className="flex items-center gap-3 text-sm mb-2">
                    <Phone className="h-3 w-3 text-blue-600" />
                    <span className="text-muted-foreground">Bénéficiaire:</span>
                    <span className="font-medium text-blue-800">{fund.beneficiary_phone}</span>
                  </div>}
                
                {/* Placeholder pour l'adresse de livraison - À récupérer depuis la base */}
                <div className="flex items-start gap-3 text-sm mb-2">
                  <MapPin className="h-3 w-3 text-blue-600 mt-0.5" />
                  <span className="text-muted-foreground">Livraison:</span>
                  <span className="text-blue-800">
                    {fund.beneficiary_address || "Adresse à confirmer avec le bénéficiaire"}
                  </span>
                </div>
                
                {fund.deadline_date && <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-3 w-3 text-blue-600" />
                    <span className="text-muted-foreground">Échéance:</span>
                    <span className="text-blue-800">
                      {new Date(fund.deadline_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>}
              </div>
            </div>

            {/* Contributors section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Amis contributeurs */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-600">
                    Contributeurs ({fund.contributors.length})
                  </span>
                </div>
                {fund.contributors.length > 0 ? <div className="space-y-2 max-h-32 overflow-y-auto">
                    {fund.contributors.map(contributor => <div key={contributor.id} className="flex items-center gap-2 text-sm">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {contributor.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{contributor.name}</span>
                        <span className="ml-auto font-medium text-green-600">
                          {contributor.amount.toLocaleString()} {fund.currency}
                        </span>
                      </div>)}
                  </div> : <p className="text-sm text-muted-foreground">Aucun contributeur</p>}
              </div>

              {/* Amis n'ayant pas contribué */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UserX className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-600">
                    N'ont pas contribué ({fund.non_contributors.length})
                  </span>
                </div>
                {fund.non_contributors.length > 0 ? <div className="space-y-2 max-h-32 overflow-y-auto">
                    {fund.non_contributors.slice(0, 5).map(nonContributor => <div key={nonContributor.id} className="flex items-center gap-2 text-sm">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {nonContributor.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{nonContributor.name}</span>
                      </div>)}
                    {fund.non_contributors.length > 5 && <p className="text-xs text-muted-foreground">
                        +{fund.non_contributors.length - 5} autres...
                      </p>}
                  </div> : <p className="text-sm text-muted-foreground">Tous les amis ont contribué</p>}
              </div>
            </div>

            {/* Actions si besoin */}
            {!isCompleted && fund.status === 'active' && <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Encouragez les amis n'ayant pas encore contribué à participer à cette belle initiative
                </p>
              </div>}
          </Card>;
    })}
    </div>;
}