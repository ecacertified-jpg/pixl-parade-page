import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BirthdayPicker } from "@/components/ui/birthday-picker";

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

  const isEditing = !!eventToEdit;

  // Pre-fill form when editing
  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDate(eventToEdit.date);
      setType(eventToEdit.type);
    } else {
      setTitle('');
      setDate(undefined);
      setType('');
    }
  }, [eventToEdit]);

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
    onClose();
  };

  const handleCancel = () => {
    setTitle('');
    setDate(undefined);
    setType('');
    onClose();
  };

  const currentYear = new Date().getFullYear();

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? 'Modifier l\'événement' : 'Ajouter un événement'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
          
          <BirthdayPicker
            label="Date de l'événement"
            value={date}
            onChange={setDate}
            minYear={currentYear - 1}
            maxYear={currentYear + 10}
            disableFuture={false}
            disablePast={false}
          />

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
