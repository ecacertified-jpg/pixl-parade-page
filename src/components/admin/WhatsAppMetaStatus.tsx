import { useState } from 'react';
import { Shield, CheckCircle2, Circle, ExternalLink, ChevronDown, ChevronUp, Copy, Phone, Globe, Link2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

const META_APP_MODE = import.meta.env.VITE_META_APP_MODE || 'development';
const isProduction = META_APP_MODE === 'production';

const WEBHOOK_URL = 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/whatsapp-webhook';
const PHONE_NUMBER_ID = '1051948151326455';
const NAMESPACE = 'joiedevivre';

interface ChecklistItem {
  label: string;
  completed: boolean;
  detail?: string;
}

const checklist: ChecklistItem[] = [
  { label: 'Créer un compte Meta Business vérifié', completed: true },
  { label: 'Associer un numéro de téléphone vérifié au compte WhatsApp Business', completed: true },
  { label: 'Configurer le webhook de réception des messages', completed: true },
  { label: "Soumettre l'app pour revue Meta avec vidéo de démonstration", completed: false, detail: 'Requis pour les permissions whatsapp_business_messaging et whatsapp_business_management' },
  { label: 'Activer le mode "En ligne" dans les paramètres de l\'app', completed: false },
  { label: 'Configurer un moyen de paiement actif pour les conversations WhatsApp', completed: false, detail: 'Les messages ne sont pas envoyés sans paiement actif' },
];

const configItems = [
  { icon: Phone, label: 'Phone Number ID', value: PHONE_NUMBER_ID },
  { icon: Globe, label: 'Namespace', value: NAMESPACE },
  { icon: Link2, label: 'Webhook URL', value: WEBHOOK_URL },
];

export function WhatsAppMetaStatus() {
  const [isOpen, setIsOpen] = useState(!isProduction);

  const completedCount = checklist.filter(i => i.completed).length;
  const totalCount = checklist.length;

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copié`);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base font-semibold font-poppins">
                  Statut Meta WhatsApp
                </CardTitle>
                <Badge
                  className={
                    isProduction
                      ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400'
                      : 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400'
                  }
                >
                  {isProduction ? '✓ Production' : '⚠ Développement'}
                </Badge>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {completedCount}/{totalCount} étapes complétées
                </span>
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Checklist */}
            <div>
              <h4 className="text-sm font-medium font-poppins mb-3 text-muted-foreground">
                Checklist de mise en production
              </h4>
              <ul className="space-y-2.5">
                {checklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    {item.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <span className={`text-sm ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {item.label}
                      </span>
                      {item.detail && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Configuration */}
            <div>
              <h4 className="text-sm font-medium font-poppins mb-3 text-muted-foreground">
                Configuration actuelle
              </h4>
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                {configItems.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground shrink-0">{label} :</span>
                      <code className="text-xs bg-background px-1.5 py-0.5 rounded truncate">{value}</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={(e) => { e.stopPropagation(); handleCopy(value, label); }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Meta Business Manager
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Documentation API
                </a>
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
