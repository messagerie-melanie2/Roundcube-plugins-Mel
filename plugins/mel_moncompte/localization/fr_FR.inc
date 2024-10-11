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

$labels['types'] = 'Types';
$labels['elements'] = 'Liste des ressources';
$labels['elements calendars'] = 'Liste des agendas';
$labels['elements addressbooks'] = 'Liste des carnets d\'adresses';
$labels['elements taskslists'] = 'Liste des listes de tâches';

// Resources
$labels['resources'] = 'Mes ressources';
$labels['manageresources'] = 'Gérez vos ressources Mél';

$labels['menumanageresources'] = 'Gérer les ressources';
$labels['menumanageresources calendars'] = 'Gérer les agendas';
$labels['menumanageresources addressbooks'] = 'Gérer les carnets d\'adresses';
$labels['menumanageresources taskslists'] = 'Gérer les listes de tâches';

$labels['resourcesettings'] = 'Configurez la ressource';

$labels['resourcesbal'] = 'Boites aux lettres';
$labels['manageresourcesbal'] = 'Gérez vos boites aux lettres Mél (affichage, partages, restaurations)';
$labels['restore_bal'] = "Récupération des courriels";
$labels['restore_dir'] = "Récupération de dossier";
$labels['imap_select'] = "Récupérer les courriels effacés depuis %%DATE%% (maximum 7 jours) du dossier ";
$labels['restore_bal_expl'] = "Mél vous offre la possibilité de <b>récupérer un ou plusieurs messages supprimés ou perdus</b> à la suite d'un incident survenu au cours des 7 derniers jours.
<br>
<br><b>La procédure</b> est la suivante :
<br>
<br>- <b>Sélectionner une boite</b> dont vous êtes gestionnaire <b>dans la liste déroulante</b>
<br>- <b>Indiquez depuis combien d'heures</b> les messages ont été supprimés
<br>- <b>Indiquez le dossier</b> contenant initialement les messages <b>dans la liste déroulante</b>
<br>
<br><b>ATTENTION :</b>
<br>- <b>la récupération comprendra tous les messages supprimés ET déplacés du dossier initial (messages filtrés compris)</b>, ce qui peut représenter un volume de messages assez important suivant le nombre d'heures renseigné.
<br>- <b>chaque message récupéré apparaitra</b> dans l'état dans lequel il se trouvait avant sa suppression ou son déplacement <b>(étiqueté - répondu - transféré - commenté ou redirigé)</b>
<br>- un message commenté sera récupéré en double : message original + message étiqueté \"commentaire\"
<br>- <b>les messages</b> récupérés <b>dans une BalI ont un statut \"lus\"</b>
<br>
<br><b>Cas des boites partagées :</b>
<br>
<br>- <b>les messages</b> récupérés <b>dans les boites partagées ont un statut \"non lus\".</b>
<br>- lorsque la récupération des messages est terminée, cliquer sur n'importe quel module du menu de gauche pour revenir dans l'environnement de la boite individuelle.";
$labels['INBOX'] = "Courrier entrant";
$labels['restore_bal_succes'] = 'Votre demande de récupération a bien été prise en compte et sera exécutée dans les plus brefs délais.';
$labels['restore_bal_error'] = 'Echec de votre demande de récupération.';
$labels['restore_dir_succes'] = 'La restauration de dossier a bien été effectuée.';
$labels['restore_dir_error_storage'] = 'Espace nécessaire insuffisant.';
$labels['resourcesagendas'] = 'Agendas';
$labels['manageresourcesagendas'] = 'Gérez vos agendas Mél (affichage, synchronisation, partages, restaurations)';
$labels['restore_cal'] = 'Restauration de l\'agenda';
$labels['restore_cal_expl'] = "Cette fonctionnalité permet de récupérer les données d'agendas à j-1 et j-2 (Hier et Avant hier) sous forme de fichier au format ics, il suffit ensuite d'importer ce fichier avec l'outil 'Importer/Exporter' du module 'Agenda'";
$labels['radio_cal_all_label'] = 'Tous les événements';
$labels['radio_cal_some_label'] = 'Début le ';
$labels['radio_cal_time_label'] = 'A';
$labels['radio_cal_end_label'] = 'Fin le ';
$labels['cal_periode_label'] = 'Période à récupérer';
$labels['cal_bdd_label'] = 'Date de la sauvegarde';
$labels['cal_j-1'] = 'Hier';
$labels['cal_j-2'] = 'Avant hier';
$labels['resourcescontacts'] = 'Contacts';
$labels['manageresourcescontacts'] = 'Gérez vos carnets d\'adresses Mél (affichage, synchronisation, partages, restaurations)';
$labels['resourcestaches'] = 'Tâches';
$labels['manageresourcestaches'] = 'Gérez vos listes de tâches Mél (affichage, synchronisation, partages, restaurations)';
$labels['restore_contacts'] = 'Restauration du carnet d\'adresses';
$labels['restore_contacts_expl'] = "Cette fonctionnalité permet de récupérer les données de contacts à j-1 et j-2 (Hier et Avant hier) sous forme de fichier au format vcf, il suffit ensuite d'importer ce fichier avec l'outil 'Importer/Exporter' du module 'Carnet d'adresses";

