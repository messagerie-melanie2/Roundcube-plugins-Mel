Roundcube Mél Plugins and Skins
===============================

[French version][french]

INTRODUCTION
------------
This repository contains a list of plugins skins that are necessary for Mél Webmail. 
Some plugins are made specificaly for Mél Webmail, others are developped by the Mél team or by the community and modify (or not) by the Mél team
This README gives the list of plugins and an explanation for each one. 


MÉL
---
Please refer to [Roundcube Mél][roundcube-mel]


VERSION
-------
The actual version of Mél Webmail and plugins is 1.4.7  


INSTALLATION
------------
For installing a plugin or a skin, you just have to paste it in the proper folder (plugins or skins). 
Please be careful to check if the plugin or skin has dependances (please read the README). 
Then you need to edit the config.inc.php file of your Roundcube installation and add the plugin name in the 'plugins' list.


PLUGINS AND SKINS LIST
----------------------

#### Specifics Mél plugins
 - [mel][mel] : Core plugin for Mél Webmail (User creation, read identities from ldap, shared mailboxes support, ...)
 - [mel_acl][mel_acl] : ACL for mailboxes, calendars, contacts and tasks
 - [mel_contacts][mel_contacts] : Read contacts from database
 - [mel_courrielleur][mel_courrielleur] : Show parts of Mél interface in a Courrielleur (Webapp)
 - [mel_doubleauth][mel_doubleauth] : Support for double authentication (needs a Dynalogin server and web service)
 - [mel_labels_sync][mel_labels_sync] : Support for Thubderbird labels, sync between shared mailboxes
 - [mel_larry][mel_larry] : Plugin for the Mél skin
 - [mel_ldap_auth][mel_ldap_auth] : LDAP authentication for Mél
 - [mel_logs][mel_logs] : Logs in a dedicated file
 - [mel_massmail][mel_massmail] : Protection against mass emails emitted from the webmail
 - [mel_melanissimo][mel_melanissimo] : Support for Melanissimo web service (sending large attachments, needs Melanissimo)
 - [mel_mobile][mel_mobile] : Plugin for the Mél mobile skin
 - [mel_moncompte][mel_moncompte] : Add interfaces for the user to manage his data (personal information, absence manager, ...)
 - [mel_nextcloud][mel_nextcloud] : nextCloud app integration with authentication
 - [mel_shortcuts][mel_shortcuts] : Add keyboard shortcuts (similar to Thunderbird)
 - [mel_sondage][mel_sondage] : Pégase (poll) app integration with authentication
 - [mel_suggestion_box][mel_suggestion_box] : Add a suggestion box in settings

#### Mél plugins created by the team
 - [annuaire][annuaire] : Display the LDAP directory in Contacts app (and compose, moncompte, ...)
 - [jquery_mobile][jquery_mobile] : Add support for jQuery mobile lib (usefull for mobile skin)
 - [right_panel][right_panel] : Add a right panel that show next events, last messages (im, e-mail), favorites contacts
 - [rocket_chat][rocket_chat] : Rocket.Chat app intégration with authentication and web socket support
 - [roundpad][roundpad] : App to manage Etherpad and Ethercalc links
 - [roundrive][roundrive] : Webdav intégration

#### Plugin created by the community and modified by the team
 - [calendar][calendar] : a calendar
 - [libcalendaring][libcalendaring] : library for calendar and tasklist plugins
 - [tasklist][tasklist] : a tasklist

#### Plugin created by the community and unchanged
 - [bounce][bounce] : Bounce (redirect) a message
 - [contextmenu][contextmenu] : Contextual menu for Mail and Contacts
 - [pdfviewer][pdfviewer] : PDF attachment reader
 
#### Mél skins
 - [mel_larry][mel_larry_skin] : Mél skin
 - [mel_larry_mobile][mel_larry_mobile_skin] : mobile Mél skin


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


CONTRIBUTION TO ROUNDCUBE
-------------------------
Want to help make Roundcube the best webmail solution ever?
Roundcube is open source software. Our developers and contributors all
are volunteers and we're always looking for new additions and resources.
For more information visit [roundcube.net/contribute][contrib]


CONTACT
-------
For bug reports or feature requests please refer to the tracking system
of Roundcube Mél project at [Github][githubissues]


[french]:				README_fr.md
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

