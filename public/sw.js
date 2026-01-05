// Service Worker pour les notifications push JOIE DE VIVRE
const CACHE_VERSION = 'v3';
const API_CACHE_NAMES = [
  'favorites-cache',
  'funds-cache', 
  'products-cache',
  'images-cache',
  'favorites-cache-v2',
  'funds-cache-v2',
  'products-cache-v2',
  'images-cache-v2'
];

// Patterns de vibration personnalisés par type de notification
const VIBRATION_PATTERNS = {
  birthday: [100, 50, 100, 50, 200, 100, 200], // Pattern festif pour anniversaire
  birthday_urgent: [200, 100, 200, 100, 300, 100, 300], // Anniversaire aujourd'hui
  celebration: [100, 50, 100, 50, 100], // Célébration générale
  gift: [150, 75, 150], // Réception de cadeau
  fund: [100, 100, 100, 100], // Cagnotte
  default: [200, 100, 200] // Par défaut
};

// Icônes personnalisées par type
const NOTIFICATION_ICONS = {
  birthday: '/pwa-192x192.png',
  gift: '/pwa-192x192.png',
  fund: '/pwa-192x192.png',
  default: '/pwa-192x192.png'
};

self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installé - version', CACHE_VERSION);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activé - nettoyage des anciens caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.includes('-cache') && !cacheName.includes('-v2')) {
            console.log('[SW] Suppression du cache obsolète:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(() => {
      console.log('[SW] Nettoyage terminé, prise de contrôle des clients');
      return clients.claim();
    })
  );
});

// Fonction pour déterminer le pattern de vibration
function getVibrationPattern(notificationType, isUrgent) {
  if (notificationType === 'birthday' && isUrgent) {
    return VIBRATION_PATTERNS.birthday_urgent;
  }
  return VIBRATION_PATTERNS[notificationType] || VIBRATION_PATTERNS.default;
}

