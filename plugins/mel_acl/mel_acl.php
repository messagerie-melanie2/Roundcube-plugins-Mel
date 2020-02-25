<?php

/**
 * Folders Access Control Lists Management (RFC4314, RFC2086)
 *
 * @version @package_version@
 * @author Aleksander Machniak <alec@alec.pl>
 *
 *
 * Copyright (C) 2011-2012, Kolab Systems AG
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

class mel_acl extends rcube_plugin
{
    public $task = 'settings|addressbook|calendar';

    private $rc;
    private $supported = null;
    private $mbox;
    private $ldap;
    private $specials = array();
    private $type;

    /**
     *
     * @var
     */
    private $object = array();

    /**
     * Plugin initialization
     */
    function init()
    {
        $this->rc = rcmail::get_instance();

        // Register hooks
        $this->add_hook('acl_form_mel', array($this, 'folder_form'));
        // Plugin actions
        $this->register_action('plugin.acl', array($this, 'acl_actions'));
        $this->register_action('plugin.acl-autocomplete', array($this, 'acl_autocomplete'));
        $this->register_action('plugin.acl-autocomplete-group', array($this, 'acl_autocomplete'));
    }

    /**
     * Handler for plugin actions (AJAX)
     */
    function acl_actions()
    {
        $action = trim(rcube_utils::get_input_value('_act', rcube_utils::INPUT_GPC));

        // Connect to IMAP
        $this->rc->storage_init();

        // Load localization and configuration
        $this->add_texts('localization/');
        $this->load_config();

        if ($action == 'save') {
            $this->action_save();
        }
        else if ($action == 'delete') {
            $this->action_delete();
        }
        else if ($action == 'list') {
            $this->action_list();
        }

        // Only AJAX actions
        $this->rc->output->send();
    }

    /**
     * Handler for user login autocomplete request
     */
    function acl_autocomplete()
    {
        $this->load_config();

        $search = rcube_utils::get_input_value('_search', rcube_utils::INPUT_GPC, true);
        $reqid  = rcube_utils::get_input_value('_reqid', rcube_utils::INPUT_GPC);
        $users  = array();
        $keys   = array();
        $group = strpos($this->rc->action, 'group') !== false;

        if ($this->init_ldap($group)) {
            $max  = (int) $this->rc->config->get('autocomplete_max', 15);
            if ($group) {
                $mode = (int) $this->rc->config->get('addressbook_search_mode_groups');
            } else {
                $mode = (int) $this->rc->config->get('addressbook_search_mode');
            }

            $this->ldap->set_pagesize($max);
            $result = $this->ldap->search('*', $search, $mode);

            foreach ($result->records as $record) {
                if ($group) {
                    $user = base64_decode($record['ID']);
                } else {
                    $user = $record['uid'];
                }

                if (is_array($user)) {
                    $user = array_filter($user);
                    $user = $user[0];
                }

            		if ($user) {
                    $display = rcube_addressbook::compose_search_name($record);
                    $user    = array('name' => $user, 'display' => $display);
                    $users[] = $user;
                    $keys[]  = $display ?: $user['name'];
                }
            }

        		if ($this->rc->config->get('acl_groups')) {
                $prefix      = $this->rc->config->get('acl_group_prefix');
                $group_field = $this->rc->config->get('acl_group_field', 'name');
                $result      = $this->ldap->list_groups($search, $mode);

                foreach ($result as $record) {
                    $group    = $record['name'];
                    $group_id = is_array($record[$group_field]) ? $record[$group_field][0] : $record[$group_field];

                    if ($group) {
                        $users[] = array('name' => ($prefix ? $prefix : '') . $group_id, 'display' => $group, 'type' => 'group');
                        $keys[]  = $group;
                    }
                }
            }
        }

    	if (count($users)) {
            // sort users index
            asort($keys, SORT_LOCALE_STRING);
            // re-sort users according to index
            foreach ($keys as $idx => $val) {
                $keys[$idx] = $users[$idx];
            }
            $users = array_values($keys);
        }

        $this->rc->output->command('ksearch_query_results', $users, $search, $reqid);
        $this->rc->output->send();
    }

    /**
     * Handler for 'folder_form' hook
     *
     * @param array $args Hook arguments array (form data)
     *
     * @return array Hook arguments array
     */
    function folder_form($args)
    {
        $mbox_imap = $args['options']['name'];
        $myrights  = $args['options']['rights'];
        $type = $args['options']['type'];

        // Edited folder name (empty in create-folder mode)
        if (!strlen($mbox_imap)) {
            return $args;
        }

        // Edited type folder (empty in create-folder mode)
        if (!strlen($type)) {
        	return $args;
        }

        // Get MYRIGHTS
        if (empty($myrights)) {
            return $args;
        }

        // Load localization and include scripts
        $this->load_config();
        $this->add_texts('localization/', array('deleteconfirm', 'norights',
            'nouser', 'deleting', 'saving', 'newuser', 'editperms'));
        $this->rc->output->add_label('save', 'cancel');
        $this->include_script('mel_acl.js');
        $this->rc->output->include_script('list.js');
        $this->include_stylesheet($this->local_skin_path().'/mel_acl.css');

        // add Info fieldset if it doesn't exist
        if (!isset($args['form']['props']['fieldsets']['info']))
            $args['form']['props']['fieldsets']['info'] = array(
                'name'  => $this->rc->gettext('info'),
                'content' => array());

        // Display folder rights to 'Info' fieldset
        $args['form']['props']['fieldsets']['info']['content']['myrights'] = array(
            'label' => rcube::Q($this->gettext('myrights')),
            'value' => $this->acl2text($myrights)
        );

        // Return if not folder admin
        if (!in_array('a', $myrights)) {
            return $args;
        }

        // The 'Sharing' tab
        $this->mbox = $mbox_imap;
        $this->type = $type;
        $this->rc->output->set_env('acl_users_source', (bool) $this->rc->config->get('acl_users_source'));
        $this->rc->output->set_env('mailbox', $mbox_imap);
        // PAMELA
        $this->rc->output->set_env('type', $type);
        $this->rc->output->set_env('isgroup', strpos($type, 'group') !== false);
        $this->rc->output->add_handlers(array(
            'acltable'  => array($this, 'templ_table'),
            'acluser'   => array($this, 'templ_user'),
            'aclrights' => array($this, 'templ_rights'),
        ));
        if ($this->type == 'm2mailbox') {
            $this->rc->output->add_handler('aclobjects', array($this, 'templ_objects'));
        }

        $this->rc->output->set_env('autocomplete_max', (int)$this->rc->config->get('autocomplete_max', 15));
        $this->rc->output->set_env('autocomplete_min_length', $this->rc->config->get('autocomplete_min_length'));
        $this->rc->output->add_label('autocompletechars', 'autocompletemore');

        $args['form']['sharing'] = array(
            'name'    => rcube::Q($this->gettext('sharing')),
            'content' => $this->rc->output->parse('mel_acl.table', false, false),
        );

        return $args;
    }

    /**
     * Creates ACL rights table
     *
     * @param array $attrib Template object attributes
     *
     * @return string HTML Content
     */
    function templ_table($attrib)
    {
        if (empty($attrib['id']))
            $attrib['id'] = 'acl-table';

        $out = $this->list_rights($attrib);

        $this->rc->output->add_gui_object('acltable', $attrib['id']);

        return $out;
    }

    /**
     * Creates ACL objects form (objects list part)
     *
     * @param array $attrib Template object attributes
     *
     * @return string HTML Content
     */
    function templ_objects($attrib)
    {
        $out = '';
        $ul  = '';

        $input = new html_checkbox();

        $out .= "\n" . html::tag('ul', $attrib, $ul, html::$common_attrib);
        foreach (array('calendar', 'contact', 'task') as $val) {
            $id = "object$val";
            $ul .= html::tag('li', null,
                    $input->show('', array(
                        'name' => "object[$val]", 'value' => $val, 'id' => $id))
                    . html::label(array('for' => $id, 'title' => $this->gettext('longobject'.$val)),
                            $this->gettext('object'.$val)));
        }
        $out .= "\n" . html::tag('ul', $attrib, $ul, html::$common_attrib);

        return $out;
    }

    /**
     * Creates ACL rights form (rights list part)
     *
     * @param array $attrib Template object attributes
     *
     * @return string HTML Content
     */
    function templ_rights($attrib)
    {
        // Get supported rights
        $supported = $this->rights_supported();

        // depending on server capability either use 'te' or 'd' for deleting msgs
        $deleteright = implode(array_intersect(str_split('ted'), $supported));

        $out = '';
        $ul  = '';
        if ($this->type == 'm2mailbox') {
            $input = new html_radiobutton();
        } else {
            $input = new html_checkbox();
        }

        // Simple rights
        $ul = '';
        $attrib['id'] = 'simplerights';
        if ($this->type == 'm2mailbox') {
            $items = array(
                'full' => 'g',
                'send' => 'c',
                'write' => 'e',
                'read' => 'l',
            );

            foreach ($items as $key => $val) {
                $id = "acl$key";
                $ul .= html::tag('li', null,
                        $input->show('', array(
                            'name' => "acl", 'value' => $val, 'id' => $id))
                        . html::label(array('for' => $id, 'title' => $this->gettext('longacl'.$key)),
                                $this->gettext('acl'.$key)));
            }
        } else {
            $items = array(
                'private' => 'p',
                'freebusy' => 'l',
                'read' => 'r',
                'write' => 'w',
                /*'delete' => 'd',*/
            );
            // Ne garde le droit privé que pour les agendas
            if ($this->type != 'm2calendar'
                    && $this->type != 'm2calendargroup') unset($items['private']);

            foreach ($items as $key => $val) {
                $id = "acl$key";
                $ul .= html::tag('li', null,
                        $input->show('', array(
                            'name' => "acl[$val]", 'value' => $val, 'id' => $id))
                        . html::label(array('for' => $id, 'title' => $this->gettext('longacl'.$key)),
                                $this->gettext('acl'.$key)));
            }
        }




        $out .= "\n" . html::tag('ul', $attrib, $ul, html::$common_attrib);

        $this->rc->output->set_env('acl_items', $items);

        return $out;
    }

    /**
     * Creates ACL rights form (user part)
     *
     * @param array $attrib Template object attributes
     *
     * @return string HTML Content
     */
    function templ_user($attrib)
    {
        // Create username input
        $attrib['name'] = 'acluser';
        if (!isset($attrib['size']))
            $attrib['size'] = '40';

        $textfield = new html_inputfield($attrib);

        $fields['user'] = $textfield->show();

        $this->rc->output->set_env('acl_specials', $this->specials);

        // Create list with radio buttons
        if (count($fields) > 1) {
            $ul = '';
            $radio = new html_radiobutton(array('name' => 'usertype'));
            foreach ($fields as $key => $val) {
                $ul .= html::tag('li', null, $radio->show($key == 'user' ? 'user' : '',
                        array('value' => $key, 'id' => 'id'.$key))
                    . $val);
            }

            $out = html::tag('ul', array('id' => 'usertype', 'class' => $attrib['class']), $ul, html::$common_attrib);
        }
        // Display text input alone
        else {
            $out = $fields['user'];
        }

        return $out;
    }

    /**
     * Creates ACL rights table
     *
     * @param array $attrib Template object attributes
     *
     * @return string HTML Content
     */
    private function list_rights($attrib=array())
    {
        // Get ACL for the folder
        if (!isset($this->type)) return false;
        // PAMELA
        if ($this->type != 'm2mailbox') {
            $username = $this->get_user_bal();
        }
        else {
            $username = $this->rc->user->get_username();
        }
        if (!isset($this->object[$this->type])) {
	        $class = ucfirst($this->type);
	        $this->object[$this->type] = new $class($username, $this->mbox);
        }
        $acl = $this->object[$this->type]->getAcl();

        if (!is_array($acl)) {
            $acl = array();
        }

        // Keep special entries (anyone/anonymous) on top of the list
        if (!empty($this->specials) && !empty($acl)) {
            foreach ($this->specials as $key) {
                if (isset($acl[$key])) {
                    $acl_special[$key] = $acl[$key];
                    unset($acl[$key]);
                }
            }
        }

        // Sort the list by username
        uksort($acl, 'strnatcasecmp');

        if (!empty($acl_special)) {
            $acl = array_merge($acl_special, $acl);
        }

        // Get supported rights and build column names
        $supported = $this->rights_supported();

        // depending on server capability either use 'te' or 'd' for deleting msgs
        $deleteright = implode(array_intersect(str_split('ted'), $supported));

        if ($this->type == 'm2mailbox') {
            $items = array(
                'full' => 'g',
                'send' => 'c',
                'write' => 'e',
                'read' => 'l',
            );
        } else {
            $items = array(
                'private' => 'p',
                'freebusy' => 'l',
                'read' => 'r',
                'write' => 'w',
            );
            // Ne garde le droit privé que pour les agendas
            if ($this->type != 'm2calendar'
                    && $this->type != 'm2calendargroup') unset($items['private']);
        }

        // Create the table
        $attrib['noheader'] = true;
        $table = new html_table($attrib);

        // Create table header
        $table->add_header('user', $this->gettext('identifier'));
        foreach (array_keys($items) as $key) {
            $label = $this->gettext('shortacl'.$key);
            $table->add_header(array('class' => 'acl'.$key, 'title' => $label), $label);
        }

        $i = 1;
        $js_table = array();
        $js_table_objects = array();
        foreach ($acl as $user => $rights) {
            if ($username == $user && $this->type != 'm2mailbox') {
                continue;
            }

            // filter out virtual rights (c or d) the server may return
            $userrights = array_intersect($rights, $supported);
            $userid = rcube_utils::html_identifier($user);

            if (!empty($this->specials) && in_array($user, $this->specials)) {
                $user = $this->gettext($user);
            }

            $table->add_row(array('id' => 'rcmrow'.$userid));
            $table->add(array('class' => 'user', 'title' => $user), rcube::Q($user));

            foreach ($items as $key => $right) {
                $in = $this->acl_compare($userrights, $right);
                switch ($in) {
                    case 2: $class = 'enabled'; break;
                    case 1: $class = 'partial'; break;
                    default: $class = 'disabled'; break;
                }
                $table->add('acl' . $key . ' ' . $class, '');
            }

            $js_table[$userid] = implode($userrights);
        }

        $this->rc->output->set_env('acl', $js_table);
        $this->rc->output->set_env('acl_advanced', $advanced);
        $this->rc->output->set_env('acl_objects', $js_table_objects);

        $out = $table->show();

        return $out;
    }

    /**
     * Handler for ACL update/create action
     */
    private function action_save()
    {
        $mbox  = trim(rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GPC, true)); // UTF7-IMAP
        $user  = trim(rcube_utils::get_input_value('_user', rcube_utils::INPUT_GPC));
        $acl   = trim(rcube_utils::get_input_value('_acl', rcube_utils::INPUT_GPC));
        $oldid = trim(rcube_utils::get_input_value('_old', rcube_utils::INPUT_GPC));
        $type = trim(rcube_utils::get_input_value('_type', rcube_utils::INPUT_GPC));
        $objects = trim(rcube_utils::get_input_value('_objects', rcube_utils::INPUT_GPC));

        $acl_mapping = array(
                'g' => array('l','r','w'),
                'e' => array('l','r','w'),
                'c' => array('l','r','w'),
                'l' => array('l','r'),
            );
        $objects = explode(',', $objects);

        $this->type = $type;

        $acl    = array_intersect(str_split($acl), $this->rights_supported());
        $users  = $oldid ? array($user) : explode('###', $user);
        $result = 0;

        // PAMELA
        $class = ucfirst($type);
        // PAMELA
        if ($this->type != 'm2mailbox') {
            $session_username = $this->get_user_bal();
        }
        else {
            $session_username = $this->rc->user->get_username();
        }
        $object = new $class($session_username, $mbox);

        $js_table_objects = $this->rc->output->get_env('acl_objects');

        foreach ($users as $user) {
            $user = trim($user);

            // if (!empty($this->specials) && in_array($user, $this->specials)) {
            //     $username = $this->gettext($user);
            // }
            // else if (!empty($user)) {
            //     if (!strpos($user, '@') && ($realm = $this->get_realm())) {
            //         $user .= '@' . rcube_idn_to_ascii(preg_replace('/^@/', '', $realm));
            //     }
            //     $username = $user;
            // }

            $username = $user;

            if (!$acl || !$user || !strlen($mbox)) {
                continue;
            }

//             $user     = $this->mod_login($user);
//             $username = $this->mod_login($username);

            // PAMELA
            if ($user != $session_username && $username != $session_username) {
            	// PAMELA
                if ($object->setAcl($user, $acl)) {
                    $js_table_objects[$user] = $objects;
                    $ret = array('id' => rcube_utils::html_identifier($user),
                         'username' => $username, 'acl' => implode($acl), 'old' => $oldid);
                    $this->rc->output->command('acl_update', $ret);
                    $result++;
                }
            }
        }

        $this->rc->output->set_env('acl_objects', $js_table_objects);

        if ($result) {
            $this->rc->output->show_message($oldid ? 'mel_acl.updatesuccess' : 'mel_acl.createsuccess', 'confirmation');
        }
        else {
            $this->rc->output->show_message($oldid ? 'mel_acl.updateerror' : 'mel_acl.createerror', 'error');
        }
    }

    /**
     * Handler for ACL delete action
     */
    private function action_delete()
    {
        $mbox = trim(rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GPC, true)); //UTF7-IMAP
        $user = trim(rcube_utils::get_input_value('_user', rcube_utils::INPUT_GPC));
        $type = trim(rcube_utils::get_input_value('_type', rcube_utils::INPUT_GPC));

        $user = explode('###', $user);

        // PAMELA
        $class = ucfirst($type);
    		// PAMELA
        if ($this->type != 'm2mailbox') {
            $session_username = $this->get_user_bal();
        }
        else {
            $session_username = $this->rc->user->get_username();
        }
        $object = new $class($session_username, $mbox);

        foreach ($user as $u) {
            $u = trim($u);
            // PAMELA
            if ($object->deleteAcl($u)) {
                $this->rc->output->command('acl_remove_row', rcube_utils::html_identifier($u));
            }
            else {
                $error = true;
            }
        }

        if (!$error) {
            $this->rc->output->show_message('mel_acl.deletesuccess', 'confirmation');
        }
        else {
            $this->rc->output->show_message('mel_acl.deleteerror', 'error');
        }
    }

    /**
     * Handler for ACL list update action (with display mode change)
     */
    private function action_list()
    {
        if (in_array('acl_advanced_mode', (array)$this->rc->config->get('dont_override'))) {
            return;
        }

        $this->mbox = trim(rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GPC, true)); // UTF7-IMAP
        $advanced   = trim(rcube_utils::get_input_value('_mode', rcube_utils::INPUT_GPC));
        $advanced   = $advanced == 'advanced' ? true : false;

        // Save state in user preferences
        $this->rc->user->save_prefs(array('acl_advanced_mode' => $advanced));

        $out = $this->list_rights();

        $out = preg_replace(array('/^<table[^>]+>/', '/<\/table>$/'), '', $out);

        $this->rc->output->command('acl_list_update', $out);
    }

    /**
     * Creates <UL> list with descriptive access rights
     *
     * @param array $rights MYRIGHTS result
     *
     * @return string HTML content
     */
    function acl2text($rights)
    {
        if (empty($rights)) {
            return '';
        }

        $supported = $this->rights_supported();
        $list      = array();
        $attrib    = array(
            'name' => 'rcmyrights',
            'style' => 'margin:0; padding:0 15px;',
        );

        foreach ($supported as $right) {
            if (in_array($right, $rights)) {
                $list[] = html::tag('li', null, rcube::Q($this->gettext('acl' . $right)));
            }
        }

        if (count($list) == count($supported))
            return rcube::Q($this->gettext('aclfull'));

        return html::tag('ul', $attrib, implode("\n", $list));
    }

    /**
     * Compares two ACLs (according to supported rights)
     *
     * @param array $acl1 ACL rights array (or string)
     * @param array $acl2 ACL rights array (or string)
     *
     * @param int Comparision result, 2 - full match, 1 - partial match, 0 - no match
     */
    function acl_compare($acl1, $acl2)
    {
        if (!is_array($acl1)) $acl1 = str_split($acl1);
        if (!is_array($acl2)) $acl2 = str_split($acl2);

        $rights = $this->rights_supported();

        $acl1 = array_intersect($acl1, $rights);
        $acl2 = array_intersect($acl2, $rights);
        $res  = array_intersect($acl1, $acl2);

        $cnt1 = count($res);
        $cnt2 = count($acl2);

        if ($cnt1 == $cnt2)
            return 2;
        else if ($cnt1)
            return 1;
        else
            return 0;
    }

    /**
     * Get list of supported access rights (according to RIGHTS capability)
     *
     * @return array List of supported access rights abbreviations
     */
    function rights_supported()
    {
        if ($this->type == 'm2mailbox') {
            return array('g','c','e','l');
        } elseif ($this->type == 'm2calendar'
            || $this->type == 'm2calendargroup') {
            return array('p','l','r','w');
        } else {
            return array('l','r','w');
        }
    }

    /**
     * Username realm detection.
     *
     * @return string Username realm (domain)
     */
    private function get_realm()
    {
        // When user enters a username without domain part, realm
        // allows to add it to the username (and display correct username in the table)

        if (isset($_SESSION['acl_username_realm'])) {
            return $_SESSION['acl_username_realm'];
        }

        // find realm in username of logged user (?)
        list($name, $domain) = explode('@', $_SESSION['username']);

        // Use (always existent) ACL entry on the INBOX for the user to determine
        // whether or not the user ID in ACL entries need to be qualified and how
        // they would need to be qualified.
        if (empty($domain)) {
            $acl = $this->rc->storage->get_acl('INBOX');
            if (is_array($acl)) {
                $regexp = '/^' . preg_quote($_SESSION['username'], '/') . '@(.*)$/';
                foreach (array_keys($acl) as $name) {
                    if (preg_match($regexp, $name, $matches)) {
                        $domain = $matches[1];
                        break;
                    }
                }
            }
        }

        return $_SESSION['acl_username_realm'] = $domain;
    }

    /**
     * Initializes autocomplete LDAP backend
     */
    private function init_ldap($group = false)
    {
        if ($this->ldap)
            return $this->ldap->ready;

        // get LDAP config
        if ($group) {
            $config = $this->rc->config->get('acl_groups_source');
        } else {
            $config = $this->rc->config->get('acl_users_source');
        }

        if (empty($config)) {
            return false;
        }

        // not an array, use configured ldap_public source
        if (!is_array($config)) {
            $ldap_config = (array) $this->rc->config->get('ldap_public');
            $config = $ldap_config[$config];
        }

        if ($group) {
            $uid_field = $this->rc->config->get('acl_groups_field', 'dn');
            $filter    = $this->rc->config->get('acl_groups_filter');
        } else {
            $uid_field = $this->rc->config->get('acl_users_field', 'uid');
            $filter    = $this->rc->config->get('acl_users_filter');
        }

        if (empty($uid_field) || empty($config)) {
            return false;
        }

        // get name attribute
        if (!empty($config['fieldmap'])) {
            $name_field = $config['fieldmap']['name'];
        }
        // ... no fieldmap, use the old method
        if (empty($name_field)) {
            $name_field = $config['name_field'];
        }

        // add UID field to fieldmap, so it will be returned in a record with name
        $config['fieldmap'] = array(
            'name' => $name_field,
            'uid'  => $uid_field,
        );

        // search in UID and name fields
        // $name_field can be in a form of <field>:<modifier> (#1490591)
        $name_field = preg_replace('/:.*$/', '', $name_field);
        $search     = array_unique(array($name_field, $uid_field));

        $config['search_fields']   = $search;
        $config['required_fields'] = array($uid_field);

        // set search filter
        if ($filter)
            $config['filter'] = $filter;

        // disable vlv
        $config['vlv'] = false;

        // Initialize LDAP connection
        $this->ldap = new rcube_ldap($config,
            $this->rc->config->get('ldap_debug'),
            $this->rc->config->mail_domain($_SESSION['imap_host']));

        return $this->ldap->ready;
    }

    /**
     * Modify user login according to 'login_lc' setting
     */
    protected function mod_login($user)
    {
        $login_lc = $this->rc->config->get('login_lc');

        if ($login_lc === true || $login_lc == 2) {
            $user = mb_strtolower($user);
        }
        // lowercase domain name
        else if ($login_lc && strpos($user, '@')) {
            list($local, $domain) = explode('@', $user);
            $user = $local . '@' . mb_strtolower($domain);
        }

        return $user;
    }

    /******** PRIVATE **********/
    /**
     * Récupère le username en fonction du compte dans l'url ou de la session
     * @return string
     */
    private function get_username() {
        if (!isset($this->user_name))
            $this->set_user_properties();

        return $this->user_name;
    }
    /**
     * Récupère l'uid de la boite, sans l'objet de partage si c'est une boite partagée
     * @return string
     */
    private function get_user_bal() {
        if (!isset($this->user_bal))
            $this->set_user_properties();

        return $this->user_bal;
    }
    /**
     * Récupère l'uid de l'objet de partage
     * @return string
     */
    private function get_share_objet() {
        if (!isset($this->user_objet_share))
            $this->set_user_properties();

        return $this->user_objet_share;
    }
    /**
     * Récupère l'host de l'utilisateur
     * @return string
     */
    private function get_host() {
        if (!isset($this->user_host))
            $this->set_user_properties();

        return $this->user_host;
    }
    /**
     * Définition des propriétées de l'utilisateur
     */
    private function set_user_properties() {
        // Chargement de l'account passé en Get
        $this->get_account = mel::get_account();
        if (!empty($this->get_account)) {
            // Récupère la liste des bal gestionnaire de l'utilisateur
            $list_balp = mel::get_user_balp_gestionnaire($this->rc->get_user_name());
            $is_gestionnaire = false;
            // Récupération du username depuis l'url
            $this->user_name = urldecode($this->get_account);
            $inf = explode('@', $this->user_name);
            $this->user_objet_share = $inf[0];
            $this->user_host = $inf[1];
            list($username, $balpname) = driver_mel::get_instance()->getBalpnameFromUsername($this->user_objet_share);
            if (isset($balpname)) {
              $this->user_bal = $balpname;
            }
            else {
              $this->user_bal = $this->user_objet_share;
            }
            // Parcour les bal pour vérifier qu'il est bien gestionnaire
            foreach($list_balp as $balp) {
                $uid = $balp['uid'][0];
                if ($this->user_objet_share == $uid) {
                    // La bal est bien en gestionnaire
                    $is_gestionnaire = true;
                    break;
                }
            }
            // Si pas de bal gestionnaire on remet les infos de l'utilisateur
            if (!$is_gestionnaire) {
                // Récupération du username depuis la session
                $this->user_name = $this->rc->get_user_name();
                $this->user_objet_share = $this->rc->user->get_username('local');
                $this->user_host = $this->rc->user->get_username('host');
                $this->user_bal = $this->user_objet_share;
            }
        }
        else {
            // Récupération du username depuis la session
            $this->user_name = $this->rc->get_user_name();
            $this->user_objet_share = $this->rc->user->get_username('local');
            $this->user_host = $this->rc->user->get_username('host');
            $this->user_bal = $this->user_objet_share;
        }
    }
}
