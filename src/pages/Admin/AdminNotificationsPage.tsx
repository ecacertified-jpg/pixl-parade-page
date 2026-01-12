import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { AdminNotificationItem } from '@/components/admin/AdminNotificationItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  CheckCheck, 
  Archive, 
  RefreshCw, 
  Search,
  User,
  Store,
  ShoppingBag,
  AlertCircle,
  Filter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const typeLabels: Record<string, { label: string; icon: any }> = {
  all: { label: 'Toutes', icon: Bell },
  new_client: { label: 'Nouveaux clients', icon: User },
  new_business: { label: 'Nouveaux prestataires', icon: Store },
  new_order: { label: 'Nouvelles commandes', icon: ShoppingBag },
  refund_request: { label: 'Remboursements', icon: AlertCircle },
};

export default function AdminNotificationsPage() {
  const {
    notifications,
    loading,
    unreadCount,
    criticalCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAll,
    refreshNotifications,
  } = useAdminNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch = 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || n.type === typeFilter;
    const matchesSeverity = severityFilter === 'all' || n.severity === severityFilter;
    return matchesSearch && matchesType && matchesSeverity;
  });

  const unreadNotifications = filteredNotifications.filter((n) => !n.is_read);
  const readNotifications = filteredNotifications.filter((n) => n.is_read);

  // Stats by type
  const statsByType = Object.keys(typeLabels).reduce((acc, type) => {
    if (type === 'all') return acc;
    acc[type] = notifications.filter((n) => n.type === type && !n.is_read).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Centre de Notifications</h1>
            <p className="text-muted-foreground">
              Gérez les alertes et notifications de la plateforme
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshNotifications}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Tout marquer lu
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={dismissAll}>
                <Archive className="h-4 w-4 mr-2" />
                Tout archiver
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                  <p className="text-xs text-muted-foreground">Non lues</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {Object.entries(statsByType).map(([type, count]) => {
            const config = typeLabels[type];
            const Icon = config.icon;
            return (
              <Card key={type}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground truncate">{config.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une notification..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sévérité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes sévérités</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="info">Information</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Tabs defaultValue="unread" className="space-y-4">
          <TabsList>
            <TabsTrigger value="unread" className="gap-2">
              Non lues
              {unreadNotifications.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {unreadNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="read" className="gap-2">
              Lues
              {readNotifications.length > 0 && (
                <Badge variant="outline" className="ml-1">
                  {readNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">Toutes</TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="unread" className="space-y-3">
                {unreadNotifications.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <CheckCheck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">Aucune notification non lue</p>
                    </CardContent>
                  </Card>
                ) : (
                  unreadNotifications.map((notification) => (
                    <AdminNotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDismiss={dismissNotification}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="read" className="space-y-3">
                {readNotifications.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">Aucune notification lue</p>
                    </CardContent>
                  </Card>
                ) : (
                  readNotifications.map((notification) => (
                    <AdminNotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDismiss={dismissNotification}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="all" className="space-y-3">
                {filteredNotifications.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">
                        {searchQuery || typeFilter !== 'all' || severityFilter !== 'all'
                          ? 'Aucune notification correspondant aux filtres'
                          : 'Aucune notification'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredNotifications.map((notification) => (
                    <AdminNotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDismiss={dismissNotification}
                    />
                  ))
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
