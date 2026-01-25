import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Rocket, Globe, Package, Store, Link, Loader2, CheckCircle } from 'lucide-react';

const BASE_URL = 'https://joiedevivre-africa.com';

interface IndexNowSubmitButtonProps {
  onSubmitComplete?: () => void;
}

export function IndexNowSubmitButton({ onSubmitComplete }: IndexNowSubmitButtonProps) {
  const [loading, setLoading] = useState(false);
  const [customUrlModalOpen, setCustomUrlModalOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  const submitToIndexNow = async (urls: string[], entityType: string) => {
    setLoading(true);
    setLastResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('indexnow-notify', {
        body: {
          urls,
          entityType,
          priority: 'high'
        }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        const message = `${data.submitted} URL(s) soumise(s) à ${data.engines?.filter((e: any) => e.success).length || 0} moteur(s)`;
        toast.success('IndexNow: Soumission réussie', { description: message });
        setLastResult({ success: true, message });
        onSubmitComplete?.();
      } else {
        throw new Error(data?.error || 'Échec de la soumission');
      }
    } catch (error) {
      console.error('IndexNow submission error:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la soumission';
      toast.error('IndexNow: Erreur', { description: message });
      setLastResult({ success: false, message });
    } finally {
      setLoading(false);
    }
  };

  const handlePriorityPages = async () => {
    const priorityUrls = [
      `${BASE_URL}/`,
      `${BASE_URL}/shop`,
      `${BASE_URL}/about`,
      `${BASE_URL}/faq`,
      `${BASE_URL}/contact`
    ];
    await submitToIndexNow(priorityUrls, 'page');
  };

  const handleAllProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch all active product IDs
      const { data: products, error } = await supabase
        .from('products')
        .select('id')
        .eq('is_active', true)
        .limit(1000);
      
      if (error) throw error;
      
      if (!products || products.length === 0) {
        toast.info('Aucun produit actif à soumettre');
        setLoading(false);
        return;
      }
      
      const urls = products.map(p => `${BASE_URL}/product/${p.id}`);
      await submitToIndexNow(urls, 'product');
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erreur lors de la récupération des produits');
      setLoading(false);
    }
  };

  const handleAllBusinesses = async () => {
    try {
      setLoading(true);
      
      // Fetch all approved business IDs
      const { data: businesses, error } = await supabase
        .from('business_accounts')
        .select('id')
        .eq('is_active', true)
        .eq('status', 'approved')
        .limit(500);
      
      if (error) throw error;
      
      if (!businesses || businesses.length === 0) {
        toast.info('Aucune boutique approuvée à soumettre');
        setLoading(false);
        return;
      }
      
      const urls = businesses.map(b => `${BASE_URL}/boutique/${b.id}`);
      await submitToIndexNow(urls, 'business');
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast.error('Erreur lors de la récupération des boutiques');
      setLoading(false);
    }
  };

  const handleCustomUrl = async () => {
    if (!customUrl) {
      toast.error('Veuillez entrer une URL');
      return;
    }
    
    // Ensure URL is absolute
    let fullUrl = customUrl;
    if (customUrl.startsWith('/')) {
      fullUrl = `${BASE_URL}${customUrl}`;
    } else if (!customUrl.startsWith('http')) {
      fullUrl = `${BASE_URL}/${customUrl}`;
    }
    
    // Validate it's our domain
    try {
      const parsed = new URL(fullUrl);
      if (parsed.hostname !== 'joiedevivre-africa.com') {
        toast.error('L\'URL doit appartenir à joiedevivre-africa.com');
        return;
      }
    } catch {
      toast.error('URL invalide');
      return;
    }
    
    await submitToIndexNow([fullUrl], 'page');
    setCustomUrlModalOpen(false);
    setCustomUrl('');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            IndexNow
            {lastResult?.success && <CheckCircle className="h-3 w-3 text-green-500" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Soumettre à Bing & Yandex
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handlePriorityPages} disabled={loading}>
            <Globe className="h-4 w-4 mr-2" />
            Pages prioritaires
            <span className="ml-auto text-xs text-muted-foreground">5 URLs</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleAllProducts} disabled={loading}>
            <Package className="h-4 w-4 mr-2" />
            Tous les produits actifs
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleAllBusinesses} disabled={loading}>
            <Store className="h-4 w-4 mr-2" />
            Toutes les boutiques
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setCustomUrlModalOpen(true)} disabled={loading}>
            <Link className="h-4 w-4 mr-2" />
            URL personnalisée...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom URL Modal */}
      <Dialog open={customUrlModalOpen} onOpenChange={setCustomUrlModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Soumettre une URL à IndexNow</DialogTitle>
            <DialogDescription>
              Entrez l'URL ou le chemin à soumettre pour indexation rapide sur Bing et Yandex.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-url">URL ou chemin</Label>
              <Input
                id="custom-url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="/product/abc123 ou https://joiedevivre-africa.com/..."
              />
              <p className="text-xs text-muted-foreground">
                Exemple: /shop, /product/id, /boutique/id
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomUrlModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCustomUrl} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Soumission...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Soumettre
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
