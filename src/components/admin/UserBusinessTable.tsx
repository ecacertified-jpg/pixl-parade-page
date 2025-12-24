import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Users, Search, Download, Store, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UserWithBusiness } from '@/hooks/useUserBusinessStats';

interface UserBusinessTableProps {
  users: UserWithBusiness[];
  loading: boolean;
}

type FilterType = 'all' | 'with_business' | 'without_business';

export function UserBusinessTable({ users, loading }: UserBusinessTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredUsers = users.filter(user => {
    // Search filter
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const businessNames = user.businesses.map(b => b.business_name.toLowerCase()).join(' ');
    const matchesSearch = 
      fullName.includes(searchQuery.toLowerCase()) ||
      businessNames.includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Type filter
    if (filter === 'with_business') return user.businesses.length > 0;
    if (filter === 'without_business') return user.businesses.length === 0;
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Nom', 'Prénom', 'Date inscription', 'Nb Business', 'Noms Business', 'Statuts'];
    const rows = filteredUsers.map(user => [
      user.last_name || '',
      user.first_name || '',
      format(new Date(user.created_at), 'dd/MM/yyyy', { locale: fr }),
      user.businesses.length.toString(),
      user.businesses.map(b => b.business_name).join('; '),
      user.businesses.map(b => {
        if (!b.is_active) return 'En attente';
        if (!b.is_verified) return 'Non vérifié';
        return 'Vérifié';
      }).join('; '),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `utilisateurs_business_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getBusinessStatusBadge = (business: UserWithBusiness['businesses'][0]) => {
    if (!business.is_active) {
      return <Badge variant="outline" className="text-orange-600 border-orange-300">En attente</Badge>;
    }
    if (!business.is_verified) {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Non vérifié</Badge>;
    }
    return <Badge variant="outline" className="text-green-600 border-green-300">Vérifié</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Utilisateurs et leurs comptes business
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV}
            className="w-fit"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un utilisateur ou business..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les utilisateurs</SelectItem>
              <SelectItem value="with_business">Avec business</SelectItem>
              <SelectItem value="without_business">Sans business</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          {filteredUsers.length} utilisateur(s) trouvé(s)
        </p>

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Inscrit le</TableHead>
                <TableHead>Compte Business</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Aucun utilisateur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {user.businesses.length > 0 ? (
                            <Store className="h-4 w-4 text-primary" />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.first_name || user.last_name 
                              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                              : 'Utilisateur'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      {user.businesses.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : user.businesses.length === 1 ? (
                        <span className="font-medium">{user.businesses[0].business_name}</span>
                      ) : (
                        <div className="space-y-1">
                          {user.businesses.map((b, i) => (
                            <p key={b.id} className="text-sm">
                              {b.business_name}
                            </p>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.businesses.length === 0 ? (
                        <Badge variant="secondary">
                          <User className="h-3 w-3 mr-1" />
                          Client
                        </Badge>
                      ) : (
                        <div className="space-y-1">
                          {user.businesses.map((b) => (
                            <div key={b.id}>
                              {getBusinessStatusBadge(b)}
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
