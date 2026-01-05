import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface Event {
  id: string;
  title: string;
  date: Date;
  type: string;
}

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (event: Omit<Event, 'id'>) => void;
  onEditEvent?: (eventId: string, event: Omit<Event, 'id'>) => void;
  eventToEdit?: Event | null;
}

const eventTypes = [
  "anniversaire",
  "mariage",
  "promotion professionnelle",
  "réussite scolaire",
  "réussite académique"
];

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onAddEvent,
  onEditEvent,
  eventToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [type, setType] = useState('');
  const [dateInput, setDateInput] = useState('');

  const isEditing = !!eventToEdit;

  // Pre-fill form when editing
  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDate(eventToEdit.date);
      setType(eventToEdit.type);
      setDateInput(format(eventToEdit.date, "dd/MM/yyyy"));
    } else {
      setTitle('');
      setDate(undefined);
      setType('');
      setDateInput('');
    }
  }, [eventToEdit]);

  // Synchroniser l'input quand la date est sélectionnée via calendrier
  useEffect(() => {
    if (date && !eventToEdit) {
      setDateInput(format(date, "dd/MM/yyyy"));
    }
  }, [date, eventToEdit]);

  // Handler pour la saisie clavier avec auto-formatage
  const handleDateInputChange = (value: string) => {
    // Garder uniquement les chiffres
    let digits = value.replace(/\D/g, '');
    
    // Limiter à 8 chiffres (jjmmaaaa)
    digits = digits.slice(0, 8);
    
    // Formater automatiquement avec les slashes
    let formatted = digits;
    if (digits.length > 2) {
      formatted = digits.slice(0, 2) + '/' + digits.slice(2);
    }
    if (digits.length > 4) {
      formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
    }
    
    setDateInput(formatted);

    // Valider et convertir en Date si format complet (10 caractères: jj/mm/aaaa)
    if (formatted.length === 10) {
      const parsedDate = parse(formatted, "dd/MM/yyyy", new Date());
      const currentYear = new Date().getFullYear();
      if (isValid(parsedDate) && parsedDate.getFullYear() >= currentYear - 1 && parsedDate.getFullYear() <= currentYear + 10) {
        setDate(parsedDate);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !date || !type) {
      return;
    }

    const eventData = {
      title: title.trim(),
      date,
      type,
    };

    if (isEditing && eventToEdit && onEditEvent) {
      onEditEvent(eventToEdit.id, eventData);
    } else {
      onAddEvent(eventData);
    }

    // Reset form
    setTitle('');
    setDate(undefined);
    setType('');
    setDateInput('');
    onClose();
  };

  const handleCancel = () => {
    setTitle('');
    setDate(undefined);
    setType('');
    setDateInput('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? 'Modifier l\'événement' : 'Ajouter un événement'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titre de l'événement</Label>
            <Input
              id="title"
              placeholder="Anniversaire de Françoise"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>Date de l'événement</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="jj/mm/aaaa"
                value={dateInput}
                onChange={(e) => handleDateInputChange(e.target.value)}
                maxLength={10}
                className="flex-1"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    type="button"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      setDate(selectedDate);
                      if (selectedDate) setDateInput(format(selectedDate, "dd/MM/yyyy"));
                    }}
                    locale={fr}
                    captionLayout="dropdown-buttons"
                    fromYear={new Date().getFullYear() - 1}
                    toYear={new Date().getFullYear() + 10}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tapez la date ou utilisez le calendrier
            </p>
          </div>

          <div>
            <Label>Type d'événement</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner le type d'événement" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((eventType) => (
                  <SelectItem key={eventType} value={eventType}>
                    {eventType.charAt(0).toUpperCase() + eventType.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              disabled={!title.trim() || !date || !type}
            >
              {isEditing ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};