import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Package, 
  Search, 
  Eye, 
  Calendar, 
  Store,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAdminOrders, AdminOrder, getOrderStatusLabel, getOrderStatusColor } from '@/hooks/useAdminOrders';
import { AdminOrderDetailsModal } from '@/components/admin/AdminOrderDetailsModal';
import { supabase } from '@/integrations/supabase/client';

interface BusinessOption {
  id: string;
  business_name: string;
}

export default function OrdersManagement() {
  const {
    orders,
    loading,
    stats,
    loadOrders,
    updateOrderStatus,
    cancelOrder,
    refundOrder,
    approveRefund,
    rejectRefund
  } = useAdminOrders();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [businessFilter, setBusinessFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);

  useEffect(() => {
    loadBusinessOptions();
  }, []);

  useEffect(() => {
    const filters = {
      businessId: businessFilter !== 'all' ? businessFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      searchQuery: searchQuery || undefined
    };
    loadOrders(filters);
  }, [statusFilter, businessFilter, searchQuery]);

  const loadBusinessOptions = async () => {
    const { data } = await supabase
      .from('business_accounts')
      .select('id, business_name')
      .eq('is_active', true)
      .order('business_name');
    
    setBusinesses(data || []);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' XOF';
  };

  const handleViewDetails = (order: AdminOrder) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleRefresh = () => {
    loadOrders({
      businessId: businessFilter !== 'all' ? businessFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      searchQuery: searchQuery || undefined
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Gestion des commandes</h1>
            <p className="text-muted-foreground">
              Gérez toutes les commandes de tous les prestataires
            </p>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
                  <p className="text-xs text-muted-foreground">Confirmées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
                  <p className="text-xs text-muted-foreground">Livrées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                  <p className="text-xs text-muted-foreground">Annulées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-lg font-bold text-primary">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par ID, téléphone, adresse..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={businessFilter} onValueChange={setBusinessFilter}>
                <SelectTrigger className="w-[200px]">
                  <Store className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tous les business" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les business</SelectItem>
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.business_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmées</SelectItem>
                  <SelectItem value="processed">Traitées</SelectItem>
                  <SelectItem value="delivered">Livrées</SelectItem>
                  <SelectItem value="receipt_confirmed">Réception confirmée</SelectItem>
                  <SelectItem value="cancelled">Annulées</SelectItem>
                  <SelectItem value="refunded">Remboursées</SelectItem>
                  <SelectItem value="refund_requested">Remb. demandé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Package className="h-12 w-12 mb-2 opacity-50" />
                <p>Aucune commande trouvée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Prestataire</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Paiement</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {order.business_logo ? (
                              <img 
                                src={order.business_logo} 
                                alt="" 
                                className="h-6 w-6 rounded object-cover"
                              />
                            ) : (
                              <Store className="h-6 w-6 text-muted-foreground" />
                            )}
                            <span className="text-sm font-medium truncate max-w-[150px]">
                              {order.business_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(order.created_at), 'dd/MM/yy HH:mm', { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(order.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getOrderStatusColor(order.status)}>
                            {getOrderStatusLabel(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize text-sm">
                          {order.payment_method}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {order.donor_phone}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(order)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AdminOrderDetailsModal
        order={selectedOrder}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onUpdateStatus={updateOrderStatus}
        onCancelOrder={cancelOrder}
        onRefundOrder={refundOrder}
        onApproveRefund={approveRefund}
        onRejectRefund={rejectRefund}
      />
    </AdminLayout>
  );
}
