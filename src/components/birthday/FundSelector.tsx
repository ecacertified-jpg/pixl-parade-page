import { useEffect, useState } from "react";
import { Plus, Check, ChevronDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FundOption {
  id: string;
  title: string;
  current_amount: number;
  target_amount: number;
}

interface FundSelectorProps {
  ownerUserId: string;
  pageType: "birthday" | "event";
  pageId: string;
  currentFundId: string | null;
  onChange: (fundId: string | null) => void;
  onCreateNew: () => void;
}

/**
 * Allows the page owner to switch which of their collective funds is
 * featured on this birthday/event page. Visitors never see this UI.
 */
export function FundSelector({
  ownerUserId,
  pageType,
  pageId,
  currentFundId,
  onChange,
  onCreateNew,
}: FundSelectorProps) {
  const [funds, setFunds] = useState<FundOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("collective_funds")
        .select("id, title, current_amount, target_amount")
        .eq("creator_id", ownerUserId)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (!cancelled) {
        setFunds((data as FundOption[]) || []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ownerUserId]);

  // Don't render if owner has 0 or 1 fund — no need for a selector
  if (loading) return null;
  if (funds.length <= 1 && !currentFundId) {
    // still show a "+ Créer" shortcut
    return (
      <div className="mb-3 flex justify-end">
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-7 px-2"
          onClick={onCreateNew}
        >
          <Plus className="h-3 w-3 mr-1" /> Nouvelle cagnotte
        </Button>
      </div>
    );
  }

  const handleSelect = async (newId: string) => {
    if (newId === currentFundId) return;
    setSaving(true);
    try {
      const table = pageType === "birthday" ? "birthday_pages" : "event_pages";
      const { error } = await supabase
        .from(table)
        .update({ fund_id: newId })
        .eq("id", pageId);
      if (error) throw error;
      onChange(newId);
      toast.success("Cagnotte mise en avant ✨");
    } catch (err: any) {
      console.error(err);
      toast.error("Impossible de changer la cagnotte");
    } finally {
      setSaving(false);
    }
  };

  const currentFund = funds.find((f) => f.id === currentFundId);

  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">
        Cagnotte mise en avant :
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 max-w-[60%]"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : null}
            <span className="truncate">
              {currentFund?.title || "Choisir une cagnotte"}
            </span>
            <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-w-[280px]">
          {funds.map((f) => (
            <DropdownMenuItem
              key={f.id}
              onClick={() => handleSelect(f.id)}
              className="flex items-start gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium text-sm">{f.title}</div>
                <div className="text-[10px] text-muted-foreground">
                  {f.current_amount.toLocaleString("fr-FR")} /{" "}
                  {f.target_amount.toLocaleString("fr-FR")} XOF
                </div>
              </div>
              {f.id === currentFundId && (
                <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" /> Créer une nouvelle cagnotte
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}