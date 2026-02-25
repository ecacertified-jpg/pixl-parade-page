import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CORRUPTED_SESSION_PATTERNS = [
  'bad_jwt',
  'missing sub',
  'invalid claim',
  'invalid token',
  'token is expired',
  'jwt expired',
];

/**
 * Détecte si une erreur est liée à une session corrompue ou un JWT invalide.
 */
export function isCorruptedSessionError(error: unknown): boolean {
  if (!error) return false;

  const message = typeof error === 'object' && error !== null
    ? (error as any).message || (error as any).error_description || (error as any).msg || String(error)
    : String(error);

  const code = typeof error === 'object' && error !== null
    ? (error as any).code || (error as any).error || ''
    : '';

  const combined = `${message} ${code}`.toLowerCase();
  return CORRUPTED_SESSION_PATTERNS.some(pattern => combined.includes(pattern));
}

/**
 * Nettoie une session corrompue : signOut + nettoyage localStorage + reset state.
 * Retourne true si un nettoyage a été effectué.
 */
export async function cleanupCorruptedSession(): Promise<boolean> {
  try {
    console.warn('🧹 Nettoyage de session corrompue en cours...');
    
    // Tenter un signOut propre
    await supabase.auth.signOut({ scope: 'local' });
  } catch (e) {
    console.warn('SignOut failed during cleanup, clearing manually:', e);
  }

  // Fallback : nettoyer les clés sb-* du localStorage
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    if (keysToRemove.length > 0) {
      console.log(`🧹 Removed ${keysToRemove.length} corrupted session keys from localStorage`);
    }
  } catch (e) {
    console.warn('localStorage cleanup failed:', e);
  }

  return true;
}

/**
 * Gère une erreur d'authentification. Si c'est une session corrompue,
 * nettoie et affiche un toast. Retourne true si l'erreur a été gérée.
 */
export async function handleAuthError(error: unknown): Promise<boolean> {
  if (!isCorruptedSessionError(error)) return false;

  await cleanupCorruptedSession();

  toast.error('Session expirée', {
    description: 'Votre session a expiré ou est invalide. Veuillez vous reconnecter.',
  });

  return true;
}
