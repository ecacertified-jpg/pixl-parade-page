La stratégie de messagerie WhatsApp privilégie les modèles HSM (Highly Structured Messages) pour contourner la 'fenêtre de 24 heures' de Meta. L'utilitaire 'sendWhatsAppTemplate' est utilisé pour les notifications suivantes :

## Templates actifs

- `joiedevivre_otp` — Vérification OTP
- `joiedevivre_contact_added` — Notification d'ajout de contact
- `joiedevivre_birthday_reminder` — Rappel d'anniversaire
- `joiedevivre_refund_alert` — Alerte de remboursement
- `joiedevivre_contribution_reminder` — Rappel de contribution
- `joiedevivre_gift_order` — Notification de cadeau commandé
- `joiedevivre_group_contribution` — Invitation aux cagnottes groupées (amis du bénéficiaire)
- `joiedevivre_fund_beneficiary_invite` — Invitation du bénéficiaire non inscrit
- `joiedevivre_contribution_update` — **Template unifié** : informe contributeurs ET non-contributeurs de la progression (%) et des jours restants. Remplace l'ancien template `joiedevivre_contribution_nudge` qui a été abandonné (rejeté par Meta pour similarité avec `_contribution_reminder`).
- `joiedevivre_fund_ready` — Alerte prestataire quand la cagnotte atteint 100%
- `joiedevivre_fund_completed` — **Nouveau** : Félicitations envoyées à tous les amis (contributeurs + non-contributeurs) quand la cagnotte atteint 100%. 4 paramètres : prénom, titre cagnotte, nom bénéficiaire, montant. Bouton CTA : /f/{fund_id}

## Template supprimé

- ~~`joiedevivre_contribution_nudge`~~ — Abandonné. Fusionné dans `joiedevivre_contribution_update` qui gère les deux audiences (contributeurs existants + amis non-contributeurs) avec un seul template à 6 paramètres.

## Notes techniques

- Un fallback vers `sendWhatsApp` (texte libre) est maintenu pour les conversations actives.
- Les fonctions Edge sont standardisées pour prioriser WhatsApp pour le Bénin, Togo, Mali et Burkina Faso.
