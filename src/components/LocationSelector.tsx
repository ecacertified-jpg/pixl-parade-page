import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Location {
  id: string;
  name: string;
  commune?: string;
}

interface LocationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  showAddButton?: boolean;
}

export default function LocationSelector({ value, onChange, label = "Adresse complète", placeholder = "Sélectionner un lieu", showAddButton = true }: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newLocation, setNewLocation] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('business_locations')
        .select('id, name, commune')
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNewLocation = async () => {
    if (!newLocation.trim()) return;

    try {
      const { data, error } = await supabase
        .from('business_locations')
        .insert({
          name: newLocation.trim(),
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setLocations(prev => [...prev, data]);
      onChange(newLocation.trim());
      setNewLocation("");
      setIsAddingNew(false);
      
      toast({
        title: "Lieu ajouté",
        description: `${newLocation} a été ajouté à la liste des lieux`,
      });
    } catch (error) {
      console.error('Error adding location:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le lieu",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div>
        <Label>{label}</Label>
        <div className="h-10 bg-muted animate-pulse rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {!isAddingNew ? (
        <div className="flex gap-2">
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.name}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {location.name}
                    {location.commune && location.commune !== location.name && (
                      <span className="text-muted-foreground">({location.commune})</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showAddButton && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNew(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            placeholder="Nom du nouveau lieu"
            onKeyPress={(e) => e.key === 'Enter' && addNewLocation()}
          />
          <Button
            type="button"
            size="sm"
            onClick={addNewLocation}
            disabled={!newLocation.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAddingNew(false);
              setNewLocation("");
            }}
          >
            Annuler
          </Button>
        </div>
      )}
    </div>
  );
}