

# Plan : Ajouter un bouton "Accéder à mon tableau de bord" après le partage

## Modification

Dans `src/components/OnboardingExperience.tsx`, à l'étape 5 (page anniversaire), ajouter un state `hasShared` qui passe à `true` quand l'utilisateur clique sur "Partager sur WhatsApp" ou "Copier le lien". Une fois `hasShared === true`, afficher un gros bouton animé "ACCÉDER À MON TABLEAU DE BORD" qui appelle `onComplete()` pour terminer l'onboarding et rediriger vers le dashboard.

### Détails techniques

1. **Nouveau state** : `const [hasShared, setHasShared] = useState(false);`
2. **Mettre à jour** `handleShareBirthdayPage` et `handleCopyLink` pour appeler `setHasShared(true)`
3. **Après les boutons de partage** (ligne ~823), ajouter conditionnellement :

```tsx
{hasShared && (
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
    <Button 
      onClick={onComplete}
      size="lg"
      className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-600 
                 hover:from-green-600 hover:to-emerald-700 text-white font-bold 
                 text-lg py-6 shadow-lg animate-pulse"
    >
      🎉 ACCÉDER À MON TABLEAU DE BORD
      <ArrowRight className="h-5 w-5" />
    </Button>
  </motion.div>
)}
```

4. Le bouton existant "Découvrir mon espace" dans le footer reste disponible comme alternative.

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Ajouter state `hasShared`, bouton conditionnel |

