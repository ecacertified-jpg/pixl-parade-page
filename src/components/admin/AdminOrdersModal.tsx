import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Search, Eye, Calendar, Store } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAdminOrders, AdminOrder, getOrderStatusLabel, getOrderStatusColor } from '@/hooks/useAdminOrders';
import { AdminOrderDetailsModal } from './AdminOrderDetailsModal';

interface AdminOrdersModalProps {
  businessId: string | null;
  businessName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminOrdersModal({
  businessId,
  businessName,
  open,
  onOpenChange
}: AdminOrdersModalProps) {
  const {
    orders,
    loading,
    filters,
    setFilters,
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
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (open && businessId) {
      setFilters({ businessId });
      loadOrders({ businessId });
    }
  }, [open, businessId]);

  useEffect(() => {
    if (open) {
      const newFilters = {
        ...filters,
        businessId: businessId || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        searchQuery: searchQuery || undefined
      };
      loadOrders(newFilters);
    }
  }, [statusFilter, searchQuery]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' XOF';
  };

  const handleViewDetails = (order: AdminOrder) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Commandes - {businessName}
            </DialogTitle>
          </DialogHeader>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div className="bg-muted/50 p-2 rounded-lg text-center">
              <p className="text-lg font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg text-center">
              <p className="text-lg font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">En attente</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg text-center">
              <p className="text-lg font-bold text-green-600">{stats.delivered}</p>
              <p className="text-xs text-muted-foreground">Livrées</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg text-center">
              <p className="text-lg font-bold text-red-600">{stats.cancelled}</p>
              <p className="text-xs text-muted-foreground">Annulées</p>
            </div>
            <div className="bg-primary/10 p-2 rounded-lg text-center">
              <p className="text-lg font-bold text-primary">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">CA</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
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
                <SelectItem value="cancelled">Annulées</SelectItem>
                <SelectItem value="refunded">Remboursées</SelectItem>
                <SelectItem value="refund_requested">Remb. demandé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        #{order.id.slice(0, 8).toUpperCase()}
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
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetails(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  );
}
