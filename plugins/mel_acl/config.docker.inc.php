<?php

// Default look of access rights table
// In advanced mode all access rights are displayed separately
// In simple mode access rights are grouped into four groups: read, write, delete, full
$config['acl_advanced_mode'] = $_ENV['RC_MEL_ACL_ADVANCED_MODE'] ?? false;

// LDAP addressbook that would be searched for user names autocomplete.
// That should be an array refering to the $rcmail_config['ldap_public'] array key
// or complete addressbook configuration array.
$config['acl_users_source'] = $_ENV['RC_MEL_ACL_USERS_SOURCE'];

// The LDAP attribute which will be used as ACL user identifier
$config['acl_users_field'] = $_ENV['RC_MEL_ACL_USERS_FIELD'] ?? 'uid';

// The LDAP search filter will be &'d with search queries
$config['acl_users_filter'] = $_ENV['RC_MEL_ACL_USERS_FILTER'];


// LDAP addressbook that would be searched for user names autocomplete.
// That should be an array refering to the $rcmail_config['ldap_public'] array key
// or complete addressbook configuration array.
$config['acl_groups_source'] = $_ENV['RC_MEL_ACL_GROUPS_SOURCE'];

// The LDAP attribute which will be used as ACL user identifier
$config['acl_groups_field'] = $_ENV['RC_MEL_ACL_GROUPS_FIELD'] ?? 'dn';

// The LDAP search filter will be &'d with search queries
$config['acl_groups_filter'] = $_ENV['RC_MEL_ACL_GROUPS_FILTER'];

// Matching mode for addressbook search (including autocompletion)
// 0 - partial (*abc*), default
// 1 - strict (abc)
// 2 - prefix (abc*)
// Note: For LDAP sources fuzzy_search must be enabled to use 'partial' or 'prefix' mode
$config['addressbook_search_mode_groups'] = $_ENV['RC_MEL_ACL_ADDRESSBOOK_SEARCH_MODE_GROUPS'] ?? 0;

// Include the following 'special' access control subjects in the ACL dialog;
// Defaults to array('anyone', 'anonymous') (not when set to an empty array)
// Example: array('anyone') to exclude 'anonymous'.
// Set to an empty array to exclude all special aci subjects.
$config['acl_specials'] = $_ENV['RC_MEL_ACL_SPECIALS'] ?? array('anyone', 'anonymous');

?>
