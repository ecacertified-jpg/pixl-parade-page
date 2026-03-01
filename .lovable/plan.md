

# Correction du renvoi OTP dans Auth.tsx : respecter la methode WhatsApp

## Probleme

Quand l'utilisateur clique "Renvoyer le code" sur la page client (`Auth.tsx`), le systeme utilise toujours `supabase.auth.signInWithOtp()` (Twilio SMS), meme si le code initial a ete envoye par WhatsApp. Twilio n'etant pas configure, cela provoque l'erreur 20003 (Authentication).

La page Business (`BusinessAuth.tsx`) gere deja correctement ce cas en verifiant `otpMethod` avant de choisir la methode de renvoi. La page Client ne le fait pas.

## Correction

**Fichier** : `src/pages/Auth.tsx`, fonction `resendOtp` (lignes 796-838)

Aligner la logique de renvoi sur celle de `BusinessAuth.tsx` :

```text
Avant :
  const resendOtp = async () => {
    // Toujours supabase.auth.signInWithOtp (SMS/Twilio)
    const { error } = await supabase.auth.signInWithOtp({ phone: currentPhone });
    ...
  };

Apres :
  const resendOtp = async () => {
    const method = otpMethod || defaultMethod;

    if (method === 'whatsapp') {
      // Reutiliser la fonction WhatsApp existante
      const metadata = pendingFormData && 'firstName' in pendingFormData ? {
        first_name: pendingFormData.firstName,
        last_name: pendingFormData.lastName,
      } : undefined;
      await sendWhatsAppOtp(currentPhone, authMode === 'signup' ? 'signup' : 'signin', metadata);
      return;
    }

    // Sinon, SMS classique
    const { error } = await supabase.auth.signInWithOtp({ phone: currentPhone });
    ...
  };
```

Les variables `otpMethod`, `defaultMethod`, `sendWhatsAppOtp` et `authMode` sont deja disponibles dans le scope de la fonction. Il suffit d'ajouter la verification conditionnelle.

## Impact

- Les utilisateurs en Cote d'Ivoire/Senegal qui ont choisi WhatsApp recevront le code via WhatsApp au renvoi
- Les utilisateurs au Benin/Togo/Mali/Burkina (auto-WhatsApp) recevront aussi via WhatsApp
- Les utilisateurs ayant choisi SMS continuent via SMS normalement
- Aucun nouveau fichier, aucune nouvelle dependance