$labels['wait'] = 'Chargement en cours...';
$labels['modify_error'] = 'Erreur lors de la modification';
$labels['hide_resource_confirm'] = 'Ressource masquée dans le webmail';
$labels['show_resource_confirm'] = 'Ressource affichée dans le webmail';
$labels['sort_resource_confirm'] = 'La ressource a bien été triée';
$labels['invitation_confirm'] = 'Ce calendrier sera utilisé dans la gestion des invitations';
$labels['no_invitation_confirm'] = 'Ce calendrier ne sera plus utilisé dans la gestion des invitations';

$labels['synchro_mobile_confirm'] = 'Ressource ajoutée pour la synchronisation mobile';
$labels['no_synchro_mobile_confirm'] = 'Ressource supprimée de la synchronisation mobile';
$labels['set_default_confirm'] = 'Ressource définie par défaut';

$labels['information'] = 'Informations';
$labels['owner'] = 'Propriétaire';
$labels['acls'] = 'Droits';
$labels['none'] = 'Aucun';
$labels['show'] = 'Afficher';
$labels['read_only'] = 'Lecture seule';
$labels['read_write'] = 'Lecture/Écriture';
$labels['write'] = 'Écriture';
$labels['send'] = 'Émission';
$labels['gestionnaire'] = 'Gestionnaire';

$labels['configuration'] = 'Configuration';
$labels['use_as_default'] = 'Utiliser par défaut';
$labels['synchronise_on_mobile'] = 'Synchroniser sur votre mobile';
$labels['show_in_roundcube'] = 'Afficher dans le webmail roundcube';
$labels['invitation'] = 'Utiliser ce calendrier dans les invitations';

$labels['options'] = 'Options';

$labels['add_resource'] = 'Créer une nouvelle ressource';
$labels['delete_resource'] = 'Supprimer la ressource sélectionnée';
$labels['add_resource_prompt_agendas'] = 'Saisissez le nom du nouveau calendrier';
$labels['add_resource_prompt_contacts'] = 'Saisissez le nom du nouveau carnet d\'adresses';
$labels['add_resource_prompt_tasks'] = 'Saisissez le nom de la nouvelle liste de tâche';
$labels['delete_resource_confirm_agendas'] = 'Êtes-vous sûr de vouloir supprimer le calendrier sélectionné ?';
$labels['delete_resource_confirm_contacts'] = 'Êtes-vous sûr de vouloir supprimer le carnet d\'adresses sélectionné ?';
$labels['delete_resource_confirm_tasks'] = 'Êtes-vous sûr de vouloir supprimer la liste de tâches sélectionnée ?';
$labels['delete_resource_ok_agendas'] = 'Le calendrier vient d\'être supprimé';
$labels['delete_resource_ok_contacts'] = 'Le carnet d\'adresses vient d\'être supprimé';
$labels['delete_resource_ok_tasks'] = 'La liste de tâches vient d\'être supprimée';
$labels['delete_resource_nok_agendas'] = 'Une erreur s\'est produite, le calendrier n\'a pas pu être supprimé';
$labels['delete_resource_nok_contacts'] = 'Une erreur s\'est produite, le carnet d\'adresses n\'a pas pu être supprimé';
$labels['delete_resource_nok_tasks'] = 'Une erreur s\'est produite, la liste de tâches n\'a pas pu être supprimée';

