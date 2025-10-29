import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OccasionType } from "@/hooks/useFavorites";

interface FavoriteFiltersProps {
  selectedOccasion: string;
  onOccasionChange: (occasion: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const occasions: { value: string; label: string; emoji: string }[] = [
  { value: 'all', label: 'Toutes', emoji: '✨' },
  { value: 'birthday', label: 'Anniversaire', emoji: '🎂' },
  { value: 'wedding', label: 'Mariage', emoji: '💍' },
  { value: 'promotion', label: 'Promotion', emoji: '🎉' },
  { value: 'achievement', label: 'Réussite', emoji: '🎓' },
  { value: 'christmas', label: 'Noël', emoji: '🎄' },
  { value: 'valentines', label: 'Saint-Valentin', emoji: '💝' },
  { value: 'other', label: 'Autre', emoji: '🎁' },
];

export function FavoriteFilters({
  selectedOccasion,
  onOccasionChange,
  sortBy,
  onSortChange
}: FavoriteFiltersProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* Occasion filter */}
      <div className="overflow-x-auto pb-2">
        <Tabs value={selectedOccasion} onValueChange={onOccasionChange} className="w-full">
          <TabsList className="inline-flex w-auto">
            {occasions.map((occasion) => (
              <TabsTrigger key={occasion.value} value={occasion.value} className="gap-2">
                <span>{occasion.emoji}</span>
                <span>{occasion.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Sort selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Trier par:</span>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Choisir un tri" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Priorité</SelectItem>
            <SelectItem value="date_desc">Date (récent)</SelectItem>
            <SelectItem value="date_asc">Date (ancien)</SelectItem>
            <SelectItem value="price_desc">Prix (décroissant)</SelectItem>
            <SelectItem value="price_asc">Prix (croissant)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}