import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Search, RefreshCw, Gift, CheckCircle, Clock, XCircle, DollarSign } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ExportButton } from '@/components/admin/ExportButton';
import { exportToCSV, ExportColumn } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { getCountryConfig, isValidCountryCode } from '@/config/countries';

interface Fund {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  status: string;
  occasion: string | null;
  created_at: string;
  deadline_date: string | null;
  creator_id: string;
  beneficiary_name: string | null;
  contributors_count: number;
}

type StatusFilter = 'all' | 'active' | 'target_reached' | 'expired' | 'cancelled';
type OccasionFilter = string;

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  target_reached: { label: 'Complétée', variant: 'secondary' },
  completed: { label: 'Complétée', variant: 'secondary' },
  expired: { label: 'Expirée', variant: 'destructive' },
  cancelled: { label: 'Annulée', variant: 'outline' },
};

const OCCASIONS = [
  { value: 'all', label: 'Toutes' },
  { value: 'anniversaire', label: 'Anniversaire' },
  { value: 'mariage', label: 'Mariage' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'naissance', label: 'Naissance' },
  { value: 'diplome', label: 'Diplôme' },
  { value: 'autre', label: 'Autre' },
];

const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString('fr-FR');
};

export default function CountryFundsPage() {
  const { countryCode } = useParams<{ countryCode: string }>();
  const navigate = useNavigate();

  const country = countryCode && isValidCountryCode(countryCode) ? getCountryConfig(countryCode) : null;

  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [occasionFilter, setOccasionFilter] = useState<OccasionFilter>('all');

  useEffect(() => {
    fetchFunds();
  }, [countryCode]);

  const fetchFunds = async () => {
    if (!countryCode) return;
    try {
      setLoading(true);

      // Fetch funds with beneficiary contact name
      const { data: fundsData, error } = await supabase
        .from('collective_funds')
        .select('id, title, target_amount, current_amount, currency, status, occasion, created_at, deadline_date, creator_id, beneficiary_contact_id, contacts!beneficiary_contact_id(name)')
        .eq('country_code', countryCode)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get contributor counts
      const fundIds = (fundsData || []).map(f => f.id);
      let contributorCounts: Record<string, number> = {};

      if (fundIds.length > 0) {
        const { data: contributions } = await supabase
          .from('fund_contributions')
          .select('fund_id')
          .in('fund_id', fundIds);

        if (contributions) {
          contributorCounts = contributions.reduce((acc, c) => {
            acc[c.fund_id] = (acc[c.fund_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        }
      }

      const transformed: Fund[] = (fundsData || []).map((f: any) => ({
        id: f.id,
        title: f.title,
        target_amount: f.target_amount,
        current_amount: f.current_amount || 0,
        currency: f.currency || 'XOF',
        status: f.status,
        occasion: f.occasion,
        created_at: f.created_at,
        deadline_date: f.deadline_date,
        creator_id: f.creator_id,
        beneficiary_name: f.contacts?.name || null,
        contributors_count: contributorCounts[f.id] || 0,
      }));

      setFunds(transformed);
    } catch (error) {
      console.error('Error fetching funds:', error);
      toast.error('Erreur lors du chargement des cagnottes');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = funds.length;
    const active = funds.filter(f => f.status === 'active').length;
    const completed = funds.filter(f => f.status === 'target_reached' || f.status === 'completed').length;
    const expired = funds.filter(f => f.status === 'expired').length;
    const totalCollected = funds.reduce((sum, f) => sum + f.current_amount, 0);
    return { total, active, completed, expired, totalCollected };
  }, [funds]);

  const filteredFunds = useMemo(() => {
    return funds.filter(fund => {
      const query = searchQuery.toLowerCase();
      if (query) {
        const titleMatch = fund.title.toLowerCase().includes(query);
        const beneficiaryMatch = fund.beneficiary_name?.toLowerCase().includes(query);
        if (!titleMatch && !beneficiaryMatch) return false;
      }
      if (statusFilter !== 'all') {
        if (statusFilter === 'target_reached' && fund.status !== 'target_reached' && fund.status !== 'completed') return false;
        if (statusFilter !== 'target_reached' && fund.status !== statusFilter) return false;
      }
      if (occasionFilter !== 'all' && fund.occasion !== occasionFilter) return false;
      return true;
    });
  }, [funds, searchQuery, statusFilter, occasionFilter]);

  const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR');

  const handleExportCSV = () => {
    const columns: ExportColumn<Fund>[] = [
      { key: 'title', header: 'Titre' },
      { key: 'beneficiary_name', header: 'Bénéficiaire', format: (v) => (v as string) || 'Non spécifié' },
      { key: 'current_amount', header: 'Montant actuel', format: (v) => `${v}` },
      { key: 'target_amount', header: 'Montant cible', format: (v) => `${v}` },
      { key: 'contributors_count', header: 'Contributeurs' },
      { key: 'occasion', header: 'Occasion', format: (v) => (v as string) || '-' },
      { key: 'status', header: 'Statut', format: (v) => STATUS_CONFIG[v as string]?.label || (v as string) },
      { key: 'created_at', header: 'Date création', format: (v) => formatDate(v as string) },
    ];
    exportToCSV(filteredFunds, columns, `cagnottes-${countryCode}`);
    toast.success(`${filteredFunds.length} cagnottes exportées`);
  };

  if (!country) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-muted-foreground">Pays non trouvé</p>
          <Button onClick={() => navigate('/admin/countries')}>Retour</Button>
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Chargement des cagnottes...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <AdminPageHeader
          title={`${country.flag} Cagnottes - ${country.name}`}
          description={`${stats.total} cagnotte(s) au total`}
          backPath={`/admin/countries/${countryCode}`}
          showCountryIndicator={false}
          actions={
            <Button variant="outline" onClick={fetchFunds}>
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
          }
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'all' ? 'ring-2 ring-primary' : ''}`} onClick={() => setStatusFilter('all')}>
            <CardContent className="pt-4 pb-3 text-center">
              <Gift className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'active' ? 'ring-2 ring-primary' : ''}`} onClick={() => setStatusFilter('active')}>
            <CardContent className="pt-4 pb-3 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Actives</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'target_reached' ? 'ring-2 ring-primary' : ''}`} onClick={() => setStatusFilter('target_reached')}>
            <CardContent className="pt-4 pb-3 text-center">
              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Complétées</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'expired' ? 'ring-2 ring-primary' : ''}`} onClick={() => setStatusFilter('expired')}>
            <CardContent className="pt-4 pb-3 text-center">
              <XCircle className="h-5 w-5 mx-auto mb-1 text-red-500" />
              <p className="text-2xl font-bold">{stats.expired}</p>
              <p className="text-xs text-muted-foreground">Expirées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <DollarSign className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{formatCurrency(stats.totalCollected)}</p>
              <p className="text-xs text-muted-foreground">FCFA collectés</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par titre ou bénéficiaire..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={occasionFilter} onValueChange={(v) => setOccasionFilter(v)}>
                <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Occasion" /></SelectTrigger>
                <SelectContent>
                  {OCCASIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ExportButton onExportCSV={handleExportCSV} disabled={filteredFunds.length === 0} />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Bénéficiaire</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead className="text-center">Contributeurs</TableHead>
                    <TableHead>Occasion</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créée le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFunds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Aucune cagnotte trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFunds.map(fund => {
                      const progress = fund.target_amount > 0
                        ? Math.min(100, Math.round((fund.current_amount / fund.target_amount) * 100))
                        : 0;
                      const statusCfg = STATUS_CONFIG[fund.status] || { label: fund.status, variant: 'outline' as const };

                      return (
                        <TableRow key={fund.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">{fund.title}</TableCell>
                          <TableCell className="text-muted-foreground">{fund.beneficiary_name || 'Non spécifié'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[140px]">
                              <Progress value={progress} className="h-2 flex-1" />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatCurrency(fund.current_amount)} / {formatCurrency(fund.target_amount)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{fund.contributors_count}</TableCell>
                          <TableCell className="capitalize">{fund.occasion || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(fund.created_at)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
