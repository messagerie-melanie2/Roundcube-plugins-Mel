<?php

/**
 * Class that represents a (virtual) folder in the 'other' namespace
 * implementing a subset of the kolab_storage_folder API.
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
class kolab_storage_folder_user extends kolab_storage_folder_virtual
{
    public $ldaprec;
    public $type;

    /**
     * Default constructor
     */
    public function __construct($name, $parent = '', $ldaprec = null)
    {
        parent::__construct($name, kolab_storage::object_prettyname($name), 'other', $parent);

        if (!empty($ldaprec)) {
            $this->ldaprec = $ldaprec;
        }
        else {
            $this->ldaprec = kolab_storage::folder_id2user(parent::get_foldername($this->name));
            if (!empty($this->ldaprec)) {
                $this->ldaprec['kolabtargetfolder'] = $name;
            }
        }
    }

    /**
     * Getter for the top-end folder name to be displayed
     *
     * @return string Name of this folder
     */
    public function get_foldername()
    {
        return $this->ldaprec ? ($this->ldaprec['displayname'] ?: $this->ldaprec['name']) :
            parent::get_foldername();
    }

    /**
     * Getter for a more informative title of this user folder
     *
     * @return string Title for the given user record
     */
    public function get_title()
    {
        return trim($this->ldaprec['displayname'] . '; ' . $this->ldaprec['mail'], '; ');
    }

    /**
     * Returns the owner of the folder.
     *
     * @return string  The owner of this folder.
     */
    public function get_owner($fully_qualified = false)
    {
        return $this->ldaprec['mail'];
    }

    /**
     * Check subscription status of this folder.
     * Subscription of a virtual user folder depends on the subscriptions of subfolders.
     *
     * @return boolean True if subscribed, false if not
     */
    public function is_subscribed()
    {
        if (!empty($this->type)) {
            $children = $subscribed = 0;
            $delimiter = $this->imap->get_hierarchy_delimiter();
            foreach ((array)kolab_storage::list_folders($this->name . $delimiter, '*', $this->type, false) as $subfolder) {
                if (kolab_storage::folder_is_subscribed($subfolder)) {
                    $subscribed++;
                }
                $children++;
            }
            if ($subscribed > 0) {
                return $subscribed == $children ? true : 2;
            }
        }

        return false;
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
        $success = false;

        // (un)subscribe all subfolders of a given type
        if (!empty($this->type)) {
            $delimiter = $this->imap->get_hierarchy_delimiter();
            foreach ((array)kolab_storage::list_folders($this->name . $delimiter, '*', $this->type, false) as $subfolder) {
                $success |= ($subscribed ? kolab_storage::folder_subscribe($subfolder) : kolab_storage::folder_unsubscribe($subfolder));
            }
        }

        return $success;
    }
}
