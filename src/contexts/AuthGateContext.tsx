import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, LogIn, UserPlus } from "lucide-react";

export type AuthIntent =
  | "react"
  | "comment"
  | "favorite"
  | "contribute_fund"
  | "create_fund"
  | "create_birthday_page"
  | "create_event"
  | "add_to_cart"
  | "buy"
  | "open_cart"
  | "open_notifications"
  | "open_profile"
  | "follow"
  | "friend_request"
  | "upload_media"
  | "post_message"
  | "open_protected"
  | "generic";

const INTENT_LABELS: Record<AuthIntent, { title: string; desc: string }> = {
  react: {
    title: "Connecte-toi pour réagir",
    desc: "Crée ton compte JDV pour partager ton émotion sur ce moment.",
  },
  comment: {
    title: "Connecte-toi pour commenter",
    desc: "Rejoins JDV pour laisser un mot doux ou un encouragement.",
  },
  favorite: {
    title: "Connecte-toi pour ajouter aux favoris",
    desc: "Garde tes coups de cœur en sécurité dans ton compte.",
  },
  contribute_fund: {
    title: "Connecte-toi pour contribuer",
    desc: "Quelques secondes suffisent pour participer à cette cagnotte.",
  },
  create_fund: {
    title: "Crée ton compte pour lancer une cagnotte",
    desc: "Réunis tes proches autour d'un cadeau collectif.",
  },
  create_birthday_page: {
    title: "Crée ton compte pour ta page d'anniversaire",
    desc: "Lance ta célébration et invite tes proches.",
  },
  create_event: {
    title: "Crée ton compte pour organiser un événement",
    desc: "Mariage, baptême, fête — JDV t'accompagne.",
  },
  add_to_cart: {
    title: "Connecte-toi pour ajouter au panier",
    desc: "Ton panier est lié à ton compte JDV.",
  },
  buy: {
    title: "Connecte-toi pour commander",
    desc: "On garde tes infos de livraison en sécurité.",
  },
  open_cart: {
    title: "Connecte-toi pour accéder à ton panier",
    desc: "Retrouve tes articles favoris à tout moment.",
  },
  open_notifications: {
    title: "Connecte-toi pour voir tes notifications",
    desc: "Ne rate aucun anniversaire ni cadeau reçu.",
  },
  open_profile: {
    title: "Connecte-toi pour accéder à ton profil",
    desc: "Personnalise ton expérience JDV.",
  },
  follow: {
    title: "Connecte-toi pour suivre",
    desc: "Reste informé des nouveautés et offres.",
  },
  friend_request: {
    title: "Connecte-toi pour ajouter un ami",
    desc: "Construis ton cercle d'amis sur JDV.",
  },
  upload_media: {
    title: "Connecte-toi pour ajouter une photo ou vidéo",
    desc: "Partage tes plus beaux moments en toute sécurité.",
  },
  post_message: {
    title: "Connecte-toi pour laisser un message",
    desc: "Écris un mot doux qui restera gravé.",
  },
  open_protected: {
    title: "Connecte-toi pour continuer",
    desc: "Cette section est réservée aux membres JDV.",
  },
  generic: {
    title: "Rejoins JDV",
    desc: "Crée ton compte gratuit pour profiter de toutes les fonctionnalités.",
  },
};

interface PendingIntent {
  intent: AuthIntent;
  targetName?: string;
  returnTo: string;
}

interface AuthGateContextType {
  /**
   * Returns a function that, when called, will either execute the action
   * immediately (if user is signed in) or open the auth modal.
   * If the user signs in, the action will NOT be auto-replayed (browser
   * may have reloaded). Use `returnTo` query for context-restoration.
   */
  requireAuth: (
    intent: AuthIntent,
    action: () => void,
    options?: { targetName?: string; returnTo?: string }
  ) => () => void;
  /** Direct open without a deferred action. */
  openAuthGate: (intent: AuthIntent, options?: { targetName?: string; returnTo?: string }) => void;
  isOpen: boolean;
}

const AuthGateContext = createContext<AuthGateContextType | null>(null);

export const useAuthGate = () => {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error("useAuthGate must be used inside AuthGateProvider");
  return ctx;
};

export const AuthGateProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pending, setPending] = useState<PendingIntent | null>(null);

  const openAuthGate = useCallback(
    (intent: AuthIntent, options?: { targetName?: string; returnTo?: string }) => {
      const returnTo = options?.returnTo ?? location.pathname + location.search;
      setPending({ intent, targetName: options?.targetName, returnTo });
    },
    [location.pathname, location.search]
  );

  const requireAuth = useCallback(
    (intent: AuthIntent, action: () => void, options?: { targetName?: string; returnTo?: string }) =>
      () => {
        if (loading) return;
        if (user) {
          action();
          return;
        }
        openAuthGate(intent, options);
      },
    [user, loading, openAuthGate]
  );

  const handleClose = () => setPending(null);

  const goToAuth = (tab: "signin" | "signup") => {
    if (!pending) return;
    const params = new URLSearchParams();
    params.set("tab", tab);
    params.set("returnTo", pending.returnTo);
    params.set("intent", pending.intent);
    if (pending.targetName) params.set("for", pending.targetName);
    try {
      sessionStorage.setItem(
        "jdv_pending_intent",
        JSON.stringify(pending)
      );
      // Also keep legacy `returnUrl` so existing redirect logic works.
      localStorage.setItem("returnUrl", pending.returnTo);
    } catch {}
    setPending(null);
    navigate(`/auth?${params.toString()}`);
  };

  const labels = pending ? INTENT_LABELS[pending.intent] : null;

  const value = useMemo<AuthGateContextType>(
    () => ({ requireAuth, openAuthGate, isOpen: !!pending }),
    [requireAuth, openAuthGate, pending]
  );

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      <Dialog open={!!pending} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center mb-2">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center font-poppins">
              {labels?.title}
              {pending?.targetName ? ` à ${pending.targetName}` : ""}
            </DialogTitle>
            <DialogDescription className="text-center">
              {labels?.desc}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-col gap-2 mt-2">
            <Button
              className="w-full bg-gradient-to-r from-primary to-accent"
              onClick={() => goToAuth("signup")}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Créer mon compte
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => goToAuth("signin")}
            >
              <LogIn className="h-4 w-4 mr-2" />
              J'ai déjà un compte
            </Button>
            <button
              type="button"
              onClick={handleClose}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
            >
              Continuer à explorer sans compte
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGateContext.Provider>
  );
};