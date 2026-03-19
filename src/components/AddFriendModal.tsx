import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BirthdayPicker } from "@/components/ui/birthday-picker";
import { AddressSelector, type AddressResult } from "@/components/AddressSelector";
import { Share2, MessageCircle, Facebook, Mail, Send, Copy, Linkedin, Loader2, Info, Phone, Gift, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Friend {
  id: string;
  name: string;
  phone: string;
  relation: string;
  location: string;
  city?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  birthday: Date;
}

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFriend: (friend: Friend) => void;
  existingPhones?: string[];
}

export function AddFriendModal({ isOpen, onClose, onAddFriend, existingPhones = [] }: AddFriendModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");
  const [addressData, setAddressData] = useState<AddressResult | null>(null);
  const [birthday, setBirthday] = useState<Date>();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !phone || !relation || !addressData?.city || !birthday) {
      return;
    }

    const normalizedPhone = phone.replace(/\D/g, '');
    const isDuplicate = existingPhones.some(
      (p) => p.replace(/\D/g, '') === normalizedPhone
    );
    if (isDuplicate) {
      toast.error("Ce numéro de téléphone existe déjà dans votre cercle d'amis.");
      return;
    }

    const newFriend: Friend = {
      id: Date.now().toString(),
      name,
      phone,
      relation,
      location: addressData.fullAddress,
      city: addressData.city,
      neighborhood: addressData.neighborhood,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      birthday
    };

    onAddFriend(newFriend);
    
    // Reset form
    setName("");
    setPhone("");
    setRelation("");
    setAddressData(null);
    setBirthday(undefined);
    
    onClose();
  };

  const handleCancel = () => {
    setName("");
    setPhone("");
    setRelation("");
    setAddressData(null);
    setBirthday(undefined);
    setShowShareMenu(false);
    setShareLink("");
    onClose();
  };

  const handleShareForm = async () => {
    if (!user?.id) {
      toast.error("Vous devez être connecté");
      return;
    }
    setGeneratingLink(true);
    try {
      const { data, error } = await supabase
        .from("friend_form_tokens")
        .insert({
          user_id: user.id,
          prefilled_name: name || null,
          prefilled_relation: relation || null,
        })
        .select("token")
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/fill-friend-info/${data.token}`;
      setShareLink(link);
      setShowShareMenu(true);
    } catch (err) {
      console.error("Error generating share link:", err);
      toast.error("Erreur lors de la génération du lien");
    } finally {
      setGeneratingLink(false);
    }
  };

  const shareMessage = `Salut ! 👋 Peux-tu remplir ce formulaire avec ta date d'anniversaire pour que je ne l'oublie jamais ? 🎂\n\n${shareLink}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Lien copié !");
  };

  const shareViaWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank");
  const shareViaFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, "_blank", "width=600,height=400");
  const shareViaLinkedIn = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`, "_blank", "width=600,height=400");
  const shareViaGmail = () => window.open(`https://mail.google.com/mail/?view=cm&su=${encodeURIComponent("Remplis ton anniversaire ! 🎂")}&body=${encodeURIComponent(shareMessage)}`, "_blank");
  const shareViaSMS = () => { window.location.href = `sms:?body=${encodeURIComponent(shareMessage)}`; };
  const shareViaEmail = () => { window.location.href = `mailto:?subject=${encodeURIComponent("Remplis ton anniversaire ! 🎂")}&body=${encodeURIComponent(shareMessage)}`; };
  const shareNative = () => {
    if (navigator.share) {
      navigator.share({ title: "Joie de Vivre", text: shareMessage, url: shareLink }).catch(() => {});
    } else {
      copyLink();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un ami</DialogTitle>
        </DialogHeader>

        {/* CTA ostentatoire : Envoyer à un proche */}
        <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/20 p-4">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/10 rounded-full blur-xl" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-accent/10 rounded-full blur-lg" />
          
          <div className="relative space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <p className="text-sm font-semibold text-foreground">
                Plus simple : laissez votre ami remplir lui-même !
              </p>
            </div>
            
            <Button
              type="button"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-200 h-11 text-sm"
              onClick={handleShareForm}
              disabled={generatingLink}
            >
              {generatingLink ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              Envoyer à un proche pour qu'il complète
            </Button>

            {/* Icônes des réseaux sociaux */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">via</span>
              <div className="flex items-center gap-2.5">
                <MessageCircle className="h-5 w-5 text-green-600" />
                <Facebook className="h-5 w-5 text-blue-700" />
                <Linkedin className="h-5 w-5 text-blue-600" />
                <Mail className="h-5 w-5 text-red-500" />
                <Send className="h-5 w-5 text-primary" />
                <Copy className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center py-1">
          <div className="flex-1 border-t border-border" />
          <span className="px-3 text-xs text-muted-foreground bg-background">ou remplissez manuellement</span>
          <div className="flex-1 border-t border-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-xs space-y-1.5 ml-1">
              <p className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                Les numéros de téléphone de vos contacts doivent être distincts.
              </p>
              <p className="flex items-center gap-1.5">
                <Gift className="h-3 w-3 text-muted-foreground shrink-0" />
                Plus vous ajoutez d'amis, plus vous avez de chances de recevoir des cadeaux de grande valeur !
              </p>
              <p className="flex items-center gap-1.5">
                <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                Créez des sous-cercles d'amis pour maximiser vos chances de recevoir de nombreux cadeaux à votre anniversaire.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="name">Prénom</Label>
            <Input
              id="name"
              placeholder="Florentin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input
              id="phone"
              placeholder="07 XX XX XX XX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relation">Relation</Label>
            <Select value={relation} onValueChange={setRelation} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une relation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frère">Frère</SelectItem>
                <SelectItem value="sœur">Sœur</SelectItem>
                <SelectItem value="famille">Famille</SelectItem>
                <SelectItem value="ami">Ami(e)</SelectItem>
                <SelectItem value="collègue">Collègue</SelectItem>
                <SelectItem value="conjoint">Conjoint(e)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AddressSelector
            onAddressChange={setAddressData}
            label="Lieu de résidence"
            cityLabel="Ville / Commune"
            neighborhoodLabel="Quartier"
            required
          />

          <BirthdayPicker
            label="Date d'anniversaire"
            value={birthday}
            onChange={setBirthday}
          />

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="bg-primary hover:bg-primary/90 flex-1">
              Ajouter
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
              Annuler
            </Button>
          </div>

          <div className="border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground hover:text-primary"
              onClick={handleShareForm}
              disabled={generatingLink}
            >
              {generatingLink ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              Envoyer à un proche pour qu'il complète
            </Button>
          </div>
        </form>

        {showShareMenu && shareLink && (
          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium text-foreground">Partager via :</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-14 flex-col gap-1 text-xs" onClick={shareViaWhatsApp}>
                <MessageCircle className="h-5 w-5 text-green-600" />
                WhatsApp
              </Button>
              <Button variant="outline" className="h-14 flex-col gap-1 text-xs" onClick={shareViaFacebook}>
                <Facebook className="h-5 w-5 text-blue-700" />
                Facebook
              </Button>
              <Button variant="outline" className="h-14 flex-col gap-1 text-xs" onClick={shareViaLinkedIn}>
                <Linkedin className="h-5 w-5 text-blue-600" />
                LinkedIn
              </Button>
              <Button variant="outline" className="h-14 flex-col gap-1 text-xs" onClick={shareViaGmail}>
                <Mail className="h-5 w-5 text-red-500" />
                Gmail
              </Button>
              <Button variant="outline" className="h-14 flex-col gap-1 text-xs" onClick={shareViaSMS}>
                <Send className="h-5 w-5 text-purple-600" />
                SMS
              </Button>
              <Button variant="outline" className="h-14 flex-col gap-1 text-xs" onClick={shareViaEmail}>
                <Mail className="h-5 w-5 text-foreground" />
                Email
              </Button>
              <Button variant="outline" className="h-14 flex-col gap-1 text-xs" onClick={copyLink}>
                <Copy className="h-5 w-5" />
                Copier
              </Button>
              <Button variant="outline" className="h-14 flex-col gap-1 text-xs" onClick={shareNative}>
                <Share2 className="h-5 w-5" />
                Plus...
              </Button>
            </div>
            <div className="p-2 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground break-all font-mono">{shareLink}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
