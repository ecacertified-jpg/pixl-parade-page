

# Plan : Indexation automatique et mots-cles SEO des pages anniversaire

## Probleme

Les pages `/birthday/:slug` ne sont pas soumises aux moteurs de recherche (IndexNow) apres creation et n'ont aucune meta-donnee SEO (title, description, keywords, Open Graph, JSON-LD).

## Solution

### 1. Soumettre a IndexNow apres creation de la page (Edge Function)

Dans `supabase/functions/birthday-wishes/index.ts`, apres l'insertion reussie dans `birthday_pages` (ligne ~490), ajouter l'URL a la table `seo_sync_queue` :

```typescript
await supabase.from('seo_sync_queue').insert({
  entity_type: 'page',
  entity_id: pageSlug,
  action: 'create',
  url: `https://joiedevivre-africa.com/birthday/${pageSlug}`,
  priority: 'high',
  metadata: { title: pageTitle, type: 'birthday_page' }
});
```

Le CRON `process-seo-sync-queue` (toutes les 15 min) soumettra automatiquement l'URL a Bing et Yandex via IndexNow. Google ne supporte pas IndexNow mais sera notifie via le ping sitemap quotidien.

### 2. Meta tags dynamiques et mots-cles auto-generes (Frontend)

Dans `src/pages/BirthdayPage.tsx`, une fois les donnees chargees :

- **`document.title`** : "Anniversaire de Sarah - 30 ans | JOIE DE VIVRE"
- **Meta description** : "Celebrez l'anniversaire de Sarah ! Ecrivez-lui un message, partagez vos photos et participez au cadeau collectif."
- **Meta keywords** (auto-generes) : `anniversaire, Sarah, 30 ans, cadeau collectif, messages, album souvenir, JOIE DE VIVRE, celebration, Abidjan`
- **Open Graph** : og:title, og:description, og:image (cover ou avatar), og:url, og:type=website
- **Twitter Card** : summary_large_image

Creation d'un hook `useBirthdayPageSEO.ts` qui :
- Recoit `firstName`, `age`, `slug`, `coverImage`, `messagesCount`, `photosCount`
- Genere les mots-cles contextuels (prenom, age, occasion, ville si disponible)
- Injecte les meta tags dans le `<head>` via `document.createElement`
- Nettoie au unmount

### 3. Schema JSON-LD (Donnees structurees)

Utiliser le hook existant `useSchemaInjector` pour injecter un schema `Event` :

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Anniversaire de Sarah - 30 ans",
  "description": "Page de celebration...",
  "startDate": "2026-03-28",
  "url": "https://joiedevivre-africa.com/birthday/sarah-2026",
  "organizer": { "@type": "Organization", "name": "JOIE DE VIVRE" },
  "image": "cover_url_or_avatar"
}
```

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `supabase/functions/birthday-wishes/index.ts` | Ajouter insert dans `seo_sync_queue` apres creation page |
| `src/hooks/useBirthdayPageSEO.ts` | Nouveau — meta tags + keywords + OG dynamiques |
| `src/pages/BirthdayPage.tsx` | Appeler `useBirthdayPageSEO` + `useSchemaInjector` |

