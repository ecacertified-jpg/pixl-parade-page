

# Plan : Corriger l'affichage de la vidéo sur la landing page

## Problème

Deux causes :
1. **`storage.list()` nécessite une authentification** — les visiteurs anonymes sur la landing page ne peuvent pas lister les fichiers du bucket `assets`, donc la vidéo n'est jamais trouvée
2. La méthode actuelle cherche le fichier par listing au lieu de construire l'URL directement

## Solution

Dans `src/pages/Landing.tsx`, remplacer l'approche `list()` + `search` par une construction directe de l'URL publique. Puisque le bucket `assets` est public, on peut utiliser `getPublicUrl` avec le nom exact du fichier. On testera plusieurs extensions courantes (`.mp4`, `.webm`, `.mov`) via un `fetch HEAD` pour trouver celle qui existe.

```tsx
useEffect(() => {
  const tryVideoExtensions = async () => {
    const extensions = ['mp4', 'webm', 'mov', 'MP4'];
    for (const ext of extensions) {
      const { data } = supabase.storage.from('assets').getPublicUrl(`landing-video.${ext}`);
      try {
        const res = await fetch(data.publicUrl, { method: 'HEAD' });
        if (res.ok) {
          setLandingVideoUrl(data.publicUrl);
          return;
        }
      } catch {}
    }
  };
  tryVideoExtensions();
}, []);
```

## Fichier impacté

| Fichier | Changement |
|---------|-----------|
| `src/pages/Landing.tsx` | Remplacer `list()` par construction directe d'URL avec probe HEAD |

