import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Filter, User, Calendar } from 'lucide-react';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AuditLogs() {
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('');
  const { logs, loading } = useAuditLogs({
    actionType: actionTypeFilter || undefined,
  });

  const actionTypeLabels: Record<string, string> = {
    approve: 'Approuvé',
    hide: 'Masqué',
    delete: 'Supprimé',
    update: 'Modifié',
    bulk_action: 'Action groupée',
  };

  const actionTypeColors: Record<string, string> = {
    approve: 'bg-green-500/10 text-green-500',
    hide: 'bg-yellow-500/10 text-yellow-500',
    delete: 'bg-red-500/10 text-red-500',
    update: 'bg-blue-500/10 text-blue-500',
    bulk_action: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Logs d'audit</h1>
          <p className="text-muted-foreground mt-2">
            Historique complet des actions de modération effectuées par les administrateurs
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Journaux d'activité
              </CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Type d'action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les actions</SelectItem>
                    <SelectItem value="approve">Approuver</SelectItem>
                    <SelectItem value="hide">Masquer</SelectItem>
                    <SelectItem value="delete">Supprimer</SelectItem>
                    <SelectItem value="update">Modifier</SelectItem>
                    <SelectItem value="bulk_action">Actions groupées</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement des logs...
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun log d'audit trouvé
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => {
                  const adminName = log.admin_user?.profiles 
                    ? `${log.admin_user.profiles.first_name || ''} ${log.admin_user.profiles.last_name || ''}`.trim()
                    : 'Administrateur';
                  
                  return (
                    <div key={log.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={actionTypeColors[log.action_type] || 'bg-gray-500/10 text-gray-500'}>
                            {actionTypeLabels[log.action_type] || log.action_type}
                          </Badge>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{adminName}</span>
                            <span className="text-xs">({log.admin_user?.role || 'admin'})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(log.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm">{log.description}</p>
                      
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer hover:text-foreground">
                            Détails supplémentaires
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                        <span>Type: {log.target_type}</span>
                        {log.target_id && <span>ID: {log.target_id.substring(0, 8)}...</span>}
                        {log.ip_address && <span>IP: {log.ip_address}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
