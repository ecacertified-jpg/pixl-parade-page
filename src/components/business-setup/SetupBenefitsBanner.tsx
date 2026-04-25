import { Sparkles, TrendingUp, Users } from 'lucide-react';
import { useBusinessSocialProof } from '@/hooks/useBusinessSocialProof';
import { useCountry } from '@/contexts/CountryContext';

interface SetupBenefitsBannerProps {
  benefit: string;
}

export const SetupBenefitsBanner = ({ benefit }: SetupBenefitsBannerProps) => {
  const { vendorsInCountry, productsInCountry, loading } = useBusinessSocialProof();
  const { country } = useCountry();

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-secondary/40 to-accent/10 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm font-nunito font-medium text-foreground leading-snug">
          {benefit}
        </p>
      </div>

      {!loading && (vendorsInCountry > 0 || productsInCountry > 0) && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground border-t border-primary/10 pt-2">
          {vendorsInCountry > 0 && (
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-primary" />
              <strong className="text-foreground">{vendorsInCountry}</strong>
              prestataires actifs en {country.name}
            </span>
          )}
          {productsInCountry > 0 && (
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-accent" />
              <strong className="text-foreground">{productsInCountry}</strong>
              produits déjà en ligne
            </span>
          )}
        </div>
      )}
    </div>
  );
};