# Memory: infrastructure/public-media-storage
Updated: 2026-03-27

Le bucket public 'assets' héberge tous les médias statiques : images (ex: 'birthday-friend-alert.jpg') et vidéos d'anniversaire (ex: 'default-celebration.mp4'). L'accès en lecture est public pour permettre la récupération par les serveurs de Meta et l'affichage dans l'app.

L'Edge Function 'birthday-wishes' implémente une résolution dynamique pour les vidéos : elle tente de charger une vidéo personnalisée nommée '{user_id}.mp4' dans le bucket 'assets' et utilise 'default-celebration.mp4' comme fallback. Le `BirthdayCelebrationModal` charge également la vidéo depuis le bucket 'assets'.

Les médias doivent respecter les contraintes de Meta (format MP4, max 16 Mo). Le bucket 'birthday-videos' n'est plus utilisé — tout est centralisé dans 'assets'.
