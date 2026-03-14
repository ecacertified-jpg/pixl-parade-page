import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PRESET_COLORS = [
  '#7A5DC7', '#FF4D6D', '#F7C948', '#22C55E',
  '#3B82F6', '#F97316', '#EC4899', '#14B8A6',
];

interface CreateCircleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, color: string) => Promise<void>;
}

export function CreateCircleModal({ open, onOpenChange, onSubmit }: CreateCircleModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    await onSubmit(name.trim(), color);
    setSubmitting(false);
    setName("");
    setColor(PRESET_COLORS[0]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nouveau cercle d'amis</DialogTitle>
          <DialogDescription>
            Créez un cercle pour regrouper vos contacts. Chaque contact ne peut appartenir qu'à un seul cercle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="circle-name">Nom du cercle</Label>
            <Input
              id="circle-name"
              placeholder="Ex: Amis du lycée, Collègues…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
            />
          </div>

          <div>
            <Label>Couleur</Label>
            <div className="flex items-center gap-2 mt-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  className={`w-7 h-7 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  type="button"
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || submitting}>
            {submitting ? "Création…" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
