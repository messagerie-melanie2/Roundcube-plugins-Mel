<?php

/**
 * Kolab storage class providing static methods to access groupware objects on a Kolab server.
 *
 * @version @package_version@
 * @author Thomas Bruederli <bruederli@kolabsys.com>
 * @author Aleksander Machniak <machniak@kolabsys.com>
 *
 * Copyright (C) 2012-2014, Kolab Systems AG <contact@kolabsys.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

class kolab_storage
{
    const CTYPE_KEY         = '/shared/vendor/kolab/folder-type';
    const CTYPE_KEY_PRIVATE = '/private/vendor/kolab/folder-type';
    const COLOR_KEY_SHARED  = '/shared/vendor/kolab/color';
    const COLOR_KEY_PRIVATE = '/private/vendor/kolab/color';
    const NAME_KEY_SHARED   = '/shared/vendor/kolab/displayname';
    const NAME_KEY_PRIVATE  = '/private/vendor/kolab/displayname';
    const UID_KEY_SHARED    = '/shared/vendor/kolab/uniqueid';
    const UID_KEY_CYRUS     = '/shared/vendor/cmu/cyrus-imapd/uniqueid';

    const ERROR_IMAP_CONN      = 1;
    const ERROR_CACHE_DB       = 2;
    const ERROR_NO_PERMISSION  = 3;
    const ERROR_INVALID_FOLDER = 4;

    public static $version = '3.0';
    public static $last_error;
    public static $encode_ids = false;

    private static $ready = false;
    private static $with_tempsubs = true;
    private static $subscriptions;
    private static $ldapcache = array();
    private static $typedata = array();
    private static $ldap = array();
    private static $states;
    private static $config;
    private static $imap;


    // Default folder names
    private static $default_folders = array(
        'event'         => 'Calendar',
        'contact'       => 'Contacts',
        'task'          => 'Tasks',
        'note'          => 'Notes',
        'file'          => 'Files',
        'configuration' => 'Configuration',
        'journal'       => 'Journal',
        'mail.inbox'       => 'INBOX',
        'mail.drafts'      => 'Drafts',
        'mail.sentitems'   => 'Sent',
        'mail.wastebasket' => 'Trash',
        'mail.outbox'      => 'Outbox',
        'mail.junkemail'   => 'Junk',
    );


    /**
     * Setup the environment needed by the libs
     */
    public static function setup()
    {
        if (self::$ready)
            return true;

        $rcmail = rcube::get_instance();
        self::$config  = $rcmail->config;
        self::$version = strval($rcmail->config->get('kolab_format_version', self::$version));
        self::$imap    = $rcmail->get_storage();
        self::$ready   = class_exists('kolabformat') &&
            (self::$imap->get_capability('METADATA') || self::$imap->get_capability('ANNOTATEMORE') || self::$imap->get_capability('ANNOTATEMORE2'));

        if (self::$ready) {
            // do nothing
        }
        else if (!class_exists('kolabformat')) {
            rcube::raise_error(array(
                'code' => 900, 'type' => 'php',
                'message' => "required kolabformat module not found"
            ), true);
        }
        else if (self::$imap->get_error_code()) {
            rcube::raise_error(array(
                'code' => 900, 'type' => 'php', 'message' => "IMAP error"
            ), true);
        }

        // adjust some configurable settings
        if ($event_scheduling_prop = $rcmail->config->get('kolab_event_scheduling_properties', null)) {
            kolab_format_event::$scheduling_properties = (array)$event_scheduling_prop;
        }
        // adjust some configurable settings
        if ($task_scheduling_prop = $rcmail->config->get('kolab_task_scheduling_properties', null)) {
            kolab_format_task::$scheduling_properties = (array)$task_scheduling_prop;
        }

        return self::$ready;
    }

    /**
     * Initializes LDAP object to resolve Kolab users
     *
     * @param string $name Name of the configuration option with LDAP config
     */
    public static function ldap($name = 'kolab_users_directory')
    {
        self::setup();

        $config = self::$config->get($name);

        if (empty($config)) {
            $name   = 'kolab_auth_addressbook';
            $config = self::$config->get($name);
        }

        if (self::$ldap[$name]) {
            return self::$ldap[$name];
        }

        if (!is_array($config)) {
            $ldap_config = (array)self::$config->get('ldap_public');
            $config = $ldap_config[$config];
        }

        if (empty($config)) {
            return null;
        }

        $ldap = new kolab_ldap($config);

        // overwrite filter option
        if ($filter = self::$config->get('kolab_users_filter')) {
            self::$config->set('kolab_auth_filter', $filter);
        }

        $user_field = $user_attrib = self::$config->get('kolab_users_id_attrib');

        // Fallback to kolab_auth_login, which is not attribute, but field name
        if (!$user_field && ($user_field = self::$config->get('kolab_auth_login', 'email'))) {
            $user_attrib = $config['fieldmap'][$user_field];
        }

        if ($user_field && $user_attrib) {
            $ldap->extend_fieldmap(array($user_field => $user_attrib));
        }

        self::$ldap[$name] = $ldap;

        return $ldap;
    }

    /**
     * Get a list of storage folders for the given data type
     *
     * @param string Data type to list folders for (contact,distribution-list,event,task,note)
     * @param boolean Enable to return subscribed folders only (null to use configured subscription mode)
     *
     * @return array List of Kolab_Folder objects (folder names in UTF7-IMAP)
     */
    public static function get_folders($type, $subscribed = null)
    {
        $folders = $folderdata = array();

        if (self::setup()) {
            foreach ((array)self::list_folders('', '*', $type, $subscribed, $folderdata) as $foldername) {
                $folders[$foldername] = new kolab_storage_folder($foldername, $type, $folderdata[$foldername]);
            }
        }

        return $folders;
    }

    /**
     * Getter for the storage folder for the given type
     *
     * @param string Data type to list folders for (contact,distribution-list,event,task,note)
     * @return object kolab_storage_folder  The folder object
     */
    public static function get_default_folder($type)
    {
        if (self::setup()) {
            foreach ((array)self::list_folders('', '*', $type . '.default', false, $folderdata) as $foldername) {
                return new kolab_storage_folder($foldername, $type, $folderdata[$foldername]);
            }
        }

        return null;
    }

    /**
     * Getter for a specific storage folder
     *
     * @param string IMAP folder to access (UTF7-IMAP)
     * @param string Expected folder type
     *
     * @return object kolab_storage_folder  The folder object
     */
    public static function get_folder($folder, $type = null)
    {
        return self::setup() ? new kolab_storage_folder($folder, $type) : null;
    }

    /**
     * Getter for a single Kolab object, identified by its UID.
     * This will search all folders storing objects of the given type.
     *
     * @param string Object UID
     * @param string Object type (contact,event,task,journal,file,note,configuration)
     * @return array The Kolab object represented as hash array or false if not found
     */
    public static function get_object($uid, $type)
    {
        self::setup();
        $folder = null;
        foreach ((array)self::list_folders('', '*', $type, null, $folderdata) as $foldername) {
            if (!$folder)
                $folder = new kolab_storage_folder($foldername, $type, $folderdata[$foldername]);
            else
                $folder->set_folder($foldername, $type, $folderdata[$foldername]);

            if ($object = $folder->get_object($uid))
                return $object;
        }

        return false;
    }

    /**
     * Execute cross-folder searches with the given query.
     *
     * @param array  Pseudo-SQL query as list of filter parameter triplets
     * @param string Folder type (contact,event,task,journal,file,note,configuration)
     * @param int    Expected number of records or limit (for performance reasons)
     *
     * @return array List of Kolab data objects (each represented as hash array)
     * @see kolab_storage_format::select()
     */
    public static function select($query, $type, $limit = null)
    {
        self::setup();
        $folder = null;
        $result = array();

        foreach ((array)self::list_folders('', '*', $type, null, $folderdata) as $foldername) {
            $folder = new kolab_storage_folder($foldername, $type, $folderdata[$foldername]);

            if ($limit) {
                $folder->set_order_and_limit(null, $limit);
            }

            foreach ($folder->select($query) as $object) {
                $result[] = $object;
            }
        }

        return $result;
    }

    /**
     * Returns Free-busy server URL
     */
    public static function get_freebusy_server()
    {
        self::setup();

        $url = 'https://' . $_SESSION['imap_host'] . '/freebusy';
        $url = self::$config->get('kolab_freebusy_server', $url);
        $url = rcube_utils::resolve_url($url);

        return unslashify($url);
    }

    /**
     * Compose an URL to query the free/busy status for the given user
     *
     * @param string Email address of the user to get free/busy data for
     * @param object DateTime Start of the query range (optional)
     * @param object DateTime End of the query range (optional)
     *
     * @return string Fully qualified URL to query free/busy data
     */
    public static function get_freebusy_url($email, $start = null, $end = null)
    {
        $query = '';
        $param = array();
        $utc = new \DateTimeZone('UTC');

        if ($start instanceof \DateTime) {
            $start->setTimezone($utc);
            $param['dtstart'] = $start->format('Ymd\THis\Z');
        }
        if ($end instanceof \DateTime) {
            $end->setTimezone($utc);
            $param['dtend'] = $end->format('Ymd\THis\Z');
        }
        if (!empty($param)) {
            $query = '?' . http_build_query($param);
        }

        return self::get_freebusy_server() . '/' . $email . '.ifb' . $query;
    }

    /**
     * Creates folder ID from folder name
     *
     * @param string  $folder Folder name (UTF7-IMAP)
     * @param boolean $enc    Use lossless encoding
     * @return string Folder ID string
     */
    public static function folder_id($folder, $enc = null)
    {
        return $enc == true || ($enc === null && self::$encode_ids) ?
            self::id_encode($folder) :
            asciiwords(strtr($folder, '/.-', '___'));
    }

    /**
     * Encode the given ID to a safe ascii representation
     *
     * @param string $id Arbitrary identifier string
     *
     * @return string Ascii representation
     */
    public static function id_encode($id)
    {
        return rtrim(strtr(base64_encode($id), '+/', '-_'), '=');
    }

    /**
     * Convert the given identifier back to it's raw value
     *
     * @param string $id Ascii identifier
     * @return string Raw identifier string
     */
    public static function id_decode($id)
    {
      return base64_decode(str_pad(strtr($id, '-_', '+/'), strlen($id) % 4, '=', STR_PAD_RIGHT));
    }

    /**
     * Return the (first) path of the requested IMAP namespace
     *
     * @param string  Namespace name (personal, shared, other)
     * @return string IMAP root path for that namespace
     */
    public static function namespace_root($name)
    {
        self::setup();

        foreach ((array)self::$imap->get_namespace($name) as $paths) {
            if (strlen($paths[0]) > 1) {
                return $paths[0];
            }
        }

        return '';
    }

    /**
     * Deletes IMAP folder
     *
     * @param string $name Folder name (UTF7-IMAP)
     *
     * @return bool True on success, false on failure
     */
    public static function folder_delete($name)
    {
        // clear cached entries first
        if ($folder = self::get_folder($name))
            $folder->cache->purge();

        $rcmail = rcube::get_instance();
        $plugin = $rcmail->plugins->exec_hook('folder_delete', array('name' => $name));

        $success = self::$imap->delete_folder($name);
        self::$last_error = self::$imap->get_error_str();

        return $success;
    }

    /**
     * Creates IMAP folder
     *
     * @param string $name       Folder name (UTF7-IMAP)
     * @param string $type       Folder type
     * @param bool   $subscribed Sets folder subscription
     * @param bool   $active     Sets folder state (client-side subscription)
     *
     * @return bool True on success, false on failure
     */
    public static function folder_create($name, $type = null, $subscribed = false, $active = false)
    {
        self::setup();

        $rcmail = rcube::get_instance();
        $plugin = $rcmail->plugins->exec_hook('folder_create', array('record' => array(
            'name' => $name,
            'subscribe' => $subscribed,
        )));

        if ($saved = self::$imap->create_folder($name, $subscribed)) {
            // set metadata for folder type
            if ($type) {
                $saved = self::set_folder_type($name, $type);

                // revert if metadata could not be set
                if (!$saved) {
                    self::$imap->delete_folder($name);
                }
                // activate folder
                else if ($active) {
                    self::set_state($name, true);
                }
            }
        }

        if ($saved) {
            return true;
        }

        self::$last_error = self::$imap->get_error_str();
        return false;
    }

    /**
     * Renames IMAP folder
     *
     * @param string $oldname Old folder name (UTF7-IMAP)
     * @param string $newname New folder name (UTF7-IMAP)
     *
     * @return bool True on success, false on failure
     */
    public static function folder_rename($oldname, $newname)
    {
        self::setup();

        $rcmail = rcube::get_instance();
        $plugin = $rcmail->plugins->exec_hook('folder_rename', array(
            'oldname' => $oldname, 'newname' => $newname));

        $oldfolder = self::get_folder($oldname);
        $active    = self::folder_is_active($oldname);
        $success   = self::$imap->rename_folder($oldname, $newname);
        self::$last_error = self::$imap->get_error_str();

        // pass active state to new folder name
        if ($success && $active) {
            self::set_state($oldname, false);
            self::set_state($newname, true);
        }

        // assign existing cache entries to new resource uri
        if ($success && $oldfolder) {
            $oldfolder->cache->rename($newname);
        }

        return $success;
    }

    /**
     * Rename or Create a new IMAP folder.
     *
     * Does additional checks for permissions and folder name restrictions
     *
     * @param array &$prop Hash array with folder properties and metadata
     *  - name:       Folder name
     *  - oldname:    Old folder name when changed
     *  - parent:     Parent folder to create the new one in
     *  - type:       Folder type to create
     *  - subscribed: Subscribed flag (IMAP subscription)
     *  - active:     Activation flag (client-side subscription)
     *
     * @return string|false New folder name or False on failure
     *
     * @see self::set_folder_props() for list of other properties
     */
    public static function folder_update(&$prop)
    {
        self::setup();

        $folder    = rcube_charset::convert($prop['name'], RCUBE_CHARSET, 'UTF7-IMAP');
        $oldfolder = $prop['oldname']; // UTF7
        $parent    = $prop['parent']; // UTF7
        $delimiter = self::$imap->get_hierarchy_delimiter();

        if (strlen($oldfolder)) {
            $options = self::$imap->folder_info($oldfolder);
        }

        if (!empty($options) && ($options['norename'] || $options['protected'])) {
        }
        // sanity checks (from steps/settings/save_folder.inc)
        else if (!strlen($folder)) {
            self::$last_error = 'cannotbeempty';
            return false;
        }
        else if (strlen($folder) > 128) {
            self::$last_error = 'nametoolong';
            return false;
        }
        else {
            // these characters are problematic e.g. when used in LIST/LSUB
            foreach (array($delimiter, '%', '*') as $char) {
                if (strpos($folder, $char) !== false) {
                    self::$last_error = 'forbiddencharacter';
                    return false;
                }
            }
        }

        if (!empty($options) && ($options['protected'] || $options['norename'])) {
            $folder = $oldfolder;
        }
        else if (strlen($parent)) {
            $folder = $parent . $delimiter . $folder;
        }
        else {
            // add namespace prefix (when needed)
            $folder = self::$imap->mod_folder($folder, 'in');
        }

        // Check access rights to the parent folder
        if (strlen($parent) && (!strlen($oldfolder) || $oldfolder != $folder)) {
            $parent_opts = self::$imap->folder_info($parent);
            if ($parent_opts['namespace'] != 'personal'
                && (empty($parent_opts['rights']) || !preg_match('/[ck]/', implode($parent_opts['rights'])))
            ) {
                self::$last_error = 'No permission to create folder';
                return false;
            }
        }

        // update the folder name
        if (strlen($oldfolder)) {
            if ($oldfolder != $folder) {
                $result = self::folder_rename($oldfolder, $folder);
            }
            else {
                $result = true;
            }
        }
        // create new folder
        else {
            $result = self::folder_create($folder, $prop['type'], $prop['subscribed'], $prop['active']);
        }

        if ($result) {
            self::set_folder_props($folder, $prop);
        }

        return $result ? $folder : false;
    }

    /**
     * Getter for human-readable name of Kolab object (folder)
     * with kolab_custom_display_names support.
     * See http://wiki.kolab.org/UI-Concepts/Folder-Listing for reference
     *
     * @param string $folder    IMAP folder name (UTF7-IMAP)
     * @param string $folder_ns Will be set to namespace name of the folder
     *
     * @return string Name of the folder-object
     */
    public static function object_name($folder, &$folder_ns=null)
    {
        // find custom display name in folder METADATA
        if ($name = self::custom_displayname($folder)) {
            return $name;
        }

        return self::object_prettyname($folder, $folder_ns);
    }

    /**
     * Get custom display name (saved in metadata) for the given folder
     */
    public static function custom_displayname($folder)
    {
        static $_metadata;

        // find custom display name in folder METADATA
        if (self::$config->get('kolab_custom_display_names', true) && self::setup()) {
            if ($_metadata !== null) {
                $metadata = $_metadata;
            }
            else {
                // For performance reasons ask for all folders, it will be cached as one cache entry
                $metadata = self::$imap->get_metadata("*", array(self::NAME_KEY_PRIVATE, self::NAME_KEY_SHARED));

                // If cache is disabled store result in memory
                if (!self::$config->get('imap_cache')) {
                    $_metadata = $metadata;
                }
            }

            if ($data = $metadata[$folder]) {
                if (($name = $data[self::NAME_KEY_PRIVATE]) || ($name = $data[self::NAME_KEY_SHARED])) {
                    return $name;
                }
            }
        }

        return false;
    }

    /**
     * Getter for human-readable name of Kolab object (folder)
     * See http://wiki.kolab.org/UI-Concepts/Folder-Listing for reference
     *
     * @param string $folder    IMAP folder name (UTF7-IMAP)
     * @param string $folder_ns Will be set to namespace name of the folder
     *
     * @return string Name of the folder-object
     */
    public static function object_prettyname($folder, &$folder_ns=null)
    {
        self::setup();

        $found     = false;
        $namespace = self::$imap->get_namespace();

        if (!empty($namespace['shared'])) {
            foreach ($namespace['shared'] as $ns) {
                if (strlen($ns[0]) && strpos($folder, $ns[0]) === 0) {
                    $prefix = '';
                    $folder = substr($folder, strlen($ns[0]));
                    $delim  = $ns[1];
                    $found  = true;
                    $folder_ns = 'shared';
                    break;
                }
            }
        }

        if (!$found && !empty($namespace['other'])) {
            foreach ($namespace['other'] as $ns) {
                if (strlen($ns[0]) && strpos($folder, $ns[0]) === 0) {
                    // remove namespace prefix and extract username
                    $folder = substr($folder, strlen($ns[0]));
                    $delim  = $ns[1];

                    // get username part and map it to user name
                    $pos = strpos($folder, $delim);
                    $fid = $pos ? substr($folder, 0, $pos) : $folder;
                    $fid = self::folder_id2user($fid, true);
                    $fid = str_replace($delim, '', $fid);

                    $prefix = "($fid)";
                    $folder = $pos ? substr($folder, $pos + 1) : '';
                    $found  = true;
                    $folder_ns = 'other';
                    break;
                }
            }
        }

        if (!$found && !empty($namespace['personal'])) {
            foreach ($namespace['personal'] as $ns) {
                if (strlen($ns[0]) && strpos($folder, $ns[0]) === 0) {
                    // remove namespace prefix
                    $folder = substr($folder, strlen($ns[0]));
                    $prefix = '';
                    $delim  = $ns[1];
                    $found  = true;
                    break;
                }
            }
        }

        if (empty($delim))
            $delim = self::$imap->get_hierarchy_delimiter();

        $folder = rcube_charset::convert($folder, 'UTF7-IMAP');
        $folder = html::quote($folder);
        $folder = str_replace(html::quote($delim), ' &raquo; ', $folder);

        if ($prefix)
            $folder = html::quote($prefix) . ($folder !== '' ? ' ' . $folder : '');

        if (!$folder_ns)
            $folder_ns = 'personal';

        return $folder;
    }

    /**
     * Helper method to generate a truncated folder name to display.
     * Note: $origname is a string returned by self::object_name()
     */
    public static function folder_displayname($origname, &$names)
    {
        $name = $origname;

        // find folder prefix to truncate
        for ($i = count($names)-1; $i >= 0; $i--) {
            if (strpos($name, $names[$i] . ' &raquo; ') === 0) {
                $length = strlen($names[$i] . ' &raquo; ');
                $prefix = substr($name, 0, $length);
                $count  = count(explode(' &raquo; ', $prefix));
                $diff   = 1;

                // check if prefix folder is in other users namespace
                for ($n = count($names)-1; $n >= 0; $n--) {
                    if (strpos($prefix, '(' . $names[$n] . ') ') === 0) {
                        $diff = 0;
                        break;
                    }
                }

                $name = str_repeat('&nbsp;&nbsp;&nbsp;', $count - $diff) . '&raquo; ' . substr($name, $length);
                break;
            }
            // other users namespace and parent folder exists
            else if (strpos($name, '(' . $names[$i] . ') ') === 0) {
                $length = strlen('(' . $names[$i] . ') ');
                $prefix = substr($name, 0, $length);
                $count  = count(explode(' &raquo; ', $prefix));
                $name   = str_repeat('&nbsp;&nbsp;&nbsp;', $count) . '&raquo; ' . substr($name, $length);
                break;
            }
        }

        $names[] = $origname;

        return $name;
    }

    /**
     * Creates a SELECT field with folders list
     *
     * @param string $type    Folder type
     * @param array  $attrs   SELECT field attributes (e.g. name)
     * @param string $current The name of current folder (to skip it)
     *
     * @return html_select SELECT object
     */
    public static function folder_selector($type, $attrs, $current = '')
    {
        // get all folders of specified type (sorted)
        $folders = self::get_folders($type, true);

        $delim = self::$imap->get_hierarchy_delimiter();
        $names = array();
        $len   = strlen($current);

        if ($len && ($rpos = strrpos($current, $delim))) {
            $parent = substr($current, 0, $rpos);
            $p_len  = strlen($parent);
        }

        // Filter folders list
        foreach ($folders as $c_folder) {
            $name = $c_folder->name;

            // skip current folder and it's subfolders
            if ($len) {
                if ($name == $current) {
                    // Make sure parent folder is listed (might be skipped e.g. if it's namespace root)
                    if ($p_len && !isset($names[$parent])) {
                        $names[$parent] = self::object_name($parent);
                    }
                    continue;
                }
                if (strpos($name, $current.$delim) === 0) {
                    continue;
                }
            }

            // always show the parent of current folder
            if ($p_len && $name == $parent) {
            }
            // skip folders where user have no rights to create subfolders
            else if ($c_folder->get_owner() != $_SESSION['username']) {
                $rights = $c_folder->get_myrights();
                if (!preg_match('/[ck]/', $rights)) {
                    continue;
                }
            }

            $names[$name] = $c_folder->get_name();
        }

        // Build SELECT field of parent folder
        $attrs['is_escaped'] = true;
        $select = new html_select($attrs);
        $select->add('---', '');

        $listnames = array();
        foreach (array_keys($names) as $imap_name) {
            $name = $origname = $names[$imap_name];

            // find folder prefix to truncate
            for ($i = count($listnames)-1; $i >= 0; $i--) {
                if (strpos($name, $listnames[$i].' &raquo; ') === 0) {
                    $length = strlen($listnames[$i].' &raquo; ');
                    $prefix = substr($name, 0, $length);
                    $count  = count(explode(' &raquo; ', $prefix));
                    $name   = str_repeat('&nbsp;&nbsp;', $count-1) . '&raquo; ' . substr($name, $length);
                    break;
                }
            }

            $listnames[] = $origname;
            $select->add($name, $imap_name);
        }

        return $select;
    }

    /**
     * Returns a list of folder names
     *
     * @param string  Optional root folder
     * @param string  Optional name pattern
     * @param string  Data type to list folders for (contact,event,task,journal,file,note,mail,configuration)
     * @param boolean Enable to return subscribed folders only (null to use configured subscription mode)
     * @param array   Will be filled with folder-types data
     *
     * @return array List of folders
     */
    public static function list_folders($root = '', $mbox = '*', $filter = null, $subscribed = null, &$folderdata = array())
    {
        if (!self::setup()) {
            return null;
        }

        // use IMAP subscriptions
        if ($subscribed === null && self::$config->get('kolab_use_subscriptions')) {
            $subscribed = true;
        }

        if (!$filter) {
            // Get ALL folders list, standard way
            if ($subscribed) {
                $folders = self::_imap_list_subscribed($root, $mbox);
            }
            else {
                $folders = self::_imap_list_folders($root, $mbox);
            }

            return $folders;
        }
        $prefix = $root . $mbox;
        $regexp = '/^' . preg_quote($filter, '/') . '(\..+)?$/';

        // get folders types for all folders
        $folderdata = self::folders_typedata($prefix);

        if (!is_array($folderdata)) {
            return array();
        }

        // In some conditions we can skip LIST command (?)
        if (!$subscribed && $filter != 'mail' && $prefix == '*') {
            foreach ($folderdata as $folder => $type) {
                if (!preg_match($regexp, $type)) {
                    unset($folderdata[$folder]);
                }
            }

            return self::$imap->sort_folder_list(array_keys($folderdata), true);
        }

        // Get folders list
        if ($subscribed) {
            $folders = self::_imap_list_subscribed($root, $mbox);
        }
        else {
            $folders = self::_imap_list_folders($root, $mbox);
        }

        // In case of an error, return empty list (?)
        if (!is_array($folders)) {
            return array();
        }

        // Filter folders list
        foreach ($folders as $idx => $folder) {
            $type = $folderdata[$folder];

            if ($filter == 'mail' && empty($type)) {
                continue;
            }
            if (empty($type) || !preg_match($regexp, $type)) {
                unset($folders[$idx]);
            }
        }

        return $folders;
    }

    /**
     * Wrapper for rcube_imap::list_folders() with optional post-filtering
     */
    protected static function _imap_list_folders($root, $mbox)
    {
        $postfilter = null;

        // compose a post-filter expression for the excluded namespaces
        if ($root . $mbox == '*' && ($skip_ns = self::$config->get('kolab_skip_namespace'))) {
            $excludes = array();
            foreach ((array)$skip_ns as $ns) {
                if ($ns_root = self::namespace_root($ns)) {
                    $excludes[] = $ns_root;
                }
            }

            if (count($excludes)) {
                $postfilter = '!^(' . join(')|(', array_map('preg_quote', $excludes)) . ')!';
            }
        }

        // use normal LIST command to return all folders, it's fast enough
        $folders = self::$imap->list_folders($root, $mbox, null, null, !empty($postfilter));

        if (!empty($postfilter)) {
            $folders = array_filter($folders, function($folder) use ($postfilter) { return !preg_match($postfilter, $folder); });
            $folders = self::$imap->sort_folder_list($folders);
        }

        return $folders;
    }

    /**
     * Wrapper for rcube_imap::list_folders_subscribed()
     * with support for temporarily subscribed folders
     */
    protected static function _imap_list_subscribed($root, $mbox)
    {
        $folders = self::$imap->list_folders_subscribed($root, $mbox);

        // add temporarily subscribed folders
        if (self::$with_tempsubs && is_array($_SESSION['kolab_subscribed_folders'])) {
            $folders = array_unique(array_merge($folders, $_SESSION['kolab_subscribed_folders']));
        }

        return $folders;
    }

    /**
     * Search for shared or otherwise not listed groupware folders the user has access
     *
     * @param string Folder type of folders to search for
     * @param string Search string
     * @param array  Namespace(s) to exclude results from
     *
     * @return array List of matching kolab_storage_folder objects
     */
    public static function search_folders($type, $query, $exclude_ns = array())
    {
        if (!self::setup()) {
            return array();
        }

        $folders = array();
        $query = str_replace('*', '', $query);

        // find unsubscribed IMAP folders of the given type
        foreach ((array)self::list_folders('', '*', $type, false, $folderdata) as $foldername) {
            // FIXME: only consider the last part of the folder path for searching?
            $realname = strtolower(rcube_charset::convert($foldername, 'UTF7-IMAP'));
            if (($query == '' || strpos($realname, $query) !== false) &&
                !self::folder_is_subscribed($foldername, true) &&
                !in_array(self::$imap->folder_namespace($foldername), (array)$exclude_ns)
              ) {
                $folders[] = new kolab_storage_folder($foldername, $type, $folderdata[$foldername]);
            }
        }

        return $folders;
    }

    /**
     * Sort the given list of kolab folders by namespace/name
     *
     * @param array List of kolab_storage_folder objects
     * @return array Sorted list of folders
     */
    public static function sort_folders($folders)
    {
        $pad     = '  ';
        $out     = array();
        $nsnames = array('personal' => array(), 'shared' => array(), 'other' => array());

        foreach ($folders as $folder) {
            $_folders[$folder->name] = $folder;
            $ns = $folder->get_namespace();
            $nsnames[$ns][$folder->name] = strtolower(html_entity_decode($folder->get_name(), ENT_COMPAT, RCUBE_CHARSET)) . $pad;  // decode &raquo;
        }

        // $folders is a result of get_folders() we can assume folders were already sorted
        foreach (array_keys($nsnames) as $ns) {
            asort($nsnames[$ns], SORT_LOCALE_STRING);
            foreach (array_keys($nsnames[$ns]) as $utf7name) {
                $out[] = $_folders[$utf7name];
            }
        }

        return $out;
    }

    /**
     * Check the folder tree and add the missing parents as virtual folders
     *
     * @param array $folders Folders list
     * @param object $tree   Reference to the root node of the folder tree
     *
     * @return array Flat folders list
     */
    public static function folder_hierarchy($folders, &$tree = null)
    {
        if (!self::setup()) {
            return array();
        }

        $_folders = array();
        $delim    = self::$imap->get_hierarchy_delimiter();
        $other_ns = rtrim(self::namespace_root('other'), $delim);
        $tree     = new kolab_storage_folder_virtual('', '<root>', '');  // create tree root
        $refs     = array('' => $tree);

        foreach ($folders as $idx => $folder) {
            $path = explode($delim, $folder->name);
            array_pop($path);
            $folder->parent = join($delim, $path);
            $folder->children = array();  // reset list

            // skip top folders or ones with a custom displayname
            if (count($path) < 1 || kolab_storage::custom_displayname($folder->name)) {
                $tree->children[] = $folder;
            }
            else {
                $parents = array();
                $depth = $folder->get_namespace() == 'personal' ? 1 : 2;

                while (count($path) >= $depth && ($parent = join($delim, $path))) {
                    array_pop($path);
                    $parent_parent = join($delim, $path);

                    if (!$refs[$parent]) {
                        if ($folder->type && self::folder_type($parent) == $folder->type) {
                            $refs[$parent] = new kolab_storage_folder($parent, $folder->type, $folder->type);
                            $refs[$parent]->parent = $parent_parent;
                        }
                        else if ($parent_parent == $other_ns) {
                            $refs[$parent] = new kolab_storage_folder_user($parent, $parent_parent);
                        }
                        else {
                            $name = kolab_storage::object_name($parent);
                            $refs[$parent] = new kolab_storage_folder_virtual($parent, $name, $folder->get_namespace(), $parent_parent);
                        }
                        $parents[] = $refs[$parent];
                    }
                }

                if (!empty($parents)) {
                    $parents = array_reverse($parents);
                    foreach ($parents as $parent) {
                        $parent_node = $refs[$parent->parent] ?: $tree;
                        $parent_node->children[] = $parent;
                        $_folders[] = $parent;
                    }
                }

                $parent_node = $refs[$folder->parent] ?: $tree;
                $parent_node->children[] = $folder;
            }

            $refs[$folder->name] = $folder;
            $_folders[] = $folder;
            unset($folders[$idx]);
        }

        return $_folders;
    }

    /**
     * Returns folder types indexed by folder name
     *
     * @param string $prefix Folder prefix (Default '*' for all folders)
     *
     * @return array|bool List of folders, False on failure
     */
    public static function folders_typedata($prefix = '*')
    {
        if (!self::setup()) {
            return false;
        }

        // return cached result
        if (is_array(self::$typedata[$prefix])) {
            return self::$typedata[$prefix];
        }

        $type_keys = array(self::CTYPE_KEY, self::CTYPE_KEY_PRIVATE);

        // fetch metadata from *some* folders only
        if (($prefix == '*' || $prefix == '') && ($skip_ns = self::$config->get('kolab_skip_namespace'))) {
            $delimiter = self::$imap->get_hierarchy_delimiter();
            $folderdata = $blacklist = array();
            foreach ((array)$skip_ns as $ns) {
                if ($ns_root = rtrim(self::namespace_root($ns), $delimiter)) {
                    $blacklist[] = $ns_root;
                }
            }
            foreach (array('personal','other','shared') as $ns) {
                if (!in_array($ns, (array)$skip_ns)) {
                    $ns_root = rtrim(self::namespace_root($ns), $delimiter);

                    // list top-level folders and their childs one by one
                    // GETMETADATA "%" doesn't list shared or other namespace folders but "*" would
                    if ($ns_root == '') {
                        foreach ((array)self::$imap->get_metadata('%', $type_keys) as $folder => $metadata) {
                            if (!in_array($folder, $blacklist)) {
                                $folderdata[$folder] = $metadata;
                                $opts = self::$imap->folder_attributes($folder);
                                if (!in_array('\\HasNoChildren', $opts) && ($data = self::$imap->get_metadata($folder.$delimiter.'*', $type_keys))) {
                                    $folderdata += $data;
                                }
                            }
                        }
                    }
                    else if ($data = self::$imap->get_metadata($ns_root.$delimiter.'*', $type_keys)) {
                        $folderdata += $data;
                    }
                }
            }
        }
        else {
            $folderdata = self::$imap->get_metadata($prefix, $type_keys);
        }

        if (!is_array($folderdata)) {
            return false;
        }

        // keep list in memory
        self::$typedata[$prefix] = array_map(array('kolab_storage', 'folder_select_metadata'), $folderdata);

        return self::$typedata[$prefix];
    }

    /**
     * Callback for array_map to select the correct annotation value
     */
    public static function folder_select_metadata($types)
    {
        if (!empty($types[self::CTYPE_KEY_PRIVATE])) {
            return $types[self::CTYPE_KEY_PRIVATE];
        }
        else if (!empty($types[self::CTYPE_KEY])) {
            list($ctype, ) = explode('.', $types[self::CTYPE_KEY]);
            return $ctype;
        }
        return null;
    }

    /**
     * Returns type of IMAP folder
     *
     * @param string $folder Folder name (UTF7-IMAP)
     *
     * @return string Folder type
     */
    public static function folder_type($folder)
    {
        self::setup();

        // return in-memory cached result
        foreach (self::$typedata as $typedata) {
            if (array_key_exists($folder, $typedata)) {
                return $typedata[$folder];
            }
        }

        $metadata = self::$imap->get_metadata($folder, array(self::CTYPE_KEY, self::CTYPE_KEY_PRIVATE));

        if (!is_array($metadata)) {
            return null;
        }

        if (!empty($metadata[$folder])) {
            return self::folder_select_metadata($metadata[$folder]);
        }

        return 'mail';
    }

    /**
     * Sets folder content-type.
     *
     * @param string $folder Folder name
     * @param string $type   Content type
     *
     * @return boolean True on success
     */
    public static function set_folder_type($folder, $type='mail')
    {
        self::setup();

        list($ctype, $subtype) = explode('.', $type);

        $success = self::$imap->set_metadata($folder, array(self::CTYPE_KEY => $ctype, self::CTYPE_KEY_PRIVATE => $subtype ? $type : null));

        if (!$success)  // fallback: only set private annotation
            $success |= self::$imap->set_metadata($folder, array(self::CTYPE_KEY_PRIVATE => $type));

        return $success;
    }

    /**
     * Check subscription status of this folder
     *
     * @param string $folder Folder name
     * @param boolean $temp  Include temporary/session subscriptions
     *
     * @return boolean True if subscribed, false if not
     */
    public static function folder_is_subscribed($folder, $temp = false)
    {
        if (self::$subscriptions === null) {
            self::setup();
            self::$with_tempsubs = false;
            self::$subscriptions = self::$imap->list_folders_subscribed();
            self::$with_tempsubs = true;
        }

        return in_array($folder, self::$subscriptions) ||
            ($temp && in_array($folder, (array)$_SESSION['kolab_subscribed_folders']));
    }

    /**
     * Change subscription status of this folder
     *
     * @param string $folder Folder name
     * @param boolean $temp  Only subscribe temporarily for the current session
     *
     * @return True on success, false on error
     */
    public static function folder_subscribe($folder, $temp = false)
    {
        self::setup();

        // temporary/session subscription
        if ($temp) {
            if (self::folder_is_subscribed($folder)) {
                return true;
            }
            else if (!is_array($_SESSION['kolab_subscribed_folders']) || !in_array($folder, $_SESSION['kolab_subscribed_folders'])) {
                $_SESSION['kolab_subscribed_folders'][] = $folder;
                return true;
            }
        }
        else if (self::$imap->subscribe($folder)) {
            self::$subscriptions = null;
            return true;
        }

        return false;
    }

    /**
     * Change subscription status of this folder
     *
     * @param string $folder Folder name
     * @param boolean $temp  Only remove temporary subscription
     *
     * @return True on success, false on error
     */
    public static function folder_unsubscribe($folder, $temp = false)
    {
        self::setup();

        // temporary/session subscription
        if ($temp) {
            if (is_array($_SESSION['kolab_subscribed_folders']) && ($i = array_search($folder, $_SESSION['kolab_subscribed_folders'])) !== false) {
                unset($_SESSION['kolab_subscribed_folders'][$i]);
            }
            return true;
        }
        else if (self::$imap->unsubscribe($folder)) {
            self::$subscriptions = null;
            return true;
        }

        return false;
    }

    /**
     * Check activation status of this folder
     *
     * @param string $folder Folder name
     *
     * @return boolean True if active, false if not
     */
    public static function folder_is_active($folder)
    {
        $active_folders = self::get_states();

        return in_array($folder, $active_folders);
    }

    /**
     * Change activation status of this folder
     *
     * @param string $folder Folder name
     *
     * @return True on success, false on error
     */
    public static function folder_activate($folder)
    {
        // activation implies temporary subscription
        self::folder_subscribe($folder, true);
        return self::set_state($folder, true);
    }

    /**
     * Change activation status of this folder
     *
     * @param string $folder Folder name
     *
     * @return True on success, false on error
     */
    public static function folder_deactivate($folder)
    {
        // remove from temp subscriptions, really?
        self::folder_unsubscribe($folder, true);

        return self::set_state($folder, false);
    }

    /**
     * Return list of active folders
     */
    private static function get_states()
    {
        if (self::$states !== null) {
            return self::$states;
        }

        $rcube   = rcube::get_instance();
        $folders = $rcube->config->get('kolab_active_folders');

        if ($folders !== null) {
            self::$states = !empty($folders) ? explode('**', $folders) : array();
        }
        // for backward-compatibility copy server-side subscriptions to activation states
        else {
            self::setup();
            if (self::$subscriptions === null) {
                self::$with_tempsubs = false;
                self::$subscriptions = self::$imap->list_folders_subscribed();
                self::$with_tempsubs = true;
            }
            self::$states = self::$subscriptions;
            $folders = implode(self::$states, '**');
            $rcube->user->save_prefs(array('kolab_active_folders' => $folders));
        }

        return self::$states;
    }

    /**
     * Update list of active folders
     */
    private static function set_state($folder, $state)
    {
        self::get_states();

        // update in-memory list
        $idx = array_search($folder, self::$states);
        if ($state && $idx === false) {
            self::$states[] = $folder;
        }
        else if (!$state && $idx !== false) {
            unset(self::$states[$idx]);
        }

        // update user preferences
        $folders = implode(self::$states, '**');
        $rcube   = rcube::get_instance();
        return $rcube->user->save_prefs(array('kolab_active_folders' => $folders));
    }

    /**
     * Creates default folder of specified type
     * To be run when none of subscribed folders (of specified type) is found
     *
     * @param string $type  Folder type
     * @param string $props Folder properties (color, etc)
     *
     * @return string Folder name
     */
    public static function create_default_folder($type, $props = array())
    {
        if (!self::setup()) {
            return;
        }

        $folders = self::$imap->get_metadata('*', array(kolab_storage::CTYPE_KEY_PRIVATE));

        // from kolab_folders config
        $folder_type  = strpos($type, '.') ? str_replace('.', '_', $type) : $type . '_default';
        $default_name = self::$config->get('kolab_folders_' . $folder_type);
        $folder_type  = str_replace('_', '.', $folder_type);

        // check if we have any folder in personal namespace
        // folder(s) may exist but not subscribed
        foreach ((array)$folders as $f => $data) {
            if (strpos($data[self::CTYPE_KEY_PRIVATE], $type) === 0) {
                $folder = $f;
                break;
            }
        }

        if (!$folder) {
            if (!$default_name) {
                $default_name = self::$default_folders[$type];
            }

            if (!$default_name) {
                return;
            }

            $folder = rcube_charset::convert($default_name, RCUBE_CHARSET, 'UTF7-IMAP');
            $prefix = self::$imap->get_namespace('prefix');

            // add personal namespace prefix if needed
            if ($prefix && strpos($folder, $prefix) !== 0 && $folder != 'INBOX') {
                $folder = $prefix . $folder;
            }

            if (!self::$imap->folder_exists($folder)) {
                if (!self::$imap->create_folder($folder)) {
                    return;
                }
            }

            self::set_folder_type($folder, $folder_type);
        }

        self::folder_subscribe($folder);

        if ($props['active']) {
            self::set_state($folder, true);
        }

        if (!empty($props)) {
            self::set_folder_props($folder, $props);
        }

        return $folder;
    }

    /**
     * Sets folder metadata properties
     *
     * @param string $folder Folder name
     * @param array  &$prop  Folder properties (color, displayname)
     */
    public static function set_folder_props($folder, &$prop)
    {
        if (!self::setup()) {
            return;
        }

        // TODO: also save 'showalarams' and other properties here
        $ns        = self::$imap->folder_namespace($folder);
        $supported = array(
            'color'       => array(self::COLOR_KEY_SHARED, self::COLOR_KEY_PRIVATE),
            'displayname' => array(self::NAME_KEY_SHARED, self::NAME_KEY_PRIVATE),
        );

        foreach ($supported as $key => $metakeys) {
            if (array_key_exists($key, $prop)) {
                $meta_saved = false;
                if ($ns == 'personal')  // save in shared namespace for personal folders
                    $meta_saved = self::$imap->set_metadata($folder, array($metakeys[0] => $prop[$key]));
                if (!$meta_saved)    // try in private namespace
                    $meta_saved = self::$imap->set_metadata($folder, array($metakeys[1] => $prop[$key]));
                if ($meta_saved)
                    unset($prop[$key]);  // unsetting will prevent fallback to local user prefs
            }
        }
    }

    /**
     * Search users in Kolab LDAP storage
     *
     * @param mixed   $query    Search value (or array of field => value pairs)
     * @param int     $mode     Matching mode: 0 - partial (*abc*), 1 - strict (=), 2 - prefix (abc*)
     * @param array   $required List of fields that shall ot be empty
     * @param int     $limit    Maximum number of records
     * @param int     $count    Returns the number of records found
     *
     * @return array List of users
     */
    public static function search_users($query, $mode = 1, $required = array(), $limit = 0, &$count = 0)
    {
        $query = str_replace('*', '', $query);

        // requires a working LDAP setup
        if (!strlen($query) || !($ldap = self::ldap())) {
            return array();
        }

        $root          = self::namespace_root('other');
        $user_attrib   = self::$config->get('kolab_users_id_attrib', self::$config->get('kolab_auth_login', 'mail'));
        $search_attrib = self::$config->get('kolab_users_search_attrib', array('cn','mail','alias'));

        // search users using the configured attributes
        $results = $ldap->dosearch($search_attrib, $query, $mode, $required, $limit, $count);

        // exclude myself
        if ($_SESSION['kolab_dn']) {
            unset($results[$_SESSION['kolab_dn']]);
        }

        // resolve to IMAP folder name
        array_walk($results, function(&$user, $dn) use ($root, $user_attrib) {
            list($localpart, ) = explode('@', $user[$user_attrib]);
            $user['kolabtargetfolder'] = $root . $localpart;
        });

        return $results;
    }

    /**
     * Returns a list of IMAP folders shared by the given user
     *
     * @param array   User entry from LDAP
     * @param string  Data type to list folders for (contact,event,task,journal,file,note,mail,configuration)
     * @param int     1 - subscribed folders only, 0 - all folders, 2 - all non-active
     * @param array   Will be filled with folder-types data
     *
     * @return array List of folders
     */
    public static function list_user_folders($user, $type, $subscribed = 0, &$folderdata = array())
    {
        self::setup();

        $folders = array();

        // use localpart of user attribute as root for folder listing
        $user_attrib = self::$config->get('kolab_users_id_attrib', self::$config->get('kolab_auth_login', 'mail'));
        if (!empty($user[$user_attrib])) {
            list($mbox) = explode('@', $user[$user_attrib]);

            $delimiter  = self::$imap->get_hierarchy_delimiter();
            $other_ns   = self::namespace_root('other');
            $prefix     = $other_ns . $mbox . $delimiter;
            $subscribed = (int) $subscribed;
            $subs       = $subscribed < 2 ? (bool) $subscribed : false;
            $folders    = self::list_folders($prefix, '*', $type, $subs, $folderdata);

            if ($subscribed === 2 && !empty($folders)) {
                $active = self::get_states();
                if (!empty($active)) {
                    $folders = array_diff($folders, $active);
                }
            }
        }

        return $folders;
    }

    /**
     * Get a list of (virtual) top-level folders from the other users namespace
     *
     * @param string  Data type to list folders for (contact,event,task,journal,file,note,mail,configuration)
     * @param boolean Enable to return subscribed folders only (null to use configured subscription mode)
     *
     * @return array List of kolab_storage_folder_user objects
     */
    public static function get_user_folders($type, $subscribed)
    {
        $folders = $folderdata = array();

        if (self::setup()) {
            $delimiter = self::$imap->get_hierarchy_delimiter();
            $other_ns = rtrim(self::namespace_root('other'), $delimiter);
            $path_len = count(explode($delimiter, $other_ns));

            foreach ((array)self::list_folders($other_ns . $delimiter, '*', '', $subscribed) as $foldername) {
                if ($foldername == 'INBOX')  // skip INBOX which is added by default
                    continue;

                $path = explode($delimiter, $foldername);

                // compare folder type if a subfolder is listed
                if ($type && count($path) > $path_len + 1 && $type != self::folder_type($foldername)) {
                    continue;
                }

                // truncate folder path to top-level folders of the 'other' namespace
                $foldername = join($delimiter, array_slice($path, 0, $path_len + 1));

                if (!$folders[$foldername]) {
                    $folders[$foldername] = new kolab_storage_folder_user($foldername, $other_ns);
                }
            }

            // for every (subscribed) user folder, list all (unsubscribed) subfolders
            foreach ($folders as $userfolder) {
                foreach ((array)self::list_folders($userfolder->name . $delimiter, '*', $type, false, $folderdata) as $foldername) {
                    if (!$folders[$foldername]) {
                        $folders[$foldername] = new kolab_storage_folder($foldername, $type, $folderdata[$foldername]);
                        $userfolder->children[] = $folders[$foldername];
                    }
                }
            }
        }

        return $folders;
    }

    /**
     * Handler for user_delete plugin hooks
     *
     * Remove all cache data from the local database related to the given user.
     */
    public static function delete_user_folders($args)
    {
        $db = rcmail::get_instance()->get_dbh();
        $prefix = 'imap://' . urlencode($args['username']) . '@' . $args['host'] . '/%';
        $db->query("DELETE FROM " . $db->table_name('kolab_folders', true) . " WHERE `resource` LIKE ?", $prefix);

    }

    /**
     * Get folder METADATA for all supported keys
     * Do this in one go for better caching performance
     */
    public static function folder_metadata($folder)
    {
        if (self::setup()) {
            $keys = array(
                // For better performance we skip displayname here, see (self::custom_displayname())
                // self::NAME_KEY_PRIVATE,
                // self::NAME_KEY_SHARED,
                self::CTYPE_KEY,
                self::CTYPE_KEY_PRIVATE,
                self::COLOR_KEY_PRIVATE,
                self::COLOR_KEY_SHARED,
                self::UID_KEY_SHARED,
                self::UID_KEY_CYRUS,
            );

            $metadata = self::$imap->get_metadata($folder, $keys);

            return $metadata[$folder];
        }
    }

    /**
     * Get user attributes for specified other user (imap) folder identifier.
     *
     * @param string $folder_id Folder name w/o path (imap user identifier)
     * @param bool   $as_string Return configured display name attribute value
     *
     * @return array User attributes
     * @see self::ldap()
     */
    public static function folder_id2user($folder_id, $as_string = false)
    {
        static $domain, $cache, $name_attr;

        $rcube = rcube::get_instance();

        if ($domain === null) {
            list(, $domain) = explode('@', $rcube->get_user_name());
        }

        if ($name_attr === null) {
            $name_attr = (array) ($rcube->config->get('kolab_users_name_field', $rcube->config->get('kolab_auth_name')) ?: 'name');
        }

        $token = $folder_id;
        if ($domain && strpos($find, '@') === false) {
            $token .= '@' . $domain;
        }

        if ($cache === null) {
            $cache = $rcube->get_cache_shared('kolab_users') ?: false;
        }

        // use value cached in memory for repeated lookups
        if (!$cache && array_key_exists($token, self::$ldapcache)) {
            $user = self::$ldapcache[$token];
        }

        if (empty($user) && $cache) {
            $user = $cache->get($token);
        }

        if (empty($user) && ($ldap = self::ldap())) {
            $user = $ldap->get_user_record($token, $_SESSION['imap_host']);

            if (!empty($user)) {
                $keys = array('displayname', 'name', 'mail'); // supported keys
                $user = array_intersect_key($user, array_flip($keys));

                if (!empty($user)) {
                    if ($cache) {
                        $cache->set($token, $user);
                    }
                    else {
                        self::$ldapcache[$token] = $user;
                    }
                }
            }
        }

        if (!empty($user)) {
            if ($as_string) {
                foreach ($name_attr as $attr) {
                    if ($display = $user[$attr]) {
                        break;
                    }
                }

                if (!$display) {
                    $display = $user['displayname'] ?: $user['name'];
                }

                if ($display && $display != $folder_id) {
                    $display = "$display ($folder_id)";
                }

                return $display;
            }

            return $user;
        }
    }

    /**
     * Chwala's 'folder_mod' hook handler for mapping other users folder names
     */
    public static function folder_mod($args)
    {
        static $roots;

        if ($roots === null) {
            self::setup();
            $roots = self::$imap->get_namespace('other');
        }

        // Note: We're working with UTF7-IMAP encoding here

        if ($args['dir'] == 'in') {
            foreach ((array) $roots as $root) {
                if (strpos($args['folder'], $root[0]) === 0) {
                    // remove root and explode folder
                    $delim  = $root[1];
                    $folder = explode($delim, substr($args['folder'], strlen($root[0])));
                    // compare first (user) part with a regexp, it's supposed
                    // to look like this: "Doe, Jane (uid)", so we can extract the uid
                    // and replace the folder with it
                    if (preg_match('~^[^/]+ \(([^)]+)\)$~', $folder[0], $m)) {
                        $folder[0] = $m[1];
                        $args['folder'] = $root[0] . implode($delim, $folder);
                    }

                    break;
                }
            }
        }
        else { // dir == 'out'
            foreach ((array) $roots as $root) {
                if (strpos($args['folder'], $root[0]) === 0) {
                    // remove root and explode folder
                    $delim  = $root[1];
                    $folder = explode($delim, substr($args['folder'], strlen($root[0])));

                    // Replace uid with "Doe, Jane (uid)"
                    if ($user = self::folder_id2user($folder[0], true)) {
                        $user      = str_replace($delim, '', $user);
                        $folder[0] = rcube_charset::convert($user, RCUBE_CHARSET, 'UTF7-IMAP');

                        $args['folder'] = $root[0] . implode($delim, $folder);
                    }

                    break;
                }
            }
        }

        return $args;
    }
}
