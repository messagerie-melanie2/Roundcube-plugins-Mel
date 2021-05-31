<?php

/**
 * JSON-RPC client class with some extra features for communicating with the Bonnie API service.
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

class kolab_bonnie_api_client
{
    /**
     * URL of the RPC endpoint
     * @var string
     */
    protected $url;

    /**
     * HTTP client timeout in seconds
     * @var integer
     */
    protected $timeout;

    /**
     * Debug flag
     * @var bool
     */
    protected $debug;

    /**
     * Username for authentication
     * @var string
     */
    protected $username;

    /**
     * Password for authentication
     * @var string
     */
    protected $password;

    /**
     * Secret key for request signing
     * @var string
     */
    protected $secret;

    /**
     * Default HTTP headers to send to the server
     * @var array
     */
    protected $headers = array(
        'Connection' => 'close',
        'Content-Type' => 'application/json',
        'Accept' => 'application/json',
    );

    /**
     * Constructor
     *
     * @param  string  $url      Server URL
     * @param  integer $timeout  Request timeout
     * @param  bool    $debug    Enabled debug logging
     * @param  array   $headers  Custom HTTP headers
     */
    public function __construct($url, $timeout = 5, $debug = false, $headers = array())
    {
        $this->url = $url;
        $this->timeout = $timeout;
        $this->debug = $debug;
        $this->headers = array_merge($this->headers, $headers);
    }

    /**
     * Setter for secret key for request signing
     */
    public function set_secret($secret)
    {
        $this->secret = $secret;
    }

    /**
     * Setter for the X-Request-User header
     */
    public function set_request_user($username)
    {
        $this->headers['X-Request-User'] = $username;
    }

    /**
     * Set authentication parameters
     *
     * @param  string $username  Username
     * @param  string $password  Password
     */
    public function set_authentication($username, $password)
    {
        $this->username = $username;
        $this->password = $password;
    }

    /**
     * Automatic mapping of procedures
     *
     * @param  string $method  Procedure name
     * @param  array  $params  Procedure arguments
     * @return mixed
     */
    public function __call($method, $params)
    {
        return $this->execute($method, $params);
    }

    /**
     * Execute an RPC command
     *
     * @param  string $method  Procedure name
     * @param  array  $params  Procedure arguments
     * @return mixed
     */
    public function execute($method, array $params = array())
    {
        $id = mt_rand();

        $payload = array(
            'jsonrpc' => '2.0',
            'method' => $method,
            'id' => $id,
        );

        if (!empty($params)) {
            $payload['params'] = $params;
        }

        $result = $this->send_request($payload, $method != 'system.keygen');

        if (isset($result['id']) && $result['id'] == $id && array_key_exists('result', $result)) {
            return $result['result'];
        }
        else if (isset($result['error'])) {
            $this->_debug('ERROR', $result);
        }

        return null;
    }

    /**
     * Do the HTTP request
     *
     * @param  string  $payload  Data to send
     */
    protected function send_request($payload, $sign = true)
    {
        try {
            $payload_ = json_encode($payload);

            // add request signature
            if ($sign && !empty($this->secret)) {
                $this->headers['X-Request-Sign'] = $this->request_signature($payload_);
            }
            else if ($this->headers['X-Request-Sign']) {
                unset($this->headers['X-Request-Sign']);
            }

            $this->_debug('REQUEST', $payload, $this->headers);
            $request = libkolab::http_request($this->url, 'POST', array('timeout' => $this->timeout));
            $request->setHeader($this->headers);
            $request->setAuth($this->username, $this->password);
            $request->setBody($payload_);

            $response = $request->send();

            if ($response->getStatus() == 200) {
                $result = json_decode($response->getBody(), true);
                $this->_debug('RESPONSE', $result);
            }
            else {
                throw new Exception(sprintf("HTTP %d %s", $response->getStatus(), $response->getReasonPhrase()));
            }
        }
        catch (Exception $e) {
            rcube::raise_error(array(
                'code' => 500,
                'type' => 'php',
                'message' => "Bonnie API request failed: " . $e->getMessage(),
            ), true);

            return array('id' => $payload['id'], 'error' => $e->getMessage(), 'code' => -32000);
        }

        return is_array($result) ? $result : array();
    }

    /**
     * Compute the hmac signature for the current event payload using
     * the secret key configured for this API client
     *
     * @param string $data The request payload data
     * @return string The request signature
     */
    protected function request_signature($data)
    {
        // TODO: get the session key with a system.keygen call
        return hash_hmac('sha256', $this->headers['X-Request-User'] . ':' . $data, $this->secret);
    }

    /**
     * Write debug log
     */
    protected function _debug(/* $message, $data1, data2, ...*/)
    {
        if (!$this->debug)
            return;

        $args = func_get_args();

        $msg = array();
        foreach ($args as $arg) {
            $msg[] = !is_string($arg) ? var_export($arg, true) : $arg;
        }

        rcube::write_log('bonnie', join(";\n", $msg));
    }
}
