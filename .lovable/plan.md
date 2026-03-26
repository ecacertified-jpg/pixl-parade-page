

# Plan : Documenter les 7 templates manquants dans whatsapp-messaging-strategy.md

## Changement — `.lovable/memory/whatsapp-messaging-strategy.md`

Ajouter une nouvelle section **"Templates à créer dans Meta Business Manager"** avec les 7 templates identifiés dans le code mais absents de Meta :

| Template | Fonction Edge | Paramètres body | Bouton CTA |
|----------|--------------|-----------------|------------|
| `joiedevivre_new_order` | `notify-business-order` | 3 : nom client, montant, résumé commande | — |
| `joiedevivre_order_confirmed` | `handle-order-action` | 3 : prénom client, montant, nom boutique | — |
| `joiedevivre_order_rejected` | `handle-order-action` | 3 : prénom client, montant, nom boutique | — |
| `joiedevivre_join_reminder` | `notify-contacts-join-reminder` | 1 : nom de l'ami qui a ajouté | CTA vers joiedevivre-africa.com |
| `joiedevivre_delivery_reminder` | `check-delivery-confirmation-reminder` | 3 : prénom client, ID commande, nom boutique | CTA dynamique `/orders/{{1}}` |
| `joiedevivre_welcome_add_friends` | `check-friends-circle-reminders` (welcome) | 1 : prénom utilisateur | CTA vers /contacts |
| `joiedevivre_friends_circle_reminder` | `check-friends-circle-reminders` (CRON) | 1 : prénom utilisateur | CTA vers /contacts |

Mettre aussi à jour la liste des templates actifs existante pour inclure ces 7 entrées avec leurs descriptions.

## Fichier modifié

- `.lovable/memory/whatsapp-messaging-strategy.md`

