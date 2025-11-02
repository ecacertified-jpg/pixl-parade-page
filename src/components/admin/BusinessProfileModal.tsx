import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Mail, Phone, MapPin, Globe, Package, TrendingUp } from "lucide-react";

interface BusinessProfile {
  id: string;
  business_name: string;
  business_type: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  email: string | null;
  logo_url: string | null;
  website_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

interface BusinessProfileModalProps {
  businessId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BusinessProfileModal({ businessId, open, onOpenChange }: BusinessProfileModalProps) {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [productsCount, setProductsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  
  useEffect(() => {
    if (open && businessId) {
      fetchBusinessProfile();
      fetchStats();
    }
  }, [open, businessId]);
  
  const fetchBusinessProfile = async () => {
    if (!businessId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('*')
        .eq('id', businessId)
        .single();
      
      if (error) throw error;
      setBusiness(data);
    } catch (error) {
      console.error('Error fetching business profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStats = async () => {
    if (!businessId) return;
    
    try {
      const [productsResult, ordersResult] = await Promise.all([
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId),
        supabase
          .from('business_orders')
          .select('id', { count: 'exact', head: true })
          .eq('business_account_id', businessId)
      ]);
      
      setProductsCount(productsResult.count || 0);
      setOrdersCount(ordersResult.count || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  if (!business) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Profil du prestataire
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="products">Produits ({productsCount})</TabsTrigger>
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{business.business_name}</h3>
                  <div className="flex gap-2">
                    {business.is_verified && (
                      <Badge variant="default">Vérifié</Badge>
                    )}
                    {business.is_active ? (
                      <Badge variant="default">Actif</Badge>
                    ) : (
                      <Badge variant="destructive">Inactif</Badge>
                    )}
                  </div>
                </div>
                
                {business.business_type && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{business.business_type}</span>
                  </div>
                )}
                
                {business.description && (
                  <p className="text-sm text-muted-foreground">{business.description}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  {business.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${business.email}`} className="text-primary hover:underline">
                        {business.email}
                      </a>
                    </div>
                  )}
                  
                  {business.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${business.phone}`} className="text-primary hover:underline">
                        {business.phone}
                      </a>
                    </div>
                  )}
                  
                  {business.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{business.address}</span>
                    </div>
                  )}
                  
                  {business.website_url && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={business.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Voir le site web
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t text-xs text-muted-foreground">
                  Inscrit le {new Date(business.created_at).toLocaleDateString('fr-FR')}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Produits et services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {productsCount === 0 
                      ? "Aucun produit disponible pour le moment" 
                      : `${productsCount} produit${productsCount > 1 ? 's' : ''} disponible${productsCount > 1 ? 's' : ''}`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Produits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">{productsCount}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Commandes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">{ordersCount}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Statut
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={business.is_active ? "default" : "destructive"} className="text-sm">
                    {business.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
