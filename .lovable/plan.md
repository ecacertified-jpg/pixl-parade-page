

## Plan : Ameliorer l'ergonomie de la modale "Bienvenue"

### Probleme
Sur mobile, la modale contient trop d'elements verticaux (header 150px + progress 100px + 4 champs dont AddressSelector tres haut + footer 80px). La zone scrollable est petite, les champs sont masques et l'utilisateur ne realise pas qu'il doit scroller. Le screenshot montre que l'anniversaire n'est pas rempli mais le champ n'est pas visible.

### Solution
Compacter verticalement tous les elements pour que les 3 champs requis soient visibles sans scroll sur la majorite des ecrans mobiles, tout en conservant le mecanisme de completion.

### Modifications — `src/components/CompleteProfileModal.tsx`

1. **Header compact sur mobile** : Reduire l'icone (w-12 h-12 au lieu de w-16 h-16), le titre (text-xl au lieu de text-2xl), et raccourcir la description. Supprimer le `mb-4` de l'icone.

2. **Progress indicator inline** : Remplacer le bloc progress detaille (3 lignes avec icones + labels + barre) par une version compacte sur une seule ligne : barre de progression + pourcentage, avec les 3 check-marks en ligne dessous sans labels (juste les icones).

3. **Reduire les espacements** : `space-y-6` → `space-y-4` dans la zone de formulaire. Supprimer les `<p>` d'aide sous AddressSelector et PhoneInput (deja expliques par les labels).

4. **AddressSelector compact** : Passer `allowCountryOverride={false}` pour masquer le selecteur de pays (auto-detecte via CountryContext). Cela supprime ~40px. Le pays reste modifiable dans les parametres profil plus tard.

5. **Supprimer le champ Prenom** : Il est optionnel et deja rempli depuis Google OAuth. Le retirer de la modale pour gagner ~60px. Il restera modifiable dans les parametres profil.

6. **Footer plus compact** : Supprimer le texte "Ces informations sont obligatoires..." sous le bouton, reduire le padding.

### Resultat attendu
- ~250px d'espace vertical recupere
- Les 3 champs requis (anniversaire, adresse, telephone) visibles sans scroll sur la plupart des mobiles
- Le mecanisme de completion (barre + checks) reste visible en haut

### Fichier impacte
- `src/components/CompleteProfileModal.tsx`

