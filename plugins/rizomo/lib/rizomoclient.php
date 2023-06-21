<?php
/**
 * Plugin Rizomo
 * 
 * Integration of Rizomo as an iFrame in Roundcube
 * 
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

/**
 * Classe cliente de gestion des API Rizomo
 *
 * @author Thomas Payen <thomas.payen@i-carre.net>
 */
class RizomoClient {
  /**
   * URL vers l'instance Rizomo
   *
   * @var string
   */
  private $_api_url;
  /**
   *
   * @var rcmail
   */
  private $rc;
  /**
   * User agent
   *
   * @var string
   */
  private $_user_agent;
  
  /**
   * API user create
   *
   * @var string
   */
  const USER_CREATE = 'createUser';
  /**
   * API user create token
   *
   * @var string
   */
  const USER_CREATETOKEN = 'createUserToken';
  
  /**
   * Constructeur par défaut
   */
  public function __construct() {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RizomoClient::__construct()");

    $this->rc = rcmail::get_instance();
    $this->_api_url = $this->rc->config->get('rizomo_api_url');
    $this->_user_agent = $this->rc->config->get('curl_rizomo_user_agent', "Rizomo Client");
  }
  
  /**
   * Création d'un nouvel utilisateur Rocket.Chat
   *
   * @param string $username
   * @param string $email
   * @param string $password
   * @param string $name
   * 
   * @return boolean
   */
  public function createUser($username, $email, $firstname, $lastname) {
    mel_logs::get_instance()->log(mel_logs::INFO, "RizomoClient::createUser($username, $email, $firstname, $lastname)");
    
    $params = array(
        "username"    => $username,
        "email"       => $email,
        "firstname"   => $firstname,
        "lastname"    => $lastname,
    );
    
    $headers = [
      "X-API-KEY: " . $this->rc->config->get('rizomo_api_createuser_api_key'),
    ];
    
    $result = $this->_post_url($this->_api_url . self::USER_CREATE, $params, null, $headers);

    if (isset($result['httpCode']) 
        && $result['httpCode'] == 200) {
      mel_logs::get_instance()->log(mel_logs::TRACE, "RizomoClient::createUser() result: " . var_export($result, true));
      return true;
    }
    else {
      // Si c'est false ça doit vouloir dire que l'utilisateur existe déjà
      mel_logs::get_instance()->log(mel_logs::ERROR, "RizomoClient::createUser() Error result: " . var_export($result, true));
      return false;
    }
  }

  /**
   * Création d'un token pour l'utilisateur Rizomo
   *
   * @param string $email
   * 
   * @return boolean|string false si erreur, token sinon
   */
  public function createUserToken($email) {
    mel_logs::get_instance()->log(mel_logs::INFO, "RizomoClient::createUserToken($email)");

    $params = [
      "email" => $email,
    ];
    
    $headers = [
      "X-API-KEY: " . $this->rc->config->get('rizomo_api_createusertoken_api_key'),
    ];
    
    $result = $this->_post_url($this->_api_url . self::USER_CREATETOKEN, $params, null, $headers);

    if (isset($result['httpCode']) 
        && $result['httpCode'] == 200) {
      mel_logs::get_instance()->log(mel_logs::TRACE, "RizomoClient::createUserToken() result: " . var_export($result, true));
      return $result['content'];
    }
    else {
      // Si c'est false on peut considérer que l'utilisateur n'existe pas et donc qu'il faut le créer
      mel_logs::get_instance()->log(mel_logs::ERROR, "RizomoClient::createUserToken() Error result: " . var_export($result, true));
      return false;
    }
  }

