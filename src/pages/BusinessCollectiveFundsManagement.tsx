import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessCollectiveFunds } from "@/hooks/useBusinessCollectiveFunds";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Trash2, Eye, Gift, Users, Calendar, Loader2, Package, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function BusinessCollectiveFundsManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { funds, loading, refreshFunds } = useBusinessCollectiveFunds();
  const [deletingFundId, setDeletingFundId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fundToDelete, setFundToDelete] = useState<typeof funds[0] | null>(null);

  const handleDeleteFund = async () => {
    if (!fundToDelete) return;

    try {
      setIsDeleting(true);

      // Delete from business_collective_funds first (the link table)
      const { error: linkError } = await supabase
        .from('business_collective_funds')
        .delete()
        .eq('id', fundToDelete.id);

      if (linkError) throw linkError;

      // Then delete the collective fund itself
      const { error: fundError } = await supabase
        .from('collective_funds')
        .delete()
        .eq('id', fundToDelete.fund_id);

      if (fundError) {
        console.error('Error deleting collective fund:', fundError);
        // The link is already deleted, so we can continue
      }

      toast({
        title: "Cagnotte supprimée",
        description: "La cagnotte a été supprimée avec succès",
      });

      refreshFunds();
    } catch (error) {
      console.error('Error deleting fund:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la cagnotte",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setFundToDelete(null);
    }
  };

  const getStatusBadge = (fund: typeof funds[0]) => {
    if (!fund.fund) return <Badge variant="outline">Inconnu</Badge>;
    
    const progress = fund.fund.target_amount > 0 
      ? (fund.fund.current_amount / fund.fund.target_amount) * 100 
      : 0;
    
    if (fund.fund.status === 'completed' || progress >= 100) {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Complétée</Badge>;
    }
    if (fund.fund.status === 'expired') {
      return <Badge variant="destructive">Expirée</Badge>;
    }
    if (fund.fund.status === 'cancelled') {
      return <Badge variant="secondary">Annulée</Badge>;
    }
    if (progress >= 75) {
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Presque là</Badge>;
    }
    return <Badge className="bg-primary/10 text-primary border-primary/20">En cours</Badge>;
  };

  const formatCurrency = (amount: number, currency: string = 'XOF') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/business-dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Gestion des cagnottes</h1>
              <p className="text-sm text-muted-foreground">
                {funds.length} cagnotte{funds.length > 1 ? 's' : ''} au total
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {funds.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Gift className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune cagnotte</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Vous n'avez pas encore de cagnottes collectives liées à votre business.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Cagnottes collectives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cagnotte</TableHead>
                        <TableHead>Bénéficiaire</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead>Progression</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date limite</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {funds.map((fund) => {
                        const progress = fund.fund?.target_amount 
                          ? (fund.fund.current_amount / fund.fund.target_amount) * 100 
                          : 0;
                        
                        return (
                          <TableRow key={fund.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{fund.fund?.title || 'Sans titre'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {fund.fund?.occasion || 'Occasion non spécifiée'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {fund.beneficiary?.first_name} {fund.beneficiary?.last_name || 'Inconnu'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate max-w-[150px]">
                                  {fund.product?.name || 'Non défini'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 min-w-[120px]">
                                <Progress value={Math.min(progress, 100)} className="h-2" />
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(fund.fund?.current_amount || 0)} / {formatCurrency(fund.fund?.target_amount || 0)}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(fund)}
                            </TableCell>
                            <TableCell>
                              {fund.fund?.deadline_date ? (
                                <div className="flex items-center gap-1 text-sm">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(fund.fund.deadline_date), 'dd MMM yyyy', { locale: fr })}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setFundToDelete(fund)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {funds.map((fund) => {
                const progress = fund.fund?.target_amount 
                  ? (fund.fund.current_amount / fund.fund.target_amount) * 100 
                  : 0;

                return (
                  <Card key={fund.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{fund.fund?.title || 'Sans titre'}</h3>
                          <p className="text-xs text-muted-foreground">
                            {fund.fund?.occasion || 'Occasion non spécifiée'}
                          </p>
                        </div>
                        {getStatusBadge(fund)}
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">
                            {fund.beneficiary?.first_name} {fund.beneficiary?.last_name || 'Inconnu'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{fund.product?.name || 'Non défini'}</span>
                        </div>
                        {fund.fund?.deadline_date && (
                          <div className="flex items-center gap-2 col-span-2">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span>
                              Limite: {format(new Date(fund.fund.deadline_date), 'dd MMMM yyyy', { locale: fr })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="space-y-2">
                        <Progress value={Math.min(progress, 100)} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatCurrency(fund.fund?.current_amount || 0)}</span>
                          <span>{formatCurrency(fund.fund?.target_amount || 0)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setFundToDelete(fund)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!fundToDelete} onOpenChange={(open) => !open && setFundToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Supprimer cette cagnotte ?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Vous êtes sur le point de supprimer la cagnotte{' '}
                <strong>"{fundToDelete?.fund?.title}"</strong>.
              </p>
              <p className="text-destructive">
                Cette action est irréversible. Toutes les contributions seront perdues.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFund}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
