import { Link, useLocation } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useReportNotifications } from '@/hooks/useReportNotifications';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  FileText, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Shield, 
  ClipboardList,
  LogOut,
  Menu,
  Heart,
  TrendingUp,
  Radio,
  Bell,
  UserCircle,
  Copy,
  Trash2,
  UserMinus,
  Activity,
  Globe,
  Target,
  GitCompare,
  Sparkles,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AlertsCenter } from '@/components/admin/AlertsCenter';
import { AdminNotificationsCenter } from '@/components/admin/AdminNotificationsCenter';
import { AdminCountryProvider } from '@/contexts/AdminCountryContext';
import { AdminCountrySelector } from '@/components/admin/AdminCountrySelector';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  title: string;
  href: string;
  icon: any;
  requiresSuperAdmin?: boolean;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'Temps réel', href: '/admin/realtime', icon: Radio },
  { title: 'Alertes KPI', href: '/admin/alerts', icon: Bell },
  { title: 'Notifications', href: '/admin/notifications', icon: Bell },
  { title: 'Utilisateurs', href: '/admin/users', icon: Users },
  { title: 'Corbeille Clients', href: '/admin/deleted-clients', icon: UserMinus, requiresSuperAdmin: true },
  { title: 'Doublons', href: '/admin/duplicates', icon: Copy, requiresSuperAdmin: true },
  { title: 'Complétion Profils', href: '/admin/profile-completion', icon: UserCircle },
  { title: 'Prestataires', href: '/admin/businesses', icon: Store },
  { title: 'Corbeille Business', href: '/admin/deleted-businesses', icon: Trash2, requiresSuperAdmin: true },
  { title: 'Stats Business', href: '/admin/business-analytics', icon: TrendingUp },
  { title: 'Contenu', href: '/admin/content', icon: FileText },
  { title: 'Finances', href: '/admin/finances', icon: DollarSign },
  { title: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { title: 'Stats Partages', href: '/admin/share-analytics', icon: Share2 },
  { title: 'Réciprocité', href: '/admin/reciprocity', icon: Heart },
  { title: 'Paramètres', href: '/admin/settings', icon: Settings, requiresSuperAdmin: true },
  { title: 'Administrateurs', href: '/admin/admins', icon: Shield, requiresSuperAdmin: true },
  { title: 'Performance Admins', href: '/admin/performance', icon: Activity, requiresSuperAdmin: true },
  { title: 'Performance Pays', href: '/admin/countries', icon: Globe },
  { title: 'Comparaison Pays', href: '/admin/countries/comparison', icon: GitCompare },
  { title: 'Objectifs Pays', href: '/admin/countries/objectives', icon: Target },
  { title: 'Prévisions', href: '/admin/forecast', icon: Sparkles },
  { title: 'Logs d\'audit', href: '/admin/audit', icon: ClipboardList },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSuperAdmin, adminRole } = useAdmin();
  const [open, setOpen] = useState(false);
  
  // Activer les notifications en temps réel pour les nouveaux signalements
  useReportNotifications();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.requiresSuperAdmin && !isSuperAdmin) {
      return false;
    }
    return true;
  });

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary">JOIE DE VIVRE</h2>
          <div className="flex items-center gap-1">
            <AdminNotificationsCenter />
            <AlertsCenter />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Panneau d'administration
        </p>
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="px-2 py-1 bg-primary/10 rounded text-xs font-medium text-primary">
            {adminRole === 'super_admin' ? 'Super Admin' : 'Modérateur'}
          </div>
          {isSuperAdmin && <AdminCountrySelector />}
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button 
          variant="outline" 
          className="w-full justify-start" 
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  );

  return (
    <AdminErrorBoundary>
      <AdminCountryProvider>
        <div className="flex h-screen bg-background">
          {/* Sidebar desktop */}
          <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r">
            <NavContent />
          </aside>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden fixed top-4 left-4 z-50">
              <Button variant="outline" size="icon" className="bg-background shadow-md">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <NavContent />
            </SheetContent>
          </Sheet>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 lg:p-8 pt-16 lg:pt-8">
              {children}
            </div>
          </main>
        </div>
      </AdminCountryProvider>
    </AdminErrorBoundary>
  );
};