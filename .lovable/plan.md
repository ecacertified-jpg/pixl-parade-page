
# Installer l'app directement depuis la banniere

## Probleme actuel

Le bouton "Installer" de la banniere redirige vers la page `/install` au lieu de declencher directement l'invite d'installation PWA du navigateur. L'utilisateur doit donc passer par une etape intermediaire inutile.

## Solution

Modifier `InstallBanner.tsx` pour :

1. **Capturer l'evenement `beforeinstallprompt`** -- Stocker le prompt d'installation dans un state local (`deferredPrompt`) pour pouvoir le declencher plus tard.

2. **Declencher l'installation au clic** -- Quand l'utilisateur clique sur "Installer" :
   - Si le prompt est disponible : appeler `deferredPrompt.prompt()` pour afficher l'invite native d'installation
   - Si le prompt n'est pas disponible (iOS ou navigateur non compatible) : rediriger vers `/install` comme fallback (pour montrer les instructions manuelles)

3. **Masquer la banniere apres installation** -- Ecouter l'evenement `appinstalled` pour cacher la banniere automatiquement.

## Fichier impacte

- **Modifie** : `src/components/InstallBanner.tsx`

## Detail technique

```
- Ajouter un state : deferredPrompt
- Ajouter un listener "beforeinstallprompt" dans le useEffect existant
- Ajouter un listener "appinstalled" pour masquer la banniere
- Modifier handleInstall : si deferredPrompt existe, appeler .prompt(), sinon navigate("/install")
- Supprimer l'import useNavigate seulement si on garde le fallback (on le garde)
```
