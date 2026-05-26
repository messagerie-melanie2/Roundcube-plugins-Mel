<?php

// Nombre de jour maximum accepté pour une remise différée
$rcmail_config['remise_max_days'] = $_ENV['RC_MEL_ENVOI_DIFFERE_REMISE_MAX_DAYS'] ?? 30;

// Activer le droit à la déconnexion ?
$rcmail_config['remise_enable_deconnection_right'] = $_ENV['RC_MEL_ENVOI_DIFFERE_REMISE_ENABLE_DECONNECTION_RIGHT'] ?? false;

// Allowed DN in LDAP
$rcmail_config['deconnection_right_ldap_enabled_dn'] = $_ENV['RC_MEL_ENVOI_DIFFERE_DECONNECTION_RIGHT_LDAP_ENABLED_DN'];

// Forbidden DN in LDAP
$rcmail_config['deconnection_right_ldap_disabled_dn'] = $_ENV['RC_MEL_ENVOI_DIFFERE_DECONNECTION_RIGHT_LDAP_DISABLED_DN'];

// Liste des jours ouvrés au format PHP (https://www.php.net/manual/fr/datetime.format.php) : Mon Tue Wed Thu Fri Sat Sun
$rcmail_config['remise_open_days'] = $_ENV['RC_MEL_ENVOI_DIFFERE_REMISE_OPEN_DAYS'] ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Plage horaire heures ouvrés au format H:i-H:i
$rcmail_config['remise_open_hours'] = $_ENV['RC_MEL_ENVOI_DIFFERE_REMISE_OPEN_HOURS'] ?? '08:00-19:00';
