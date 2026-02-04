
# Optimisation du SMS de bienvenue

## Problème actuel

Le message actuel (ligne 156) fait **~180 caractères** :
```
JoieDvivre: [Nom] vous a ajouté(e) à son cercle d'amis! Votre anniversaire est dans X jours. Créez votre liste de souhaits: https://pixl-parade-page.lovable.app
```

**Problèmes identifiés :**
1. Trop long (>160 chars) = segmentation en 2 SMS
2. URL technique (`pixl-parade-page.lovable.app`) peu professionnelle
3. Caractères spéciaux (`é`, `è`) qui peuvent affecter l'encodage
4. Formulation verbeuse

---

## Message optimisé proposé

```
[Nom] t'a ajouté à son cercle! Anniversaire dans X jours. Crée ta liste: joiedevivre-africa.com/favorites
```

**Analyse du nouveau message :**
| Élément | Ancien | Nouveau |
|---------|--------|---------|
| Préfixe | `JoieDvivre: ` (12 chars) | Aucun (0 chars) |
| Verbe | `vous a ajouté(e)` (17 chars) | `t'a ajouté` (10 chars) |
| Cercle | `son cercle d'amis` (17 chars) | `son cercle` (10 chars) |
| Anniversaire | `Votre anniversaire est dans` (27 chars) | `Anniversaire dans` (17 chars) |
| CTA | `Créez votre liste de souhaits` (29 chars) | `Crée ta liste` (13 chars) |
| URL | `https://pixl-parade-page.lovable.app` (36 chars) | `joiedevivre-africa.com/favorites` (32 chars) |

**Longueur totale estimée** : ~95-110 caractères (selon le nom)

---

## Solution technique

### Modification de `supabase/functions/notify-contact-added/index.ts`

**Ligne 156 - Remplacer :**
```javascript
// AVANT
const message = `JoieDvivre: ${userName} vous a ajouté(e) à son cercle d'amis! Votre anniversaire est dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}. Créez votre liste de souhaits: https://pixl-parade-page.lovable.app`;

// APRÈS
const message = `${userName} t'a ajouté à son cercle! Anniversaire dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}. Crée ta liste: joiedevivre-africa.com/favorites`;
```

---

## Fichier modifié

| Fichier | Ligne | Action |
|---------|-------|--------|
| `supabase/functions/notify-contact-added/index.ts` | 156 | Optimiser le message |

---

## Avantages de l'optimisation

1. **Moins de 160 caractères** : pas de segmentation, meilleure délivrabilité
2. **Tutoiement** : plus convivial, cohérent avec le ton de l'app
3. **URL courte sans https://** : moins de caractères, moins de risque de filtrage
4. **Pas de caractères spéciaux problématiques** : meilleur encodage GSM-7
5. **Domaine personnalisé** : plus professionnel que `.lovable.app`

---

## Note importante

Le domaine `joiedevivre-africa.com` doit être configuré comme redirection vers l'app Lovable. Si ce domaine n'est pas encore actif, je peux utiliser l'URL publiée actuelle sans le `https://` :

```javascript
// Alternative si le domaine personnalisé n'est pas prêt
const message = `${userName} t'a ajouté à son cercle! Anniversaire dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}. Crée ta liste: pixl-parade-page.lovable.app/favorites`;
```
