<?php

/**
 * Kolab Note model class
 *
 * @version @package_version@
 * @author Thomas Bruederli <bruederli@kolabsys.com>
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

class kolab_format_note extends kolab_format
{
    public $CTYPE = 'application/vnd.kolab+xml';
    public $CTYPEv2 = 'application/x-vnd.kolab.note';

    public static $fulltext_cols = array('title', 'description', 'categories');

    protected $objclass = 'Note';
    protected $read_func = 'readNote';
    protected $write_func = 'writeNote';

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

        $this->obj->setSummary($object['title']);
        $this->obj->setDescription($object['description']);
        $this->obj->setClassification($this->sensitivity_map[$object['sensitivity']]);
        $this->obj->setCategories(self::array2vector($object['categories']));

        $this->set_attachments($object);

        // cache this data
        $this->data = $object;
        unset($this->data['_formatobj']);
    }

    /**
     *
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
        if (!empty($this->data))
            return $this->data;

        // read common object props into local data object
        $object = parent::to_array($data);

        $sensitivity_map = array_flip($this->sensitivity_map);

        // read object properties
        $object += array(
            'sensitivity' => $sensitivity_map[$this->obj->classification()],
            'categories'  => self::vector2array($this->obj->categories()),
            'title'       => $this->obj->summary(),
            'description' => $this->obj->description(),
        );

        $this->get_attachments($object);

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

        // add tag for message references
        foreach ((array)$this->data['links'] as $link) {
            $url = parse_url($link);
            if ($url['scheme'] == 'imap') {
                parse_str($url['query'], $param);
                $tags[] = 'ref:' . trim($param['message-id'] ?: urldecode($url['fragment']), '<> ');
            }
        }

        return $tags;
    }

    /**
     * Callback for kolab_storage_cache to get words to index for fulltext search
     *
     * @return array List of words to save in cache
     */
    public function get_words()
    {
        $data = '';
        foreach (self::$fulltext_cols as $col) {
            // convert HTML content to plain text
            if ($col == 'description' && preg_match('/<(html|body)(\s[a-z]|>)/', $this->data[$col], $m) && strpos($this->data[$col], '</'.$m[1].'>')) {
                $converter = new rcube_html2text($this->data[$col], false, false, 0);
                $val = $converter->get_text();
            }
            else {
                $val = is_array($this->data[$col]) ? join(' ', $this->data[$col]) : $this->data[$col];
            }

            if (strlen($val))
                $data .= $val . ' ';
        }

        return array_filter(array_unique(rcube_utils::normalize_string($data, true)));
    }

}
