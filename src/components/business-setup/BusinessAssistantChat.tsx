import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, Sparkles, RotateCw, AlertTriangle, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBusinessAssistant } from '@/hooks/useBusinessAssistant';
import type { BusinessQualitySnapshot } from '@/hooks/useBusinessQualityScore';
import { cn } from '@/lib/utils';

interface BusinessAssistantChatProps {
  snapshot: BusinessQualitySnapshot | null;
  step?: string;
  initialPrompt?: string;
  className?: string;
}

// Suggestions par étape du wizard
const STEP_SUGGESTIONS: Record<string, string[]> = {
  welcome: [
    '🚀 Par où commencer ?',
    '⏱️ Combien de temps pour configurer ma boutique ?',
    '🥉 C’est quoi le palier Bronze ?',
  ],
  profile: [
    '✍️ Rédige une description vendeuse en 2 lignes',
    '🎨 Quel logo choisir pour ma boutique ?',
    '🏷️ Améliore mon nom de boutique',
  ],
  'first-product': [
    '🎁 Suggère 3 produits adaptés à ma boutique',
    '💰 Conseille-moi un prix réaliste en FCFA',
    '📸 Comment réussir la photo d’un produit ?',
    '✏️ Rédige une description de produit courte',
  ],
  delivery: [
    '🚚 Propose une grille de zones de livraison',
    '💸 Quel seuil de livraison gratuite ?',
    '🏙️ Quels frais pour Abidjan / Cocody / Yopougon ?',
  ],
  payment: [
    '📱 Mobile Money ou Wave : que choisir ?',
    '🔒 Comment sécuriser mes paiements ?',
    '🧾 Quelles infos demander à mon client ?',
  ],
  launch: [
    '📣 Rédige un message WhatsApp pour partager ma boutique',
    '🔔 Pourquoi activer les notifications ?',
    '📈 Comment obtenir mes premières commandes ?',
  ],
};

// Suggestions par palier (utilisées hors wizard ou en complément)
const TIER_SUGGESTIONS: Record<string, string[]> = {
  none: [
    '🥉 Comment débloquer le palier Bronze ?',
    '🔍 Vérifie mes infos et dis-moi ce qui manque',
  ],
  bronze: [
    '🥈 Comment passer au palier Argent ?',
    '🚚 Aide-moi à configurer la livraison',
  ],
  silver: [
    '🥇 Combien de produits pour atteindre le palier Or ?',
    '✨ Optimise ma boutique pour vendre plus',
  ],
  gold: [
    '🌟 Comment garder mon palier Or actif ?',
    '📈 Astuces pour vendre encore plus',
  ],
};

function buildSuggestions(step?: string, tier?: string | null): string[] {
  const fromStep = step && STEP_SUGGESTIONS[step] ? STEP_SUGGESTIONS[step] : [];
  const fromTier = TIER_SUGGESTIONS[tier || 'none'] ?? [];
  // Fusion : étape d'abord (3 max), palier ensuite (2 max), unique, total max 5
  const merged: string[] = [];
  for (const s of [...fromStep.slice(0, 3), ...fromTier.slice(0, 2)]) {
    if (!merged.includes(s)) merged.push(s);
    if (merged.length >= 5) break;
  }
  // Fallback si rien
  if (merged.length === 0) {
    return [
      '✍️ Rédige une description vendeuse pour ma boutique',
      '🎁 Suggère 3 produits adaptés à ma boutique',
      '🔍 Vérifie mes infos et dis-moi ce qui manque',
    ];
  }
  return merged;
}

export function BusinessAssistantChat({
  snapshot,
  step,
  initialPrompt,
  className,
}: BusinessAssistantChatProps) {
  const { messages, streaming, error, send, retry, stop, setMessages } = useBusinessAssistant();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const greetedRef = useRef(false);

  const suggestions = buildSuggestions(step, snapshot?.setup_tier);
  const tierLabel = snapshot?.setup_tier
    ? ({ bronze: '🥉 Bronze', silver: '🥈 Argent', gold: '🥇 Or' } as Record<string, string>)[snapshot.setup_tier]
    : null;
  const stepLabel = step
    ? ({
        welcome: 'Accueil',
        profile: 'Profil boutique',
        'first-product': 'Vos produits',
        delivery: 'Livraison',
        payment: 'Paiements',
        launch: 'Lancement',
      } as Record<string, string>)[step]
    : null;

  // Welcome message on first open
  useEffect(() => {
    if (greetedRef.current || messages.length > 0) return;
    greetedRef.current = true;
    const name = snapshot?.business_name ? ` ${snapshot.business_name}` : '';
    const stepIntro = stepLabel ? `\n\n📍 Étape en cours : **${stepLabel}**.` : '';
    const tierIntro = tierLabel ? `\n🏅 Palier actuel : **${tierLabel}**.` : '';
    setMessages([
      {
        role: 'assistant',
        content: `Bonjour 👋 je suis votre assistant **JOIE DE VIVRE**.\n\nJe peux vous aider à configurer **${name || 'votre boutique'}**, rédiger des descriptions, suggérer des prix et valider vos infos.${stepIntro}${tierIntro}\n\n${
          initialPrompt ? `_${initialPrompt}_\n\n` : ''
        }Choisissez une suggestion ci-dessous ou posez-moi votre question.`,
      },
    ]);
  }, [snapshot?.business_name, initialPrompt, messages.length, setMessages, stepLabel, tierLabel]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  const handleSend = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || streaming) return;
    setInput('');
    void send(value, { snapshot, step });
  };

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef as any}>
        <div className="py-4 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                'flex',
                m.role === 'user' ? 'justify-end' : 'justify-start',
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm',
                )}
              >
                {m.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-headings:my-2">
                    <ReactMarkdown>{m.content || '…'}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}

          {streaming && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-destructive">
                    {error.type === 'rate_limit' && 'Trop de demandes'}
                    {error.type === 'credits' && 'Crédits IA épuisés'}
                    {error.type === 'network' && 'Problème de connexion'}
                    {error.type === 'server' && 'Erreur de l’assistant'}
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">{error.message}</p>
                  {error.type !== 'credits' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7 gap-1 text-xs"
                      onClick={() => retry({ snapshot, step })}
                    >
                      <RotateCw className="w-3 h-3" />
                      Réessayer
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick suggestions (only when conversation is short) */}
      {messages.length <= 2 && !streaming && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {suggestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full px-3 py-1.5 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-3 bg-card">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Demandez de l'aide à l'assistant…"
            className="min-h-[44px] max-h-32 resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={streaming}
          />
          {streaming ? (
            <Button size="icon" variant="outline" onClick={stop} aria-label="Arrêter">
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="bg-gradient-to-br from-primary to-accent"
              aria-label="Envoyer"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Propulsé par Lovable AI
        </p>
      </div>
    </div>
  );
}