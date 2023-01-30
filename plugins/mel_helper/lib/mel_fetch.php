<?php
class mel_fetch
{
    private $_user_agent;
    private $_ssl_verify_peer;
    private $_ssl_verify_host;

    public function __construct($user_agent, $ssl_verify_peer, $ssl_verify_host) {
        $this->_user_agent = $user_agent;
        $this->_ssl_verify_peer = $ssl_verify_peer;
        $this->_ssl_verify_host = $ssl_verify_host;
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
  public function _get_url($url, $params = null, $headers = null, $additionnal_options = null) {

    // Options list
    $options = array(
        CURLOPT_RETURNTRANSFER => true, // return web page
        CURLOPT_HEADER => false, // don't return headers
        CURLOPT_USERAGENT => $this->_user_agent, // name of client
        CURLOPT_CONNECTTIMEOUT => 120, // time-out on connect
        CURLOPT_TIMEOUT => 120, // time-out on response
        CURLOPT_SSL_VERIFYHOST => $this->_ssl_verify_host,
        CURLOPT_SSL_VERIFYPEER => $this->_ssl_verify_peer
    );
    if (isset($headers)) {
      $options[CURLOPT_HTTPHEADER] = $headers;
    }

    if ($additionnal_options !== null)
    {
      foreach ($additionnal_options as $key => $value) {
        $options[$key] = $value;
      }
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
  public function _post_url($url, $params = null, $json = null, $headers = null) {
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
        // //CURLOPT_USERAGENT => $this->_user_agent, // name of client
        CURLOPT_CONNECTTIMEOUT => 120, // time-out on connect
        CURLOPT_TIMEOUT => 120, // time-out on response,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_SSL_VERIFYPEER => $this->_ssl_verify_peer,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $data_string,
        CURLOPT_HTTPHEADER => array(
            //'Content-Type: application/json; charset=utf-8',
            //'Content-Length: ' . strlen($data_string)
        )
    );

    if (isset($headers)) {
      $options[CURLOPT_HTTPHEADER] = array_merge($options[CURLOPT_HTTPHEADER], $headers);
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
  public function _custom_url($url, $type, $params = null, $json = null, $headers = null, $otherOptions = null) {
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
        // //CURLOPT_USERAGENT => $this->_user_agent, // name of client
        CURLOPT_CONNECTTIMEOUT => 120, // time-out on connect
        CURLOPT_TIMEOUT => 120, // time-out on response,
        CURLOPT_CUSTOMREQUEST => $type,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_SSL_VERIFYPEER => $this->_ssl_verify_peer,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $data_string,
        CURLOPT_HTTPHEADER => array(
            //'Content-Type: application/json; charset=utf-8',
            //'Content-Length: ' . strlen($data_string)
        )
    );

    if (isset($headers)) {
      $options[CURLOPT_HTTPHEADER] = array_merge($options[CURLOPT_HTTPHEADER], $headers);
    }

    if (isset($otherOptions))
      $otherOptions = array_merge($options, $otherOptions);

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
   * Permet d'envoyer un fichier binaire vers une page web
   *
   * @param string $url
   * @param array $params
   * @param string $contentType
   * @return array('content', 'httpCode')
   */
  public function _put_url($url, $path, $header = [], $curl_cafile = null, $curl_proxy = null) {
    // if (mel_logs::is(mel_logs::DEBUG))
    //   mel_logs::get_instance()->log(mel_logs::DEBUG, "ServiceWebMelanissimo::_put_url($url)");
    // Ouvre le pointeur vers le fichier
    $fp = $path;//fopen($path, 'r');

    // Options list
    $options = array(
            CURLOPT_RETURNTRANSFER => true, // return web page
            CURLOPT_HEADER => false, // don't return headers
            //CURLOPT_USERAGENT => $this->rc->config->get('curl_user_agent', ''), // name of client
            CURLOPT_CONNECTTIMEOUT => 120, // time-out on connect
            CURLOPT_TIMEOUT => 1200, // time-out on response
            //CURLOPT_SSL_VERIFYPEER => $this->rc->config->get('curl_ssl_verifierpeer', 0),
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_SSL_VERIFYPEER => $this->_ssl_verify_peer,
            CURLOPT_CUSTOMREQUEST => "PUT",
            CURLOPT_UPLOAD => 1,
            CURLOPT_HTTPHEADER => $header,
            CURLOPT_INFILE => $fp,
            CURLOPT_BUFFERSIZE => 128,
            CURLOPT_INFILESIZE_LARGE => filesize($path)
//             CURLOPT_PROGRESSFUNCTION => array($this, '_progress'),
//             CURLOPT_NOPROGRESS => false,
    );
    // CA File
    //$curl_cafile = $this->rc->config->get('curl_cainfo', null);
    if (isset($curl_cafile)) {
      $options[CURLOPT_CAINFO] = $curl_cafile;
      $options[CURLOPT_CAPATH] = $curl_cafile;
    }
    // HTTP Proxy
    //$curl_proxy = $this->rc->config->get('curl_http_proxy', null);
    if (isset($curl_proxy)) {
      $options[CURLOPT_PROXY] = $curl_proxy;
    }
    // open connection
    $ch = curl_init($url);
    // Set the options
    curl_setopt_array($ch, $options);
    // Execute the request and get the content
    $content = curl_exec($ch);
    // Get error
    // if ($content === false) {
    //   mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebMelanissimo::_put_url() Error " . curl_errno($ch) . " : " . curl_error($ch));
    // }
    // Get the HTTP Code
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    // Close connection
    curl_close($ch);
    // Return the content
    return array(
            'httpCode' => $httpcode,
            'content' => $content,
            "url" => $url
    );
  }
}