import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReportPostModalProps {
  postId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportPostModal({ postId, open, onOpenChange }: ReportPostModalProps) {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  
  const reasons = [
    { value: 'spam', label: 'Spam ou publicité non sollicitée' },
    { value: 'inappropriate', label: 'Contenu inapproprié ou offensant' },
    { value: 'harassment', label: 'Harcèlement ou intimidation' },
    { value: 'fake', label: 'Fausses informations' },
    { value: 'other', label: 'Autre raison' }
  ];
  
  const handleSubmit = async () => {
    if (!postId) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté pour signaler un contenu');
        return;
      }
      
      const reasonText = reasons.find(r => r.value === reason)?.label || reason;
      const fullReason = details ? `${reasonText}: ${details}` : reasonText;
      
      const { error } = await supabase
        .from('reported_posts')
        .insert({
          post_id: postId,
          reporter_id: user.id,
          reason: fullReason,
          status: 'pending'
        });
      
      if (error) throw error;
      
      toast.success('Signalement envoyé. Merci pour votre contribution à la communauté.');
      onOpenChange(false);
      setReason('spam');
      setDetails('');
    } catch (error) {
      console.error('Error reporting post:', error);
      toast.error('Erreur lors du signalement');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signaler cette publication</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Pourquoi signalez-vous cette publication ?
            </Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {reasons.map(r => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="cursor-pointer font-normal">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div>
            <Label htmlFor="details" className="text-sm font-medium mb-2 block">
              Détails supplémentaires (optionnel)
            </Label>
            <Textarea
              id="details"
              placeholder="Ajoutez des détails pour nous aider à comprendre le problème..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Envoi..." : "Envoyer le signalement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
