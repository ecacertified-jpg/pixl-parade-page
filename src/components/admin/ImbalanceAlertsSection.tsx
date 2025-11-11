import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, XCircle, Eye, TrendingDown, Calendar } from 'lucide-react';
import { useImbalanceAlerts, ImbalanceAlert } from '@/hooks/useImbalanceAlerts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ImbalanceAlertsSection() {
  const [selectedAlert, setSelectedAlert] = useState<ImbalanceAlert | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  const { alerts, isLoading, reviewAlert } = useImbalanceAlerts(activeTab);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '•';
    }
  };

  const handleReviewAlert = async (status: 'reviewed' | 'resolved' | 'dismissed') => {
    if (!selectedAlert) return;

    await reviewAlert.mutateAsync({
      alertId: selectedAlert.id,
      status,
      notes: reviewNotes,
    });

    setSelectedAlert(null);
    setReviewNotes('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Alertes de Déséquilibre de Réciprocité
              </CardTitle>
              <CardDescription className="mt-2">
                Utilisateurs recevant beaucoup de contributions mais n'en faisant jamais
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg">
              {alerts?.filter(a => a.status === 'pending').length || 0} en attente
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">
                En attente ({alerts?.filter(a => a.status === 'pending').length || 0})
              </TabsTrigger>
              <TabsTrigger value="reviewed">
                Examinées ({alerts?.filter(a => a.status === 'reviewed').length || 0})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Résolues ({alerts?.filter(a => a.status === 'resolved').length || 0})
              </TabsTrigger>
              <TabsTrigger value="dismissed">
                Rejetées ({alerts?.filter(a => a.status === 'dismissed').length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {!alerts || alerts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Aucune alerte dans cette catégorie</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={alert.user?.avatar_url || undefined} />
                          <AvatarFallback>
                            {alert.user?.first_name?.[0]}
                            {alert.user?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">
                                {alert.user?.first_name} {alert.user?.last_name}
                              </h4>
                              <Badge variant={getSeverityColor(alert.severity)}>
                                {getSeverityIcon(alert.severity)} {alert.severity}
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAlert(alert)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Détails
                            </Button>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Reçu</p>
                              <p className="font-bold text-green-600">
                                {alert.total_received.toLocaleString()} XOF
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {alert.contributions_received_count} contributions
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Donné</p>
                              <p className="font-bold text-blue-600">
                                {alert.total_contributed.toLocaleString()} XOF
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {alert.contributions_given_count} contributions
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Ratio</p>
                              <p className="font-bold text-destructive flex items-center gap-1">
                                <TrendingDown className="h-4 w-4" />
                                {alert.imbalance_ratio.toFixed(1)}x
                              </p>
                              {alert.days_since_last_contribution && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {alert.days_since_last_contribution}j depuis dernière contrib.
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="bg-muted/50 rounded p-3">
                            <p className="text-sm">
                              <strong>Action recommandée:</strong> {alert.recommended_action}
                            </p>
                          </div>

                          {alert.admin_notes && (
                            <div className="bg-blue-50 dark:bg-blue-950/20 rounded p-3">
                              <p className="text-sm">
                                <strong>Notes admin:</strong> {alert.admin_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Examiner l'alerte de déséquilibre</DialogTitle>
            <DialogDescription>
              Évaluez cette alerte et prenez les mesures appropriées
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 border-b pb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedAlert.user?.avatar_url || undefined} />
                  <AvatarFallback>
                    {selectedAlert.user?.first_name?.[0]}
                    {selectedAlert.user?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedAlert.user?.first_name} {selectedAlert.user?.last_name}
                  </h3>
                  <Badge variant={getSeverityColor(selectedAlert.severity)}>
                    {getSeverityIcon(selectedAlert.severity)} {selectedAlert.severity}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Statistiques</h4>
                  <div className="space-y-1 text-sm">
                    <p>Reçu: <strong>{selectedAlert.total_received.toLocaleString()} XOF</strong></p>
                    <p>Donné: <strong>{selectedAlert.total_contributed.toLocaleString()} XOF</strong></p>
                    <p>Ratio: <strong className="text-destructive">{selectedAlert.imbalance_ratio.toFixed(2)}x</strong></p>
                    <p>Contributions reçues: <strong>{selectedAlert.contributions_received_count}</strong></p>
                    <p>Contributions données: <strong>{selectedAlert.contributions_given_count}</strong></p>
                    {selectedAlert.days_since_last_contribution && (
                      <p>Dernière contribution: <strong>Il y a {selectedAlert.days_since_last_contribution} jours</strong></p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Recommandation</h4>
                  <p className="text-sm bg-muted p-3 rounded">
                    {selectedAlert.recommended_action}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes administratives</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Ajoutez vos notes ici..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedAlert(null)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReviewAlert('dismissed')}
              disabled={reviewAlert.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeter
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleReviewAlert('reviewed')}
              disabled={reviewAlert.isPending}
            >
              <Eye className="h-4 w-4 mr-2" />
              Marquer comme examinée
            </Button>
            <Button
              onClick={() => handleReviewAlert('resolved')}
              disabled={reviewAlert.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Résoudre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}