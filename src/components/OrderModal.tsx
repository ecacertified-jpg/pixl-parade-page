import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Gift, Users, Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CollaborativeGiftModal } from "./CollaborativeGiftModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
}
interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}
export function OrderModal({
  isOpen,
  onClose,
  product
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
  useEffect(() => {
    if (showContactSelection) {
      loadContacts();
    }
  }, [showContactSelection]);

  const loadContacts = async () => {
    try {
      // Vérifier la session Supabase réelle
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
        // Gérer les erreurs d'autorisation JWT
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
    // Validate that product has a valid UUID
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
      name: product.name,
      price: product.price,
      image: product.image,
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
      // Vérifier la session Supabase réelle (pas juste l'état React)
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
    if (selectedContact) {
      // Ajouter le cadeau au panier
      addToCartHandler(false, selectedContact);
      
      // Naviguer vers le panier
      navigate("/cart");
      handleClose();
    }
  };
  return <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="relative">
          
          <DialogTitle className="text-left">
            {showContactSelection ? "Choisir le destinataire" : showGiftOptions ? "Comment commander ?" : "Comment commander ?"}
          </DialogTitle>
          {showContactSelection && (
            <Button variant="ghost" size="sm" onClick={handleBackFromContacts} className="absolute left-0 top-0">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          )}
          {!showGiftOptions && !showContactSelection && <p className="text-sm text-muted-foreground text-left">
              Choisissez votre mode de commande
            </p>}
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Info */}
          <div className="flex items-center gap-3">
            <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-lg" />
            <div className="flex-1">
              <h3 className="font-medium">{product.name}</h3>
              {(showGiftOptions || showContactSelection) && <p className="text-sm text-muted-foreground">{product.description}</p>}
              <p className="text-primary font-bold">
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

              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedContact?.id === contact.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleContactSelect(contact)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {contact.relationship || 'Ami'}
                        </p>
                        {contact.birthday && (
                          <p className="text-xs text-primary">
                            Anniversaire dans {Math.ceil((new Date(contact.birthday).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} jour(s)
                          </p>
                        )}
                      </div>
                      {selectedContact?.id === contact.id && (
                        <div className="text-primary">✓</div>
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
          ) : !showGiftOptions ?
        // Main Options
        <>
               <Button variant="outline" className="w-full flex items-center justify-between p-4 h-auto border-2" onClick={() => {
                addToCartHandler(true);
                navigate("/cart");
                handleClose();
              }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Pour moi-même</p>
                    <p className="text-sm text-muted-foreground">
                      Ajouter directement à mon panier
                    </p>
                  </div>
                </div>
                <span className="text-muted-foreground">→</span>
              </Button>

              <Button variant="outline" className="w-full flex items-center justify-between p-4 h-auto border-2" onClick={handleGiftClick}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <Gift className="h-5 w-5 text-pink-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Offrir en cadeau</p>
                    <p className="text-sm text-muted-foreground">
                      Choisir un destinataire pour ce cadeau
                    </p>
                  </div>
                </div>
                <span className="text-muted-foreground">→</span>
              </Button>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600">💡</span>
                  <p className="text-sm text-yellow-800">
                    Vous pourrez modifier votre panier avant de finaliser votre commande
                  </p>
                </div>
              </div>
            </> :
        // Gift Options
        <>
              <p className="text-sm font-medium">Choisissez une option :</p>
              
              <Button variant="outline" className="w-full flex items-center justify-between p-4 h-auto border-2" onClick={handleContactSelection}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Gift className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Offrir à quelqu'un</p>
                    <p className="text-sm text-muted-foreground">
                      Choisir un destinataire
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💖</span>
                </div>
              </Button>

              <Button variant="outline" className="w-full flex items-center justify-between p-4 h-auto border-2" onClick={handleCollaborativeGift}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Cotisation groupée</p>
                    <p className="text-sm text-muted-foreground">
                      Organiser une collecte
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🤝</span>
                </div>
              </Button>

              <Button variant="ghost" onClick={handleBackToMain} className="w-full text-sm text-muted-foreground">
                ← Retour aux options principales
              </Button>
            </>}
        </div>
      </DialogContent>

      <CollaborativeGiftModal
        isOpen={showCollaborativeModal}
        onClose={() => setShowCollaborativeModal(false)}
        onBack={handleBackFromCollaborative}
        product={product}
      />
    </Dialog>;
}