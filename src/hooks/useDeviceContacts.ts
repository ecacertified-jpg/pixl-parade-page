import { useState, useEffect, useCallback } from 'react';

export interface DeviceContact {
  name: string;
  email?: string;
  phone?: string;
}

// Extend Navigator type for Contact Picker API
declare global {
  interface Navigator {
    contacts?: {
      select: (
        properties: string[],
        options?: { multiple?: boolean }
      ) => Promise<Array<{
        name?: string[];
        email?: string[];
        tel?: string[];
      }>>;
    };
  }
  interface Window {
    ContactsManager?: unknown;
  }
}

export function useDeviceContacts() {
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<DeviceContact[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Contact Picker API is available
    const supported = 'contacts' in navigator && 'ContactsManager' in window;
    setIsSupported(supported);
  }, []);

  const pickContacts = useCallback(async (): Promise<DeviceContact[]> => {
    if (!isSupported || !navigator.contacts) {
      setError('L\'API de contacts n\'est pas supportée par ce navigateur');
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const properties = ['name', 'email', 'tel'];
      const opts = { multiple: true };

      const rawContacts = await navigator.contacts.select(properties, opts);

      const formattedContacts: DeviceContact[] = rawContacts
        .map((contact) => ({
          name: contact.name?.[0] || 'Sans nom',
          email: contact.email?.[0],
          phone: contact.tel?.[0],
        }))
        .filter((contact) => contact.email || contact.phone); // Only keep contacts with email or phone

      setContacts(formattedContacts);
      return formattedContacts;
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'SecurityError') {
          setError('Permission refusée pour accéder aux contacts');
        } else if (err.name === 'InvalidStateError') {
          setError('Un autre sélecteur de contacts est déjà ouvert');
        } else if (err.name === 'TypeError') {
          setError('Aucune propriété de contact spécifiée');
        } else {
          setError('Erreur lors de la sélection des contacts');
        }
      }
      console.error('Error picking contacts:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  const clearContacts = useCallback(() => {
    setContacts([]);
    setError(null);
  }, []);

  return {
    isSupported,
    loading,
    contacts,
    error,
    pickContacts,
    clearContacts,
  };
}
