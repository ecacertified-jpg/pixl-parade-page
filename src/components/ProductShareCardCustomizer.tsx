import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Crown, Minimize2, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

export type ShareCardTemplate = 'classic' | 'festive' | 'elegance' | 'minimal';

export interface ShareCardCustomization {
  template: ShareCardTemplate;
  message: string;
}

interface ProductShareCardCustomizerProps {
  customization: ShareCardCustomization;
  onCustomizationChange: (customization: ShareCardCustomization) => void;
}

const templates: { id: ShareCardTemplate; name: string; icon: React.ReactNode; description: string }[] = [
  { 
    id: 'classic', 
    name: 'Classique', 
    icon: <Sparkles className="h-4 w-4" />,
    description: 'Sobre et professionnel'
  },
  { 
    id: 'festive', 
    name: 'Festif', 
    icon: <PartyPopper className="h-4 w-4" />,
    description: 'Pour les célébrations'
  },
  { 
    id: 'elegance', 
    name: 'Élégance', 
    icon: <Crown className="h-4 w-4" />,
    description: 'Luxe et raffiné'
  },
  { 
    id: 'minimal', 
    name: 'Minimal', 
    icon: <Minimize2 className="h-4 w-4" />,
    description: 'Épuré et simple'
  },
];

const messageSuggestions = [
  "Je pense à toi ! 💝",
  "Le cadeau parfait ! 🎁",
  "Regarde ça ! 😍",
  "Ça te plairait ? ✨",
];

const MAX_MESSAGE_LENGTH = 100;

export function ProductShareCardCustomizer({
  customization,
  onCustomizationChange,
}: ProductShareCardCustomizerProps) {
  const [messageLength, setMessageLength] = useState(customization.message.length);

  const handleTemplateChange = useCallback((template: ShareCardTemplate) => {
    onCustomizationChange({ ...customization, template });
  }, [customization, onCustomizationChange]);

  const handleMessageChange = useCallback((message: string) => {
    if (message.length <= MAX_MESSAGE_LENGTH) {
      setMessageLength(message.length);
      onCustomizationChange({ ...customization, message });
    }
  }, [customization, onCustomizationChange]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    handleMessageChange(suggestion);
  }, [handleMessageChange]);

  return (
    <div className="space-y-4">
      {/* Template selector */}
      <div>
        <p className="text-sm font-medium mb-2">Choisir un style</p>
        <div className="grid grid-cols-4 gap-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateChange(template.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
                "hover:border-primary/50 hover:bg-primary/5",
                customization.template === template.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background"
              )}
            >
              <div className={cn(
                "p-2 rounded-full",
                customization.template === template.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {template.icon}
              </div>
              <span className="text-xs font-medium">{template.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">💬 Message personnel</p>
          <span className="text-xs text-muted-foreground">
            {messageLength}/{MAX_MESSAGE_LENGTH}
          </span>
        </div>
        <Textarea
          placeholder="Ajouter un message (optionnel)..."
          value={customization.message}
          onChange={(e) => handleMessageChange(e.target.value)}
          className="resize-none h-20"
          maxLength={MAX_MESSAGE_LENGTH}
        />
      </div>

      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-2">
        {messageSuggestions.map((suggestion) => (
          <Button
            key={suggestion}
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => handleSuggestionClick(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}
