import { useMemo } from "react";
import { Check, X, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCountry } from "@/contexts/CountryContext";

// Configuration des formats téléphoniques par pays
interface PhoneFormat {
  country: string;
  flag: string;
  name: string;
  length: number;
  pattern: RegExp;
  format: (n: string) => string;
  placeholder: string;
  startsWithZero: boolean;
}

const PHONE_FORMATS: Record<string, PhoneFormat> = {
  "+225": {
    country: "CI",
    flag: "🇨🇮",
    name: "Côte d'Ivoire",
    length: 10,
    pattern: /^0[1-9]\d{8}$/,
    format: (n: string) => n.replace(/(\d{2})(?=\d)/g, "$1 ").trim(),
    placeholder: "07 07 07 07 07",
    startsWithZero: true,
  },
  "+221": {
    country: "SN",
    flag: "🇸🇳",
    name: "Sénégal",
    length: 9,
    pattern: /^7[0-9]\d{7}$/,
    format: (n: string) => {
      const parts = [n.slice(0, 2), n.slice(2, 5), n.slice(5, 7), n.slice(7, 9)];
      return parts.filter(Boolean).join(" ");
    },
    placeholder: "77 123 45 67",
    startsWithZero: false,
  },
  "+229": {
    country: "BJ",
    flag: "🇧🇯",
    name: "Bénin",
    length: 10,
    pattern: /^01[4-9]\d{7}$/,
    format: (n: string) => n.replace(/(\d{2})(?=\d)/g, "$1 ").trim(),
    placeholder: "01 97 12 34 56",
    startsWithZero: true,
  },
  "+237": {
    country: "CM",
    flag: "🇨🇲",
    name: "Cameroun",
    length: 9,
    pattern: /^[6-9]\d{8}$/,
    format: (n: string) => n.replace(/(\d{3})(?=\d)/g, "$1 ").trim(),
    placeholder: "691 234 567",
    startsWithZero: false,
  },
  "+223": {
    country: "ML",
    flag: "🇲🇱",
    name: "Mali",
    length: 8,
    pattern: /^[5-9]\d{7}$/,
    format: (n: string) => n.replace(/(\d{2})(?=\d)/g, "$1 ").trim(),
    placeholder: "76 12 34 56",
    startsWithZero: false,
  },
  "+228": {
    country: "TG",
    flag: "🇹🇬",
    name: "Togo",
    length: 8,
    pattern: /^[9]\d{7}$/,
    format: (n: string) => n.replace(/(\d{2})(?=\d)/g, "$1 ").trim(),
    placeholder: "90 12 34 56",
    startsWithZero: false,
  },
  "+226": {
    country: "BF",
    flag: "🇧🇫",
    name: "Burkina Faso",
    length: 8,
    pattern: /^[5-7]\d{7}$/,
    format: (n: string) => n.replace(/(\d{2})(?=\d)/g, "$1 ").trim(),
    placeholder: "70 12 34 56",
    startsWithZero: false,
  },
};

export interface PhoneData {
  countryCode: string;
  nationalNumber: string;
  fullNumber: string;
  isValid: boolean;
}