$labels['add_resource_ok_agendas'] = 'Le calendrier vient d\'être créé';
$labels['add_resource_ok_contacts'] = 'Le carnet d\'adresses vient d\'être créé';
$labels['add_resource_ok_tasks'] = 'La liste de tâches vient d\'être créée';
$labels['add_resource_nok_agendas'] = 'Une erreur s\'est produite, le calendrier n\'a pas pu être créé';
$labels['add_resource_nok_contacts'] = 'Une erreur s\'est produite, le carnet d\'adresses n\'a pas pu être créé';
$labels['add_resource_nok_tasks'] = 'Une erreur s\'est produite, la liste de tâches n\'a pas pu être créée';
$labels['restore_mail'] = 'Récupérer';
$labels['restore_dir_btn'] = 'Récupérer';

// Mon compte
$labels['moncompte'] = 'Mon Compte';
$labels['managemoncompte'] = 'Gérer votre compte Mél';
$labels['button_restore'] = 'Restaurer';
$labels['clic_here'] = 'Cliquer ici';

// Mes statistiques
$labels['statistics'] = 'Mes statistiques';
$labels['managestatistics'] = 'Affichez vos statistiques Mél';
$labels['statisticsmobile'] = 'Mobiles';
$labels['managestatisticsmobile'] = 'Affichez les statistiques des synchronisations mobiles Mél';

$labels['mymailbox'] = 'Ma boite';
$labels['mailboxchangetext'] = 'Cliquez ici pour sélectionner la boite mail à afficher';
$labels['boitespart'] = 'Boites partagées';

// Mot de passe
$labels['changepassword'] = 'Mot de passe';

$labels['userlbl'] = 'Compte utilisateur';
$labels['oldpasswordlbl'] = 'Mot de passe actuel';
$labels['newpasswordlbl'] = 'Nouveau mot de passe';
$labels['newpasswordconfirmlbl'] = 'Nouveau mot de passe (confirmation)';

$labels['changepassword_confirm'] = 'Votre mot de passe a bien été changé, vous devez redémarrer votre session Windows pour continuer à accéder aux fichiers réseau et aux applications Cerbérisées';
$labels['changepassword_convention_error'] = 'Le nouveau mot de passe ne respecte pas la convention. ';
$labels['changepassword_modification_error'] = 'Echec de la modification du mot de passe. ';
$labels['changepassword_appel_error'] = 'Echec de la modification du mot de passe. ';
$labels['error_password_confirm'] = 'Mots de passe différents';
$labels['changepassword_infos'] = "Vous pouvez modifier ici votre mot de passe d'accès à Mél et aux applications Cerbère. Une fois ce changement effectué, pensez à mettre à jour le nouveau mot de passe sur vos appareils mobiles synchronisés avec Mél ainsi que dans les différents outils de synchronisation (MDrive, Ariane, ...).";
$labels['changepassword_infos_bureautique'] = "Vous pouvez modifier ici votre mot de passe d'accès à Mél, aux applications Cerbère et à votre poste de travail. Une fois ce changement effectué, fermez votre session Windows et reconnectez-vous avec votre nouveau mot de passe pour retrouver votre accès aux partages réseaux. Pensez également à mettre à jour le nouveau mot de passe sur vos appareils mobiles synchronisés avec Mél ainsi que dans les différents outils de synchronisation (MDrive, Ariane, ...).";
$labels['changepassword_explic'] = "<p>Le nouveau mot de passe doit être différent des anciens mots de passe (d'au moins 3 caractères pour le dernier) et ne pas contenir nom et prénom de l'utilisateur.
<br>- Il doit avoir une longueur d'au moins 10 caractères, avec au moins un caractère de chaque type : majuscule, minuscule, chiffre, caractère spécial (!\"#$%&'()*+,-./:<=>?@[^]_{|}~). Les accents (â à â é è ê …) ne sont pas autorisés.
<br>- Si vous synchronisez un téléphone avec Mél, pensez à mettre à jour le nouveau mot de passe sur les comptes du téléphone.
</p>
<p><b>ATTENTION - pour les agents des services MTECT/MTE (sauf DREAL Grand-Est, CGDD Orléans et DRIEE) et des DDT :</b>
<br>- Si vous êtes au bureau ou connecté en VPN, vous devez ensuite synchroniser votre mot de passe de session Windows, pour cela verrouillez (touches Windows +L) puis déverrouillez votre session Windows en saisissant votre nouveau mot de passe.
<br>- Si vous n'êtes pas au bureau et n'utilisez pas le VPN, votre mot de passe ne sera changé sur votre poste Windows qu'au retour lors de votre première connexion au réseau. Ainsi jusqu'à votre retour votre ancien mot de passe sera celui de votre session Windows, il ne faudra pas oublier de saisir ce nouveau mot de passe de session lors de votre retour sur votre poste de travail au bureau.
</p>
<p><b>En cas de difficultés, et en attendant l'intervention de votre assistance de proximité, essayez d'ouvrir votre session Windows avec l'ancien mot de passe.</b></p>";

