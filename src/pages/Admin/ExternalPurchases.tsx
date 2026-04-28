import { useState } from "react";
import {
  useExternalPurchaseRequests,
  useUpdateExternalPurchaseRequest,
  type ExternalPurchaseStatus,
} from "@/hooks/useExternalPurchaseRequests";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, Globe, Package, CheckCircle2 } from "lucide-react";

const STATUS_LABEL: Record<ExternalPurchaseStatus, string> = {
  pending: "À acheter",
  purchased: "Acheté",
  shipped: "Expédié",
  delivered: "Livré",
  cancelled: "Annulé",
  refunded: "Remboursé",
};

const STATUS_VARIANT: Record<
  ExternalPurchaseStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "destructive",
  purchased: "default",
  shipped: "default",
  delivered: "secondary",
  cancelled: "outline",
  refunded: "outline",
};

export default function ExternalPurchases() {
  const [filter, setFilter] = useState<ExternalPurchaseStatus | "all">("pending");
  const { data: requests, isLoading } = useExternalPurchaseRequests(filter);
  const update = useUpdateExternalPurchaseRequest();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [actualAmount, setActualAmount] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState<ExternalPurchaseStatus>("purchased");

  const editing = requests?.find((r) => r.id === editingId) ?? null;

  const openEdit = (id: string) => {
    const req = requests?.find((r) => r.id === id);
    if (!req) return;
    setEditingId(id);
    setActualAmount(req.actual_purchase_amount?.toString() ?? "");
    setOrderRef(req.external_order_reference ?? "");
    setProofUrl(req.proof_url ?? "");
    setAdminNotes(req.admin_notes ?? "");
    setNewStatus(req.status === "pending" ? "purchased" : req.status);
  };

  const handleSave = async () => {
    if (!editing) return;
    const patch: any = {
      status: newStatus,
      external_order_reference: orderRef || null,
      proof_url: proofUrl || null,
      admin_notes: adminNotes || null,
    };
    if (actualAmount) {
      patch.actual_purchase_amount = Number(actualAmount);
    }
    if (newStatus === "purchased" && !editing.purchased_at) {
      patch.purchased_at = new Date().toISOString();
    }
    await update.mutateAsync({ id: editing.id, patch });
    setEditingId(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          Achats externes
        </h1>
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v as any)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">À acheter</SelectItem>
            <SelectItem value="purchased">Acheté</SelectItem>
            <SelectItem value="shipped">Expédié</SelectItem>
            <SelectItem value="delivered">Livré</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
            <SelectItem value="refunded">Remboursé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : !requests || requests.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Aucune demande d'achat externe pour ce filtre.
        </Card>
      ) : (
        <div className="grid gap-3">
          {requests.map((req) => {
            const fund = req.collective_funds;
            const image = fund?.external_product_image_url;
            return (
              <Card key={req.id} className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-md bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {image ? (
                      <img
                        src={image}
                        alt={req.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{req.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {req.external_platform ?? "Externe"} · cagnotte {fund?.title ?? "—"}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANT[req.status]}>
                        {STATUS_LABEL[req.status]}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Estimé</p>
                        <p className="font-medium">
                          {Number(req.estimated_price).toLocaleString()} XOF
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Collecté</p>
                        <p className="font-medium">
                          {Number(fund?.current_amount ?? 0).toLocaleString()} XOF
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Acheté</p>
                        <p className="font-medium">
                          {req.actual_purchase_amount
                            ? `${Number(req.actual_purchase_amount).toLocaleString()} XOF`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pays</p>
                        <p className="font-medium">{fund?.country_code ?? "—"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <a
                        href={req.external_url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                      >
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Ouvrir le produit
                        </Button>
                      </a>
                      <Button size="sm" onClick={() => openEdit(req.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Mettre à jour
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditingId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mettre à jour la demande</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select
                  value={newStatus}
                  onValueChange={(v) => setNewStatus(v as ExternalPurchaseStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchased">Acheté</SelectItem>
                    <SelectItem value="shipped">Expédié</SelectItem>
                    <SelectItem value="delivered">Livré</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                    <SelectItem value="refunded">Remboursé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Montant réel d'achat (XOF)</Label>
                <Input
                  type="number"
                  value={actualAmount}
                  onChange={(e) => setActualAmount(e.target.value)}
                  placeholder="Ex. 47500"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Référence de commande externe</Label>
                <Input
                  value={orderRef}
                  onChange={(e) => setOrderRef(e.target.value)}
                  placeholder="Ex. AMZ-123456789"
                />
              </div>
              <div className="space-y-1.5">
                <Label>URL de la preuve (capture, reçu)</Label>
                <Input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Notes admin</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setEditingId(null)}>
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={update.isPending}>
                  Enregistrer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}