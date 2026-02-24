
# Corriger les Push Notifications VAPID (erreur 401)

## Probleme identifie

L'erreur 401 "Authorization header must be specified: unauthenticated" provient du fait que les fonctions Edge envoient des requetes push **sans en-tetes VAPID d'authentification**. Le protocole Web Push exige :

1. **VAPID Authentication** : Un JWT signe avec ES256 dans le header `Authorization`
2. **Chiffrement du payload** : Le contenu doit etre chiffre avec les cles de l'abonnement (p256dh + auth) via le protocole RFC 8291 (aes128gcm)

### Etat actuel des 5 fonctions :

| Fonction | VAPID Auth | Chiffrement payload |
|----------|-----------|-------------------|
| `send-push-notification` | Tentative (buguee) | Non |
| `handle-order-action` | Non | Non |
| `notify-business-order` | Non | Non |
| `notify-order-confirmation` | Non | Non |
| `notify-business-birthday-opportunity` | Non | Non |

Les secrets `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` et `VAPID_EMAIL` sont deja configures.

## Solution

Creer un module partage `_shared/web-push.ts` qui implemente correctement le protocole Web Push avec les Web Crypto APIs de Deno, puis l'utiliser dans les 5 fonctions.

---

## Etapes techniques

### 1. Creer `supabase/functions/_shared/web-push.ts`

Ce module implementera :

- **VAPID JWT signing (ES256)** : Import de la cle privee VAPID en format JWK, creation du JWT avec audience = origin du push endpoint, signature ECDSA P-256
- **Payload encryption (aes128gcm / RFC 8291)** : ECDH key agreement avec la cle p256dh du client, derivation HKDF, chiffrement AES-128-GCM
- **Fonction `sendWebPushNotification()`** exportee et reutilisable

```text
Architecture du module :
+---------------------------+
| web-push.ts               |
|                           |
| generateVapidJWT()        |  -- JWT ES256 signe
| encryptPayload()          |  -- RFC 8291 aes128gcm
| sendWebPushNotification() |  -- Fonction principale
+---------------------------+
        |
        v
  Utilise par 5 fonctions Edge
```

Le module :
- Decoupe la cle publique VAPID (65 bytes uncompressed) en coordonnees x/y pour l'import JWK
- Convertit la signature ECDSA du format IEEE P1363 (WebCrypto) directement (deja compatible JWT)
- Implemente ECDH + HKDF + AES-128-GCM pour le chiffrement du payload selon la spec
- Gere les cas d'erreur (subscription expiree 404/410)

### 2. Mettre a jour `send-push-notification/index.ts`

- Supprimer les fonctions locales `generateVapidAuthHeaders`, `base64UrlToUint8Array`, `uint8ArrayToBase64Url`, `sendWebPush`
- Importer `sendWebPushNotification` depuis `../_shared/web-push.ts`
- Appeler la fonction partagee avec les parametres subscription + payload + VAPID keys

### 3. Mettre a jour `handle-order-action/index.ts`

- Remplacer le `sendWebPush` local (lignes 17-41) qui n'a pas d'en-tetes VAPID
- Importer et utiliser `sendWebPushNotification` depuis le module partage

### 4. Mettre a jour `notify-business-order/index.ts`

- Remplacer le `sendWebPush` local (lignes 342-377) qui lit les VAPID keys mais ne les utilise pas dans les headers
- Importer et utiliser la fonction partagee

### 5. Mettre a jour `notify-order-confirmation/index.ts`

- Remplacer le `sendWebPush` local (lignes 11-32) qui n'a aucun header d'auth
- Importer et utiliser la fonction partagee

### 6. Mettre a jour `notify-business-birthday-opportunity/index.ts`

- Remplacer la fonction de push simplifiee (lignes 44-66) qui dit explicitement "without VAPID"
- Importer et utiliser la fonction partagee

### 7. Test end-to-end

- Deployer les fonctions mises a jour
- Appeler `handle-order-action` avec une commande test pour verifier que le push passe sans erreur 401
- Verifier les logs pour confirmer le status 201

## Resultat attendu

- Les 5 fonctions Edge utiliseront le meme module partage pour envoyer des push notifications
- Les en-tetes VAPID seront correctement generes avec un JWT ES256
- Le payload sera chiffre selon RFC 8291 (requis par Chrome/FCM et Firefox)
- L'erreur 401 disparaitra et les push notifications seront delivrees aux utilisateurs
