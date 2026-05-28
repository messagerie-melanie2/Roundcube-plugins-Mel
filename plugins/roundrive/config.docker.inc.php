<?php
// Show the drive task ?
$rcmail_config['show_drive_task'] = $_ENV['RC_ROUNDRIVE_SHOW_DRIVE_TASK'] ?? true;

// Configuration WebDAV
$rcmail_config['driver_webdav_url'] = $_ENV['RC_ROUNDRIVE_DRIVER_WEBDAV_URL'];

// Prefix ex for owncloud : /remote.php/webdav/
$rcmail_config['driver_webdav_prefix'] = $_ENV['RC_ROUNDRIVE_DRIVER_WEBDAV_PREFIX'] ?? '/prefix/file.php/webdav/';

// Filter LDAP
$rcmail_config['roundcube_owncloud_filter_ldap'] = $_ENV['RC_ROUNDRIVE_ROUNDCUBE_OWNCLOUD_FILTER_LDAP'];
