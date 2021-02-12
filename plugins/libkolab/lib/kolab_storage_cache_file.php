<?php

/**
 * Kolab storage cache class for file objects
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

class kolab_storage_cache_file extends kolab_storage_cache
{
    protected $extra_cols = array('filename');
    protected $data_props = array('type', 'size', 'filename', 'fileid');

    /**
     * Helper method to convert the given Kolab object into a dataset to be written to cache
     *
     * @override
     */
    protected function _serialize($object)
    {
        if (!empty($object['_attachments'])) {
            reset($object['_attachments']);

            $file = $object['_attachments'][key($object['_attachments'])];

            $object['type']   = $file['mimetype'];
            $object['size']   = $file['size'];
            $object['fileid'] = $file['id'];
        }

        $sql_data = parent::_serialize($object);

        if (!empty($file)) {
            $sql_data['filename'] = $file['name'];
        }

        return $sql_data;
    }

    /**
     * Helper method to turn stored cache data into a valid storage object
     *
     * @override
     */
    protected function _unserialize($sql_arr)
    {
        $object = parent::_unserialize($sql_arr);

        if ($object && !empty($object['_attachments'])) {
            $file = $object['_attachments'][key($object['_attachments'])];

            $object['type']   = $file['mimetype'];
            $object['size']   = $file['size'];
            $object['fileid'] = $file['id'];
        }

        return $object;
    }
}
