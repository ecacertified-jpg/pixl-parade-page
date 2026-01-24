import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCountryConfig, getCountryCodeByPhonePrefix } from '@/config/countries';
import { cn } from '@/lib/utils';

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export type OtpMethod = 'sms' | 'whatsapp';

interface OtpMethodSelectorProps {
  countryCode: string;
  selectedMethod: OtpMethod | null;
  onSelectMethod: (method: OtpMethod) => void;
  disabled?: boolean;
}

export function OtpMethodSelector({ 
  countryCode, 
  selectedMethod,
  onSelectMethod, 
  disabled = false 
}: OtpMethodSelectorProps) {
  // Convertir le préfixe téléphonique (+229) en code pays ISO (BJ)
  const isoCode = getCountryCodeByPhonePrefix(countryCode);
  const country = getCountryConfig(isoCode);
  
  // If SMS is reliable for this country, don't show the selector
  if (country?.smsReliability === 'reliable') {
    return null;
  }

  const smsUnavailable = country?.smsReliability === 'unavailable';
  const smsUnreliable = country?.smsReliability === 'unreliable';

  return (
    <div className="space-y-3 p-4 bg-secondary/50 rounded-xl border border-border/50">
      <p className="text-sm font-medium text-foreground">
        Comment souhaitez-vous recevoir votre code ?
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant={selectedMethod === 'sms' ? 'default' : 'outline'}
          onClick={() => onSelectMethod('sms')}
          disabled={disabled || smsUnavailable}
          className={cn(
            "flex flex-col h-auto py-3 gap-1",
            selectedMethod === 'sms' && "ring-2 ring-primary ring-offset-2",
            smsUnavailable && "opacity-50 cursor-not-allowed"
          )}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-sm font-medium">SMS</span>
          {smsUnreliable && (
            <span className="text-xs text-muted-foreground">(peut être lent)</span>
          )}
          {smsUnavailable && (
            <span className="text-xs text-destructive">(non disponible)</span>
          )}
        </Button>
        
        <Button
          type="button"
          variant={selectedMethod === 'whatsapp' ? 'default' : 'outline'}
          onClick={() => onSelectMethod('whatsapp')}
          disabled={disabled}
          className={cn(
            "flex flex-col h-auto py-3 gap-1 border-primary/50 hover:border-primary",
            selectedMethod === 'whatsapp' && "ring-2 ring-primary ring-offset-2 bg-primary hover:bg-primary/90"
          )}
        >
          <WhatsAppIcon className="h-5 w-5" />
          <span className="text-sm font-medium">WhatsApp</span>
          <span className="text-xs text-muted-foreground">(recommandé)</span>
        </Button>
      </div>

      {smsUnavailable && (
        <p className="text-xs text-muted-foreground text-center">
          Les SMS ne sont pas disponibles pour votre pays. Utilisez WhatsApp.
        </p>
      )}
    </div>
  );
}

// Hook to determine if WhatsApp fallback should be shown
export function useWhatsAppFallback(phonePrefix: string): {
  showFallback: boolean;
  defaultMethod: OtpMethod;
  smsAvailable: boolean;
} {
  // Utiliser la fonction centralisée pour convertir le préfixe en code pays
  const countryCode = getCountryCodeByPhonePrefix(phonePrefix);
  const country = getCountryConfig(countryCode);
  
  if (!country) {
    return { showFallback: false, defaultMethod: 'sms', smsAvailable: true };
  }

  const smsAvailable = country.smsReliability !== 'unavailable';
  const showFallback = country.whatsappFallbackEnabled === true;
  
  // Default to WhatsApp if SMS is unavailable
  const defaultMethod: OtpMethod = country.smsReliability === 'unavailable' ? 'whatsapp' : 'sms';
  
  return { showFallback, defaultMethod, smsAvailable };
}
