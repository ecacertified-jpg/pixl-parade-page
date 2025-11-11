import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AmountSuggestion {
  amount: number;
  label: string;
  reason: string;
}

interface SmartAmountSuggestionsData {
  suggestions: AmountSuggestion[];
  reciprocityScore: number | null;
  hasHistory: boolean;
  averageContribution: number | null;
}

export function useSmartAmountSuggestions(
  fundId: string,
  fundCreatorId: string,
  targetAmount: number,
  currentAmount: number,
  occasion?: string
) {
  const [data, setData] = useState<SmartAmountSuggestionsData>({
    suggestions: [],
    reciprocityScore: null,
    hasHistory: false,
    averageContribution: null,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user && fundId && fundCreatorId) {
      fetchSmartSuggestions();
    }
  }, [user, fundId, fundCreatorId]);

  const fetchSmartSuggestions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const suggestions: AmountSuggestion[] = [];

      // 1. Vérifier l'historique de réciprocité entre l'utilisateur et le créateur
      const { data: reciprocityData } = await supabase
        .from('reciprocity_tracking')
        .select('contribution_amount')
        .or(`and(donor_id.eq.${fundCreatorId},beneficiary_id.eq.${user.id}),and(donor_id.eq.${user.id},beneficiary_id.eq.${fundCreatorId})`);

      // 2. Récupérer l'historique des contributions de l'utilisateur
      const { data: userContributions } = await supabase
        .from('fund_contributions')
        .select('amount')
        .eq('contributor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // 3. Récupérer les contributions moyennes pour des occasions similaires
      let occasionAverage = null;
      if (occasion) {
        const { data: occasionContributions } = await supabase
          .from('fund_contributions')
          .select('amount, fund_id, collective_funds!inner(occasion)')
          .eq('contributor_id', user.id);

        const filteredByOccasion = occasionContributions?.filter(
          (c: any) => c.collective_funds?.occasion === occasion
        );

        if (filteredByOccasion && filteredByOccasion.length > 0) {
          occasionAverage =
            filteredByOccasion.reduce((sum: number, c: any) => sum + Number(c.amount), 0) /
            filteredByOccasion.length;
        }
      }

      // 4. Récupérer le score de réciprocité de l'utilisateur
      const { data: reciprocityScore } = await supabase
        .from('reciprocity_scores')
        .select('generosity_score')
        .eq('user_id', user.id)
        .single();

      // Calculer la moyenne des contributions de l'utilisateur
      const userAverage =
        userContributions && userContributions.length > 0
          ? userContributions.reduce((sum, c) => sum + Number(c.amount), 0) /
            userContributions.length
          : null;

      // Calculer le montant restant
      const remainingAmount = targetAmount - currentAmount;

      // Génération des suggestions intelligentes
      const hasHistory = (reciprocityData && reciprocityData.length > 0) || false;

      // Suggestion 1: Basée sur la réciprocité directe
      if (reciprocityData && reciprocityData.length > 0) {
        const reciprocityAvg =
          reciprocityData.reduce((sum, r) => sum + Number(r.contribution_amount), 0) /
          reciprocityData.length;

        suggestions.push({
          amount: Math.round(reciprocityAvg),
          label: 'Réciprocité',
          reason: `Basé sur votre historique d'échange avec ce contact`,
        });
      }

      // Suggestion 2: Basée sur la moyenne personnelle
      if (userAverage && userAverage > 0) {
        suggestions.push({
          amount: Math.round(userAverage),
          label: 'Ma moyenne',
          reason: `Votre contribution habituelle`,
        });
      }

      // Suggestion 3: Basée sur l'occasion
      if (occasionAverage && occasionAverage > 0) {
        suggestions.push({
          amount: Math.round(occasionAverage),
          label: `Occasion similaire`,
          reason: `Moyenne pour ${getOccasionLabel(occasion)}`,
        });
      }

      // Suggestion 4: Contribution équitable (objectif / 5 contributeurs estimés)
      const fairShare = Math.round(targetAmount / 5);
      if (fairShare >= 1000 && fairShare <= remainingAmount) {
        suggestions.push({
          amount: fairShare,
          label: 'Part équitable',
          reason: 'Montant si 5 personnes contribuent',
        });
      }

      // Suggestion 5: Basée sur le score de générosité
      if (reciprocityScore?.generosity_score) {
        const score = Number(reciprocityScore.generosity_score);
        let generousAmount = 0;

        if (score >= 80) {
          generousAmount = Math.round(targetAmount * 0.3); // 30% de l'objectif
        } else if (score >= 60) {
          generousAmount = Math.round(targetAmount * 0.2); // 20% de l'objectif
        } else {
          generousAmount = Math.round(targetAmount * 0.15); // 15% de l'objectif
        }

        if (generousAmount > 0 && generousAmount <= remainingAmount) {
          suggestions.push({
            amount: generousAmount,
            label: 'Contribution généreuse',
            reason: `Selon votre score de générosité (${score.toFixed(0)})`,
          });
        }
      }

      // Suggestion 6: Montants standards si pas d'historique
      if (suggestions.length === 0) {
        const standardAmounts = [5000, 10000, 20000, 50000];
        standardAmounts.forEach((amount) => {
          if (amount <= remainingAmount) {
            suggestions.push({
              amount,
              label: `${(amount / 1000).toFixed(0)}K`,
              reason: 'Montant suggéré',
            });
          }
        });
      }

      // Trier et dédupliquer les suggestions
      const uniqueSuggestions = Array.from(
        new Map(suggestions.map((s) => [s.amount, s])).values()
      )
        .sort((a, b) => a.amount - b.amount)
        .filter((s) => s.amount >= 1000 && s.amount <= remainingAmount)
        .slice(0, 4);

      setData({
        suggestions: uniqueSuggestions,
        reciprocityScore: reciprocityScore?.generosity_score
          ? Number(reciprocityScore.generosity_score)
          : null,
        hasHistory,
        averageContribution: userAverage,
      });
    } catch (error) {
      console.error('Error fetching smart amount suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  return { ...data, loading };
}

function getOccasionLabel(occasion?: string): string {
  const labels: Record<string, string> = {
    birthday: 'anniversaires',
    wedding: 'mariages',
    academic: 'réussites académiques',
    promotion: 'promotions',
    other: 'événements similaires',
  };
  return labels[occasion || ''] || 'événements similaires';
}
