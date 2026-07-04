import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { INSPIRATION_CATEGORIES, type InspirationCategory, type InspirationMediaType } from "@/features/inspiration/categories";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  pageKind: "birthday" | "event" | "global";
  pageId: string | null;
  isAdminPost?: boolean;
  onCreated: () => void;
  onCancel: () => void;
}

const BUCKET = "birthday-message-media";

export function InspirationComposer({ pageKind, pageId, isAdminPost = false, onCreated, onCancel }: Props) {
  const { user } = useAuth();
  const [category, setCategory] = useState<InspirationCategory>("divertissement");
  const cat = INSPIRATION_CATEGORIES.find((c) => c.key === category)!;
  const [subcategory, setSubcategory] = useState<string>(cat.subcategories[0].key);
  const [mediaType, setMediaType] = useState<InspirationMediaType>("text");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const changeCategory = (v: InspirationCategory) => {
    setCategory(v);
    const c = INSPIRATION_CATEGORIES.find((x) => x.key === v)!;
    setSubcategory(c.subcategories[0].key);
  };

  const submit = async () => {
    if (!user) { toast.error("Connectez-vous pour publier"); return; }
    if (mediaType !== "text" && !file) { toast.error("Ajoutez un fichier"); return; }
    if (mediaType === "text" && !body.trim()) { toast.error("Ajoutez du texte"); return; }
    setSaving(true);
    try {
      let mediaUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() || "bin";
        const path = `inspiration/${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        mediaUrl = pub.publicUrl;
      }
      const payload: any = {
        page_kind: pageKind,
        page_id: pageKind === "global" ? null : pageId,
        author_id: user.id,
        is_admin_post: isAdminPost,
        category,
        subcategory,
        media_type: mediaType,
        media_url: mediaUrl,
        title: title.trim() || null,
        body: body.trim() || null,
      };
      const { error } = await (supabase as any).from("inspiration_items").insert(payload);
      if (error) throw error;
      toast.success("Publié !");
      onCreated();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Publication impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Catégorie</Label>
          <Select value={category} onValueChange={(v) => changeCategory(v as InspirationCategory)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {INSPIRATION_CATEGORIES.map((c) => (
                <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Sous-rubrique</Label>
          <Select value={subcategory} onValueChange={setSubcategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {cat.subcategories.map((s) => (
                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Type de contenu</Label>
        <Select value={mediaType} onValueChange={(v) => setMediaType(v as InspirationMediaType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="video">Vidéo</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="text">Texte</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Titre (optionnel)</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </div>

      {mediaType !== "text" && (
        <div>
          <Label>Fichier</Label>
          <div className="mt-1 flex items-center gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-sm hover:bg-accent">
              <Upload className="h-4 w-4" />
              {file ? file.name : "Choisir un fichier"}
              <input
                type="file"
                accept={mediaType === "video" ? "video/*" : "image/*"}
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>
      )}

      <div>
        <Label>{mediaType === "text" ? "Contenu" : "Description (optionnel)"}</Label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={2000} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>Annuler</Button>
        <Button onClick={submit} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
          Publier
        </Button>
      </div>
    </div>
  );
}