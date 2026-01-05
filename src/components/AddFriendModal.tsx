import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
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
    
    onClose();
  };

  const handleCancel = () => {
    // Reset form
    setName("");
    setPhone("");
    setRelation("");
    setLocation("");
    setBirthday(undefined);
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !birthday && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {birthday ? format(birthday, "dd/MM/yyyy", { locale: fr }) : "jj/mm/aaaa"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={birthday}
                  onSelect={setBirthday}
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