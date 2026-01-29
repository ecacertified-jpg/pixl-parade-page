import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Copy, 
  Check, 
  MessageCircle, 
  Facebook, 
  Twitter, 
  Instagram,
  Mail,
  Smartphone,
  Hash
} from 'lucide-react';
import { useSocialPost } from '@/hooks/useSocialPost';
import { buildHashtags, type HashtagCategory, HASHTAGS } from '@/data/social-media-content';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Platform = 'instagram' | 'facebook' | 'twitter' | 'whatsapp' | 'sms' | 'email';

interface SocialPostGeneratorProps {
  type: 'product' | 'fund';
  data: {
    // Product fields
    name?: string;
    price?: number;
    currency?: string;
    city?: string;
    category?: string;
    url: string;
    // Fund fields
    beneficiary?: string;
    occasion?: string;
    target?: number;
    current?: number;
    deadline?: string;
  };
  onSelectPost?: (text: string, platform: Platform) => void;
  compact?: boolean;
}

const PLATFORM_CONFIG: Record<Platform, { icon: typeof MessageCircle; label: string; color: string }> = {
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', color: 'hover:bg-green-50 hover:border-green-500 hover:text-green-600' },
  facebook: { icon: Facebook, label: 'Facebook', color: 'hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600' },
  instagram: { icon: Instagram, label: 'Instagram', color: 'hover:bg-pink-50 hover:border-pink-500 hover:text-pink-600' },
  twitter: { icon: Twitter, label: 'Twitter', color: 'hover:bg-sky-50 hover:border-sky-500 hover:text-sky-600' },
  sms: { icon: Smartphone, label: 'SMS', color: 'hover:bg-purple-50 hover:border-purple-500 hover:text-purple-600' },
  email: { icon: Mail, label: 'Email', color: 'hover:bg-orange-50 hover:border-orange-500 hover:text-orange-600' },
};

export function SocialPostGenerator({
  type,
  data,
  onSelectPost,
  compact = false,
}: SocialPostGeneratorProps) {
  const { 
    generateProductPost, 
    generateFundPost, 
    productTemplates, 
    fundTemplates,
    copyToClipboard 
  } = useSocialPost();
  
  const [selectedTemplate, setSelectedTemplate] = useState(
    type === 'product' ? productTemplates[0].id : fundTemplates[0].id
  );
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('whatsapp');
  const [copied, setCopied] = useState(false);
  const [showHashtags, setShowHashtags] = useState(false);

  const templates = type === 'product' ? productTemplates : fundTemplates;

  // Générer le post basé sur les sélections
  const generatedPost = useMemo(() => {
    if (type === 'product') {
      return generateProductPost(selectedTemplate, {
        name: data.name || 'Produit',
        price: data.price || 0,
        currency: data.currency || 'XOF',
        city: data.city,
        category: data.category,
        url: data.url,
      }, selectedPlatform);
    } else {
      return generateFundPost(selectedTemplate, {
        beneficiary: data.beneficiary || 'un proche',
        occasion: data.occasion || 'cadeau',
        target: data.target || 0,
        current: data.current || 0,
        currency: data.currency || 'XOF',
        deadline: data.deadline,
        url: data.url,
      }, selectedPlatform);
    }
  }, [type, selectedTemplate, selectedPlatform, data, generateProductPost, generateFundPost]);

  // Hashtags suggérés
  const suggestedHashtags = useMemo(() => {
    const categories: HashtagCategory[] = ['brand'];
    
    if (type === 'product') {
      if (data.category) {
        const catKey = data.category.toLowerCase() as HashtagCategory;
        if (HASHTAGS[catKey]) categories.push(catKey);
      }
      if (data.city) {
        const cityKey = data.city.toLowerCase().replace(/[éè]/g, 'e') as HashtagCategory;
        if (HASHTAGS[cityKey]) categories.push(cityKey);
      }
    } else {
      if (data.occasion) {
        const occasionKey = data.occasion.toLowerCase().replace(/[éè]/g, 'e') as HashtagCategory;
        if (HASHTAGS[occasionKey]) categories.push(occasionKey);
      }
    }
    
    return buildHashtags(categories, { limit: 8, platform: selectedPlatform as 'instagram' | 'twitter' | 'facebook' | 'whatsapp' });
  }, [type, data, selectedPlatform]);

  const handleCopy = async () => {
    const success = await copyToClipboard(generatedPost);
    if (success) {
      setCopied(true);
      toast.success('Post copié !');
      setTimeout(() => setCopied(false), 2000);
      onSelectPost?.(generatedPost, selectedPlatform);
    } else {
      toast.error('Erreur lors de la copie');
    }
  };

  const handleCopyHashtags = async () => {
    const success = await copyToClipboard(suggestedHashtags);
    if (success) {
      toast.success('Hashtags copiés !');
    }
  };

  const characterCount = generatedPost.length;
  const isTwitterOverLimit = selectedPlatform === 'twitter' && characterCount > 280;

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Template selector compact */}
        <div className="flex flex-wrap gap-2">
          {templates.slice(0, 4).map((template) => (
            <Button
              key={template.id}
              variant={selectedTemplate === template.id ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setSelectedTemplate(template.id)}
            >
              {template.emoji} {template.label}
            </Button>
          ))}
        </div>
        
        {/* Preview compact */}
        <div className="p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
          {generatedPost}
        </div>
        
        {/* Copy button */}
        <Button
          size="sm"
          variant="secondary"
          className="w-full"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-600" />
              Copié !
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copier le message
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Template selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">📝 Choisir un modèle</label>
        <div className="flex flex-wrap gap-2">
          {templates.map((template) => (
            <Button
              key={template.id}
              variant={selectedTemplate === template.id ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => setSelectedTemplate(template.id)}
            >
              {template.emoji} {template.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Platform tabs */}
      <Tabs value={selectedPlatform} onValueChange={(v) => setSelectedPlatform(v as Platform)}>
        <TabsList className="grid grid-cols-6 w-full">
          {(Object.entries(PLATFORM_CONFIG) as [Platform, typeof PLATFORM_CONFIG['whatsapp']][]).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <TabsTrigger key={key} value={key} className="p-2">
                <Icon className="h-4 w-4" />
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((platform) => (
          <TabsContent key={platform} value={platform} className="mt-4">
            {/* Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Aperçu du post</label>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={isTwitterOverLimit ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {characterCount} caractères
                  </Badge>
                  {platform === 'twitter' && (
                    <span className="text-xs text-muted-foreground">(max 280)</span>
                  )}
                </div>
              </div>
              
              <ScrollArea className="h-40">
                <div 
                  className={cn(
                    "p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap",
                    isTwitterOverLimit && "border-destructive border"
                  )}
                >
                  {generatedPost}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Hashtags section */}
      {selectedPlatform !== 'whatsapp' && selectedPlatform !== 'sms' && selectedPlatform !== 'email' && (
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs w-full justify-between"
            onClick={() => setShowHashtags(!showHashtags)}
          >
            <span className="flex items-center gap-2">
              <Hash className="h-3 w-3" />
              Hashtags suggérés
            </span>
            <Badge variant="outline" className="text-xs">
              {suggestedHashtags.split(' ').filter(Boolean).length}
            </Badge>
          </Button>
          
          {showHashtags && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex flex-wrap gap-1 mb-2">
                {suggestedHashtags.split(' ').filter(Boolean).map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={handleCopyHashtags}
              >
                <Copy className="h-3 w-3 mr-2" />
                Copier les hashtags
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={handleCopy}
          disabled={isTwitterOverLimit}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-600" />
              Copié !
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copier le post
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
