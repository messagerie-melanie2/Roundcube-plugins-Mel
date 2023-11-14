<?php

/*
 +-----------------------------------------------------------------------+
 | plugins/moncompte/localization/<lang>.inc                           |
 |                                                                       |
 | Localization file of the Roundcube Webmail Managesieve plugin         |
 | Copyright (C) 2012-2013, The Roundcube Dev Team                       |
 |                                                                       |
 | Licensed under the GNU General Public License version 3 or            |
 | any later version with exceptions for skins & plugins.                |
 | See the README file for a full license statement.                     |
 |                                                                       |
 +-----------------------------------------------------------------------+

 For translation see https://www.transifex.com/projects/p/roundcube-webmail/resource/plugin-managesieve/
*/

$labels = array();

$labels['control'] = "Affichage des messages";

$labels['discussion'] = "Discussion";

$labels['search_in'] = 'Rechercher dans';
$labels['search_in_all_folders'] = 'Rechercher dans tous les dossiers';
$labels['search_in_all_contacts'] = 'Rechercher dans tous les contacts';
$labels['search_in_calendars'] = 'Rechercher dans les agendas';
$labels['search_in_tasks'] = 'Rechercher dans les tâches';

$labels['showcontactstitle'] = 'Ouvrir la fenêtre pour chercher un contact';

$labels['allcontacts'] = 'Tous les contacts';
$labels['allannuaires'] = 'Tous les annuaires';
$labels['personalannuaire'] = 'Annuaire personnel et ministériel';
$labels['personalsearchs'] = 'Vos recherches enregistrées';

$labels['foundin'] = 'Trouvé dans';

$labels['personalcalendar'] = 'Agenda personnel';
$labels['personaladdressbook'] = 'Carnet personnel';
$labels['personaltasks'] = 'Tâches personnelles';

$labels['logo_title'] = 'Retournez sur la page d\'accueil du portail web';
$labels['min_toggle_title'] = 'Changer le mode d\'affichage du portail web (compact ou normal)';
$labels['mail_title'] = 'Ouvrez vos courriels personnels et vos boites partagées';
$labels['agenda_title'] = 'Ouvrez vos agendas personnels et partagés';
$labels['contact_title'] = 'Ouvrez vos contacts personnels et partagés';
$labels['discussion_title'] = 'Ouvrez vos discussions intantanées';
$labels['tasklist_title'] = 'Ouvrez vos tâches personnelles et partagées';
$labels['settings_title'] = 'Ouvrez les paramètres du portail web';

$labels['help'] = 'Aide';
$labels['settings_themes'] = 'Choix du thème pour l\'interface';
$labels['themes_title_auto'] = 'Automatique';
$labels['themes_description_auto'] = 'La couleur du thème s\'adapte automatiquement à la configuration de votre système (fonctionnement par défaut).';
$labels['themes_title_light'] = 'Clair';
$labels['themes_description_light'] = 'Un thème clair basé sur les couleurs blanc et gris clair.';
$labels['themes_title_dark'] = 'Sombre';
$labels['themes_description_dark'] = 'Un thème sombre basé sur des nuances de gris foncé.';
$labels['themes_title_sunset'] = 'Sunset by JP';
$labels['themes_description_sunset'] = 'Un thème sombre basé sur des nuances de gris.';

//Récupération du plugon mel. Modifications pour MI

$labels['mel'] = 'MCE';

$labels['types'] = 'Types';
$labels['elements'] = 'Liste des ressources';

$labels['logout'] = 'Se déconnecter';


// Resources
$labels['resources'] = 'Mes ressources';
$labels['manageresources'] = 'Gérez vos ressources Mél';

$labels['menumanageresources'] = 'Gérer les ressources';
$labels['menumanageresources_calendars'] = 'Gérer les agendas';
$labels['menumanageresources_mailboxes'] = 'Gérer les boites aux lettres';
$labels['menumanageresources_taskslists'] = 'Gérer les listes de tâches';

$labels['menumanage_create_mailbox_folder'] = 'Créer un nouveau dossier';

$labels['resourcesettings'] = 'Configurez la ressource';

$labels['resourcesbal'] = 'Boites aux lettres';
$labels['manageresourcesbal'] = 'Gérez vos boites aux lettres Mél (affichage, partages, restaurations)';
$labels['resourcesagendas'] = 'Agendas';
$labels['manageresourcesagendas'] = 'Gérez vos agendas Mél (affichage, synchronisation, partages, restaurations)';
$labels['resourcescontacts'] = 'Contacts';
$labels['manageresourcescontacts'] = 'Gérez vos carnets d\'adresses Mél (affichage, synchronisation, partages, restaurations)';
$labels['resourcestaches'] = 'Tâches';
$labels['manageresourcestaches'] = 'Gérez vos listes de tâches Mél (affichage, synchronisation, partages, restaurations)';

$labels['options'] = 'Options';

$labels['contacts_search_only'] = 'Utilisez le champ de recherche pour trouver les contacts de cet annuaire';
$labels['contacts_search_only_all'] = 'Utilisez le champ de recherche pour trouver les contacts de tous vos carnets et annuaires';

// Mon compte
$labels['moncompte'] = 'Mon Compte';
$labels['managemoncompte'] = 'Gérer votre compte Mél';

