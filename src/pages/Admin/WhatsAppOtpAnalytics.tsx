import { AdminLayout } from '@/components/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminCountryRestrictionAlert } from '@/components/admin/AdminCountryRestrictionAlert';
import { WhatsAppOtpDashboard } from '@/components/admin/WhatsAppOtpDashboard';

export default function WhatsAppOtpAnalytics() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Statistiques WhatsApp OTP"
          description="Suivi des codes de vérification envoyés par WhatsApp"
        />
        <AdminCountryRestrictionAlert />
        <WhatsAppOtpDashboard />
      </div>
    </AdminLayout>
  );
}
