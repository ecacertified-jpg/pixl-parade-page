import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TopProduct } from '@/hooks/useShareAnalytics';
import { Package, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface TopSharedProductsTableProps {
  data: TopProduct[];
  loading: boolean;
}

export function TopSharedProductsTable({ data, loading }: TopSharedProductsTableProps) {
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
          <Package className="h-5 w-5 text-primary" />
          Top 10 Produits Partagés
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Aucun produit partagé
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Partages</TableHead>
                  <TableHead className="text-right">Clics</TableHead>
                  <TableHead className="text-right">Conv.</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((product, index) => {
                  const conversionRate = product.clicks > 0 
                    ? (product.conversions / product.clicks) * 100 
                    : 0;
                    
                  return (
                    <TableRow key={product.productId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-6 h-6 p-0 justify-center">
                            {index + 1}
                          </Badge>
                          <span className="font-medium truncate max-w-[150px]" title={product.productName}>
                            {product.productName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {product.shares}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {product.clicks}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-green-600 font-medium">
                          {product.conversions}
                        </span>
                        <span className="text-muted-foreground text-xs ml-1">
                          ({conversionRate.toFixed(0)}%)
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-amber-600 font-medium">
                        {product.value > 0 
                          ? `${product.value.toLocaleString('fr-FR')} F`
                          : '-'
                        }
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
