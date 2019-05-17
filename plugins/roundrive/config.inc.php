<?php
// Show the drive task ?
$rcmail_config['show_drive_task'] = true;

// Configuration WebDAV
$rcmail_config['driver_webdav_url'] = 'https://roundcube.local/owncloud/remote.php/webdav/';
$rcmail_config['driver_webdav_prefix'] = '/owncloud/remote.php/webdav/';

// Filter LDAP
$rcmail_config['roundcube_owncloud_filter_ldap'] = array(
        'info' => 'AccesInternet.Profil: ACCESINTERNET',
);