import { useState, useMemo, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAllAlerts, UnifiedAlert } from '@/hooks/useAllAlerts';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { CountryFilterIndicator } from '@/components/admin/CountryFilterIndicator';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Bell, 
  CheckCheck, 
  X, 
  Download, 
  Search, 
  TrendingUp,
  TrendingDown,
  Target,
  Flame,
  AlertTriangle,
  Store,
  RefreshCw,
  ArrowUpCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const alertTypeLabels: Record<string, string> = {
  milestone: 'Milestone',
  growth_spike: 'Croissance',
  daily_record: 'Record',
  decline: 'Baisse',
  revenue_drop: 'Baisse revenus',
  inactivity: 'Inactivité',
  rating_drop: 'Baisse note',
  order_drop: 'Baisse commandes',
  objective_not_met: 'Objectif non atteint',
  objective_critical: 'Objectif critique',
};

const metricLabels: Record<string, string> = {
  users: 'Utilisateurs',
  businesses: 'Entreprises',
  revenue: 'Revenus',
  orders: 'Commandes',
  contributions: 'Contributions',
  rating: 'Note',
  conversion_rate: 'Taux conversion',
};

const alertIcons: Record<string, React.ReactNode> = {
  milestone: <Target className="h-4 w-4" />,
  growth_spike: <TrendingUp className="h-4 w-4" />,
  daily_record: <Flame className="h-4 w-4" />,
  decline: <TrendingDown className="h-4 w-4" />,
  revenue_drop: <TrendingDown className="h-4 w-4" />,
  inactivity: <AlertTriangle className="h-4 w-4" />,
  rating_drop: <AlertTriangle className="h-4 w-4" />,
  objective_not_met: <Target className="h-4 w-4" />,
  objective_critical: <AlertTriangle className="h-4 w-4" />,
};

const severityColors: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  warning: 'bg-amber-500 text-white',
  info: 'bg-blue-500 text-white',
};

const COUNTRY_FLAGS: Record<string, string> = {
  CI: '🇨🇮',
  SN: '🇸🇳',
  BJ: '🇧🇯',
  ML: '🇲🇱',
  BF: '🇧🇫',
  TG: '🇹🇬',
};

