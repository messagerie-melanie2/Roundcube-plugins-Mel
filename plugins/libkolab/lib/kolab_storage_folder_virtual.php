<?php

/**
 * Helper class that represents a virtual IMAP folder
 * with a subset of the kolab_storage_folder API.
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
class kolab_storage_folder_virtual extends kolab_storage_folder_api
{
    public $virtual = true;

    protected $displayname;

    public function __construct($name, $dispname, $ns, $parent = '')
    {
        parent::__construct($name);

        $this->namespace = $ns;
        $this->parent    = $parent;
        $this->displayname = $dispname;
    }

    /**
     * Get the display name value of this folder
     *
     * @return string Folder name
     */
    public function get_name()
    {
        return $this->displayname ?: parent::get_name();
    }

    /**
     * Get the color value stored in metadata
     *
     * @param string Default color value to return if not set
     * @return mixed Color value from IMAP metadata or $default is not set
     */
    public function get_color($default = null)
    {
        return $default;
    }
}
