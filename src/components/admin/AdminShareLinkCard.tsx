import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Share2, RefreshCw, Loader2, MousePointerClick, UserPlus, Users, Link } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminShareCode } from '@/hooks/useAdminShareCode';
import { AdminShareMenu } from './AdminShareMenu';

export const AdminShareLinkCard = () => {
  const { shareCode, loading, regenerate, getShareLink } = useAdminShareCode();
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleCopy = () => {
    const link = getShareLink();
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success('Lien copié !');
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    await regenerate();
    setRegenerating(false);
    toast.success('Nouveau code généré !');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!shareCode) return null;

  const link = getShareLink();

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link className="h-5 w-5 text-primary" />
            Mon lien de partage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Link display */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <p className="text-sm font-mono break-all flex-1">{link}</p>
            <Button variant="ghost" size="icon" className="shrink-0" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => setShareMenuOpen(true)}>
              <Share2 className="mr-2 h-4 w-4" /> Partager
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRegenerate}
              disabled={regenerating}
              title="Régénérer le code"
            >
              {regenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-secondary/30 rounded-lg">
              <MousePointerClick className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-semibold">{shareCode.clicks_count}</p>
              <p className="text-xs text-muted-foreground">Clics</p>
            </div>
            <div className="text-center p-2 bg-secondary/30 rounded-lg">
              <UserPlus className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-semibold">{shareCode.signups_count}</p>
              <p className="text-xs text-muted-foreground">Inscriptions</p>
            </div>
            <div className="text-center p-2 bg-secondary/30 rounded-lg">
              <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-semibold">{shareCode.assignments_count}</p>
              <p className="text-xs text-muted-foreground">Affectations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AdminShareMenu
        open={shareMenuOpen}
        onOpenChange={setShareMenuOpen}
        shareLink={link}
        code={shareCode.code}
      />
    </>
  );
};
