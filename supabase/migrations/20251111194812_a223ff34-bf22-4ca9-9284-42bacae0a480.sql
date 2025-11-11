-- Enrichissement de la base de connaissances IA avec 20 questions/réponses
-- Catégories: funds (surprises), friends (réciprocité), features (notifications), gifts (gratitude)

INSERT INTO ai_knowledge_base (category, question, answer, keywords, priority, is_active) VALUES

-- CAGNOTTES SURPRISES (7 questions) - Catégorie: funds
(
  'funds',
  'Qu''est-ce qu''une cagnotte surprise ?',
  '🎁 Une **cagnotte surprise** est une cagnotte collaborative **secrète** !

✨ **Fonctionnement** :
- Le bénéficiaire **ne sait pas** que la cagnotte existe
- Seuls les contributeurs peuvent la voir
- Elle est révélée à une **date précise** que vous choisissez
- Un message personnalisé accompagne la révélation

🎉 **Idéal pour** :
- Anniversaires surprises
- Départs en retraite
- Félicitations inattendues
- Moments de bonheur spontanés

➡️ C''est la magie de la surprise collective ! 🎊',
  ARRAY['surprise', 'cagnotte surprise', 'secret', 'caché'],
  10,
  true
),

(
  'funds',
  'Comment créer une cagnotte surprise ?',
  'Pour créer une **cagnotte surprise** :

1️⃣ Cliquez sur **"Faire une surprise"** depuis le Dashboard
2️⃣ Activez le **"Mode Surprise Collective"**
3️⃣ Remplissez :
   - Titre de la cagnotte
   - Montant cible
   - Description
   - **Date de révélation** (important !)
   - **Message à révéler** le jour J
   - Optionnel : Prompt pour un chant IA personnalisé 🎵
4️⃣ Validez !

⚡ **Important** : 
- Le bénéficiaire ne verra RIEN jusqu''à la date de révélation
- Tous les contributeurs peuvent voir la progression
- Une notification sera envoyée le jour J

🎁 La surprise sera totale ! 🤫',
  ARRAY['créer surprise', 'faire surprise', 'cagnotte secrète'],
  9,
  true
),

(
  'funds',
  'Quand la surprise est-elle révélée au bénéficiaire ?',
  '📅 La surprise est révélée à la **date de révélation** que vous avez choisie lors de la création.

🔔 **Ce qui se passe ce jour-là** :
1. Le bénéficiaire reçoit une **notification spéciale**
2. Une animation avec **confettis** 🎊 s''affiche
3. Le **message personnalisé** apparaît
4. Le **montant total collecté** est dévoilé
5. La **liste des contributeurs** est révélée
6. Le **chant IA** (si configuré) peut être écouté 🎵

✨ C''est un moment magique et émouvant ! 💝

⚠️ **Note** : Vous pouvez modifier la date de révélation tant qu''elle n''est pas passée.',
  ARRAY['révélation', 'dévoiler', 'quand révélé', 'date surprise'],
  8,
  true
),

(
  'funds',
  'Comment fonctionne le chant IA personnalisé ?',
  '🎵 Le **chant IA personnalisé** est une chanson unique créée pour la surprise !

🤖 **Comment ça marche** :
1. Lors de la création, vous donnez un **prompt** :
   - Ex: "Une chanson joyeuse d''anniversaire en français"
   - Ex: "Un rap festif pour féliciter une promotion"
2. Notre IA génère une **musique originale** avec paroles
3. Le chant est joué lors de la **révélation** de la surprise

🎼 **Caractéristiques** :
- Totalement personnalisé selon votre prompt
- Durée : ~30 secondes à 1 minute
- Style musical de votre choix
- En français ou autre langue

💡 **Astuce** : Soyez créatif dans votre prompt pour un résultat unique !

✨ C''est la touche finale magique ! 🎶',
  ARRAY['chant IA', 'musique IA', 'chanson personnalisée', 'audio surprise'],
  7,
  true
),

