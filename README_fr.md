Roundcube Mél Plugins et Skins
===============================

INTRODUCTION
------------
Ce dépot contient une liste de plugins et de skins nécessaires au fonctionnement du webmail Mél.
Certains de ces plugins sont spécifiquement développés pour le webmail Mél, d'autres ont été développés par l'équipe Mél ou par la communauté et modifié (ou non) par l'équipe Mél.
Ce README donne la liste des plugins et skins ainsi que leurs descriptions.


MÉL
---
Merci de consulter [Roundcube Mél][roundcube-mel]


VERSION
-------
La version actuelle du webmail Mél et de ses plugins est 1.4.7


INSTALLATION
------------
Pour installer un plugin ou une skin, il faut copier son dossier dans le répertoire plugins ou skins de Roundcube.
Merci de bien faire attention si le plugin a des dépendance ou non (consulter le README du plugin).
Vous pouvez ensuite éditer le fichier config.inc.php de votre Roundcube pour ajouter le nom du plugin dans le champ 'plugins'.


LISTE DES PLUGINS ET SKINS
--------------------------

#### Plugins spécifiquement développés pour Mél
 - [mel][mel] : Plugin principal du webmail Mél (Création des utilisateurs, lecture des identités depuis l'annuaire, support des boites partagées, ...)
 - [mel_acl][mel_acl] : Gestion des partages pour les boites email, calendriers, contacts et tâches
 - [mel_contacts][mel_contacts] : Récupération des contacts depuis la base de données Mél
 - [mel_courrielleur][mel_courrielleur] : Permet d'afficher des parties de Mél dans un Courrielleur (via des web apps)
 - [mel_doubleauth][mel_doubleauth] : Ajoute le support de la double authentification (nécessite un serveur Dynalogin et son web service)
 - [mel_labels_sync][mel_labels_sync] : Ajouter le support des étiquettes Thunderbird, permet une synchronisation pour les boites partagées
 - [mel_larry][mel_larry] : Plugin pour la skin Mél
 - [mel_ldap_auth][mel_ldap_auth] : Authentification LDAP pour Mél
 - [mel_logs][mel_logs] : Centralise les logs dans un fichier dédié
 - [mel_massmail][mel_massmail] : Protection contrer les envoies massifs de messages depuis le webmail Mél
 - [mel_melanissimo][mel_melanissimo] : Ajoute le support du service web Mélanissimo (envoi de gros fichiers, nécessite un serveur Melanissimo)
 - [mel_mobile][mel_mobile] : Plugin pour la skin mobile Mél
 - [mel_moncompte][mel_moncompte] : Ajoute des pages pour gérer les données de l'utilisateur (informations personnelles, gestionnaire d'absence, CGU, ...)
 - [mel_nextcloud][mel_nextcloud] : Intégration de nextCloud avec authentification
 - [mel_shortcuts][mel_shortcuts] : Ajoute des raccourcis claviers similaires à Thunderbird
 - [mel_sondage][mel_sondage] : Intégration de Pégase (sondage) avec authentification
 - [mel_suggestion_box][mel_suggestion_box] : Ajoute une boite à idées dans les paramètres

#### Plugins développés par l'équipe Mél
 - [annuaire][annuaire] : Affiche l'annuaire LDAP dans le menu Contacts (et nouveau message, mon compte, ...)
 - [jquery_mobile][jquery_mobile] : Ajoute la librairie jQuery mobile nécessaire pour la skin mobile
 - [right_panel][right_panel] : Ajoute un panneau de droite qui affiche les prochains événements de l'utilisateur, ses derniers messages (instantanés et mails) et ses contacts favoris
 - [rocket_chat][rocket_chat] : Intégration de Rocket.Chat avec authentification et support de web socket
 - [roundpad][roundpad] : Application permettant de gérer des liens Etherpad ou Ethercalc
 - [roundrive][roundrive] : Intégration webdav pour se connecter à nextCloud (gestion des pièces jointes dans les messages)

