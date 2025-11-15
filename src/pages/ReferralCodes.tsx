import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Copy, Share2 } from 'lucide-react';
import { useReferralCodes, ReferralCode } from '@/hooks/useReferralCodes';
import { ReferralCodeCard } from '@/components/referral/ReferralCodeCard';
import { CreateReferralCodeModal } from '@/components/referral/CreateReferralCodeModal';
import { ReferralShareMenu } from '@/components/referral/ReferralShareMenu';
import { toast } from 'sonner';

export default function ReferralCodes() {
  const navigate = useNavigate();
  const { codes, primaryCode, loading, createCode, updateCode, deleteCode } = useReferralCodes();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCodeForShare, setSelectedCodeForShare] = useState<ReferralCode | null>(null);

  const handleCreateCode = async (label: string, codeType: string) => {
    await createCode(label, codeType);
  };

  const handleToggleActive = async (code: ReferralCode) => {
    await updateCode(code.id, { is_active: !code.is_active });
  };

  const handleDelete = async (code: ReferralCode) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce code ?')) {
      await deleteCode(code.id);
    }
  };

  const copyPrimaryLink = () => {
    if (primaryCode) {
      const link = `${window.location.origin}/auth?ref=${primaryCode.code}`;
      navigator.clipboard.writeText(link);
      toast.success('Lien copié !');
    }
  };

  const totalStats = {
    views: codes.reduce((sum, c) => sum + c.views_count, 0),
    clicks: codes.reduce((sum, c) => sum + c.clicks_count, 0),
    signups: codes.reduce((sum, c) => sum + c.signups_count, 0),
  };

  const conversionRate = totalStats.clicks > 0 
    ? ((totalStats.signups / totalStats.clicks) * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/invitations')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Mes Codes de Parrainage</h1>
              <p className="text-sm text-muted-foreground">
                Gérez vos codes et suivez leurs performances
              </p>
            </div>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Code
          </Button>
        </div>

        {/* Primary Code Highlight */}
        {primaryCode && (
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">🎯 Code Principal</p>
                  <code className="text-3xl font-bold text-primary">{primaryCode.code}</code>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={copyPrimaryLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copier
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedCodeForShare(primaryCode)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Partager
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Votre lien: {window.location.origin}/auth?ref={primaryCode.code}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Global Stats */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Statistiques Globales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold text-primary">{totalStats.views}</div>
                <div className="text-sm text-muted-foreground">Vues</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold text-primary">{totalStats.clicks}</div>
                <div className="text-sm text-muted-foreground">Clics</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold text-primary">{totalStats.signups}</div>
                <div className="text-sm text-muted-foreground">Inscriptions</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-3xl font-bold text-primary">{conversionRate}%</div>
                <div className="text-sm text-muted-foreground">Taux de conversion</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Codes */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Tous mes codes ({codes.length})</CardTitle>
            <CardDescription>
              Gérez et suivez les performances de chaque code individuellement
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : codes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun code de parrainage. Créez-en un pour commencer !
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {codes.map((code) => (
                  <ReferralCodeCard
                    key={code.id}
                    code={code}
                    onShare={(code) => setSelectedCodeForShare(code)}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <CreateReferralCodeModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreate={handleCreateCode}
      />

      <ReferralShareMenu
        open={!!selectedCodeForShare}
        onOpenChange={(open) => !open && setSelectedCodeForShare(null)}
        code={selectedCodeForShare}
      />
    </div>
  );
}
