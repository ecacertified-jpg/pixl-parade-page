import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BirthdayPicker } from "@/components/ui/birthday-picker";
import { AddressSelector, type AddressResult } from "@/components/AddressSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function FillFriendForm() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");
  const [addressData, setAddressData] = useState<AddressResult | null>(null);
  const [birthday, setBirthday] = useState<Date>();

  useEffect(() => {
    if (!token) {
      setError("Lien invalide");
      setLoading(false);
      return;
    }

    const loadToken = async () => {
      const { data, error: fetchError } = await supabase
        .from("friend_form_tokens")
        .select("*")
        .eq("token", token)
        .single();

      if (fetchError || !data) {
        setError("Ce lien est invalide ou a expiré");
        setLoading(false);
        return;
      }

      if (data.status === "completed") {
        setError("Ce formulaire a déjà été rempli");
        setLoading(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError("Ce lien a expiré");
        setLoading(false);
        return;
      }

      // Prefill data
      if (data.prefilled_name) setName(data.prefilled_name);
      if (data.prefilled_relation) setRelation(data.prefilled_relation);

      setLoading(false);
    };

    loadToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !birthday) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("save-friend-form", {
        body: {
          token,
          name: name.trim(),
          phone: phone.trim(),
          relation,
          birthday: birthday.toISOString().split("T")[0],
          city: addressData?.city,
          neighborhood: addressData?.neighborhood,
          location: addressData?.fullAddress,
          latitude: addressData?.latitude,
          longitude: addressData?.longitude,
        },
      });

      if (fnError) {
        toast.error("Une erreur est survenue");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setSubmitted(true);
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-lg font-medium text-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Merci ! 🎉</h2>
            <p className="text-muted-foreground">
              Vos informations ont été enregistrées avec succès. Votre ami sera notifié de votre anniversaire !
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl font-poppins">Complétez vos informations</CardTitle>
          <p className="text-sm text-muted-foreground">
            Un ami souhaite ne jamais oublier votre anniversaire ! Remplissez ce formulaire pour l'aider.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">Prénom *</Label>
              <Input
                id="name"
                placeholder="Votre prénom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone *</Label>
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
              <Select value={relation} onValueChange={setRelation}>
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
            />

            <BirthdayPicker
              label="Date d'anniversaire *"
              value={birthday}
              onChange={setBirthday}
              required
            />

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Envoi en cours...
                </>
              ) : (
                "Envoyer mes informations"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