(
  'funds',
  'Qui peut voir une cagnotte surprise avant la révélation ?',
  '🔒 La **confidentialité** d''une cagnotte surprise est stricte :

✅ **PEUVENT VOIR** (avant révélation) :
- Le **créateur** de la cagnotte
- Les **contributeurs** qui ont participé
- Les amis **invités** à contribuer

❌ **NE PEUVENT PAS VOIR** :
- Le **bénéficiaire** (jusqu''à la date de révélation)
- Les personnes non invitées
- Le grand public (même si d''habitude publique)

🎊 **Après la révélation** :
- Le bénéficiaire voit tout
- La cagnotte devient visible selon ses paramètres initiaux

➡️ Le secret est bien gardé ! 🤫',
  ARRAY['qui voit', 'confidentialité surprise', 'visibilité surprise'],
  8,
  true
),

(
  'funds',
  'Peut-on encore contribuer après la révélation de la surprise ?',
  '✅ **Oui, absolument !**

Une fois la surprise révélée, la cagnotte continue d''exister et :

📈 **Les contributions restent ouvertes** :
- Les amis peuvent continuer à contribuer
- Le bénéficiaire voit les nouvelles contributions en temps réel
- La barre de progression se met à jour

🎁 **Avantages** :
- Certains amis peuvent avoir manqué le timing initial
- On peut vouloir dépasser l''objectif initial
- Le bénéficiaire peut remercier les contributeurs

⏰ **Durée** : La cagnotte reste active jusqu''à :
- L''atteinte de l''objectif (si configuré)
- La date limite (si définie)
- La clôture manuelle par le créateur

💡 Plus d''amis = plus de générosité ! 💝',
  ARRAY['contribuer après', 'après révélation', 'continuer surprise'],
  6,
  true
),

(
  'funds',
  'Puis-je modifier ou annuler une cagnotte surprise ?',
  '✏️ **OUI**, vous pouvez modifier une surprise **avant la révélation** :

📝 **Modifications possibles** :
- Titre et description
- Montant cible
- **Date de révélation** (si pas encore passée)
- Message de révélation
- Prompt du chant IA

🔧 **Comment faire** :
1. Allez dans **"Mes Cagnottes"**
2. Cliquez sur la cagnotte surprise
3. Utilisez le bouton **"Modifier"**

🗑️ **Annulation** :
- Possible uniquement **sans contributions**
- Si des gens ont déjà contribué, contactez le support

⚠️ **Attention** :
- Une fois révélée, impossible de remettre en mode surprise
- Les contributeurs seront notifiés des changements majeurs

💡 Réfléchissez bien avant de créer ! 🎯',
  ARRAY['modifier surprise', 'annuler surprise', 'changer date révélation'],
  7,
  true
),

-- SYSTÈME DE RÉCIPROCITÉ (6 questions) - Catégorie: friends
(
  'friends',
  'C''est quoi le système de réciprocité ?',
  '💝 Le **système de réciprocité** encourage l''équilibre dans les échanges de cadeaux !

🎯 **Principe** :
- Vous avez un **score de 0 à 100**
- Le score mesure votre **générosité** vs ce que vous **recevez**
- Plus vous contribuez, plus votre score augmente
- Vous obtenez des **badges** selon votre niveau

🏆 **Les 4 badges** :
- 🌱 **Nouveau** (0-20 pts) : Débutant
- 🤝 **Contributeur** (21-50 pts) : Actif
- 🎁 **Généreux** (51-80 pts) : Très généreux
- 👑 **Champion** (81-100 pts) : Expert de la générosité

💡 **Objectif** : Créer une communauté d''entraide où chacun donne et reçoit !

➡️ C''est le karma de JOIE DE VIVRE ! ✨',
  ARRAY['réciprocité', 'score', 'karma', 'équilibre', 'badges'],
  10,
  true
),

(
  'friends',
  'Comment améliorer mon score de réciprocité ?',
  '📈 Pour augmenter votre **score de réciprocité** :

✅ **Actions positives** :
- 💰 **Contribuer** à des cagnottes d''amis (+points)
- 🎁 **Commander** des cadeaux pour vos proches (+points)
- 🎉 **Participer** régulièrement aux célébrations (+bonus)
- 💬 **Interagir** avec la communauté (+petit bonus)

📊 **Calcul du score** :
- Montant total donné ÷ Montant total reçu × 100
- Nombre de contributions données
- Fréquence de participation
- Diversité des bénéficiaires

⚡ **Astuces** :
- Contribuez **régulièrement** plutôt qu''en gros montants
- Participez aux cagnottes de **différentes personnes**
- Soyez présent pour les **anniversaires** de vos amis

🎯 De "Nouveau" à "Champion", c''est à vous de jouer ! 🏆',
  ARRAY['augmenter score', 'améliorer réciprocité', 'gagner points'],
  9,
  true
),

