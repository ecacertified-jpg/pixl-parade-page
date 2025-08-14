import { useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CalendarDays, Gift, PiggyBank, Plus, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = "Mon Tableau de Bord | JOIE DE VIVRE";
  }, []);

  return <div className="min-h-screen bg-gradient-background">
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Mon Tableau de Bord</h1>
              <p className="text-sm text-muted-foreground">Gérez vos relations et événements</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Carte résumé */}
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Utilisateur Démo</div>
              <div className="text-sm text-muted-foreground">Abidjan, Côte d'Ivoire</div>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-primary font-bold">3</div>
                <div className="text-xs text-muted-foreground">Amis</div>
              </div>
              <div>
                <div className="text-primary font-bold">1</div>
                <div className="text-xs text-muted-foreground">Reçus</div>
              </div>
              <div>
                <div className="text-primary font-bold">1</div>
                <div className="text-xs text-muted-foreground">Offerts</div>
              </div>
            </div>
          </div>
        </Card>

        {/* CTA Business */}
        <Card className="p-4 mb-4 bg-green-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold bg-green-100">Vous êtes commerçant ?</div>
              <div className="text-sm text-muted-foreground">Vendez vos produits sur JOIE DE VIVRE</div>
            </div>
            <Button 
              variant="secondary" 
              className="font-medium mx-0 bg-green-600 hover:bg-green-500 my-[4px] text-center px-[8px] py-[10px]"
              onClick={() => navigate('/business-account')}
            >
              Compte Business
            </Button>
          </div>
        </Card>

        {/* Onglets */}
        <Tabs defaultValue="amis" className="w-full">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="amis" className="flex gap-2 bg-zinc-50"><Users className="h-4 w-4" aria-hidden />Amis</TabsTrigger>
            <TabsTrigger value="evenements" className="flex gap-2"><CalendarDays className="h-4 w-4" aria-hidden />Événements</TabsTrigger>
            <TabsTrigger value="cadeaux" className="flex gap-2"><Gift className="h-4 w-4" aria-hidden />Cadeaux</TabsTrigger>
            <TabsTrigger value="cotisations" className="flex gap-2"><PiggyBank className="h-4 w-4" aria-hidden />Cotisations</TabsTrigger>
          </TabsList>

          <TabsContent value="amis" className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-base">Mes Amis & Donateurs</h2>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" aria-hidden />Ajouter</Button>
            </div>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Fatou Bamba</div>
                  <div className="text-xs text-muted-foreground">Cocody, Abidjan</div>
                </div>
                <Badge>Donateur</Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Anniversaire dans 220 jours</div>
            </Card>
          </TabsContent>

          <TabsContent value="evenements" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">Événements à Venir</h2>
              <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter
              </Button>
            </div>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Anniversaire de Fatou</div>
                    <div className="text-xs text-muted-foreground">samedi 9 août 2025</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    2j
                  </Badge>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Dans 2 jour(s)</div>
            </Card>
          </TabsContent>

          <TabsContent value="cadeaux" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">Historique des Cadeaux</h2>
              <Button 
                size="sm" 
                className="gap-2 bg-pink-500 text-white hover:bg-pink-600"
                onClick={() => navigate('/gifts')}
              >
                <Gift className="h-4 w-4" aria-hidden />
                Voir tout
              </Button>
            </div>
            
            {/* Filtres */}
            <div className="flex gap-2 mb-4">
              <Button variant="default" size="sm" className="bg-primary text-primary-foreground">
                Tous (2)
              </Button>
              <Button variant="outline" size="sm">
                Reçus (1)
              </Button>
              <Button variant="outline" size="sm">
                Offerts (1)
              </Button>
            </div>

            {/* Cadeau principal reçu */}
            <Card className="p-4 mb-4 border-green-200 bg-green-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Gift className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Bracelet Doré Élégance</div>
                  <div className="text-xs text-muted-foreground">Promotion professionnelle</div>
                  <div className="text-xs text-muted-foreground">31/07/2025</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">15 000 F</div>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Reçu de :</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs text-white">F</div>
                      <span className="text-sm">Fatou Bamba</span>
                    </div>
                    <span className="text-sm font-medium">8000 F</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">K</div>
                      <span className="text-sm">Kofi Asante</span>
                    </div>
                    <span className="text-sm font-medium">7000 F</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Cadeau principal */}
            <Card className="p-4 mb-4 border-blue-200 bg-blue-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Gift className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Parfum Roses de Yamoussoukro</div>
                  <div className="text-xs text-muted-foreground">Anniversaire</div>
                  <div className="text-xs text-muted-foreground">18/07/2025</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">28 000 F</div>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-600">Offert à :</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs text-white">F</div>
                  <span className="text-sm">Fatou Bamba</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="cotisations" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">Cotisations Groupées</h2>
              <Button size="sm" className="gap-2 bg-green-500 text-white hover:bg-green-600">
                <Plus className="h-4 w-4" aria-hidden />
                Cotiser
              </Button>
            </div>
            
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Cadeau pour la promotion d'Aisha</h3>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">Initiateur</Badge>
                  <Badge className="text-xs bg-green-500">Actif</Badge>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground mb-3">Pour: Aisha Traoré</div>
              
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progression</span>
                  <span className="font-medium">35 000 / 50 000 F</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">70% atteint</div>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-2">Contributeurs (3):</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-white">M</div>
                      <span className="text-sm">Moi</span>
                    </div>
                    <span className="text-sm font-medium">15 000 F</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs text-white">F</div>
                      <span className="text-sm">Fatou Bamba</span>
                    </div>
                    <span className="text-sm font-medium">12 000 F</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">K</div>
                      <span className="text-sm">Kofi Asante</span>
                    </div>
                    <span className="text-sm font-medium">8 000 F</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="pb-20" />
      </main>
    </div>;
}