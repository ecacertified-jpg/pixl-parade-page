import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useDuplicateAccountsDashboard, DuplicateGroup } from '@/hooks/useDuplicateAccountsDashboard';
import { DuplicateGroupCard } from '@/components/admin/DuplicateGroupCard';
import { UnifyClientAccountsModal } from '@/components/admin/UnifyClientAccountsModal';
import { UnifyBusinessAccountsModal } from '@/components/admin/UnifyBusinessAccountsModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Search,
  RefreshCw,
  Loader2,
  Copy,
  XCircle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DuplicateAccountsDashboard() {
  const {
    duplicates,
    stats,
    loading,
    scanning,
    filters,
    setFilters,
    fetchDuplicates,
    runScan,
    updateStatus,
  } = useDuplicateAccountsDashboard();

  const [showClientModal, setShowClientModal] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);

  const handleMerge = (group: DuplicateGroup) => {
    setSelectedGroup(group);
    if (group.type === 'client') {
      setShowClientModal(true);
    } else {
      setShowBusinessModal(true);
    }
  };

  const handleDismiss = async (groupId: string) => {
    await updateStatus(groupId, 'dismissed');
  };

  const handleMergeComplete = async () => {
    if (selectedGroup) {
      await updateStatus(selectedGroup.id, 'merged');
    }
    setShowClientModal(false);
    setShowBusinessModal(false);
    setSelectedGroup(null);
  };

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleSearchSubmit = () => {
    fetchDuplicates();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Copy className="h-6 w-6 text-primary" />
              Comptes en double
            </h1>
            <p className="text-muted-foreground mt-1">
              Détection et unification des comptes dupliqués
            </p>
          </div>
          <Button
            onClick={runScan}
            disabled={scanning}
            className="gap-2"
          >
            {scanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {scanning ? 'Scan en cours...' : 'Lancer un scan'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.clientPending}</p>
                  <p className="text-sm text-muted-foreground">Clients en attente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Building2 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.businessPending}</p>
                  <p className="text-sm text-muted-foreground">Prestataires en attente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.highConfidence}</p>
                  <p className="text-sm text-muted-foreground">Haute confiance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.merged}</p>
                  <p className="text-sm text-muted-foreground">Fusionnés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom ou téléphone..."
                    value={filters.search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select
                value={filters.type}
                onValueChange={(value: 'all' | 'client' | 'business') =>
                  setFilters(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="client">Clients</SelectItem>
                  <SelectItem value="business">Prestataires</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.confidence}
                onValueChange={(value: 'all' | 'high' | 'medium' | 'low') =>
                  setFilters(prev => ({ ...prev, confidence: value }))
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Confiance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toute confiance</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.status}
                onValueChange={(value: 'all' | 'pending' | 'merged' | 'dismissed' | 'reviewed') =>
                  setFilters(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="reviewed">Examinés</SelectItem>
                  <SelectItem value="merged">Fusionnés</SelectItem>
                  <SelectItem value="dismissed">Ignorés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Duplicate Groups List */}
        <div className="space-y-4">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : duplicates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-muted">
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium">Aucun doublon détecté</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {filters.status !== 'all' || filters.type !== 'all' || filters.confidence !== 'all'
                        ? 'Aucun résultat avec les filtres actuels'
                        : 'Lancez un scan pour détecter les comptes en double'}
                    </p>
                  </div>
                  {stats.pending === 0 && (
                    <Button onClick={runScan} disabled={scanning}>
                      {scanning ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Lancer un scan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {duplicates.length} groupe{duplicates.length > 1 ? 's' : ''} trouvé{duplicates.length > 1 ? 's' : ''}
                </p>
              </div>
              {duplicates.map((group) => (
                <DuplicateGroupCard
                  key={group.id}
                  group={group}
                  onMerge={handleMerge}
                  onDismiss={handleDismiss}
                  onView={() => {}}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <UnifyClientAccountsModal
        open={showClientModal}
        onOpenChange={(open) => {
          setShowClientModal(open);
          if (!open) setSelectedGroup(null);
        }}
        onMergeComplete={handleMergeComplete}
      />

      <UnifyBusinessAccountsModal
        open={showBusinessModal}
        onOpenChange={(open) => {
          setShowBusinessModal(open);
          if (!open) setSelectedGroup(null);
        }}
        onMergeComplete={handleMergeComplete}
      />
    </AdminLayout>
  );
}
