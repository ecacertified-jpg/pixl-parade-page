import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gift, ShoppingBag, Heart, PartyPopper, Bell, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryStats {
  category: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

interface NotificationCategoryTableProps {
  categories: CategoryStats[];
}

const categoryConfig: Record<string, { label: string; icon: typeof Gift; color: string }> = {
  birthday: { label: 'Anniversaires', icon: PartyPopper, color: 'text-celebration' },
  order: { label: 'Commandes', icon: ShoppingBag, color: 'text-success' },
  fund: { label: 'Cagnottes', icon: Gift, color: 'text-primary' },
  gratitude: { label: 'Remerciements', icon: Heart, color: 'text-heart' },
  marketing: { label: 'Marketing', icon: Bell, color: 'text-accent' },
  other: { label: 'Autres', icon: HelpCircle, color: 'text-muted-foreground' },
};

export function NotificationCategoryTable({ categories }: NotificationCategoryTableProps) {
  const getRateColor = (rate: number) => {
    if (rate >= 40) return 'text-success';
    if (rate >= 20) return 'text-gratitude';
    return 'text-destructive';
  };

  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance par catégorie</CardTitle>
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
        <CardTitle className="text-lg">Performance par catégorie</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">Envoyées</TableHead>
              <TableHead className="text-right">Ouvertes</TableHead>
              <TableHead className="text-right">Taux ouverture</TableHead>
              <TableHead className="text-right">Cliquées</TableHead>
              <TableHead className="text-right">Conversions</TableHead>
              <TableHead className="w-32">Performance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => {
              const config = categoryConfig[cat.category] || categoryConfig.other;
              const Icon = config.icon;
              
              return (
                <TableRow key={cat.category}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className={cn('h-4 w-4', config.color)} />
                      <span className="font-medium">{config.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {cat.sent.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {cat.opened.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={getRateColor(cat.openRate)}>
                      {cat.openRate.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {cat.clicked.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium text-success">{cat.converted}</span>
                    {cat.converted > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({cat.conversionRate.toFixed(1)}%)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={cat.openRate} className="h-2" />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