// Mes statistiques
$labels['statistics'] = 'Mes statistiques';
$labels['managestatistics'] = 'Affichez vos statistiques Mél';
$labels['statisticsmobile'] = 'Mobiles';
$labels['managestatisticsmobile'] = 'Affichez les statistiques des synchronisations mobiles Mél';

$labels['mymailbox'] = 'Ma boite';
$labels['mailboxchangetext'] = 'Cliquez ici pour sélectionner la boite aux lettres à afficher';
$labels['boitespart'] = 'Boites partagées';
$labels['gestionabs'] = 'Gestionnaire d\'absence';
$labels['gestionlists'] = 'Gestionnaire de listes';
$labels['modifmdp'] = 'Modification de mot de passe';
$labels['accesinternet'] = 'Accés Internet et Synchronisations';
$labels['infoperso'] = 'Informations personnelles';

$labels['userlbl'] = 'Compte utilisateur';
$labels['oldpasswordlbl'] = 'Ancien mot de passe';
$labels['newpasswordlbl'] = 'Nouveau mot de passe';
$labels['newpasswordconfirmlbl'] = 'Confirmer nouveau mot de passe';

$labels['changepassword_confirm'] = 'Votre mot de passe a bien été changé';

$labels['users_shares'] = 'Partager à un utilisateur';
$labels['groups_shares'] = 'Partager à un groupe';

$labels['mel_use_subscribed_folders'] = 'Utiliser les abonnements pour les dossiers';
$labels['mel_use_infinite_scroll'] = 'Utiliser le scroll infini pour parcourir les messages';
$labels['mel_default_task'] = 'Page d\'accueil après la connexion';

$labels['portail'] = 'Bureau numérique';
$labels['calendar'] = 'Agenda';
$labels['discussion'] = 'Discussion';
$labels['sondage'] = 'Sondage';
$labels['stockage'] = 'Stockage';
$labels['documents'] = 'Documents';
$labels['tasks'] = 'Tâches';
$labels['help'] = 'Besoin d\'aide ?';

$labels['realname'] = 'Nom utilisé';
$labels['uid'] = 'Identifiant';
$labels['name identity'] = 'Nom affiché dans le webmail';

$labels['error_block'] = 'Echec de connexion, votre compte est bloqué';

$labels['computer_private'] = 'Enregistrer mes informations d\'identification sur cet ordinateur';
$labels['device_private'] = 'Enregistrer mes informations d\'identification sur cet ordinateur';
$labels['computer_private_title'] = 'Le nom d\'utilisateur ainsi que les codes de double authentification ne vous seront plus demandés lors de vos prochaines connexions depuis cet ordinateur, \nNe cochez pas cette case s\'il s\'agit d\'un ordinateur public.';
$labels['change_user'] = 'Changer d\'utilisateur';

$labels['login from'] = "Connexion depuis : ";

include dirname(__FILE__, 2) . '/ministere.php';
$cl = new ministere();
$infoFile = $cl->getInfo();
$info = json_decode(file_get_contents($infoFile));

$labels['login_productioninformation'] = "Messagerie Collaborative de l'Etat - ". $info->libelle;
$labels['login_footerbox'] = isset($_SERVER["HTTP_X_MINEQPROVENANCE"]) ? "Connexion depuis : " : " ";
$labels['login_footerbox_info'] = isset($_SERVER["HTTP_X_MINEQPROVENANCE"]) ? ucfirst($_SERVER["HTTP_X_MINEQPROVENANCE"]) : " ";
$labels['login_warning'] = " ";
$labels['login_footer1'] = " © " . $info->libelle;
$labels['login_footer2'] = $info->shortDir . " - " . $info->direction;

$labels['agenda_filter'] = 'Filtrer les agendas';

$labels['You are disconnect from Roundcube'] = "Vous n'êtes plus connecté à l'application";
$labels['You can close and reopen the tab'] = "Vous pouvez fermer et ré-ouvrir l'onglet";
$labels['Or you can clic here to relogin'] = "Ou vous pouvez cliquer ici pour vous reconnecter";

$labels['no bal'] = "";

$labels['portail_title'] = 'Ouvrez votre bureau numérique';
$labels['help_title'] = 'Ouvrez la page d\'assistance dédiée à Mél';

$labels['mel_mailboxes_display'] = 'Mode d\'affichage des dossiers';
$labels['default_pref_text'] = "Par défaut";
$labels['subfolders_pref_text'] = "Regrouper les dossiers";
$labels['unified_pref_text'] = "Dossiers unifiés";
$labels['subfolders'] = 'Dossiers';
$labels['add...'] = 'Ajouter ...';

$labels['composeoption_notification'] = 'Notifications :';
$labels['dsn'] = 'Etat de distribution';

$labels['acl_identifier'] = 'Compte';
$labels['acl_identinputlabel'] = 'Pour';
$labels['arialabelaclform'] = 'Formuaire de gestion du partage';
$labels['arialabelaclactions'] = 'Actions sur le compte séléctionné';
$labels['acl_identinputlegend'] = 'Saisir le champ ci-dessous';
$labels['ariasummaryacltable'] = 'Tableau des droits';