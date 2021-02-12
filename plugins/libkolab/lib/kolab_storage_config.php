<?php

/**
 * Kolab storage class providing access to configuration objects on a Kolab server.
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

class kolab_storage_config
{
    const FOLDER_TYPE   = 'configuration';
    const MAX_RELATIONS = 499; // should be less than kolab_storage_cache::MAX_RECORDS

    /**
     * Singleton instace of kolab_storage_config
     *
     * @var kolab_storage_config
     */
    static protected $instance;

    private $folders;
    private $default;
    private $enabled;
    private $tags;


    /**
     * This implements the 'singleton' design pattern
     *
     * @return kolab_storage_config The one and only instance
     */
    static function get_instance()
    {
        if (!self::$instance) {
            self::$instance = new kolab_storage_config();
        }

        return self::$instance;
    }

    /**
     * Private constructor (finds default configuration folder as a config source)
     */
    private function _init()
    {
        if ($this->enabled !== null) {
            return $this->enabled;
        }

        // get all configuration folders
        $this->folders = kolab_storage::get_folders(self::FOLDER_TYPE, false);

        foreach ($this->folders as $folder) {
            if ($folder->default) {
                $this->default = $folder;
                break;
            }
        }

        // if no folder is set as default, choose the first one
        if (!$this->default) {
            $this->default = reset($this->folders);
        }

        // attempt to create a default folder if it does not exist
        if (!$this->default) {
            $folder_name = 'Configuration';
            $folder_type = self::FOLDER_TYPE . '.default';

            if (kolab_storage::folder_create($folder_name, $folder_type, true)) {
                $this->default = new kolab_storage_folder($folder_name, $folder_type);
            }
        }

        // check if configuration folder exist
        return $this->enabled = $this->default && $this->default->name;
    }

    /**
     * Check wether any configuration storage (folder) exists
     *
     * @return bool
     */
    public function is_enabled()
    {
        return $this->_init();
    }

    /**
     * Get configuration objects
     *
     * @param array $filter  Search filter
     * @param bool  $default Enable to get objects only from default folder
     * @param int   $limit   Max. number of records (per-folder)
     *
     * @return array List of objects
     */
    public function get_objects($filter = array(), $default = false, $limit = 0)
    {
        $list = array();

        if (!$this->is_enabled()) {
            return $list;
        }

        foreach ($this->folders as $folder) {
            // we only want to read from default folder
            if ($default && !$folder->default) {
                continue;
            }

            // for better performance it's good to assume max. number of records
            if ($limit) {
                $folder->set_order_and_limit(null, $limit);
            }

            foreach ($folder->select($filter, true) as $object) {
                unset($object['_formatobj']);
                $list[] = $object;
            }
        }

        return $list;
    }

    /**
     * Get configuration object
     *
     * @param string $uid     Object UID
     * @param bool   $default Enable to get objects only from default folder
     *
     * @return array Object data
     */
    public function get_object($uid, $default = false)
    {
        if (!$this->is_enabled()) {
            return;
        }

        foreach ($this->folders as $folder) {
            // we only want to read from default folder
            if ($default && !$folder->default) {
                continue;
            }

            if ($object = $folder->get_object($uid)) {
                return $object;
            }
        }
    }

    /**
     * Create/update configuration object
     *
     * @param array  $object Object data
     * @param string $type   Object type
     *
     * @return bool True on success, False on failure
     */
    public function save(&$object, $type)
    {
        if (!$this->is_enabled()) {
            return false;
        }

        $folder = $this->find_folder($object);

        if ($type) {
            $object['type'] = $type;
        }

        $status = $folder->save($object, self::FOLDER_TYPE . '.' . $object['type'], $object['uid']);

        // on success, update cached tags list
        if ($status && $object['category'] == 'tag' && is_array($this->tags)) {
            $found = false;
            unset($object['_formatobj']); // we don't need it anymore

            foreach ($this->tags as $idx => $tag) {
                if ($tag['uid'] == $object['uid']) {
                    $found = true;
                    $this->tags[$idx] = $object;
                }
            }

            if (!$found) {
                $this->tags[] = $object;
            }
        }

        return !empty($status);
    }

    /**
     * Remove configuration object
     *
     * @param string|array $object Object array or its UID
     *
     * @return bool True on success, False on failure
     */
    public function delete($object)
    {
        if (!$this->is_enabled()) {
            return false;
        }

        // fetch the object to find folder
        if (!is_array($object)) {
            $object = $this->get_object($object);
        }

        if (!$object) {
            return false;
        }

        $folder = $this->find_folder($object);
        $status = $folder->delete($object);

        // on success, update cached tags list
        if ($status && is_array($this->tags)) {
            foreach ($this->tags as $idx => $tag) {
                if ($tag['uid'] == $object['uid']) {
                    unset($this->tags[$idx]);
                    break;
                }
            }
        }

        return $status;
    }

    /**
     * Find folder
     */
    public function find_folder($object = array())
    {
        if (!$this->is_enabled()) {
            return;
        }

        // find folder object
        if ($object['_mailbox']) {
            foreach ($this->folders as $folder) {
                if ($folder->name == $object['_mailbox']) {
                    break;
                }
            }
        }
        else {
            $folder = $this->default;
        }

        return $folder;
    }

    /**
     * Builds relation member URI
     *
     * @param string|array Object UUID or Message folder, UID, Search headers (Message-Id, Date)
     *
     * @return string $url Member URI
     */
    public static function build_member_url($params)
    {
        // param is object UUID
        if (is_string($params) && !empty($params)) {
            return 'urn:uuid:' . $params;
        }

        if (empty($params) || !strlen($params['folder'])) {
            return null;
        }

        $rcube   = rcube::get_instance();
        $storage = $rcube->get_storage();
        list($username, $domain) = explode('@', $rcube->get_user_name());

        if (strlen($domain)) {
            $domain = '@' . $domain;
        }

        // modify folder spec. according to namespace
        $folder = $params['folder'];
        $ns     = $storage->folder_namespace($folder);

        if ($ns == 'shared') {
            // Note: this assumes there's only one shared namespace root
            if ($ns = $storage->get_namespace('shared')) {
                if ($prefix = $ns[0][0]) {
                    $folder = substr($folder, strlen($prefix));
                }
            }
        }
        else {
            if ($ns == 'other') {
                // Note: this assumes there's only one other users namespace root
                if ($ns = $storage->get_namespace('other')) {
                    if ($prefix = $ns[0][0]) {
                        list($otheruser, $path) = explode('/', substr($folder, strlen($prefix)), 2);
                        $folder = 'user/' . $otheruser . $domain . '/' . $path;
                    }
                }
            }
            else {
                $folder = 'user/' . $username . $domain . '/' . $folder;
            }
        }

        $folder = implode('/', array_map('rawurlencode', explode('/', $folder)));

        // build URI
        $url = 'imap:///' . $folder;

        // UID is optional here because sometimes we want
        // to build just a member uri prefix
        if ($params['uid']) {
            $url .= '/' . $params['uid'];
        }

        unset($params['folder']);
        unset($params['uid']);

        if (!empty($params)) {
            $url .= '?' . http_build_query($params, '', '&');
        }

        return $url;
    }

    /**
     * Parses relation member string
     *
     * @param string $url Member URI
     *
     * @return array Message folder, UID, Search headers (Message-Id, Date)
     */
    public static function parse_member_url($url)
    {
        // Look for IMAP URI:
        // imap:///(user/username@domain|shared)/<folder>/<UID>?<search_params>
        if (strpos($url, 'imap:///') === 0) {
            $rcube   = rcube::get_instance();
            $storage = $rcube->get_storage();

            // parse_url does not work with imap:/// prefix
            $url   = parse_url(substr($url, 8));
            $path  = explode('/', $url['path']);
            parse_str($url['query'], $params);

            $uid  = array_pop($path);
            $ns   = array_shift($path);
            $path = array_map('rawurldecode', $path);

            // resolve folder name
            if ($ns == 'user') {
                $username = array_shift($path);
                $folder   = implode('/', $path);

                if ($username != $rcube->get_user_name()) {
                    list($user, $domain) = explode('@', $username);

                    // Note: this assumes there's only one other users namespace root
                    if ($ns = $storage->get_namespace('other')) {
                        if ($prefix = $ns[0][0]) {
                            $folder = $prefix . $user . '/' . $folder;
                        }
                    }
                }
                else if (!strlen($folder)) {
                    $folder = 'INBOX';
                }
            }
            else {
                $folder = $ns . '/' . implode('/', $path);
                // Note: this assumes there's only one shared namespace root
                if ($ns = $storage->get_namespace('shared')) {
                    if ($prefix = $ns[0][0]) {
                        $folder = $prefix . $folder;
                    }
                }
            }

            return array(
                'folder' => $folder,
                'uid'    => $uid,
                'params' => $params,
            );
        }

        return false;
    }

    /**
     * Build array of member URIs from set of messages
     *
     * @param string $folder   Folder name
     * @param array  $messages Array of rcube_message objects
     *
     * @return array List of members (IMAP URIs)
     */
    public static function build_members($folder, $messages)
    {
        $members = array();

        foreach ((array) $messages as $msg) {
            $params = array(
                'folder' => $folder,
                'uid'    => $msg->uid,
            );

            // add search parameters:
            // we don't want to build "invalid" searches e.g. that
            // will return false positives (more or wrong messages)
            if (($messageid = $msg->get('message-id', false)) && ($date = $msg->get('date', false))) {
                $params['message-id'] = $messageid;
                $params['date']       = $date;

                if ($subject = $msg->get('subject', false)) {
                    $params['subject'] = substr($subject, 0, 256);
                }
            }

            $members[] = self::build_member_url($params);
        }

        return $members;
    }

    /**
     * Resolve/validate/update members (which are IMAP URIs) of relation object.
     *
     * @param array $tag   Tag object
     * @param bool  $force Force members list update
     *
     * @return array Folder/UIDs list
     */
    public static function resolve_members(&$tag, $force = true)
    {
        $result = array();

        foreach ((array) $tag['members'] as $member) {
            // IMAP URI members
            if ($url = self::parse_member_url($member)) {
                $folder = $url['folder'];

                if (!$force) {
                    $result[$folder][] = $url['uid'];
                }
                else {
                    $result[$folder]['uid'][]    = $url['uid'];
                    $result[$folder]['params'][] = $url['params'];
                    $result[$folder]['member'][] = $member;
                }
            }
        }

        if (empty($result) || !$force) {
            return $result;
        }

        $rcube   = rcube::get_instance();
        $storage = $rcube->get_storage();
        $search  = array();
        $missing = array();

        // first we search messages by Folder+UID
        foreach ($result as $folder => $data) {
            // @FIXME: maybe better use index() which is cached?
            // @TODO: consider skip_deleted option
            $index = $storage->search_once($folder, 'UID ' . rcube_imap_generic::compressMessageSet($data['uid']));
            $uids  = $index->get();

            // messages that were not found need to be searched by search parameters
            $not_found = array_diff($data['uid'], $uids);
            if (!empty($not_found)) {
                foreach ($not_found as $uid) {
                    $idx = array_search($uid, $data['uid']);

                    if ($p = $data['params'][$idx]) {
                        $search[] = $p;
                    }

                    $missing[] = $result[$folder]['member'][$idx];

                    unset($result[$folder]['uid'][$idx]);
                    unset($result[$folder]['params'][$idx]);
                    unset($result[$folder]['member'][$idx]);
                }
            }

            $result[$folder] = $uids;
        }

        // search in all subscribed mail folders using search parameters
        if (!empty($search)) {
            // remove not found members from the members list
            $tag['members'] = array_diff($tag['members'], $missing);

            // get subscribed folders
            $folders = $storage->list_folders_subscribed('', '*', 'mail', null, true);

            // @TODO: do this search in chunks (for e.g. 10 messages)?
            $search_str = '';

            foreach ($search as $p) {
                $search_params = array();
                foreach ($p as $key => $val) {
                    $key = strtoupper($key);
                    // don't search by subject, we don't want false-positives
                    if ($key != 'SUBJECT') {
                        $search_params[] = 'HEADER ' . $key . ' ' . rcube_imap_generic::escape($val);
                    }
                }

                $search_str .= ' (' . implode(' ', $search_params) . ')';
            }

            $search_str = trim(str_repeat(' OR', count($search)-1) . $search_str);

            // search
            $search = $storage->search_once($folders, $search_str);

            // handle search result
            $folders = (array) $search->get_parameters('MAILBOX');

            foreach ($folders as $folder) {
                $set  = $search->get_set($folder);
                $uids = $set->get();

                if (!empty($uids)) {
                    $msgs    = $storage->fetch_headers($folder, $uids, false);
                    $members = self::build_members($folder, $msgs);

                    // merge new members into the tag members list
                    $tag['members'] = array_merge($tag['members'], $members);

                    // add UIDs into the result
                    $result[$folder] = array_unique(array_merge((array)$result[$folder], $uids));
                }
            }

            // update tag object with new members list
            $tag['members'] = array_unique($tag['members']);
            kolab_storage_config::get_instance()->save($tag, 'relation', false);
        }

        return $result;
    }

    /**
     * Assign tags to kolab objects
     *
     * @param array $records   List of kolab objects
     * @param bool  $no_return Don't return anything
     *
     * @return array List of tags
     */
    public function apply_tags(&$records, $no_return = false)
    {
        if (empty($records) && $no_return) {
            return;
        }

        // first convert categories into tags
        foreach ($records as $i => $rec) {
            if (!empty($rec['categories'])) {
                $folder = new kolab_storage_folder($rec['_mailbox']);
                if ($object = $folder->get_object($rec['uid'])) {
                    $tags = $rec['categories'];

                    unset($object['categories']);
                    unset($records[$i]['categories']);

                    $this->save_tags($rec['uid'], $tags);
                    $folder->save($object, $rec['_type'], $rec['uid']);
                }
            }
        }

        $tags = array();

        // assign tags to objects
        foreach ($this->get_tags() as $tag) {
            foreach ($records as $idx => $rec) {
                $uid = self::build_member_url($rec['uid']);
                if (in_array($uid, (array) $tag['members'])) {
                    $records[$idx]['tags'][] = $tag['name'];
                }
            }

            $tags[] = $tag['name'];
        }

        $tags = $no_return ? null : array_unique($tags);

        return $tags;
    }

    /**
     * Assign links (relations) to kolab objects
     *
     * @param array $records List of kolab objects
     */
    public function apply_links(&$records)
    {
        $links = array();
        $uids  = array();
        $ids   = array();
        $limit = 25;

        // get list of object UIDs and UIRs map
        foreach ($records as $i => $rec) {
            $uids[] = $rec['uid'];
            // there can be many objects with the same uid (recurring events)
            $ids[self::build_member_url($rec['uid'])][] = $i;
            $records[$i]['links'] = array();
        }

        if (!empty($uids)) {
            $uids = array_unique($uids);
        }

        // The whole story here is to not do SELECT for every object.
        // We'll build one SELECT for many (limit above) objects at once

        while (!empty($uids)) {
            $chunk = array_splice($uids, 0, $limit);
            $chunk = array_map(function($v) { return array('member', '=', $v); }, $chunk);

            $filter = array(
                array('type', '=', 'relation'),
                array('category', '=', 'generic'),
                array($chunk, 'OR'),
            );

            $relations = $this->get_objects($filter, true, self::MAX_RELATIONS);

            foreach ($relations as $relation) {
                $links[$relation['uid']] = $relation;
            }
        }

        if (empty($links)) {
            return;
        }

        // assign links of related messages
        foreach ($links as $relation) {
            // make relation members up-to-date
            kolab_storage_config::resolve_members($relation);

            $members = array();
            foreach ((array) $relation['members'] as $member) {
                if (strpos($member, 'imap://') === 0) {
                    $members[$member] = $member;
                }
            }
            $members = array_values($members);

            // assign links to objects
            foreach ((array) $relation['members'] as $member) {
                if (($id = $ids[$member]) !== null) {
                    foreach ($id as $i) {
                        $records[$i]['links'] = array_unique(array_merge($records[$i]['links'], $members));
                    }
                }
            }
        }
    }

    /**
     * Update object tags
     *
     * @param string $uid  Kolab object UID
     * @param array  $tags List of tag names
     */
    public function save_tags($uid, $tags)
    {
        $url       = self::build_member_url($uid);
        $relations = $this->get_tags();

        foreach ($relations as $idx => $relation) {
            $selected = !empty($tags) && in_array($relation['name'], $tags);
            $found    = !empty($relation['members']) && in_array($url, $relation['members']);
            $update   = false;

            // remove member from the relation
            if ($found && !$selected) {
                $relation['members'] = array_diff($relation['members'], (array) $url);
                $update = true;
            }
            // add member to the relation
            else if (!$found && $selected) {
                $relation['members'][] = $url;
                $update = true;
            }

            if ($update) {
                $this->save($relation, 'relation');
            }

            if ($selected) {
                $tags = array_diff($tags, array($relation['name']));
            }
        }

        // create new relations
        if (!empty($tags)) {
            foreach ($tags as $tag) {
                $relation = array(
                    'name'     => $tag,
                    'members'  => (array) $url,
                    'category' => 'tag',
                );

                $this->save($relation, 'relation');
            }
        }
    }

    /**
     * Get tags (all or referring to specified object)
     *
     * @param string $member Optional object UID or mail message-id
     *
     * @return array List of Relation objects
     */
    public function get_tags($member = '*')
    {
        if (!isset($this->tags)) {
            $default = true;
            $filter  = array(
                array('type', '=', 'relation'),
                array('category', '=', 'tag')
            );

            // use faster method
            if ($member && $member != '*') {
                $filter[] = array('member', '=', $member);
                $tags = $this->get_objects($filter, $default, self::MAX_RELATIONS);
            }
            else {
                $this->tags = $tags = $this->get_objects($filter, $default, self::MAX_RELATIONS);
            }
        }
        else {
            $tags = $this->tags;
        }

        if ($member === '*') {
            return $tags;
        }

        $result = array();

        if ($member[0] == '<') {
            $search_msg = urlencode($member);
        }
        else {
            $search_uid = self::build_member_url($member);
        }

        foreach ($tags as $tag) {
            if ($search_uid && in_array($search_uid, (array) $tag['members'])) {
                $result[] = $tag;
            }
            else if ($search_msg) {
                foreach ($tag['members'] as $m) {
                    if (strpos($m, $search_msg) !== false) {
                        $result[] = $tag;
                        break;
                    }
                }
            }
        }

        return $result;
    }

    /**
     * Find objects linked with the given groupware object through a relation
     *
     * @param string Object UUID
     *
     * @return array List of related URIs
     */
    public function get_object_links($uid)
    {
        $links = array();
        $object_uri = self::build_member_url($uid);

        foreach ($this->get_relations_for_member($uid) as $relation) {
            if (in_array($object_uri, (array) $relation['members'])) {
                // make relation members up-to-date
                kolab_storage_config::resolve_members($relation);

                foreach ($relation['members'] as $member) {
                    if ($member != $object_uri) {
                        $links[] = $member;
                    }
                }
            }
        }

        return array_unique($links);
    }

    /**
     * Save relations of an object.
     * Note, that we already support only one-to-one relations.
     * So, all relations to the object that are not provided in $links
     * argument will be removed.
     *
     * @param string $uid   Object UUID
     * @param array  $links List of related-object URIs
     *
     * @return bool True on success, False on failure
     */
    public function save_object_links($uid, $links)
    {
        $object_uri = self::build_member_url($uid);
        $relations  = $this->get_relations_for_member($uid);
        $done       = false;

        foreach ($relations as $relation) {
            // make relation members up-to-date
            kolab_storage_config::resolve_members($relation);

            // remove and add links
            $members = array($object_uri);
            $members = array_unique(array_merge($members, $links));

            // remove relation if no other members remain
            if (count($members) <= 1) {
                $done = $this->delete($relation);
            }
            // update relation object if members changed
            else if (count(array_diff($members, $relation['members'])) || count(array_diff($relation['members'], $members))) {
                $relation['members'] = $members;
                $done = $this->save($relation, 'relation');
                $links = array();
            }
            // no changes, we're happy
            else {
                $done  = true;
                $links = array();
            }
        }

        // create a new relation
        if (!$done && !empty($links)) {
            $relation = array(
                'members'  => array_merge($links, array($object_uri)),
                'category' => 'generic',
            );

            $done = $this->save($relation, 'relation');
        }

        return $done;
    }

    /**
     * Find relation objects referring to specified note
     */
    public function get_relations_for_member($uid, $reltype = 'generic')
    {
        $default = true;
        $filter  = array(
            array('type', '=', 'relation'),
            array('category', '=', $reltype),
            array('member', '=', $uid),
        );

        return $this->get_objects($filter, $default, self::MAX_RELATIONS);
    }

    /**
     * Find kolab objects assigned to specified e-mail message
     *
     * @param rcube_message $message E-mail message
     * @param string        $folder  Folder name
     * @param string        $type    Result objects type
     *
     * @return array List of kolab objects
     */
    public function get_message_relations($message, $folder, $type)
    {
        static $_cache = array();

        $result  = array();
        $uids    = array();
        $default = true;
        $uri     = self::get_message_uri($message, $folder);
        $filter  = array(
            array('type', '=', 'relation'),
            array('category', '=', 'generic'),
        );

        // query by message-id
        $member_id = $message->get('message-id', false);
        if (empty($member_id)) {
            // derive message identifier from URI
            $member_id = md5($uri);
        }
        $filter[] = array('member', '=', $member_id);

        if (!isset($_cache[$uri])) {
            // get UIDs of related groupware objects
            foreach ($this->get_objects($filter, $default) as $relation) {
                // we don't need to update members if the URI is found
                if (!in_array($uri, $relation['members'])) {
                    // update members...
                    $messages = kolab_storage_config::resolve_members($relation);
                    // ...and check again
                    if (empty($messages[$folder]) || !in_array($message->uid, $messages[$folder])) {
                        continue;
                    }
                }

                // find groupware object UID(s)
                foreach ($relation['members'] as $member) {
                    if (strpos($member, 'urn:uuid:') === 0) {
                        $uids[] = substr($member, 9);
                    }
                }
            }

            // remember this lookup
            $_cache[$uri] = $uids;
        }
        else {
            $uids = $_cache[$uri];
        }

        // get kolab objects of specified type
        if (!empty($uids)) {
            $query  = array(array('uid', '=', array_unique($uids)));
            $result = kolab_storage::select($query, $type, count($uids));
        }

        return $result;
    }

    /**
     * Build a URI representing the given message reference
     */
    public static function get_message_uri($headers, $folder)
    {
        $params = array(
            'folder' => $headers->folder ?: $folder,
            'uid'    => $headers->uid,
        );

        if (($messageid = $headers->get('message-id', false)) && ($date = $headers->get('date', false))) {
            $params['message-id'] = $messageid;
            $params['date']       = $date;

            if ($subject = $headers->get('subject')) {
                $params['subject'] = $subject;
            }
        }

        return self::build_member_url($params);
    }

    /**
     * Resolve the email message reference from the given URI
     */
    public static function get_message_reference($uri, $rel = null)
    {
        if ($linkref = self::parse_member_url($uri)) {
            $linkref['subject'] = $linkref['params']['subject'];
            $linkref['uri']     = $uri;

            $rcmail = rcube::get_instance();
            if (method_exists($rcmail, 'url')) {
                $linkref['mailurl'] = $rcmail->url(array(
                    'task'   => 'mail',
                    'action' => 'show',
                    'mbox'   => $linkref['folder'],
                    'uid'    => $linkref['uid'],
                    'rel'    => $rel,
                ));
            }

            unset($linkref['params']);
        }

        return $linkref;
    }
}