(
  'friends',
  'C''est quoi les notifications de réciprocité ?',
  '🔔 Les **notifications de réciprocité** vous rappellent gentiment de rendre la pareille !

📬 **Types de rappels** :
1. 🎂 **Anniversaire proche** : "L''anniversaire de Marie est dans 5 jours !"
2. 💝 **Réciprocité suggérée** : "Jean a contribué 3 fois à vos cagnottes"
3. ⚖️ **Déséquilibre important** : "Vous avez reçu beaucoup, pensez à donner"
4. 🎯 **Opportunité** : "Une nouvelle cagnotte a été créée pour Paul"

⏰ **Quand les recevoir** :
- 7-10 jours avant un anniversaire
- Après avoir reçu plusieurs contributions
- Quand un ami crée une cagnotte

🎛️ **Personnalisation** :
- Allez dans **Paramètres > Notifications**
- Activez/désactivez les rappels de réciprocité
- Choisissez la fréquence

💡 Ces notifications sont **bienveillantes**, jamais intrusives ! 🌟',
  ARRAY['notification réciprocité', 'rappel contribution', 'alerte anniversaire'],
  8,
  true
),

(
  'friends',
  'Est-ce que je peux voir le score de mes amis ?',
  '🔒 **Non**, les scores de réciprocité sont **privés** par défaut.

👀 **Ce que vous POUVEZ voir** :
- Votre propre score et badge
- Vos statistiques personnelles
- Vos contributions données et reçues

🚫 **Ce que vous NE POUVEZ PAS voir** :
- Le score exact de vos amis
- Leurs contributions détaillées
- Leur historique de dons

✅ **Ce qui est public** :
- Les **badges** peuvent être affichés (optionnel)
- La participation à une cagnotte collective
- Les messages de gratitude publics

🎯 **Pourquoi** ?
- Éviter la compétition malsaine
- Préserver la spontanéité des dons
- Respecter la vie privée

💡 L''important est de **donner avec le cœur**, pas pour le score ! 💝',
  ARRAY['voir score amis', 'score public', 'confidentialité score'],
  7,
  true
),

(
  'friends',
  'C''est grave si mon score de réciprocité est bas ?',
  '😊 **Pas du tout !** Le score de réciprocité est un **encouragement**, pas une sanction.

🌱 **Score bas (Nouveau 0-20)** :
- Vous êtes peut-être nouveau
- Vous n''avez pas encore eu l''occasion de contribuer
- **Aucune limitation** sur votre compte

📌 **Ce qui NE change PAS** :
- ✅ Vous pouvez créer des cagnottes
- ✅ Vous pouvez recevoir des cadeaux
- ✅ Vous pouvez utiliser toutes les fonctionnalités
- ✅ Vos amis peuvent contribuer normalement

💡 **Ce qui peut vous aider** :
- Les **notifications de réciprocité** vous suggèrent des opportunités
- Des rappels gentils pour les anniversaires
- Des suggestions de cagnottes à soutenir

🎯 **Philosophie JOIE DE VIVRE** :
- Donner doit rester **spontané** et **volontaire**
- Chacun donne selon ses **moyens** et son **cœur**
- Un petit geste vaut autant qu''un grand !

➡️ Pas de pression, juste de la joie ! 🎉',
  ARRAY['score bas', 'faible réciprocité', 'pas grave'],
  8,
  true
),

(
  'friends',
  'Comment devenir Champion de la réciprocité ?',
  '👑 Le badge **Champion** est le niveau maximum (81-100 points) !

🏆 **Pour l''atteindre** :
- Contribuer **régulièrement** aux cagnottes
- Donner autant (ou plus) que ce que vous recevez
- Participer activement à la communauté
- Être présent pour vos amis dans leurs moments importants

✨ **Avantages du Champion** :
- Badge prestigieux sur votre profil (si activé)
- Reconnaissance de la communauté
- Fierté personnelle d''être généreux
- Modèle pour les autres membres

📊 **Statistiques visibles** :
- Nombre total de contributions
- Montant total donné
- Progression vers le niveau suivant

🎯 **Maintenir le statut** :
- Continuez à contribuer régulièrement
- Le score se met à jour automatiquement
- Pas de "perte" de badge si vous êtes moins actif temporairement

💝 **Philosophie** : Un Champion donne avec générosité, sans attendre en retour !

➡️ Vous êtes une légende de la générosité ! 🌟',
  ARRAY['champion', 'badge champion', 'niveau maximum', 'meilleur badge'],
  7,
  true
),

