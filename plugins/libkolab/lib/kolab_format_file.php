<?php

/**
 * Kolab File model class
 *
 * @version @package_version@
 * @author Thomas Bruederli <bruederli@kolabsys.com>
 * @author Aleksander Machniak <machniak@kolabsys.com>
 *
 * Copyright (C) 2012, Kolab Systems AG <contact@kolabsys.com>
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

class kolab_format_file extends kolab_format
{
    public $CTYPE = 'application/vnd.kolab+xml';

    protected $objclass = 'File';
    protected $read_func = 'kolabformat::readKolabFile';
    protected $write_func = 'kolabformat::writeKolabFile';

    protected $sensitivity_map = array(
        'public'       => kolabformat::ClassPublic,
        'private'      => kolabformat::ClassPrivate,
        'confidential' => kolabformat::ClassConfidential,
    );

    /**
     * Set properties to the kolabformat object
     *
     * @param array  Object data as hash array
     */
    public function set(&$object)
    {
        // set common object properties
        parent::set($object);

        $this->obj->setClassification($this->sensitivity_map[$object['sensitivity']]);
        $this->obj->setCategories(self::array2vector($object['categories']));

        if (isset($object['notes'])) {
            $this->obj->setNote($object['notes']);
        }

        // Add file attachment
        if (!empty($object['_attachments'])) {
            $cid         = key($object['_attachments']);
            $attach_attr = $object['_attachments'][$cid];
            $attach      = new Attachment;

            $attach->setLabel((string)$attach_attr['name']);
            $attach->setUri('cid:' . $cid, $attach_attr['mimetype']);
            $this->obj->setFile($attach);

            // make sure size is set, so object saved in cache contains this info
            if (!isset($attach_attr['size'])) {
                $size = 0;

                if (!empty($attach_attr['content'])) {
                    if (is_resource($attach_attr['content'])) {
                        $stat = fstat($attach_attr['content']);
                        $size = $stat ? $stat['size'] : 0;
                    }
                    else {
                        $size = strlen($attach_attr['content']);
                    }
                }
                else if (isset($attach_attr['path'])) {
                    $size = @filesize($attach_attr['path']);
                }

                $object['_attachments'][$cid]['size'] = $size;
            }
        }

        // cache this data
        $this->data = $object;
        unset($this->data['_formatobj']);
    }

    /**
     * Check if object's data validity
     */
    public function is_valid()
    {
        return !$this->formaterror && ($this->data || (is_object($this->obj) && $this->obj->isValid()));
    }

    /**
     * Convert the Configuration object into a hash array data structure
     *
     * @param array Additional data for merge
     *
     * @return array  Config object data as hash array
     */
    public function to_array($data = array())
    {
        // return cached result
        if (!empty($this->data)) {
            return $this->data;
        }

        // read common object props into local data object
        $object = parent::to_array($data);

        $sensitivity_map = array_flip($this->sensitivity_map);

        // read object properties
        $object += array(
            'sensitivity' => $sensitivity_map[$this->obj->classification()],
            'categories'  => self::vector2array($this->obj->categories()),
            'notes'       => $this->obj->note(),
        );

        return $this->data = $object;
    }

    /**
     * Callback for kolab_storage_cache to get object specific tags to cache
     *
     * @return array List of tags to save in cache
     */
    public function get_tags()
    {
        $tags = array();

        foreach ((array)$this->data['categories'] as $cat) {
            $tags[] = rcube_utils::normalize_string($cat);
        }

        // Add file mimetype to tags
        if (!empty($this->data['_attachments'])) {
            reset($this->data['_attachments']);
            $key        = key($this->data['_attachments']);
            $attachment = $this->data['_attachments'][$key];

            if ($attachment['mimetype']) {
                $tags[] = $attachment['mimetype'];
            }
        }

        return $tags;
    }
}
