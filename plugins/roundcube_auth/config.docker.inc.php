<?php

$config = array();

// --------------- AUTH Methods --------------

// OIDC only (?oidc=1 triggers OIDC auth)
$config['auth_oidc_enabled'] = $_ENV['RC_ROUNDCUBE_AUTH_OIDC_ENABLED'] ?? true;
$config['auth_oidc_keyword'] = $_ENV['RC_ROUNDCUBE_AUTH_OIDC_KEYWORD'] ?? "oidc";

// OIDC + Kerberos (Kerberos triggers OIDC auth, after LDAP check)
$config['auth_kerb_enabled'] = $_ENV['RC_ROUNDCUBE_AUTH_KERB_ENABLED'] ?? true;
$config['auth_kerb_keyword'] = $_ENV['RC_ROUNDCUBE_AUTH_KERB_KEYWORD'] ?? "kerb";

// --------------- Provider ------------------

// OIDC Provider URL
$config['oidc_url'] = $_ENV['RC_ROUNDCUBE_AUTH_OIDC_URL'] ?? 'OIDC_PROVIDER_URL';

// Proxy (url:port) to reach OIDC Provider - Leave empty if you don't need it
$config['oidc_proxy'] = $_ENV['RC_ROUNDCUBE_AUTH_OIDC_PROXY'];

// App URL to redirect after OIDC login - Leave empty if you don't need it
$config['oidc_redirect'] = $_ENV['RC_ROUNDCUBE_AUTH_OIDC_REDIRECT'];

// Client ID (registered on the provider)
$config['oidc_client'] = $_ENV['RC_ROUNDCUBE_AUTH_OIDC_CLIENT'] ?? 'OIDC_CLIENT_ID';

// Client secret (corresponding to the given client ID)
$config['oidc_secret'] = $_ENV['RC_ROUNDCUBE_AUTH_OIDC_SECRET'] ?? 'OIDC_CLIENT_SECRET';

// OIDC scopes ('openid' is automatically added, it should not be needed here)
$config['oidc_scope'] = $_ENV['RC_ROUNDCUBE_AUTH_OIDC_SCOPE'] ?? 'uid';

// -------------- OIDC -----------------

$config['auth_oidc_link_enabled'] = $_ENV['RC_ROUNDCUBE_AUTH_OIDC_LINK_ENABLED'] ?? true;
$config['auth_oidc_link_name'] = "Cerbère"; // "CAS", "Auth Unifiée", ...

// Field used as a login UID (email, uid, ...)
$config['oidc_field_uid'] = $_ENV['RC_ROUNDCUBE_AUTH_OIDC_FIELD_UID'] ?? 'uid';
$config['oidc_field_eidas'] = $_ENV['RC_ROUNDCUBE_AUTH_OIDC_FIELD_EIDAS'] ?? 'acr';

// OIDC - Token expiration delay, in seconds
$config['oidc_exp_delay'] = $_ENV['RC_ROUNDCUBE_AUTH_OIDC_EXP_DELAY'] ?? 600;

// OIDC - Inactivity delay, in seconds
$config['oidc_act_delay'] = $_ENV['RC_ROUNDCUBE_AUTH_OIDC_ACT_DELAY'] ?? 300;

// Actions that will count as refresh (inactivity)
// Mel
$config['refresh_actions'] = $_ENV['RC_ROUNDCUBE_AUTH_REFRESH_ACTIONS'] ?? ['refresh', 'load_events', 'plugin.list_contacts_recent', 'plugin.get_unread_count'];
// BNUM
$config['refresh_actions'] = $_ENV['RC_ROUNDCUBE_AUTH_REFRESH_ACTIONS'] ?? ['refresh', 'load_events', 'plugin.list_contacts_recent', 'plugin.get_unread_count', 'get_wsp_unread_mails_count', 'get_unread_mail_count'];

// -------------- Kerberos Activation -----------------

// Kerberos activation based on client browser(s)
// -- Activates if all conditions match (Use " " to target all browsers) 
//
//$config['kerb_browsers'] = [ " " => true, "libwww-perl" => false];
//$config['kerb_browsers'] = ["Firefox" => true, "Chrome" => false];

// Kerberos activation based on PHP ($_SERVER) header(s)
// -- Activates if one header matches
// 
//$config['kerb_headers'] = [ "HTTP_X_MINEQPROVENANCE" => "intranet" ];

// Kerberos activation based on IP Address (IN or NOT IN subnet(s))
// -- Activates if all conditions match (Use '0.0.0.0/0' to target all addresses)
//
//$config['kerb_subnets'] = [ "0.0.0.0/0" => false, "100.0.0.0/8" => true ];
//$config['kerb_subnets'] = [ "100.64.0.0/10" => false, "161.48.0.0/16" => false ];
