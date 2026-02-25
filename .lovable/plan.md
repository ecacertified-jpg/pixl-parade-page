

## Probleme identifie

Dans `useAdminShareCode.ts`, la fonction `getShareLink()` retourne :
```
https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/join-preview/ADM-XXXX
```

WhatsApp affiche **toujours le domaine de l'URL partagee**, pas celui de la balise `og:url`. Donc meme si les meta OG disent `joiedevivre-africa.com`, le domaine affiche est celui de Supabase.

---

## Correction en 2 etapes

### Etape 1 : Changer le lien de partage

Modifier `getShareLink()` dans `src/hooks/useAdminShareCode.ts` pour retourner :
```
https://joiedevivre-africa.com/join/ADM-XXXX
```

au lieu de l'URL Supabase actuelle. Le domaine de production sera ainsi affiche dans l'apercu WhatsApp.

### Etape 2 : Ajouter une regle de proxy dans `_redirects`

Pour que les crawlers (WhatsApp, Facebook, etc.) recoivent les balises OG dynamiques quand ils visitent `joiedevivre-africa.com/join/ADM-XXXX`, ajouter une regle de proxy **avant** la regle catch-all :

```text
/join/ADM-*  https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/join-preview/ADM-:splat  200
/*           /index.html  200
```

Cette regle intercepte les requetes `/join/ADM-*` et les envoie vers l'Edge Function `join-preview`, qui :
- Sert le HTML avec meta OG aux crawlers (WhatsApp, Facebook)
- Redirige les vrais utilisateurs vers `joiedevivre-africa.com/join/ADM-XXXX` (qui charge le SPA)

---

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/hooks/useAdminShareCode.ts` | `getShareLink()` retourne le domaine de production |
| `public/_redirects` | Ajout de la regle proxy pour `/join/ADM-*` |

---

## Risque et fallback

La regle proxy avec status `200` vers une URL externe fonctionne sur Netlify et certains hebergeurs. Si l'hebergement Lovable ne supporte pas ce type de proxy :
- L'utilisateur humain verra quand meme la page `/join/ADM-XXXX` normalement (SPA)
- L'apercu riche WhatsApp pourrait ne pas fonctionner depuis le domaine de production
- Dans ce cas, on pourrait basculer vers une regle `302` (redirection) comme alternative

## Verification apres deploiement

Partager le lien `https://joiedevivre-africa.com/join/ADM-RW3R` sur WhatsApp et verifier que :
1. Le domaine affiche est `joiedevivre-africa.com`
2. La carte riche montre le titre, la description et l'image OG personnalisee
