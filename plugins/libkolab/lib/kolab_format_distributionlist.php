<?php

/**
 * Kolab Distribution List model class
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

class kolab_format_distributionlist extends kolab_format
{
    public $CTYPE = 'application/vcard+xml';
    public $CTYPEv2 = 'application/x-vnd.kolab.distribution-list';

    protected $objclass = 'DistList';
    protected $read_func = 'readDistlist';
    protected $write_func = 'writeDistlist';


    /**
     * Set properties to the kolabformat object
     *
     * @param array  Object data as hash array
     */
    public function set(&$object)
    {
        // set common object properties
        parent::set($object);

        $this->obj->setName($object['name']);

        $seen = array();
        $members = new vectorcontactref;
        foreach ((array)$object['member'] as $i => $member) {
            if ($member['uid']) {
                $key = 'uid:' . $member['uid'];
                $m = new ContactReference(ContactReference::UidReference, $member['uid']);
            }
            else if ($member['email']) {
                $key = 'mailto:' . $member['email'];
                $m = new ContactReference(ContactReference::EmailReference, $member['email']);
                $m->setName($member['name']);
            }
            else {
                continue;
            }

            if (!$seen[$key]++) {
                $members->push($m);
            }
            else {
                // remove dupes for caching
                unset($object['member'][$i]);
            }
        }

        $this->obj->setMembers($members);

        // set type property for proper caching
        $object['_type'] = 'distribution-list';

        // cache this data
        $this->data = $object;
        unset($this->data['_formatobj']);
    }

    public function is_valid()
    {
        return !$this->formaterror && ($this->data || (is_object($this->obj) && $this->obj->isValid()));
    }

    /**
     * Convert the Distlist object into a hash array data structure
     *
     * @param array Additional data for merge
     *
     * @return array  Distribution list data as hash array
     */
    public function to_array($data = array())
    {
        // return cached result
        if (!empty($this->data))
            return $this->data;

        // read common object props into local data object
        $object = parent::to_array($data);

        // add object properties
        $object += array(
            'name'      => $this->obj->name(),
            'member'    => array(),
            '_type'     => 'distribution-list',
        );

        $members = $this->obj->members();
        for ($i=0; $i < $members->size(); $i++) {
            $member = $members->get($i);
//            if ($member->type() == ContactReference::UidReference && ($uid = $member->uid()))
                $object['member'][] = array(
                    'uid'   => $member->uid(),
                    'email' => $member->email(),
                    'name'  => $member->name(),
                );
        }

        $this->data = $object;
        return $this->data;
    }

}
