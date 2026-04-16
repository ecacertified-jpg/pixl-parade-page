

# Plan : Promesse de cadeau sur les pages d'anniversaire et d'événement dans le fil

## Problème

Le bouton "Cadeau" dans `FeedCardActions` navigue simplement vers la page. Il faut qu'il ouvre le `GiftPromiseModal` existant pour enregistrer une promesse de cadeau, comme c'est fait dans `PostCard`.

## Contrainte technique

La table `gift_promises` existante a un FK obligatoire `post_id → posts`. Les pages d'anniversaire/événement ne sont pas des posts. Il faut donc une nouvelle table.

## Plan

### 1. Migration SQL — Nouvelle table `page_gift_promises`

```sql
CREATE TABLE public.page_gift_promises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id uuid NOT NULL,
  page_type text NOT NULL CHECK (page_type IN ('birthday', 'event')),
  page_owner_id uuid NOT NULL,
  is_notified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, page_id, page_type)
);

ALTER TABLE public.page_gift_promises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own promises" ON public.page_gift_promises
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own promises" ON public.page_gift_promises
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own promises" ON public.page_gift_promises
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Page owners can view promises for their pages" ON public.page_gift_promises
  FOR SELECT USING (auth.uid() = page_owner_id);
```

### 2. `src/components/FeedCardActions.tsx` — Intégrer le GiftPromiseModal

- Ajouter un state `showGiftPromise`
- Au clic sur "Cadeau" : vérifier l'auth, puis ouvrir le `GiftPromiseModal`
- Sur confirmation : insérer dans `page_gift_promises` + toast succès
- Passer le nom du créateur et l'occasion au modal

### 3. Aucun changement au `GiftPromiseModal`

Le composant existant est déjà générique (props `authorName`, `occasion`, `onConfirm`). Il sera réutilisé tel quel.

## Fichiers concernés

| Fichier | Changement |
|---------|------------|
| Migration SQL | Nouvelle table `page_gift_promises` avec RLS |
| `src/components/FeedCardActions.tsx` | Import `GiftPromiseModal`, state + logique d'insertion, remplacement de la navigation par l'ouverture du modal |

## Résultat

Cliquer sur 🎁 Cadeau dans le fil ouvre le modal de promesse avec confettis, enregistre la promesse en base, et affiche un toast de confirmation.

