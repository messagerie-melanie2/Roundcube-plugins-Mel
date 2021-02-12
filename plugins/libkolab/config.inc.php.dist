<?php

/* Configuration for libkolab */

// Enable caching of Kolab objects in local database
$config['kolab_cache'] = true;

// Cache refresh interval (default is 12 hours)
// after this period, cache is forced to synchronize with IMAP
$config['kolab_cache_refresh'] = '12h';

// Specify format version to write Kolab objects (must be a string value!)
$config['kolab_format_version']  = '3.0';

// Optional override of the URL to read and trigger Free/Busy information of Kolab users
// Defaults to /freebusy or https://<imap-server->/freebusy
$config['kolab_freebusy_server'] = null;

// Enables listing of only subscribed folders. This e.g. will limit
// folders in calendar view or available addressbooks
$config['kolab_use_subscriptions'] = false;

// List any of 'personal','shared','other' namespaces to be excluded from groupware folder listing
// example: array('other');
$config['kolab_skip_namespace'] = null;

// Enables the use of displayname folder annotations as introduced in KEP:?
// for displaying resource folder names (experimental!)
$config['kolab_custom_display_names'] = false;

// Configuration of HTTP requests.
// See http://pear.php.net/manual/en/package.http.http-request2.config.php
// for list of supported configuration options (array keys)
$config['kolab_http_request'] = array();

// When kolab_cache is enabled Roundcube's messages cache will be redundant
// when working on kolab folders. Here we can:
// 3 - bypass only indexes, but use messages cache
// 2 - bypass both messages and indexes cache
// 1 - bypass only messages, but use index cache
$config['kolab_messages_cache_bypass'] = 0;

// These event properties contribute to a significant revision to the calendar component
// and if changed will increment the sequence number relevant for scheduling according to RFC 5545
$config['kolab_event_scheduling_properties'] = array('start', 'end', 'allday', 'recurrence', 'location', 'status', 'cancelled');

// These task properties contribute to a significant revision to the calendar component
// and if changed will increment the sequence number relevant for scheduling according to RFC 5545
$config['kolab_task_scheduling_properties'] = array('start', 'due', 'summary', 'status');

// LDAP directory to find avilable users for folder sharing.
// Either contains an array with LDAP addressbook configuration or refers to entry in $config['ldap_public'].
// If not specified, the configuraton from 'kolab_auth_addressbook' will be used.
// Should be provided for multi-domain setups with placeholders like %dc, %d, %u, %fu or %dn.
$config['kolab_users_directory'] = null;

// Filter to be used for resolving user folders in LDAP.
// Defaults to the 'kolab_auth_filter' configuration option.
$config['kolab_users_filter'] = '(&(objectclass=kolabInetOrgPerson)(|(uid=%u)(mail=%fu)))';

// Which property of the LDAP user record to use for user folder mapping in IMAP.
// Defaults to the 'kolab_auth_login' configuration option.
$config['kolab_users_id_attrib'] = null;

// Use these attributes when searching users in LDAP
$config['kolab_users_search_attrib'] = array('cn','mail','alias');

// Which property of the LDAP user record to use as a display name.
// Defaults to the 'kolab_auth_name' configuration option.
$config['kolab_users_name_field'] = null;

// Type of cache for uid-to-user map. Supported: 'db', 'apc', 'memcache' and 'memcached'.
// Note: This stores only other user folder identifier to user attributes map.
$config['kolab_users_cache'] = null;

// lifetime of shared folder mapping cache
// possible units: s, m, h, d, w
$config['kolab_users_cache_ttl'] = '10d';

// JSON-RPC endpoint configuration of the Bonnie web service providing historic data for groupware objects
$config['kolab_bonnie_api'] = null;
/*
$config['kolab_bonnie_api'] = array(
    'uri'    => 'https://<kolab-hostname>:8080/api/rpc',
    'user'   => 'webclient',
    'pass'   => 'Welcome2KolabSystems',
    'secret' => '8431f191707fffffff00000000cccc',
    'debug'  => true,   // logs requests/responses to <log-dir>/bonnie
    'timeout' => 30,
);
*/
