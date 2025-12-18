import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApproveBusinessParams {
  business_id: string;
  action: 'approve' | 'reject';
  rejection_reason?: string;
  corrections_message?: string;
}

interface ManageUserParams {
  user_id: string;
  action: 'suspend' | 'unsuspend' | 'delete' | 'update_role';
  reason?: string;
  suspension_end?: string;
  new_role?: string;
}

export const useSecureAdminActions = () => {
  const queryClient = useQueryClient();

  // Approve or reject business via secure Edge Function
  const approveBusiness = useMutation({
    mutationFn: async (params: ApproveBusinessParams) => {
      const { data, error } = await supabase.functions.invoke('admin-approve-business', {
        body: params
      });

      if (error) {
        throw new Error(error.message || 'Failed to process business action');
      }

      // Check for error in response body
      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(
        variables.action === 'approve' 
          ? 'Entreprise approuvée avec succès' 
          : 'Entreprise rejetée'
      );
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['pending-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['business-accounts'] });
    },
    onError: (error: Error) => {
      console.error('Business action error:', error);
      toast.error(error.message || 'Erreur lors du traitement');
    }
  });

  // Manage user via secure Edge Function
  const manageUser = useMutation({
    mutationFn: async (params: ManageUserParams) => {
      const { data, error } = await supabase.functions.invoke('admin-manage-users', {
        body: params
      });

      if (error) {
        throw new Error(error.message || 'Failed to process user action');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      const messages: Record<string, string> = {
        suspend: 'Utilisateur suspendu',
        unsuspend: 'Suspension levée',
        delete: 'Utilisateur supprimé',
        update_role: 'Rôle mis à jour'
      };
      toast.success(messages[variables.action] || 'Action effectuée');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: Error) => {
      console.error('User management error:', error);
      toast.error(error.message || 'Erreur lors du traitement');
    }
  });

  return {
    approveBusiness,
    manageUser,
    isProcessing: approveBusiness.isPending || manageUser.isPending
  };
};
