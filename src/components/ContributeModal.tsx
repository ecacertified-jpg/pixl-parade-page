import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  relationship: string;
  birthday?: string;
}

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContributeModal({ isOpen, onClose }: ContributeModalProps) {
  const navigate = useNavigate();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const contacts: Contact[] = [
    {
      id: "1",
      name: "Fatou Bamba",
      relationship: "Amie",
      birthday: "15 Mars",
      avatar: ""
    },
    {
      id: "2", 
      name: "Aisha Traoré",
      relationship: "Collègue",
      birthday: "22 Avril"
    },
    {
      id: "3",
      name: "Koffi Asante",
      relationship: "Famille",
      birthday: "8 Juin"
    },
    {
      id: "4",
      name: "Aminata Diallo",
      relationship: "Voisine",
      birthday: "12 Septembre"
    }
  ];

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    // Store selected contact for the shop with expiry (use sessionStorage for security)
    const data = {
      contact: {
        id: contact.id,
        name: contact.name,
        relationship: contact.relationship,
        // Don't store sensitive data like full birthday
      },
      expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutes expiry
    };
    sessionStorage.setItem('contributionTarget', JSON.stringify(data));
    onClose();
    navigate('/shop');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <span className="text-xl">🎁</span> Choisir un bénéficiaire
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => handleContactSelect(contact)}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Avatar>
                <AvatarImage src={contact.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-500 text-white">
                  {contact.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="font-medium">{contact.name}</div>
                <div className="text-sm text-muted-foreground">{contact.relationship}</div>
                {contact.birthday && (
                  <div className="text-xs text-primary">🎂 {contact.birthday}</div>
                )}
              </div>
              
              <Badge variant="secondary" className="text-xs">
                Cotiser
              </Badge>
            </div>
          ))}
        </div>

        <div className="text-center pt-4">
          <Button variant="outline" onClick={onClose} className="w-full">
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}