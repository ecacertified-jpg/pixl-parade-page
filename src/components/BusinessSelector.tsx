import { Store, ChevronDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSelectedBusiness } from "@/hooks/useSelectedBusiness";

export const BusinessSelector = () => {
  const { selectedBusinessId, businesses, loading, selectBusiness } = useSelectedBusiness();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-lg animate-pulse">
        <Store className="h-4 w-4" />
        <span className="text-sm">Chargement...</span>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-lg">
        <Store className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Aucun business</span>
      </div>
    );
  }

  // Si un seul business, afficher sans sélecteur
  if (businesses.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-lg">
        {businesses[0].logo_url ? (
          <img 
            src={businesses[0].logo_url} 
            alt={businesses[0].business_name}
            className="h-4 w-4 rounded-sm object-cover"
          />
        ) : (
          <Store className="h-4 w-4 text-primary" />
        )}
        <span className="text-sm font-medium text-primary">
          {businesses[0].business_name}
        </span>
        {businesses[0].is_active && (
          <Badge variant="secondary" className="h-5 text-xs">Actif</Badge>
        )}
      </div>
    );
  }

  return (
    <Select value={selectedBusinessId || undefined} onValueChange={selectBusiness}>
      <SelectTrigger className="w-auto min-w-[200px] border-primary/20 bg-background/50 hover:bg-background transition-colors">
        <SelectValue placeholder="Sélectionner un business" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {businesses.map(business => (
          <SelectItem 
            key={business.id} 
            value={business.id}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-3 py-1">
              {business.logo_url ? (
                <img 
                  src={business.logo_url} 
                  alt={business.business_name}
                  className="h-6 w-6 rounded-sm object-cover"
                />
              ) : (
                <div className="h-6 w-6 rounded-sm bg-primary/10 flex items-center justify-center">
                  <Store className="h-3 w-3 text-primary" />
                </div>
              )}
              <span className="font-medium text-sm">{business.business_name}</span>
              <div className="flex items-center gap-1 ml-auto">
                {business.is_active && (
                  <Badge variant="secondary" className="h-5 text-xs">Actif</Badge>
                )}
                {selectedBusinessId === business.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
