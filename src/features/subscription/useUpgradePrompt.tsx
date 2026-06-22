import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { UpgradePromptModal } from './UpgradePromptModal';
import type { FeatureId } from './featureCatalog';

interface UpgradeContext {
  open: (opts: { feature: FeatureId; reason?: string }) => void;
}

const Ctx = createContext<UpgradeContext | null>(null);

export const UpgradePromptProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<{ feature: FeatureId; reason?: string } | null>(null);

  const open = useCallback((opts: { feature: FeatureId; reason?: string }) => {
    setState(opts);
  }, []);

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {state && (
        <UpgradePromptModal
          feature={state.feature}
          reason={state.reason}
          onClose={() => setState(null)}
        />
      )}
    </Ctx.Provider>
  );
};

export const useUpgradePrompt = (): UpgradeContext => {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Fallback silencieux : permet d'appeler le hook même sans provider.
    return {
      open: () => {
        if (typeof window !== 'undefined') {
          window.location.href = '/pricing';
        }
      },
    };
  }
  return ctx;
};