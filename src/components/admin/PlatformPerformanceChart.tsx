import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlatformBreakdown } from '@/hooks/useShareAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface PlatformPerformanceChartProps {
  data: PlatformBreakdown[];
  loading: boolean;
}

const platformLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  twitter: 'Twitter/X',
  copy_link: 'Lien copié',
  native: 'Natif',
  sms: 'SMS',
  email: 'Email',
  instagram: 'Instagram',
  telegram: 'Telegram',
  unknown: 'Autre'
};

const platformColors: Record<string, string> = {
  whatsapp: '#25D366',
  facebook: '#1877F2',
  twitter: '#1DA1F2',
  copy_link: '#6B7280',
  native: '#8B5CF6',
  sms: '#F59E0B',
  email: '#EF4444',
  instagram: '#E4405F',
  telegram: '#0088CC',
  unknown: '#9CA3AF'
};

export function PlatformPerformanceChart({ data, loading }: PlatformPerformanceChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    name: platformLabels[item.platform] || item.platform,
    platform: item.platform,
    Partages: item.shares,
    Clics: item.clicks,
    Conversions: item.conversions,
    'Taux (%)': item.conversionRate
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-primary">Partages: {item.Partages}</p>
            <p className="text-blue-600">Clics: {item.Clics}</p>
            <p className="text-green-600">Conversions: {item.Conversions}</p>
            <p className="text-muted-foreground">
              Taux: {item['Taux (%)'].toFixed(1)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Performance par Plateforme
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Aucune donnée de partage disponible
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="Partages" 
                fill="hsl(var(--primary))" 
                radius={[0, 4, 4, 0]}
              />
              <Bar 
                dataKey="Clics" 
                fill="#3B82F6" 
                radius={[0, 4, 4, 0]}
              />
              <Bar 
                dataKey="Conversions" 
                fill="#22C55E" 
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
