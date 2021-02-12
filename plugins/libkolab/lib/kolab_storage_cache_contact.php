<?php

/**
 * Kolab storage cache class for contact objects
 *
 * @author Thomas Bruederli <bruederli@kolabsys.com>
 *
 * Copyright (C) 2013, Kolab Systems AG <contact@kolabsys.com>
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

class kolab_storage_cache_contact extends kolab_storage_cache
{
    protected $extra_cols_max = 255;
    protected $extra_cols     = array('type', 'name', 'firstname', 'surname', 'email');
    protected $data_props     = array('type', 'name', 'firstname', 'middlename', 'prefix', 'suffix', 'surname', 'email', 'organization', 'member');

    /**
     * Helper method to convert the given Kolab object into a dataset to be written to cache
     *
     * @override
     */
    protected function _serialize($object)
    {
        $sql_data = parent::_serialize($object);
        $sql_data['type'] = $object['_type'];

        // columns for sorting
        $sql_data['name']      = rcube_charset::clean($object['name'] . $object['prefix']);
        $sql_data['firstname'] = rcube_charset::clean($object['firstname'] . $object['middlename'] . $object['surname']);
        $sql_data['surname']   = rcube_charset::clean($object['surname']   . $object['firstname']  . $object['middlename']);
        $sql_data['email']     = rcube_charset::clean(is_array($object['email']) ? $object['email'][0] : $object['email']);

        if (is_array($sql_data['email'])) {
            $sql_data['email'] = $sql_data['email']['address'];
        }
        // avoid value being null
        if (empty($sql_data['email'])) {
            $sql_data['email'] = '';
        }

        // use organization if name is empty
        if (empty($sql_data['name']) && !empty($object['organization'])) {
            $sql_data['name'] = rcube_charset::clean($object['organization']);
        }

        // make sure some data is not longer that database limit (#5291)
        foreach ($this->extra_cols as $col) {
            if (strlen($sql_data[$col]) > $this->extra_cols_max) {
                $sql_data[$col] = rcube_charset::clean(substr($sql_data[$col], 0,  $this->extra_cols_max));
            }
        }

        return $sql_data;
    }
}