//$labels['changepassword_explic_agri'] = 'Pour les agents dépendant du Ministère de l\'Agriculture et de l\'Alimentation, le changement de mot de passe se fait à partir de l\'annuaire Agricoll au lien suivant : ';
$labels['changepassword_explic_agri_0'] = "Pour les agents dépendant du Ministère de l'Agriculture et de l'Alimentation, le changement de mot de passe s'effectue comme suit :"; 
$labels['changepassword_explic_agri_1'] = "Sur votre navigateur Firefox, cliquez sur Outils | Options | Sécurité | Identifiants enregistrés puis sur Afficher les mots de passe. Supprimez toutes les lignes où votre mot de passe Agricoll est enregistré.";
$labels['changepassword_explic_agri_2'] = 'Si vous possédez un téléphone professionnel synchronisé avec la messagerie, ouvrez l\'application e-mail et supprimez le mot de passe dans le paramétrage de votre compte @agriculture.gouv.fr.';
$labels['changepassword_explic_agri_3'] = 'Changez ensuite votre mot de passe dans l\'annuaire Agricoll à partir du lien suivant : ';
$labels['changepassword_explic_agri_4'] = 'Si vous possédez un téléphone professionnel synchronisé avec la messagerie, ouvrez l\'application e-mail et renseignez le nouveau mot de passe dans le paramétrage de votre compte @agriculture.gouv.fr.';
//$labels['changepassword_lien_agri'] = 'https://annuaire.agricoll.national.agri/agricoll-liniddm/entry/edit/agentpassword/uid=prenom.nom,ou=people,ou=agriculture,o=gouv,c=fr';

//--------------

$labels['users_shares'] = 'Partager à un utilisateur';
$labels['groups_shares'] = 'Partager à un groupe';

// Informations personnelles
$labels['informationspersonnelles'] = 'Informations personnelles';

$labels['info_yes'] = 'oui';
$labels['info_no'] = 'non';

$labels['info_title'] = "Informations spécifiques au compte";
$labels['info_readonly'] = "Vous n'avez pas les droits de modifications de vos informations personnelles, seule la publication de votre photo peut être changée. Consultez votre service informatique pour avoir plus d'informations.";
$labels['info_texte'] = "En cas d'erreur, d'omission ou modifications souhaitées, contacter votre gestionnaire Amédée";

$labels['info_employee_number'] = "Matricule :";
$labels['info_internet_access_admin'] = "Accès internet autorisé :";
$labels['info_ministere'] = "Attachement administratif :";
$labels['info_internet_access_user'] = "Accès internet activé :";
$labels['info_access_nomade'] = "Accès nomade :";
$labels['info_bureautique'] = "Compte bureautique activé :";

