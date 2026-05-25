<?php

// Configuration du passage en lu lors de la fermeture du centre de notification
$rcmail_config['notifications_set_read_on_panel_close'] = $_ENV['RC_MEL_NOTIFICATION_NOTIFICATIONS_SET_READ_ON_PANEL_CLOSE'] ?? true;

// Configuration du passage en lu lors du clic sur une notif
$rcmail_config['notifications_set_read_on_click'] = $_ENV['RC_MEL_NOTIFICATION_NOTIFICATIONS_SET_READ_ON_CLICK'] ?? true;

// Configuration de la durée de rafraichissement des notifications par utilisateur (en seconde)
$rcmail_config['notifications_refresh_interval'] = $_ENV['RC_MEL_NOTIFICATION_NOTIFICATIONS_REFRESH_INTERVAL'] ?? 60;

// Durée d'affichage une notification quand est envoyée au Bnum (en seconde)
$rcmail_config['notifications_show_duration'] = $_ENV['RC_MEL_NOTIFICATION_NOTIFICATIONS_SHOW_DURATION'] ?? 10;

// Durée d'affichage une notification quand est envoyée sur le Bureau (en seconde)
$rcmail_config['notifications_desktop_duration'] = $_ENV['RC_MEL_NOTIFICATION_NOTIFICATIONS_DESKTOP_DURATION'] ?? 5;

// Liste des catégories utilisables pour les notifications (et libellés associés)
$rcmail_config['notifications_categories'] = $_ENV['RC_MEL_NOTIFICATION_NOTIFICATIONS_CATEGORIES'];

// Liste des icons utilisables pour les notifications
$rcmail_config['notifications_icons'] = $_ENV['RC_MEL_NOTIFICATION_NOTIFICATIONS_ICONS'];

// Paramètres des notifications
$rcmail_config['notifications_settings'] = $_ENV['RC_MEL_NOTIFICATION_NOTIFICATIONS_SETTINGS'];