// Fonction pour obtenir l'icône appropriée
function getNotificationIcon(notificationType) {
  return NOTIFICATION_ICONS[notificationType] || NOTIFICATION_ICONS.default;
}

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification reçue');

  let notificationData = {
    title: 'Nouvelle notification',
    body: 'Vous avez une nouvelle notification',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: {},
    type: 'default',
    isUrgent: false,
    soundType: null
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      const notificationType = payload.data?.type || payload.type || 'default';
      const isUrgent = payload.data?.isUrgent || payload.isUrgent || false;
      const isBirthday = notificationType.includes('birthday');
      
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.message || payload.body || notificationData.body,
        icon: payload.icon || getNotificationIcon(notificationType),
        badge: payload.badge || notificationData.badge,
        data: {
          ...payload.data,
          type: notificationType,
          isUrgent: isUrgent,
          soundType: isBirthday ? (isUrgent ? 'tada' : 'chime') : 'pop',
          playSound: payload.data?.playSound !== false
        },
        tag: payload.tag || `joie-de-vivre-${notificationType}`,
        requireInteraction: payload.requireInteraction || isBirthday,
        type: notificationType,
        isUrgent: isUrgent
      };
    } catch (error) {
      console.error('[SW] Erreur parsing push data:', error);
      notificationData.body = event.data.text();
    }
  }

  // Déterminer le pattern de vibration basé sur le type
  const vibrationPattern = getVibrationPattern(notificationData.type, notificationData.isUrgent);

  // Actions personnalisées pour les anniversaires
  const actions = notificationData.type.includes('birthday') 
    ? [
        { action: 'celebrate', title: '🎉 Célébrer' },
        { action: 'gift', title: '🎁 Offrir' },
        { action: 'close', title: 'Fermer' }
      ]
    : [
        { action: 'open', title: 'Ouvrir' },
        { action: 'close', title: 'Fermer' }
      ];

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      vibrate: vibrationPattern,
      actions: actions,
      // Ajouter un timestamp pour les notifications d'anniversaire
      timestamp: notificationData.type.includes('birthday') ? Date.now() : undefined,
      // Notification silencieuse par défaut (le son sera joué par l'app)
      silent: false
    }
  );

  // Envoyer un message à l'app pour jouer le son si elle est ouverte
  if (notificationData.data.playSound) {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        windowClients.forEach((client) => {
          client.postMessage({
            type: 'PLAY_NOTIFICATION_SOUND',
            soundType: notificationData.data.soundType,
            notificationType: notificationData.type
          });
        });
      });
  }

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification cliquée:', event.action, 'type:', event.notification.data?.type);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const data = event.notification.data || {};
  const notificationType = data.type || 'default';
  
  // Special handling for order quick actions
  if (data.type === 'new_order' && (event.action === 'accept' || event.action === 'reject' || event.action === 'view')) {
    console.log('[SW] Order quick action:', event.action, 'for order:', data.order_id);
    
    event.waitUntil(
      (async () => {
        // Notify clients that action is starting
        const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        allClients.forEach(client => {
          client.postMessage({ 
            type: 'ORDER_ACTION_STARTED',
            orderId: data.order_id,
            action: event.action
          });
        });
        
        try {
          // Call the handle-order-action edge function
          const response = await fetch('https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/handle-order-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: data.order_id,
              action: event.action,
              business_user_id: data.business_user_id
            })
          });
          
          const result = await response.json();
          console.log('[SW] Order action result:', result);
          
          // Notify all clients about the action completion
          const updatedClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
          updatedClients.forEach(client => {
            client.postMessage({ 
              type: 'ORDER_ACTION_COMPLETED',
              action: event.action,
              orderId: data.order_id,
              success: result.success,
              newStatus: result.new_status
            });
          });
          
          // For view action, open the app
          if (event.action === 'view') {
            const redirectUrl = result.redirect_url || '/business-account?tab=orders';
            if (updatedClients.length > 0) {
              updatedClients[0].focus();
              updatedClients[0].navigate(redirectUrl);
            } else if (self.clients.openWindow) {
              await self.clients.openWindow(redirectUrl);
            }
          }
          
          // Show result notification for accept/reject
          if (event.action !== 'view') {
            const resultTitle = result.success 
              ? (event.action === 'accept' ? '✅ Commande acceptée' : '❌ Commande refusée')
              : '⚠️ Erreur';
            const resultBody = result.success
              ? (event.action === 'accept' ? 'Le client a été notifié' : 'Le client a été informé')
              : (result.error || 'Impossible de traiter l\'action');
            
            await self.registration.showNotification(resultTitle, {
              body: resultBody,
              icon: '/logo-jv.png',
              tag: `order-result-${data.order_id}`,
              requireInteraction: false
            });
          }
          
        } catch (error) {
          console.error('[SW] Error handling order action:', error);
          
          // Notify clients about the error
          const errorClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
          errorClients.forEach(client => {
            client.postMessage({ 
              type: 'ORDER_ACTION_COMPLETED',
              action: event.action,
              orderId: data.order_id,
              success: false,
              error: error.message
            });
          });
          
          // Show error notification
          await self.registration.showNotification('⚠️ Erreur', {
            body: 'Impossible de traiter l\'action. Ouvrez l\'app pour réessayer.',
            icon: '/logo-jv.png',
            tag: `order-error-${data.order_id}`,
            data: { url: '/business-account?tab=orders' }
          });
        }
      })()
    );
    return;
  }

  // Déterminer l'URL à ouvrir
  let urlToOpen = '/';
  
  // Actions spécifiques aux anniversaires
  if (event.action === 'celebrate') {
    urlToOpen = '/dashboard';
  } else if (event.action === 'gift') {
    urlToOpen = '/shop';
  } else if (data.url) {
    urlToOpen = data.url;
  } else if (data.fund_id) {
    urlToOpen = `/gifts?fund=${data.fund_id}`;
  } else if (data.post_id) {
    urlToOpen = '/publications';
  } else if (data.contact_id) {
    urlToOpen = '/dashboard';
  } else if (notificationType.includes('birthday')) {
    urlToOpen = '/dashboard';
  } else if (notificationType.includes('fund') || notificationType.includes('collective')) {
    urlToOpen = '/gifts';
  } else if (notificationType.includes('gift')) {
    urlToOpen = '/gifts';
  }

  // Track notification click for analytics
  if (data.analytics_id) {
    fetch('https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/track-notification-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        analytics_id: data.analytics_id,
        event_type: 'clicked',
        metadata: {
          action: event.action,
          url: urlToOpen
        }
      })
    }).catch(err => console.log('[SW] Error tracking click:', err));
  }

  // Envoyer un message pour jouer le son de célébration si c'est un anniversaire
  if (notificationType.includes('birthday') && data.playSound !== false) {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        windowClients.forEach((client) => {
          client.postMessage({
            type: 'PLAY_NOTIFICATION_SOUND',
            soundType: 'tada',
            notificationType: 'birthday_click'
          });
        });
      });
  }

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  }).then((windowClients) => {
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url === new URL(urlToOpen, self.location.origin).href && 'focus' in client) {
        return client.focus();
      }
    }
    
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification fermée');
});
