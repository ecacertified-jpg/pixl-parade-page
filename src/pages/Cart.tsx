import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
interface CartItem {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  quantity: number;
  isCollaborativeGift?: boolean;
  beneficiaryName?: string;
  beneficiaryId?: string;
  productId?: number;
}
export default function Cart() {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    } else {
      // Default item if no cart
      setCartItems([{
        id: 1,
        name: "Bracelet Doré Élégance",
        description: "Bracelet en or 18 carats avec finitions délicates",
        price: 15000,
        currency: "F",
        image: "/lovable-uploads/1c257532-9180-4894-83a0-d853a23a3bc1.png",
        quantity: 1
      }]);
    }
  }, []);
  const FREE_SHIPPING_THRESHOLD = 25000;
  const SHIPPING_COST = 2500;
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shippingCost;
  const progressToFreeShipping = Math.min(subtotal / FREE_SHIPPING_THRESHOLD * 100, 100);
  const remainingForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
  const updateQuantity = (id: number, newQuantity: number) => {
    const updatedItems = newQuantity === 0 ? cartItems.filter(item => item.id !== id) : cartItems.map(item => item.id === id ? {
      ...item,
      quantity: newQuantity
    } : item);
    setCartItems(updatedItems);
    localStorage.setItem('cart', JSON.stringify(updatedItems));
    if (newQuantity === 0) {
      toast({
        title: "Article supprimé",
        description: "L'article a été retiré de votre panier"
      });
    }
  };
  const proceedToCheckout = () => {
    // Check if there are collaborative gifts
    const hasCollaborativeGifts = cartItems.some(item => item.isCollaborativeGift);
    
    // Store cart items for checkout
    localStorage.setItem('checkoutItems', JSON.stringify(cartItems));
    
    if (hasCollaborativeGifts) {
      navigate("/collective-checkout");
    } else {
      navigate("/checkout");
    }
  };
  const addAnotherItem = () => {
    navigate("/shop");
  };
  return <div className="min-h-screen bg-gradient-background">
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Mon panier ({cartItems.length} article{cartItems.length > 1 ? 's' : ''})</h1>
              
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Offline mode notification */}
        

        {/* Free shipping progress */}
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-orange-600">🚚</span>
            <span className="text-sm font-medium">
              {remainingForFreeShipping > 0 ? `Livraison gratuite dès ${FREE_SHIPPING_THRESHOLD.toLocaleString()} F` : "Livraison gratuite débloquée !"}
            </span>
          </div>
          {remainingForFreeShipping > 0 && <p className="text-xs text-muted-foreground mb-2">
              Plus que {remainingForFreeShipping.toLocaleString()} F
            </p>}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-300" style={{
            width: `${progressToFreeShipping}%`
          }} />
          </div>
        </Card>

        {/* Delivery advice */}
        <Card className="p-3 mb-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-2">
            <span className="text-blue-600">📍</span>
            <div>
              <p className="text-sm font-medium text-blue-800">Conseil pour une livraison rapide</p>
              <p className="text-xs text-blue-700">
                Choisissez des produits dans le même quartier pour réduire les délais de livraison
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Produits de vos commandes :<br />
                📍 Bijouterie Précieuse • Plateau, Abidjan
              </p>
            </div>
          </div>
        </Card>

        {/* Add another item button */}
        <Button variant="outline" className="w-full mb-6 gap-2" onClick={addAnotherItem}>
          <Plus className="h-4 w-4" />
          Ajouter une autre commande
        </Button>

        {/* Cart items */}
        <div className="space-y-4 mb-6">
          {cartItems.map(item => <Card key={item.id} className="overflow-hidden">
              <div className="flex">
                <div className="w-16 h-16 bg-muted">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      {item.isCollaborativeGift && <div className="flex items-center gap-1 text-xs text-primary mb-1">
                          <span>🎁</span>
                          <span>Cadeau pour {item.beneficiaryName}</span>
                        </div>}
                      <p className="text-xs text-muted-foreground mb-1">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>📍</span>
                        <span>Bijouterie Précieuse • Plateau, Abidjan</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => updateQuantity(item.id, 0)} className="p-1 h-auto text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {!item.isCollaborativeGift ? <div className="flex items-center border rounded-lg">
                        <Button variant="ghost" size="sm" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-8 w-8 p-0">
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="px-3 py-1 text-sm">{item.quantity}</span>
                        <Button variant="ghost" size="sm" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-8 w-8 p-0">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div> : <span className="text-xs text-muted-foreground">Cotisation groupée</span>}
                    <p className="font-bold">{(item.price * item.quantity).toLocaleString()} {item.currency}</p>
                  </div>
                </div>
              </div>
            </Card>)}
        </div>

        {/* Order summary */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-3">Résumé de commande</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>{subtotal.toLocaleString()} F</span>
            </div>
            <div className="flex justify-between">
              <span>Livraison</span>
              <span>{shippingCost === 0 ? "Gratuit" : `${shippingCost.toLocaleString()} F`}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg text-primary">
              <span>Total</span>
              <span>{total.toLocaleString()} F</span>
            </div>
          </div>
        </Card>

        {/* Checkout button */}
        <Button onClick={proceedToCheckout} className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium py-3 rounded-lg">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Passer commande - {total.toLocaleString()} F
        </Button>

        <div className="pb-20" />
      </main>
    </div>;
}