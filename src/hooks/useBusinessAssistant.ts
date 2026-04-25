import { useCallback, useRef, useState } from 'react';
import type { BusinessQualitySnapshot } from './useBusinessQualityScore';

export type AssistantMessage = { role: 'user' | 'assistant'; content: string };

export type AssistantError =
  | { type: 'rate_limit'; message: string }
  | { type: 'credits'; message: string }
  | { type: 'network'; message: string }
  | { type: 'server'; message: string };

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/business-assistant`;
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export function useBusinessAssistant() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<AssistantError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setMessages([]);
    setError(null);
  }, [stop]);

  const send = useCallback(
    async (
      userText: string,
      opts?: { snapshot?: BusinessQualitySnapshot | null; step?: string; retryLast?: boolean },
    ) => {
      const trimmed = userText.trim();
      if (!trimmed && !opts?.retryLast) return;
      if (streaming) return;

      setError(null);

      const baseHistory = opts?.retryLast
        ? messages
        : [...messages, { role: 'user' as const, content: trimmed }];

      if (!opts?.retryLast) {
        setMessages(baseHistory);
      }

      setStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      let assistantBuffer = '';
      const upsertAssistant = (chunk: string) => {
        assistantBuffer += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantBuffer } : m,
            );
          }
          return [...prev, { role: 'assistant', content: assistantBuffer }];
        });
      };

      try {
        const resp = await fetch(ENDPOINT, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: baseHistory,
            snapshot: opts?.snapshot ?? null,
            step: opts?.step,
          }),
        });

        if (!resp.ok) {
          let payload: any = null;
          try { payload = await resp.json(); } catch { /* ignore */ }
          if (resp.status === 429) {
            setError({ type: 'rate_limit', message: payload?.error || 'Trop de demandes — réessayez dans quelques secondes.' });
          } else if (resp.status === 402) {
            setError({ type: 'credits', message: payload?.error || 'Crédits IA épuisés.' });
          } else {
            setError({ type: 'server', message: payload?.error || `Erreur serveur (${resp.status}).` });
          }
          setStreaming(false);
          return;
        }

        if (!resp.body) {
          setError({ type: 'server', message: 'Réponse vide du serveur.' });
          setStreaming(false);
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = '';
        let done = false;

        while (!done) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') { done = true; break; }
            try {
              const parsed = JSON.parse(jsonStr);
              const content: string | undefined = parsed.choices?.[0]?.delta?.content;
              if (content) upsertAssistant(content);
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }

        // Final flush
        if (textBuffer.trim()) {
          for (let raw of textBuffer.split('\n')) {
            if (!raw) continue;
            if (raw.endsWith('\r')) raw = raw.slice(0, -1);
            if (!raw.startsWith('data: ')) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content: string | undefined = parsed.choices?.[0]?.delta?.content;
              if (content) upsertAssistant(content);
            } catch { /* ignore */ }
          }
        }

        if (assistantBuffer.length === 0) {
          setError({ type: 'server', message: "L'assistant n'a pas pu répondre. Réessayez." });
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          // user-cancelled, no error
        } else {
          console.error('useBusinessAssistant stream error', err);
          setError({ type: 'network', message: 'Connexion interrompue. Vérifiez votre réseau et relancez.' });
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming],
  );

  const retry = useCallback(
    (opts?: { snapshot?: BusinessQualitySnapshot | null; step?: string }) => {
      // Drop last assistant message if any then resend last user input
      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      if (!lastUser) return;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') return prev.slice(0, -1);
        return prev;
      });
      void send(lastUser.content, { ...opts, retryLast: false });
    },
    [messages, send],
  );

  return { messages, streaming, error, send, retry, stop, reset, setMessages };
}