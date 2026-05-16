import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Loader2,
  RefreshCcw,
  Search,
} from "lucide-react";

const PRESETS: Array<{ label: string; path: string }> = [
  { label: "Accueil", path: "/" },
  { label: "Cagnotte (/f/:id)", path: "/f/" },
  { label: "Boutique (/b/:id)", path: "/b/" },
  { label: "Produit (/p/:id)", path: "/p/" },
  { label: "Anniversaire (/birthday/:slug)", path: "/birthday/" },
  { label: "Événement (/event/:slug)", path: "/event/" },
];

const CRAWLERS: Array<{ value: string; label: string }> = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "Twitter / X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "telegram", label: "Telegram" },
  { value: "slack", label: "Slack" },
  { value: "discord", label: "Discord" },
];

type InspectorResult = {
  requested: string;
  finalUrl: string;
  fetched: string;
  status: number;
  elapsedMs: number;
  crawler: string;
  userAgent: string;
  contentType: string | null;
  cacheControl: string | null;
  meta: {
    ogTitle: string | null;
    ogDescription: string | null;
    ogUrl: string | null;
    ogType: string | null;
    ogImage: string | null;
    ogImageAlt: string | null;
    ogImageWidth: string | null;
    ogImageHeight: string | null;
    twitterTitle: string | null;
    twitterDescription: string | null;
    twitterImage: string | null;
    twitterCard: string | null;
  };
  allMeta: Array<{ key: string; value: string }>;
  imageCheck: {
    url: string;
    status: number | null;
    contentType: string | null;
    contentLength: number | null;
    ok: boolean;
    error?: string;
  } | null;
};

const BASE_DOMAIN = "https://joiedevivre-africa.com";

