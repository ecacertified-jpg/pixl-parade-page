import { useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CalendarDays, Gift, PiggyBank, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
export default function Dashboard() {
  useEffect(() => {
    document.title = "Mon Tableau de Bord | JOIE DE VIVRE";
  }, []);
  return <div className="min-h-screen bg-gradient-background">
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold">Mon Tableau de Bord</h1>
          <p className="text-sm text-muted-foreground">Gérez vos relations et événements</p>
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
            <Button variant="secondary" className="font-medium my-0 mx-0 bg-green-600 hover:bg-green-500 px-[11px] py-[9px]">Compte Business</Button>
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
            <Card className="p-6 text-sm text-muted-foreground">Vos événements à venir s’afficheront ici.</Card>
          </TabsContent>

          <TabsContent value="cadeaux" className="mt-4">
            <Card className="p-6 text-sm text-muted-foreground">Votre liste de cadeaux s’affichera ici.</Card>
          </TabsContent>

          <TabsContent value="cotisations" className="mt-4">
            <Card className="p-6 text-sm text-muted-foreground">Vos cagnottes et contributions s’afficheront ici.</Card>
          </TabsContent>
        </Tabs>

        <div className="pb-20" />
      </main>
    </div>;
}