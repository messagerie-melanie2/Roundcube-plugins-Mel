<?php
// List of banned ip addresses
$rcmail_config['banned_ip_list'] = $_ENV['RC_MEL_LDAP_AUTH_BANNED_IP_LIST'];

// Enable the auth protection (block after a number of fails)
$rcmail_config['enable_auth_protection'] = $_ENV['RC_MEL_LDAP_AUTH_ENABLE_AUTH_PROTECTION'] ?? false;

// Number of fails auth before the user is blocked
$rcmail_config['auth_protection_fails'] = $_ENV['RC_MEL_LDAP_AUTH_PROTECTION_FAILS'] ?? 7;

// Number of minutes before the user is unblocked
$rcmail_config['auth_protection_duration'] = $_ENV['RC_MEL_LDAP_AUTH_PROTECTION_DURATION'] ?? 10;