$labels['info_annuaire'] = "Informations publiées dans l'annuaire";

$labels['info_photo'] = "Photo :";
$labels['info_photo_none'] = "Ce type d'entrée ne possède pas de photo.";
$labels['info_photo_intra'] = "Publication de la photo sur l'annuaire ministériel";
$labels['info_photo_ader'] = "Publication de la photo sur l'annuaire interministériel";

$labels['info_adresse'] = "Adresse :";
$labels['info_codepostal'] = "Code postal :";
$labels['info_ville'] = "Ville :";

$labels['info_observation'] = "Observation :";
$labels['info_description'] = "Description :";

$labels['info_telephone'] = "Numéro de téléphone :";
$labels['info_fax'] = "Numéro de fax :";
$labels['info_mobile'] = "Numéro de mobile :";
$labels['info_bureau'] = "Bureau :";
$labels['info_hierarchie'] = "Fonction hiérarchique :";
$labels['info_metier'] = "Fonction métiers :";
$labels['info_mission'] = "Missions :";

$labels['info_err_postal'] = "Mauvais format du code postal";
$labels['info_modif_ok'] = "Les données personnelles ont été modifiées.";
$labels['info_modif_nok'] = "Echec de la modification des données personnelles : ";
$labels['info_err_tel'] = "Mauvais format du numéro de ";

// Acces internet
$labels['accesinternet'] = 'Accès internet';

$labels['acces_internet_title'] = "Activation de l'accès à Mél depuis Internet";
$labels['acces_internet_status_label'] = "Statut de l'accès depuis Internet : ";
$labels['acces_internet_enable'] = "Activé";
$labels['acces_internet_disable'] = "Désactivé";
$labels['acces_internet_button_enable'] = "Activer";
$labels['acces_internet_button_disable'] = "Désactiver";
$labels['acces_internet_disable_label_forbidden'] = "Vous ne pouvez accéder au Bnum que depuis le réseau ministériel. Pour accéder au Bnum depuis n'importe où, contactez votre service informatique.";
$labels['acces_internet_disable_label_allowed'] = "Vous ne pouvez accéder au Bnum que depuis le réseau ministériel. Cliquez sur \"Activer\" pour pouvoir accéder au Bnum depuis n'importe où.";
$labels['acces_internet_enable_label'] = "Vous pouvez accéder au Bnum depuis n'importe où en vous rendant à l'adresse suivante : https://mel.din.developpement-durable.gouv.fr";
$labels['acces_internet_enable_label_internet'] = "Si vous souhaitez désactiver cet accès, vous devez vous connecter à cet écran depuis le réseau ministériel.";

$labels['acces_internet_enable_ok'] = "Votre accès internet a bien été activé";
$labels['acces_internet_disable_ok'] = "Votre accès internet a bien été désactivé";
$labels['acces_internet_nok'] = "Une erreur s'est produite lors de la modification de votre accès internet, veuillez contacter votre service informatique.";

$labels['acces_internet_doubleauth'] = "Sécurité renforcée avec l'authentification double facteur ";
$labels['acces_internet_doubleauth_link'] = "Accéder a la configuration de l'authentification double facteur";

// Gestionnaire d'absence
$labels['gestionnaireabsence'] = 'Gestionnaire d\'absence';

