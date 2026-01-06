import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users } from 'lucide-react';

interface CohortData {
  period: string;
  periodLabel: string;
  count: number;
  averageScore: number;
  perfectRate: number;
  completeRate: number;
}

interface CohortCompletionTableProps {
  data: CohortData[];
}

function getScoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= 70) return 'default';
  if (score >= 40) return 'secondary';
  return 'destructive';
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'hsl(142, 76%, 36%)';
  if (score >= 40) return 'hsl(38, 92%, 50%)';
  return 'hsl(0, 84%, 60%)';
}

export function CohortCompletionTable({ data }: CohortCompletionTableProps) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Analyse par cohorte
          </CardTitle>
          <CardDescription>Complétion des profils par mois d'inscription</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
          Aucune donnée disponible
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Analyse par cohorte
        </CardTitle>
        <CardDescription>Complétion des profils par mois d'inscription</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cohorte</TableHead>
              <TableHead className="text-center">Utilisateurs</TableHead>
              <TableHead>Score moyen</TableHead>
              <TableHead className="text-center">100% complet</TableHead>
              <TableHead className="text-center">80%+ complet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((cohort) => (
              <TableRow key={cohort.period}>
                <TableCell className="font-medium capitalize">
                  {cohort.periodLabel}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{cohort.count}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-24">
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full rounded-full transition-all"
                          style={{
                            width: `${cohort.averageScore}%`,
                            backgroundColor: getScoreColor(cohort.averageScore),
                          }}
                        />
                      </div>
                    </div>
                    <Badge variant={getScoreBadgeVariant(cohort.averageScore)}>
                      {cohort.averageScore}%
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium">{cohort.perfectRate}%</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium">{cohort.completeRate}%</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
