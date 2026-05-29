<?php

// URLs to nextCloud instance (use same url as rc to avoid cross domains problems)
$rcmail_config['nextcloud_url'] = $_ENV['RC_MEL_NEXTCLOUD_URL'];
$rcmail_config['nextcloud_external_url'] = $_ENV['RC_MEL_NEXTCLOUD_EXTERNAL_URL'];

$rcmail_config['nextcloud_origin'] = $_ENV['RC_MEL_NEXTCLOUD_ORIGIN'];
$rcmail_config['nextcloud_nologin'] = $_ENV['RC_MEL_NEXTCLOUD_NOLOGIN'] ?? false;

// DES key for password
$rcmail_config['roundcube_nextcloud_des_key'] = $_ENV['RC_MEL_NEXTCLOUD_ROUNDCUBE_NEXTCLOUD_DES_KEY'];

// Filter LDAP
$rcmail_config['roundcube_nextcloud_filter_ldap'] = $_ENV['RC_MEL_NEXTCLOUD_ROUNDCUBE_NEXTCLOUD_FILTER_LDAP'];