$labels['tababsences'] = 'Absence ponctuelle';
$labels['tabrecurrence'] = 'Absences hebdomadaires';
$labels['absence_date'] = 'Dates de début et de fin';
$labels['absence_date_debut'] = 'À partir du : ';
$labels['absence_date_fin'] = "Jusqu'au : ";
$labels['absence_perimetre_label'] = "Périmètres de la réponse";
$labels['absence_type_all'] = "Tous";
$labels['absence_type_interne'] = "Interne";
$labels['absence_type_externe'] = "Externe";
$labels['absence_interne_legende'] = "Réponse interne";
$labels['absence_texte_interne'] = "Activer la réponse automatique pour les correspondants internes (déclarés dans l'annuaire).";
$labels['absence_externe_legende'] = "Réponse externe";
$labels['absence_hebdomadaire_legende'] = "Liste des absences hebdomadaires";
$labels['absence_texte_externe'] = "Activer la réponse automatique pour les correspondants externes (interministériel, internet ...)";
$labels['absence_texte_interne_different'] = "Message spécifique pour les correspondants externes";
$labels['absence_texte_interne_identique'] = "Envoyer le même message qu'en interne";
$labels['absence_texte_mot_cle'] = 'En tapant les mots clés "jusqu\'au 01/01/1970" dans le texte, la date sera automatiquement modifiée en changeant la date de fin.';
$labels['add_new_absence'] = "Ajouter une nouvelle absence";
$labels['noabsence'] = "Pas d'absence enregistrée";
$labels['hourstart'] = "Heure de début";
$labels['hourend'] = "Heure de fin";
$labels['allday'] = "Journée entière";
$labels['deleteabsence'] = "Supprimer cette absence";

$labels['absence_ok'] = "Votre message d'absence a bien été enregistré";
$labels['absence_nok'] = "Une erreur s'est produite lors de l'enregistrement de votre message d'absence, veuillez contacter votre service informatique.";

// Gestion des listes
$labels['gestionnairelistes'] = "Gestionnaire de listes";

$labels['listes_titre'] = "Listes";
$labels['listes_membres'] = "Membres";
$labels['listes_membres_dyn'] = "Membres (Cette liste est dynamique et n'est pas modifiable. Si vous souhaitez y ajouter des membres, contactez votre service informatique)";
$labels['listes_ajouter'] = "Choisir dans l'annuaire";
$labels['listes_retirer'] = "Retirer un membre";
$labels['listes_saisir'] = "Saisir une adresse email";
$labels['listes_purger'] = "Retirer tous les membres";
$labels['listes_exporter'] = "Exporter les membres";
$labels['listes_importer'] = "Importer des membres";
$labels['listes_memb_externe'] = "Entrer l'adresse du nouveau membre";
$labels['listes_addr_nok'] = "L'adresse %%newSMTP%% n'est pas valide !";
$labels['listes_addr_del'] = "Confirmez-vous la suppression de l'adresse\n %%addr_supp%% ?";
$labels['listes_noselect'] = "Aucune liste sélectionnée.";
$labels['listes_member_noselect'] = "Aucune adresse sélectionnée";
$labels['listes_addr_del_all'] = "Confirmez-vous la suppression de toutes les adresses ?";
$labels['listes_upload'] = "Envoyer le fichier .csv";
$labels['listes_addr_error'] = "Adresse(s) invalide(s) : \n";
$labels['listes_import_success'] = "L'import s'est correctement effectué";
$labels['listes_nolist'] = "Vous ne gérez aucune liste serveur (visible par le service) depuis cette boite à lettres. <p>La création de ces listes est assurée par les opérateurs Mél.<p>";

// Synchronisation mobile
$labels['synchronisationmobile'] = "Synchronisation mobile";

