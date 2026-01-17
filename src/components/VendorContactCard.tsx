import { MapPin, Phone, Mail, Globe, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CountryBadge } from "@/components/CountryBadge";

interface VendorContactCardProps {
  address?: string;
  phone?: string;
  email?: string;
  websiteUrl?: string;
  countryCode?: string;
  onShowMap?: () => void;
}

export function VendorContactCard({
  address,
  phone,
  email,
  websiteUrl,
  countryCode,
  onShowMap,
}: VendorContactCardProps) {
  const hasAnyContact = address || phone || email || websiteUrl;

  if (!hasAnyContact) {
    return null;
  }

  const openNavigation = () => {
    if (address) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
        "_blank"
      );
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-5 w-5 text-primary" />
            Contact & Infos
          </CardTitle>
          {countryCode && <CountryBadge countryCode={countryCode} variant="compact" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Contact Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Address */}
          {address && (
            <div className="col-span-2 flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Adresse</p>
                <p className="text-sm text-foreground line-clamp-2">{address}</p>
              </div>
            </div>
          )}

          {/* Phone */}
          {phone && (
            <a 
              href={`tel:${phone}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-primary/10 transition-colors group"
            >
              <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 transition-colors">
                <Phone className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Téléphone</p>
                <p className="text-sm text-foreground font-medium truncate">{phone}</p>
              </div>
            </a>
          )}

          {/* Email */}
          {email && (
            <a 
              href={`mailto:${email}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-primary/10 transition-colors group"
            >
              <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Email</p>
                <p className="text-sm text-foreground truncate">{email}</p>
              </div>
            </a>
          )}

          {/* Website */}
          {websiteUrl && (
            <a 
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-primary/10 transition-colors group col-span-2"
            >
              <div className="w-9 h-9 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/20 transition-colors">
                <Globe className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Site web</p>
                <p className="text-sm text-foreground truncate">{websiteUrl}</p>
              </div>
            </a>
          )}
        </div>

        {/* Navigation Button */}
        {address && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={openNavigation}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Voir sur la carte
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
