import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WaitlistInvitation {
  id: string;
  email: string;
  business_name: string;
  business_type: string | null;
  contact_first_name: string;
  contact_last_name: string;
  phone: string | null;
  city: string | null;
}

export const useWaitlistInvitation = (invitationToken: string | null) => {
  const [invitation, setInvitation] = useState<WaitlistInvitation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!invitationToken) {
      setInvitation(null);
      setIsValid(false);
      return;
    }

    const validateInvitation = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('business_waitlist')
          .select('id, email, business_name, business_type, contact_first_name, contact_last_name, phone, city, status, invitation_expires_at')
          .eq('invitation_token', invitationToken)
          .single();

        if (fetchError || !data) {
          setError('Invitation invalide ou expirée');
          setIsValid(false);
          return;
        }

        // Check if already converted
        if (data.status === 'converted') {
          setError('Cette invitation a déjà été utilisée');
          setIsValid(false);
          return;
        }

        // Check expiration
        if (data.invitation_expires_at && new Date(data.invitation_expires_at) < new Date()) {
          setError('Cette invitation a expiré');
          setIsValid(false);
          return;
        }

        setInvitation({
          id: data.id,
          email: data.email,
          business_name: data.business_name,
          business_type: data.business_type,
          contact_first_name: data.contact_first_name,
          contact_last_name: data.contact_last_name,
          phone: data.phone,
          city: data.city,
        });
        setIsValid(true);
      } catch (err) {
        console.error('Error validating invitation:', err);
        setError('Erreur lors de la validation de l\'invitation');
        setIsValid(false);
      } finally {
        setLoading(false);
      }
    };

    validateInvitation();
  }, [invitationToken]);

  const markAsConverted = async (businessAccountId: string) => {
    if (!invitation) return;

    try {
      await supabase
        .from('business_waitlist')
        .update({
          status: 'converted',
          converted_to_business_id: businessAccountId,
        })
        .eq('id', invitation.id);
    } catch (err) {
      console.error('Error marking invitation as converted:', err);
    }
  };

  return { invitation, loading, error, isValid, markAsConverted };
};
