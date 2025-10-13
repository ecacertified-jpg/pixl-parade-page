// Service Worker pour les notifications push JOIE DE VIVRE

self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installé');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activé');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification reçue');

  let notificationData = {
    title: 'Nouvelle notification',
    body: 'Vous avez une nouvelle notification',
    icon: '/logo-jv.png',
    badge: '/logo-jv.png',
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.message || payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        data: payload.data || {},
        tag: payload.tag || 'joie-de-vivre-notification',
        requireInteraction: payload.requireInteraction || false,
      };
    } catch (error) {
      console.error('[SW] Erreur parsing push data:', error);
      notificationData.body = event.data.text();
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: 'Ouvrir',
        },
        {
          action: 'close',
          title: 'Fermer',
        },
      ],
    }
  );

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification cliquée:', event.action);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Déterminer l'URL à ouvrir
  let urlToOpen = '/';
  
  if (event.notification.data) {
    const data = event.notification.data;
    
    if (data.url) {
      urlToOpen = data.url;
    } else if (data.fund_id) {
      urlToOpen = `/gifts?fund=${data.fund_id}`;
    } else if (data.post_id) {
      urlToOpen = '/publications';
    } else if (data.contact_id) {
      urlToOpen = '/dashboard';
    } else if (data.type) {
      // Navigation basée sur le type
      if (data.type.includes('fund') || data.type.includes('collective')) {
        urlToOpen = '/gifts';
      } else if (data.type.includes('gift')) {
        urlToOpen = '/gifts';
      } else if (data.type.includes('birthday') || data.type.includes('event')) {
        urlToOpen = '/dashboard';
      }
    }
  }

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  }).then((windowClients) => {
    // Chercher une fenêtre existante
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url === new URL(urlToOpen, self.location.origin).href && 'focus' in client) {
        return client.focus();
      }
    }
    
    // Ouvrir une nouvelle fenêtre si aucune n'existe
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification fermée');
});
