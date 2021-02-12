<?php

/**
 * Kolab storage cache class providing a local caching layer for Kolab groupware objects.
 *
 * @version @package_version@
 * @author Thomas Bruederli <bruederli@kolabsys.com>
 *
 * Copyright (C) 2012-2013, Kolab Systems AG <contact@kolabsys.com>
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

class kolab_storage_cache
{
    const DB_DATE_FORMAT = 'Y-m-d H:i:s';
    const MAX_RECORDS    = 500;

    public $sync_complete = false;

    protected $db;
    protected $imap;
    protected $folder;
    protected $uid2msg;
    protected $objects;
    protected $metadata = array();
    protected $folder_id;
    protected $resource_uri;
    protected $enabled = true;
    protected $synched = false;
    protected $synclock = false;
    protected $ready = false;
    protected $cache_table;
    protected $cache_refresh = 3600;
    protected $folders_table;
    protected $max_sql_packet;
    protected $max_sync_lock_time = 600;
    protected $extra_cols = array();
    protected $data_props = array();
    protected $order_by = null;
    protected $limit = null;
    protected $error = 0;
    protected $server_timezone;


    /**
     * Factory constructor
     */
    public static function factory(kolab_storage_folder $storage_folder)
    {
        $subclass = 'kolab_storage_cache_' . $storage_folder->type;
        if (class_exists($subclass)) {
            return new $subclass($storage_folder);
        }
        else {
            rcube::raise_error(array(
                'code' => 900,
                'type' => 'php',
                'message' => "No kolab_storage_cache class found for folder '$storage_folder->name' of type '$storage_folder->type'"
            ), true);

            return new kolab_storage_cache($storage_folder);
        }
    }


    /**
     * Default constructor
     */
    public function __construct(kolab_storage_folder $storage_folder = null)
    {
        $rcmail = rcube::get_instance();
        $this->db = $rcmail->get_dbh();
        $this->imap = $rcmail->get_storage();
        $this->enabled = $rcmail->config->get('kolab_cache', false);
        $this->folders_table = $this->db->table_name('kolab_folders');
        $this->cache_refresh = get_offset_sec($rcmail->config->get('kolab_cache_refresh', '12h'));
        $this->server_timezone = new DateTimeZone(date_default_timezone_get());

        if ($this->enabled) {
            // always read folder cache and lock state from DB master
            $this->db->set_table_dsn('kolab_folders', 'w');
            // remove sync-lock on script termination
            $rcmail->add_shutdown_function(array($this, '_sync_unlock'));
        }

        if ($storage_folder)
            $this->set_folder($storage_folder);
    }

    /**
     * Direct access to cache by folder_id
     * (only for internal use)
     */
    public function select_by_id($folder_id)
    {
        $sql_arr = $this->db->fetch_assoc($this->db->query("SELECT * FROM `{$this->folders_table}` WHERE `folder_id` = ?", $folder_id));
        if ($sql_arr) {
            $this->metadata = $sql_arr;
            $this->folder_id = $sql_arr['folder_id'];
            $this->folder = new StdClass;
            $this->folder->type = $sql_arr['type'];
            $this->resource_uri = $sql_arr['resource'];
            $this->cache_table = $this->db->table_name('kolab_cache_' . $sql_arr['type']);
            $this->ready = true;
        }
    }

    /**
     * Connect cache with a storage folder
     *
     * @param kolab_storage_folder The storage folder instance to connect with
     */
    public function set_folder(kolab_storage_folder $storage_folder)
    {
        $this->folder = $storage_folder;

        if (empty($this->folder->name) || !$this->folder->valid) {
            $this->ready = false;
            return;
        }

        // compose fully qualified ressource uri for this instance
        $this->resource_uri = $this->folder->get_resource_uri();
        $this->cache_table = $this->db->table_name('kolab_cache_' . $this->folder->type);
        $this->ready = $this->enabled && !empty($this->folder->type);
        $this->folder_id = null;
    }

    /**
     * Returns true if this cache supports query by type
     */
    public function has_type_col()
    {
        return in_array('type', $this->extra_cols);
    }

    /**
     * Getter for the numeric ID used in cache tables
     */
    public function get_folder_id()
    {
        $this->_read_folder_data();
        return $this->folder_id;
    }

    /**
     * Returns code of last error
     *
     * @return int Error code
     */
    public function get_error()
    {
        return $this->error;
    }

    /**
     * Synchronize local cache data with remote
     */
    public function synchronize()
    {
        // only sync once per request cycle
        if ($this->synched)
            return;

        // increase time limit
        @set_time_limit($this->max_sync_lock_time - 60);

        // get effective time limit we have for synchronization (~70% of the execution time)
        $time_limit = ini_get('max_execution_time') * 0.7;
        $sync_start = time();

        // assume sync will be completed
        $this->sync_complete = true;

        if (!$this->ready) {
            // kolab cache is disabled, synchronize IMAP mailbox cache only
            $this->imap_mode(true);
            $this->imap->folder_sync($this->folder->name);
            $this->imap_mode(false);
        }
        else {
            // read cached folder metadata
            $this->_read_folder_data();

            // check cache status ($this->metadata is set in _read_folder_data())
            if (  empty($this->metadata['ctag']) ||
                  empty($this->metadata['changed']) ||
                  $this->metadata['objectcount'] === null ||
                  $this->metadata['changed'] < date(self::DB_DATE_FORMAT, time() - $this->cache_refresh) ||
                  $this->metadata['ctag'] != $this->folder->get_ctag() ||
                  intval($this->metadata['objectcount']) !== $this->count()
            ) {
                // lock synchronization for this folder or wait if locked
                $this->_sync_lock();

                // disable messages cache if configured to do so
                $this->imap_mode(true);

                // synchronize IMAP mailbox cache
                $this->imap->folder_sync($this->folder->name);

                // compare IMAP index with object cache index
                $imap_index = $this->imap->index($this->folder->name, null, null, true, true);

                $this->imap_mode(false);

                // determine objects to fetch or to invalidate
                if (!$imap_index->is_error()) {
                    $imap_index = $imap_index->get();
                    $old_index  = array();
                    $del_index  = array();

                    // read cache index
                    $sql_result = $this->db->query(
                        "SELECT `msguid`, `uid` FROM `{$this->cache_table}` WHERE `folder_id` = ?"
                            . " ORDER BY `msguid` DESC", $this->folder_id
                    );

                    while ($sql_arr = $this->db->fetch_assoc($sql_result)) {
                        // Mark all duplicates for removal (note sorting order above)
                        // Duplicates here should not happen, but they do sometimes
                        if (isset($old_index[$sql_arr['uid']])) {
                            $del_index[] = $sql_arr['msguid'];
                        }
                        else {
                            $old_index[$sql_arr['uid']] = $sql_arr['msguid'];
                        }
                    }

                    // fetch new objects from imap
                    $i = 0;
                    foreach (array_diff($imap_index, $old_index) as $msguid) {
                        // Note: We'll store only objects matching the folder type
                        // anything else will be silently ignored
                        if ($object = $this->folder->read_object($msguid)) {
                            // Deduplication: remove older objects with the same UID
                            // Here we do not resolve conflicts, we just make sure
                            // the most recent version of the object will be used
                            if ($old_msguid = $old_index[$object['uid']]) {
                                if ($old_msguid < $msguid) {
                                    $del_index[] = $old_msguid;
                                }
                                else {
                                    $del_index[] = $msguid;
                                    continue;
                                }
                            }

                            $old_index[$object['uid']] = $msguid;

                            $this->_extended_insert($msguid, $object);

                            // check time limit and abort sync if running too long
                            if (++$i % 50 == 0 && time() - $sync_start > $time_limit) {
                                $this->sync_complete = false;
                                break;
                            }
                        }
                    }
                    $this->_extended_insert(0, null);

                    $del_index = array_unique($del_index);

                    // delete duplicate entries from IMAP
                    $rem_index = array_intersect($del_index, $imap_index);
                    if (!empty($rem_index)) {
                        $this->imap_mode(true);
                        $this->imap->delete_message($rem_index, $this->folder->name);
                        $this->imap_mode(false);
                    }

                    // delete old/invalid entries from the cache
                    $del_index += array_diff($old_index, $imap_index);
                    if (!empty($del_index)) {
                        $quoted_ids = join(',', array_map(array($this->db, 'quote'), $del_index));
                        $this->db->query(
                            "DELETE FROM `{$this->cache_table}` WHERE `folder_id` = ? AND `msguid` IN ($quoted_ids)",
                            $this->folder_id
                        );
                    }

                    // update ctag value (will be written to database in _sync_unlock())
                    if ($this->sync_complete) {
                        $this->metadata['ctag'] = $this->folder->get_ctag();
                        $this->metadata['changed'] = date(self::DB_DATE_FORMAT, time());
                        // remember the number of cache entries linked to this folder
                        $this->metadata['objectcount'] = $this->count();
                    }
                }

                // remove lock
                $this->_sync_unlock();
            }
        }

        $this->check_error();
        $this->synched = time();
    }


    /**
     * Read a single entry from cache or from IMAP directly
     *
     * @param string Related IMAP message UID
     * @param string Object type to read
     * @param string IMAP folder name the entry relates to
     * @param array  Hash array with object properties or null if not found
     */
    public function get($msguid, $type = null, $foldername = null)
    {
        // delegate to another cache instance
        if ($foldername && $foldername != $this->folder->name) {
            $success = false;
            if ($targetfolder = kolab_storage::get_folder($foldername)) {
                $success = $targetfolder->cache->get($msguid, $type);
                $this->error = $targetfolder->cache->get_error();
            }
            return $success;
        }

        // load object if not in memory
        if (!isset($this->objects[$msguid])) {
            if ($this->ready) {
                $this->_read_folder_data();

                $sql_result = $this->db->query(
                    "SELECT * FROM `{$this->cache_table}` ".
                    "WHERE `folder_id` = ? AND `msguid` = ?",
                    $this->folder_id,
                    $msguid
                );

                if ($sql_arr = $this->db->fetch_assoc($sql_result)) {
                    $this->objects = array($msguid => $this->_unserialize($sql_arr));  // store only this object in memory (#2827)
                }
            }

            // fetch from IMAP if not present in cache
            if (empty($this->objects[$msguid])) {
                if ($object = $this->folder->read_object($msguid, $type ?: '*', $foldername)) {
                    $this->objects = array($msguid => $object);
                    $this->set($msguid, $object);
                }
            }
        }

        $this->check_error();
        return $this->objects[$msguid];
    }

    /**
     * Getter for a single Kolab object identified by its UID
     *
     * @param string $uid Object UID
     *
     * @return array The Kolab object represented as hash array
     */
    public function get_by_uid($uid)
    {
        $old_order_by = $this->order_by;
        $old_limit    = $this->limit;

        // set order to make sure we get most recent object version
        // set limit to skip count query
        $this->order_by = '`msguid` DESC';
        $this->limit    = array(1, 0);

        $list = $this->select(array(array('uid', '=', $uid)));

        // set the order/limit back to defined value
        $this->order_by = $old_order_by;
        $this->limit    = $old_limit;

        if (!empty($list) && !empty($list[0])) {
            return $list[0];
        }
    }

    /**
     * Insert/Update a cache entry
     *
     * @param string Related IMAP message UID
     * @param mixed  Hash array with object properties to save or false to delete the cache entry
     * @param string IMAP folder name the entry relates to
     */
    public function set($msguid, $object, $foldername = null)
    {
        if (!$msguid) {
            return;
        }

        // delegate to another cache instance
        if ($foldername && $foldername != $this->folder->name) {
          if ($targetfolder = kolab_storage::get_folder($foldername)) {
              $targetfolder->cache->set($msguid, $object);
              $this->error = $targetfolder->cache->get_error();
          }
          return;
        }

        // remove old entry
        if ($this->ready) {
            $this->_read_folder_data();
            $this->db->query("DELETE FROM `{$this->cache_table}` WHERE `folder_id` = ? AND `msguid` = ?",
                $this->folder_id, $msguid);
        }

        if ($object) {
            // insert new object data...
            $this->save($msguid, $object);
        }
        else {
            // ...or set in-memory cache to false
            $this->objects[$msguid] = $object;
        }

        $this->check_error();
    }


    /**
     * Insert (or update) a cache entry
     *
     * @param int    Related IMAP message UID
     * @param mixed  Hash array with object properties to save or false to delete the cache entry
     * @param int    Optional old message UID (for update)
     */
    public function save($msguid, $object, $olduid = null)
    {
        // write to cache
        if ($this->ready) {
            $this->_read_folder_data();

            $sql_data = $this->_serialize($object);
            $sql_data['folder_id'] = $this->folder_id;
            $sql_data['msguid']    = $msguid;
            $sql_data['uid']       = $object['uid'];

            $args = array();
            $cols = array('folder_id', 'msguid', 'uid', 'changed', 'data', 'tags', 'words');
            $cols = array_merge($cols, $this->extra_cols);

            foreach ($cols as $idx => $col) {
                $cols[$idx] = $this->db->quote_identifier($col);
                $args[]     = $sql_data[$col];
            }

            if ($olduid) {
                foreach ($cols as $idx => $col) {
                    $cols[$idx] = "$col = ?";
                }

                $query = "UPDATE `{$this->cache_table}` SET " . implode(', ', $cols)
                    . " WHERE `folder_id` = ? AND `msguid` = ?";
                $args[] = $this->folder_id;
                $args[] = $olduid;
            }
            else {
                $query = "INSERT INTO `{$this->cache_table}` (`created`, " . implode(', ', $cols)
                    . ") VALUES (" . $this->db->now() . str_repeat(', ?', count($cols)) . ")";
            }

            $result = $this->db->query($query, $args);

            if (!$this->db->affected_rows($result)) {
                rcube::raise_error(array(
                    'code' => 900, 'type' => 'php',
                    'message' => "Failed to write to kolab cache"
                ), true);
            }
        }

        // keep a copy in memory for fast access
        $this->objects = array($msguid => $object);
        $this->uid2msg = array($object['uid'] => $msguid);

        $this->check_error();
    }


    /**
     * Move an existing cache entry to a new resource
     *
     * @param string               Entry's IMAP message UID
     * @param string               Entry's Object UID
     * @param kolab_storage_folder Target storage folder instance
     * @param string               Target entry's IMAP message UID
     */
    public function move($msguid, $uid, $target, $new_msguid = null)
    {
        if ($this->ready && $target) {
            // clear cached uid mapping and force new lookup
            unset($target->cache->uid2msg[$uid]);

            // resolve new message UID in target folder
            if (!$new_msguid) {
                $new_msguid = $target->cache->uid2msguid($uid);
            }

            if ($new_msguid) {
                $this->_read_folder_data();

                $this->db->query(
                    "UPDATE `{$this->cache_table}` SET `folder_id` = ?, `msguid` = ? ".
                    "WHERE `folder_id` = ? AND `msguid` = ?",
                    $target->cache->get_folder_id(),
                    $new_msguid,
                    $this->folder_id,
                    $msguid
                );

                $result = $this->db->affected_rows();
            }
        }

        if (empty($result)) {
            // just clear cache entry
            $this->set($msguid, false);
        }

        unset($this->uid2msg[$uid]);
        $this->check_error();
    }


    /**
     * Remove all objects from local cache
     */
    public function purge()
    {
        if (!$this->ready) {
            return true;
        }

        $this->_read_folder_data();

        $result = $this->db->query(
            "DELETE FROM `{$this->cache_table}` WHERE `folder_id` = ?",
            $this->folder_id
        );

        return $this->db->affected_rows($result);
    }

    /**
     * Update resource URI for existing cache entries
     *
     * @param string Target IMAP folder to move it to
     */
    public function rename($new_folder)
    {
        if (!$this->ready) {
            return;
        }

        if ($target = kolab_storage::get_folder($new_folder)) {
            // resolve new message UID in target folder
            $this->db->query(
                "UPDATE `{$this->folders_table}` SET `resource` = ? ".
                "WHERE `resource` = ?",
                $target->get_resource_uri(),
                $this->resource_uri
            );

            $this->check_error();
        }
        else {
            $this->error = kolab_storage::ERROR_IMAP_CONN;
        }
    }

    /**
     * Select Kolab objects filtered by the given query
     *
     * @param array Pseudo-SQL query as list of filter parameter triplets
     *   triplet: array('<colname>', '<comparator>', '<value>')
     * @param boolean Set true to only return UIDs instead of complete objects
     * @param boolean Use fast mode to fetch only minimal set of information
     *                (no xml fetching and parsing, etc.)
     *
     * @return array List of Kolab data objects (each represented as hash array) or UIDs
     */
    public function select($query = array(), $uids = false, $fast = false)
    {
        $result = $uids ? array() : new kolab_storage_dataset($this);

        // read from local cache DB (assume it to be synchronized)
        if ($this->ready) {
            $this->_read_folder_data();

            // fetch full object data on one query if a small result set is expected
            $fetchall = !$uids && ($this->limit ? $this->limit[0] : ($count = $this->count($query))) < self::MAX_RECORDS;

            // skip SELECT if we know it will return nothing
            if ($count === 0) {
                return $result;
            }

            $sql_query = "SELECT " . ($fetchall ? '*' : "`msguid` AS `_msguid`, `uid`")
                . " FROM `{$this->cache_table}` WHERE `folder_id` = ?"
                . $this->_sql_where($query)
                . (!empty($this->order_by) ? " ORDER BY " . $this->order_by : '');

            $sql_result = $this->limit ?
                $this->db->limitquery($sql_query, $this->limit[1], $this->limit[0], $this->folder_id) :
                $this->db->query($sql_query, $this->folder_id);

            if ($this->db->is_error($sql_result)) {
                if ($uids) {
                    return null;
                }
                $result->set_error(true);
                return $result;
            }

            while ($sql_arr = $this->db->fetch_assoc($sql_result)) {
                if ($fast) {
                    $sql_arr['fast-mode'] = true;
                }
                if ($uids) {
                    $this->uid2msg[$sql_arr['uid']] = $sql_arr['_msguid'];
                    $result[] = $sql_arr['uid'];
                }
                else if ($fetchall && ($object = $this->_unserialize($sql_arr))) {
                    $result[] = $object;
                }
                else if (!$fetchall) {
                    // only add msguid to dataset index
                    $result[] = $sql_arr;
                }
            }
        }
        // use IMAP
        else {
            $filter = $this->_query2assoc($query);

            $this->imap_mode(true);

            if ($filter['type']) {
                $search = 'UNDELETED HEADER X-Kolab-Type ' . kolab_format::KTYPE_PREFIX . $filter['type'];
                $index  = $this->imap->search_once($this->folder->name, $search);
            }
            else {
                $index = $this->imap->index($this->folder->name, null, null, true, true);
            }

            $this->imap_mode(false);

            if ($index->is_error()) {
                $this->check_error();
                if ($uids) {
                    return null;
                }
                $result->set_error(true);
                return $result;
            }

            $index  = $index->get();
            $result = $uids ? $index : $this->_fetch($index, $filter['type']);

            // TODO: post-filter result according to query
        }

        // We don't want to cache big results in-memory, however
        // if we select only one object here, there's a big chance we will need it later
        if (!$uids && count($result) == 1) {
            if ($msguid = $result[0]['_msguid']) {
                $this->uid2msg[$result[0]['uid']] = $msguid;
                $this->objects = array($msguid => $result[0]);
            }
        }

        $this->check_error();

        return $result;
    }

    /**
     * Get number of objects mathing the given query
     *
     * @param array  $query Pseudo-SQL query as list of filter parameter triplets
     * @return integer The number of objects of the given type
     */
    public function count($query = array())
    {
        // read from local cache DB (assume it to be synchronized)
        if ($this->ready) {
            $this->_read_folder_data();

            $sql_result = $this->db->query(
                "SELECT COUNT(*) AS `numrows` FROM `{$this->cache_table}` ".
                "WHERE `folder_id` = ?" . $this->_sql_where($query),
                $this->folder_id
            );

            if ($this->db->is_error($sql_result)) {
                return null;
            }

            $sql_arr = $this->db->fetch_assoc($sql_result);
            $count   = intval($sql_arr['numrows']);
        }
        // use IMAP
        else {
            $filter = $this->_query2assoc($query);

            $this->imap_mode(true);

            if ($filter['type']) {
                $search = 'UNDELETED HEADER X-Kolab-Type ' . kolab_format::KTYPE_PREFIX . $filter['type'];
                $index  = $this->imap->search_once($this->folder->name, $search);
            }
            else {
                $index = $this->imap->index($this->folder->name, null, null, true, true);
            }

            $this->imap_mode(false);

            if ($index->is_error()) {
                $this->check_error();
                return null;
            }

            // TODO: post-filter result according to query

            $count = $index->count();
        }

        $this->check_error();
        return $count;
    }

    /**
     * Define ORDER BY clause for cache queries
     */
    public function set_order_by($sortcols)
    {
        if (!empty($sortcols)) {
            $sortcols = array_map(function($v) {
                list($column, $order) = explode(' ', $v, 2);
                return "`$column`" . ($order ? " $order" : '');
            }, (array) $sortcols);

            $this->order_by = join(', ', $sortcols);
        }
        else {
            $this->order_by = null;
        }
    }

    /**
     * Define LIMIT clause for cache queries
     */
    public function set_limit($length, $offset = 0)
    {
        $this->limit = array($length, $offset);
    }

    /**
     * Helper method to compose a valid SQL query from pseudo filter triplets
     */
    protected function _sql_where($query)
    {
        $sql_where = '';
        foreach ((array) $query as $param) {
            if (is_array($param[0])) {
                $subq = array();
                foreach ($param[0] as $q) {
                    $subq[] = preg_replace('/^\s*AND\s+/i', '', $this->_sql_where(array($q)));
                }
                if (!empty($subq)) {
                    $sql_where .= ' AND (' . implode($param[1] == 'OR' ? ' OR ' : ' AND ', $subq) . ')';
                }
                continue;
            }
            else if ($param[1] == '=' && is_array($param[2])) {
                $qvalue = '(' . join(',', array_map(array($this->db, 'quote'), $param[2])) . ')';
                $param[1] = 'IN';
            }
            else if ($param[1] == '~' || $param[1] == 'LIKE' || $param[1] == '!~' || $param[1] == '!LIKE') {
                $not = ($param[1] == '!~' || $param[1] == '!LIKE') ? 'NOT ' : '';
                $param[1] = $not . 'LIKE';
                $qvalue = $this->db->quote('%'.preg_replace('/(^\^|\$$)/', ' ', $param[2]).'%');
            }
            else if ($param[1] == '~*' || $param[1] == '!~*') {
                $not = $param[1][1] == '!' ? 'NOT ' : '';
                $param[1] = $not . 'LIKE';
                $qvalue = $this->db->quote(preg_replace('/(^\^|\$$)/', ' ', $param[2]).'%');
            }
            else if ($param[0] == 'tags') {
                $param[1] = ($param[1] == '!=' ? 'NOT ' : '' ) . 'LIKE';
                $qvalue = $this->db->quote('% '.$param[2].' %');
            }
            else {
                $qvalue = $this->db->quote($param[2]);
            }

            $sql_where .= sprintf(' AND %s %s %s',
                $this->db->quote_identifier($param[0]),
                $param[1],
                $qvalue
            );
        }

        return $sql_where;
    }

    /**
     * Helper method to convert the given pseudo-query triplets into
     * an associative filter array with 'equals' values only
     */
    protected function _query2assoc($query)
    {
        // extract object type from query parameter
        $filter = array();
        foreach ($query as $param) {
            if ($param[1] == '=')
                $filter[$param[0]] = $param[2];
        }
        return $filter;
    }

    /**
     * Fetch messages from IMAP
     *
     * @param array  List of message UIDs to fetch
     * @param string Requested object type or * for all
     * @param string IMAP folder to read from
     * @return array List of parsed Kolab objects
     */
    protected function _fetch($index, $type = null, $folder = null)
    {
        $results = new kolab_storage_dataset($this);
        foreach ((array)$index as $msguid) {
            if ($object = $this->folder->read_object($msguid, $type, $folder)) {
                $results[] = $object;
                $this->set($msguid, $object);
            }
        }

        return $results;
    }

    /**
     * Helper method to convert the given Kolab object into a dataset to be written to cache
     */
    protected function _serialize($object)
    {
        $data     = array();
        $sql_data = array('changed' => null, 'tags' => '', 'words' => '');

        if ($object['changed']) {
            $sql_data['changed'] = date(self::DB_DATE_FORMAT, is_object($object['changed']) ? $object['changed']->format('U') : $object['changed']);
        }

        if ($object['_formatobj']) {
            $xml = (string) $object['_formatobj']->write(3.0);

            $data['_size']     = strlen($xml);
            $sql_data['tags']  = ' ' . join(' ', $object['_formatobj']->get_tags()) . ' ';  // pad with spaces for strict/prefix search
            $sql_data['words'] = ' ' . join(' ', $object['_formatobj']->get_words()) . ' ';
        }

        // Store only minimal set of object properties
        foreach ($this->data_props as $prop) {
            if (isset($object[$prop])) {
                $data[$prop] = $object[$prop];
                if ($data[$prop] instanceof DateTime) {
                    $data[$prop] = array(
                        'cl' => 'DateTime',
                        'dt' => $data[$prop]->format('Y-m-d H:i:s'),
                        'tz' => $data[$prop]->getTimezone()->getName(),
                    );
                }
            }
        }

        $sql_data['data'] = json_encode(rcube_charset::clean($data));

        return $sql_data;
    }

    /**
     * Helper method to turn stored cache data into a valid storage object
     */
    protected function _unserialize($sql_arr)
    {
        if ($sql_arr['fast-mode'] && !empty($sql_arr['data']) && ($object = json_decode($sql_arr['data'], true))) {
            $object['uid'] = $sql_arr['uid'];

            foreach ($this->data_props as $prop) {
                if (isset($object[$prop]) && is_array($object[$prop]) && $object[$prop]['cl'] == 'DateTime') {
                    $object[$prop] = new DateTime($object[$prop]['dt'], new DateTimeZone($object[$prop]['tz']));
                }
                else if (!isset($object[$prop]) && isset($sql_arr[$prop])) {
                    $object[$prop] = $sql_arr[$prop];
                }
            }

            if ($sql_arr['created'] && empty($object['created'])) {
                $object['created'] = new DateTime($sql_arr['created']);
            }

            if ($sql_arr['changed'] && empty($object['changed'])) {
                $object['changed'] = new DateTime($sql_arr['changed']);
            }

            $object['_type']     = $sql_arr['type'] ?: $this->folder->type;
            $object['_msguid']   = $sql_arr['msguid'];
            $object['_mailbox']  = $this->folder->name;
        }
        // Fetch object xml
        else {
            // FIXME: Because old cache solution allowed storing objects that
            // do not match folder type we may end up with invalid objects.
            // 2nd argument of read_object() here makes sure they are still
            // usable. However, not allowing them here might be also an intended
            // solution in future.
            $object = $this->folder->read_object($sql_arr['msguid'], '*');
        }

        return $object;
    }

    /**
     * Write records into cache using extended inserts to reduce the number of queries to be executed
     *
     * @param int  Message UID. Set 0 to commit buffered inserts
     * @param array Kolab object to cache
     */
    protected function _extended_insert($msguid, $object)
    {
        static $buffer = '';

        $line = '';
        $cols = array('folder_id', 'msguid', 'uid', 'created', 'changed', 'data', 'tags', 'words');
        if ($this->extra_cols) {
            $cols = array_merge($cols, $this->extra_cols);
        }

        if ($object) {
            $sql_data = $this->_serialize($object);

            // Skip multi-folder insert for all databases but MySQL
            // In Oracle we can't put long data inline, others we don't support yet
            if (strpos($this->db->db_provider, 'mysql') !== 0) {
                $extra_args = array();
                $params = array($this->folder_id, $msguid, $object['uid'], $sql_data['changed'],
                    $sql_data['data'], $sql_data['tags'], $sql_data['words']);

                foreach ($this->extra_cols as $col) {
                    $params[] = $sql_data[$col];
                    $extra_args[] = '?';
                }

                $cols = implode(', ', array_map(function($n) { return "`{$n}`"; }, $cols));
                $extra_args = count($extra_args) ? ', ' . implode(', ', $extra_args) : '';

                $result = $this->db->query(
                    "INSERT INTO `{$this->cache_table}` ($cols)"
                    . " VALUES (?, ?, ?, " . $this->db->now() . ", ?, ?, ?, ?$extra_args)",
                    $params
                );

                if (!$this->db->affected_rows($result)) {
                    rcube::raise_error(array(
                        'code' => 900, 'message' => "Failed to write to kolab cache"
                    ), true);
                }

                return;
            }

            $values = array(
                $this->db->quote($this->folder_id),
                $this->db->quote($msguid),
                $this->db->quote($object['uid']),
                $this->db->now(),
                $this->db->quote($sql_data['changed']),
                $this->db->quote($sql_data['data']),
                $this->db->quote($sql_data['tags']),
                $this->db->quote($sql_data['words']),
            );
            foreach ($this->extra_cols as $col) {
                $values[] = $this->db->quote($sql_data[$col]);
            }
            $line = '(' . join(',', $values) . ')';
        }

        if ($buffer && (!$msguid || (strlen($buffer) + strlen($line) > $this->max_sql_packet()))) {
            $columns = implode(', ', array_map(function($n) { return "`{$n}`"; }, $cols));
            $update  = implode(', ', array_map(function($i) { return "`{$i}` = VALUES(`{$i}`)"; }, array_slice($cols, 2)));

            $result = $this->db->query(
                "INSERT INTO `{$this->cache_table}` ($columns) VALUES $buffer"
                . " ON DUPLICATE KEY UPDATE $update"
            );

            if (!$this->db->affected_rows($result)) {
                rcube::raise_error(array(
                    'code' => 900, 'message' => "Failed to write to kolab cache"
                ), true);
            }

            $buffer = '';
        }

        $buffer .= ($buffer ? ',' : '') . $line;
    }

    /**
     * Returns max_allowed_packet from mysql config
     */
    protected function max_sql_packet()
    {
        if (!$this->max_sql_packet) {
            // mysql limit or max 4 MB
            $value = $this->db->get_variable('max_allowed_packet', 1048500);
            $this->max_sql_packet = min($value, 4*1024*1024) - 2000;
        }

        return $this->max_sql_packet;
    }

    /**
     * Read this folder's ID and cache metadata
     */
    protected function _read_folder_data()
    {
        // already done
        if (!empty($this->folder_id) || !$this->ready)
            return;

        $sql_arr = $this->db->fetch_assoc($this->db->query(
                "SELECT `folder_id`, `synclock`, `ctag`, `changed`, `objectcount`"
                . " FROM `{$this->folders_table}` WHERE `resource` = ?",
                $this->resource_uri
        ));

        if ($sql_arr) {
            $this->metadata = $sql_arr;
            $this->folder_id = $sql_arr['folder_id'];
        }
        else {
            $this->db->query("INSERT INTO `{$this->folders_table}` (`resource`, `type`)"
                . " VALUES (?, ?)", $this->resource_uri, $this->folder->type);

            $this->folder_id = $this->db->insert_id('kolab_folders');
            $this->metadata = array();
        }
    }

    /**
     * Check lock record for this folder and wait if locked or set lock
     */
    protected function _sync_lock()
    {
        if (!$this->ready)
            return;

        $this->_read_folder_data();

        // abort if database is not set-up
        if ($this->db->is_error()) {
            $this->check_error();
            $this->ready = false;
            return;
        }

        $read_query  = "SELECT `synclock`, `ctag` FROM `{$this->folders_table}` WHERE `folder_id` = ?";
        $write_query = "UPDATE `{$this->folders_table}` SET `synclock` = ? WHERE `folder_id` = ? AND `synclock` = ?";

        // wait if locked (expire locks after 10 minutes) ...
        // ... or if setting lock fails (another process meanwhile set it)
        while (
            (intval($this->metadata['synclock']) + $this->max_sync_lock_time > time()) ||
            (($res = $this->db->query($write_query, time(), $this->folder_id, intval($this->metadata['synclock']))) &&
                !($affected = $this->db->affected_rows($res)))
        ) {
            usleep(500000);
            $this->metadata = $this->db->fetch_assoc($this->db->query($read_query, $this->folder_id));
        }

        $this->synclock = $affected > 0;
    }

    /**
     * Remove lock for this folder
     */
    public function _sync_unlock()
    {
        if (!$this->ready || !$this->synclock)
            return;

        $this->db->query(
            "UPDATE `{$this->folders_table}` SET `synclock` = 0, `ctag` = ?, `changed` = ?, `objectcount` = ? WHERE `folder_id` = ?",
            $this->metadata['ctag'],
            $this->metadata['changed'],
            $this->metadata['objectcount'],
            $this->folder_id
        );

        $this->synclock = false;
    }

    /**
     * Check IMAP connection error state
     */
    protected function check_error()
    {
        if (($err_code = $this->imap->get_error_code()) < 0) {
            $this->error = kolab_storage::ERROR_IMAP_CONN;
            if (($res_code = $this->imap->get_response_code()) !== 0 && in_array($res_code, array(rcube_storage::NOPERM, rcube_storage::READONLY))) {
                $this->error = kolab_storage::ERROR_NO_PERMISSION;
            }
        }
        else if ($this->db->is_error()) {
            $this->error = kolab_storage::ERROR_CACHE_DB;
        }
    }

    /**
     * Resolve an object UID into an IMAP message UID
     *
     * @param string  Kolab object UID
     * @param boolean Include deleted objects
     * @return int The resolved IMAP message UID
     */
    public function uid2msguid($uid, $deleted = false)
    {
        // query local database if available
        if (!isset($this->uid2msg[$uid]) && $this->ready) {
            $this->_read_folder_data();

            $sql_result = $this->db->query(
                "SELECT `msguid` FROM `{$this->cache_table}` ".
                "WHERE `folder_id` = ? AND `uid` = ? ORDER BY `msguid` DESC",
                $this->folder_id,
                $uid
            );

            if ($sql_arr = $this->db->fetch_assoc($sql_result)) {
                $this->uid2msg[$uid] = $sql_arr['msguid'];
            }
        }

        if (!isset($this->uid2msg[$uid])) {
            // use IMAP SEARCH to get the right message
            $index = $this->imap->search_once($this->folder->name, ($deleted ? '' : 'UNDELETED ') .
                'HEADER SUBJECT ' . rcube_imap_generic::escape($uid));
            $results = $index->get();
            $this->uid2msg[$uid] = end($results);
        }

        return $this->uid2msg[$uid];
    }

    /**
     * Getter for protected member variables
     */
    public function __get($name)
    {
        if ($name == 'folder_id') {
            $this->_read_folder_data();
        }

        return $this->$name;
    }

    /**
     * Set Roundcube storage options and bypass messages/indexes cache.
     *
     * We use skip_deleted and threading settings specific to Kolab,
     * we have to change these global settings only temporarily.
     * Roundcube cache duplicates information already stored in kolab_cache,
     * that's why we can disable it for better performance.
     *
     * @param bool $force True to start Kolab mode, False to stop it.
     */
    public function imap_mode($force = false)
    {
        // remember current IMAP settings
        if ($force) {
            $this->imap_options = array(
                'skip_deleted' => $this->imap->get_option('skip_deleted'),
                'threading'    => $this->imap->get_threading(),
            );
        }

        // re-set IMAP settings
        $this->imap->set_threading($force ? false : $this->imap_options['threading']);
        $this->imap->set_options(array(
                'skip_deleted' => $force ? true : $this->imap_options['skip_deleted'],
        ));

        // if kolab cache is disabled do nothing
        if (!$this->enabled) {
            return;
        }

        static $messages_cache, $cache_bypass;

        if ($messages_cache === null) {
            $rcmail = rcube::get_instance();
            $messages_cache = (bool) $rcmail->config->get('messages_cache');
            $cache_bypass   = (int) $rcmail->config->get('kolab_messages_cache_bypass');
        }

        if ($messages_cache) {
            // handle recurrent (multilevel) bypass() calls
            if ($force) {
                $this->cache_bypassed += 1;
                if ($this->cache_bypassed > 1) {
                    return;
                }
            }
            else {
                $this->cache_bypassed -= 1;
                if ($this->cache_bypassed > 0) {
                    return;
                }
            }

            switch ($cache_bypass) {
                case 2:
                    // Disable messages and index cache completely
                    $this->imap->set_messages_caching(!$force);
                    break;

                case 3:
                case 1:
                    // We'll disable messages cache, but keep index cache (1) or vice-versa (3)
                    // Default mode is both (MODE_INDEX | MODE_MESSAGE)
                    $mode = $cache_bypass == 3 ? rcube_imap_cache::MODE_MESSAGE : rcube_imap_cache::MODE_INDEX;

                    if (!$force) {
                        $mode |= $cache_bypass == 3 ? rcube_imap_cache::MODE_INDEX : rcube_imap_cache::MODE_MESSAGE;
                    }

                    $this->imap->set_messages_caching(true, $mode);
            }
        }
    }

    /**
     * Converts DateTime or unix timestamp into sql date format
     * using server timezone.
     */
    protected function _convert_datetime($datetime)
    {
        if (is_object($datetime)) {
            $dt = clone $datetime;
            $dt->setTimeZone($this->server_timezone);
            return $dt->format(self::DB_DATE_FORMAT);
        }
        else if ($datetime) {
            return date(self::DB_DATE_FORMAT, $datetime);
        }
    }
}
