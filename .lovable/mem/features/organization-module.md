---
name: Organization Module
description: Private "Mes coulisses" tab on birthday and event pages for owner + accepted co-organizers (tasks, vendors, budget, guests, team)
type: feature
---
Polymorphic architecture: tables `event_tasks`, `event_vendors`, `event_budget_items`, `event_guests`, `event_organizers` reference pages via `(page_type, page_id)` where `page_type IN ('birthday','event')`.

Access via SECURITY DEFINER helpers `is_page_owner` and `can_manage_page(user, page_type, page_id, required_role?)`. Roles: admin | tasks | budget | guests | vendors. Admin bypasses scope.

UI: single `OrganizationSection` card visible only when `useOrganizationAccess` returns canManage=true. Opens a bottom Sheet with 5 sub-tabs (Préparatifs, Prestataires, Budget, Invités, Équipe).

Co-organizer flow (hybride): owner inserts `event_organizers` row (status=pending, invite_token=random) and shares a wa.me link to `/organisation/accept/:token`. Acceptance goes through edge function `accept-organizer-invite` (service role: link token → auth.uid()).

Visitors never see the section. Vendors table has `business_account_id` reserved for future marketplace linking.