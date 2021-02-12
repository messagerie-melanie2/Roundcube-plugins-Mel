<?php

/**
 * Kolab Authentication and User Base
 *
 * @author Aleksander Machniak <machniak@kolabsys.com>
 *
 * Copyright (C) 2011-2019, Kolab Systems AG <contact@kolabsys.com>
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

/**
 * Wrapper class for rcube_ldap_generic
 */
class kolab_ldap extends rcube_ldap_generic
{
    private $conf     = array();
    private $fieldmap = array();
    private $rcache;


    function __construct($p)
    {
        $rcmail = rcube::get_instance();

        $this->conf = $p;
        $this->conf['kolab_auth_user_displayname'] = $rcmail->config->get('kolab_auth_user_displayname', '{name}');

        $this->fieldmap = $p['fieldmap'];
        $this->fieldmap['uid'] = 'uid';

        $p['attributes'] = array_values($this->fieldmap);
        $p['debug']      = (bool) $rcmail->config->get('ldap_debug');

        if ($cache_type = $rcmail->config->get('ldap_cache', 'db')) {
            $cache_ttl   = $rcmail->config->get('ldap_cache_ttl', '10m');
            $this->cache = $rcmail->get_cache('LDAP.kolab_cache', $cache_type, $cache_ttl);
        }

        // Connect to the server (with bind)
        parent::__construct($p);
        $this->_connect();

        $rcmail->add_shutdown_function(array($this, 'close'));
    }

