import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, ArrowLeft, Heart, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url?: string;
  business_owner_id: string;
}

interface BusinessCollaborativeGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  businessId: string;
  onBack: () => void;
}

export function BusinessCollaborativeGiftModal({
  isOpen,
  onClose,
  product,
  businessId,
  onBack
}: BusinessCollaborativeGiftModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showOutsideZone, setShowOutsideZone] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch users when modal opens or when zone filter changes
  useEffect(() => {
    if (isOpen && businessId) {
      loadUsers();
    }
  }, [isOpen, businessId, searchTerm, showOutsideZone]);

  const loadUsers = async () => {
    if (!businessId) return;

    setIsLoading(true);
    try {
      const functionName = showOutsideZone 
        ? 'find_users_outside_delivery_zones'
        : 'find_users_in_delivery_zones';
        
      const { data, error } = await supabase.rpc(functionName, {
        p_business_id: businessId,
        p_search_term: searchTerm || null
      });

      if (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les utilisateurs disponibles",
          variant: "destructive"
        });
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs disponibles",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };

  const handleCreateFund = async () => {
    if (!selectedUser || !product || !businessId) return;

    setIsCreating(true);
    try {
      const title = `${product.name} pour ${selectedUser.first_name} ${selectedUser.last_name}`;
      const description = `Cotisation organisée pour offrir ${product.name} à ${selectedUser.first_name} ${selectedUser.last_name}`;
      
      const { data: fundId, error } = await supabase.rpc('create_business_collective_fund', {
        p_business_id: businessId,
        p_product_id: product.id,
        p_beneficiary_user_id: selectedUser.user_id,
        p_title: title,
        p_description: description,
        p_target_amount: product.price,
        p_currency: product.currency || 'XOF',
        p_occasion: 'Cadeau offert par commerce'
      });

      if (error) {
        console.error('Erreur lors de la création de la cotisation:', error);
        toast({
          title: "Erreur",
          description: error.message || "Impossible de créer la cotisation",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Cotisation créée ! 🎉",
        description: `Cotisation créée pour ${selectedUser.first_name} ${selectedUser.last_name}. Les notifications seront envoyées à ses proches.`
      });

      // Refresh the business funds list to show the new fund
      window.dispatchEvent(new Event('refresh-business-funds'));

      onClose();
    } catch (error) {
      console.error('Erreur lors de la création de la cotisation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la cotisation",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getDisplayName = (user: User) => {
    return `${user.first_name} ${user.last_name}`.trim() || user.email || 'Utilisateur';
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
              Créer une cotisation pour
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Info */}
          <div className="bg-accent/50 rounded-lg p-3 border">
            <div className="flex items-center gap-3">
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-12 h-12 rounded object-cover"
                />
              )}
              <div>
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {product.price.toLocaleString()} {product.currency || 'XOF'}
                </p>
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Zone Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={!showOutsideZone ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOutsideZone(false)}
              className="flex-1"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Dans votre zone
            </Button>
            <Button
              type="button"
              variant={showOutsideZone ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOutsideZone(true)}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              Hors de votre zone
            </Button>
          </div>

          {/* Users List */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Chargement des utilisateurs...</div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <div className="text-muted-foreground">
                  {searchTerm ? "Aucun utilisateur trouvé" : "Aucun utilisateur disponible"}
                </div>
                {!searchTerm && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Les utilisateurs dans votre zone de livraison apparaîtront ici
                  </div>
                )}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.user_id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedUser?.user_id === user.user_id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent'
                  }`}
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">
                      {user.first_name?.charAt(0) || user.email?.charAt(0) || '?'}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{getDisplayName(user)}</h3>
                      {selectedUser?.user_id === user.user_id && (
                        <Heart className="h-4 w-4 text-red-500 fill-current ml-auto" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {user.email && (
                        <span>{user.email}</span>
                      )}
                      {user.phone && (
                        <span>• {user.phone}</span>
                      )}
                    </div>
                    {user.address && (
                      <div className="flex items-center gap-1 text-xs text-purple-600">
                        <MapPin className="h-3 w-3" />
                        <span>Zone de livraison</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Selected User Action */}
          {selectedUser && (
            <div className="bg-accent/50 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {selectedUser.first_name?.charAt(0) || selectedUser.email?.charAt(0) || '?'}
                  </span>
                </div>
                <span className="font-medium">{getDisplayName(selectedUser)}</span>
              </div>
              
              <Button
                onClick={handleCreateFund}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
              >
                <Heart className="h-4 w-4 mr-2" />
                {isCreating ? "Création..." : `Créer une cotisation pour ${selectedUser.first_name || 'cette personne'}`}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-2">
                Les proches de {selectedUser.first_name || 'cette personne'} recevront des notifications pour contribuer
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}