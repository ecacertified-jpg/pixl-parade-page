import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  BarChart3,
  Package,
  ShoppingCart,
  Settings,
  Eye,
  Upload,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Truck,
  DollarSign,
  TrendingUp,
  Users,
  Bell,
  Download,
  Plus,
  Check,
  X,
  AlertCircle
} from "lucide-react";

export default function BusinessDashboard() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: ""
  });

  useEffect(() => {
    document.title = "Dashboard Business | JOIE DE VIVRE";
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleProductSubmit = () => {
    // Logic to add new product
    console.log("Adding product:", newProduct);
    setNewProduct({ name: "", description: "", price: "", category: "", stock: "" });
  };

  const stats = {
    totalSales: 850000,
    monthlyOrders: 42,
    activeProducts: 12,
    rating: 4.8,
    commission: 127500,
    netRevenue: 722500
  };

  const recentOrders = [
    {
      id: "CMD-001",
      product: "Bracelet Doré Élégance",
      customer: "Fatou Bamba",
      donor: "Kofi Asante",
      amount: 15000,
      status: "new",
      type: "pickup",
      date: "2025-01-11 14:30"
    },
    {
      id: "CMD-002", 
      product: "Parfum Roses de Yamoussoukro",
      customer: "Aisha Traoré",
      donor: "Mamadou Diallo",
      amount: 35000,
      status: "confirmed",
      type: "delivery",
      date: "2025-01-11 10:15"
    }
  ];

  const products = [
    {
      id: 1,
      name: "Bracelet Doré Élégance",
      category: "Bijoux",
      price: 15000,
      stock: 8,
      sales: 24,
      status: "active"
    },
    {
      id: 2,
      name: "Parfum Roses de Yamoussoukro",
      category: "Parfums",
      price: 35000,
      stock: 5,
      sales: 12,
      status: "active"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-orange-500";
      case "confirmed": return "bg-blue-500";
      case "preparing": return "bg-yellow-500";
      case "ready": return "bg-green-500";
      case "delivered": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "new": return "Nouvelle";
      case "confirmed": return "Confirmée";
      case "preparing": return "En préparation";
      case "ready": return "Prêt";
      case "delivered": return "Livré";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
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
              <h1 className="text-xl font-semibold">Dashboard Business</h1>
              <p className="text-sm text-muted-foreground">Boutique Élégance - Cocody, Abidjan</p>
            </div>
            <Badge className="ml-auto bg-green-500">Actif</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-5 text-xs">
            <TabsTrigger value="overview" className="flex flex-col gap-1">
              <Eye className="h-4 w-4" />
              <span>Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex flex-col gap-1">
              <Package className="h-4 w-4" />
              <span>Produits</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex flex-col gap-1">
              <ShoppingCart className="h-4 w-4" />
              <span>Commandes</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex flex-col gap-1">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col gap-1">
              <Settings className="h-4 w-4" />
              <span>Paramètres</span>
            </TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ventes totales</p>
                    <p className="text-2xl font-bold">{stats.totalSales.toLocaleString()} F</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Commandes du mois</p>
                    <p className="text-2xl font-bold">{stats.monthlyOrders}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-blue-500" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Produits actifs</p>
                    <p className="text-2xl font-bold">{stats.activeProducts}</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-500" />
                </div>
              </Card>
            </div>

            {/* Commission et revenus */}
            <Card className="p-4 mb-6">
              <h3 className="font-semibold mb-4">Résumé financier</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Ventes brutes</span>
                  <span className="font-medium">{stats.totalSales.toLocaleString()} F</span>
                </div>
                <div className="flex justify-between">
                  <span>Commission JOIE DE VIVRE (15%)</span>
                  <span className="font-medium text-red-600">-{stats.commission.toLocaleString()} F</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-medium">Revenus nets</span>
                  <span className="font-medium text-green-600">{stats.netRevenue.toLocaleString()} F</span>
                </div>
              </div>
            </Card>

            {/* Commandes récentes */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Commandes récentes</h3>
                <Button size="sm" variant="outline">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
              </div>
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{order.id}</div>
                        <div className="text-sm text-muted-foreground">{order.product}</div>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <div><strong>Client:</strong> {order.customer}</div>
                      <div><strong>Donateur:</strong> {order.donor}</div>
                      <div><strong>Montant:</strong> {order.amount.toLocaleString()} F</div>
                      <div className="flex items-center gap-2">
                        <strong>Type:</strong> 
                        {order.type === "pickup" ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Retrait sur place
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            Livraison {order.amount > 25000 && "(Gratuite)"}
                          </span>
                        )}
                      </div>
                    </div>
                    {order.status === "new" && (
                      <Button size="sm" className="w-full mt-2">
                        <Phone className="h-4 w-4 mr-2" />
                        Appeler le client
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Gestion des produits */}
          <TabsContent value="products" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Gestion des produits</h2>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un produit
              </Button>
            </div>

            {/* Formulaire d'ajout de produit */}
            <Card className="p-4 mb-6">
              <h3 className="font-medium mb-4">Ajouter un nouveau produit</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Nom du produit</label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="Ex: Bracelet Doré Élégance"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Catégorie</label>
                  <Select value={newProduct.category} onValueChange={(value) => setNewProduct({...newProduct, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bijoux">Bijoux</SelectItem>
                      <SelectItem value="parfums">Parfums</SelectItem>
                      <SelectItem value="tech">Tech</SelectItem>
                      <SelectItem value="mode">Mode</SelectItem>
                      <SelectItem value="artisanat">Artisanat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Prix (FCFA)</label>
                  <Input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    placeholder="15000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Stock</label>
                  <Input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                    placeholder="10"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Description détaillée du produit..."
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Images du produit</label>
                <Input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                {selectedFiles && (
                  <p className="text-sm text-green-600 mt-1">
                    {selectedFiles.length} fichier(s) sélectionné(s)
                  </p>
                )}
              </div>
              <Button onClick={handleProductSubmit} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Ajouter le produit
              </Button>
            </Card>

            {/* Liste des produits existants */}
            <Card className="p-4">
              <h3 className="font-medium mb-4">Mes produits ({products.length})</h3>
              <div className="space-y-3">
                {products.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.category}</div>
                        <div className="text-sm font-medium text-primary mt-1">
                          {product.price.toLocaleString()} F
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">Stock: {product.stock}</div>
                        <div className="text-sm text-muted-foreground">{product.sales} ventes</div>
                        <Badge variant="secondary" className="mt-1">En stock</Badge>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Gestion des commandes */}
          <TabsContent value="orders" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Gestion des commandes</h2>
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="new">Nouvelles</SelectItem>
                    <SelectItem value="confirmed">Confirmées</SelectItem>
                    <SelectItem value="preparing">En préparation</SelectItem>
                    <SelectItem value="ready">Prêtes</SelectItem>
                    <SelectItem value="delivered">Livrées</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conseils pour les modes de retrait/livraison */}
            <Card className="p-4 mb-6 border-blue-200 bg-blue-50/50">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 mb-2">Conseils pour la gestion des commandes</h3>
                  <div className="text-sm text-blue-800 space-y-2">
                    <div><strong>Retrait sur place:</strong> Appelez immédiatement le client pour confirmer et indiquer l'adresse exacte de votre boutique.</div>
                    <div><strong>Livraison:</strong> Contactez le client pour confirmer l'adresse. Livraison gratuite si montant &gt; 25 000 FCFA.</div>
                    <div><strong>Délais:</strong> Préparez les commandes dans les 24h pour maintenir votre réputation.</div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-semibold text-lg">{order.id}</div>
                      <div className="text-sm text-muted-foreground">{order.date}</div>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium mb-2">Détails de la commande</h4>
                      <div className="space-y-1 text-sm">
                        <div><strong>Produit:</strong> {order.product}</div>
                        <div><strong>Montant:</strong> {order.amount.toLocaleString()} F</div>
                        <div><strong>Client:</strong> {order.customer}</div>
                        <div><strong>Donateur:</strong> {order.donor}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Mode de récupération</h4>
                      <div className="flex items-center gap-2 mb-2">
                        {order.type === "pickup" ? (
                          <>
                            <MapPin className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Retrait sur place</span>
                          </>
                        ) : (
                          <>
                            <Truck className="h-4 w-4 text-green-500" />
                            <span className="text-sm">
                              Livraison {order.amount > 25000 && "(Gratuite)"}
                            </span>
                          </>
                        )}
                      </div>
                      {order.type === "delivery" && order.amount <= 25000 && (
                        <div className="text-xs text-orange-600">
                          Frais de livraison à la charge du donateur
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {order.status === "new" && (
                      <>
                        <Button size="sm" className="flex-1">
                          <Phone className="h-4 w-4 mr-2" />
                          Appeler le client
                        </Button>
                        <Button size="sm" variant="outline">
                          <Check className="h-4 w-4 mr-2" />
                          Confirmer
                        </Button>
                      </>
                    )}
                    {order.status === "confirmed" && (
                      <Button size="sm" className="flex-1">
                        Marquer en préparation
                      </Button>
                    )}
                    {order.status === "preparing" && (
                      <Button size="sm" className="flex-1">
                        Marquer comme prêt
                      </Button>
                    )}
                    {order.status === "ready" && (
                      <Button size="sm" className="flex-1">
                        Marquer comme livré/retiré
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="mt-6">
            <h2 className="text-xl font-semibold mb-6">Analytics & Statistiques</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Statistiques des ventes par produit */}
              <Card className="p-4">
                <h3 className="font-medium mb-4">Ventes par produit</h3>
                <div className="space-y-3">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <span className="text-sm">{product.name}</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">{product.sales} ventes</div>
                        <div className="text-xs text-muted-foreground">
                          {(product.sales * product.price).toLocaleString()} F
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Répartition des modes de livraison */}
              <Card className="p-4">
                <h3 className="font-medium mb-4">Modes de récupération</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Retrait sur place</span>
                    </div>
                    <span className="text-sm font-medium">65%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Livraison</span>
                    </div>
                    <span className="text-sm font-medium">35%</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Performance mensuelle */}
            <Card className="p-4">
              <h3 className="font-medium mb-4">Performance mensuelle</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">42</div>
                  <div className="text-sm text-muted-foreground">Commandes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">850K</div>
                  <div className="text-sm text-muted-foreground">Revenus (F)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">4.8</div>
                  <div className="text-sm text-muted-foreground">Note moyenne</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">97%</div>
                  <div className="text-sm text-muted-foreground">Satisfaction</div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Paramètres */}
          <TabsContent value="settings" className="mt-6">
            <h2 className="text-xl font-semibold mb-6">Paramètres du compte</h2>
            
            <div className="space-y-6">
              {/* Informations de base */}
              <Card className="p-4">
                <h3 className="font-medium mb-4">Informations de la boutique</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nom de la boutique</label>
                    <Input defaultValue="Boutique Élégance" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Téléphone</label>
                    <Input defaultValue="+225 01 23 45 67 89" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1 block">Adresse</label>
                    <Input defaultValue="Cocody, Riviera Golf, Abidjan" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1 block">Description</label>
                    <Textarea defaultValue="Boutique spécialisée dans les bijoux et accessoires de luxe." />
                  </div>
                </div>
              </Card>

              {/* Paramètres de livraison */}
              <Card className="p-4">
                <h3 className="font-medium mb-4">Paramètres de livraison</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Zone de livraison (km)</label>
                    <Input type="number" defaultValue="15" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Frais de livraison standard (FCFA)</label>
                    <Input type="number" defaultValue="2000" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Les frais de livraison sont gratuits pour les commandes supérieures à 25 000 FCFA
                  </div>
                </div>
              </Card>

              {/* Horaires d'ouverture */}
              <Card className="p-4">
                <h3 className="font-medium mb-4">Horaires d'ouverture</h3>
                <div className="space-y-3">
                  {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((day) => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-20 text-sm">{day}</div>
                      <Input type="time" defaultValue="09:00" className="w-32" />
                      <span>-</span>
                      <Input type="time" defaultValue="18:00" className="w-32" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Informations bancaires */}
              <Card className="p-4">
                <h3 className="font-medium mb-4">Informations de paiement</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Numéro Mobile Money</label>
                    <Input placeholder="+225 01 23 45 67 89" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nom du titulaire</label>
                    <Input placeholder="Nom complet" />
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <div className="flex gap-4">
                <Button className="flex-1">
                  Sauvegarder les modifications
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Télécharger les données
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="pb-20" />
      </main>
    </div>
  );
}