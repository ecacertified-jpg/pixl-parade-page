import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, User, Gift, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CollaborativeGiftModal } from "./CollaborativeGiftModal";
interface Product {
  id: number;
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
  const navigate = useNavigate();
  const { toast } = useToast();
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
    onClose();
  };

  const handleCollaborativeGift = () => {
    setShowCollaborativeModal(true);
  };

  const handleBackFromCollaborative = () => {
    setShowCollaborativeModal(false);
  };
  return <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="relative">
          
          <DialogTitle className="text-left">
            {showGiftOptions ? "Comment commander ?" : "Comment commander ?"}
          </DialogTitle>
          {!showGiftOptions && <p className="text-sm text-muted-foreground text-left">
              Choisissez votre mode de commande
            </p>}
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Info */}
          <div className="flex items-center gap-3">
            <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-lg" />
            <div className="flex-1">
              <h3 className="font-medium">{product.name}</h3>
              {showGiftOptions && <p className="text-sm text-muted-foreground">{product.description}</p>}
              <p className="text-primary font-bold">
                {product.price.toLocaleString()} {product.currency}
              </p>
            </div>
          </div>

          {!showGiftOptions ?
        // Main Options
        <>
              <Button variant="outline" className="w-full flex items-center justify-between p-4 h-auto border-2" onClick={() => {
                toast({
                  title: "Ajouté au panier",
                  description: `${product.name} a été ajouté à votre panier`
                });
                navigate("/cart");
                onClose();
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
              
              <Button variant="outline" className="w-full flex items-center justify-between p-4 h-auto border-2" onClick={() => console.log("Offrir à quelqu'un")}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Gift className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Offrir à quelqu'un</p>
                    <p className="text-sm text-muted-foreground">
                      Voir les favoris de mes amis
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