    /**
    * Establish a connection to the LDAP server
    */
    private function _connect()
    {
        // try to connect + bind for every host configured
        // with OpenLDAP 2.x ldap_connect() always succeeds but ldap_bind will fail if host isn't reachable
        // see http://www.php.net/manual/en/function.ldap-connect.php
        foreach ((array)$this->config['hosts'] as $host) {
            // skip host if connection failed
            if (!$this->connect($host)) {
                continue;
            }

            $bind_pass      = $this->config['bind_pass'];
            $bind_user      = $this->config['bind_user'];
            $bind_dn        = $this->config['bind_dn'];
            $base_dn        = $this->config['base_dn'];
            $groups_base_dn = $this->config['groups']['base_dn'] ?: $base_dn;

            // User specific access, generate the proper values to use.
            if ($this->config['user_specific']) {
                $rcube = rcube::get_instance();

                // No password set, use the session password
                if (empty($bind_pass)) {
                    $bind_pass = $rcube->get_user_password();
                }

                // Get the pieces needed for variable replacement.
                if ($fu = ($rcube->get_user_email() ?: $this->config['username'])) {
                    list($u, $d) = explode('@', $fu);
                }
                else {
                    $d = $this->config['mail_domain'];
                }

                $dc = 'dc=' . strtr($d, array('.' => ',dc=')); // hierarchal domain string

                // resolve $dc through LDAP
                if (!empty($this->config['domain_filter']) && !empty($this->config['search_bind_dn'])) {
                    $this->bind($this->config['search_bind_dn'], $this->config['search_bind_pw']);
                    $dc = $this->domain_root_dn($d);
                }

                $replaces = array('%dn' => '', '%dc' => $dc, '%d' => $d, '%fu' => $fu, '%u' => $u);

                // Search for the dn to use to authenticate
                if ($this->config['search_base_dn'] && $this->config['search_filter']
                    && (strstr($bind_dn, '%dn') || strstr($base_dn, '%dn') || strstr($groups_base_dn, '%dn'))
                ) {
                    $search_attribs = array('uid');
                    if ($search_bind_attrib = (array) $this->config['search_bind_attrib']) {
                        foreach ($search_bind_attrib as $r => $attr) {
                            $search_attribs[] = $attr;
                            $replaces[$r] = '';
                        }
                    }

                    $search_bind_dn = strtr($this->config['search_bind_dn'], $replaces);
                    $search_base_dn = strtr($this->config['search_base_dn'], $replaces);
                    $search_filter  = strtr($this->config['search_filter'], $replaces);

                    $cache_key = 'DN.' . md5("$host:$search_bind_dn:$search_base_dn:$search_filter:" . $this->config['search_bind_pw']);

                    if ($this->cache && ($dn = $this->cache->get($cache_key))) {
                        $replaces['%dn'] = $dn;
                    }
                    else {
                        $ldap = $this;
                        if (!empty($search_bind_dn) && !empty($this->config['search_bind_pw'])) {
                            // To protect from "Critical extension is unavailable" error
                            // we need to use a separate LDAP connection
                            if (!empty($this->config['vlv'])) {
                                $ldap = new rcube_ldap_generic($this->config);
                                $ldap->config_set(array('cache' => $this->cache, 'debug' => $this->debug));
                                if (!$ldap->connect($host)) {
                                    continue;
                                }
                            }

                            if (!$ldap->bind($search_bind_dn, $this->config['search_bind_pw'])) {
                                continue;  // bind failed, try next host
                            }
                        }

                        $res = $ldap->search($search_base_dn, $search_filter, 'sub', $search_attribs);
                        if ($res) {
                            $res->rewind();
                            $replaces['%dn'] = key($res->entries(true));

                            // add more replacements from 'search_bind_attrib' config
                            if ($search_bind_attrib) {
                                $res = $res->current();
                                foreach ($search_bind_attrib as $r => $attr) {
                                    $replaces[$r] = $res[$attr][0];
                                }
                            }
                        }

                        if ($ldap != $this) {
                            $ldap->close();
                        }
                    }

                    // DN not found
                    if (empty($replaces['%dn'])) {
                        if (!empty($this->config['search_dn_default']))
                            $replaces['%dn'] = $this->config['search_dn_default'];
                        else {
                            rcube::raise_error(array(
                                'code' => 100, 'type' => 'ldap',
                                'file' => __FILE__, 'line' => __LINE__,
                                'message' => "DN not found using LDAP search."), true);
                            continue;
                        }
                    }

                    if ($this->cache && !empty($replaces['%dn'])) {
                        $this->cache->set($cache_key, $replaces['%dn']);
                    }
                }

                // Replace the bind_dn and base_dn variables.
                $bind_dn        = strtr($bind_dn, $replaces);
                $base_dn        = strtr($base_dn, $replaces);
                $groups_base_dn = strtr($groups_base_dn, $replaces);

                // replace placeholders in filter settings
                if (!empty($this->config['filter'])) {
                    $this->config['filter'] = strtr($this->config['filter'], $replaces);
                }

                foreach (array('base_dn', 'filter', 'member_filter') as $k) {
                    if (!empty($this->config['groups'][$k])) {
                        $this->config['groups'][$k] = strtr($this->config['groups'][$k], $replaces);
                    }
                }

                if (empty($bind_user)) {
                    $bind_user = $u;
                }
            }

            if (empty($bind_pass)) {
                $this->ready = true;
            }
            else {
                if (!empty($this->config['auth_cid'])) {
                    $this->ready = $this->sasl_bind($this->config['auth_cid'], $bind_pass, $bind_dn);
                }
                else if (!empty($bind_dn)) {
                    $this->ready = $this->bind($bind_dn, $bind_pass);
                }
                else {
                    $this->ready = $this->sasl_bind($bind_user, $bind_pass);
                }
            }

            // connection established, we're done here
            if ($this->ready) {
                break;
            }

        }  // end foreach hosts

        if (!is_resource($this->conn)) {
            rcube::raise_error(array('code' => 100, 'type' => 'ldap',
                'file' => __FILE__, 'line' => __LINE__,
                'message' => "Could not connect to any LDAP server, last tried $host"), true);

            $this->ready = false;
        }

        return $this->ready;
    }

    /**
     * Fetches user data from LDAP addressbook
     */
    function get_user_record($user, $host)
    {
        $rcmail  = rcube::get_instance();
        $filter  = $rcmail->config->get('kolab_auth_filter');
        $filter  = $this->parse_vars($filter, $user, $host);
        $base_dn = $this->parse_vars($this->config['base_dn'], $user, $host);
        $scope   = $this->config['scope'];

        // @TODO: print error if filter is empty

        // get record
        if ($result = parent::search($base_dn, $filter, $scope, $this->attributes)) {
            if ($result->count() == 1) {
                $entries = $result->entries(true);
                $dn      = key($entries);
                $entry   = array_pop($entries);
                $entry   = $this->field_mapping($dn, $entry);

                return $entry;
            }
        }
    }

