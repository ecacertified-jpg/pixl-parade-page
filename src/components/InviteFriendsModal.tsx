import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInvitations } from "@/hooks/useInvitations";
import { useDeviceContacts, DeviceContact } from "@/hooks/useDeviceContacts";
import { ContactPickerList } from "@/components/ContactPickerList";
import { Mail, MessageSquare, Send, Users, Gift, Heart, Calendar, Smartphone, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InviteFriendsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteFriendsModal({ open, onOpenChange }: InviteFriendsModalProps) {
  const { sendInvitation, sendBulkInvitations, loading } = useInvitations();
  const { isSupported, loading: contactsLoading, contacts, error: contactsError, pickContacts, clearContacts } = useDeviceContacts();
  
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<DeviceContact[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Veuillez entrer une adresse email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Adresse email invalide");
      return;
    }

    const result = await sendInvitation(email, phone || undefined, message || undefined);

    if (result.success) {
      setEmail("");
      setPhone("");
      setMessage("");
      onOpenChange(false);
    }
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
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Adresse email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ami@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Numéro de téléphone (optionnel)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+225 XX XX XX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Le numéro sera utilisé pour les notifications SMS futures
                </p>
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
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer l'invitation
                  </>
                )}
              </Button>
            </form>
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
  );
}
