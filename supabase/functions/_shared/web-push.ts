/**
 * Web Push Notification module with proper VAPID authentication and payload encryption.
 * Implements RFC 8291 (Message Encryption for Web Push) using Deno Web Crypto APIs.
 */

// --- Base64URL utilities ---

function base64UrlToUint8Array(base64url: string): Uint8Array {
  const padding = '='.repeat((4 - base64url.length % 4) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// --- VAPID JWT generation (ES256) ---

async function generateVapidJWT(
  endpoint: string,
  vapidPublicKeyB64: string,
  vapidPrivateKeyB64: string,
  subject: string
): Promise<{ authorization: string }> {
  const audience = new URL(endpoint).origin;
  
  // JWT Header & Payload
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: subject,
  };

  const encoder = new TextEncoder();
  const headerB64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import VAPID private key as ECDSA P-256
  const privateKeyRaw = base64UrlToUint8Array(vapidPrivateKeyB64);
  const publicKeyRaw = base64UrlToUint8Array(vapidPublicKeyB64);

  // Extract x, y coordinates from uncompressed public key (65 bytes: 0x04 + 32x + 32y)
  const x = uint8ArrayToBase64Url(publicKeyRaw.slice(1, 33));
  const y = uint8ArrayToBase64Url(publicKeyRaw.slice(33, 65));
  const d = uint8ArrayToBase64Url(privateKeyRaw);

  const jwk: JsonWebKey = {
    kty: 'EC',
    crv: 'P-256',
    x,
    y,
    d,
  };

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Sign
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = uint8ArrayToBase64Url(new Uint8Array(signatureBuffer));
  const jwt = `${unsignedToken}.${signatureB64}`;

  return {
    authorization: `vapid t=${jwt}, k=${vapidPublicKeyB64}`,
  };
}

// --- Payload Encryption (RFC 8291 - aes128gcm) ---

async function encryptPayload(
  clientPublicKeyB64: string,
  clientAuthSecretB64: string,
  payloadText: string
): Promise<{ encrypted: Uint8Array; localPublicKey: Uint8Array; salt: Uint8Array }> {
  const encoder = new TextEncoder();
  const payload = encoder.encode(payloadText);

  const clientPublicKeyBytes = base64UrlToUint8Array(clientPublicKeyB64);
  const clientAuthSecret = base64UrlToUint8Array(clientAuthSecretB64);

  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Export local public key as raw (uncompressed)
  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', localKeyPair.publicKey)
  );

  // Import client public key
  const clientPublicKey = await crypto.subtle.importKey(
    'raw',
    clientPublicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: clientPublicKey },
      localKeyPair.privateKey,
      256
    )
  );

  // Generate salt (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF to derive IKM from auth secret
  // info = "WebPush: info\0" + client_public_key + local_public_key
  const authInfo = concatUint8Arrays(
    encoder.encode('WebPush: info\0'),
    clientPublicKeyBytes,
    localPublicKeyRaw
  );

  const ikmKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  const ikm = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: clientAuthSecret, info: authInfo },
      ikmKey,
      256
    )
  );

  // Derive Content Encryption Key (CEK) and Nonce from IKM + salt
  const prkKey = await crypto.subtle.importKey(
    'raw',
    ikm,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  const cekInfo = encoder.encode('Content-Encoding: aes128gcm\0');
  const nonceInfo = encoder.encode('Content-Encoding: nonce\0');

  const cekBits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info: cekInfo },
      prkKey,
      128
    )
  );

  const nonce = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info: nonceInfo },
      prkKey,
      96
    )
  );

  // Pad the payload (add delimiter byte 0x02 for final record)
  const paddedPayload = concatUint8Arrays(payload, new Uint8Array([2]));

  // AES-128-GCM encrypt
  const aesKey = await crypto.subtle.importKey(
    'raw',
    cekBits,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      aesKey,
      paddedPayload
    )
  );

  // Build aes128gcm content:
  // salt (16) + rs (4, big-endian uint32) + idlen (1) + keyid (65) + ciphertext
  const rs = 4096;
  const rsBytes = new Uint8Array(4);
  new DataView(rsBytes.buffer).setUint32(0, rs, false);
  const idlen = new Uint8Array([localPublicKeyRaw.length]);

  const encrypted = concatUint8Arrays(
    salt,
    rsBytes,
    idlen,
    localPublicKeyRaw,
    ciphertext
  );

  return { encrypted, localPublicKey: localPublicKeyRaw, salt };
}

// --- Main exported function ---

export interface WebPushSubscription {
  endpoint: string;
  p256dh_key?: string;
  auth_key?: string;
  // Alternative field names
  p256dh?: string;
  auth?: string;
  keys?: {
    p256dh: string;
    auth: string;
  };
}

export interface WebPushResult {
  success: boolean;
  status?: number;
  error?: string;
}

export async function sendWebPushNotification(
  subscription: WebPushSubscription,
  payloadJson: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<WebPushResult> {
  try {
    // Resolve key field names
    const p256dh = subscription.p256dh_key || subscription.p256dh || subscription.keys?.p256dh;
    const auth = subscription.auth_key || subscription.auth || subscription.keys?.auth;

    if (!p256dh || !auth) {
      console.error('❌ [web-push] Missing p256dh or auth keys for subscription');
      return { success: false, error: 'missing_keys' };
    }

    // Generate VAPID Authorization header
    const vapid = await generateVapidJWT(
      subscription.endpoint,
      vapidPublicKey,
      vapidPrivateKey,
      vapidSubject
    );

    // Encrypt payload
    const { encrypted } = await encryptPayload(p256dh, auth, payloadJson);

    // Send the push request
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
        'Urgency': 'high',
        'Authorization': vapid.authorization,
      },
      body: encrypted,
    });

    if (response.ok || response.status === 201) {
      // Consume body to avoid resource leak
      await response.text();
      console.log('✅ [web-push] Push sent successfully to:', subscription.endpoint.substring(0, 60) + '...');
      return { success: true, status: response.status };
    }

    const errorText = await response.text();
    console.error('❌ [web-push] Push failed:', response.status, errorText);

    if (response.status === 404 || response.status === 410) {
      return { success: false, status: response.status, error: 'subscription_expired' };
    }

    return { success: false, status: response.status, error: errorText };
  } catch (error) {
    console.error('❌ [web-push] Error:', error);
    return { success: false, error: error.message };
  }
}
