import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface QuickAction {
  orderId: string;
  action: string;
  success: boolean;
  timestamp: number;
}

export function useQuickOrderActions(onActionCompleted?: () => void) {
  const [lastAction, setLastAction] = useState<QuickAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('📨 Received SW message:', event.data);
      
      if (event.data?.type === 'ORDER_ACTION_COMPLETED') {
        const actionData: QuickAction = {
          orderId: event.data.orderId,
          action: event.data.action,
          success: event.data.success,
          timestamp: Date.now()
        };
        
        setLastAction(actionData);
        setIsProcessing(false);
        
        // Show toast notification
        if (actionData.success) {
          if (actionData.action === 'accept') {
            toast.success('Commande acceptée !', {
              description: 'Le client a été notifié'
            });
          } else if (actionData.action === 'reject') {
            toast.info('Commande refusée', {
              description: 'Le client a été notifié'
            });
          }
        } else {
          toast.error('Erreur', {
            description: 'Impossible de traiter l\'action'
          });
        }
        
        // Callback to refresh order list
        if (onActionCompleted) {
          onActionCompleted();
        }
      }
      
      if (event.data?.type === 'ORDER_ACTION_STARTED') {
        setIsProcessing(true);
      }
    };

    // Listen for messages from Service Worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, [onActionCompleted]);

  // Manual action trigger (for when app is open)
  const triggerAction = useCallback(async (orderId: string, action: 'accept' | 'reject' | 'view', businessUserId: string) => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/handle-order-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          action: action,
          business_user_id: businessUserId
        })
      });
      
      const result = await response.json();
      
      const actionData: QuickAction = {
        orderId,
        action,
        success: result.success,
        timestamp: Date.now()
      };
      
      setLastAction(actionData);
      
      if (result.success) {
        if (action === 'accept') {
          toast.success('Commande acceptée !');
        } else if (action === 'reject') {
          toast.info('Commande refusée');
        }
        
        if (onActionCompleted) {
          onActionCompleted();
        }
      } else {
        toast.error(result.error || 'Erreur lors du traitement');
      }
      
      return result;
    } catch (error) {
      console.error('Error triggering action:', error);
      toast.error('Erreur de connexion');
      return { success: false, error: 'Network error' };
    } finally {
      setIsProcessing(false);
    }
  }, [onActionCompleted]);

  return { 
    lastAction, 
    isProcessing,
    triggerAction
  };
}
