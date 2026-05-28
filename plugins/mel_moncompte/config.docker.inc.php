<?php

// Web Service pour la modification du mot de passe de l'utilisateur (Mon compte / Modification de mot de passe)
$rcmail_config['ws_changepass'] = $_ENV['RC_MEL_MONCOMPTE_WS_CHANGEPASS'];

// Web Service z-push pour accéder aux statistiques Mobile (Mes statistiques / Mobiles)
$rcmail_config['ws_zp'] = $_ENV['RC_MEL_MONCOMPTE_WS_ZP'];

// Configuration de l'administrateur LDAP pour l'édition de listes (Mon compte / Gestion des listes)
$rcmail_config['liste_admin'] = $_ENV['RC_MEL_MONCOMPTE_LISTE_ADMIN'];
// Configuration du mot de passe de l'administrateur LDAP pour l'édition de listes
$rcmail_config['liste_pwd'] = $_ENV['RC_MEL_MONCOMPTE_LISTE_PWD'];

// Proposer le périmètre des absences hebdo aux utilisateurs
$rcmail_config['moncompte_absence_hebdo_perimetre'] = $_ENV['RC_MEL_MONCOMPTE_ABSENCE_HEBDO_PERIMETRE'] ?? false;

// Activer le menu Mon compte
$rcmail_config['enable_moncompte'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MONCOMPTE'] ?? true;
// Activer le menu Mon compte / Gestion des CGUs
$rcmail_config['enable_moncompte_cgu'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MONCOMPTE_CGU'] ?? true;
// Activer le menu Mon compte / Gestionnaire d'absence
$rcmail_config['enable_moncompte_abs'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MONCOMPTE_ABS'] ?? true;
// Activer le menu Mon compte / Gestion des listes
$rcmail_config['enable_moncompte_lists'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MONCOMPTE_LISTS'] ?? true;
// Activer le menu Mon compte / Informations personnelles
$rcmail_config['enable_moncompte_infos'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MONCOMPTE_INFOS'] ?? true;
// Activer le menu Mon compte / Modification du mot de passe
$rcmail_config['enable_moncompte_mdp'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MONCOMPTE_MDP'] ?? true;
// Activer le menu Mon compte / Afficher la photo
$rcmail_config['enable_moncompte_photo'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MONCOMPTE_PHOTO'] ?? true;

// Activer le menu Mes ressources
$rcmail_config['enable_mesressources'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MESRESSOURCES'] ?? true;
// Activer le menu Mes ressources / Boites aux lettres
$rcmail_config['enable_mesressources_mail'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MESRESSOURCES_MAIL'] ?? true;
// Activer la restaurationdes mails
$rcmail_config['enable_mesressources_mail_restore'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MESRESSOURCES_MAIL_RESTORE'] ?? true;
// Activer la restauration des dossiers
$rcmail_config['enable_mesressources_dir_restore'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MESRESSOURCES_DIR_RESTORE'] ?? true;
// Activer le menu Mes ressources / Agendas
$rcmail_config['enable_mesressources_cal'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MESRESSOURCES_CAL'] ?? true;
// Activer la restauration des agendas
$rcmail_config['enable_mesressources_cal_restore'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MESRESSOURCES_CAL_RESTORE'] ?? true;
// Activer le menu Mes ressources / Contacts
$rcmail_config['enable_mesressources_addr'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MESRESSOURCES_ADDR'] ?? true;
// Activer la restaurationdes contacts
$rcmail_config['enable_mesressources_addr_restore'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MESRESSOURCES_ADDR_RESTORE'] ?? true;
// Activer le menu Mes ressources / Tâches
$rcmail_config['enable_mesressources_task'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MESRESSOURCES_TASK'] ?? true;

// Activer le menu Mes statistiques
$rcmail_config['enable_messtatistiques'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MESSTATISTIQUES'] ?? true;
// Activer le menu Mes statistiques / Mobiles
$rcmail_config['enable_messtatistiques_mobile'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MESSTATISTIQUES_MOBILE'] ?? true;
//Changement mdp MIOM. Se base sur la conf du plugin mi_auth pour accès API et portail utilisateur
$rcmail_config['enable_moncompte_mdp_miom'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MONCOMPTE_MDP_MIOM'] ?? false;
$rcmail_config['pwd_user_canchange_endpoint'] = $_ENV['RC_MEL_MONCOMPTE_PWD_USER_CANCHANGE_ENDPOINT'] ?? "pwd/user/canChange";
$rcmail_config['token_revoke_endpoint'] = $_ENV['RC_MEL_MONCOMPTE_TOKEN_REVOKE_ENDPOINT'] ?? "token/revoke";
$rcmail_config['portail_uri_changepwd'] = $_ENV['RC_MEL_MONCOMPTE_PORTAIL_URI_CHANGEPWD'] ?? "#in/changePwd";
$rcmail_config['mel_moncompte_pages'] = $_ENV['RC_MEL_MONCOMPTE_PAGES'] ?? ['informationspersonnelles','changepassword','gestionnaireabsence','accesinternet','synchronisationmobile','gestionnairelistes'];

// Affiche ou non la possibilité de partager sa boite interpersonnelle
$rcmail_config['enable_mesressources_bal_share'] = $_ENV['RC_MEL_MONCOMPTE_ENABLE_MESRESSOURCES_BAL_SHARE'] ?? !(isset($_SERVER['MEL_MONCOMPTE_RESOURCE_BAL_SHARE_ENABLED']) && $_SERVER['MEL_MONCOMPTE_RESOURCE_BAL_SHARE_ENABLED'] == '0');
