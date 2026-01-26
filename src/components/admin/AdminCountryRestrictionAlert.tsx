import { useState, useEffect } from 'react';
import { Lock, X, Info } from 'lucide-react';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { useAdmin } from '@/hooks/useAdmin';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'admin_country_restriction_alert_dismissed';

export function AdminCountryRestrictionAlert() {
  const { isRestricted, accessibleCountries } = useAdminCountry();
  const { adminRole } = useAdmin();
  const [dismissed, setDismissed] = useState(true); // Start as dismissed to avoid flash

  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    setDismissed(isDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  // Don't show for super admins or if not restricted
  if (!isRestricted || accessibleCountries.length === 0) {
    return null;
  }

  // Don't show if dismissed
  if (dismissed) {
    return null;
  }

  const roleLabel = adminRole === 'regional_admin' ? 'Admin Régional' : 'Modérateur';

  return (
    <Alert className={cn(
      "relative border-accent bg-accent/10 mb-4",
      "animate-fade-in"
    )}>
      <Info className="h-4 w-4 text-accent-foreground" />
      <AlertDescription className="flex items-center justify-between gap-4 pr-8">
        <div className="flex items-center gap-2 flex-wrap">
          <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm">
            <strong className="font-medium">{roleLabel}</strong> — Vous avez accès aux données de :
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {accessibleCountries.map((country) => (
              <span 
                key={country.code}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-background rounded-md text-sm"
              >
                <span>{country.flag}</span>
                <span>{country.name}</span>
              </span>
            ))}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6 opacity-70 hover:opacity-100"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Masquer</span>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