export default function SocialPreviewDebug() {
  const [url, setUrl] = useState<string>(BASE_DOMAIN);
  const [crawler, setCrawler] = useState<string>("whatsapp");
  const [bypassCache, setBypassCache] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InspectorResult | null>(null);

  const handleInspect = async () => {
    if (!url.trim()) {
      toast.error("Saisis une URL à inspecter.");
      return;
    }
    try {
      // Quick client-side validation
      const u = new URL(url);
      if (!/^https?:$/.test(u.protocol)) throw new Error("invalid protocol");
    } catch {
      toast.error("URL invalide (http/https uniquement).");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("og-inspector", {
        body: { url: url.trim(), crawler, bypassCache },
      });
      if (error) throw error;
      setResult(data as InspectorResult);
      const ok = (data as InspectorResult).imageCheck?.ok;
      if (ok) toast.success("Aperçu récupéré — l'image est servie.");
      else toast.warning("Aperçu récupéré, mais l'image n'est pas accessible.");
    } catch (err: any) {
      toast.error(err?.message ?? "Échec de l'inspection.");
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (path: string) => {
    setUrl(BASE_DOMAIN + path);
  };

  const openFacebookDebugger = () => {
    window.open(
      `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  const openLinkedInInspector = () => {
    window.open(
      `https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  const openTwitterCardValidator = () => {
    // Twitter retired the validator UI; document references still work via Card preview in tweet draft.
    window.open(
      `https://cards-dev.twitter.com/validator?url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const meta = result?.meta;
  const imageOk = result?.imageCheck?.ok ?? false;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="🔍 Aperçu social (WhatsApp / Facebook)"
          description="Vérifie ce que voient les crawlers et purge le cache des aperçus."
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inspecter une URL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(p.path)}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL complète (avec le chemin)</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://joiedevivre-africa.com/f/UUID"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>User-Agent simulé</Label>
                <Select value={crawler} onValueChange={setCrawler}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CRAWLERS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  variant={bypassCache ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={() => setBypassCache((v) => !v)}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  {bypassCache ? "Cache contourné (?_ogv)" : "Cache standard"}
                </Button>
              </div>
              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={handleInspect}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Inspecter
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <p className="basis-full text-xs text-muted-foreground">
                Purger le cache officiel des plateformes (Scrape again) :
              </p>
              <Button variant="outline" size="sm" onClick={openFacebookDebugger}>
                <ExternalLink className="h-3 w-3 mr-2" />
                Facebook / WhatsApp Debugger
              </Button>
              <Button variant="outline" size="sm" onClick={openLinkedInInspector}>
                <ExternalLink className="h-3 w-3 mr-2" />
                LinkedIn Post Inspector
              </Button>
              <Button variant="outline" size="sm" onClick={openTwitterCardValidator}>
                <ExternalLink className="h-3 w-3 mr-2" />
                Twitter Card Validator
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">Résultat</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={result.status === 200 ? "default" : "destructive"}>
                    HTTP {result.status}
                  </Badge>
                  <Badge variant="secondary">{result.elapsedMs} ms</Badge>
                  <Badge variant="outline">{result.crawler}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Preview card mimicking WhatsApp */}
                  <div className="border rounded-lg overflow-hidden bg-muted/30">
                    {meta?.ogImage ? (
                      <div className="relative aspect-[1.91/1] bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={meta.ogImage}
                          alt={meta.ogImageAlt ?? "Aperçu"}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[1.91/1] flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8" />
                        <span className="ml-2 text-sm">Aucune og:image</span>
                      </div>
                    )}
                    <div className="p-3 space-y-1">
                      <p className="text-xs text-muted-foreground truncate">
                        {meta?.ogUrl ?? result.finalUrl}
                      </p>
                      <p className="font-medium text-sm line-clamp-2">
                        {meta?.ogTitle ?? meta?.twitterTitle ?? "(pas de titre)"}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {meta?.ogDescription ??
                          meta?.twitterDescription ??
                          "(pas de description)"}
                      </p>
                    </div>
                  </div>

                  {/* Diagnostics */}
                  <div className="space-y-3 text-sm">
                    <DiagnosticRow
                      ok={Boolean(meta?.ogTitle)}
                      label="og:title"
                      value={meta?.ogTitle}
                    />
                    <DiagnosticRow
                      ok={Boolean(meta?.ogDescription)}
                      label="og:description"
                      value={meta?.ogDescription}
                    />
                    <DiagnosticRow
                      ok={Boolean(meta?.ogImage)}
                      label="og:image"
                      value={meta?.ogImage}
                      mono
                    />
                    <DiagnosticRow
                      ok={imageOk}
                      label="image accessible (HEAD)"
                      value={
                        result.imageCheck
                          ? `${result.imageCheck.status ?? "?"} · ${
                              result.imageCheck.contentType ?? "?"
                            }${
                              result.imageCheck.contentLength
                                ? ` · ${result.imageCheck.contentLength} octets`
                                : ""
                            }`
                          : "—"
                      }
                    />
                    <DiagnosticRow
                      ok={Boolean(meta?.twitterCard)}
                      label="twitter:card"
                      value={meta?.twitterCard}
                    />
                    <DiagnosticRow
                      ok={result.finalUrl !== result.fetched ? true : true}
                      label="URL finale"
                      value={result.finalUrl}
                      mono
                    />
                    <DiagnosticRow
                      ok={!!result.cacheControl}
                      label="Cache-Control"
                      value={result.cacheControl ?? "—"}
                      mono
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Tous les meta og:* / twitter:* ({result.allMeta.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded border bg-muted/30 overflow-x-auto">
                  <table className="w-full text-xs">
                    <tbody>
                      {result.allMeta.map((m, i) => (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="px-3 py-1.5 font-mono text-muted-foreground whitespace-nowrap align-top">
                            {m.key}
                          </td>
                          <td className="px-3 py-1.5 font-mono break-all">
                            {m.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  User-Agent envoyé : <span className="font-mono">{result.userAgent}</span>
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function DiagnosticRow({
  ok,
  label,
  value,
  mono,
}: {
  ok: boolean;
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm break-all ${mono ? "font-mono" : ""}`}>
          {value || <span className="text-muted-foreground">(vide)</span>}
        </p>
      </div>
    </div>
  );
}