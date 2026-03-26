

# Plan : Dashboard inventaire complet des templates WhatsApp

## Problème

Le dashboard actuel (`/admin/whatsapp-templates`) ne montre que les templates ayant des logs. Il ne liste pas les templates connus mais jamais envoyés, ni ceux en échec total. Impossible de voir d'un coup d'oeil l'état de santé de tous les templates.

## Approche

Ajouter une section "Inventaire des templates" en haut du dashboard existant. Cette section combine une liste statique de tous les templates connus (extraite de `whatsapp-messaging-strategy.md`) avec les données réelles de `whatsapp_template_logs` pour calculer le statut de chaque template.

## Changement 1 — `src/hooks/useWhatsAppTemplateInventory.ts` (nouveau)

Créer un hook qui :
1. Définit la liste complète des templates connus (constante statique avec nom, description, fonction Edge source)
2. Requête `whatsapp_template_logs` groupé par `template_name` pour obtenir : total, sent, failed, dernier envoi
3. Fusionne les deux : chaque template reçoit un statut calculé :
   - **Actif** : envois récents avec taux succès >= 80%
   - **Dégradé** : envois récents mais taux succès < 80%
   - **En échec** : 100% d'échecs
   - **Jamais envoyé** : 0 logs
   - **Non créé dans Meta** : templates marqués comme "à créer"

## Changement 2 — `src/pages/Admin/WhatsAppTemplateDashboard.tsx`

Ajouter une Card "Inventaire des templates" entre les KPIs et le graphique :
- Tableau avec colonnes : Nom du template, Fonction Edge, Statut (badge coloré), Envois, Succès, Échecs, Dernier envoi
- Filtres par statut (tous / actif / dégradé / en échec / jamais envoyé)
- Tri par défaut : les templates en échec et jamais envoyés en premier

## Fichiers modifiés

- `src/hooks/useWhatsAppTemplateInventory.ts` (nouveau)
- `src/pages/Admin/WhatsAppTemplateDashboard.tsx`

