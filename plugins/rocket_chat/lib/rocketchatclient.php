<?php
/**
 * Plugin Rocket.Chat
 * Integration of Rocket.Chat as an iFrame in Roundcube
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
 * Classe cliente de gestion des API Rocket.Chat
 *
 * @author Thomas Payen <thomas.payen@i-carre.net>
 */
class RocketChatClient {
  /**
   * User ID Rocket.Chat
   *
   * @var string
   */
  private $_user_id;
  /**
   * Auth Token Rocket.Chat
   *
   * @var string
   */
  private $_auth_token;
  /**
   * URL vers l'instance Rocket.Chat
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
  private $_user_agent = "Rocket.Chat Client";
  /**
   * Vérification peer SSL
   *
   * @var boolean
   */
  private $_ssl_verify_peer = true;
  
  /**
   * API login
   *
   * @var string
   */
  const LOGIN = 'login';
  /**
   * API logout
   *
   * @var string
   */
  const LOGOUT = 'logout';
  /**
   * API user create
   *
   * @var string
   */
  const USER_CREATE = 'users.create';
  /**
   * API user update
   *
   * @var string
   */
  const USER_UPDATE = 'users.update';
  /**
   * API user create token
   *
   * @var string
   */
  const USER_CREATETOKEN = 'users.createToken';
  /**
   * API user info
   *
   * @var string
   */
  const USER_INFO = 'users.info';
  /**
   * Relative API URL
   *
   * @var string
   */
  const API_URL = 'api/v1/';
  
  /**
   * Constructeur par défaut
   *
   * @param rcmail $rc
   *          Instance rcmail
   * @param string $rocketChatUrl
   *          URL vers l'instance Rocket.Chat
   */
  public function __construct($rc = null, $rocketChatUrl = null) {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatClient::__construct()");
    $this->_user_id = null;
    $this->_auth_token = null;
    if (isset($rc)) {
      $this->rc = $rc;
      $this->_api_url = $this->rc->config->get('rocket_chat_url_api');
      $rocketChatUrl = null;
      $this->_user_agent = $this->rc->config->get('curl_user_agent');
      $this->_ssl_verify_peer = $this->rc->config->get('curl_ssl_verifierpeer');
    }
    if (isset($rocketChatUrl)) {
      $this->_api_url = $rocketChatUrl . self::API_URL;
    }
  }
  
