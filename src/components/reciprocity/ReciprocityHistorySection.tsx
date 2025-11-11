import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ContributionHistory, ReceivedContribution } from '@/hooks/useReciprocityHistory';

interface ReciprocityHistorySectionProps {
  contributionsGiven: ContributionHistory[];
  contributionsReceived: ReceivedContribution[];
}

export function ReciprocityHistorySection({
  contributionsGiven,
  contributionsReceived,
}: ReciprocityHistorySectionProps) {
  const totalGiven = contributionsGiven.reduce((sum, c) => sum + Number(c.amount), 0);
  const totalReceived = contributionsReceived.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Historique Complet
        </CardTitle>
        <CardDescription>
          Toutes vos contributions données et reçues
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="given" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="given" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Données ({contributionsGiven.length})
            </TabsTrigger>
            <TabsTrigger value="received" className="gap-2">
              <TrendingDown className="h-4 w-4" />
              Reçues ({contributionsReceived.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="given" className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">Total donné</p>
              <p className="text-2xl font-bold text-primary">{totalGiven.toLocaleString()} XOF</p>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              {contributionsGiven.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucune contribution donnée pour le moment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contributionsGiven.map((contrib) => (
                    <div
                      key={contrib.id}
                      className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{contrib.fund_title}</p>
                          <Badge variant="outline" className="text-xs">
                            {contrib.fund_occasion}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          Pour {contrib.beneficiary_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(contrib.created_at), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-primary">
                          {Number(contrib.amount).toLocaleString()} XOF
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="received" className="space-y-4">
            <div className="bg-green-500/10 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">Total reçu</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {totalReceived.toLocaleString()} XOF
              </p>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              {contributionsReceived.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucune contribution reçue pour le moment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contributionsReceived.map((contrib) => (
                    <div
                      key={contrib.id}
                      className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{contrib.fund_title}</p>
                          <Badge variant="outline" className="text-xs">
                            {contrib.fund_occasion}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          De {contrib.contributor_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(contrib.created_at), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-green-600 dark:text-green-400">
                          {Number(contrib.amount).toLocaleString()} XOF
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
