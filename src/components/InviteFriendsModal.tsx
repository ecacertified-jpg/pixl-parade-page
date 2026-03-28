import { useState } from "react";
import { getAppBaseUrl } from "@/utils/appUrl";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInvitations } from "@/hooks/useInvitations";
import { useDeviceContacts, DeviceContact } from "@/hooks/useDeviceContacts";
import { ContactPickerList } from "@/components/ContactPickerList";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, MessageSquare, Send, Users, Gift, Heart, Calendar, Smartphone, AlertCircle,
  MessageCircle, Facebook, Linkedin, Copy, Share2
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InviteFriendsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteFriendsModal({ open, onOpenChange }: InviteFriendsModalProps) {
  const { sendInvitation, sendBulkInvitations, loading } = useInvitations();
  const { isSupported, loading: contactsLoading, contacts, error: contactsError, pickContacts, clearContacts } = useDeviceContacts();
  const { user } = useAuth();
  
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<DeviceContact[]>([]);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [invitationLink, setInvitationLink] = useState("");
  const [userFirstName, setUserFirstName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      toast.error("Veuillez entrer un numéro de téléphone");
      return;
    }

    if (!/^[0-9+\-\s()]{8,20}$/.test(phone.trim())) {
      toast.error("Numéro de téléphone invalide");
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Adresse email invalide");
      return;
    }

    // Fetch user's first name for personalized message
    let firstName = "";
    if (user?.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('user_id', user.id)
        .single();
      firstName = profile?.first_name || "";
      setUserFirstName(firstName);
    }

    const result = await sendInvitation(email.trim() || undefined, phone.trim(), message.trim() || undefined);

    if (result.success) {
      const link = `${getAppBaseUrl()}/auth?invited=true`;
      setInvitationLink(link);
      setShowShareMenu(true);
    }
  };

  const senderName = userFirstName || "Un ami";
  const inviteMessage = `Salut ! ${senderName} t'invite à rejoindre Joie de Vivre, l'app qui célèbre les moments heureux 🎉\n\nInscris-toi ici : ${invitationLink}`;

  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteMessage)}`, '_blank');
  };

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(invitationLink)}`, '_blank', 'width=600,height=400');
  };

  const shareViaLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(invitationLink)}`, '_blank', 'width=600,height=400');
  };

  const shareViaGmail = () => {
    const subject = 'Rejoins-moi sur Joie de Vivre ! 🎉';
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(inviteMessage)}`, '_blank');
  };

  const shareViaSMS = () => {
    window.location.href = `sms:?body=${encodeURIComponent(inviteMessage)}`;
  };

  const shareViaEmail = () => {
    const subject = 'Rejoins-moi sur Joie de Vivre ! 🎉';
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(inviteMessage)}`;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(invitationLink);
    toast.success('Lien copié !');
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({ title: 'Joie de Vivre', text: inviteMessage, url: invitationLink }).catch(() => {});
    } else {
      copyLink();
    }
  };

  const handleCloseShareMenu = () => {
    setShowShareMenu(false);
    setPhone("");
    setEmail("");
    setMessage("");
    setInvitationLink("");
    onOpenChange(false);
  };

  const handleImportContacts = async () => {
    const imported = await pickContacts();
    if (imported.length > 0) {
      setSelectedContacts(imported);
    }
  };

  const handleSendBulkInvitations = async () => {
    if (selectedContacts.length === 0) {
      toast.error("Veuillez sélectionner au moins un contact");
      return;
    }

    const result = await sendBulkInvitations(selectedContacts);

    if (result.success) {
      setSelectedContacts([]);
      clearContacts();
      onOpenChange(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedContacts([]);
      clearContacts();
      setShowShareMenu(false);
      setInvitationLink("");
    }
    onOpenChange(isOpen);
  };

  return (
    <>
      <Dialog open={open && !showShareMenu} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Users className="w-6 h-6 text-primary" />
              Inviter des amis
            </DialogTitle>
            <DialogDescription>
              Partagez Joie de Vivre avec vos proches et célébrez ensemble les moments importants de la vie
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="invite" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="invite">
                <Send className="w-4 h-4 mr-2" />
                Invitation
              </TabsTrigger>
              <TabsTrigger value="contacts">
                <Smartphone className="w-4 h-4 mr-2" />
                Contacts
              </TabsTrigger>
              <TabsTrigger value="benefits">
                <Gift className="w-4 h-4 mr-2" />
                Avantages
              </TabsTrigger>
            </TabsList>

            <TabsContent value="invite" className="space-y-4 mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Numéro de téléphone *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+225 XX XX XX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Adresse email (optionnel)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ami@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">
                    <Heart className="w-4 h-4 inline mr-2" />
                    Message personnel (optionnel)
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Viens découvrir cette super application pour célébrer nos moments de joie ensemble !"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    disabled={loading}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {message.length}/500
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    "Envoi en cours..."
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Partager l'invitation
                    </>
                  )}
                </Button>
              </form>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">ou partagez directement</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  let firstName = userFirstName;
                  if (!firstName && user?.id) {
                    const { data: profile } = await supabase
                      .from('profiles')
                      .select('first_name')
                      .eq('user_id', user.id)
                      .single();
                    firstName = profile?.first_name || "";
                    setUserFirstName(firstName);
                  }
                  const link = `${getAppBaseUrl()}/auth?invited=true`;
                  setInvitationLink(link);
                  setShowShareMenu(true);
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Partager sur les réseaux sociaux
              </Button>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4 mt-4">
              {!isSupported ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Fonctionnalité non disponible</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      L'importation des contacts n'est pas supportée par votre navigateur. 
                      Cette fonctionnalité est disponible sur :
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Chrome sur Android</li>
                      <li>Edge sur Android</li>
                      <li>Samsung Internet</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-3">
                      Utilisez l'onglet "Invitation" pour envoyer des invitations manuellement.
                    </p>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg p-4">
                    <h3 className="font-medium flex items-center gap-2 mb-2">
                      <Smartphone className="w-5 h-5 text-primary" />
                      Importer depuis vos contacts
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sélectionnez des contacts de votre téléphone pour leur envoyer une invitation à rejoindre Joie de Vivre.
                    </p>
                    
                    <Button
                      onClick={handleImportContacts}
                      variant="outline"
                      className="w-full"
                      disabled={contactsLoading}
                    >
                      {contactsLoading ? (
                        "Chargement..."
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4 mr-2" />
                          {contacts.length > 0 ? "Importer d'autres contacts" : "Importer mes contacts"}
                        </>
                      )}
                    </Button>
                  </div>

                  {contactsError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{contactsError}</AlertDescription>
                    </Alert>
                  )}

                  <ContactPickerList
                    contacts={contacts}
                    selectedContacts={selectedContacts}
                    onSelectionChange={setSelectedContacts}
                  />

                  {contacts.length > 0 && (
                    <Button
                      onClick={handleSendBulkInvitations}
                      className="w-full"
                      disabled={loading || selectedContacts.length === 0}
                    >
                      {loading ? (
                        "Envoi en cours..."
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Envoyer les invitations ({selectedContacts.length})
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="benefits" className="space-y-4 mt-4">
              <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Pourquoi inviter vos amis ?
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary shrink-0 mt-1" />
                    <div>
                      <p className="font-medium">Célébrez ensemble</p>
                      <p className="text-sm text-muted-foreground">
                        Partagez les anniversaires, promotions et moments spéciaux de vos proches
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary shrink-0 mt-1" />
                    <div>
                      <p className="font-medium">Cagnottes collectives</p>
                      <p className="text-sm text-muted-foreground">
                        Organisez des cagnottes avec vos amis pour offrir des cadeaux mémorables
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-primary shrink-0 mt-1" />
                    <div>
                      <p className="font-medium">Exprimez votre gratitude</p>
                      <p className="text-sm text-muted-foreground">
                        Remerciez vos proches et renforcez vos liens affectifs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Gift className="w-5 h-5 text-primary shrink-0 mt-1" />
                    <div>
                      <p className="font-medium">Gagnez des récompenses</p>
                      <p className="text-sm text-muted-foreground">
                        Obtenez des badges et points de fidélité pour vos invitations acceptées
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">🎁 Récompenses pour parrainage</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>50 points</strong> pour chaque invitation acceptée</li>
                  <li>• Badge <strong>"Ambassadeur"</strong> après 5 invitations</li>
                  <li>• Badge <strong>"Légende"</strong> après 20 invitations</li>
                  <li>• Réductions exclusives sur les produits partenaires</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Menu de partage multi-canal */}
      <Dialog open={showShareMenu} onOpenChange={(o) => { if (!o) handleCloseShareMenu(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Partager l'invitation
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-4">
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={shareViaWhatsApp}>
              <MessageCircle className="h-6 w-6 text-green-600" />
              <span className="text-sm">WhatsApp</span>
            </Button>

            <Button variant="outline" className="h-20 flex-col gap-2" onClick={shareViaFacebook}>
              <Facebook className="h-6 w-6 text-blue-700" />
              <span className="text-sm">Facebook</span>
            </Button>

            <Button variant="outline" className="h-20 flex-col gap-2" onClick={shareViaLinkedIn}>
              <Linkedin className="h-6 w-6 text-blue-600" />
              <span className="text-sm">LinkedIn</span>
            </Button>

            <Button variant="outline" className="h-20 flex-col gap-2" onClick={shareViaGmail}>
              <Mail className="h-6 w-6 text-red-500" />
              <span className="text-sm">Gmail</span>
            </Button>

            <Button variant="outline" className="h-20 flex-col gap-2" onClick={shareViaSMS}>
              <Send className="h-6 w-6 text-primary" />
              <span className="text-sm">SMS</span>
            </Button>

            <Button variant="outline" className="h-20 flex-col gap-2" onClick={shareViaEmail}>
              <Mail className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm">Email</span>
            </Button>

            <Button variant="outline" className="h-20 flex-col gap-2" onClick={copyLink}>
              <Copy className="h-6 w-6" />
              <span className="text-sm">Copier le lien</span>
            </Button>

            <Button variant="outline" className="h-20 flex-col gap-2" onClick={shareNative}>
              <Share2 className="h-6 w-6" />
              <span className="text-sm">Plus...</span>
            </Button>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Votre lien :</p>
            <p className="text-sm font-mono break-all">{invitationLink}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
