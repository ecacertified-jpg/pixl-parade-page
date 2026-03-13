import { Cake } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminBirthdaysContent } from '@/components/admin/AdminBirthdaysContent';

export default function AdminBirthdays() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-poppins flex items-center gap-2">
            <Cake className="h-6 w-6 text-primary" />
            Anniversaires
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vue d'ensemble des anniversaires à venir
          </p>
        </div>
        <AdminBirthdaysContent />
      </div>
    </AdminLayout>
  );
}
