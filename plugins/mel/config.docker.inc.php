<?php
// Use infinite scroll instead of page navigation for emails
$rcmail_config['use_infinite_scroll'] = $_ENV['RC_MEL_USE_INFINITE_SCROLL'] ?? true;

// Configuration du HTTP HOST
$rcmail_config['http_host'] = $_ENV['RC_MEL_HTTP_HOST'];

// Use an IMAP Proxy or a single IMAP server
$rcmail_config['use_imap_proxy'] = $_ENV['RC_MEL_USE_IMAP_PROXY'] ?? false;

// Hostname of the IMAP Proxy
$rcmail_config['imap_proxy'] = $_ENV['RC_MEL_IMAP_PROXY'];

// Default calendar name when created (string or null)
// Support values from current user : %%fullname%%, %%name%%, %%email%%, %%uid%%
$config['default_calendar_name'] = $_ENV['RC_MEL_DEFAULT_CALENDAR_NAME'];

// Default addressbook name when created (string or null)
// Support values from current user : %%fullname%%, %%name%%, %%email%%, %%uid%%
$config['default_addressbook_name'] = $_ENV['RC_MEL_DEFAULT_ADDRESSBOOK_NAME'];

// Default addressbook name when created (string or null)
// Support values from current user : %%fullname%%, %%name%%, %%email%%, %%uid%%
$config['default_taskslist_name'] = $_ENV['RC_MEL_DEFAULT_TASKSLIST_NAME'];

// Hide keep login button
$rcmail_config['hide_keep_login_button'] = $_ENV['RC_MEL_HIDE_KEEP_LOGIN_BUTTON'] ?? true;

// Is this connexion come from intranet or internet
$rcmail_config['is_internal'] = $_ENV['RC_MEL_IS_INTERNAL'] ?? true;

// Driver name configuration (mce, mtes, ...)
$rcmail_config['mel_driver'] = $_ENV['RC_MEL_DRIVER'] ?? 'mce';

// Mapping des routes ldap
$config['root_mapping'] = $_ENV['RC_MEL_ROOT_MAPPING'];
