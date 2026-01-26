import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useNotificationAnalytics, Period } from '@/hooks/useNotificationAnalytics';
import { NotificationStatsCards } from '@/components/admin/NotificationStatsCards';
import { NotificationTrendsChart } from '@/components/admin/NotificationTrendsChart';
import { NotificationCategoryTable } from '@/components/admin/NotificationCategoryTable';
import { SimplePeriodSelector } from '@/components/admin/SimplePeriodSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Bell, TrendingUp, AlertCircle } from 'lucide-react';

export default function NotificationAnalytics() {
  const [period, setPeriod] = useState<Period>('30days');
  const { stats, loading, error, refresh } = useNotificationAnalytics(period);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <AdminPageHeader
          title="🔔 Performance des Notifications"
          description="Analysez les taux d'ouverture, clics et conversions de vos notifications push"
          showCountryIndicator={false}
          actions={
            <div className="flex items-center gap-3">
              <SimplePeriodSelector value={period} onChange={setPeriod} />
              <Button variant="outline" size="icon" onClick={refresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          }
        />

        {/* Error state */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">Erreur lors du chargement des statistiques</p>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {loading && !stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {/* Stats content */}
        {stats && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <NotificationStatsCards
              totalSent={stats.totalSent}
              totalDelivered={stats.totalDelivered}
              totalOpened={stats.totalOpened}
              totalClicked={stats.totalClicked}
              totalConverted={stats.totalConverted}
              deliveryRate={stats.deliveryRate}
              openRate={stats.openRate}
              clickRate={stats.clickRate}
              conversionRate={stats.conversionRate}
              totalConversionValue={stats.totalConversionValue}
            />

            {/* Trends Chart */}
            <NotificationTrendsChart data={stats.dailyStats} />

            {/* Category Performance */}
            <NotificationCategoryTable categories={stats.byCategory} />

            {/* Insights Card */}
            {stats.totalSent > 0 && (
              <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Insights & Recommandations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {stats.openRate < 20 && (
                      <li className="flex items-start gap-2">
                        <span className="text-destructive">•</span>
                        <span>
                          <strong>Taux d'ouverture faible ({stats.openRate.toFixed(1)}%)</strong> - 
                          Essayez d'améliorer les titres de vos notifications pour les rendre plus attractifs.
                        </span>
                      </li>
                    )}
                    {stats.openRate >= 40 && (
                      <li className="flex items-start gap-2">
                        <span className="text-success">•</span>
                        <span>
                          <strong>Excellent taux d'ouverture ({stats.openRate.toFixed(1)}%)</strong> - 
                          Vos notifications captent bien l'attention des utilisateurs.
                        </span>
                      </li>
                    )}
                    {stats.byCategory.length > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>
                          La catégorie <strong>"{stats.byCategory[0].category}"</strong> est la plus performante 
                          avec {stats.byCategory[0].sent} envois et {stats.byCategory[0].openRate.toFixed(1)}% d'ouverture.
                        </span>
                      </li>
                    )}
                    {stats.conversionRate > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-gratitude">•</span>
                        <span>
                          Vos notifications ont généré <strong>{stats.totalConversionValue.toLocaleString()} XOF</strong> de 
                          valeur avec un taux de conversion de {stats.conversionRate.toFixed(1)}%.
                        </span>
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {stats.totalSent === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune notification envoyée</h3>
                  <p className="text-muted-foreground max-w-md">
                    Les statistiques apparaîtront ici une fois que des notifications push auront été envoyées aux utilisateurs.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
