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

$labels['mel'] = 'Email';

$labels['types'] = 'Types';
$labels['elements'] = 'Resource List';

$labels['logout'] = 'Logout';
$labels['tchap'] = 'Tchap';

// Resources
$labels['resources'] = 'My Resources';
$labels['manageresources'] = 'Manage your Email resources';

$labels['menumanageresources'] = 'Manage resources';
$labels['menumanageresources_calendars'] = 'Manage calendars';
$labels['menumanageresources_mailboxes'] = 'Manage mailboxes';
$labels['menumanageresources_taskslists'] = 'Manage task lists';

$labels['menumanage_create_mailbox_folder'] = 'Create a new folder';

$labels['resourcesettings'] = 'Configure resource';

$labels['resourcesbal'] = 'Mailboxes';
$labels['manageresourcesbal'] = 'Manage your Email mailboxes (display, sharing, restoration)';
$labels['resourcesagendas'] = 'Calendars';
$labels['manageresourcesagendas'] = 'Manage your Email calendars (display, synchronization, sharing, restoration)';
$labels['resourcescontacts'] = 'Contacts';
$labels['manageresourcescontacts'] = 'Manage your Email address books (display, synchronization, sharing, restoration)';
$labels['resourcestaches'] = 'Tasks';
$labels['manageresourcestaches'] = 'Manage your Email task lists (display, synchronization, sharing, restoration)';

$labels['options'] = 'Options';

$labels['contacts_search_only'] = 'Use the search field to find contacts in this directory';
$labels['contacts_search_only_all'] = 'Use the search field to find contacts in all your address books and directories';

// My Account
$labels['moncompte'] = 'My Account';
$labels['managemoncompte'] = 'Manage your Email account';

// My Statistics
$labels['statistics'] = 'My Statistics';
$labels['managestatistics'] = 'View your Email statistics';
$labels['statisticsmobile'] = 'Mobile';
$labels['managestatisticsmobile'] = 'View Mobile Email synchronization statistics';

$labels['mymailbox'] = 'My Mailbox';
$labels['mailboxchangetext'] = 'Click here to select the mailbox to display';
$labels['boitespart'] = 'Shared Mailboxes';
$labels['gestionabs'] = 'Absence Manager';
$labels['gestionlists'] = 'List Manager';
$labels['modifmdp'] = 'Change Password';
$labels['accesinternet'] = 'Internet Access and Synchronization';
$labels['infoperso'] = 'Personal Information';

$labels['userlbl'] = 'User Account';
$labels['oldpasswordlbl'] = 'Old Password';
$labels['newpasswordlbl'] = 'New Password';
$labels['newpasswordconfirmlbl'] = 'Confirm New Password';

$labels['changepassword_confirm'] = 'Your password has been changed successfully';

$labels['users_shares'] = 'Share with a User';
$labels['groups_shares'] = 'Share with a Group';

$labels['mel_use_subscribed_folders'] = 'Use subscriptions for folders';
$labels['mel_use_infinite_scroll'] = 'Use infinite scroll to browse messages';
$labels['mel_default_task'] = 'Homepage after login';

$labels['portail'] = 'Home';
$labels['calendar'] = 'Calendar';
$labels['discussion'] = 'Discussion';
$labels['sondage'] = 'Survey';
$labels['stockage'] = 'Storage';
$labels['documents'] = 'Documents';
$labels['tasks'] = 'Tasks';
$labels['help'] = 'Need Help?';

$labels['realname'] = 'Used Name';
$labels['uid'] = 'Identifier';
$labels['name identity'] = 'Displayed Name in Webmail';

$labels['error_block'] = 'Failed to login, your account is blocked';

$labels['computer_private'] = 'Save my credentials on this computer';
$labels['device_private'] = 'Save my credentials on this device';
$labels['computer_private_title'] = 'The username and two-factor authentication codes will not be required on future logins from this computer. Do not check this box on a public computer.';
$labels['change_user'] = 'Switch User';

$labels['login from'] = "Login from: ";
$labels['login_productioninformation'] = "Communication platform reserved for ministry agents";
$labels['login_footerbox'] = isset($_SERVER["HTTP_X_MINEQPROVENANCE"]) ? "Login from: " : " ";
$labels['login_footerbox_info'] = isset($_SERVER["HTTP_X_MINEQPROVENANCE"]) ? ucfirst($_SERVER["HTTP_X_MINEQPROVENANCE"]) : " ";
$labels['login_warning'] = "Respect the etiquette principles applicable to the internet, which are a set of rules for proper internet usage";

$labels['agenda_filter'] = 'Filter Calendars';

$labels['You are disconnect from Roundcube'] = "You are no longer connected to the application";
$labels['You can close and reopen the tab'] = "You can close and reopen the tab";
$labels['Or you can clic here to relogin'] = "Or you can click here to log in again";

$labels['no bal'] = "No BALI? Click here to change your password";

$labels['portail_title'] = 'Open your Mél web homepage';
$labels['help_title'] = 'Open the dedicated Mél assistance page';

$labels['mel_mailboxes_display'] = 'Folder Display Mode';
$labels['default_pref_text'] = "Default";
$labels['subfolders_pref_text'] = "Group Folders";
$labels['unified_pref_text'] = "Unified Folders";
$labels['subfolders'] = 'Folders';

$labels['from_to'] = 'From %0 to %1';