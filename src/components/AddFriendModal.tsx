import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BirthdayPicker } from "@/components/ui/birthday-picker";
import { AddressSelector, type AddressResult } from "@/components/AddressSelector";

interface Friend {
  id: string;
  name: string;
  phone: string;
  relation: string;
  location: string;
  city?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
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
  const [addressData, setAddressData] = useState<AddressResult | null>(null);
  const [birthday, setBirthday] = useState<Date>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !phone || !relation || !addressData?.city || !birthday) {
      return;
    }

    const newFriend: Friend = {
      id: Date.now().toString(),
      name,
      phone,
      relation,
      location: addressData.fullAddress,
      city: addressData.city,
      neighborhood: addressData.neighborhood,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      birthday
    };

    onAddFriend(newFriend);
    
    // Reset form
    setName("");
    setPhone("");
    setRelation("");
    setAddressData(null);
    setBirthday(undefined);
    
    onClose();
  };

  const handleCancel = () => {
    // Reset form
    setName("");
    setPhone("");
    setRelation("");
    setAddressData(null);
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

          <AddressSelector
            onAddressChange={setAddressData}
            label="Lieu de résidence"
            cityLabel="Ville / Commune"
            neighborhoodLabel="Quartier"
            required
          />

          <BirthdayPicker
            label="Date d'anniversaire"
            value={birthday}
            onChange={setBirthday}
          />

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
