import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TopBusiness } from '@/hooks/useShareAnalytics';
import { Store, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TopSharedBusinessesTableProps {
  data: TopBusiness[];
  loading: boolean;
}

export function TopSharedBusinessesTable({ data, loading }: TopSharedBusinessesTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          Top 10 Business Partagés
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Aucun business partagé
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead className="text-right">Partages</TableHead>
                  <TableHead className="text-right">Clics</TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <UserPlus className="h-3 w-3" />
                      Follows
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Commandes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((business, index) => {
                  const followRate = business.clicks > 0 
                    ? (business.follows / business.clicks) * 100 
                    : 0;
                    
                  return (
                    <TableRow key={business.businessId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-6 h-6 p-0 justify-center">
                            {index + 1}
                          </Badge>
                          <span className="font-medium truncate max-w-[150px]" title={business.businessName}>
                            {business.businessName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {business.shares}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {business.clicks}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-purple-600 font-medium">
                          {business.follows}
                        </span>
                        <span className="text-muted-foreground text-xs ml-1">
                          ({followRate.toFixed(0)}%)
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-green-600 font-medium">
                          {business.orders}
                        </span>
                        {business.orderValue > 0 && (
                          <span className="text-muted-foreground text-xs block">
                            {business.orderValue.toLocaleString('fr-FR')} F
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
