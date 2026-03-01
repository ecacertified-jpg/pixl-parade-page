
# Deduplication par numero de telephone dans notify-contribution-progress

## Probleme

La fonction envoie des WhatsApp en deux passes (section 8 : contributeurs, section 9 : amis non-contributeurs). Si deux comptes partagent le meme numero de telephone, le meme message est envoye deux fois au meme destinataire. De plus, entre les deux passes, aucun suivi des numeros deja contactes n'est fait.

## Solution

Introduire un `Set<string>` nomme `sentPhones` initialise avant la section 8. Avant chaque appel a `sendWhatsAppTemplate`, verifier si le numero (normalise via `.replace(/\s+/g, '')`) est deja dans le Set. Si oui, le sauter avec un log. Sinon, l'ajouter au Set apres envoi.

## Fichier a modifier

**`supabase/functions/notify-contribution-progress/index.ts`**

### Changement 1 : Declarer le Set (avant la section 8, ~ligne 131)

```typescript
// Phone deduplication across both passes
const sentPhones = new Set<string>();
```

### Changement 2 : Section 8 - Contributeurs (~lignes 139-154)

Ajouter la verification avant l'envoi :

```typescript
for (const profile of (contributorProfiles || [])) {
  if (!profile.phone) continue;
  const normalizedPhone = profile.phone.replace(/\s+/g, '');
  if (sentPhones.has(normalizedPhone)) {
    console.log(`⏭️ Dedup phone: ${normalizedPhone} already sent (contributor ${profile.user_id})`);
    continue;
  }
  const recipientName = profile.first_name || 'Ami(e)';
  try {
    await sendWhatsAppTemplate(...);
    sentPhones.add(normalizedPhone);
    updatesSent++;
  } catch (err) { ... }
}
```

### Changement 3 : Section 9 - Amis non-contributeurs (~lignes 177-192)

Meme logique de verification :

```typescript
for (const profile of (friendProfiles || [])) {
  if (!profile.phone) continue;
  const normalizedPhone = profile.phone.replace(/\s+/g, '');
  if (sentPhones.has(normalizedPhone)) {
    console.log(`⏭️ Dedup phone: ${normalizedPhone} already sent (friend ${profile.user_id})`);
    continue;
  }
  const recipientName = profile.first_name || 'Ami(e)';
  try {
    await sendWhatsAppTemplate(...);
    sentPhones.add(normalizedPhone);
    nudgesSent++;
  } catch (err) { ... }
}
```

### Changement 4 : Log final (~ligne 216)

Ajouter le nombre de numeros uniques contactes :

```typescript
console.log(`... Updates: ${updatesSent}, Nudges: ${nudgesSent}, Unique phones: ${sentPhones.size}`);
```

## Impact

- Aucune modification de schema ou de table
- Pas de nouveau fichier
- La deduplication est locale a chaque execution (pas de persistance necessaire)
- Compatible avec la deduplication temporelle de 4h deja en place (section 2)
