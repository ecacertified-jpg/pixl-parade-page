import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export default function AuditLogs() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Logs d'audit</h1>
          <p className="text-muted-foreground mt-2">
            Historique complet des actions administratives
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Journaux d'activité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Les logs détaillés des actions admin, connexions, modifications et accès
              seront affichés ici avec filtres par date, utilisateur et type d'action.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
