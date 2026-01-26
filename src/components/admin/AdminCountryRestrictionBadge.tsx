import { Lock, Globe } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function AdminCountryRestrictionBadge() {
  const { isSuperAdmin } = useAdmin();
  const { accessibleCountries, isRestricted } = useAdminCountry();

  if (isSuperAdmin) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
              <Globe className="h-3.5 w-3.5" />
              <span>Global</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Accès à tous les pays</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!isRestricted || accessibleCountries.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
            "bg-accent text-accent-foreground"
          )}>
            <Lock className="h-3.5 w-3.5" />
            <div className="flex items-center gap-1">
              {accessibleCountries.slice(0, 3).map((country) => (
                <span key={country.code} className="text-base">{country.flag}</span>
              ))}
              {accessibleCountries.length > 3 && (
                <span className="text-muted-foreground">+{accessibleCountries.length - 3}</span>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">Accès limité à :</p>
            <div className="flex flex-wrap gap-1">
              {accessibleCountries.map((country) => (
                <span key={country.code} className="flex items-center gap-1 text-sm">
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                </span>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
