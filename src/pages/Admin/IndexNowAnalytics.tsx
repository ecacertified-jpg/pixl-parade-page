import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { IndexNowDashboard } from '@/components/admin/IndexNowDashboard';
import { IndexNowSubmitButton } from '@/components/admin/IndexNowSubmitButton';
import { AdminCountryRestrictionAlert } from '@/components/admin/AdminCountryRestrictionAlert';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function IndexNowAnalytics() {
  const [days, setDays] = useState(30);
  const { getCountryFilter } = useAdminCountry();
  const countryFilter = getCountryFilter();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Country Restriction Alert */}
        <AdminCountryRestrictionAlert />

        {/* Header */}
        <AdminPageHeader
          title="🚀 IndexNow Analytics"
          description="Suivi des soumissions d'indexation en temps réel"
          actions={
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
          }
        />

        {/* Dashboard */}
        <IndexNowDashboard days={days} countryCode={countryFilter} />
      </div>
    </AdminLayout>
  );
}
