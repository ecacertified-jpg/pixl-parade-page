import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, CalendarDays, Clock, AlertCircle } from "lucide-react";

const REMINDER_OPTIONS = [
  { 
    value: 14, 
    label: "2 semaines avant", 
    description: "Pour planifier tranquillement",
    icon: Calendar
  },
  { 
    value: 7, 
    label: "1 semaine avant", 
    description: "Idéal pour commander",
    icon: CalendarDays
  },
  { 
    value: 3, 
    label: "3 jours avant", 
    description: "Dernière ligne droite",
    icon: Clock
  },
  { 
    value: 1, 
    label: "La veille", 
    description: "Rappel de dernière minute",
    icon: AlertCircle
  },
];

interface BirthdayReminderTimingSettingsProps {
  selectedDays: number[];
  onDaysChange: (days: number[]) => void;
  disabled?: boolean;
}

export function BirthdayReminderTimingSettings({
  selectedDays,
  onDaysChange,
  disabled = false
}: BirthdayReminderTimingSettingsProps) {
  const handleToggle = (day: number) => {
    if (selectedDays.includes(day)) {
      onDaysChange(selectedDays.filter(d => d !== day));
    } else {
      onDaysChange([...selectedDays, day].sort((a, b) => b - a));
    }
  };

  const noSelections = selectedDays.length === 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {REMINDER_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedDays.includes(option.value);
          
          return (
            <div
              key={option.value}
              className={`
                flex items-start gap-3 p-3 rounded-lg border transition-colors
                ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
              `}
              onClick={() => !disabled && handleToggle(option.value)}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleToggle(option.value)}
                disabled={disabled}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <Label className={`font-medium ${disabled ? '' : 'cursor-pointer'}`}>
                    {option.label}
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {noSelections && !disabled && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Sélectionnez au moins une option pour recevoir des rappels d'anniversaire.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}