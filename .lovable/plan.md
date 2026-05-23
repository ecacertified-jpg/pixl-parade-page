
# Corrections du mur de messages

## 1. Bug "Edge Function returned a non-2xx" à la publication
Cause confirmée dans les logs : `userClient.auth.getClaims is not a function` (méthode inexistante dans `@supabase/supabase-js@2.45`).

**Fix** dans `supabase/functions/post-birthday-message/index.ts` :
- Remplacer le bloc `getClaims(token)` par `supabase.auth.getUser(token)` (méthode standard).
- Simplifier : un seul client admin suffit, on appelle `admin.auth.getUser(token)` pour valider le JWT visiteur connecté.

## 2. "Aucune carte disponible"
La table `birthday_card_templates` est vide (0 ligne).

**Action** : migration qui insère ~8 cartes de base (joyeux, tendre, humour, solennel × 2) avec `image_url` pointant vers des illustrations existantes / placeholders Unsplash, `category` aligné sur le ton.
- Champs : `id`, `category`, `title`, `image_url`, `is_active=true`, `sort_order`.
- (La table et son RLS public read existent déjà.)

## 3. Onglet "Stickers" tronqué + couleurs des onglets peu visibles
Sur viewport 758 px le `ScrollArea` rend l'onglet "Stickers" partiellement coupé et l'utilisateur ne voit pas qu'il peut scroller.

**Fix UI** dans `NewPostModal.tsx` (zone Tabs) :
- Garder le scroll horizontal mais : `TabsList` en `flex w-max gap-1.5 bg-secondary/60 p-1`, ajouter padding-right pour qu'on devine le dernier onglet.
- Ajouter un fade gradient à droite (`bg-gradient-to-l from-background`) pour signaler le scroll.
- Couleurs onglets : 
  - inactif → `bg-secondary text-foreground/70`
  - actif → `data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft`
- Pilules de ton (Joyeux/Tendre/…) : actif → même dégradé primary→accent + shadow ; inactif → `bg-secondary/70 border-primary/20`.
- Bouton "Suggérer ✨" : `variant="outline"` + `border-primary/40 text-primary hover:bg-primary/10`.
- Bouton "Enregistrer" (micro) : `border-accent/50 text-accent-foreground bg-accent/10 hover:bg-accent/20`.
- Bouton "Publier" : déjà dégradé, on ajoute `shadow-soft hover:opacity-95`.
- Bouton "Nouveau post" du `MessageWall` : ajouter `shadow-soft` et hover plus contrasté.

## 4. Vérification
- Re-déployer `post-birthday-message` (auto).
- Tester : publier en mode visiteur → message inséré, toast succès.
- Vérifier que l'onglet Stickers s'affiche entièrement après scroll, fade visible.
- Vérifier que l'onglet Cartes affiche les 8 templates seedés.

## Hors scope
- Pas de nouvel onglet, pas de logique métier ajoutée.
- Pas de refonte des cartes message (`MessageCard.tsx`).

## Détails techniques
- Aucune modification de schéma, juste un `INSERT` data dans `birthday_card_templates`.
- Pas de nouvelle dépendance.
- Tokens HSL déjà définis (`--primary`, `--accent`, `--secondary`) → utilisés via classes Tailwind sémantiques, conforme au design system.
