<?php

/**
 * Provider class for accessing historic groupware object data through the Bonnie service
 *
 * API Specification at https://wiki.kolabsys.com/User:Bruederli/Draft:Bonnie_Client_API
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

class kolab_bonnie_api
{
    public $ready = false;

    private $config = array();
    private $client = null;


    /**
     * Default constructor
     */
    public function __construct($config)
    {
        $this->config = $config;

        $this->client = new kolab_bonnie_api_client($config['uri'], $config['timeout'] ?: 30, (bool)$config['debug']);

        $this->client->set_secret($config['secret']);
        $this->client->set_authentication($config['user'], $config['pass']);
        $this->client->set_request_user(rcube::get_instance()->get_user_name());

        $this->ready = !empty($config['secret']) && !empty($config['user']) && !empty($config['pass']);
    }

    /**
     * Wrapper function for <object>.changelog() API call
     */
    public function changelog($type, $uid, $mailbox, $msguid=null)
    {
        return $this->client->execute($type.'.changelog', array('uid' => $uid, 'mailbox' => $mailbox, 'msguid' => $msguid));
    }

    /**
     * Wrapper function for <object>.diff() API call
     */
    public function diff($type, $uid, $rev1, $rev2, $mailbox, $msguid=null, $instance=null)
    {
        return $this->client->execute($type.'.diff', array(
          'uid' => $uid,
          'rev1' => $rev1,
          'rev2' => $rev2,
          'mailbox' => $mailbox,
          'msguid' => $msguid,
          'instance' => $instance,
        ));
    }

    /**
     * Wrapper function for <object>.get() API call
     */
    public function get($type, $uid, $rev, $mailbox, $msguid=null)
    {
      return $this->client->execute($type.'.get', array('uid' => $uid, 'rev' => $rev, 'mailbox' => $mailbox, 'msguid' => $msguid));
    }

    /**
     * Wrapper function for <object>.rawdata() API call
     */
    public function rawdata($type, $uid, $rev, $mailbox, $msguid=null)
    {
      return $this->client->execute($type.'.rawdata', array('uid' => $uid, 'rev' => $rev, 'mailbox' => $mailbox, 'msguid' => $msguid));
    }

    /**
     * Generic wrapper for direct API calls
     */
    public function _execute($method, $params = array())
    {
        return $this->client->execute($method, $params);
    }
}