    /**
     * Fetches user data from LDAP addressbook
     */
    function get_user_groups($dn, $user, $host)
    {
        if (empty($dn) || empty($this->config['groups'])) {
            return array();
        }

        $base_dn     = $this->parse_vars($this->config['groups']['base_dn'], $user, $host);
        $name_attr   = $this->config['groups']['name_attr'] ? $this->config['groups']['name_attr'] : 'cn';
        $member_attr = $this->get_group_member_attr();
        $filter      = "(member=$dn)(uniqueMember=$dn)";

        if ($member_attr != 'member' && $member_attr != 'uniqueMember')
            $filter .= "($member_attr=$dn)";
        $filter = strtr("(|$filter)", array("\\" => "\\\\"));

        $result = parent::search($base_dn, $filter, 'sub', array('dn', $name_attr));

        if (!$result) {
            return array();
        }

        $groups = array();
        foreach ($result as $entry) {
            $dn    = $entry['dn'];
            $entry = rcube_ldap_generic::normalize_entry($entry);

            $groups[$dn] = $entry[$name_attr];
        }

        return $groups;
    }

    /**
     * Get a specific LDAP record
     *
     * @param string DN
     *
     * @return array Record data
     */
    function get_record($dn)
    {
        if (!$this->ready) {
            return;
        }

        if ($rec = $this->get_entry($dn, $this->attributes)) {
            $rec = rcube_ldap_generic::normalize_entry($rec);
            $rec = $this->field_mapping($dn, $rec);
        }

        return $rec;
    }

    /**
     * Replace LDAP record data items
     *
     * @param string $dn    DN
     * @param array  $entry LDAP entry
     *
     * return bool True on success, False on failure
     */
    function replace($dn, $entry)
    {
        // fields mapping
        foreach ($this->fieldmap as $field => $attr) {
            if (array_key_exists($field, $entry)) {
                $entry[$attr] = $entry[$field];
                if ($attr != $field) {
                    unset($entry[$field]);
                }
            }
        }

        return $this->mod_replace($dn, $entry);
    }

    /**
     * Search records (simplified version of rcube_ldap::search)
     *
     * @param mixed   $fields   The field name or array of field names to search in
     * @param string  $value    Search value
     * @param int     $mode     Matching mode:
     *                          0 - partial (*abc*),
     *                          1 - strict (=),
     *                          2 - prefix (abc*)
     * @param array   $required List of fields that cannot be empty
     * @param int     $limit    Number of records
     * @param int     $count    Returns the number of records found
     *
     * @return array List of LDAP records found
     */
    function dosearch($fields, $value, $mode=1, $required = array(), $limit = 0, &$count = 0)
    {
        if (empty($fields)) {
            return array();
        }

        $mode  = intval($mode);

        // try to resolve field names into ldap attributes
        $fieldmap = $this->fieldmap;
        $attrs = array_map(function($f) use ($fieldmap) {
            return array_key_exists($f, $fieldmap) ? $fieldmap[$f] : $f;
        }, (array)$fields);

        // compose a full-text-search-like filter
        if (count($attrs) > 1 || $mode != 1) {
            $filter = self::fulltext_search_filter($value, $attrs, $mode);
        }
        // direct search
        else {
            $field  = $attrs[0];
            $filter = "($field=" . self::quote_string($value) . ")";
        }

        // add required (non empty) fields filter
        $req_filter = '';

        foreach ((array)$required as $field) {
            $attr = array_key_exists($field, $this->fieldmap) ? $this->fieldmap[$field] : $field;

            // only add if required field is not already in search filter
            if (!in_array($attr, $attrs)) {
                $req_filter .= "($attr=*)";
            }
        }

        if (!empty($req_filter)) {
            $filter = '(&' . $req_filter . $filter . ')';
        }

        // avoid double-wildcard if $value is empty
        $filter = preg_replace('/\*+/', '*', $filter);

        // add general filter to query
        if (!empty($this->config['filter'])) {
            $filter = '(&(' . preg_replace('/^\(|\)$/', '', $this->config['filter']) . ')' . $filter . ')';
        }

        $base_dn = $this->parse_vars($this->config['base_dn']);
        $scope   = $this->config['scope'];
        $attrs   = array_values($this->fieldmap);
        $list    = array();

        if ($result = $this->search($base_dn, $filter, $scope, $attrs)) {
            $count = $result->count();
            $i = 0;
            foreach ($result as $entry) {
                if ($limit && $limit <= $i) {
                    break;
                }

                $dn        = $entry['dn'];
                $entry     = rcube_ldap_generic::normalize_entry($entry);
                $list[$dn] = $this->field_mapping($dn, $entry);
                $i++;
            }
        }

        return $list;
    }

    /**
     * Set filter used in search()
     */
    function set_filter($filter)
    {
        $this->config['filter'] = $filter;
    }

