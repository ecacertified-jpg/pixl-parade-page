

## Plan : Onglet actif avec fond violet fonce

### Probleme
Le `bg-primary` (HSL 259 58% 59%) n'est pas assez fonce pour creer un contraste suffisant sur la barre d'onglets.

### Solution

**Fichier : `src/pages/Dashboard.tsx`** (lignes 605, 617, 629, 641, 653)

Remplacer sur les 5 `TabsTrigger` :
- `data-[state=active]:bg-primary` → `data-[state=active]:bg-[hsl(259,58%,42%)]`
- Garder `data-[state=active]:text-white` (explicite au lieu de `text-primary-foreground`)
- Garder `data-[state=active]:shadow-md`

Cela applique un violet nettement plus fonce (luminosite 42% au lieu de 59%) pour un contraste clair avec le fond de la TabsList.

### Fichier impacte
- `src/pages/Dashboard.tsx`

