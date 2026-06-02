
# Module Organisation — JDV Compagnon de célébration

Objectif : ajouter un espace privé "Organisation" sur les pages anniversaire et événement, sans toucher à l'expérience publique (vidéo, compte à rebours, cadeau collectif, cartes, album).

## 1. Architecture polymorphe

Les 5 nouvelles tables référencent une page via un couple `(page_type, page_id)` plutôt que deux FK distinctes. Cela évite la duplication entre `birthday_pages` et `event_pages` et reste extensible (futurs types).

- `page_type` : enum `'birthday' | 'event'`
- Helper SQL `public.can_manage_page(_user_id uuid, _page_type text, _page_id uuid)` (SECURITY DEFINER) : renvoie true si l'utilisateur est propriétaire (`user_id` sur birthday_pages / `creator_id` sur event_pages) OU co-organisateur actif avec un rôle autorisé.
- Toutes les RLS d'écriture passent par ce helper (zéro `USING (true)`).

## 2. Schéma (5 nouvelles tables + 1 enum)

```text
event_organizers          (co-organisateurs hybrides)
 ├─ page_type, page_id
 ├─ user_id (nullable, lien JDV si inscrit)
 ├─ invited_phone, invited_name, invited_email (avant inscription)
 ├─ role: admin | tasks | budget | guests | vendors
 ├─ status: pending | accepted | revoked
 ├─ invite_token, invited_by, accepted_at

event_tasks               (checklist)
 ├─ page_type, page_id
 ├─ title, description, due_date
 ├─ status: todo | in_progress | done
 ├─ assigned_to (organizer_id, nullable)
 ├─ position (tri manuel)

event_vendors             (prestataires)
 ├─ page_type, page_id
 ├─ category (réutilise CELEBRATION_ARTISAN_ROLES)
 ├─ name, phone, notes
 ├─ business_account_id (nullable, prêt pour V2 marketplace)

event_budget_items        (budget)
 ├─ page_type, page_id
 ├─ category, label
 ├─ planned_amount, spent_amount
 ├─ currency (défaut XOF)

event_guests              (invités RSVP)
 ├─ page_type, page_id
 ├─ name, phone, contact_id (lien optionnel address book)
 ├─ status: invited | confirmed | declined | pending
 ├─ note
```

Index sur `(page_type, page_id)` pour chaque table. GRANT explicites pour `authenticated` et `service_role` (aucun accès `anon` : tout est privé).

## 3. RLS

- SELECT/INSERT/UPDATE/DELETE : `can_manage_page(auth.uid(), page_type, page_id)`
- `event_organizers` : un invité peut SELECT/UPDATE sa propre ligne via `invite_token` (pour accepter) — politique séparée.
- Aucun accès public ; l'onglet Organisation n'est rendu côté client que si l'utilisateur figure dans la liste des managers.

## 4. Co-organisateurs (hybride)

Flux :
1. Propriétaire ouvre la modale "Inviter un co-organisateur" → saisit nom + téléphone (+ email optionnel) + rôle.
2. Insertion `event_organizers` avec `status='pending'` et `invite_token`.
3. WhatsApp envoyé via edge function `notify-organizer-invite` (template existant ou message libre) → lien `/organisation/accept/:token`.
4. Page d'acceptation :
   - Si utilisateur JDV connecté avec phone correspondant → `user_id` liés, status=accepted.
   - Sinon → onboarding court (réutilise self-fill token flow existant), puis lien.
5. Une fois accepté, le co-orga voit l'onglet Organisation sur la page.

Rôles et permissions (UI-side + check helper SQL) :
- `admin` : tout
- `tasks` : checklist
- `budget` : budget
- `guests` : invités
- `vendors` : prestataires

## 5. UI

Nouveau dossier `src/components/organization/` :
- `OrganizationTab.tsx` (entrée principale, sous-onglets festifs)
- `TasksBoard.tsx` (cartes avec emoji par statut)
- `VendorsList.tsx` (réutilise `CELEBRATION_ARTISAN_ROLES`, lien vers carnet existant)
- `BudgetTable.tsx` (totaux pré/dépensé/diff, jauge colorée)
- `GuestsList.tsx` (compteur + taux de confirmation animé)
- `OrganizersManager.tsx` (modale d'invitation, liste, rôles)
- `OrganizationEmptyState.tsx` (illustration douce, ton chaleureux)

Intégration :
- `BirthdayPage.tsx` et `EventPage.tsx` : ajout d'un onglet "🎯 Organisation" rendu uniquement si `useCanManagePage(pageType, pageId)` renvoie true.
- Page d'acceptation : nouvelle route `/organisation/accept/:token` (alias FR `/organisation/inviter/:token`).

Ton & design :
- Réutilise palette JDV (primary violet, secondary rose, cards `rounded-2xl shadow-soft`), Poppins/Nunito.
- Vocabulaire émotionnel : "Mes préparatifs", "Mon équipe de cœur", "Mon enveloppe", "Mes invités" plutôt que "tasks/budget/guests".
- Micro-animations confetti à l'achèvement d'une tâche, jauge budget qui se remplit, badge "🎉 100% confirmés".
- Mobile-first : sous-onglets en pills horizontales scrollables.

## 6. Hooks

- `useOrganizationAccess(pageType, pageId)` → `{ canManage, role, isOwner }`
- `useEventTasks`, `useEventVendors`, `useEventBudget`, `useEventGuests`, `useEventOrganizers` (CRUD + realtime optionnel)
- Validation Zod sur tous les formulaires.

## 7. Edge functions

- `notify-organizer-invite` : envoi WhatsApp/SMS de l'invitation (réutilise stack notifications existante).
- `accept-organizer-invite` : valide le token, lie au user, marque accepted.

## 8. Lots de livraison

1. **Migration SQL** (tables + enum + helper + RLS + GRANTs) — soumise via le tool migration.
2. **Hooks + types + helper d'accès**.
3. **UI onglet Organisation + 4 sous-modules** (checklist, prestataires, budget, invités).
4. **Co-organisateurs** : modale, edge functions, page d'acceptation.
5. **Polish** : animations, vocabulaire, états vides, mémoire projet mise à jour.

## 9. Hors périmètre V1 (à anticiper sans construire)

- Liaison prestataire ↔ profil pro JDV : colonne `business_account_id` déjà prête.
- Système d'évaluation/réservation : ajouté plus tard, table `vendor_bookings` séparée.
- Module Souvenirs "après l'événement" : l'album existant couvre déjà cette étape ; les améliorations (timeline, remerciements automatiques) restent à planifier dans un futur module.

## 10. Vérifications avant fin

- Linter Supabase après migration.
- Test : visiteur classique ne voit PAS l'onglet Organisation.
- Test : co-orga `tasks` ne peut pas modifier le budget (UI + RLS).
