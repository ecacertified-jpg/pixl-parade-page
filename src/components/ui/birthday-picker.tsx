import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface BirthdayPickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  label?: string;
  labelIcon?: React.ReactNode;
  required?: boolean;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  minYear?: number;
  maxYear?: number;
  disableFuture?: boolean;
  disablePast?: boolean;
  className?: string;
}

export function BirthdayPicker({
  value,
  onChange,
  placeholder = "jj/mm/aaaa",
  label,
  labelIcon,
  required = false,
  helperText = "Tapez la date ou utilisez le calendrier",
  error,
  disabled = false,
  minYear = 1920,
  maxYear = new Date().getFullYear(),
  disableFuture = true,
  disablePast = false,
  className,
}: BirthdayPickerProps) {
  const [inputValue, setInputValue] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidDate, setIsValidDate] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus automatique sur le champ en cas d'erreur
  useEffect(() => {
    if (validationError && inputRef.current) {
      inputRef.current.focus();
    }
  }, [validationError]);

  // Synchroniser l'input quand la date change
  useEffect(() => {
    if (value && isValid(value)) {
      setInputValue(format(value, "dd/MM/yyyy"));
      setValidationError(null);
      setIsValidDate(true);
    } else {
      setInputValue("");
      setIsValidDate(false);
    }
  }, [value]);

  // Validation en temps réel
  const validateInput = (formatted: string): boolean => {
    // Pas de validation si champ vide ou en cours de saisie
    if (formatted.length === 0) {
      setValidationError(null);
      setIsValidDate(false);
      return true;
    }

    // Validation du jour
    if (formatted.length >= 2) {
      const day = parseInt(formatted.slice(0, 2));
      if (day > 31 || day === 0) {
        setValidationError("Jour invalide (01-31)");
        setIsValidDate(false);
        return false;
      }
    }

    // Validation du mois
    if (formatted.length >= 5) {
      const month = parseInt(formatted.slice(3, 5));
      if (month > 12 || month === 0) {
        setValidationError("Mois invalide (01-12)");
        setIsValidDate(false);
        return false;
      }
    }

    // Validation complète quand la date est saisie entièrement
    if (formatted.length === 10) {
      const parsedDate = parse(formatted, "dd/MM/yyyy", new Date());
      const now = new Date();

      if (!isValid(parsedDate)) {
        setValidationError("Cette date n'existe pas");
        setIsValidDate(false);
        return false;
      }

      const year = parsedDate.getFullYear();
      if (year < minYear || year > maxYear) {
        setValidationError(`Année doit être entre ${minYear} et ${maxYear}`);
        setIsValidDate(false);
        return false;
      }

      if (disableFuture && parsedDate > now) {
        setValidationError("La date ne peut pas être dans le futur");
        setIsValidDate(false);
        return false;
      }

      if (disablePast && parsedDate < now) {
        setValidationError("La date ne peut pas être dans le passé");
        setIsValidDate(false);
        return false;
      }

      setValidationError(null);
      setIsValidDate(true);
      return true;
    }

    // Effacer l'erreur si on est en cours de saisie valide
    setValidationError(null);
    setIsValidDate(false);
    return true;
  };

  // Handler pour la saisie clavier avec auto-formatage
  const handleInputChange = (rawValue: string) => {
    let digits = rawValue.replace(/\D/g, "").slice(0, 8);
    
    let formatted = digits;
    if (digits.length > 2) {
      formatted = digits.slice(0, 2) + "/" + digits.slice(2);
    }
    if (digits.length > 4) {
      formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    }
    
    setInputValue(formatted);

    // Valider en temps réel
    const isValidInput = validateInput(formatted);

    if (formatted.length === 10 && isValidInput) {
      const parsedDate = parse(formatted, "dd/MM/yyyy", new Date());
      onChange(parsedDate);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    onChange(date);
    setIsCalendarOpen(false);
    setValidationError(null);
    if (date) {
      setInputValue(format(date, "dd/MM/yyyy"));
      setIsValidDate(true);
    } else {
      setIsValidDate(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    const now = new Date();
    if (disableFuture && date > now) return true;
    if (disablePast && date < now) return true;
    return false;
  };

  const hasError = error || validationError;
  const showSuccess = !hasError && isValidDate;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="flex items-center gap-2">
          {labelIcon}
          <span>{label}</span>
          {required && <span className="text-xs text-destructive">*</span>}
        </Label>
      )}
      
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          maxLength={10}
          disabled={disabled}
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            showSuccess && "border-green-500 focus-visible:ring-green-500",
            hasError && "border-destructive focus-visible:ring-destructive"
          )}
        />
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "shrink-0 transition-all duration-300 ease-in-out",
                showSuccess && "border-green-500 text-green-600 hover:border-green-500",
                hasError && "border-destructive text-destructive hover:border-destructive"
              )}
              type="button"
              disabled={disabled}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleCalendarSelect}
              locale={fr}
              captionLayout="dropdown-buttons"
              fromYear={minYear}
              toYear={maxYear}
              disabled={isDateDisabled}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {hasError ? (
        <div className="animate-fade-in">
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3 animate-scale-in" />
            {error || validationError}
          </p>
        </div>
      ) : showSuccess ? (
        <div className="animate-fade-in">
          <p className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 animate-scale-in" />
            Date valide
          </p>
        </div>
      ) : helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}
