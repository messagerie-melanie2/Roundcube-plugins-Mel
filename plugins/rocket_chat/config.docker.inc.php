<?php
// Url of Rocket.Chat instance
$rcmail_config['rocket_chat_url'] = $_ENV['RC_ROCKET_CHAT_URL'];
// Url of Rocket.Chat API instance
$rcmail_config['rocket_chat_url_api'] = $_ENV['RC_ROCKET_CHAT_URL_API'];

// Username of a rocket chat admin user for users and channels creations
$rcmail_config['rocket_chat_admin_username'] = $_ENV['RC_ROCKET_CHAT_ADMIN_USERNAME'] ?? 'admin';

// Password of the admin user
$rcmail_config['rocket_chat_admin_password'] = $_ENV['RC_ROCKET_CHAT_ADMIN_PASSWORD'] ?? 'password';

// User agent
$rcmail_config['curl_user_agent'] = $_ENV['RC_ROCKET_CHAT_CURL_USER_AGENT'] ?? 'Roundcube/Rocket Chat Plugin';

// SSL Verifier Peer
$rcmail_config['curl_ssl_verifierpeer'] = $_ENV['RC_ROCKET_CHAT_CURL_SSL_VERIFIERPEER'] ?? true;

// Use MongoDB for LDAP users
$rcmail_config['rocket_chat_use_mongodb'] = $_ENV['RC_ROCKET_CHAT_USE_MONGODB'] ?? true;

// MongoDB connexion URI
$rcmail_config['rocket_chat_mongodb_uri'] = $_ENV['RC_ROCKET_CHAT_MONGODB_URI'];

// LDAP idAttribute
$rcmail_config['rocket_chat_idAttribute'] = $_ENV['RC_ROCKET_CHAT_IDATTRIBUTE'] ?? 'uid';

// Cross-Domain configuration
$rcmail_config['rocket_chat_domain'] = $_ENV['RC_ROCKET_CHAT_DOMAIN'] ?? 'rocket.chat';

// Limit rocket chat usage to a users list (see below)
$rcmail_config['rocket_chat_limited_use'] = $_ENV['RC_ROCKET_CHAT_LIMITED_USE'] ?? false;

// List of users for Rocket.Chat
$rcmail_config['rocket_chat_users'] = $_ENV['RC_ROCKET_CHAT_USERS'];

// Expire token duration configurer in rocket.chat in seconds (48h)
$rcmail_config['rocket_chat_token_duration'] = $_ENV['RC_ROCKET_CHAT_TOKEN_DURATION'] ?? 172800;
