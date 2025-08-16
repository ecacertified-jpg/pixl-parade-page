import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, ArrowLeft, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Contact {
  id: string;
  name: string;
  relationship: string;
  birthday?: string;
  avatar_url?: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
}

interface CollaborativeGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onBack: () => void;
}

export function CollaborativeGiftModal({
  isOpen,
  onClose,
  product,
  onBack
}: CollaborativeGiftModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock contacts data - In real app, fetch from Supabase
  const contacts: Contact[] = [
    {
      id: "1",
      name: "Fatou Bamba",
      relationship: "Amie",
      birthday: "2024-08-20",
      avatar_url: "/api/placeholder/40/40"
    },
    {
      id: "2", 
      name: "Kofi Asante",
      relationship: "Collègue"
    },
    {
      id: "3",
      name: "Aisha Traoré", 
      relationship: "Sœur",
      avatar_url: "/api/placeholder/40/40"
    }
  ];

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
  };

  const handleStartFund = async () => {
    if (!selectedContact || !product || !user) return;

    setIsCreating(true);
    try {
      // Add to cart for collaborative gift
      const cartItem = {
        id: Date.now(), // Temporary ID for cart
        name: `Cotisation pour ${selectedContact.name}`,
        description: `Cadeau collaboratif: ${product.name}`,
        price: product.price,
        quantity: 1,
        image: product.image,
        isCollaborativeGift: true,
        beneficiaryName: selectedContact.name,
        beneficiaryId: selectedContact.id,
        productId: product.id
      };

      // Store in localStorage for cart
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const updatedCart = [...existingCart, cartItem];
      localStorage.setItem('cart', JSON.stringify(updatedCart));

      toast({
        title: "Ajouté au panier ! 🎉",
        description: `Cotisation pour ${selectedContact.name} ajoutée au panier`
      });

      onClose();
      navigate('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter au panier",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getBirthdayText = (birthday?: string) => {
    if (!birthday) return "Aucun favori partagé";
    
    const today = new Date();
    const birthDate = new Date(birthday);
    const daysUntil = Math.ceil((birthDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 7 && daysUntil > 0) {
      return `Anniversairedans ${daysUntil} jour(s)`;
    }
    return "Aucun favori partagé";
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="relative">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="absolute left-0 top-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-left ml-10">
              Organiser une cotisation pour
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher un ami..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Contacts List */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedContact?.id === contact.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent'
                }`}
                onClick={() => handleSelectContact(contact)}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  {contact.avatar_url ? (
                    <img
                      src={contact.avatar_url}
                      alt={contact.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-medium text-primary">
                      {contact.name.charAt(0)}
                    </span>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{contact.name}</h3>
                    {contact.birthday && (
                      <span className="text-2xl">🎂</span>
                    )}
                    {selectedContact?.id === contact.id && (
                      <Heart className="h-4 w-4 text-red-500 fill-current ml-auto" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                  <p className="text-xs text-purple-600">
                    {getBirthdayText(contact.birthday)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Contact Action */}
          {selectedContact && (
            <div className="bg-accent/50 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  {selectedContact.avatar_url ? (
                    <img
                      src={selectedContact.avatar_url}
                      alt={selectedContact.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-primary">
                      {selectedContact.name.charAt(0)}
                    </span>
                  )}
                </div>
                <span className="font-medium">{selectedContact.name}</span>
              </div>
              
              <Button
                onClick={handleStartFund}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
              >
                <Heart className="h-4 w-4 mr-2" />
                {isCreating ? "Création..." : `Démarrer une cotisation pour ${selectedContact.name}`}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-2">
                Vos amis pourront contribuer à ce cadeau
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}