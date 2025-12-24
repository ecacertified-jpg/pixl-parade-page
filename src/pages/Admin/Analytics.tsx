import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAdminAnalytics, Period } from '@/hooks/useAdminAnalytics';
import { Download, Calendar, TrendingUp, Users, DollarSign, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { MonthlyComparisonTable } from '@/components/admin/MonthlyComparisonTable';
import { MetricsSparklineDashboard } from '@/components/admin/MetricsSparklineDashboard';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#FFBB28', '#FF8042', '#8884D8'];

export default function Analytics() {
  const [period, setPeriod] = useState<Period>('30days');
  const { data, loading, refresh } = useAdminAnalytics(period);
  
  const exportToCSV = () => {
    if (!data) return;
    
    toast.success('Export en cours...');
    
    // Créer le CSV
    const csvContent = [
      ['Type', 'Date', 'Valeur'],
      ...data.usersEvolution.map(item => ['Nouveaux utilisateurs', item.date, item.count]),
      ...data.fundsCreated.map(item => ['Cagnottes créées', item.date, item.count]),
      ...data.amountsCollected.map(item => ['Montants collectés', item.date, item.amount]),
    ].map(row => row.join(',')).join('\n');
    
    // Télécharger
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${period}-${new Date().toISOString()}.csv`;
    a.click();
    
    toast.success('Export terminé');
  };
  
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Statistiques et rapports détaillés
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={(v: Period) => setPeriod(v)}>
              <SelectTrigger className="w-40">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="7days">7 derniers jours</SelectItem>
                <SelectItem value="30days">30 derniers jours</SelectItem>
                <SelectItem value="90days">90 derniers jours</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exporter CSV
            </Button>
          </div>
        </div>
        
        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.totalUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +{data?.usersEvolution.reduce((sum, item) => sum + item.count, 0) || 0} cette période
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cagnottes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.totalFunds || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +{data?.fundsCreated.reduce((sum, item) => sum + item.count, 0) || 0} cette période
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(data?.totalAmount || 0).toLocaleString('fr-FR')} XOF
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +{data?.amountsCollected.reduce((sum, item) => sum + item.amount, 0).toLocaleString('fr-FR') || 0} XOF cette période
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Prestataires Actifs</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.activeBusinesses || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Comptes vérifiés
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Dashboard Sparklines */}
        <Card>
          <CardHeader>
            <CardTitle>📈 Dashboard des métriques</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsSparklineDashboard />
          </CardContent>
        </Card>
        
        {/* Graphique 1 : Évolution des utilisateurs */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.usersEvolution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Nouveaux utilisateurs" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Graphique 2 : Cagnottes créées */}
        <Card>
          <CardHeader>
            <CardTitle>Cagnottes créées</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.fundsCreated || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--secondary))" 
                  name="Cagnottes créées" 
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Graphique 3 : Montants collectés */}
        <Card>
          <CardHeader>
            <CardTitle>Montants collectés (XOF)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data?.amountsCollected || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#FFBB28" 
                  fill="#FFBB28" 
                  fillOpacity={0.6}
                  name="Montant collecté (XOF)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Graphique 4 : Top catégories */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 des catégories de produits</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.topCategories || []}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.category} (${entry.count})`}
                >
                  {(data?.topCategories || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tableau comparatif mensuel */}
        <MonthlyComparisonTable />
      </div>
    </AdminLayout>
  );
}
