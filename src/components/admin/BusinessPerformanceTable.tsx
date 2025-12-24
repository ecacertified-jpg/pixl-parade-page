import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ArrowUpDown, CheckCircle, Star } from 'lucide-react';
import type { BusinessPerformance } from '@/hooks/useBusinessDetailedStats';
import { ExportButton } from './ExportButton';
import { exportToCSV, formatNumberFr, type ExportColumn } from '@/utils/exportUtils';

interface BusinessPerformanceTableProps {
  data: BusinessPerformance[];
  loading: boolean;
}

type SortField = 'revenue' | 'orders' | 'products' | 'rating' | 'name';
type SortDirection = 'asc' | 'desc';

export function BusinessPerformanceTable({ data, loading }: BusinessPerformanceTableProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Get unique business types
  const businessTypes = useMemo(() => {
    const types = new Set(data.map(b => b.type));
    return Array.from(types);
  }, [data]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(b => 
        b.name.toLowerCase().includes(searchLower) ||
        b.type.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter(b => b.type === typeFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'revenue':
          comparison = a.revenue - b.revenue;
          break;
        case 'orders':
          comparison = a.orders - b.orders;
          break;
        case 'products':
          comparison = a.products - b.products;
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [data, search, typeFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatRevenue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  const handleExportCSV = () => {
    const columns: ExportColumn<BusinessPerformance>[] = [
      { key: 'name', header: 'Nom du Business' },
      { key: 'type', header: 'Type' },
      { key: 'isActive', header: 'Statut', format: (v) => v ? 'Actif' : 'Inactif' },
      { key: 'isVerified', header: 'Vérifié', format: (v) => v ? 'Oui' : 'Non' },
      { key: 'products', header: 'Produits' },
      { key: 'orders', header: 'Commandes' },
      { key: 'revenue', header: 'Revenus (XOF)', format: (v) => formatNumberFr(v) },
      { key: 'rating', header: 'Note', format: (v) => v.toFixed(1) },
    ];
    exportToCSV(filteredData, columns, 'performance_business');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-40" />
          </div>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
    </TableHead>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          📋 Performance des Business
        </CardTitle>
        <ExportButton onExportCSV={handleExportCSV} disabled={filteredData.length === 0} />
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un business..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Type de business" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {businessTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="name">Business</SortableHeader>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <SortableHeader field="products">Produits</SortableHeader>
                <SortableHeader field="orders">Commandes</SortableHeader>
                <SortableHeader field="revenue">Revenus</SortableHeader>
                <SortableHeader field="rating">Note</SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun business trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((business) => (
                  <TableRow key={business.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {business.name}
                        {business.isVerified && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{business.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {business.isActive ? (
                        <Badge variant="default" className="bg-green-500">Actif</Badge>
                      ) : (
                        <Badge variant="secondary">Inactif</Badge>
                      )}
                    </TableCell>
                    <TableCell>{business.products}</TableCell>
                    <TableCell>{business.orders}</TableCell>
                    <TableCell className="font-semibold text-primary">
                      {formatRevenue(business.revenue)} XOF
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span>{business.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-sm text-muted-foreground mt-2">
          {filteredData.length} business{filteredData.length > 1 ? 's' : ''} affiché{filteredData.length > 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  );
}
