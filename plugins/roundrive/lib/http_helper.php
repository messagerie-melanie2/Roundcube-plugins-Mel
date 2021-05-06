<?php
class Ajax
{
    CONST curl_ssl_verifierpeer = "curl_ssl_verifierpeer";
    CONST curl_user_agent = "curl_user_agent"; 

    public $header;
    public $params;
    public $url;
    private $config;
    private $basic_auth;

    public function __construct($url, $params = null, $headers = null, $rc = null, $basic_auth = null) {
        $this->url = $url;
        $this->params = $params;
        $this->headers = $headers;
        if ($rc !== null)
        {
            $this->config = [
                self::curl_ssl_verifierpeer => $rc->config->get(self::curl_ssl_verifierpeer),
                self::curl_user_agent => $rc->config->get(self::curl_user_agent)
            ];
        }
        $this->basic_auth = $basic_auth;
    }

    /**
   * Permet de récupérer le contenu d'une page Web
   *
   * @return AjaxContent
   */
    public function get()
    {
        return AjaxContent::FromArray(self::get_url($this->url, $this->params, $this->headers, ($this->config === null ? null : $this->config[self::curl_ssl_verifierpeer]), ($this->config === null ? null : $this->config[self::curl_user_agent])));
    }

/**
   * Permet de récupérer le contenu d'une page Web
   *
   * @param string $json [Optionnel]
   * @return AjaxContent
   */
    public function post($json = null)
    {
        return AjaxContent::FromArray(self::post_url($this->url, $this->params, $json, $this->headers, ($this->config === null ? null : $this->config[self::curl_ssl_verifierpeer]), ($this->config === null ? null : $this->config[self::curl_user_agent]), $this->basic_auth));
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
  public static function get_url($url, $params = null, $headers = null, $CURLOPT_SSL_VERIFYPEER = null, $CURLOPT_USERAGENT = null) {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "Ajax::get_url($url, $params, $headers)");
    // Options list
    $options = array(
        CURLOPT_RETURNTRANSFER => true, // return web page
        CURLOPT_HEADER => false, // don't return headers
        //CURLOPT_USERAGENT => $this->_user_agent, // name of client
        CURLOPT_CONNECTTIMEOUT => 120, // time-out on connect
        CURLOPT_TIMEOUT => 120, // time-out on response
        //CURLOPT_SSL_VERIFYPEER => $this->_ssl_verify_peer
    );

    if ($CURLOPT_SSL_VERIFYPEER !== null)
        $options[CURLOPT_SSL_VERIFYPEER] = $CURLOPT_SSL_VERIFYPEER;
    
    if ($CURLOPT_USERAGENT !== null)
        $option[CURLOPT_USERAGENT] = $CURLOPT_USERAGENT;

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
  public static function post_url($url, $params = null, $json = null, $headers = null, $CURLOPT_SSL_VERIFYPEER = null, $CURLOPT_USERAGENT = null, $basic_auth = null) {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "Ajax::post_url($url, $params, $json, $headers, $CURLOPT_SSL_VERIFYPEER, $CURLOPT_USERAGENT)");
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
        //CURLOPT_USERAGENT => $this->_user_agent, // name of client
        CURLOPT_CONNECTTIMEOUT => 120, // time-out on connect
        CURLOPT_TIMEOUT => 120, // time-out on response
        //CURLOPT_SSL_VERIFYPEER => $this->_ssl_verify_peer,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $data_string,
        CURLOPT_HTTPHEADER => array(
            'Content-Length: ' . strlen($data_string)
        )
    );

    // if ($CURLOPT_SSL_VERIFYPEER !== null)
    //     $options[CURLOPT_SSL_VERIFYPEER] = $CURLOPT_SSL_VERIFYPEER;
    
    // if ($CURLOPT_USERAGENT !== null)
    //     $options[CURLOPT_USERAGENT] = $CURLOPT_USERAGENT;

    if ($basic_auth !== null)
      $options[CURLOPT_USERPWD] = $basic_auth;

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

}

class AjaxContent
{
    private $http_code;
    private $contents;
    
    public function __construct($code, $content)
    {
        $this->http_code = $code;
        if (gettype($content) === "string")
        {
            try {
                $content = json_decode($content);
            } catch (\Throwable $th) {
                //throw $th;
            }
        }
        $this->contents = $content;
    }

    public function code()
    {
        return $http_code;
    }

    public function contents()
    {
        return $contents;
    }

    public function toJson($only_contents = true)
    {
        if ($only_contents)
            return json_encode($this->contents);
        else
            return json_encode([
                "http_code" => $this->http_code,
                "contents" => $this->contents
            ]);
    }

    public static function FromArray($array)
    {
        return new AjaxContent($array["httpCode"], $array["content"]);
    }
}