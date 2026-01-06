import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Download, RefreshCw, UserCircle } from 'lucide-react';
import { useProfileCompletionTrends, Period, Granularity } from '@/hooks/useProfileCompletionTrends';
import { ProfileCompletionKPIs } from '@/components/admin/ProfileCompletionKPIs';
import { CompletionDistributionChart } from '@/components/admin/CompletionDistributionChart';
import { FieldCompletionChart } from '@/components/admin/FieldCompletionChart';
import { CompletionInsights } from '@/components/admin/CompletionInsights';
import { CohortCompletionTable } from '@/components/admin/CohortCompletionTable';
import { ReminderEffectivenessCard } from '@/components/admin/ReminderEffectivenessCard';
import { AverageScoreChart } from '@/components/admin/AverageScoreChart';
import { exportToCSV } from '@/utils/exportUtils';
import { Loader2 } from 'lucide-react';

export default function ProfileCompletionDashboard() {
  const [period, setPeriod] = useState<Period>('30d');
  const [granularity, setGranularity] = useState<Granularity>('day');

  const {
    profiles,
    currentStats,
    fieldRates,
    timeSeriesData,
    comparison,
    cohortData,
    reminderStats,
    isLoading,
    error,
  } = useProfileCompletionTrends(period, granularity);

  const handleExportCSV = () => {
    if (!profiles.length) return;

    const exportData = profiles.map(p => ({
      user_id: p.user_id,
      first_name: p.first_name || '',
      last_name: p.last_name || '',
      phone: p.phone || '',
      city: p.city || '',
      birthday: p.birthday || '',
      avatar: p.avatar_url ? 'Oui' : 'Non',
      bio: p.bio ? 'Oui' : 'Non',
      created_at: p.created_at,
    }));

    exportToCSV(exportData, [
      { key: 'user_id', header: 'ID Utilisateur' },
      { key: 'first_name', header: 'Prénom' },
      { key: 'last_name', header: 'Nom' },
      { key: 'phone', header: 'Téléphone' },
      { key: 'city', header: 'Ville' },
      { key: 'birthday', header: 'Anniversaire' },
      { key: 'avatar', header: 'Avatar' },
      { key: 'bio', header: 'Bio' },
      { key: 'created_at', header: 'Date création' },
    ], 'profils-completion');
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value as Period);
    // Auto-adjust granularity based on period
    if (value === '7d') setGranularity('day');
    else if (value === '30d') setGranularity('day');
    else if (value === '90d') setGranularity('week');
    else if (value === '1y') setGranularity('month');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserCircle className="h-7 w-7 text-primary" />
              Évolution de la Complétion des Profils
            </h1>
            <p className="text-muted-foreground mt-1">
              Analysez les tendances et identifiez les opportunités d'amélioration
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Period selector */}
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 jours</SelectItem>
                <SelectItem value="30d">30 jours</SelectItem>
                <SelectItem value="90d">90 jours</SelectItem>
                <SelectItem value="1y">1 an</SelectItem>
              </SelectContent>
            </Select>

            {/* Granularity selector */}
            <ToggleGroup 
              type="single" 
              value={granularity} 
              onValueChange={(v) => v && setGranularity(v as Granularity)}
              className="border rounded-lg"
            >
              <ToggleGroupItem value="day" size="sm">Jour</ToggleGroupItem>
              <ToggleGroupItem value="week" size="sm">Semaine</ToggleGroupItem>
              <ToggleGroupItem value="month" size="sm">Mois</ToggleGroupItem>
            </ToggleGroup>

            {/* Export button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportCSV}
              disabled={isLoading || !profiles.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-center justify-center h-64 text-destructive">
            <p>Erreur lors du chargement des données</p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            {/* KPI Cards */}
            <ProfileCompletionKPIs 
              stats={currentStats}
              comparison={comparison}
              timeSeriesData={timeSeriesData}
            />

            {/* Charts row */}
            <div className="grid gap-6 lg:grid-cols-2">
              <CompletionDistributionChart data={timeSeriesData} />
              <AverageScoreChart data={timeSeriesData} />
            </div>

            {/* Field completion and insights */}
            <div className="grid gap-6 lg:grid-cols-2">
              <FieldCompletionChart data={fieldRates} />
              <CompletionInsights 
                stats={currentStats}
                fieldRates={fieldRates}
                comparison={comparison}
              />
            </div>

            {/* Cohort and reminder effectiveness */}
            <div className="grid gap-6 lg:grid-cols-2">
              <CohortCompletionTable data={cohortData} />
              <ReminderEffectivenessCard stats={reminderStats} />
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
