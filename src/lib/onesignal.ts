import OneSignal from 'react-onesignal';
import { supabase } from '@/integrations/supabase/client';

export const ONESIGNAL_APP_ID = '52d13eb4-510f-4bb0-8909-d3eb996e91cd';

let initPromise: Promise<boolean> | null = null;

function isPreviewIframe(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (window.top !== window.self) return true;
  } catch {
    return true;
  }
  const h = window.location.hostname;
  return (
    h.startsWith('id-preview--') ||
    h.startsWith('preview--') ||
    h.endsWith('.lovableproject.com') ||
    h === 'lovableproject.com'
  );
}

export function initOneSignal(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (isPreviewIframe()) {
    console.log('[OneSignal] Skipped (preview/iframe)');
    return Promise.resolve(false);
  }
  if (initPromise) return initPromise;

  initPromise = OneSignal.init({
    appId: ONESIGNAL_APP_ID,
    allowLocalhostAsSecureOrigin: true,
    serviceWorkerPath: 'OneSignalSDKWorker.js',
    serviceWorkerParam: { scope: '/onesignal/' },
    // Désactive le slidedown natif (en anglais) — on utilise notre modale française PushNotificationPrompt
    autoRegister: false,
    autoResubscribe: true,
    promptOptions: {
      slidedown: {
        prompts: [
          { type: 'push', autoPrompt: false, text: { actionMessage: '', acceptButton: '', cancelButton: '' } } as any,
        ],
      },
    },
  })
    .then(() => {
      console.log('[OneSignal] Initialized');
      return true;
    })
    .catch((err) => {
      console.error('[OneSignal] Init error:', err);
      initPromise = null;
      return false;
    });

  return initPromise;
}

export async function loginOneSignal(userId: string): Promise<string | null> {
  await initOneSignal();
  try {
    await OneSignal.login(userId);
    // Wait briefly for subscription id to populate
    for (let i = 0; i < 10; i++) {
      const id = OneSignal.User.PushSubscription.id;
      if (id) {
        await supabase
          .from('profiles')
          .update({ onesignal_player_id: id })
          .eq('user_id', userId);
        return id;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    return null;
  } catch (err) {
    console.error('[OneSignal] login error:', err);
    return null;
  }
}

export async function logoutOneSignal(): Promise<void> {
  try {
    await OneSignal.logout();
  } catch (err) {
    console.error('[OneSignal] logout error:', err);
  }
}

export { OneSignal };