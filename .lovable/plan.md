

## Optimiser le chargement des cagnottes sur le Dashboard

### Probleme identifie

Le Dashboard charge les cagnottes de maniere lente pour 3 raisons principales :

1. **Appel en double** : Le hook `useCollectiveFunds()` est appele 2 fois independamment - une fois dans `Dashboard.tsx` et une fois dans `PublicFundsCarousel.tsx`. Chaque appel execute toutes les requetes Supabase separement.

2. **Cascade de requetes (waterfall)** : Le hook fait 2 vagues sequentielles de requetes :
   - Vague 1 : `collective_funds` + `contact_relationships` (en parallele)
   - Vague 2 : `contacts` (amis) + `contacts` (beneficiaires) + `products` (en parallele, mais APRES la vague 1)
   
   Soit ~5 requetes reseau en 2 etapes, multipliees par 2 (appel double) = ~10 requetes.

3. **Pas de cache** : Le hook utilise `useState/useEffect` brut au lieu de TanStack Query (deja installe). Chaque montage du composant relance toutes les requetes.

### Plan d'optimisation

---

#### Etape 1 : Migrer `useCollectiveFunds` vers TanStack Query

Remplacer le pattern `useState/useEffect` par `useQuery` de TanStack Query. Cela apporte :
- **Cache automatique** : Les donnees sont mises en cache et partagees entre tous les composants qui appellent le meme hook
- **Deduplication** : Meme si `Dashboard.tsx` et `PublicFundsCarousel.tsx` appellent le hook en meme temps, une seule requete sera executee
- **Stale-while-revalidate** : L'UI affiche immediatement les donnees en cache pendant le rafraichissement en arriere-plan

Fichier modifie : `src/hooks/useCollectiveFunds.ts`

```text
Avant :
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { loadFunds(); }, [user]);

Apres :
  const { data: funds, isLoading: loading, refetch } = useQuery({
    queryKey: ['collective-funds', user?.id, effectiveCountryFilter],
    queryFn: () => fetchCollectiveFunds(user, effectiveCountryFilter),
    enabled: !!user,
    staleTime: 30_000, // 30s cache
  });
```

---

#### Etape 2 : Reduire le waterfall en une seule requete optimisee

Restructurer la requete principale pour inclure les contacts du beneficiaire directement dans le SELECT initial via le JOIN existant `contacts!beneficiary_contact_id`. Actuellement ce JOIN est evite "pour eviter les problemes RLS", mais les contacts sont ensuite requetes separement de toute facon.

Plan :
- Garder la requete principale avec le JOIN `contacts!beneficiary_contact_id(name, birthday, user_id)` directement
- Eliminer la vague 2 de requetes separees pour les contacts beneficiaires
- Garder la requete produits en parallele avec la requete principale (au lieu de sequentielle)

Resultat : passer de 2 vagues sequentielles a 1 seule vague de requetes paralleles.

---

#### Etape 3 : Supprimer les console.log de debug

Le hook contient de nombreux `console.log` de debug (lignes 204, 228, 238, 264, 332-336) qui ralentissent le rendu. Les supprimer pour la production.

---

### Impact attendu

| Metrique | Avant | Apres |
|----------|-------|-------|
| Requetes Supabase | ~10 (2x5) | ~3 (deduplication + JOIN) |
| Vagues reseau | 2 sequentielles x2 | 1 seule |
| Cache | Aucun | 30s stale-while-revalidate |
| Temps de chargement estime | ~2-4s | < 1s |

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/hooks/useCollectiveFunds.ts` | Migration vers TanStack Query + reduction du waterfall + suppression logs debug |

