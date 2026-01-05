import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { format, parse, isValid, isBefore, isAfter, addDays, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface Preset {
  label: string;
  getValue: () => DateRange;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  label?: string;
  labelFrom?: string;
  labelTo?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  minYear?: number;
  maxYear?: number;
  numberOfMonths?: number;
  showPresets?: boolean;
  presets?: Preset[];
  className?: string;
  required?: boolean;
  layout?: 'horizontal' | 'vertical' | 'inline';
}

const defaultPresets: Preset[] = [
  { 
    label: "7 jours", 
    getValue: () => ({ from: new Date(), to: addDays(new Date(), 7) }) 
  },
  { 
    label: "30 jours", 
    getValue: () => ({ from: new Date(), to: addDays(new Date(), 30) }) 
  },
  { 
    label: "Ce mois", 
    getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) 
  },
  { 
    label: "Mois prochain", 
    getValue: () => ({ from: startOfMonth(addMonths(new Date(), 1)), to: endOfMonth(addMonths(new Date(), 1)) }) 
  },
];

export function DateRangePicker({
  value,
  onChange,
  label,
  labelFrom = "Date de début",
  labelTo = "Date de fin",
  helperText = "Sélectionnez une plage de dates",
  error,
  disabled = false,
  minDate,
  maxDate,
  minYear = new Date().getFullYear() - 1,
  maxYear = new Date().getFullYear() + 10,
  numberOfMonths,
  showPresets = false,
  presets,
  className,
  required = false,
  layout = 'horizontal',
}: DateRangePickerProps) {
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [fromError, setFromError] = useState<string | null>(null);
  const [toError, setToError] = useState<string | null>(null);
  const [isFromValid, setIsFromValid] = useState(false);
  const [isToValid, setIsToValid] = useState(false);
  const isMobile = useIsMobile();
  
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  // Focus automatique sur le champ "from" en cas d'erreur
  useEffect(() => {
    if (fromError && fromInputRef.current) {
      fromInputRef.current.focus();
    }
  }, [fromError]);

  // Focus automatique sur le champ "to" en cas d'erreur
  useEffect(() => {
    if (toError && toInputRef.current) {
      toInputRef.current.focus();
    }
  }, [toError]);

  // Responsive: 1 mois sur mobile, 2 sur desktop (sauf si spécifié)
  const calendarMonths = numberOfMonths ?? (isMobile ? 1 : 2);

  // Synchroniser les inputs quand la valeur change
  useEffect(() => {
    if (value?.from && isValid(value.from)) {
      setFromInput(format(value.from, "dd/MM/yyyy"));
      setFromError(null);
      setIsFromValid(true);
    } else {
      setFromInput("");
      setIsFromValid(false);
    }
  }, [value?.from]);

  useEffect(() => {
    if (value?.to && isValid(value.to)) {
      setToInput(format(value.to, "dd/MM/yyyy"));
      setToError(null);
      setIsToValid(true);
    } else {
      setToInput("");
      setIsToValid(false);
    }
  }, [value?.to]);

  // Auto-formatage de la saisie clavier
  const formatDateInput = (rawValue: string): string => {
    const digits = rawValue.replace(/\D/g, "").slice(0, 8);
    
    let formatted = digits;
    if (digits.length > 2) {
      formatted = digits.slice(0, 2) + "/" + digits.slice(2);
    }
    if (digits.length > 4) {
      formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    }
    
    return formatted;
  };

  // Validation en temps réel
  const validateDateInput = (
    formatted: string, 
    setError: (error: string | null) => void,
    checkAgainstDate?: Date,
    isEndDate: boolean = false
  ): { isValid: boolean; date?: Date } => {
    // Pas de validation si champ vide
    if (formatted.length === 0) {
      setError(null);
      return { isValid: true };
    }

    // Validation du jour
    if (formatted.length >= 2) {
      const day = parseInt(formatted.slice(0, 2));
      if (day > 31 || day === 0) {
        setError("Jour invalide (01-31)");
        return { isValid: false };
      }
    }

    // Validation du mois
    if (formatted.length >= 5) {
      const month = parseInt(formatted.slice(3, 5));
      if (month > 12 || month === 0) {
        setError("Mois invalide (01-12)");
        return { isValid: false };
      }
    }

    // Validation complète quand la date est saisie entièrement
    if (formatted.length === 10) {
      const parsedDate = parse(formatted, "dd/MM/yyyy", new Date());

      if (!isValid(parsedDate)) {
        setError("Cette date n'existe pas");
        return { isValid: false };
      }

      const year = parsedDate.getFullYear();
      if (year < minYear || year > maxYear) {
        setError(`Année doit être entre ${minYear} et ${maxYear}`);
        return { isValid: false };
      }

      if (minDate && isBefore(parsedDate, minDate)) {
        setError(`Date minimum: ${format(minDate, "dd/MM/yyyy")}`);
        return { isValid: false };
      }

      if (maxDate && isAfter(parsedDate, maxDate)) {
        setError(`Date maximum: ${format(maxDate, "dd/MM/yyyy")}`);
        return { isValid: false };
      }

      // Vérification date de fin après date de début
      if (isEndDate && checkAgainstDate && isBefore(parsedDate, checkAgainstDate)) {
        setError("La date de fin doit être après la date de début");
        return { isValid: false };
      }

      setError(null);
      return { isValid: true, date: parsedDate };
    }

    // Effacer l'erreur si on est en cours de saisie valide
    setError(null);
    return { isValid: true };
  };

  // Handler pour la date de début
  const handleFromInputChange = (rawValue: string) => {
    const formatted = formatDateInput(rawValue);
    setFromInput(formatted);

    const result = validateDateInput(formatted, setFromError);

    if (formatted.length === 10 && result.isValid && result.date) {
      // Si la date de fin existe et est avant la nouvelle date de début, la réinitialiser
      const newTo = value?.to && isBefore(value.to, result.date) ? undefined : value?.to;
      if (newTo !== value?.to) {
        setToError(null);
      }
      onChange({ from: result.date, to: newTo });
    }
  };

  // Handler pour la date de fin
  const handleToInputChange = (rawValue: string) => {
    const formatted = formatDateInput(rawValue);
    setToInput(formatted);

    const result = validateDateInput(formatted, setToError, value?.from, true);

    if (formatted.length === 10 && result.isValid && result.date) {
      onChange({ from: value?.from, to: result.date });
    }
  };

  // Handler pour la sélection calendrier
  const handleCalendarSelect = (range: DateRange | undefined) => {
    if (range) {
      setFromError(null);
      setToError(null);
      if (range.from) setIsFromValid(true);
      if (range.to) setIsToValid(true);
      onChange(range);
      // Fermer le calendrier seulement si les deux dates sont sélectionnées
      if (range.from && range.to) {
        setIsCalendarOpen(false);
      }
    }
  };

  // Fonction de désactivation des dates
  const isDateDisabled = (date: Date) => {
    if (minDate && isBefore(date, minDate)) return true;
    if (maxDate && isAfter(date, maxDate)) return true;
    return false;
  };

  // Appliquer un preset
  const applyPreset = (preset: Preset) => {
    const range = preset.getValue();
    setFromError(null);
    setToError(null);
    setIsFromValid(true);
    setIsToValid(true);
    onChange(range);
    setIsCalendarOpen(false);
  };

  const activePresets = presets || defaultPresets;
  const hasFromError = error || fromError;
  const hasToError = error || toError;
  const hasAnyError = hasFromError || hasToError;
  const showFromSuccess = !hasFromError && isFromValid;
  const showToSuccess = !hasToError && isToValid;
  const showRangeSuccess = showFromSuccess && showToSuccess && value?.from && value?.to;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <div className={cn(
        layout === 'horizontal' && "flex flex-col sm:flex-row gap-2 items-start sm:items-end",
        layout === 'vertical' && "flex flex-col gap-3",
        layout === 'inline' && "flex flex-wrap gap-2 items-center"
      )}>
        {/* Champ Date de début */}
        <div className={cn(
          "space-y-1",
          layout !== 'inline' && "flex-1 w-full sm:w-auto"
        )}>
          {layout !== 'inline' && (
            <Label className="text-xs text-muted-foreground">{labelFrom}</Label>
          )}
          <Input
            ref={fromInputRef}
            placeholder="jj/mm/aaaa"
            value={fromInput}
            onChange={(e) => handleFromInputChange(e.target.value)}
            maxLength={10}
            disabled={disabled}
            className={cn(
              "transition-all duration-300 ease-in-out",
              showFromSuccess && "border-green-500 focus-visible:ring-green-500",
              hasFromError && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {fromError && (
            <div className="animate-fade-in">
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3 animate-scale-in" />
                {fromError}
              </p>
            </div>
          )}
        </div>

        {layout === 'inline' && (
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}

        {/* Champ Date de fin */}
        <div className={cn(
          "space-y-1",
          layout !== 'inline' && "flex-1 w-full sm:w-auto"
        )}>
          {layout !== 'inline' && (
            <Label className="text-xs text-muted-foreground">{labelTo}</Label>
          )}
          <Input
            ref={toInputRef}
            placeholder="jj/mm/aaaa"
            value={toInput}
            onChange={(e) => handleToInputChange(e.target.value)}
            maxLength={10}
            disabled={disabled}
            className={cn(
              "transition-all duration-300 ease-in-out",
              showToSuccess && "border-green-500 focus-visible:ring-green-500",
              hasToError && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {toError && (
            <div className="animate-fade-in">
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3 animate-scale-in" />
                {toError}
              </p>
            </div>
          )}
        </div>

        {/* Bouton Calendrier */}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "shrink-0 transition-all duration-300 ease-in-out",
                showRangeSuccess && "border-green-500 text-green-600 hover:border-green-500",
                hasAnyError && "border-destructive text-destructive hover:border-destructive"
              )}
              type="button"
              disabled={disabled}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0" 
            align="end"
            side={isMobile ? "bottom" : "bottom"}
          >
            <div className="flex flex-col">
              {/* Presets optionnels */}
              {showPresets && (
                <div className="flex flex-wrap gap-1 p-2 border-b">
                  {activePresets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => applyPreset(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              )}
              
              <Calendar
                mode="range"
                selected={value}
                onSelect={handleCalendarSelect}
                locale={fr}
                captionLayout="dropdown-buttons"
                fromYear={minYear}
                toYear={maxYear}
                numberOfMonths={calendarMonths}
                disabled={isDateDisabled}
                initialFocus
                className="pointer-events-auto"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Affichage de la plage sélectionnée avec succès */}
      {showRangeSuccess && (
        <div className="animate-fade-in">
          <p className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 animate-scale-in" />
            Du {format(value.from!, "d MMMM yyyy", { locale: fr })} au {format(value.to!, "d MMMM yyyy", { locale: fr })}
          </p>
        </div>
      )}

      {/* Message d'erreur global ou texte d'aide */}
      {error ? (
        <div className="animate-fade-in">
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3 animate-scale-in" />
            {error}
          </p>
        </div>
      ) : !value?.from && !value?.to && !fromError && !toError && helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}