-- NOTIFICATIONS INTELLIGENTES (4 questions) - Catégorie: features
(
  'features',
  'C''est quoi les notifications intelligentes ?',
  '🧠 Les **notifications intelligentes** sont des alertes **personnalisées** et **contextuelles** !

🎯 **Intelligence** :
- Analyse votre **comportement** sur la plateforme
- Détecte les **moments importants** de vos amis
- Suggère des **actions pertinentes** au bon moment
- S''adapte à vos **préférences** et horaires

🔔 **Types de notifications** :
1. 🎂 **Anniversaires** : Rappels 7-10 jours avant
2. 💰 **Cagnottes** : Nouvelles collectes de vos amis
3. ❤️ **Contributions** : Quelqu''un a contribué à votre cagnotte
4. 🎁 **Suggestions** : Idées de cadeaux basées sur les préférences
5. 🏆 **Réciprocité** : Opportunités de rendre la pareille
6. 🎉 **Complétion** : Une cagnotte a atteint son objectif
7. ⚠️ **Urgences** : Cagnotte expire bientôt

⚡ **Timing parfait** : Ni trop, ni trop peu. Juste ce qu''il faut ! 🎯',
  ARRAY['notifications intelligentes', 'smart notifications', 'alertes personnalisées'],
  10,
  true
),

(
  'features',
  'Comment gérer mes préférences de notifications ?',
  '⚙️ Pour configurer vos **notifications** :

📍 **Accès** :
1. Cliquez sur votre **profil** (en haut à droite)
2. Allez dans **"Paramètres"**
3. Section **"Notifications"**

🎛️ **Options disponibles** :
- ✅/❌ Anniversaires d''amis
- ✅/❌ Nouvelles cagnottes
- ✅/❌ Contributions reçues
- ✅/❌ Commentaires sur mes cagnottes
- ✅/❌ Rappels de réciprocité
- ✅/❌ Cagnottes expirées bientôt
- ✅/❌ Notifications push (mobile)

⏰ **Fréquence** :
- Immédiate
- Résumé quotidien (1x/jour)
- Résumé hebdomadaire (1x/semaine)

🔕 **Mode silencieux** :
- Définissez vos heures de calme
- Ex: Pas de notifications entre 22h et 8h

💡 **Recommandation** : Gardez au moins les anniversaires et contributions ! 🎁',
  ARRAY['configurer notifications', 'paramètres notifications', 'désactiver alertes'],
  9,
  true
),

(
  'features',
  'Pourquoi je reçois des notifications d''anniversaire ?',
  '🎂 Les **rappels d''anniversaire** vous aident à ne jamais oublier un proche !

🎯 **Pourquoi c''est utile** :
- Vous êtes prévenu **7-10 jours à l''avance**
- Vous avez le temps de **créer une cagnotte** ou **commander un cadeau**
- Vous ne manquez plus les anniversaires importants
- Vos amis apprécient que vous pensiez à eux

📅 **Comment ça marche** :
1. Vous ajoutez des amis avec leur **date d''anniversaire**
2. L''IA analyse les dates et votre historique
3. Elle vous envoie un rappel **au moment optimal**
4. Le rappel inclut des **suggestions d''actions** :
   - Créer une cagnotte collaborative
   - Commander un cadeau
   - Envoyer un message

🎁 **Bonus** :
- Suggestions de cadeaux basées sur les préférences de l''ami
- Rappel si vous avez contribué l''année dernière
- Information sur les cagnottes existantes

➡️ Ne ratez plus jamais un anniversaire ! 🎉',
  ARRAY['rappel anniversaire', 'notification anniversaire', 'anniversaire ami'],
  9,
  true
),

