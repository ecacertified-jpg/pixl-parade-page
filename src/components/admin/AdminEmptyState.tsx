import { ReactNode } from 'react';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { EmptyState } from '@/components/ui/empty-state';
import { LucideIcon, Globe, MapPin } from 'lucide-react';

interface AdminEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  showCountryHint?: boolean;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  children?: ReactNode;
}

export function AdminEmptyState({
  icon,
  title,
  description,
  showCountryHint = true,
  actionLabel,
  actionIcon,
  onAction,
  children
}: AdminEmptyStateProps) {
  const { selectedCountry, accessibleCountries, isRestricted } = useAdminCountry();
  
  // Find the selected country details
  const country = accessibleCountries.find(c => c.code === selectedCountry);
  
  // Build contextual description
  let contextualDescription = description;
  
  if (showCountryHint && selectedCountry && country) {
    const countryLabel = `${country.flag} ${country.name}`;
    contextualDescription = description 
      ? `${description} (${countryLabel})`
      : `Aucune donnée trouvée pour ${countryLabel}`;
  } else if (showCountryHint && !selectedCountry && !isRestricted) {
    contextualDescription = description || 'Aucune donnée trouvée sur l\'ensemble des pays';
  }

  // Build encouragement message
  let encouragement: string | undefined;
  if (showCountryHint && selectedCountry) {
    encouragement = 'Essayez de changer le filtre pays dans le menu latéral';
  }

  return (
    <EmptyState
      icon={icon}
      title={title}
      description={contextualDescription}
      encouragement={encouragement}
      actionLabel={actionLabel}
      actionIcon={actionIcon}
      onAction={onAction}
      showDecorations={false}
      size="md"
      decorationTopIcon={Globe}
      decorationBottomIcon={MapPin}
    >
      {children}
    </EmptyState>
  );
}