    /**
     * Maps LDAP attributes to defined fields
     */
    protected function field_mapping($dn, $entry)
    {
        $entry['dn'] = $dn;

        // fields mapping
        foreach ($this->fieldmap as $field => $attr) {
            // $entry might be indexed by lower-case attribute names
            $attr_lc = strtolower($attr);
            if (isset($entry[$attr_lc])) {
                $entry[$field] = $entry[$attr_lc];
            }
            else if (isset($entry[$attr])) {
                $entry[$field] = $entry[$attr];
            }
        }

        // compose display name according to config
        if (empty($this->fieldmap['displayname'])) {
            $entry['displayname'] = rcube_addressbook::compose_search_name(
                $entry,
                $entry['email'],
                $entry['name'],
                $this->conf['kolab_auth_user_displayname']
            );
        }

        return $entry;
    }

    /**
     * Detects group member attribute name
     */
    private function get_group_member_attr($object_classes = array())
    {
        if (empty($object_classes)) {
            $object_classes = $this->config['groups']['object_classes'];
        }
        if (!empty($object_classes)) {
            foreach ((array)$object_classes as $oc) {
                switch (strtolower($oc)) {
                    case 'group':
                    case 'groupofnames':
                    case 'kolabgroupofnames':
                        $member_attr = 'member';
                        break;

                    case 'groupofuniquenames':
                    case 'kolabgroupofuniquenames':
                        $member_attr = 'uniqueMember';
                        break;
                }
            }
        }

        if (!empty($member_attr)) {
            return $member_attr;
        }

        if (!empty($this->config['groups']['member_attr'])) {
            return $this->config['groups']['member_attr'];
        }

        return 'member';
    }

    /**
     * Prepares filter query for LDAP search
     */
    function parse_vars($str, $user = null, $host = null)
    {
        // When authenticating user $user is always set
        // if not set it means we use this LDAP object for other
        // purposes, e.g. kolab_delegation, then username with
        // correct domain is in a session
        if (!$user) {
            $user = $_SESSION['username'];
        }

        if (isset($this->icache[$user])) {
            list($user, $dc) = $this->icache[$user];
        }
        else {
            $orig_user = $user;
            $rcmail = rcube::get_instance();

            // get default domain
            if ($username_domain = $rcmail->config->get('username_domain')) {
                if ($host && is_array($username_domain) && isset($username_domain[$host])) {
                    $domain = rcube_utils::parse_host($username_domain[$host], $host);
                }
                else if (is_string($username_domain)) {
                    $domain = rcube_utils::parse_host($username_domain, $host);
                }
            }

            // realmed username (with domain)
            if (strpos($user, '@')) {
                list($usr, $dom) = explode('@', $user);

                // unrealm domain, user login can contain a domain alias
                if ($dom != $domain && ($dc = $this->domain_root_dn($dom))) {
                    // @FIXME: we should replace domain in $user, I suppose
                }
            }
            else if ($domain) {
                $user .= '@' . $domain;
            }

            $this->icache[$orig_user] = array($user, $dc);
        }

        // replace variables in filter
        list($u, $d) = explode('@', $user);

        // hierarchal domain string
        if (empty($dc)) {
            $dc = 'dc=' . strtr($d, array('.' => ',dc='));
        }

        $replaces = array('%dc' => $dc, '%d' => $d, '%fu' => $user, '%u' => $u);

        $this->parse_replaces = $replaces;

        return strtr($str, $replaces);
    }

    /**
     * Returns variables used for replacement in (last) parse_vars() call
     *
     * @return array Variable-value hash array
     */
    public function get_parse_vars()
    {
        return $this->parse_replaces;
    }

    /**
     * Register additional fields
     */
    public function extend_fieldmap($map)
    {
        foreach ((array)$map as $name => $attr) {
            if (!in_array($attr, $this->attributes)) {
                $this->attributes[]    = $attr;
                $this->fieldmap[$name] = $attr;
            }
        }
    }

    /**
     * HTML-safe DN string encoding
     *
     * @param string $str DN string
     *
     * @return string Encoded HTML identifier string
     */
    static function dn_encode($str)
    {
        return rtrim(strtr(base64_encode($str), '+/', '-_'), '=');
    }

    /**
     * Decodes DN string encoded with _dn_encode()
     *
     * @param string $str Encoded HTML identifier string
     *
     * @return string DN string
     */
    static function dn_decode($str)
    {
        $str = str_pad(strtr($str, '-_', '+/'), strlen($str) % 4, '=', STR_PAD_RIGHT);
        return base64_decode($str);
    }
}
