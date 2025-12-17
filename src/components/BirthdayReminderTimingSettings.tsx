import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarDays, Clock, AlertCircle, Plus, X, Check, CalendarPlus } from "lucide-react";

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

const PREDEFINED_DAYS = REMINDER_OPTIONS.map(o => o.value);
const QUICK_SUGGESTIONS = [5, 10, 21, 30];
const MAX_TOTAL_DAYS = 8;

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
  const [customDay, setCustomDay] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const customDays = selectedDays.filter(d => !PREDEFINED_DAYS.includes(d)).sort((a, b) => b - a);

  const handleToggle = (day: number) => {
    if (selectedDays.includes(day)) {
      onDaysChange(selectedDays.filter(d => d !== day));
    } else {
      onDaysChange([...selectedDays, day].sort((a, b) => b - a));
    }
  };

  const handleAddCustomDay = () => {
    const day = parseInt(customDay);
    if (isValidCustomDay(day)) {
      onDaysChange([...selectedDays, day].sort((a, b) => b - a));
      setCustomDay("");
      setShowCustomInput(false);
    }
  };

  const handleRemoveCustomDay = (day: number) => {
    onDaysChange(selectedDays.filter(d => d !== day));
  };

  const handleQuickAdd = (day: number) => {
    if (!selectedDays.includes(day) && selectedDays.length < MAX_TOTAL_DAYS) {
      onDaysChange([...selectedDays, day].sort((a, b) => b - a));
    }
  };

  const isValidCustomDay = (day: number) => {
    return !isNaN(day) && 
           day >= 1 && 
           day <= 30 && 
           !selectedDays.includes(day) && 
           selectedDays.length < MAX_TOTAL_DAYS;
  };

  const noSelections = selectedDays.length === 0;
  const availableSuggestions = QUICK_SUGGESTIONS.filter(d => !selectedDays.includes(d));

  return (
    <div className="space-y-4">
      {/* Options prédéfinies */}
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

      {/* Section Timing personnalisé */}
      <div className="space-y-3 pt-2 border-t">
        <div className="flex items-center justify-between pt-2">
          <Label className="text-sm font-medium">Timing personnalisé</Label>
          {!showCustomInput && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowCustomInput(true)}
              disabled={disabled || selectedDays.length >= MAX_TOTAL_DAYS}
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          )}
        </div>

        {/* Affichage des jours personnalisés sous forme de badges */}
        {customDays.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customDays.map(day => (
              <Badge key={day} variant="secondary" className="gap-1 pr-1">
                <CalendarPlus className="w-3 h-3" />
                {day} jour{day > 1 ? 's' : ''} avant
                <button 
                  onClick={() => !disabled && handleRemoveCustomDay(day)}
                  disabled={disabled}
                  className="ml-1 hover:text-destructive disabled:opacity-50"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Input pour ajouter un jour personnalisé */}
        {showCustomInput && (
          <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min={1}
                max={30}
                value={customDay}
                onChange={(e) => setCustomDay(e.target.value)}
                placeholder="Nb jours"
                className="w-24"
                disabled={disabled}
              />
              <span className="text-sm text-muted-foreground">jours avant</span>
              <Button 
                size="sm" 
                onClick={handleAddCustomDay}
                disabled={disabled || !isValidCustomDay(parseInt(customDay))}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomDay("");
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Suggestions rapides */}
            {availableSuggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Suggestions :</span>
                {availableSuggestions.map(day => (
                  <Button
                    key={day}
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() => handleQuickAdd(day)}
                    disabled={disabled}
                  >
                    J-{day}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedDays.length >= MAX_TOTAL_DAYS && (
          <p className="text-xs text-muted-foreground">
            Maximum de {MAX_TOTAL_DAYS} rappels atteint
          </p>
        )}
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
