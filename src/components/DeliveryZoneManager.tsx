import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, MapPin, Save, X } from "lucide-react";

interface DeliveryZone {
  name: string;
  radius: number;
  cost: number;
  active?: boolean;
}

interface DeliveryZoneManagerProps {
  zones: DeliveryZone[];
  onChange: (zones: DeliveryZone[]) => void;
}

export default function DeliveryZoneManager({ zones, onChange }: DeliveryZoneManagerProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newZone, setNewZone] = useState<DeliveryZone>({
    name: "",
    radius: 10,
    cost: 2000,
    active: true
  });

  const addZone = () => {
    if (!newZone.name.trim()) return;
    
    onChange([...zones, { ...newZone, name: newZone.name.trim() }]);
    setNewZone({ name: "", radius: 10, cost: 2000, active: true });
    setIsAddingNew(false);
  };

  const updateZone = (index: number, updatedZone: DeliveryZone) => {
    const newZones = [...zones];
    newZones[index] = updatedZone;
    onChange(newZones);
    setEditingIndex(null);
  };

  const deleteZone = (index: number) => {
    const newZones = zones.filter((_, i) => i !== index);
    onChange(newZones);
  };

  const toggleZoneActive = (index: number) => {
    const newZones = [...zones];
    newZones[index] = { ...newZones[index], active: !newZones[index].active };
    onChange(newZones);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Zones de livraison configurées</Label>
        <Button
          type="button"
          size="sm"
          onClick={() => setIsAddingNew(true)}
          disabled={isAddingNew}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une zone
        </Button>
      </div>

      {/* Liste des zones existantes */}
      <div className="space-y-3">
        {zones.map((zone, index) => (
          <Card key={index} className="p-4">
            {editingIndex === index ? (
              <EditZoneForm
                zone={zone}
                onSave={(updatedZone) => updateZone(index, updatedZone)}
                onCancel={() => setEditingIndex(null)}
              />
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{zone.name}</span>
                      <Badge variant={zone.active !== false ? "default" : "secondary"}>
                        {zone.active !== false ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Rayon: {zone.radius}km • Coût: {zone.cost.toLocaleString()} FCFA
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleZoneActive(index)}
                  >
                    {zone.active !== false ? "Désactiver" : "Activer"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingIndex(index)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteZone(index)}
                    disabled={zones.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Formulaire d'ajout */}
      {isAddingNew && (
        <Card className="p-4 border-dashed">
          <div className="space-y-4">
            <h4 className="font-medium">Nouvelle zone de livraison</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="new-zone-name">Nom de la zone</Label>
                <Input
                  id="new-zone-name"
                  value={newZone.name}
                  onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                  placeholder="Ex: Centre-ville"
                />
              </div>
              <div>
                <Label htmlFor="new-zone-radius">Rayon (km)</Label>
                <Input
                  id="new-zone-radius"
                  type="number"
                  value={newZone.radius}
                  onChange={(e) => setNewZone({ ...newZone, radius: parseInt(e.target.value) || 0 })}
                  min="1"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="new-zone-cost">Coût de livraison (FCFA)</Label>
                <Input
                  id="new-zone-cost"
                  type="number"
                  value={newZone.cost}
                  onChange={(e) => setNewZone({ ...newZone, cost: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={addZone}
                disabled={!newZone.name.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddingNew(false);
                  setNewZone({ name: "", radius: 10, cost: 2000, active: true });
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

interface EditZoneFormProps {
  zone: DeliveryZone;
  onSave: (zone: DeliveryZone) => void;
  onCancel: () => void;
}

function EditZoneForm({ zone, onSave, onCancel }: EditZoneFormProps) {
  const [editedZone, setEditedZone] = useState<DeliveryZone>({ ...zone });

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Modifier la zone</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="edit-zone-name">Nom de la zone</Label>
          <Input
            id="edit-zone-name"
            value={editedZone.name}
            onChange={(e) => setEditedZone({ ...editedZone, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="edit-zone-radius">Rayon (km)</Label>
          <Input
            id="edit-zone-radius"
            type="number"
            value={editedZone.radius}
            onChange={(e) => setEditedZone({ ...editedZone, radius: parseInt(e.target.value) || 0 })}
            min="1"
            max="100"
          />
        </div>
        <div>
          <Label htmlFor="edit-zone-cost">Coût de livraison (FCFA)</Label>
          <Input
            id="edit-zone-cost"
            type="number"
            value={editedZone.cost}
            onChange={(e) => setEditedZone({ ...editedZone, cost: parseInt(e.target.value) || 0 })}
            min="0"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => onSave(editedZone)}
          disabled={!editedZone.name.trim()}
        >
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          <X className="h-4 w-4 mr-2" />
          Annuler
        </Button>
      </div>
    </div>
  );
}