interface PhoneInputProps {
  value: PhoneData;
  onChange: (value: PhoneData) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  showValidation?: boolean;
  defaultCountryCode?: string;
  allowedCountries?: string[];
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Fonction utilitaire pour formater un numéro
const formatPhoneNumber = (value: string, countryCode: string): string => {
  const format = PHONE_FORMATS[countryCode];
  if (!format) return value;

  const digits = value.replace(/\D/g, "").slice(0, format.length);
  return format.format(digits);
};

// Fonction utilitaire pour valider un numéro
const validatePhone = (nationalNumber: string, countryCode: string): boolean => {
  const format = PHONE_FORMATS[countryCode];
  if (!format) return false;

  const digits = nationalNumber.replace(/\D/g, "");
  if (digits.length !== format.length) return false;

  return format.pattern.test(digits);
};

// Fonction pour créer un PhoneData initial
export const createPhoneData = (
  countryCode: string = "+225",
  nationalNumber: string = ""
): PhoneData => {
  const digits = nationalNumber.replace(/\D/g, "");
  const isValid = validatePhone(digits, countryCode);
  const formatted = formatPhoneNumber(digits, countryCode);

  return {
    countryCode,
    nationalNumber: digits,
    fullNumber: digits ? `${countryCode} ${formatted}`.trim() : countryCode,
    isValid,
  };
};

// Fonction pour parser un numéro complet existant
export const parseFullPhoneNumber = (fullNumber: string): PhoneData => {
  // Essayer de trouver le préfixe pays
  for (const [code, format] of Object.entries(PHONE_FORMATS)) {
    if (fullNumber.startsWith(code)) {
      const nationalPart = fullNumber.slice(code.length).replace(/\D/g, "");
      return createPhoneData(code, nationalPart);
    }
  }

  // Par défaut, retourner avec +225
  const digits = fullNumber.replace(/\D/g, "");
  return createPhoneData("+225", digits);
};

export function PhoneInput({
  value,
  onChange,
  label = "Numéro de téléphone",
  required = false,
  disabled = false,
  showValidation = true,
  defaultCountryCode,
  allowedCountries,
  className,
  size = "md",
}: PhoneInputProps) {
  const { country } = useCountry();

  // Utiliser le pays du contexte par défaut
  const currentCode = value.countryCode || defaultCountryCode || country.phonePrefix;
  const format = PHONE_FORMATS[currentCode];

  // Filtrer les pays disponibles
  const availableCountries = useMemo(() => {
    if (allowedCountries && allowedCountries.length > 0) {
      return Object.entries(PHONE_FORMATS).filter(([code]) =>
        allowedCountries.includes(code)
      );
    }
    return Object.entries(PHONE_FORMATS);
  }, [allowedCountries]);

  // Numéro formaté pour l'affichage
  const displayValue = useMemo(() => {
    return formatPhoneNumber(value.nationalNumber, currentCode);
  }, [value.nationalNumber, currentCode]);

  // Gérer le changement de code pays
  const handleCountryChange = (newCode: string) => {
    onChange({
      countryCode: newCode,
      nationalNumber: "",
      fullNumber: newCode,
      isValid: false,
    });
  };

  // Gérer la saisie du numéro
  const handleNumberChange = (input: string) => {
    const maxLength = format?.length || 10;
    const digits = input.replace(/\D/g, "").slice(0, maxLength);
    const formatted = formatPhoneNumber(digits, currentCode);
    const isValid = validatePhone(digits, currentCode);

    onChange({
      countryCode: currentCode,
      nationalNumber: digits,
      fullNumber: digits ? `${currentCode} ${formatted}`.trim() : currentCode,
      isValid,
    });
  };

  // Taille des éléments
  const sizeClasses = {
    sm: "h-8 text-sm",
    md: "h-10 text-base",
    lg: "h-12 text-lg",
  };

  const hasInput = value.nationalNumber.length > 0;
  const showValidationState = showValidation && hasInput;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>
      )}

      <div className="flex gap-2">
        {/* Sélecteur de pays */}
        <Select
          value={currentCode}
          onValueChange={handleCountryChange}
          disabled={disabled}
        >
          <SelectTrigger
            className={cn(
              "w-[110px] shrink-0 bg-background",
              sizeClasses[size]
            )}
          >
            <SelectValue>
              {format && (
                <span className="flex items-center gap-1.5">
                  <span>{format.flag}</span>
                  <span className="text-muted-foreground">{currentCode}</span>
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableCountries.map(([code, fmt]) => (
              <SelectItem key={code} value={code}>
                <span className="flex items-center gap-2">
                  <span>{fmt.flag}</span>
                  <span>{fmt.name}</span>
                  <span className="text-muted-foreground text-xs">{code}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Champ de saisie */}
        <div className="relative flex-1">
          <Input
            type="tel"
            inputMode="numeric"
            value={displayValue}
            onChange={(e) => handleNumberChange(e.target.value)}
            placeholder={format?.placeholder || ""}
            disabled={disabled}
            className={cn(
              "bg-background pr-10",
              sizeClasses[size],
              showValidationState &&
                (value.isValid
                  ? "border-green-500 focus-visible:ring-green-500/20"
                  : "border-destructive focus-visible:ring-destructive/20")
            )}
          />

          {/* Indicateur de validation */}
          {showValidationState && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {value.isValid ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-destructive" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message d'erreur */}
      {showValidationState && !value.isValid && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <span>Format attendu :</span>
          <span className="font-medium">{format?.placeholder}</span>
        </p>
      )}
    </div>
  );
}

export default PhoneInput;
