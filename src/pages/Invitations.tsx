import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus, Share2, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInvitationStats } from '@/hooks/useInvitationStats';
import { useInvitationRewards } from '@/hooks/useInvitationRewards';
import { useInvitations } from '@/hooks/useInvitations';
import { InvitationStatsCard } from '@/components/invitations/InvitationStatsCard';
import { InvitationBadgeCard } from '@/components/invitations/InvitationBadgeCard';
import { InvitationTrendChart } from '@/components/invitations/InvitationTrendChart';
import { InvitationHistoryTable } from '@/components/invitations/InvitationHistoryTable';
import { RewardsSection } from '@/components/invitations/RewardsSection';
import { InviteFriendsModal } from '@/components/InviteFriendsModal';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Users, TrendingUp, Target, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function Invitations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useInvitationStats();
  const { rewards, claimReward, claiming } = useInvitationRewards();
  const { invitations, loading: invitationsLoading, resendInvitation, deleteInvitation, fetchInvitations } = useInvitations();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const referralLink = user?.id ? `${window.location.origin}/auth?ref=${user.id}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Lien de parrainage copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResend = async (id: string) => {
    await resendInvitation(id);
  };

  const handleDelete = async (id: string) => {
    await deleteInvitation(id);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Mes Invitations</h1>
              <p className="text-muted-foreground mt-1">
                Parrainez vos amis et gagnez des récompenses
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copié !' : 'Copier le lien'}
            </Button>
            <Button
              onClick={() => setIsInviteModalOpen(true)}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Inviter un ami
            </Button>
          </div>
        </div>

        {statsLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-[400px]" />
          </div>
        ) : stats ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <InvitationStatsCard
                title="Invitations envoyées"
                value={stats.total_sent}
                icon={Users}
                subtitle="Total d'invitations"
                delay={0}
              />
              <InvitationStatsCard
                title="Invitations acceptées"
                value={stats.accepted}
                icon={Target}
                subtitle={`${stats.acceptance_rate}% de taux d'acceptation`}
                delay={0.1}
              />
              <InvitationStatsCard
                title="Points gagnés"
                value={stats.total_points}
                icon={Gift}
                subtitle="50 points par acceptation"
                delay={0.2}
              />
              <InvitationStatsCard
                title="Temps moyen"
                value={stats.avg_acceptance_days ? `${stats.avg_acceptance_days}j` : 'N/A'}
                icon={TrendingUp}
                subtitle="Avant acceptation"
                delay={0.3}
              />
            </div>

            {/* Badge and Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-1">
                <InvitationBadgeCard
                  currentBadge={stats.current_badge}
                  nextBadge={stats.next_badge}
                  progress={stats.progress_to_next}
                  acceptedCount={stats.accepted}
                />
              </div>
              <div className="lg:col-span-2">
                <InvitationTrendChart data={stats.monthly_trend} />
              </div>
            </div>

            {/* Rewards Section */}
            {rewards.length > 0 && (
              <div className="mb-6">
                <RewardsSection
                  rewards={rewards}
                  onClaim={claimReward}
                  claiming={claiming}
                />
              </div>
            )}

            {/* History Table */}
            <InvitationHistoryTable
              invitations={invitations}
              onResend={handleResend}
              onDelete={handleDelete}
              loading={invitationsLoading}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Erreur lors du chargement des statistiques</p>
          </div>
        )}
      </div>

      <InviteFriendsModal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
      />
    </div>
  );
}
