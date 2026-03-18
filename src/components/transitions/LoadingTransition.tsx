/**
 * LoadingTransition - Fallback minimal pour Suspense
 * Invisible pour éviter tout flash de spinner.
 */
export function LoadingTransition() {
  return <div className="min-h-screen bg-background" />;
}
