import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TopContributor {
  user_id: string;
  total_contributions_count: number;
  total_amount_given: number;
  generosity_score: number;
  badge_level: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
}

interface TopContributorsTableProps {
  contributors: TopContributor[];
}

const getBadgeVariant = (level: string) => {
  switch (level) {
    case 'champion': return 'default';
    case 'generous': return 'secondary';
    case 'helper': return 'outline';
    default: return 'outline';
  }
};

const getBadgeLabel = (level: string) => {
  switch (level) {
    case 'champion': return 'Champion';
    case 'generous': return 'Généreux';
    case 'helper': return 'Contributeur';
    case 'newcomer': return 'Nouveau';
    default: return level;
  }
};

export function TopContributorsTable({ contributors }: TopContributorsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 20 Contributeurs</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Badge</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right">Contributions</TableHead>
              <TableHead className="text-right">Montant total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contributors.map((contributor, index) => (
              <TableRow key={contributor.user_id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={contributor.avatar_url} />
                      <AvatarFallback>
                        {contributor.first_name?.[0]}{contributor.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {contributor.first_name} {contributor.last_name}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(contributor.badge_level)}>
                    {getBadgeLabel(contributor.badge_level)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {contributor.generosity_score.toFixed(1)}
                </TableCell>
                <TableCell className="text-right">
                  {contributor.total_contributions_count}
                </TableCell>
                <TableCell className="text-right">
                  {contributor.total_amount_given.toLocaleString('fr-FR')} XOF
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
