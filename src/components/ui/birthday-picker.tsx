import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle } from "lucide-react";
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

  // Synchroniser l'input quand la date change
  useEffect(() => {
    if (value && isValid(value)) {
      setInputValue(format(value, "dd/MM/yyyy"));
    } else {
      setInputValue("");
    }
  }, [value]);

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

    if (formatted.length === 10) {
      const parsedDate = parse(formatted, "dd/MM/yyyy", new Date());
      const now = new Date();
      
      if (
        isValid(parsedDate) &&
        parsedDate.getFullYear() >= minYear &&
        parsedDate.getFullYear() <= maxYear &&
        (!disableFuture || parsedDate <= now) &&
        (!disablePast || parsedDate >= now)
      ) {
        onChange(parsedDate);
      }
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    onChange(date);
    setIsCalendarOpen(false);
    if (date) {
      setInputValue(format(date, "dd/MM/yyyy"));
    }
  };

  const isDateDisabled = (date: Date) => {
    const now = new Date();
    if (disableFuture && date > now) return true;
    if (disablePast && date < now) return true;
    return false;
  };

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
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          maxLength={10}
          disabled={disabled}
          className={cn(
            "flex-1",
            error && "border-destructive focus-visible:ring-destructive"
          )}
        />
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
      
      {error ? (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}