  /**
   * Authentification sur les API Rocket.Chat
   *
   * @param string $username
   * @param string $password
   * @param boolean $force_auth
   * @return boolean true si Auth OK, false sinon
   */
  public function authentification($username = null, $password = null, $force_auth = false) {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatClient::authentification($username, $force_auth)");
    
    if ($force_auth) {
      $this->setAuthToken(null);
      $this->setUserId(null);
    }
    
    if (!isset($username)) {
      $username = $this->rc->get_user_name();
    }
    if (!isset($password)) {
      $password = $this->rc->get_user_password();
    }
    
    $auth_token = $this->getAuthToken();
    $user_id = $this->getUserId();
    if (!isset($auth_token)) {
      $params = array(
          "username" => $username,
          "password" => $password
      );
      $result = $this->_post_url($this->_api_url . self::LOGIN, $params);
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatClient::authentification() httpCode: " . $result['httpCode']);
      if (isset($result['content'])) {
        mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatClient::authentification() content: " . $result['content']);
        if (!is_array($result['content'])) {
          $result['content'] = json_decode($result['content'], true);
        }
        if (isset($result['content']['status']) && $result['content']['status'] == "success" && isset($result['content']['data'])) {
          $auth_token = $result['content']['data']['authToken'];
          $user_id = $result['content']['data']['userId'];
        }
      }
    }
    $this->setAuthToken($auth_token);
    $this->setUserId($user_id);
    
    return isset($auth_token);
  }
  /**
   * Deconnexion des API Rocket.Chat
   *
   * @return boolean
   */
  public function logout() {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatClient::logout()");
    
    $headers = array(
        "X-Auth-Token: " . $this->getAuthToken(),
        "X-User-Id: " . $this->getUserId()
    );
    
    $result = $this->_get_url($this->_api_url . self::LOGOUT, $params, $headers);
    $ret = false;
    if (isset($result['content'])) {
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatClient::logout() content: " . $result['content']);
      if (!is_array($result['content'])) {
        $result['content'] = json_decode($result['content'], true);
      }
      if (isset($result['content']['status']) && $result['content']['status'] == "success") {
        $ret = true;
      }
    }
    
    return $ret;
  }
  /**
   * Création d'un nouvel utilisateur Rocket.Chat
   *
   * @param string $username
   * @param string $email
   * @param string $password
   * @param string $name
   * @return boolean
   */
  public function createUser($username, $email, $password, $name) {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatClient::createUser($username, $email, $name)");
    
    $params = array(
        "username" => $username,
        "password" => $password,
        "email" => $email,
        "name" => $name,
        "verified" => true
    );
    
    $headers = array(
        "X-Auth-Token: " . $this->getAuthToken(),
        "X-User-Id: " . $this->getUserId()
    );
    
    $result = $this->_post_url($this->_api_url . self::USER_CREATE, $params, null, $headers);
    
    $ret = false;
    $user_id = null;
    $errorType = null;
    $error = "";
    if (isset($result['content'])) {
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatClient::createUser() content: " . $result['content']);
      if (!is_array($result['content'])) {
        $result['content'] = json_decode($result['content'], true);
      }
      $ret = isset($result['content']['success']) ? $result['content']['success'] : false;
      $user_id = isset($result['content']['user']['_id']) ? $result['content']['user']['_id'] : null;
      $errorType = isset($result['content']['errorType']) ? $result['content']['errorType'] : null;
      $error = isset($result['content']['error']) ? $result['content']['error'] : null;
    }
    
    if (!$ret) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "RocketChatClient::createUser() Error result: " . var_export($result, true));
    }
    
    return array(
        "success" => $ret,
        "user_id" => $user_id,
        "errorType" => $errorType,
        "error" => $error
    );
  }
  /**
   * Mise à jour du mot de passe de l'utilisateur Rocket.Chat
   *
   * @param string $userId
   * @param string $password
   * @return boolean
   */
  public function updateUserPassword($userId, $password) {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatClient::updateUserPassword($userId)");
    
    $params = array(
        "userId" => $userId,
        "data" => array(
            "password" => $password
        )
    );
    
    $headers = array(
        "X-Auth-Token: " . $this->getAuthToken(),
        "X-User-Id: " . $this->getUserId()
    );
    
    $result = $this->_post_url($this->_api_url . self::USER_UPDATE, $params, null, $headers);
    $ret = false;
    if (isset($result['content'])) {
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatClient::updateUserPassword() content: " . $result['content']);
      if (!is_array($result['content'])) {
        $result['content'] = json_decode($result['content'], true);
      }
      $ret = isset($result['content']['success']) ? $result['content']['success'] : false;
    }
    
    return $ret;
  }
  /**
   * Création d'un token pour l'utilisateur Rocket.Chat
   *
   * @param string $userId
   * 
   * @return boolean
   */
  public function createUserToken($userId) {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatClient::createUserToken($userId)");
    
    $params = array(
        "userId" => $userId
    );
    
    $headers = array(
        "X-Auth-Token: " . $this->getAuthToken(),
        "X-User-Id: " . $this->getUserId()
    );
    
    $result = $this->_post_url($this->_api_url . self::USER_CREATETOKEN, $params, null, $headers);
    $ret = false;
    $user_id = null;
    $errorType = null;
    if (isset($result['content'])) {
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatClient::createUserToken() content: " . $result['content']);
      if (!is_array($result['content'])) {
        $result['content'] = json_decode($result['content'], true);
      }
      $ret = isset($result['content']['success']) ? $result['content']['success'] : false;
      $authToken = isset($result['content']['data']['authToken']) ? $result['content']['data']['authToken'] : null;
      $errorType = isset($result['content']['errorType']) ? $result['content']['errorType'] : null;
    }
    
    return array(
        "success" => $ret,
        "authToken" => $authToken,
        "errorType" => $errorType
    );
  }
  /**
   * Récupération des infos de l'utilisateur Rocket.Chat s'il existe
   *
   * @param string $username
   * 
   * @return array infos
   */
  public function userInfo($username) {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatClient::userInfo($username)");
    
    $params = array(
        "username" => $username
    );
    
    $headers = array(
        "X-Auth-Token: " . $this->getAuthToken(),
        "X-User-Id: " . $this->getUserId()
    );
    
    $result = $this->_get_url($this->_api_url . self::USER_INFO, $params, $headers);
    $infos = null;
    if (isset($result['content'])) {
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatClient::userInfo() content: " . $result['content']);
      if (!is_array($result['content'])) {
        $result['content'] = json_decode($result['content'], true);
      }
      if (isset($result['content']['success']) && $result['content']['success'] == true && isset($result['content']['user'])) {
        $infos = [
          'id'        => $result['content']['user']['_id'],
          'name'      => $result['content']['user']['name'],
          'username'  => $username,
          'fname'     => $result['content']['user']['name'],
          'status'    => $result['content']['user']['status'],
        ]; 
      }
    }
    return $infos;
  }
  /**
   * Getter Auth Token
   *
   * @return string
   */
  public function getAuthToken() {
    return $this->_auth_token;
  }
  /**
   * Setter Auth Token
   *
   * @param string $auth_token
   */
  public function setAuthToken($auth_token) {
    $this->_auth_token = $auth_token;
  }
  /**
   * Getter User Id
   *
   * @return string
   */
  public function getUserId() {
    return $this->_user_id;
  }
  /**
   * Setter User Id
   *
   * @param string $user_id
   */
  public function setUserId($user_id) {
    $this->_user_id = $user_id;
  }
  /**
   * Setter Rocket.Chat URL
   *
   * @param string $rocketChatUrl
   */
  public function setRocketChatUrl($rocketChatUrl) {
    $this->_api_url = $rocketChatUrl . self::API_URL;
  }
  /**
   * Génération du username en fonction du name
   *
   * @param string $name
   * @return string
   */
  public function usernameFromName($name) {
    return trim($this->remove_accents(strtolower(str_replace(' ', '.', $name))));
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
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatClient::_get_url($url, $params, $headers)");
    // Options list
    $options = array(
        CURLOPT_RETURNTRANSFER => true, // return web page
        CURLOPT_HEADER => false, // don't return headers
        CURLOPT_USERAGENT => $this->_user_agent, // name of client
        CURLOPT_CONNECTTIMEOUT => 120, // time-out on connect
        CURLOPT_TIMEOUT => 120, // time-out on response
        CURLOPT_SSL_VERIFYPEER => $this->_ssl_verify_peer
    );
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
        'httpCode' => $httpcode,
        'content' => $content
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
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatClient::_post_url($url, $params, $json, $headers)");
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
        CURLOPT_SSL_VERIFYPEER => $this->_ssl_verify_peer,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $data_string,
        CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json; charset=utf-8',
            'Content-Length: ' . strlen($data_string)
        )
    );
    if (isset($headers)) {
      $options[CURLOPT_HTTPHEADER] = array_merge($options[CURLOPT_HTTPHEADER], $headers);
    }
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "RocketChatClient::_post_url() options: " . var_export($options, true));
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
        'httpCode' => $httpcode,
        'content' => $content
    );
  }
  
  /**
   * Converts all accent characters to ASCII characters.
   * If there are no accent characters, then the string given is just returned.
   * **Accent characters converted:**
   * Currency signs:
   * | Code | Glyph | Replacement | Description |
   * | -------- | ----- | ----------- | ------------------- |
   * | U+00A3 | £ | (empty) | British Pound sign |
   * | U+20AC | € | E | Euro sign |
   * Decompositions for Latin-1 Supplement:
   * | Code | Glyph | Replacement | Description |
   * | ------- | ----- | ----------- | -------------------------------------- |
   * | U+00AA | ª | a | Feminine ordinal indicator |
   * | U+00BA | º | o | Masculine ordinal indicator |
   * | U+00C0 | À | A | Latin capital letter A with grave |
   * | U+00C1 | Á | A | Latin capital letter A with acute |
   * | U+00C2 | Â | A | Latin capital letter A with circumflex |
   * | U+00C3 | Ã | A | Latin capital letter A with tilde |
   * | U+00C4 | Ä | A | Latin capital letter A with diaeresis |
   * | U+00C5 | Å | A | Latin capital letter A with ring above |
   * | U+00C6 | Æ | AE | Latin capital letter AE |
   * | U+00C7 | Ç | C | Latin capital letter C with cedilla |
   * | U+00C8 | È | E | Latin capital letter E with grave |
   * | U+00C9 | É | E | Latin capital letter E with acute |
   * | U+00CA | Ê | E | Latin capital letter E with circumflex |
   * | U+00CB | Ë | E | Latin capital letter E with diaeresis |
   * | U+00CC | Ì | I | Latin capital letter I with grave |
   * | U+00CD | Í | I | Latin capital letter I with acute |
   * | U+00CE | Î | I | Latin capital letter I with circumflex |
   * | U+00CF | Ï | I | Latin capital letter I with diaeresis |
   * | U+00D0 | Ð | D | Latin capital letter Eth |
   * | U+00D1 | Ñ | N | Latin capital letter N with tilde |
   * | U+00D2 | Ò | O | Latin capital letter O with grave |
   * | U+00D3 | Ó | O | Latin capital letter O with acute |
   * | U+00D4 | Ô | O | Latin capital letter O with circumflex |
   * | U+00D5 | Õ | O | Latin capital letter O with tilde |
   * | U+00D6 | Ö | O | Latin capital letter O with diaeresis |
   * | U+00D8 | Ø | O | Latin capital letter O with stroke |
   * | U+00D9 | Ù | U | Latin capital letter U with grave |
   * | U+00DA | Ú | U | Latin capital letter U with acute |
   * | U+00DB | Û | U | Latin capital letter U with circumflex |
   * | U+00DC | Ü | U | Latin capital letter U with diaeresis |
   * | U+00DD | Ý | Y | Latin capital letter Y with acute |
   * | U+00DE | Þ | TH | Latin capital letter Thorn |
   * | U+00DF | ß | s | Latin small letter sharp s |
   * | U+00E0 | à | a | Latin small letter a with grave |
   * | U+00E1 | á | a | Latin small letter a with acute |
   * | U+00E2 | â | a | Latin small letter a with circumflex |
   * | U+00E3 | ã | a | Latin small letter a with tilde |
   * | U+00E4 | ä | a | Latin small letter a with diaeresis |
   * | U+00E5 | å | a | Latin small letter a with ring above |
   * | U+00E6 | æ | ae | Latin small letter ae |
   * | U+00E7 | ç | c | Latin small letter c with cedilla |
   * | U+00E8 | è | e | Latin small letter e with grave |
   * | U+00E9 | é | e | Latin small letter e with acute |
   * | U+00EA | ê | e | Latin small letter e with circumflex |
   * | U+00EB | ë | e | Latin small letter e with diaeresis |
   * | U+00EC | ì | i | Latin small letter i with grave |
   * | U+00ED | í | i | Latin small letter i with acute |
   * | U+00EE | î | i | Latin small letter i with circumflex |
   * | U+00EF | ï | i | Latin small letter i with diaeresis |
   * | U+00F0 | ð | d | Latin small letter Eth |
   * | U+00F1 | ñ | n | Latin small letter n with tilde |
   * | U+00F2 | ò | o | Latin small letter o with grave |
   * | U+00F3 | ó | o | Latin small letter o with acute |
   * | U+00F4 | ô | o | Latin small letter o with circumflex |
   * | U+00F5 | õ | o | Latin small letter o with tilde |
   * | U+00F6 | ö | o | Latin small letter o with diaeresis |
   * | U+00F8 | ø | o | Latin small letter o with stroke |
   * | U+00F9 | ù | u | Latin small letter u with grave |
   * | U+00FA | ú | u | Latin small letter u with acute |
   * | U+00FB | û | u | Latin small letter u with circumflex |
   * | U+00FC | ü | u | Latin small letter u with diaeresis |
   * | U+00FD | ý | y | Latin small letter y with acute |
   * | U+00FE | þ | th | Latin small letter Thorn |
   * | U+00FF | ÿ | y | Latin small letter y with diaeresis |
   * Decompositions for Latin Extended-A:
   * | Code | Glyph | Replacement | Description |
   * | ------- | ----- | ----------- | ------------------------------------------------- |
   * | U+0100 | Ā | A | Latin capital letter A with macron |
   * | U+0101 | ā | a | Latin small letter a with macron |
   * | U+0102 | Ă | A | Latin capital letter A with breve |
   * | U+0103 | ă | a | Latin small letter a with breve |
   * | U+0104 | Ą | A | Latin capital letter A with ogonek |
   * | U+0105 | ą | a | Latin small letter a with ogonek |
   * | U+01006 | Ć | C | Latin capital letter C with acute |
   * | U+0107 | ć | c | Latin small letter c with acute |
   * | U+0108 | Ĉ | C | Latin capital letter C with circumflex |
   * | U+0109 | ĉ | c | Latin small letter c with circumflex |
   * | U+010A | Ċ | C | Latin capital letter C with dot above |
   * | U+010B | ċ | c | Latin small letter c with dot above |
   * | U+010C | Č | C | Latin capital letter C with caron |
   * | U+010D | č | c | Latin small letter c with caron |
   * | U+010E | Ď | D | Latin capital letter D with caron |
   * | U+010F | ď | d | Latin small letter d with caron |
   * | U+0110 | Đ | D | Latin capital letter D with stroke |
   * | U+0111 | đ | d | Latin small letter d with stroke |
   * | U+0112 | Ē | E | Latin capital letter E with macron |
   * | U+0113 | ē | e | Latin small letter e with macron |
   * | U+0114 | Ĕ | E | Latin capital letter E with breve |
   * | U+0115 | ĕ | e | Latin small letter e with breve |
   * | U+0116 | Ė | E | Latin capital letter E with dot above |
   * | U+0117 | ė | e | Latin small letter e with dot above |
   * | U+0118 | Ę | E | Latin capital letter E with ogonek |
   * | U+0119 | ę | e | Latin small letter e with ogonek |
   * | U+011A | Ě | E | Latin capital letter E with caron |
   * | U+011B | ě | e | Latin small letter e with caron |
   * | U+011C | Ĝ | G | Latin capital letter G with circumflex |
   * | U+011D | ĝ | g | Latin small letter g with circumflex |
   * | U+011E | Ğ | G | Latin capital letter G with breve |
   * | U+011F | ğ | g | Latin small letter g with breve |
   * | U+0120 | Ġ | G | Latin capital letter G with dot above |
   * | U+0121 | ġ | g | Latin small letter g with dot above |
   * | U+0122 | Ģ | G | Latin capital letter G with cedilla |
   * | U+0123 | ģ | g | Latin small letter g with cedilla |
   * | U+0124 | Ĥ | H | Latin capital letter H with circumflex |
   * | U+0125 | ĥ | h | Latin small letter h with circumflex |
   * | U+0126 | Ħ | H | Latin capital letter H with stroke |
   * | U+0127 | ħ | h | Latin small letter h with stroke |
   * | U+0128 | Ĩ | I | Latin capital letter I with tilde |
   * | U+0129 | ĩ | i | Latin small letter i with tilde |
   * | U+012A | Ī | I | Latin capital letter I with macron |
   * | U+012B | ī | i | Latin small letter i with macron |
   * | U+012C | Ĭ | I | Latin capital letter I with breve |
   * | U+012D | ĭ | i | Latin small letter i with breve |
   * | U+012E | Į | I | Latin capital letter I with ogonek |
   * | U+012F | į | i | Latin small letter i with ogonek |
   * | U+0130 | İ | I | Latin capital letter I with dot above |
   * | U+0131 | ı | i | Latin small letter dotless i |
   * | U+0132 | Ĳ | IJ | Latin capital ligature IJ |
   * | U+0133 | ĳ | ij | Latin small ligature ij |
   * | U+0134 | Ĵ | J | Latin capital letter J with circumflex |
   * | U+0135 | ĵ | j | Latin small letter j with circumflex |
   * | U+0136 | Ķ | K | Latin capital letter K with cedilla |
   * | U+0137 | ķ | k | Latin small letter k with cedilla |
   * | U+0138 | ĸ | k | Latin small letter Kra |
   * | U+0139 | Ĺ | L | Latin capital letter L with acute |
   * | U+013A | ĺ | l | Latin small letter l with acute |
   * | U+013B | Ļ | L | Latin capital letter L with cedilla |
   * | U+013C | ļ | l | Latin small letter l with cedilla |
   * | U+013D | Ľ | L | Latin capital letter L with caron |
   * | U+013E | ľ | l | Latin small letter l with caron |
   * | U+013F | Ŀ | L | Latin capital letter L with middle dot |
   * | U+0140 | ŀ | l | Latin small letter l with middle dot |
   * | U+0141 | Ł | L | Latin capital letter L with stroke |
   * | U+0142 | ł | l | Latin small letter l with stroke |
   * | U+0143 | Ń | N | Latin capital letter N with acute |
   * | U+0144 | ń | n | Latin small letter N with acute |
   * | U+0145 | Ņ | N | Latin capital letter N with cedilla |
   * | U+0146 | ņ | n | Latin small letter n with cedilla |
   * | U+0147 | Ň | N | Latin capital letter N with caron |
   * | U+0148 | ň | n | Latin small letter n with caron |
   * | U+0149 | ŉ | n | Latin small letter n preceded by apostrophe |
   * | U+014A | Ŋ | N | Latin capital letter Eng |
   * | U+014B | ŋ | n | Latin small letter Eng |
   * | U+014C | Ō | O | Latin capital letter O with macron |
   * | U+014D | ō | o | Latin small letter o with macron |
   * | U+014E | Ŏ | O | Latin capital letter O with breve |
   * | U+014F | ŏ | o | Latin small letter o with breve |
   * | U+0150 | Ő | O | Latin capital letter O with double acute |
   * | U+0151 | ő | o | Latin small letter o with double acute |
   * | U+0152 | Œ | OE | Latin capital ligature OE |
   * | U+0153 | œ | oe | Latin small ligature oe |
   * | U+0154 | Ŕ | R | Latin capital letter R with acute |
   * | U+0155 | ŕ | r | Latin small letter r with acute |
   * | U+0156 | Ŗ | R | Latin capital letter R with cedilla |
   * | U+0157 | ŗ | r | Latin small letter r with cedilla |
   * | U+0158 | Ř | R | Latin capital letter R with caron |
   * | U+0159 | ř | r | Latin small letter r with caron |
   * | U+015A | Ś | S | Latin capital letter S with acute |
   * | U+015B | ś | s | Latin small letter s with acute |
   * | U+015C | Ŝ | S | Latin capital letter S with circumflex |
   * | U+015D | ŝ | s | Latin small letter s with circumflex |
   * | U+015E | Ş | S | Latin capital letter S with cedilla |
   * | U+015F | ş | s | Latin small letter s with cedilla |
   * | U+0160 | Š | S | Latin capital letter S with caron |
   * | U+0161 | š | s | Latin small letter s with caron |
   * | U+0162 | Ţ | T | Latin capital letter T with cedilla |
   * | U+0163 | ţ | t | Latin small letter t with cedilla |
   * | U+0164 | Ť | T | Latin capital letter T with caron |
   * | U+0165 | ť | t | Latin small letter t with caron |
   * | U+0166 | Ŧ | T | Latin capital letter T with stroke |
   * | U+0167 | ŧ | t | Latin small letter t with stroke |
   * | U+0168 | Ũ | U | Latin capital letter U with tilde |
   * | U+0169 | ũ | u | Latin small letter u with tilde |
   * | U+016A | Ū | U | Latin capital letter U with macron |
   * | U+016B | ū | u | Latin small letter u with macron |
   * | U+016C | Ŭ | U | Latin capital letter U with breve |
   * | U+016D | ŭ | u | Latin small letter u with breve |
   * | U+016E | Ů | U | Latin capital letter U with ring above |
   * | U+016F | ů | u | Latin small letter u with ring above |
   * | U+0170 | Ű | U | Latin capital letter U with double acute |
   * | U+0171 | ű | u | Latin small letter u with double acute |
   * | U+0172 | Ų | U | Latin capital letter U with ogonek |
   * | U+0173 | ų | u | Latin small letter u with ogonek |
   * | U+0174 | Ŵ | W | Latin capital letter W with circumflex |
   * | U+0175 | ŵ | w | Latin small letter w with circumflex |
   * | U+0176 | Ŷ | Y | Latin capital letter Y with circumflex |
   * | U+0177 | ŷ | y | Latin small letter y with circumflex |
   * | U+0178 | Ÿ | Y | Latin capital letter Y with diaeresis |
   * | U+0179 | Ź | Z | Latin capital letter Z with acute |
   * | U+017A | ź | z | Latin small letter z with acute |
   * | U+017B | Ż | Z | Latin capital letter Z with dot above |
   * | U+017C | ż | z | Latin small letter z with dot above |
   * | U+017D | Ž | Z | Latin capital letter Z with caron |
   * | U+017E | ž | z | Latin small letter z with caron |
   * | U+017F | ſ | s | Latin small letter long s |
   * | U+01A0 | Ơ | O | Latin capital letter O with horn |
   * | U+01A1 | ơ | o | Latin small letter o with horn |
   * | U+01AF | Ư | U | Latin capital letter U with horn |
   * | U+01B0 | ư | u | Latin small letter u with horn |
   * | U+01CD | Ǎ | A | Latin capital letter A with caron |
   * | U+01CE | ǎ | a | Latin small letter a with caron |
   * | U+01CF | Ǐ | I | Latin capital letter I with caron |
   * | U+01D0 | ǐ | i | Latin small letter i with caron |
   * | U+01D1 | Ǒ | O | Latin capital letter O with caron |
   * | U+01D2 | ǒ | o | Latin small letter o with caron |
   * | U+01D3 | Ǔ | U | Latin capital letter U with caron |
   * | U+01D4 | ǔ | u | Latin small letter u with caron |
   * | U+01D5 | Ǖ | U | Latin capital letter U with diaeresis and macron |
   * | U+01D6 | ǖ | u | Latin small letter u with diaeresis and macron |
   * | U+01D7 | Ǘ | U | Latin capital letter U with diaeresis and acute |
   * | U+01D8 | ǘ | u | Latin small letter u with diaeresis and acute |
   * | U+01D9 | Ǚ | U | Latin capital letter U with diaeresis and caron |
   * | U+01DA | ǚ | u | Latin small letter u with diaeresis and caron |
   * | U+01DB | Ǜ | U | Latin capital letter U with diaeresis and grave |
   * | U+01DC | ǜ | u | Latin small letter u with diaeresis and grave |
   * Decompositions for Latin Extended-B:
   * | Code | Glyph | Replacement | Description |
   * | -------- | ----- | ----------- | ----------------------------------------- |
   * | U+0218 | Ș | S | Latin capital letter S with comma below |
   * | U+0219 | ș | s | Latin small letter s with comma below |
   * | U+021A | Ț | T | Latin capital letter T with comma below |
   * | U+021B | ț | t | Latin small letter t with comma below |
   * Vowels with diacritic (Chinese, Hanyu Pinyin):
   * | Code | Glyph | Replacement | Description |
   * | -------- | ----- | ----------- | ----------------------------------------------------- |
   * | U+0251 | ɑ | a | Latin small letter alpha |
   * | U+1EA0 | Ạ | A | Latin capital letter A with dot below |
   * | U+1EA1 | ạ | a | Latin small letter a with dot below |
   * | U+1EA2 | Ả | A | Latin capital letter A with hook above |
   * | U+1EA3 | ả | a | Latin small letter a with hook above |
   * | U+1EA4 | Ấ | A | Latin capital letter A with circumflex and acute |
   * | U+1EA5 | ấ | a | Latin small letter a with circumflex and acute |
   * | U+1EA6 | Ầ | A | Latin capital letter A with circumflex and grave |
   * | U+1EA7 | ầ | a | Latin small letter a with circumflex and grave |
   * | U+1EA8 | Ẩ | A | Latin capital letter A with circumflex and hook above |
   * | U+1EA9 | ẩ | a | Latin small letter a with circumflex and hook above |
   * | U+1EAA | Ẫ | A | Latin capital letter A with circumflex and tilde |
   * | U+1EAB | ẫ | a | Latin small letter a with circumflex and tilde |
   * | U+1EA6 | Ậ | A | Latin capital letter A with circumflex and dot below |
   * | U+1EAD | ậ | a | Latin small letter a with circumflex and dot below |
   * | U+1EAE | Ắ | A | Latin capital letter A with breve and acute |
   * | U+1EAF | ắ | a | Latin small letter a with breve and acute |
   * | U+1EB0 | Ằ | A | Latin capital letter A with breve and grave |
   * | U+1EB1 | ằ | a | Latin small letter a with breve and grave |
   * | U+1EB2 | Ẳ | A | Latin capital letter A with breve and hook above |
   * | U+1EB3 | ẳ | a | Latin small letter a with breve and hook above |
   * | U+1EB4 | Ẵ | A | Latin capital letter A with breve and tilde |
   * | U+1EB5 | ẵ | a | Latin small letter a with breve and tilde |
   * | U+1EB6 | Ặ | A | Latin capital letter A with breve and dot below |
   * | U+1EB7 | ặ | a | Latin small letter a with breve and dot below |
   * | U+1EB8 | Ẹ | E | Latin capital letter E with dot below |
   * | U+1EB9 | ẹ | e | Latin small letter e with dot below |
   * | U+1EBA | Ẻ | E | Latin capital letter E with hook above |
   * | U+1EBB | ẻ | e | Latin small letter e with hook above |
   * | U+1EBC | Ẽ | E | Latin capital letter E with tilde |
   * | U+1EBD | ẽ | e | Latin small letter e with tilde |
   * | U+1EBE | Ế | E | Latin capital letter E with circumflex and acute |
   * | U+1EBF | ế | e | Latin small letter e with circumflex and acute |
   * | U+1EC0 | Ề | E | Latin capital letter E with circumflex and grave |
   * | U+1EC1 | ề | e | Latin small letter e with circumflex and grave |
   * | U+1EC2 | Ể | E | Latin capital letter E with circumflex and hook above |
   * | U+1EC3 | ể | e | Latin small letter e with circumflex and hook above |
   * | U+1EC4 | Ễ | E | Latin capital letter E with circumflex and tilde |
   * | U+1EC5 | ễ | e | Latin small letter e with circumflex and tilde |
   * | U+1EC6 | Ệ | E | Latin capital letter E with circumflex and dot below |
   * | U+1EC7 | ệ | e | Latin small letter e with circumflex and dot below |
   * | U+1EC8 | Ỉ | I | Latin capital letter I with hook above |
   * | U+1EC9 | ỉ | i | Latin small letter i with hook above |
   * | U+1ECA | Ị | I | Latin capital letter I with dot below |
   * | U+1ECB | ị | i | Latin small letter i with dot below |
   * | U+1ECC | Ọ | O | Latin capital letter O with dot below |
   * | U+1ECD | ọ | o | Latin small letter o with dot below |
   * | U+1ECE | Ỏ | O | Latin capital letter O with hook above |
   * | U+1ECF | ỏ | o | Latin small letter o with hook above |
   * | U+1ED0 | Ố | O | Latin capital letter O with circumflex and acute |
   * | U+1ED1 | ố | o | Latin small letter o with circumflex and acute |
   * | U+1ED2 | Ồ | O | Latin capital letter O with circumflex and grave |
   * | U+1ED3 | ồ | o | Latin small letter o with circumflex and grave |
   * | U+1ED4 | Ổ | O | Latin capital letter O with circumflex and hook above |
   * | U+1ED5 | ổ | o | Latin small letter o with circumflex and hook above |
   * | U+1ED6 | Ỗ | O | Latin capital letter O with circumflex and tilde |
   * | U+1ED7 | ỗ | o | Latin small letter o with circumflex and tilde |
   * | U+1ED8 | Ộ | O | Latin capital letter O with circumflex and dot below |
   * | U+1ED9 | ộ | o | Latin small letter o with circumflex and dot below |
   * | U+1EDA | Ớ | O | Latin capital letter O with horn and acute |
   * | U+1EDB | ớ | o | Latin small letter o with horn and acute |
   * | U+1EDC | Ờ | O | Latin capital letter O with horn and grave |
   * | U+1EDD | ờ | o | Latin small letter o with horn and grave |
   * | U+1EDE | Ở | O | Latin capital letter O with horn and hook above |
   * | U+1EDF | ở | o | Latin small letter o with horn and hook above |
   * | U+1EE0 | Ỡ | O | Latin capital letter O with horn and tilde |
   * | U+1EE1 | ỡ | o | Latin small letter o with horn and tilde |
   * | U+1EE2 | Ợ | O | Latin capital letter O with horn and dot below |
   * | U+1EE3 | ợ | o | Latin small letter o with horn and dot below |
   * | U+1EE4 | Ụ | U | Latin capital letter U with dot below |
   * | U+1EE5 | ụ | u | Latin small letter u with dot below |
   * | U+1EE6 | Ủ | U | Latin capital letter U with hook above |
   * | U+1EE7 | ủ | u | Latin small letter u with hook above |
   * | U+1EE8 | Ứ | U | Latin capital letter U with horn and acute |
   * | U+1EE9 | ứ | u | Latin small letter u with horn and acute |
   * | U+1EEA | Ừ | U | Latin capital letter U with horn and grave |
   * | U+1EEB | ừ | u | Latin small letter u with horn and grave |
   * | U+1EEC | Ử | U | Latin capital letter U with horn and hook above |
   * | U+1EED | ử | u | Latin small letter u with horn and hook above |
   * | U+1EEE | Ữ | U | Latin capital letter U with horn and tilde |
   * | U+1EEF | ữ | u | Latin small letter u with horn and tilde |
   * | U+1EF0 | Ự | U | Latin capital letter U with horn and dot below |
   * | U+1EF1 | ự | u | Latin small letter u with horn and dot below |
   * | U+1EF2 | Ỳ | Y | Latin capital letter Y with grave |
   * | U+1EF3 | ỳ | y | Latin small letter y with grave |
   * | U+1EF4 | Ỵ | Y | Latin capital letter Y with dot below |
   * | U+1EF5 | ỵ | y | Latin small letter y with dot below |
   * | U+1EF6 | Ỷ | Y | Latin capital letter Y with hook above |
   * | U+1EF7 | ỷ | y | Latin small letter y with hook above |
   * | U+1EF8 | Ỹ | Y | Latin capital letter Y with tilde |
   * | U+1EF9 | ỹ | y | Latin small letter y with tilde |
   * German (`de_DE`), German formal (`de_DE_formal`), German (Switzerland) formal (`de_CH`),
   * and German (Switzerland) informal (`de_CH_informal`) locales:
   * | Code | Glyph | Replacement | Description |
   * | -------- | ----- | ----------- | --------------------------------------- |
   * | U+00C4 | Ä | Ae | Latin capital letter A with diaeresis |
   * | U+00E4 | ä | ae | Latin small letter a with diaeresis |
   * | U+00D6 | Ö | Oe | Latin capital letter O with diaeresis |
   * | U+00F6 | ö | oe | Latin small letter o with diaeresis |
   * | U+00DC | Ü | Ue | Latin capital letter U with diaeresis |
   * | U+00FC | ü | ue | Latin small letter u with diaeresis |
   * | U+00DF | ß | ss | Latin small letter sharp s |
   * Danish (`da_DK`) locale:
   * | Code | Glyph | Replacement | Description |
   * | -------- | ----- | ----------- | --------------------------------------- |
   * | U+00C6 | Æ | Ae | Latin capital letter AE |
   * | U+00E6 | æ | ae | Latin small letter ae |
   * | U+00D8 | Ø | Oe | Latin capital letter O with stroke |
   * | U+00F8 | ø | oe | Latin small letter o with stroke |
   * | U+00C5 | Å | Aa | Latin capital letter A with ring above |
   * | U+00E5 | å | aa | Latin small letter a with ring above |
   * Catalan (`ca`) locale:
   * | Code | Glyph | Replacement | Description |
   * | -------- | ----- | ----------- | --------------------------------------- |
   * | U+00B7 | l·l | ll | Flown dot (between two Ls) |
   * Serbian (`sr_RS`) and Bosnian (`bs_BA`) locales:
   * | Code | Glyph | Replacement | Description |
   * | -------- | ----- | ----------- | --------------------------------------- |
   * | U+0110 | Đ | DJ | Latin capital letter D with stroke |
   * | U+0111 | đ | dj | Latin small letter d with stroke |
   *
   * @since 1.2.1
   * @since 4.6.0 Added locale support for `de_CH`, `de_CH_informal`, and `ca`.
   * @since 4.7.0 Added locale support for `sr_RS`.
   * @since 4.8.0 Added locale support for `bs_BA`.
   * @param string $string
   *          Text that might have accent characters
   * @return string Filtered string with replaced "nice" characters.
   */
  private function remove_accents($string) {
    if (!preg_match('/[\x80-\xff]/', $string))
      return $string;
    $chars = array(
        // Decompositions for Latin-1 Supplement
        'ª' => 'a',
        'º' => 'o',
        'À' => 'A',
        'Á' => 'A',
        'Â' => 'A',
        'Ã' => 'A',
        'Ä' => 'A',
        'Å' => 'A',
        'Æ' => 'AE',
        'Ç' => 'C',
        'È' => 'E',
        'É' => 'E',
        'Ê' => 'E',
        'Ë' => 'E',
        'Ì' => 'I',
        'Í' => 'I',
        'Î' => 'I',
        'Ï' => 'I',
        'Ð' => 'D',
        'Ñ' => 'N',
        'Ò' => 'O',
        'Ó' => 'O',
        'Ô' => 'O',
        'Õ' => 'O',
        'Ö' => 'O',
        'Ù' => 'U',
        'Ú' => 'U',
        'Û' => 'U',
        'Ü' => 'U',
        'Ý' => 'Y',
        'Þ' => 'TH',
        'ß' => 's',
        'à' => 'a',
        'á' => 'a',
        'â' => 'a',
        'ã' => 'a',
        'ä' => 'a',
        'å' => 'a',
        'æ' => 'ae',
        'ç' => 'c',
        'è' => 'e',
        'é' => 'e',
        'ê' => 'e',
        'ë' => 'e',
        'ì' => 'i',
        'í' => 'i',
        'î' => 'i',
        'ï' => 'i',
        'ð' => 'd',
        'ñ' => 'n',
        'ò' => 'o',
        'ó' => 'o',
        'ô' => 'o',
        'õ' => 'o',
        'ö' => 'o',
        'ø' => 'o',
        'ù' => 'u',
        'ú' => 'u',
        'û' => 'u',
        'ü' => 'u',
        'ý' => 'y',
        'þ' => 'th',
        'ÿ' => 'y',
        'Ø' => 'O',
        // Decompositions for Latin Extended-A
        'Ā' => 'A',
        'ā' => 'a',
        'Ă' => 'A',
        'ă' => 'a',
        'Ą' => 'A',
        'ą' => 'a',
        'Ć' => 'C',
        'ć' => 'c',
        'Ĉ' => 'C',
        'ĉ' => 'c',
        'Ċ' => 'C',
        'ċ' => 'c',
        'Č' => 'C',
        'č' => 'c',
        'Ď' => 'D',
        'ď' => 'd',
        'Đ' => 'D',
        'đ' => 'd',
        'Ē' => 'E',
        'ē' => 'e',
        'Ĕ' => 'E',
        'ĕ' => 'e',
        'Ė' => 'E',
        'ė' => 'e',
        'Ę' => 'E',
        'ę' => 'e',
        'Ě' => 'E',
        'ě' => 'e',
        'Ĝ' => 'G',
        'ĝ' => 'g',
        'Ğ' => 'G',
        'ğ' => 'g',
        'Ġ' => 'G',
        'ġ' => 'g',
        'Ģ' => 'G',
        'ģ' => 'g',
        'Ĥ' => 'H',
        'ĥ' => 'h',
        'Ħ' => 'H',
        'ħ' => 'h',
        'Ĩ' => 'I',
        'ĩ' => 'i',
        'Ī' => 'I',
        'ī' => 'i',
        'Ĭ' => 'I',
        'ĭ' => 'i',
        'Į' => 'I',
        'į' => 'i',
        'İ' => 'I',
        'ı' => 'i',
        'Ĳ' => 'IJ',
        'ĳ' => 'ij',
        'Ĵ' => 'J',
        'ĵ' => 'j',
        'Ķ' => 'K',
        'ķ' => 'k',
        'ĸ' => 'k',
        'Ĺ' => 'L',
        'ĺ' => 'l',
        'Ļ' => 'L',
        'ļ' => 'l',
        'Ľ' => 'L',
        'ľ' => 'l',
        'Ŀ' => 'L',
        'ŀ' => 'l',
        'Ł' => 'L',
        'ł' => 'l',
        'Ń' => 'N',
        'ń' => 'n',
        'Ņ' => 'N',
        'ņ' => 'n',
        'Ň' => 'N',
        'ň' => 'n',
        'ŉ' => 'n',
        'Ŋ' => 'N',
        'ŋ' => 'n',
        'Ō' => 'O',
        'ō' => 'o',
        'Ŏ' => 'O',
        'ŏ' => 'o',
        'Ő' => 'O',
        'ő' => 'o',
        'Œ' => 'OE',
        'œ' => 'oe',
        'Ŕ' => 'R',
        'ŕ' => 'r',
        'Ŗ' => 'R',
        'ŗ' => 'r',
        'Ř' => 'R',
        'ř' => 'r',
        'Ś' => 'S',
        'ś' => 's',
        'Ŝ' => 'S',
        'ŝ' => 's',
        'Ş' => 'S',
        'ş' => 's',
        'Š' => 'S',
        'š' => 's',
        'Ţ' => 'T',
        'ţ' => 't',
        'Ť' => 'T',
        'ť' => 't',
        'Ŧ' => 'T',
        'ŧ' => 't',
        'Ũ' => 'U',
        'ũ' => 'u',
        'Ū' => 'U',
        'ū' => 'u',
        'Ŭ' => 'U',
        'ŭ' => 'u',
        'Ů' => 'U',
        'ů' => 'u',
        'Ű' => 'U',
        'ű' => 'u',
        'Ų' => 'U',
        'ų' => 'u',
        'Ŵ' => 'W',
        'ŵ' => 'w',
        'Ŷ' => 'Y',
        'ŷ' => 'y',
        'Ÿ' => 'Y',
        'Ź' => 'Z',
        'ź' => 'z',
        'Ż' => 'Z',
        'ż' => 'z',
        'Ž' => 'Z',
        'ž' => 'z',
        'ſ' => 's',
        // Decompositions for Latin Extended-B
        'Ș' => 'S',
        'ș' => 's',
        'Ț' => 'T',
        'ț' => 't',
        // Euro Sign
        '€' => 'E',
        // GBP (Pound) Sign
        '£' => '',
        // Vowels with diacritic (Vietnamese)
        // unmarked
        'Ơ' => 'O',
        'ơ' => 'o',
        'Ư' => 'U',
        'ư' => 'u',
        // grave accent
        'Ầ' => 'A',
        'ầ' => 'a',
        'Ằ' => 'A',
        'ằ' => 'a',
        'Ề' => 'E',
        'ề' => 'e',
        'Ồ' => 'O',
        'ồ' => 'o',
        'Ờ' => 'O',
        'ờ' => 'o',
        'Ừ' => 'U',
        'ừ' => 'u',
        'Ỳ' => 'Y',
        'ỳ' => 'y',
        // hook
        'Ả' => 'A',
        'ả' => 'a',
        'Ẩ' => 'A',
        'ẩ' => 'a',
        'Ẳ' => 'A',
        'ẳ' => 'a',
        'Ẻ' => 'E',
        'ẻ' => 'e',
        'Ể' => 'E',
        'ể' => 'e',
        'Ỉ' => 'I',
        'ỉ' => 'i',
        'Ỏ' => 'O',
        'ỏ' => 'o',
        'Ổ' => 'O',
        'ổ' => 'o',
        'Ở' => 'O',
        'ở' => 'o',
        'Ủ' => 'U',
        'ủ' => 'u',
        'Ử' => 'U',
        'ử' => 'u',
        'Ỷ' => 'Y',
        'ỷ' => 'y',
        // tilde
        'Ẫ' => 'A',
        'ẫ' => 'a',
        'Ẵ' => 'A',
        'ẵ' => 'a',
        'Ẽ' => 'E',
        'ẽ' => 'e',
        'Ễ' => 'E',
        'ễ' => 'e',
        'Ỗ' => 'O',
        'ỗ' => 'o',
        'Ỡ' => 'O',
        'ỡ' => 'o',
        'Ữ' => 'U',
        'ữ' => 'u',
        'Ỹ' => 'Y',
        'ỹ' => 'y',
        // acute accent
        'Ấ' => 'A',
        'ấ' => 'a',
        'Ắ' => 'A',
        'ắ' => 'a',
        'Ế' => 'E',
        'ế' => 'e',
        'Ố' => 'O',
        'ố' => 'o',
        'Ớ' => 'O',
        'ớ' => 'o',
        'Ứ' => 'U',
        'ứ' => 'u',
        // dot below
        'Ạ' => 'A',
        'ạ' => 'a',
        'Ậ' => 'A',
        'ậ' => 'a',
        'Ặ' => 'A',
        'ặ' => 'a',
        'Ẹ' => 'E',
        'ẹ' => 'e',
        'Ệ' => 'E',
        'ệ' => 'e',
        'Ị' => 'I',
        'ị' => 'i',
        'Ọ' => 'O',
        'ọ' => 'o',
        'Ộ' => 'O',
        'ộ' => 'o',
        'Ợ' => 'O',
        'ợ' => 'o',
        'Ụ' => 'U',
        'ụ' => 'u',
        'Ự' => 'U',
        'ự' => 'u',
        'Ỵ' => 'Y',
        'ỵ' => 'y',
        // Vowels with diacritic (Chinese, Hanyu Pinyin)
        'ɑ' => 'a',
        // macron
        'Ǖ' => 'U',
        'ǖ' => 'u',
        // acute accent
        'Ǘ' => 'U',
        'ǘ' => 'u',
        // caron
        'Ǎ' => 'A',
        'ǎ' => 'a',
        'Ǐ' => 'I',
        'ǐ' => 'i',
        'Ǒ' => 'O',
        'ǒ' => 'o',
        'Ǔ' => 'U',
        'ǔ' => 'u',
        'Ǚ' => 'U',
        'ǚ' => 'u',
        // grave accent
        'Ǜ' => 'U',
        'ǜ' => 'u'
    );
    $string = strtr($string, $chars);
    return $string;
  }
}