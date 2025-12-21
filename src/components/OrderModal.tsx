import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Gift, Users, Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CollaborativeGiftModal } from "./CollaborativeGiftModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useIsMobile } from "@/hooks/use-mobile";

interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  vendor?: string;
  locationName?: string;
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  preSelectedRecipient?: { id: string; name: string } | null;
}

export function OrderModal({
  isOpen,
  onClose,
  product,
  preSelectedRecipient
}: OrderModalProps) {
  const [showGiftOptions, setShowGiftOptions] = useState(false);
  const [showCollaborativeModal, setShowCollaborativeModal] = useState(false);
  const [showContactSelection, setShowContactSelection] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addItem } = useCart();
  const isMobile = useIsMobile();

  // When modal opens with pre-selected recipient, go directly to gift options
  useEffect(() => {
    if (isOpen && preSelectedRecipient) {
      setShowGiftOptions(true);
    }
  }, [isOpen, preSelectedRecipient]);

  useEffect(() => {
    if (showContactSelection) {
      loadContacts();
    }
  }, [showContactSelection]);

  const loadContacts = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter pour continuer.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name');

      if (error) {
        if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
          toast({
            title: "Session expirée",
            description: "Veuillez vous reconnecter.",
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }
        console.error('Error loading contacts:', error);
        return;
      }

      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCartHandler = (forSelf = true, recipient: any = null) => {
    if (!product.id || typeof product.id === 'number') {
      toast({
        title: "Erreur",
        description: "Ce produit n'est pas valide. Veuillez en choisir un autre.",
        variant: "destructive"
      });
      return;
    }

    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      vendor: product.vendor,
      locationName: product.locationName,
      currency: product.currency,
    });
    
    toast({
      title: forSelf ? "Ajouté au panier" : "Cadeau ajouté au panier",
      description: forSelf 
        ? `${product.name} a été ajouté à votre panier`
        : `Cadeau pour ${recipient?.name} ajouté au panier`
    });
  };

  if (!product) return null;

  const handleGiftClick = () => {
    setShowGiftOptions(true);
  };

  const handleBackToMain = () => {
    setShowGiftOptions(false);
  };

  const handleClose = () => {
    setShowGiftOptions(false);
    setShowCollaborativeModal(false);
    setShowContactSelection(false);
    setSelectedContact(null);
    setSearchQuery("");
    onClose();
  };

  const handleCollaborativeGift = () => {
    setShowCollaborativeModal(true);
  };

  const handleBackFromCollaborative = () => {
    setShowCollaborativeModal(false);
  };

  const handleContactSelection = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter pour continuer.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }
      
      setShowContactSelection(true);
    } catch (error) {
      console.error('Erreur de vérification de session:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive"
      });
      navigate('/auth');
    }
  };

  const handleBackFromContacts = () => {
    setShowContactSelection(false);
    setSearchQuery("");
  };

  const handleContactSelect = (contact: any) => {
    setSelectedContact(contact);
  };

  const handleGiftToContact = () => {
    const recipient = selectedContact || (preSelectedRecipient ? { id: preSelectedRecipient.id, name: preSelectedRecipient.name } : null);
    if (recipient) {
      addToCartHandler(false, recipient);
      navigate("/cart");
      handleClose();
    }
  };

  const handleDirectGiftToPreSelected = () => {
    if (preSelectedRecipient) {
      addToCartHandler(false, { id: preSelectedRecipient.id, name: preSelectedRecipient.name });
      navigate("/cart");
      handleClose();
    }
  };

  // Shared modal content
  const ModalContent = () => (
    <div className="space-y-3">
      {/* Product Info */}
      <div className="flex items-center gap-3">
        <img 
          src={product.image} 
          alt={product.name} 
          className={`object-cover rounded-lg ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`} 
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{product.name}</h3>
          {(showGiftOptions || showContactSelection) && (
            <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
          )}
          <p className="text-primary font-bold text-sm">
            {product.price.toLocaleString()} {product.currency}
          </p>
        </div>
      </div>

      {showContactSelection ? (
        // Contact Selection View
        <>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un ami..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                  selectedContact?.id === contact.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleContactSelect(contact)}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {contact.relationship || 'Ami'}
                    </p>
                  </div>
                  {selectedContact?.id === contact.id && (
                    <div className="text-primary flex-shrink-0">✓</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedContact && (
            <Button 
              onClick={handleGiftToContact}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              🎁 Offrir à {selectedContact.name}
            </Button>
          )}
        </>
      ) : !showGiftOptions ? (
        // Main Options
        <>
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-between p-3 h-auto border-2" 
            onClick={() => {
              addToCartHandler(true);
              navigate("/cart");
              handleClose();
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Pour moi-même</p>
                <p className="text-xs text-muted-foreground">
                  Ajouter à mon panier
                </p>
              </div>
            </div>
            <span className="text-muted-foreground">→</span>
          </Button>

          <Button 
            variant="outline" 
            className="w-full flex items-center justify-between p-3 h-auto border-2" 
            onClick={handleGiftClick}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Gift className="h-4 w-4 text-pink-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Offrir en cadeau</p>
                <p className="text-xs text-muted-foreground">
                  Choisir un destinataire
                </p>
              </div>
            </div>
            <span className="text-muted-foreground">→</span>
          </Button>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 text-sm">💡</span>
              <p className="text-xs text-yellow-800">
                Vous pourrez modifier votre panier avant de finaliser
              </p>
            </div>
          </div>
        </>
      ) : (
        // Gift Options
        <>
          <p className="text-xs font-medium text-muted-foreground">Choisissez une option :</p>
          
          {preSelectedRecipient ? (
            <>
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-2.5">
                <p className="text-xs text-pink-800">
                  🎁 Cadeau pour <strong>{preSelectedRecipient.name}</strong>
                </p>
              </div>

              <Button 
                variant="outline" 
                className="w-full flex items-center justify-between p-3 h-auto border-2 border-pink-200 bg-pink-50/50" 
                onClick={handleDirectGiftToPreSelected}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Gift className="h-4 w-4 text-pink-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Offrir à {preSelectedRecipient.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Ajouter au panier
                    </p>
                  </div>
                </div>
                <span className="text-xl">💖</span>
              </Button>

              <Button 
                variant="outline" 
                className="w-full flex items-center justify-between p-3 h-auto border-2" 
                onClick={handleCollaborativeGift}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Cotisation groupée</p>
                    <p className="text-xs text-muted-foreground">
                      Collecte pour {preSelectedRecipient.name}
                    </p>
                  </div>
                </div>
                <span className="text-xl">🤝</span>
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-between p-3 h-auto border-2" 
                onClick={handleContactSelection}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Gift className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Offrir à quelqu'un</p>
                    <p className="text-xs text-muted-foreground">
                      Choisir un destinataire
                    </p>
                  </div>
                </div>
                <span className="text-xl">💖</span>
              </Button>

              <Button 
                variant="outline" 
                className="w-full flex items-center justify-between p-3 h-auto border-2" 
                onClick={handleCollaborativeGift}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Cotisation groupée</p>
                    <p className="text-xs text-muted-foreground">
                      Organiser une collecte
                    </p>
                  </div>
                </div>
                <span className="text-xl">🤝</span>
              </Button>
            </>
          )}

          <Button 
            variant="ghost" 
            onClick={handleBackToMain} 
            className="w-full text-xs text-muted-foreground h-8"
          >
            ← Retour aux options principales
          </Button>
        </>
      )}
    </div>
  );

  // Mobile: use Drawer
  if (isMobile) {
    return (
      <>
        <Drawer open={isOpen} onOpenChange={handleClose}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="relative pb-2">
              {showContactSelection && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackFromContacts} 
                  className="absolute left-2 top-2 h-8 px-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Retour
                </Button>
              )}
              <DrawerTitle className={showContactSelection ? "mt-8" : ""}>
                {showContactSelection 
                  ? "Choisir le destinataire" 
                  : "Comment commander ?"}
              </DrawerTitle>
              {!showGiftOptions && !showContactSelection && (
                <p className="text-sm text-muted-foreground">
                  Choisissez votre mode de commande
                </p>
              )}
            </DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto">
              <ModalContent />
            </div>
          </DrawerContent>
        </Drawer>

        <CollaborativeGiftModal
          isOpen={showCollaborativeModal}
          onClose={() => setShowCollaborativeModal(false)}
          onBack={handleBackFromCollaborative}
          product={product}
        />
      </>
    );
  }

  // Desktop: use Dialog
  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader className="relative">
            <DialogTitle className="text-left">
              {showContactSelection 
                ? "Choisir le destinataire" 
                : "Comment commander ?"}
            </DialogTitle>
            {showContactSelection && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackFromContacts} 
                className="absolute left-0 top-0"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
            )}
            {!showGiftOptions && !showContactSelection && (
              <p className="text-sm text-muted-foreground text-left">
                Choisissez votre mode de commande
              </p>
            )}
          </DialogHeader>
          <ModalContent />
        </DialogContent>
      </Dialog>

      <CollaborativeGiftModal
        isOpen={showCollaborativeModal}
        onClose={() => setShowCollaborativeModal(false)}
        onBack={handleBackFromCollaborative}
        product={product}
      />
    </>
  );
}
