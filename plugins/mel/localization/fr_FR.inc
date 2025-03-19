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

$labels['mel'] = 'Mél';

$labels['types'] = 'Types';
$labels['elements'] = 'Liste des ressources';

$labels['logout'] = 'Se déconnecter';
$labels['tchap'] = 'Tchap';


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
$labels['calendar'] = 'Mon agenda';
$labels['discussion'] = 'Discussions';
$labels['chat'] = $labels['discussion'];
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
$labels['login_productioninformation'] = "Plateforme de communication réservée aux agents des ministères";
$labels['login_footerbox'] = isset($_SERVER["HTTP_X_MINEQPROVENANCE"]) ? "Connexion depuis : " : " ";
$labels['login_footerbox_info'] = isset($_SERVER["HTTP_X_MINEQPROVENANCE"]) ? ucfirst($_SERVER["HTTP_X_MINEQPROVENANCE"]) : " ";
$labels['login_warning'] = "Respectez les principes de l'étiquette en vigueur sur l'internet, à savoir un ensemble de règles de savoir-vivre concernant l'emploi de l'internet";
$labels['login_footer1'] = " © Ministère de la Transition écologique, 
© Ministère de la Cohésion des territoires et des Relations avec les collectivités territoriales, 
© Ministère de la mer, 
© Ministère de l'Agriculture et de l'Alimentation";
$labels['login_footer2'] = "SNUM - Service du numérique";

$labels['agenda_filter'] = 'Filtrer les agendas';

$labels['You are disconnect from Roundcube'] = "Vous n'êtes plus connecté à l'application";
$labels['You can close and reopen the tab'] = "Vous pouvez fermer et ré-ouvrir l'onglet";
$labels['Or you can clic here to relogin'] = "Ou vous pouvez cliquer ici pour vous reconnecter";

$labels['no bal'] = "Pas de BALI ? Cliquez-ici pour changer votre mot de passe";
$labels['password forgotten'] = "Mot de passe oublié ?";

$labels['portail_title'] = 'Ouvrez votre bureau numérique';
$labels['help_title'] = 'Ouvrez la page d\'assistance dédiée à Mél';

$labels['mel_mailboxes_display'] = 'Mode d\'affichage des dossiers';
$labels['default_pref_text'] = "Par défaut";
$labels['subfolders_pref_text'] = "Regrouper les dossiers";
$labels['unified_pref_text'] = "Dossiers unifiés";
$labels['subfolders'] = 'Dossiers';
$labels['welcome'] = 'Bienvenue';
$labels['on_your_dwp'] = 'sur votre bureau numérique';
$labels['baseline'] = 'Les outils que vous connaissez, accessibles sur une seule page web, pour tout retrouver simplement.';

$labels['inbox'] = 'Courrier entrant';
$labels['drafts'] = 'Brouillons';
$labels['models'] = 'Modèles';
$labels['trash'] = 'Corbeille';
$labels['junk'] = 'Indésirables';
$labels['sent'] = 'Éléments envoyés';

$labels['mailboxselector'] = 'Liste des boites';

$labels['bureau'] = 'Accueil';

$labels['label-all'] =         'Tout'                 ;
$labels['label-read'] =        'Lus'                  ;
$labels['label-unread'] =      'Non lus'              ;
$labels['label-followed'] =    'Suivis'               ;
$labels['label-attachment'] =  'Avec une pièce jointe';
$labels['label-labels'] =      'Étiquettes'           ;
$labels['label-priority'] =    'Priorités'            ;
$labels['label-noresponses'] = 'Sans réponses'        ;

$labels['filter-data-action-all'] = 'ALL';
$labels['filter-data-action-unread'] = 'UNSEEN';
$labels['filter-data-action-followed'] = 'FLAGGED';
$labels['filter-data-action-attachment'] = 'OR OR OR HEADER Content-Type application/ HEADER Content-Type multipart/m HEADER Content-Type multipart/signed HEADER Content-Type multipart/report';
$labels['filter-data-action-noresponses'] = 'UNANSWERED';

$labels['from_to'] = 'Du %0 au %1';