(
  'features',
  'Comment recevoir des notifications sur mon téléphone ?',
  '📱 Pour activer les **notifications push** (mobiles) :

🔧 **Sur mobile** :
1. Ouvrez JOIE DE VIVRE dans votre navigateur
2. Une popup vous demande l''autorisation
3. Cliquez sur **"Autoriser"**
4. C''est fait ! 🎉

⚙️ **Si vous avez refusé** :
- **Android** : Paramètres > Applications > JOIE DE VIVRE > Notifications
- **iPhone** : Réglages > JOIE DE VIVRE > Notifications

✅ **Ce que vous recevrez** :
- 🎂 Anniversaires imminents
- 💰 Nouvelles contributions à vos cagnottes
- 🎁 Cagnottes complétées
- 🔔 Alertes importantes

🔕 **Contrôle** :
- Vous pouvez désactiver à tout moment
- Choisissez les types de notifications
- Définissez vos heures de silence

💡 **Astuce** : Les push sont idéales pour ne rien manquer, même quand vous n''êtes pas sur l''app ! 📲',
  ARRAY['notifications push', 'push mobile', 'notifications téléphone'],
  8,
  true
),

-- MUR DE GRATITUDE (3 questions) - Catégorie: gifts
(
  'gifts',
  'C''est quoi le mur de gratitude ?',
  '💝 Le **mur de gratitude** est un espace pour **remercier publiquement** les contributeurs !

✨ **Concept** :
- Un espace visible par toute la communauté
- Pour exprimer votre **reconnaissance** après avoir reçu
- Pour partager des **moments de bonheur**
- Pour inspirer la générosité des autres

📝 **Contenu des messages** :
- Remerciement personnalisé
- Mention du bénéficiaire
- Montant collecté (optionnel)
- Nom de la cagnotte/cadeau

❤️ **Interactions** :
- Les autres peuvent ajouter des **réactions** (cœurs)
- Les messages les plus aimés sont mis en avant
- Possibilité de commenter

🎯 **Objectif** :
- Célébrer la générosité
- Créer un sentiment de communauté
- Encourager l''entraide
- Partager la joie

➡️ Transformons la gratitude en mouvement collectif ! 🌟',
  ARRAY['mur gratitude', 'wall gratitude', 'remercier', 'remerciements'],
  10,
  true
),

(
  'gifts',
  'Comment ajouter un message de gratitude ?',
  '💌 Pour publier un **message de gratitude** :

📍 **Méthode 1 - Depuis le Dashboard** :
1. Cliquez sur **"Laisser un message"** 💝
2. Rédigez votre message de remerciement
3. Choisissez le **destinataire** (optionnel)
4. Décidez de la **visibilité** (public/privé)
5. Publiez !

📍 **Méthode 2 - Depuis une cagnotte** :
1. Ouvrez la cagnotte complétée
2. Cliquez sur **"Remercier les contributeurs"**
3. Un message pré-rempli apparaît (modifiable)
4. Validez pour publier

✍️ **Conseils pour un bon message** :
- Soyez **sincère** et **personnel**
- Mentionnez des **détails spécifiques**
- Exprimez l''**émotion** ressentie
- Remerciez **nominativement** si possible

🎨 **Mise en forme** :
- Utilisez des emojis 🎁💝🎉
- Restez authentique
- Pas de limite de caractères

💡 **Effet** : Vos contributeurs seront touchés et motivés à continuer ! ❤️',
  ARRAY['publier gratitude', 'ajouter message', 'remercier contributeurs'],
  9,
  true
),

(
  'gifts',
  'Qui peut voir mes messages de gratitude ?',
  '👀 La **visibilité** de vos messages dépend de vos choix :

🌍 **Public (par défaut)** :
- Visible sur le **mur de gratitude** communautaire
- Tous les utilisateurs JOIE DE VIVRE peuvent le voir
- Contribue à inspirer la générosité
- Peut recevoir des réactions (cœurs)

🔒 **Privé (optionnel)** :
- Visible uniquement par les **contributeurs** mentionnés
- Ne s''affiche pas sur le mur public
- Plus intime et personnel

🎛️ **Contrôle de la visibilité** :
1. Lors de la publication, cochez **"Message privé"**
2. Ou modifiez dans vos paramètres de confidentialité

📊 **Ce qui est toujours visible** :
- Le **nombre** de messages de gratitude reçus
- Votre participation à la communauté (si public)

🗑️ **Suppression** :
- Vous pouvez supprimer vos messages à tout moment
- Allez sur le message > Menu (⋮) > Supprimer

💡 **Recommandation** : Les messages publics créent une belle dynamique communautaire ! 💝',
  ARRAY['visibilité gratitude', 'public privé', 'confidentialité mur'],
  8,
  true
);