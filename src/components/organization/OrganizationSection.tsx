import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ClipboardList, Sparkles } from 'lucide-react';
import { useOrganizationAccess } from '@/hooks/useOrganizationAccess';
import { TasksBoard } from './TasksBoard';
import { VendorsList } from './VendorsList';
import { BudgetTable } from './BudgetTable';
import { GuestsList } from './GuestsList';
import { OrganizersManager } from './OrganizersManager';
import type { OrganizationPageType, OrganizerRole } from '@/types/organization';

interface Props {
  pageType: OrganizationPageType;
  pageId: string;
  ownerUserId: string;
  pageTitle?: string;
}

/** Decides if a role can write a given resource. Admin = all. */
const canWrite = (role: OrganizerRole | null, scope: OrganizerRole) =>
  role === 'admin' || role === scope;

export const OrganizationSection = ({ pageType, pageId, ownerUserId, pageTitle }: Props) => {
  const { canManage, role, isOwner, loading } = useOrganizationAccess(pageType, pageId, ownerUserId);
  const [open, setOpen] = useState(false);

  if (loading || !canManage) return null;

  const effective: OrganizerRole = isOwner ? 'admin' : role ?? 'admin';

  return (
    <section className="px-4 py-2">
      <Card className="rounded-2xl p-4 shadow-soft border-primary/20 bg-gradient-to-br from-primary/5 via-secondary/30 to-background">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-poppins text-base font-semibold text-foreground">Mes coulisses ✨</h2>
            <p className="text-xs text-muted-foreground font-nunito">
              Préparatifs, prestataires, budget et invités — visibles par toi et ton équipe.
            </p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <ClipboardList className="h-4 w-4 mr-1" /> Ouvrir
          </Button>
        </div>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[92vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="mb-3">
            <SheetTitle className="font-poppins flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Mes coulisses
            </SheetTitle>
            <SheetDescription className="text-xs">
              {isOwner ? 'Tu es le chef d\'orchestre 🎼' : `Tu participes en tant que ${effective}`}
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="w-full overflow-x-auto flex justify-start h-auto p-1 gap-1">
              <TabsTrigger value="tasks" className="text-xs">✅ Préparatifs</TabsTrigger>
              <TabsTrigger value="vendors" className="text-xs">🎨 Prestataires</TabsTrigger>
              <TabsTrigger value="budget" className="text-xs">💰 Budget</TabsTrigger>
              <TabsTrigger value="guests" className="text-xs">💌 Invités</TabsTrigger>
              <TabsTrigger value="team" className="text-xs">💛 Équipe</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="mt-4">
              <TasksBoard pageType={pageType} pageId={pageId} canEdit={canWrite(effective, 'tasks')} />
            </TabsContent>
            <TabsContent value="vendors" className="mt-4">
              <VendorsList pageType={pageType} pageId={pageId} canEdit={canWrite(effective, 'vendors')} />
            </TabsContent>
            <TabsContent value="budget" className="mt-4">
              <BudgetTable pageType={pageType} pageId={pageId} canEdit={canWrite(effective, 'budget')} />
            </TabsContent>
            <TabsContent value="guests" className="mt-4">
              <GuestsList pageType={pageType} pageId={pageId} canEdit={canWrite(effective, 'guests')} />
            </TabsContent>
            <TabsContent value="team" className="mt-4">
              <OrganizersManager pageType={pageType} pageId={pageId} canEdit={isOwner} pageTitle={pageTitle} />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </section>
  );
};