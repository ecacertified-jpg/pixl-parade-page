

## Suppression du doublon `[functions.product-preview]`

Le fichier `supabase/config.toml` contient deux fois la section `[functions.product-preview]` :
- **Ligne 159** (premiere occurrence)
- **Ligne 189** (doublon)

### Action
Supprimer le doublon aux lignes 189-190, en conservant la premiere occurrence (ligne 159).

### Detail technique
Le bloc suivant sera supprime :
```
[functions.product-preview]
verify_jwt = false
```
(lignes 189-190)

Apres cette correction, tu pourras relancer la commande de link sans erreur :
```powershell
C:\supabase\supabase.exe link --project-ref vaimfeurvzokepqqqrsl
```

