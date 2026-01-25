import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { IndexNowDashboard } from '@/components/admin/IndexNowDashboard';
import { IndexNowSubmitButton } from '@/components/admin/IndexNowSubmitButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Rocket } from 'lucide-react';

export default function IndexNowAnalytics() {
  const [days, setDays] = useState(30);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Rocket className="h-6 w-6 text-primary" />
              IndexNow Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Suivi des soumissions d'indexation en temps réel
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 derniers jours</SelectItem>
                <SelectItem value="30">30 derniers jours</SelectItem>
                <SelectItem value="90">90 derniers jours</SelectItem>
              </SelectContent>
            </Select>
            
            <IndexNowSubmitButton />
          </div>
        </div>

        {/* Dashboard */}
        <IndexNowDashboard days={days} />
      </div>
    </AdminLayout>
  );
}
