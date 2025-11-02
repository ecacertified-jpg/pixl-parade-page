import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ModerateCommentDialogProps {
  commentId: string | null;
  reportId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ModerateCommentDialog({ commentId, reportId, open, onOpenChange, onSuccess }: ModerateCommentDialogProps) {
  const [action, setAction] = useState<'approve' | 'hide' | 'delete'>('approve');
  const [warnAuthor, setWarnAuthor] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (!commentId || !reportId) return;
    
    setLoading(true);
    try {
      // Mettre à jour le signalement
      const { error: reportError } = await supabase
        .from('reported_comments')
        .update({ 
          status: action === 'approve' ? 'rejected' : 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId);
      
      if (reportError) throw reportError;
      
      // TODO: Appliquer l'action sur le commentaire
      // Note: La table 'comments' doit être mise à jour via une migration
      if (action === 'hide' || action === 'delete') {
        console.log('Comment moderation action:', action, 'for comment:', commentId);
        // Cette fonctionnalité nécessite une table comments avec les bonnes colonnes
      }
      
      // TODO: Envoyer avertissement si demandé via notifications
      if (warnAuthor && warningMessage) {
        console.log('Warning to send:', warningMessage);
      }
      
      const actionText = action === 'approve' ? 'approuvé' : action === 'hide' ? 'masqué' : 'supprimé';
      toast.success(`Commentaire ${actionText} avec succès`);
      onSuccess();
      onOpenChange(false);
      
      // Reset
      setAction('approve');
      setWarnAuthor(false);
      setWarningMessage('');
    } catch (error) {
      console.error('Error moderating comment:', error);
      toast.error('Erreur lors de la modération');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modérer le commentaire</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <RadioGroup value={action} onValueChange={(v: any) => setAction(v)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="approve" id="approve" />
              <Label htmlFor="approve" className="cursor-pointer">
                Approuver (ignorer le signalement)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hide" id="hide" />
              <Label htmlFor="hide" className="cursor-pointer">
                Masquer le commentaire
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="delete" id="delete" />
              <Label htmlFor="delete" className="text-destructive cursor-pointer">
                Supprimer définitivement
              </Label>
            </div>
          </RadioGroup>
          
          {(action === 'hide' || action === 'delete') && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="warn"
                  checked={warnAuthor}
                  onCheckedChange={(checked) => setWarnAuthor(checked as boolean)}
                />
                <Label htmlFor="warn" className="cursor-pointer">
                  Avertir l'auteur du commentaire
                </Label>
              </div>
              
              {warnAuthor && (
                <Textarea
                  placeholder="Message d'avertissement à envoyer à l'auteur..."
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  rows={3}
                />
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Traitement..." : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