$labels['cgu_mobile_legende'] = "Conditions Générales d'Utilisation de la synchronisation des appareils mobiles";
$labels['cgu_mobile_texte'] = "Le ministère offre la possibilité à ses agents de pouvoir synchroniser <b>leur messagerie, leur agenda et leurs contacts</b> professionnels depuis leurs équipements mobiles de type ordiphone. Ce service <b>requiert la souscription aux présentes Conditions Générales d’Utilisation (CGU)</b> que nous vous invitons à consulter. Ces CGU traitent notamment des points suivants :<br /><br/>
<ul>
<li>L’offre est <b>ouverte à tout agent</b> en exprimant la demande après accord du RSSI. Des <b>contrôles</b> pourront être effectués pour vérifier la bonne application des CGU.</li>
<li>Le service est accessible <b>7j/7 et 24h/24, sans engagement</b> de la part de l'utilisateur à consulter ou à répondre à un courriel.
</li>
<li>Seuls les <b>terminaux professionnels sont supportés.</b> Les terminaux personnels ont toutefois accès au service, sous réserve de compatibilité.</li>
<li>En cas de vol ou de perte, des <b>mesures de sécurité sont à mettre en œuvre par l'utilisateur</b> : changement du mot de passe de messagerie, réinitialisation du terminal <i>(obligatoire pour les terminaux professionnels, facultatif pour les terminaux personnels)</i>, etc.</li>
<li><b>Deux profils</b> de sécurité – standard et sensible – ont été définis. Ils fixent les <b>règles à respecter</b> pour l’utilisation du service (complexité du code de verrouillage, délai de verrouillage automatique, conditions d’utilisation des services Bluetooth, Wi-Fi ou de cartes de stockage amovibles).
</li>
</ul>
<br /><br />";
$labels['cgu_mobile_charte'] = "Téléchargement de la charte d'utilisation de mobiles";
$labels['cgu_mobile_profil_change'] = "Vous avez maintenant le profil <b>%%getProfilMob%%</b>, vous devez revalider les conditions générales d'utilisation";
$labels['cgu_mobile_accept'] = "En cochant cette case, je reconnais avoir téléchargé la charte pour le service de mobilité et pris connaissance des conditions générales d'utilisation et les accepter sans réserve. (<b>Profil: %%getProfilMob%%</b>).";
$labels['cgu_mobile_ok'] = "Les conditions générales d'utilisation de la synchronisation pour les mobiles ont été validées le %%getTSMob%% pour le profil <b>%%getProfilMobU%%</b>.";
$labels['cgu_mobile_no'] = "Vous n'êtes pas autorisé à synchroniser vos périphériques mobiles avec la solution de synchronisation de Mél. Si vous souhaitez l'utiliser, contactez votre service informatique.";
$labels['cgu_mobile_success'] = "Les CGU ont été acceptées, vous pouvez désormais synchroniser votre mobile sur Mél.";
$labels['cgu_mobile_error'] = "Une erreur s'est produite lors de l'enregistrement des CGU, veuillez contacter votre service informatique.";
$labels['cgu_mobile_fake'] = "Veuillez cocher la case pour accepter les CGU.";

// Statistiques mobiles
$labels['mobile'] = 'Statistiques mobiles';
$labels['mobiles_list'] = 'Liste des appareils';
$labels['deviceid'] = 'Identifiant';
$labels['type'] = 'Type';
$labels['z-push'] = 'Z-Push';
$labels['last_sync'] = 'Dernière synchro';
$labels['device_info'] = 'Informations sur l\'appareil';
$labels['imei'] = 'IMEI';
$labels['devicetype'] = 'Appareil';
$labels['devicemodel'] = 'Modèle';
$labels['operator'] = 'Opérateur';
$labels['user-agent'] = 'User-agent';
$labels['version'] = 'Version';
$labels['language'] = 'Langage';
$labels['name'] = 'Nom';
$labels['color'] = 'Couleur';
$labels['display_reminder'] = 'Afficher les rappels';
$labels['No type'] = 'Pas de type';
$labels['No version'] = 'Pas de version';
$labels['No IMEI'] = 'Pas d\'IMEI';
$labels['asversion'] = 'Version ActiveSync';
$labels['wipestatus'] = 'Statut RAZ';
$labels['wiperequestedby'] = 'demandée par';
$labels['wiperequestedon'] = 'demandée le';
$labels['wipeactionon'] = 'RAZ effectuée le';
$labels['first_sync'] = 'Première synchro';
$labels['user'] = 'Utilisateur';
$labels['resync'] = 'Resync';
$labels['remove'] = 'Enlever';
$labels['remaining'] = 'Statut';
$labels['device_info'] = 'Informations sur l\'appareil';
$labels['activesync_info'] = 'Informations sur ActiveSync';
$labels['accounts_list'] = 'Liste des comptes configurés sur l\'appareil';
$labels['sync_details'] = 'Détails des synchronisation sur l\'appareil';
$labels['device_actions'] = 'Actions sur l\'appareil mobile';
$labels['mailbox'] = 'Boite liée';
$labels['foldersync'] = 'Dossier synchronisé';