#### Plugin développés par la communauté et modifié par l'équipe Mél
 - [calendar][calendar] : Affichage et gestion des calendriers de l'utilisateur
 - [libcalendaring][libcalendaring] : Librairie pour les plugins calendar et tasklist
 - [tasklist][tasklist] : Affichage et gestion des listes de tâches de l'utilisateur

#### Plugin développé par la communauté
 - [bounce][bounce] : Redirection d'un message
 - [contextmenu][contextmenu] : Menu contextuel dans les Mails et Contacts
 - [pdfviewer][pdfviewer] : Lecteur PDF
 
#### Mél skins
 - [mel_larry][mel_larry_skin] : Skin Mél
 - [mel_larry_mobile][mel_larry_mobile_skin] : Skin Mél mobile


LICENSE
-------
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License (**with exceptions
for skins & plugins**) as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see [www.gnu.org/licenses/][gpl].

This file forms part of the Roundcube Webmail Software for which the
following exception is added: Plugins and Skins which merely make
function calls to the Roundcube Webmail Software, and for that purpose
include it by reference shall not be considered modifications of
the software.

If you wish to use this file in another project or create a modified
version that will not be part of the Roundcube Webmail Software, you
may remove the exception above and use this source code under the
original version of the license.

For more details about licensing and the exceptions for skins and plugins
see [roundcube.net/license][license]


CONTRIBUER A ROUNDCUBE
----------------------
Vous souhaitez contribuer à améliorer le webmail Roundcube ?
Ce client est un logiciel open source. Les développeurs et contributeurs
sont tous volontaires et recherchent toujours de nouvelles contributions.
Pour plus d'information, voir [roundcube.net/contribute][contrib]


CONTACTER L'EQUIPE MÉL
----------------------
Pour rapporter des bugs ou des demandes de fonctionnalités pour le webmail Mél, 
merci d'utiliser le système de suivi accessible à [Github][githubissues]


[gpl]:          		http://www.gnu.org/licenses/
[license]:      		http://roundcube.net/license
[contrib]:      		http://roundcube.net/contribute
[githubissues]: 		https://github.com/messagerie-melanie2/Roundcube-Mel/issues
[roundcube-mel]: 		https://github.com/messagerie-melanie2/Roundcube-Mel
[mel]:					https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/mel
[mel_acl]:				https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/mel_acl
[mel_contacts]:			https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/mel_contacts
[mel_courrielleur]:		https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/mel_courrielleur
[mel_doubleauth]: 		https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/mel_doubleauth
[mel_labels_sync]: 		https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/mel_labels_sync
[mel_larry]: 			https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/mel_larry
[mel_ldap_auth]: 		https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/mel_ldap_auth
[mel_logs]: 			https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/mel_logs
[mel_massmail]: 		https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/mel_massmail
[mel_melanissimo]: 		https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/mel_melanissimo
[mel_mobile]: 			https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/mel_mobile
[mel_moncompte]: 		https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/mel_moncompte
[mel_nextcloud]: 		https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/mel_nextcloud
[mel_shortcuts]: 		https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/mel_shortcuts
[mel_sondage]: 			https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/mel_sondage
[mel_suggestion_box]: 	https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/mel_suggestion_box
[annuaire]: 			https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/annuaire
[jquery_mobile]: 		https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/jquery_mobile
[right_panel]: 			https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/right_panel
[rocket_chat]: 			https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/rocket_chat
[roundpad]: 			https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/roundpad
[roundrive]: 			https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/roundrive
[calendar]: 			https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/calendar
[libcalendaring]: 		https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/libcalendaring
[tasklist]: 			https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/tasklist
[bounce]: 				https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/bounce
[contextmenu]: 			https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/contextmenu
[pdfviewer]: 			https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/plugins/pdfviewer
[mel_larry_skin]: 		https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/skins/mel_larry
[mel_larry_mobile_skin]: https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/tree/master/skins/mel_larry_mobile

