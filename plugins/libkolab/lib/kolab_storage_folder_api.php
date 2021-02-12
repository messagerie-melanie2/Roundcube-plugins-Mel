<?php

/**
 * Abstract interface class for Kolab storage IMAP folder objects
 *
 * @author Thomas Bruederli <bruederli@kolabsys.com>
 *
 * Copyright (C) 2014, Kolab Systems AG <contact@kolabsys.com>
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
abstract class kolab_storage_folder_api
{
    /**
     * Folder identifier
     * @var string
     */
    public $id;

    /**
     * The folder name.
     * @var string
     */
    public $name;

    /**
     * The type of this folder.
     * @var string
     */
    public $type;

    /**
     * The subtype of this folder.
     * @var string
     */
    public $subtype;

    /**
     * Is this folder set to be the default for its type
     * @var boolean
     */
    public $default = false;

    /**
     * List of direct child folders
     * @var array
     */
    public $children = array();

    /**
     * Name of the parent folder
     * @var string
     */
    public $parent = '';

    protected $imap;
    protected $owner;
    protected $info;
    protected $idata;
    protected $namespace;
    protected $metadata;


    /**
     * Private constructor
     */
    protected function __construct($name)
    {
      $this->name = $name;
      $this->id   = kolab_storage::folder_id($name);
      $this->imap = rcube::get_instance()->get_storage();
    }


    /**
     * Returns the owner of the folder.
     *
     * @param boolean  Return a fully qualified owner name (i.e. including domain for shared folders)
     * @return string  The owner of this folder.
     */
    public function get_owner($fully_qualified = false)
    {
        // return cached value
        if (isset($this->owner))
            return $this->owner;

        $info = $this->get_folder_info();
        $rcmail = rcube::get_instance();

        switch ($info['namespace']) {
        case 'personal':
            $this->owner = $rcmail->get_user_name();
            break;

        case 'shared':
            $this->owner = 'anonymous';
            break;

        default:
            list($prefix, $this->owner) = explode($this->imap->get_hierarchy_delimiter(), $info['name']);
            $fully_qualified = true;  // enforce email addresses (backwards compatibility)
            break;
        }

        if ($fully_qualified && strpos($this->owner, '@') === false) {
            // extract domain from current user name
            $domain = strstr($rcmail->get_user_name(), '@');
            // fall back to mail_domain config option
            if (empty($domain) && ($mdomain = $rcmail->config->mail_domain($this->imap->options['host']))) {
                $domain = '@' . $mdomain;
            }
            $this->owner .= $domain;
        }

        return $this->owner;
    }


    /**
     * Getter for the name of the namespace to which the IMAP folder belongs
     *
     * @return string Name of the namespace (personal, other, shared)
     */
    public function get_namespace()
    {
        if (!isset($this->namespace))
            $this->namespace = $this->imap->folder_namespace($this->name);

        return $this->namespace;
    }

    /**
     * Get the display name value of this folder
     *
     * @return string Folder name
     */
    public function get_name()
    {
        return kolab_storage::object_name($this->name);
    }

    /**
     * Getter for the top-end folder name (not the entire path)
     *
     * @return string Name of this folder
     */
    public function get_foldername()
    {
        $parts = explode($this->imap->get_hierarchy_delimiter(), $this->name);

        return rcube_charset::convert(end($parts), 'UTF7-IMAP');
    }

    /**
     * Getter for parent folder path
     *
     * @return string Full path to parent folder
     */
    public function get_parent()
    {
        $delim = $this->imap->get_hierarchy_delimiter();
        $path  = explode($delim, $this->name);

        array_pop($path);

        // don't list top-level namespace folder
        if (count($path) == 1 && in_array($this->get_namespace(), array('other', 'shared'))) {
            $path = array();
        }

        return join($delim, $path);
    }

    /**
     * Getter for the Cyrus mailbox identifier corresponding to this folder
     * (e.g. user/john.doe/Calendar/Personal@example.org)
     *
     * @return string Mailbox ID
     */
    public function get_mailbox_id()
    {
        $info = $this->get_folder_info();
        $owner = $this->get_owner();
        list($user, $domain) = explode('@', $owner);

        switch ($info['namespace']) {
        case 'personal':
            return sprintf('user/%s/%s@%s', $user, $this->name, $domain);

        case 'shared':
            $ns = $this->imap->get_namespace('shared');
            $prefix = is_array($ns) ? $ns[0][0] : '';
            list(, $domain) = explode('@', rcube::get_instance()->get_user_name());
            return substr($this->name, strlen($prefix)) . '@' . $domain;

        default:
            $ns = $this->imap->get_namespace('other');
            $prefix = is_array($ns) ? $ns[0][0] : '';
            list($user, $folder) = explode($this->imap->get_hierarchy_delimiter(), substr($info['name'], strlen($prefix)), 2);
            if (strpos($user, '@')) {
                list($user, $domain) = explode('@', $user);
            }
            return sprintf('user/%s/%s@%s', $user, $folder, $domain);
        }
    }

    /**
     * Get the color value stored in metadata
     *
     * @param string Default color value to return if not set
     * @return mixed Color value from IMAP metadata or $default is not set
     */
    public function get_color($default = null)
    {
        // color is defined in folder METADATA
        $metadata = $this->get_metadata();
        if (($color = $metadata[kolab_storage::COLOR_KEY_PRIVATE]) || ($color = $metadata[kolab_storage::COLOR_KEY_SHARED])) {
            return $color;
        }

        return $default;
    }

    /**
     * Returns IMAP metadata/annotations (GETMETADATA/GETANNOTATION)
     * supported by kolab_storage
     *
     * @return array Metadata entry-value hash array on success, NULL on error
     */
    public function get_metadata()
    {
        if ($this->metadata === null) {
            $this->metadata = kolab_storage::folder_metadata($this->name);
        }

        return $this->metadata;
    }

    /**
     * Sets IMAP metadata/annotations (SETMETADATA/SETANNOTATION)
     *
     * @param array  $entries Entry-value array (use NULL value as NIL)
     * @return boolean True on success, False on failure
     */
    public function set_metadata($entries)
    {
        $this->metadata = null;
        return $this->imap->set_metadata($this->name, $entries);
    }

    /**
     *
     */
    public function get_folder_info()
    {
        if (!isset($this->info))
            $this->info = $this->imap->folder_info($this->name);

        return $this->info;
    }

    /**
     * Make IMAP folder data available for this folder
     */
    public function get_imap_data()
    {
        if (!isset($this->idata))
            $this->idata = $this->imap->folder_data($this->name);

        return $this->idata;
    }

    /**
     * Returns (full) type of IMAP folder
     *
     * @return string Folder type
     */
    public function get_type()
    {
        $metadata = $this->get_metadata();

        if (!empty($metadata)) {
            return kolab_storage::folder_select_metadata($metadata);
        }

        return $this->type;
    }

    /**
     * Get IMAP ACL information for this folder
     *
     * @return string  Permissions as string
     */
    public function get_myrights()
    {
        $rights = $this->info['rights'];

        if (!is_array($rights))
            $rights = $this->imap->my_rights($this->name);

        return join('', (array)$rights);
    }

    /**
     * Helper method to extract folder UID metadata
     *
     * @return string Folder's UID
     */
    public function get_uid()
    {
        // To be implemented by extending classes
        return false;
    }

    /**
     * Check activation status of this folder
     *
     * @return boolean True if enabled, false if not
     */
    public function is_active()
    {
        return kolab_storage::folder_is_active($this->name);
    }

    /**
     * Change activation status of this folder
     *
     * @param boolean The desired subscription status: true = active, false = not active
     *
     * @return True on success, false on error
     */
    public function activate($active)
    {
        return $active ? kolab_storage::folder_activate($this->name) : kolab_storage::folder_deactivate($this->name);
    }

    /**
     * Check subscription status of this folder
     *
     * @return boolean True if subscribed, false if not
     */
    public function is_subscribed()
    {
        return kolab_storage::folder_is_subscribed($this->name);
    }

    /**
     * Change subscription status of this folder
     *
     * @param boolean The desired subscription status: true = subscribed, false = not subscribed
     *
     * @return True on success, false on error
     */
    public function subscribe($subscribed)
    {
        return $subscribed ? kolab_storage::folder_subscribe($this->name) : kolab_storage::folder_unsubscribe($this->name);
    }

    /**
     * Return folder name as string representation of this object
     *
     * @return string Full IMAP folder name
     */
    public function __toString()
    {
        return $this->name;
    }
}
