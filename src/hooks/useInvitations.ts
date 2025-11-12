import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Invitation {
  id: string;
  inviter_id: string;
  invitee_email: string;
  invitee_phone: string | null;
  status: 'pending' | 'accepted' | 'expired';
  invitation_token: string;
  invited_at: string;
  accepted_at: string | null;
  expires_at: string;
  message: string | null;
}

export function useInvitations() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const sendInvitation = async (
    email: string,
    phone?: string,
    message?: string
  ) => {
    if (!user?.id) {
      toast.error('Vous devez être connecté pour envoyer des invitations');
      return { success: false };
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: {
          invitee_email: email,
          invitee_phone: phone,
          message,
        },
      });

      if (error) {
        console.error('Error sending invitation:', error);
        
        if (error.message?.includes('déjà invité')) {
          toast.error('Vous avez déjà invité cette personne');
        } else {
          toast.error('Erreur lors de l\'envoi de l\'invitation');
        }
        
        return { success: false, error };
      }

      toast.success('Invitation envoyée avec succès ! 🎉');
      
      // Refresh invitations list
      await fetchInvitations();
      
      return { success: true, data };
    } catch (error) {
      console.error('Error in sendInvitation:', error);
      toast.error('Une erreur est survenue');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('inviter_id', user.id)
        .order('invited_at', { ascending: false });

      if (error) throw error;

      setInvitations((data || []) as Invitation[]);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Erreur lors du chargement des invitations');
    } finally {
      setLoading(false);
    }
  };

  const resendInvitation = async (invitationId: string) => {
    if (!user?.id) return { success: false };

    try {
      setLoading(true);

      // Get the invitation
      const { data: invitation, error: fetchError } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (fetchError || !invitation) {
        toast.error('Invitation introuvable');
        return { success: false };
      }

      // Update the expiration date
      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      // Resend the email
      const result = await sendInvitation(
        invitation.invitee_email,
        invitation.invitee_phone || undefined,
        invitation.message || undefined
      );

      if (result.success) {
        toast.success('Invitation renvoyée avec succès');
      }

      return result;
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Erreur lors du renvoi de l\'invitation');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    if (!user?.id) return { success: false };

    try {
      setLoading(true);

      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId)
        .eq('inviter_id', user.id);

      if (error) throw error;

      toast.success('Invitation supprimée');
      await fetchInvitations();

      return { success: true };
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast.error('Erreur lors de la suppression');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    invitations,
    sendInvitation,
    fetchInvitations,
    resendInvitation,
    deleteInvitation,
  };
}
