

# Harmoniser l'affichage des cartes pays dans le dashboard admin

## Probleme actuel

Les 3 cartes pays (Cote d'Ivoire, Benin, Senegal) dans le dashboard admin ont un affichage desaligne :
- Le code pays ("CI", "BJ", "SN") s'affiche en gros texte a gauche
- Le nom du pays et les stats sont mal alignes entre les cartes
- L'espacement et la mise en page ne sont pas uniformes

## Solution

Redesigner le composant `CountryStatsCards` pour un affichage centre et harmonieux :
- Drapeau emoji en grand au centre en haut
- Nom du pays centre en dessous
- Stats (utilisateurs / prestataires) alignees uniformement en bas
- Meme hauteur de carte garantie

## Fichier modifie

### `src/components/admin/CountryStatsCards.tsx`

Remplacer le layout horizontal (flex row) par un layout vertical centre (flex col, text-center) :

```tsx
<Card key={country.code} className="hover:shadow-md transition-shadow">
  <CardContent className="p-5 flex flex-col items-center text-center gap-2">
    <span className="text-4xl">{country.flag}</span>
    <p className="font-semibold text-base">{country.name}</p>
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span>{countryStats.users.toLocaleString('fr-FR')} utilisateurs</span>
      <span>·</span>
      <span>{countryStats.businesses} prestataires</span>
    </div>
  </CardContent>
</Card>
```

Memes changements pour l'etat loading (skeleton).

## Impact

- 1 fichier modifie : `CountryStatsCards.tsx`
- Layout vertical centre pour chaque carte
- Affichage uniforme quelle que soit la longueur du nom de pays

