import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, History, Users, Lightbulb, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useReciprocityScore } from '@/hooks/useReciprocityScore';
import { useReciprocityHistory } from '@/hooks/useReciprocityHistory';
import { ReciprocityBadge } from '@/components/ReciprocityBadge';
import { BadgeProgressCard } from '@/components/BadgeProgressCard';
import { AllBadgesCollection } from '@/components/AllBadgesCollection';
import { ReciprocityHistorySection } from '@/components/reciprocity/ReciprocityHistorySection';
import { ReciprocityRelationsSection } from '@/components/reciprocity/ReciprocityRelationsSection';
import { ReciprocityImprovementSuggestions } from '@/components/reciprocity/ReciprocityImprovementSuggestions';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReciprocityProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { score, loading: scoreLoading } = useReciprocityScore();
  const {
    contributionsGiven,
    contributionsReceived,
    relations,
    loading: historyLoading,
  } = useReciprocityHistory();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const loading = scoreLoading || historyLoading;

  const totalGiven = contributionsGiven.reduce((sum, c) => sum + Number(c.amount), 0);
  const totalReceived = contributionsReceived.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Button>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              {loading ? (
                <Skeleton className="w-24 h-24 rounded-full" />
              ) : (
                <ReciprocityBadge
                  score={score?.generosity_score || 0}
                  size="xl"
                  showLabel={false}
                />
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">
                Mon Profil de Réciprocité
              </h1>
              <p className="text-primary-foreground/80 mb-4">
                Suivez votre impact dans la communauté JOIE DE VIVRE
              </p>

              {loading ? (
                <div className="flex gap-4 justify-center md:justify-start">
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-32" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <Card className="bg-primary-foreground/10 border-primary-foreground/20">
                    <CardContent className="p-3">
                      <p className="text-xs text-primary-foreground/70">Score</p>
                      <p className="text-2xl font-bold">{score?.generosity_score || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary-foreground/10 border-primary-foreground/20">
                    <CardContent className="p-3">
                      <p className="text-xs text-primary-foreground/70">Contributions</p>
                      <p className="text-2xl font-bold">{contributionsGiven.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary-foreground/10 border-primary-foreground/20">
                    <CardContent className="p-3">
                      <p className="text-xs text-primary-foreground/70">Relations</p>
                      <p className="text-2xl font-bold">{relations.length}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
              <span className="sm:hidden">Vue</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Historique</span>
              <span className="sm:hidden">Hist.</span>
            </TabsTrigger>
            <TabsTrigger value="relations" className="gap-2">
              <Users className="h-4 w-4" />
              Relations
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Suggestions</span>
              <span className="sm:hidden">Tips</span>
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Award className="h-4 w-4" />
              Badges
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div className="space-y-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <>
                <BadgeProgressCard currentScore={score?.generosity_score || 0} />
                
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Statistiques de Contributions
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Total donné</span>
                            <span className="font-semibold">{totalGiven.toLocaleString()} XOF</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Nombre de contributions</span>
                            <span className="font-semibold">{contributionsGiven.length}</span>
                          </div>
                        </div>
                        <div className="pt-4 border-t">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Total reçu</span>
                            <span className="font-semibold">{totalReceived.toLocaleString()} XOF</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Nombre reçus</span>
                            <span className="font-semibold">{contributionsReceived.length}</span>
                          </div>
                        </div>
                        <div className="pt-4 border-t">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Balance nette</span>
                            <span className={`font-semibold ${
                              totalGiven - totalReceived >= 0 
                                ? 'text-primary' 
                                : 'text-orange-500'
                            }`}>
                              {(totalGiven - totalReceived).toLocaleString()} XOF
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Aperçu du Réseau
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Relations totales</span>
                          <span className="font-semibold">{relations.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Relations équilibrées</span>
                          <span className="font-semibold text-green-600">
                            {relations.filter(r => r.relationship_type === 'balanced').length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Vous donnez plus</span>
                          <span className="font-semibold text-blue-600">
                            {relations.filter(r => r.relationship_type === 'mostly_giving').length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Vous recevez plus</span>
                          <span className="font-semibold text-orange-600">
                            {relations.filter(r => r.relationship_type === 'mostly_receiving').length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            {loading ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <ReciprocityHistorySection
                contributionsGiven={contributionsGiven}
                contributionsReceived={contributionsReceived}
              />
            )}
          </TabsContent>

          {/* Relations Tab */}
          <TabsContent value="relations">
            {loading ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <ReciprocityRelationsSection relations={relations} />
            )}
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions">
            {loading ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <ReciprocityImprovementSuggestions
                currentScore={score?.generosity_score || 0}
                contributionsGiven={contributionsGiven.length}
                contributionsReceived={contributionsReceived.length}
                relations={relations}
              />
            )}
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges">
            {loading ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <AllBadgesCollection currentScore={score?.generosity_score || 0} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
