

# Ajouter la Connexion Google à la Page Admin

## Diagnostic

Les administrateurs ajoutés via `AddAdminModal` ne peuvent pas se connecter car :
- Ils se sont inscrits via **Google OAuth** (pas de mot de passe)
- La page `/admin-auth` n'accepte que l'authentification **email + mot de passe**

| Admin | Méthode d'inscription | Mot de passe | Peut se connecter ? |
|-------|----------------------|--------------|---------------------|
| Florentin | Email/Téléphone | ✅ Oui | ✅ Oui |
| Chris | Google OAuth | ❌ Non | ❌ Non |
| Bernadette | Google OAuth | ❌ Non | ❌ Non |

## Solution

Ajouter un bouton **"Se connecter avec Google"** sur la page `/admin-auth` qui :
1. Authentifie l'utilisateur via Google
2. Vérifie s'il est admin dans la table `admin_users`
3. Redirige vers `/admin` ou affiche un message d'erreur

## Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                    AdminAuth.tsx                         │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │        Formulaire Email + Mot de passe              │ │
│ │        (existant, inchangé)                         │ │
│ └─────────────────────────────────────────────────────┘ │
│                         ──ou──                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  🔵 Se connecter avec Google                        │ │
│ │  (NOUVEAU - Pour admins inscrits via Google)        │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
                   ┌────────────────────┐
                   │  Callback Google   │
                   │  /admin-auth       │
                   └────────┬───────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ Vérifier admin_users        │
              │ WHERE user_id = auth.uid()  │
              │   AND is_active = true      │
              └─────────────┬───────────────┘
                            │
           ┌────────────────┴────────────────┐
           │                                 │
           ▼                                 ▼
    ┌─────────────┐                   ┌─────────────┐
    │ ✅ Est admin │                   │ ❌ Pas admin │
    │ → /admin    │                   │ → Déconnexion│
    │             │                   │ → Erreur     │
    └─────────────┘                   └─────────────┘
```

## Modifications

### Fichier : `src/pages/AdminAuth.tsx`

#### 1. Ajouter l'état de chargement Google

```typescript
const [isGoogleLoading, setIsGoogleLoading] = useState(false);
```

#### 2. Ajouter la fonction `signInWithGoogle`

```typescript
const signInWithGoogle = async () => {
  try {
    setIsGoogleLoading(true);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin-auth`,
      },
    });

    if (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  } catch (error) {
    console.error('Google sign in error:', error);
    toast({
      title: 'Erreur',
      description: 'Une erreur inattendue s\'est produite',
      variant: 'destructive',
    });
  } finally {
    setIsGoogleLoading(false);
  }
};
```

#### 3. Modifier le useEffect pour gérer le callback Google

L'effet existant vérifie déjà si l'utilisateur est admin. Il faut ajouter la gestion du cas où l'utilisateur n'est PAS admin après une connexion Google :

```typescript
useEffect(() => {
  const checkAdminStatus = async () => {
    if (user) {
      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('role, is_active')
        .eq('user_id', user.id)
        .single();

      if (adminData?.is_active) {
        navigate('/admin');
      } else {
        // L'utilisateur est connecté mais n'est pas admin
        // → Déconnecter et afficher erreur
        await supabase.auth.signOut();
        toast({
          title: 'Accès refusé',
          description: 'Ce compte n\'a pas les privilèges administrateur',
          variant: 'destructive',
        });
      }
    }
  };
  
  checkAdminStatus();
}, [user, navigate, toast]);
```

#### 4. Ajouter le bouton Google dans le formulaire

Après le formulaire email/password et avant le bouton "Retour", ajouter :

```tsx
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t border-slate-600" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-slate-800 px-2 text-slate-400">ou</span>
  </div>
</div>

<Button
  type="button"
  variant="outline"
  className="w-full border-slate-600 text-slate-200 hover:bg-slate-700"
  onClick={signInWithGoogle}
  disabled={isGoogleLoading || isLoading}
>
  {isGoogleLoading ? (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  ) : (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )}
  Se connecter avec Google
</Button>
```

#### 5. Ajouter l'import Loader2

```typescript
import { Shield, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
```

## Récapitulatif des Modifications

| Fichier | Modification |
|---------|-------------|
| `src/pages/AdminAuth.tsx` | Ajouter état `isGoogleLoading` |
| `src/pages/AdminAuth.tsx` | Ajouter fonction `signInWithGoogle()` |
| `src/pages/AdminAuth.tsx` | Modifier useEffect pour gérer non-admin après Google OAuth |
| `src/pages/AdminAuth.tsx` | Ajouter séparateur "ou" et bouton Google |
| `src/pages/AdminAuth.tsx` | Ajouter import `Loader2` |

## Comportement Attendu

### Scénario 1 : Admin inscrit via Google
1. Clique sur "Se connecter avec Google"
2. Authentification Google
3. Redirection vers `/admin-auth`
4. Vérification : utilisateur est dans `admin_users` et `is_active = true`
5. Redirection vers `/admin` ✅

### Scénario 2 : Utilisateur non-admin via Google
1. Clique sur "Se connecter avec Google"
2. Authentification Google
3. Redirection vers `/admin-auth`
4. Vérification : utilisateur n'est PAS dans `admin_users`
5. Déconnexion automatique
6. Message d'erreur "Ce compte n'a pas les privilèges administrateur" ❌

### Scénario 3 : Admin inscrit par email/mot de passe
1. Entre email et mot de passe
2. Comportement inchangé ✅

## Tests Recommandés

Après implémentation :
- [ ] Chris (edonouk@gmail.com) peut se connecter via Google
- [ ] Bernadette (mahoussibernadette0@gmail.com) peut se connecter via Google
- [ ] Un utilisateur Google non-admin est rejeté avec message d'erreur
- [ ] La connexion email/mot de passe fonctionne toujours (Florentin)
- [ ] Le bouton Google affiche le loader pendant le chargement