$labels['delete_device'] = 'Supprimer l\'appareil de la base de données (ré-initialisation complète ou appareil ne servant plus)';
$labels['resync_device'] = 'Ré-initialiser la synchronisation (en cas de problème)';
$labels['wipe_device'] = 'Effacer les données de l\'appareil à distance (en cas de perte ou de vol de l\'appareil, nécessite le changement du mot de passe)';
$labels['unwipe_device'] = 'Annuler l\'effacement des données de l\'appareil à distance (si l\'appareil est retrouvé)';

$labels['confirm_Wipe'] = "Souhaitez-vous effacer toutes les données de l'appareil ?";
$labels['confirm_Unwipe'] = "Souhaitez-vous annuler l'effacement de toutes les données de l'appareil";
$labels['confirm_Delete'] = "Souhaitez-vous supprimer l'appareil de la base de données ?";
$labels['confirm_DeleteZP1'] = "Souhaitez-vous supprimer l'appareil de la base de données ?";
$labels['confirm_Resync'] = "Souhaitez-vous ré-initialiser la synchronisation pour cet appareil ?";

$labels['confirm_ResyncUserDevice'] = "Souhaitez-vous ré-initialiser la synchronisation pour ce compte sur cet appareil ?";
$labels['confirm_ResyncFolderId'] = "Souhaitez-vous ré-initialiser la synchronisation pour ce dossier sur cet appareil ?";
$labels['confirm_DeleteUserDevice'] = "Souhaitez-vous enlever ce compte de la base de données pour cet appareil ?";
$labels['confirm_DeleteUserDeviceZP1'] = "Souhaitez-vous enlever ce compte de la base de données pour cet appareil ?";

$labels['success_Wipe'] = "La requête de suppression des données de l'appareil a bien été envoyée";
$labels['success_Unwipe'] = "La requête d'annulation de suppression des données de l'appareil a bien été envoyée";
$labels['success_Delete'] = "L'appareil vient d'être supprimé de la base de données";
$labels['success_DeleteZP1'] = "L'appareil vient d'être supprimé de la base de données";
$labels['success_Resync'] = "La requête de ré-initialisation de la synchronisation de l'appareil a bien été envoyée";

$labels['success_modification'] = "Modification enregistrée avec succès";
$labels['error_modification'] = "Erreur lors de la modification des données";


$labels['success_ResyncUserDevice'] = "La requête de ré-initialisation de la synchronisation du compte a bien été envoyée";
$labels['success_ResyncFolderId'] = "La requête de ré-initialisation de la synchronisation du dossier a bien été envoyée";
$labels['success_DeleteUserDevice'] = "Le compte vient d'être supprimé de la base de données";
$labels['success_DeleteUserDeviceZP1'] = "Le compte vient d'être supprimé de la base de données";

$labels['Webservice error'] = "Une erreur s'est produite, il est possible que le serveur de synchronisation mobile soit injoignable. Veuillez réessayer.";
$labels['Missing arguments'] = "Une erreur s'est produite, essayez de vous déconnecter/reconnecter.";
$labels['acces_balp_disabled'] = "L'accès aux boites spécifiques et organique est désactivé";
$labels['suspectsurls'] = 'Liens suspects';
$labels['suspects_websites'] = 'Adresses suspicieuses';
$labels['bloqued'] = 'Est bloqué';
$labels['text_suspects'] = "Vous trouverez ici la liste des adresses de site web potentiellement dangereux. Les adresses définie par défaut ne peuvent pas être supprimé mais peuvent être bloqué ou débloqué. Si une adresse est bloqué, si celle-ci ce trouve dans le corps d'un des messages, celui-ci ne pourra pas être ouvert. Dans le cas contraire, le message s'affichera correctement, mais vous aurez une alerte indiquant que le message contient un lieu probablement dangereux.";
$labels['sort'] = 'Tri Alpha.';
$labels['sort_title'] = 'Trier par ordre alphabétique';
$labels['sort_warning'] = 'Cela va changer l\'ordre de vos agenda, êtes vous-sûr de votre action ?';
$labels['cannot_sort'] = 'Vous pouvez trier par ordre alphabétique seulement depuis votre agenda personnel !';