import { useState, useEffect } from "react";
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

interface Friend {
  id: string;
  name: string;
  phone: string;
  relation: string;
  location: string;
  birthday: Date;
}

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFriend: (friend: Friend) => void;
}

export function AddFriendModal({ isOpen, onClose, onAddFriend }: AddFriendModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");
  const [location, setLocation] = useState("");
  const [birthday, setBirthday] = useState<Date>();
  const [birthdayInput, setBirthdayInput] = useState("");

  // Synchroniser l'input quand la date est sélectionnée via calendrier
  useEffect(() => {
    if (birthday) {
      setBirthdayInput(format(birthday, "dd/MM/yyyy"));
    }
  }, [birthday]);

  // Handler pour la saisie clavier avec auto-formatage
  const handleBirthdayInputChange = (value: string) => {
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
    
    setBirthdayInput(formatted);

    // Valider et convertir en Date si format complet (10 caractères: jj/mm/aaaa)
    if (formatted.length === 10) {
      const parsedDate = parse(formatted, "dd/MM/yyyy", new Date());
      if (isValid(parsedDate) && parsedDate <= new Date() && parsedDate.getFullYear() >= 1920) {
        setBirthday(parsedDate);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !phone || !relation || !location || !birthday) {
      return;
    }

    const newFriend: Friend = {
      id: Date.now().toString(),
      name,
      phone,
      relation,
      location,
      birthday
    };

    onAddFriend(newFriend);
    
    // Reset form
    setName("");
    setPhone("");
    setRelation("");
    setLocation("");
    setBirthday(undefined);
    setBirthdayInput("");
    
    onClose();
  };

  const handleCancel = () => {
    // Reset form
    setName("");
    setPhone("");
    setRelation("");
    setLocation("");
    setBirthday(undefined);
    setBirthdayInput("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un ami</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Prénom</Label>
            <Input
              id="name"
              placeholder="Florentin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input
              id="phone"
              placeholder="07 XX XX XX XX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relation">Relation</Label>
            <Select value={relation} onValueChange={setRelation} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une relation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frère">Frère</SelectItem>
                <SelectItem value="sœur">Sœur</SelectItem>
                <SelectItem value="famille">Famille</SelectItem>
                <SelectItem value="ami">Ami(e)</SelectItem>
                <SelectItem value="collègue">Collègue</SelectItem>
                <SelectItem value="conjoint">Conjoint(e)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Lieu de résidence</Label>
            <Input
              id="location"
              placeholder="Cocody, Abidjan"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Date d'anniversaire</Label>
            <div className="flex gap-2">
              <Input
                placeholder="jj/mm/aaaa"
                value={birthdayInput}
                onChange={(e) => handleBirthdayInputChange(e.target.value)}
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
                    selected={birthday}
                    onSelect={(date) => {
                      setBirthday(date);
                      if (date) setBirthdayInput(format(date, "dd/MM/yyyy"));
                    }}
                    locale={fr}
                    captionLayout="dropdown-buttons"
                    fromYear={1920}
                    toYear={new Date().getFullYear()}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-xs text-muted-foreground">
              Tapez la date ou utilisez le calendrier
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="bg-orange-500 hover:bg-orange-400 flex-1">
              Ajouter
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}