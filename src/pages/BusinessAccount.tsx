import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Upload, 
  Settings, 
  Receipt, 
  Gift, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  MapPin,
  Truck,
  Phone,
  Bell,
  Check,
  X
} from "lucide-react";

export default function BusinessAccount() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  
  useEffect(() => {
    document.title = "Compte Business | JOIE DE VIVRE";
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Compte Business</h1>
              <p className="text-sm text-muted-foreground">Gérez votre activité commerciale</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Statut du compte */}
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Boutique Élégance</div>
              <div className="text-sm text-muted-foreground">Cocody, Abidjan</div>
            </div>
            <Badge className="bg-green-500">Actif</Badge>
          </div>
          <div className="flex gap-6 text-center mt-3">
            <div>
              <div className="text-primary font-bold">12</div>
              <div className="text-xs text-muted-foreground">Produits</div>
            </div>
            <div>
              <div className="text-primary font-bold">8</div>
              <div className="text-xs text-muted-foreground">Commandes</div>
            </div>
            <div>
              <div className="text-primary font-bold">340K</div>
              <div className="text-xs text-muted-foreground">Revenus</div>
            </div>
          </div>
        </Card>

        {/* Onglets */}
        <Tabs defaultValue="produits" className="w-full">
          <TabsList className="grid grid-cols-4 text-xs">
            <TabsTrigger value="produits" className="flex flex-col gap-1">
              <Package className="h-4 w-4" />
              <span>Produits</span>
            </TabsTrigger>
            <TabsTrigger value="commandes" className="flex flex-col gap-1">
              <ShoppingCart className="h-4 w-4" />
              <span>Commandes</span>
            </TabsTrigger>
            <TabsTrigger value="livraisons" className="flex flex-col gap-1">
              <Truck className="h-4 w-4" />
              <span>Livraisons</span>
            </TabsTrigger>
            <TabsTrigger value="finances" className="flex flex-col gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>Finances</span>
            </TabsTrigger>
          </TabsList>

          {/* Onglet Produits */}
          <TabsContent value="produits" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">Mes Produits</h2>
              <Button size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                Ajouter
              </Button>
            </div>

            {/* Upload d'images */}
            <Card className="p-4 mb-4">
              <h3 className="font-medium mb-2">Télécharger des images</h3>
              <Input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={handleFileUpload}
                className="mb-2"
              />
              <div className="text-xs text-muted-foreground">
                Formats acceptés: JPG, PNG, WebP (max 5MB par image)
              </div>
              {selectedFiles && (
                <div className="mt-2 text-sm text-green-600">
                  {selectedFiles.length} fichier(s) sélectionné(s)
                </div>
              )}
            </Card>

            {/* Liste des produits */}
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="font-medium">Bracelet Doré Élégance</div>
                  <div className="text-sm text-muted-foreground">Bijoux</div>
                  <div className="text-sm font-medium text-primary">15 000 F</div>
                </div>
                <Badge variant="secondary">En stock</Badge>
              </div>
            </Card>
          </TabsContent>

          {/* Onglet Commandes */}
          <TabsContent value="commandes" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">Commandes Récentes</h2>
              <Button size="sm" variant="outline" className="gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </Button>
            </div>

            <Card className="p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-medium">Commande #001</div>
                  <div className="text-sm text-muted-foreground">Bracelet Doré Élégance</div>
                  <div className="text-xs text-muted-foreground">09/08/2025 14:30</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">15 000 F</div>
                  <Badge className="bg-orange-500">En attente</Badge>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div><strong>Client:</strong> Fatou Bamba</div>
                <div><strong>Donateur:</strong> Kofi Asante</div>
                <div><strong>Type:</strong> Retrait sur place</div>
                <Button size="sm" className="w-full gap-2">
                  <Phone className="h-4 w-4" />
                  Appeler le client
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Onglet Livraisons */}
          <TabsContent value="livraisons" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">Gestion des Livraisons</h2>
            </div>

            {/* Options de livraison */}
            <Card className="p-4 mb-4">
              <h3 className="font-medium mb-3">Types de livraison</h3>
              
              <div className="space-y-3">
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium">Retrait sur place</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Le client vient récupérer le cadeau emballé à votre boutique
                  </div>
                  <div className="text-xs text-muted-foreground">
                    • Vous recevez une notification d'achat<br/>
                    • Vous appelez la cliente<br/>
                    • Elle se rend au lieu indiqué pour le retrait
                  </div>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-primary" />
                    <span className="font-medium">Livraison à domicile</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Livraison directe chez le client
                  </div>
                  <div className="text-xs text-muted-foreground">
                    • Frais de livraison payés par le donateur si &gt; 25 000 F<br/>
                    • Vous appelez pour connaître l'adresse<br/>
                    • Livraison dans les 24-48h
                  </div>
                </div>
              </div>
            </Card>

            {/* Livraisons en cours */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Livraisons en cours</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Livraison #L001</div>
                  <div className="text-sm text-muted-foreground">Bracelet Doré Élégance</div>
                  <div className="text-xs text-muted-foreground">Cocody, Riviera Golf</div>
                </div>
                <Badge className="bg-blue-500">En route</Badge>
              </div>
            </Card>
          </TabsContent>

          {/* Onglet Finances */}
          <TabsContent value="finances" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">Gestion Financière</h2>
              <Button size="sm" variant="outline" className="gap-2">
                <Receipt className="h-4 w-4" />
                Reçus
              </Button>
            </div>

            {/* Résumé financier */}
            <Card className="p-4 mb-4">
              <h3 className="font-medium mb-3">Résumé du mois</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Ventes brutes</span>
                  <span className="font-medium">340 000 F</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Commission plateforme (8%)</span>
                  <span className="font-medium text-red-600">-27 200 F</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-medium">Revenus nets</span>
                  <span className="font-medium text-green-600">312 800 F</span>
                </div>
              </div>
            </Card>

            {/* Bons offerts */}
            <Card className="p-4 mb-4">
              <h3 className="font-medium mb-3">Bons & Promotions</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Bon de réduction 10%</div>
                  <div className="text-sm text-muted-foreground">Valable jusqu'au 31/08/2025</div>
                </div>
                <Badge variant="outline">5 utilisés</Badge>
              </div>
            </Card>

            {/* Paramètres du compte */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-4 w-4" />
                <h3 className="font-medium">Paramètres du compte</h3>
              </div>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Informations de paiement
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Horaires d'ouverture
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Zone de livraison
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="pb-20" />
      </main>
    </div>
  );
}