  /**
   * Permet de récupérer le contenu d'une page Web
   *
   * @param string $url
   * @param array $params
   *          [Optionnel]
   * @param array $headers
   *          [Optionnel]
   * @return array('content', 'httpCode')
   */
  private function _get_url($url, $params = null, $headers = null) {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RizomoClient::_get_url($url, $params, $headers)");

    // Options list
    $options = array(
        CURLOPT_RETURNTRANSFER => true, // return web page
        CURLOPT_HEADER => false, // don't return headers
        CURLOPT_USERAGENT => $this->_user_agent, // name of client
        CURLOPT_CONNECTTIMEOUT => 120, // time-out on connect
        CURLOPT_TIMEOUT => 120, // time-out on response
        CURLOPT_SSL_VERIFYPEER  => $this->rc->config->get('curl_rizomo_ssl_verifierpeer', 0),
        CURLOPT_SSL_VERIFYHOST  => $this->rc->config->get('curl_rizomo_ssl_verifierhost', 0),
    );

    // CA File
    $curl_cafile = $this->rc->config->get('curl_rizomo_cainfo', null);
    if (isset($curl_cafile)) {
      $options[CURLOPT_CAINFO] = $curl_cafile;
      $options[CURLOPT_CAPATH] = $curl_cafile;
    }

    // HTTP Proxy
    $curl_proxy = $this->rc->config->get('curl_rizomo_http_proxy', null);
    if (isset($curl_proxy)) {
      $options[CURLOPT_PROXY] = $curl_proxy;
    }

    if (isset($headers)) {
      $options[CURLOPT_HTTPHEADER] = $headers;
    }
    
    // params
    if (isset($params)) {
      if (strpos($url, '?') === false) {
        $url .= '?';
      } else {
        $url .= '&';
      }
      $url .= http_build_query($params);
    }
    // open connection
    $ch = curl_init($url);
    // Set the options
    curl_setopt_array($ch, $options);
    // Execute the request and get the content
    $content = curl_exec($ch);
    // Get the HTTP Code
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    // Close connection
    curl_close($ch);
    // Return the content
    return array(
        'httpCode'  => $httpcode,
        'content'   => $content
    );
  }
  
  /**
   * Permet de poster des paramètres vers une page web
   *
   * @param string $url
   * @param array $params
   *          [Optionnel]
   * @param string $json
   *          [Optionnel]
   * @param array $headers
   *          [Optionnel]
   * @return array('content', 'httpCode')
   */
  private function _post_url($url, $params = null, $json = null, $headers = null) {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RizomoClient::_post_url($url, $params, $json, $headers)");

    // Génération du json en fonction des paramètres
    if (isset($params)) {
      $data_string = json_encode($params);
    } else if (isset($json)) {
      $data_string = $json;
    } else {
      $data_string = "";
    }
    
    // Options list
    $options = array(
        CURLOPT_RETURNTRANSFER => true, // return web page
        CURLOPT_HEADER => false, // don't return headers
        CURLOPT_USERAGENT => $this->_user_agent, // name of client
        CURLOPT_CONNECTTIMEOUT => 120, // time-out on connect
        CURLOPT_TIMEOUT => 120, // time-out on response
        CURLOPT_SSL_VERIFYPEER  => $this->rc->config->get('curl_rizomo_ssl_verifierpeer', 0),
        CURLOPT_SSL_VERIFYHOST  => $this->rc->config->get('curl_rizomo_ssl_verifierhost', 0),
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $data_string,
        CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json; charset=utf-8',
            'Content-Length: ' . strlen($data_string)
        )
    );

    // CA File
    $curl_cafile = $this->rc->config->get('curl_rizomo_cainfo', null);
    if (isset($curl_cafile)) {
      $options[CURLOPT_CAINFO] = $curl_cafile;
      $options[CURLOPT_CAPATH] = $curl_cafile;
    }

    // HTTP Proxy
    $curl_proxy = $this->rc->config->get('curl_rizomo_http_proxy', null);
    if (isset($curl_proxy)) {
      $options[CURLOPT_PROXY] = $curl_proxy;
    }

    if (isset($headers)) {
      $options[CURLOPT_HTTPHEADER] = array_merge($options[CURLOPT_HTTPHEADER], $headers);
    }
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RizomoClient::_post_url() options: " . var_export($options, true));

    // open connection
    $ch = curl_init($url);
    // Set the options
    curl_setopt_array($ch, $options);
    // Execute the request and get the content
    $content = curl_exec($ch);
    // Get the HTTP Code
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    // Close connection
    curl_close($ch);
    // Return the content
    return array(
        'httpCode'  => $httpcode,
        'content'   => $content
    );
  }
}