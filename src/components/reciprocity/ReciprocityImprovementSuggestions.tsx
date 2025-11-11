import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, Target, TrendingUp, Users, Gift, Heart, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'frequency' | 'amount' | 'diversity' | 'reciprocity';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ReciprocityImprovementSuggestionsProps {
  currentScore: number;
  contributionsGiven: number;
  contributionsReceived: number;
  relations: any[];
}

export function ReciprocityImprovementSuggestions({
  currentScore,
  contributionsGiven,
  contributionsReceived,
  relations,
}: ReciprocityImprovementSuggestionsProps) {
  const navigate = useNavigate();

  const generateSuggestions = (): Suggestion[] => {
    const suggestions: Suggestion[] = [];

    // Suggestion based on contribution frequency
    if (contributionsGiven < 5) {
      suggestions.push({
        id: 'frequency-1',
        title: 'Augmentez votre fréquence de contributions',
        description: 'Vous avez fait peu de contributions. Essayez de participer à au moins 5 cagnottes ce mois-ci pour améliorer votre score.',
        impact: 'high',
        category: 'frequency',
        action: {
          label: 'Voir les cagnottes publiques',
          onClick: () => navigate('/community'),
        },
      });
    }

    // Suggestion based on reciprocity balance
    const imbalancedRelations = relations.filter(r => r.relationship_type === 'mostly_receiving');
    if (imbalancedRelations.length > 0) {
      suggestions.push({
        id: 'reciprocity-1',
        title: 'Rééquilibrez vos relations',
        description: `Vous avez ${imbalancedRelations.length} relation(s) déséquilibrée(s). Pensez à rendre la pareille aux personnes qui vous ont aidé.`,
        impact: 'high',
        category: 'reciprocity',
        action: {
          label: 'Voir mes relations',
          onClick: () => {},
        },
      });
    }

    // Suggestion based on score level
    if (currentScore < 20) {
      suggestions.push({
        id: 'amount-1',
        title: 'Visez le badge Contributeur',
        description: 'Il vous manque ' + (20 - currentScore) + ' points pour atteindre le niveau Contributeur. Continuez vos contributions !',
        impact: 'medium',
        category: 'diversity',
      });
    } else if (currentScore < 50) {
      suggestions.push({
        id: 'amount-2',
        title: 'Visez le badge Généreux',
        description: 'Plus que ' + (50 - currentScore) + ' points pour devenir Généreux. Diversifiez vos contributions pour différentes occasions.',
        impact: 'medium',
        category: 'diversity',
      });
    } else if (currentScore < 80) {
      suggestions.push({
        id: 'amount-3',
        title: 'Devenez Champion',
        description: 'Encore ' + (80 - currentScore) + ' points pour atteindre le statut de Champion. Initiez des cagnottes et contribuez régulièrement.',
        impact: 'high',
        category: 'diversity',
      });
    }

    // Suggestion for network expansion
    if (relations.length < 5) {
      suggestions.push({
        id: 'diversity-1',
        title: 'Élargissez votre réseau',
        description: 'Vous avez peu de relations d\'échange. Ajoutez plus d\'amis et participez à leurs célébrations.',
        impact: 'medium',
        category: 'diversity',
        action: {
          label: 'Ajouter des amis',
          onClick: () => navigate('/dashboard?tab=amis'),
        },
      });
    }

    // Suggestion to create funds
    suggestions.push({
      id: 'diversity-2',
      title: 'Créez vos propres cagnottes',
      description: 'Initier des cagnottes pour vos proches augmente votre score et renforce vos liens.',
      impact: 'medium',
      category: 'diversity',
      action: {
        label: 'Créer une cagnotte',
        onClick: () => navigate('/dashboard?tab=cagnottes'),
      },
    });

    // Positive reinforcement for active users
    if (currentScore >= 50) {
      suggestions.push({
        id: 'positive-1',
        title: 'Continuez votre excellent travail !',
        description: 'Votre générosité inspire la communauté. Maintenez votre élan pour garder votre badge.',
        impact: 'low',
        category: 'frequency',
      });
    }

    return suggestions;
  };

  const suggestions = generateSuggestions();

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-orange-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'Impact fort';
      case 'medium':
        return 'Impact moyen';
      case 'low':
        return 'Impact faible';
      default:
        return '';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'frequency':
        return TrendingUp;
      case 'amount':
        return Target;
      case 'diversity':
        return Users;
      case 'reciprocity':
        return Heart;
      default:
        return Gift;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Suggestions Personnalisées
        </CardTitle>
        <CardDescription>
          Conseils pour améliorer votre score de réciprocité
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => {
            const CategoryIcon = getCategoryIcon(suggestion.category);
            
            return (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                    <CategoryIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{suggestion.title}</h4>
                      <Badge
                        variant="outline"
                        className={`${getImpactColor(suggestion.impact)} text-white border-0 text-xs`}
                      >
                        {getImpactLabel(suggestion.impact)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {suggestion.description}
                    </p>
                  </div>
                </div>

                {suggestion.action && (
                  <Button
                    onClick={suggestion.action.onClick}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                  >
                    {suggestion.action.label}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Tips Section */}
        <div className="mt-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            Conseils généraux
          </h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Contribuez régulièrement, même de petits montants comptent</li>
            <li>• Variez les occasions auxquelles vous participez</li>
            <li>• Retournez les faveurs reçues pour maintenir l'équilibre</li>
            <li>• Créez des cagnottes pour vos proches lors d'événements importants</li>
            <li>• Soyez actif dans la communauté et commentez les cagnottes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
