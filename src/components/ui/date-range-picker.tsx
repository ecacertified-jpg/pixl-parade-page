import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle, ArrowRight } from "lucide-react";
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
  const isMobile = useIsMobile();

  // Responsive: 1 mois sur mobile, 2 sur desktop (sauf si spécifié)
  const calendarMonths = numberOfMonths ?? (isMobile ? 1 : 2);

  // Synchroniser les inputs quand la valeur change
  useEffect(() => {
    if (value?.from) {
      setFromInput(format(value.from, "dd/MM/yyyy"));
    } else {
      setFromInput("");
    }
  }, [value?.from]);

  useEffect(() => {
    if (value?.to) {
      setToInput(format(value.to, "dd/MM/yyyy"));
    } else {
      setToInput("");
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

  // Valider une date parsée
  const validateDate = (date: Date): boolean => {
    if (!isValid(date)) return false;
    if (minDate && isBefore(date, minDate)) return false;
    if (maxDate && isAfter(date, maxDate)) return false;
    if (date.getFullYear() < minYear || date.getFullYear() > maxYear) return false;
    return true;
  };

  // Handler pour la date de début
  const handleFromInputChange = (rawValue: string) => {
    const formatted = formatDateInput(rawValue);
    setFromInput(formatted);

    if (formatted.length === 10) {
      const parsedDate = parse(formatted, "dd/MM/yyyy", new Date());
      if (validateDate(parsedDate)) {
        // Si la date de fin existe et est avant la nouvelle date de début, la réinitialiser
        const newTo = value?.to && isBefore(value.to, parsedDate) ? undefined : value?.to;
        onChange({ from: parsedDate, to: newTo });
      }
    }
  };

  // Handler pour la date de fin
  const handleToInputChange = (rawValue: string) => {
    const formatted = formatDateInput(rawValue);
    setToInput(formatted);

    if (formatted.length === 10) {
      const parsedDate = parse(formatted, "dd/MM/yyyy", new Date());
      if (validateDate(parsedDate)) {
        // Vérifier que la date de fin est après la date de début
        if (value?.from && isBefore(parsedDate, value.from)) {
          return; // Ne pas accepter une date de fin avant la date de début
        }
        onChange({ from: value?.from, to: parsedDate });
      }
    }
  };

  // Handler pour la sélection calendrier
  const handleCalendarSelect = (range: DateRange | undefined) => {
    if (range) {
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
    onChange(range);
    setIsCalendarOpen(false);
  };

  const activePresets = presets || defaultPresets;

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
            placeholder="jj/mm/aaaa"
            value={fromInput}
            onChange={(e) => handleFromInputChange(e.target.value)}
            maxLength={10}
            disabled={disabled}
            className={cn(
              error && "border-destructive focus-visible:ring-destructive"
            )}
          />
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
            placeholder="jj/mm/aaaa"
            value={toInput}
            onChange={(e) => handleToInputChange(e.target.value)}
            maxLength={10}
            disabled={disabled}
            className={cn(
              error && "border-destructive focus-visible:ring-destructive"
            )}
          />
        </div>

        {/* Bouton Calendrier */}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
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

      {/* Affichage de la plage sélectionnée */}
      {value?.from && value?.to && !error && (
        <p className="text-xs text-muted-foreground">
          Du {format(value.from, "d MMMM yyyy", { locale: fr })} au {format(value.to, "d MMMM yyyy", { locale: fr })}
        </p>
      )}

      {/* Message d'erreur ou texte d'aide */}
      {error ? (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      ) : !value?.from && !value?.to && helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}
