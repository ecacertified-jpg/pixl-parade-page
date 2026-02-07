
# Correction du trigger et test des rappels SMS

## Probleme decouvert

En analysant le code, j'ai trouve un **bug critique** dans la fonction trigger `generate_fund_contribution_reminders()`. Elle reference des colonnes inexistantes :
- `cr.user_id` et `cr.friend_id` dans la table `contact_relationships`
- Les vraies colonnes sont `user_a` et `user_b`

C'est pour cela que **0 rappel** a ete genere malgre 6 cagnottes existantes.

## Plan en 2 etapes

### Etape 1 : Corriger le trigger

Creer une migration qui corrige la fonction `generate_fund_contribution_reminders()` en remplacant :
- `cr.user_id` par une logique qui gere les deux sens de la relation (`user_a` / `user_b`)
- `cr.friend_id` par l'ami correspondant

La requete corrigee cherchera les amis dans les deux directions :
```text
Cas 1 : user_a = creator_id  -->  ami = user_b
Cas 2 : user_b = creator_id  -->  ami = user_a
```

### Etape 2 : Tester de bout en bout

Apres correction, je vous donnerai les instructions pour :

1. **Creer une cagnotte de test** depuis l'application (via le Dashboard ou le bouton de creation)
2. **Verifier** que les rappels ont ete generes avec la requete :
   ```text
   SELECT * FROM fund_contribution_reminders ORDER BY created_at DESC;
   ```
3. **Tester manuellement** la fonction Edge en l'invoquant pour voir si les SMS partent correctement

---

## Details techniques

La migration SQL va :
1. Remplacer la fonction `generate_fund_contribution_reminders()` avec les bons noms de colonnes
2. Utiliser `UNION` pour recuperer les amis dans les deux sens de `contact_relationships`
3. Garder toute la logique existante (rappels tous les 2 jours, rappel J-1, etc.)
