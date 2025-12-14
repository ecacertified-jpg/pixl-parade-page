import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Enregistrement du Service Worker avec mise à jour automatique
const updateSW = registerSW({
  onNeedRefresh() {
    // Nouvelle version disponible - recharger automatiquement
    console.log('[PWA] Nouvelle version disponible, rechargement...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] Application prête pour le mode hors ligne');
  },
  onRegistered(registration) {
    console.log('[PWA] Service Worker enregistré:', registration);
    // Vérifier les mises à jour toutes les heures
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    }
  },
  onRegisterError(error) {
    console.error('[PWA] Erreur d\'enregistrement du SW:', error);
  }
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
