import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
}

const sb = supabase as any;

export function PremiumCardPicker({ value, onChange }: Props) {
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    sb.from("birthday_card_templates")
      .select("id, title, image_url")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(12)
      .then(({ data }: any) => setCards(data || []));
  }, []);

  return (
    <div>
      <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Crown className="h-3 w-3 text-amber-500" />
        Carte premium (optionnel)
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            "h-16 w-16 shrink-0 rounded-xl border bg-muted/40 text-xs text-muted-foreground",
            !value ? "border-primary" : "border-border"
          )}
        >
          Aucune
        </button>
        {cards.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className={cn(
              "h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-cover bg-center transition-all",
              value === c.id
                ? "border-2 border-amber-500 ring-2 ring-amber-300"
                : "border-border"
            )}
            style={{ backgroundImage: `url(${c.image_url})` }}
            title={c.title}
          />
        ))}
      </div>
    </div>
  );
}