function EscalationBadge({ alert }: { alert: UnifiedAlert }) {
  if (alert.escalation_count === 0) return null;

  const escalationHistory = (alert.metadata as any)?.escalation_history || [];
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="ml-1 gap-1 border-orange-300 text-orange-600 bg-orange-50 dark:bg-orange-950/30">
            <ArrowUpCircle className="h-3 w-3" />
            {alert.escalation_count}x
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">Escaladée {alert.escalation_count} fois</p>
            {alert.original_severity && (
              <p className="text-xs text-muted-foreground">
                Sévérité initiale : {alert.original_severity}
              </p>
            )}
            {alert.last_escalated_at && (
              <p className="text-xs text-muted-foreground">
                Dernière escalade : {formatDistanceToNow(new Date(alert.last_escalated_at), { addSuffix: true, locale: fr })}
              </p>
            )}
            {escalationHistory.length > 0 && (
              <div className="mt-2 pt-2 border-t text-xs">
                <p className="font-medium mb-1">Historique :</p>
                {escalationHistory.slice(-3).map((h: any, i: number) => (
                  <p key={i} className="text-muted-foreground">
                    {h.from} → {h.to} ({format(new Date(h.at), 'dd/MM HH:mm')})
                  </p>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function AlertsHistory() {
  const { alerts, loading, unreadCount, criticalCount, escalatedCount, objectiveAlertCount, markAsRead, dismissAlert } = useAllAlerts();
  const { selectedCountry, accessibleCountries, isRestricted } = useAdminCountry();
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [metricFilter, setMetricFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sync country filter with AdminCountryContext
  useEffect(() => {
    if (selectedCountry) {
      setCountryFilter(selectedCountry);
    } else if (!isRestricted) {
      setCountryFilter('all');
    }
  }, [selectedCountry, isRestricted]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // Search filter
      if (search && !alert.message.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'all' && alert.alert_type !== typeFilter) {
        return false;
      }
      // Metric filter
      if (metricFilter !== 'all' && alert.metric_type !== metricFilter) {
        return false;
      }
      // Country filter (for objective alerts)
      if (countryFilter !== 'all' && alert.country_code !== countryFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === 'unread' && alert.is_read) return false;
      if (statusFilter === 'read' && !alert.is_read) return false;
      if (statusFilter === 'dismissed' && !alert.is_dismissed) return false;
      if (statusFilter === 'escalated' && alert.escalation_count === 0) return false;
      if (statusFilter === 'objective' && alert.type !== 'objective') return false;
      if (statusFilter !== 'dismissed' && alert.is_dismissed) return false;
      
      return true;
    });
  }, [alerts, search, typeFilter, metricFilter, statusFilter, countryFilter]);

  const toggleSelect = (alertId: string, type: string) => {
    const key = `${type}-${alertId}`;
    const newSelected = new Set(selectedIds);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredAlerts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAlerts.map(a => `${a.type}-${a.id}`)));
    }
  };

  const handleBulkMarkRead = async () => {
    for (const key of selectedIds) {
      const [type, ...idParts] = key.split('-');
      const id = idParts.join('-');
      await markAsRead(id, type as 'growth' | 'business' | 'objective');
    }
    setSelectedIds(new Set());
  };

  const handleBulkDismiss = async () => {
    for (const key of selectedIds) {
      const [type, ...idParts] = key.split('-');
      const id = idParts.join('-');
      await dismissAlert(id, type as 'growth' | 'business' | 'objective');
    }
    setSelectedIds(new Set());
  };

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Source', 'Métrique', 'Message', 'Valeur', 'Variation', 'Sévérité', 'Escalades', 'Statut'];
    const rows = filteredAlerts.map(alert => [
      format(new Date(alert.triggered_at), 'dd/MM/yyyy HH:mm'),
      alertTypeLabels[alert.alert_type] || alert.alert_type,
      alert.type === 'growth' ? 'Plateforme' : 'Business',
      metricLabels[alert.metric_type] || alert.metric_type,
      alert.message,
      alert.current_value?.toString() || '',
      alert.growth_percentage ? `${alert.growth_percentage}%` : '',
      alert.severity,
      alert.escalation_count.toString(),
      alert.is_read ? 'Lu' : 'Non lu',
    ]);

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `alertes-kpi-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              Historique des Alertes
            </h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount} non lue(s) • {criticalCount} critique(s) • {escalatedCount} escaladée(s) • {alerts.length} total
            </p>
            <CountryFilterIndicator className="mt-2" />
          </div>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{alerts.length}</div>
              <p className="text-sm text-muted-foreground">Total alertes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-primary">{unreadCount}</div>
              <p className="text-sm text-muted-foreground">Non lues</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
              <p className="text-sm text-muted-foreground">Critiques</p>
            </CardContent>
          </Card>
          <Card className="border-orange-200 dark:border-orange-800">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5" />
                {escalatedCount}
              </div>
              <p className="text-sm text-muted-foreground">Escaladées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">
                {alerts.filter(a => a.alert_type === 'growth_spike' || a.alert_type === 'milestone').length}
              </div>
              <p className="text-sm text-muted-foreground">Positives</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="growth_spike">Croissance</SelectItem>
                  <SelectItem value="daily_record">Record</SelectItem>
                  <SelectItem value="decline">Baisse</SelectItem>
                  <SelectItem value="objective_not_met">Objectif non atteint</SelectItem>
                  <SelectItem value="objective_critical">Objectif critique</SelectItem>
                </SelectContent>
              </Select>

              <Select value={metricFilter} onValueChange={setMetricFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Métrique" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="users">Utilisateurs</SelectItem>
                  <SelectItem value="businesses">Entreprises</SelectItem>
                  <SelectItem value="revenue">Revenus</SelectItem>
                  <SelectItem value="orders">Commandes</SelectItem>
                  <SelectItem value="contributions">Contributions</SelectItem>
                </SelectContent>
              </Select>

              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous pays</SelectItem>
                  <SelectItem value="CI">🇨🇮 Côte d'Ivoire</SelectItem>
                  <SelectItem value="SN">🇸🇳 Sénégal</SelectItem>
                  <SelectItem value="BJ">🇧🇯 Bénin</SelectItem>
                  <SelectItem value="ML">🇲🇱 Mali</SelectItem>
                  <SelectItem value="BF">🇧🇫 Burkina Faso</SelectItem>
                  <SelectItem value="TG">🇹🇬 Togo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Actives</SelectItem>
                  <SelectItem value="unread">Non lues</SelectItem>
                  <SelectItem value="read">Lues</SelectItem>
                  <SelectItem value="escalated">Escaladées</SelectItem>
                  <SelectItem value="objective">Objectifs</SelectItem>
                  <SelectItem value="dismissed">Masquées</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk actions */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 mt-4 p-2 bg-muted rounded-lg">
                <span className="text-sm font-medium">{selectedIds.size} sélectionnée(s)</span>
                <Button size="sm" variant="outline" onClick={handleBulkMarkRead}>
                  <CheckCheck className="mr-1 h-3 w-3" />
                  Marquer lues
                </Button>
                <Button size="sm" variant="outline" onClick={handleBulkDismiss}>
                  <X className="mr-1 h-3 w-3" />
                  Masquer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Aucune alerte trouvée</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedIds.size === filteredAlerts.length && filteredAlerts.length > 0}
                        onCheckedChange={selectAll}
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="text-right">Valeur</TableHead>
                    <TableHead className="text-right">Variation</TableHead>
                    <TableHead>Sévérité</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow 
                      key={`${alert.type}-${alert.id}`}
                      className={cn(
                        !alert.is_read && 'bg-primary/5',
                        alert.escalation_count > 0 && !alert.is_read && 'bg-orange-50 dark:bg-orange-950/20'
                      )}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(`${alert.type}-${alert.id}`)}
                          onCheckedChange={() => toggleSelect(alert.id, alert.type)}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1">
                          {format(new Date(alert.triggered_at), 'dd/MM/yy HH:mm', { locale: fr })}
                          {alert.escalation_count > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Clock className="h-3 w-3 text-orange-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Non traitée depuis {formatDistanceToNow(new Date(alert.triggered_at), { locale: fr })}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            alert.alert_type === 'decline' || alert.alert_type === 'revenue_drop' 
                              ? 'text-destructive' 
                              : 'text-primary'
                          )}>
                            {alertIcons[alert.alert_type] || <Bell className="h-4 w-4" />}
                          </span>
                          <span className="text-sm">{alertTypeLabels[alert.alert_type] || alert.alert_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {alert.type === 'business' ? (
                            <><Store className="h-3 w-3 mr-1" />Business</>
                          ) : alert.type === 'objective' ? (
                            <><Target className="h-3 w-3 mr-1" />{COUNTRY_FLAGS[alert.country_code || ''] || ''} Objectif</>
                          ) : (
                            'Plateforme'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="truncate text-sm">{alert.message}</p>
                        {alert.business_name && (
                          <p className="text-xs text-muted-foreground truncate">{alert.business_name}</p>
                        )}
                        {alert.country_code && (
                          <p className="text-xs text-muted-foreground">{COUNTRY_FLAGS[alert.country_code]}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {alert.current_value?.toLocaleString('fr-FR') || '-'}
                      </TableCell>
                      <TableCell className={cn(
                        'text-right font-mono text-sm',
                        (alert.growth_percentage || 0) >= 0 ? 'text-green-600' : 'text-destructive'
                      )}>
                        {alert.growth_percentage !== null ? (
                          `${alert.growth_percentage >= 0 ? '+' : ''}${alert.growth_percentage}%`
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Badge className={cn('text-xs', severityColors[alert.severity])}>
                            {alert.severity}
                          </Badge>
                          <EscalationBadge alert={alert} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!alert.is_read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => markAsRead(alert.id, alert.type)}
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => dismissAlert(alert.id, alert.type)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
