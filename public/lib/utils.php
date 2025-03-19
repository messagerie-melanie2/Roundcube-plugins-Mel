<?php

/**
 * Based on rcube_utils
 */

/**
 * Utility class providing common functions
 *
 * @package    Framework
 * @subpackage Utils
 */
class utils
{
  // define constants for input reading
  const INPUT_GET  = 0x0101;
  const INPUT_POST = 0x0102;
  const INPUT_GPC  = 0x0103;

  /**
   * E-mail address validation.
   *
   * @param string $email Email address
   * @param boolean $dns_check True to check dns
   *
   * @return boolean True on success, False if address is invalid
   */
  public static function check_email($email, $dns_check = true)
  {
    // Check for invalid characters
    if (preg_match('/[\x00-\x1F\x7F-\xFF]/', $email)) {
      return false;
    }

    // Check for length limit specified by RFC 5321 (#1486453)
    if (strlen($email) > 254) {
      return false;
    }

    $email_array = explode('@', $email);

    // Check that there's one @ symbol
    if (count($email_array) < 2) {
      return false;
    }

    $domain_part = array_pop($email_array);
    $local_part  = implode('@', $email_array);

    // from PEAR::Validate
    $regexp = '&^(?:
            ("\s*(?:[^"\f\n\r\t\v\b\s]+\s*)+")|                             #1 quoted name
            ([-\w!\#\$%\&\'*+~/^`|{}=]+(?:\.[-\w!\#\$%\&\'*+~/^`|{}=]+)*))  #2 OR dot-atom (RFC5322)
            $&xi';

    if (!preg_match($regexp, $local_part)) {
      return false;
    }

    // Validate domain part
    if (preg_match('/^\[((IPv6:[0-9a-f:.]+)|([0-9.]+))\]$/i', $domain_part, $matches)) {
      return self::check_ip(preg_replace('/^IPv6:/i', '', $matches[1])); // valid IPv4 or IPv6 address
    } else {
      // If not an IP address
      $domain_array = explode('.', $domain_part);
      // Not enough parts to be a valid domain
      if (sizeof($domain_array) < 2) {
        return false;
      }

      foreach ($domain_array as $part) {
        if (!preg_match('/^((xn--)?([A-Za-z0-9][A-Za-z0-9-]{0,61}[A-Za-z0-9])|([A-Za-z0-9]))$/', $part)) {
          return false;
        }
      }

      // last domain part
      $last_part = array_pop($domain_array);
      if (
        /** PAMELA - MANTIS 3439: Les adresses mail en .i2 ne sont pas acceptées **/
        $last_part != 'i2' && strpos($last_part, 'xn--') !== 0 && preg_match('/[^a-zA-Z]/', $last_part)
      ) {
        return false;
      }

      $rcube = rcube::get_instance();

      if (!$dns_check || !$rcube->config->get('email_dns_check')) {
        return true;
      }

      // find MX record(s)
      if (!function_exists('getmxrr') || getmxrr($domain_part, $mx_records)) {
        return true;
      }

      // find any DNS record
      if (!function_exists('checkdnsrr') || checkdnsrr($domain_part, 'ANY')) {
        return true;
      }
    }

    return false;
  }


  /**
   * Validates IPv4 or IPv6 address
   *
   * @param string $ip IP address in v4 or v6 format
   *
   * @return bool True if the address is valid
   */
  public static function check_ip($ip)
  {
    // IPv6, but there's no build-in IPv6 support
    if (strpos($ip, ':') !== false && !defined('AF_INET6')) {
      $parts = explode(':', $ip);
      $count = count($parts);

      if ($count > 8 || $count < 2) {
        return false;
      }

      foreach ($parts as $idx => $part) {
        $length = strlen($part);
        if (!$length) {
          // there can be only one ::
          if ($found_empty) {
            return false;
          }
          $found_empty = true;
        }
        // last part can be an IPv4 address
        else if ($idx == $count - 1) {
          if (!preg_match('/^[0-9a-f]{1,4}$/i', $part)) {
            return @inet_pton($part) !== false;
          }
        } else if (!preg_match('/^[0-9a-f]{1,4}$/i', $part)) {
          return false;
        }
      }

      return true;
    }

    return @inet_pton($ip) !== false;
  }


  /**
   * Check whether the HTTP referer matches the current request
   *
   * @return boolean True if referer is the same host+path, false if not
   */
  public static function check_referer()
  {
    $uri = parse_url($_SERVER['REQUEST_URI']);
    $referer = parse_url(self::request_header('Referer'));
    return $referer['host'] == self::request_header('Host') && $referer['path'] == $uri['path'];
  }


  /**
   * Replacing specials characters to a specific encoding type
   *
   * @param  string  Input string
   * @param  string  Encoding type: text|html|xml|js|url
   * @param  string  Replace mode for tags: show|replace|remove
   * @param  boolean Convert newlines
   *
   * @return string  The quoted string
   */
  public static function rep_specialchars_output($str, $enctype = '', $mode = '', $newlines = true)
  {
    static $html_encode_arr = false;
    static $js_rep_table = false;
    static $xml_rep_table = false;

    if (!is_string($str)) {
      $str = strval($str);
    }

    // encode for HTML output
    if ($enctype == 'html') {
      if (!$html_encode_arr) {
        $html_encode_arr = get_html_translation_table(HTML_SPECIALCHARS);
        unset($html_encode_arr['?']);
      }

      $encode_arr = $html_encode_arr;

      // don't replace quotes and html tags
      if ($mode == 'show' || $mode == '') {
        $ltpos = strpos($str, '<');
        if ($ltpos !== false && strpos($str, '>', $ltpos) !== false) {
          unset($encode_arr['"']);
          unset($encode_arr['<']);
          unset($encode_arr['>']);
          unset($encode_arr['&']);
        }
      } else if ($mode == 'remove') {
        $str = strip_tags($str);
      }

      $out = strtr($str, $encode_arr);

      return $newlines ? nl2br($out) : $out;
    }

    // if the replace tables for XML and JS are not yet defined
    if ($js_rep_table === false) {
      $js_rep_table = $xml_rep_table = array();
      $xml_rep_table['&'] = '&amp;';

      // can be increased to support more charsets
      for ($c = 160; $c < 256; $c++) {
        $xml_rep_table[chr($c)] = "&#$c;";
      }

      $xml_rep_table['"'] = '&quot;';
      $js_rep_table['"']  = '\\"';
      $js_rep_table["'"]  = "\\'";
      $js_rep_table["\\"] = "\\\\";
      // Unicode line and paragraph separators (#1486310)
      $js_rep_table[chr(hexdec(E2)) . chr(hexdec(80)) . chr(hexdec(A8))] = '&#8232;';
      $js_rep_table[chr(hexdec(E2)) . chr(hexdec(80)) . chr(hexdec(A9))] = '&#8233;';
    }

    // encode for javascript use
    if ($enctype == 'js') {
      return preg_replace(array("/\r?\n/", "/\r/", '/<\\//'), array('\n', '\n', '<\\/'), strtr($str, $js_rep_table));
    }

    // encode for plaintext
    if ($enctype == 'text') {
      return str_replace("\r\n", "\n", $mode == 'remove' ? strip_tags($str) : $str);
    }

    if ($enctype == 'url') {
      return rawurlencode($str);
    }

    // encode for XML
    if ($enctype == 'xml') {
      return strtr($str, $xml_rep_table);
    }

    // no encoding given -> return original string
    return $str;
  }


  /**
   * Read input value and convert it for internal use
   * Performs stripslashes() and charset conversion if necessary
   *
   * @param  string   Field name to read
   * @param  int      Source to get value from (GPC)
   * @param  boolean  Allow HTML tags in field value
   * @param  string   Charset to convert into
   *
   * @return string   Field value or NULL if not available
   */
  public static function get_input_value($fname, $source, $allow_html = FALSE, $charset = NULL)
  {
    $value = NULL;

    if ($source == self::INPUT_GET) {
      if (isset($_GET[$fname])) {
        $value = $_GET[$fname];
      }
    } else if ($source == self::INPUT_POST) {
      if (isset($_POST[$fname])) {
        $value = $_POST[$fname];
      }
    } else if ($source == self::INPUT_GPC) {
      if (isset($_POST[$fname])) {
        $value = $_POST[$fname];
      } else if (isset($_GET[$fname])) {
        $value = $_GET[$fname];
      } else if (isset($_COOKIE[$fname])) {
        $value = $_COOKIE[$fname];
      }
    }

    return self::parse_input_value($value, $allow_html, $charset);
  }


  /**
   * Parse/validate input value. See self::get_input_value()
   * Performs stripslashes() and charset conversion if necessary
   *
   * @param  string   Input value
   * @param  boolean  Allow HTML tags in field value
   * @param  string   Charset to convert into
   *
   * @return string   Parsed value
   */
  public static function parse_input_value($value, $allow_html = FALSE, $charset = NULL)
  {
    if (empty($value)) {
      return $value;
    }

    if (is_array($value)) {
      foreach ($value as $idx => $val) {
        $value[$idx] = self::parse_input_value($val, $allow_html, $charset);
      }
      return $value;
    }

    // strip slashes if magic_quotes enabled
    if (get_magic_quotes_gpc() || get_magic_quotes_runtime()) {
      $value = stripslashes($value);
    }

    // remove HTML tags if not allowed
    if (!$allow_html) {
      $value = strip_tags($value);
    }

    return $value;
  }


  /**
   * Convert array of request parameters (prefixed with _)
   * to a regular array with non-prefixed keys.
   *
   * @param int     $mode       Source to get value from (GPC)
   * @param string  $ignore     PCRE expression to skip parameters by name
   * @param boolean $allow_html Allow HTML tags in field value
   *
   * @return array Hash array with all request parameters
   */
  public static function request2param($mode = null, $ignore = 'task|action', $allow_html = false)
  {
    $out = array();
    $src = $mode == self::INPUT_GET ? $_GET : ($mode == self::INPUT_POST ? $_POST : $_REQUEST);

    foreach (array_keys($src) as $key) {
      $fname = $key[0] == '_' ? substr($key, 1) : $key;
      if ($ignore && !preg_match('/^(' . $ignore . ')$/', $fname)) {
        $out[$fname] = self::get_input_value($key, $mode, $allow_html);
      }
    }

    return $out;
  }

  /**
   * Récupérer l'url complète à partir de l'url relative
   * 
   * @param string $url Url relative
   * @param boolean $absolute Est-ce que l'url doit être absolue
   * 
   * @return string Url complète
   */
  public static function url($url, $absolute = true) {
    $base_path = '';
    if (!empty($_SERVER['REDIRECT_SCRIPT_URL'])) {
        $base_path = $_SERVER['REDIRECT_SCRIPT_URL'];
    }
    else if (!empty($_SERVER['SCRIPT_NAME'])) {
        $base_path = $_SERVER['SCRIPT_NAME'];
    }
    $base_path = preg_replace('![^/]+$!', '', $base_path);
    $base_path = explode('public/', $base_path, 2);
    $base_path = $base_path[0];

    // add base path to this Roundcube installation
    $prefix = $base_path ?: '/';

    // prepend protocol://hostname:port
    if ($absolute) {
      $prefix = self::resolve_url($prefix);
    }

    return $prefix . $url;
  }

   /**
     * Resolve relative URL
     *
     * @param string $url Relative URL
     *
     * @return string Absolute URL
     */
    public static function resolve_url($url)
    {
      // prepend protocol://hostname:port
      if (!preg_match('|^https?://|', $url)) {
        require __DIR__ . '/../config.inc.php';

        $schema       = 'http';
        $default_port = 80;

        if (self::https_check()) {
          $schema       = 'https';
          $default_port = 443;
        }

        if (isset($config['http_host'])) {
          $host = $config['http_host'];
        } else {
          $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : null;
        }
        $port = isset($_SERVER['SERVER_PORT']) ? $_SERVER['SERVER_PORT'] : null;

        $prefix = $schema . '://' . preg_replace('/:\d+$/', '', $host);
        if ($port != $default_port && $port != 80) {
          $prefix .= ':' . $port;
        }

        $url = $prefix . ($url[0] == '/' ? '' : '/') . $url;
      }

      return $url;
    }

  /**
   * Check if working in SSL mode
   *
   * @param integer $port      HTTPS port number
   * @param boolean $use_https Enables 'use_https' option checking
   *
   * @return boolean
   */
  public static function https_check($port = null)
  {
    if (!empty($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) != 'off') {
      return true;
    }
    if (
      !empty($_SERVER['HTTP_X_FORWARDED_PROTO'])
      && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) == 'https'
    ) {
      return true;
    }
    if ($port && $_SERVER['SERVER_PORT'] == $port) {
      return true;
    }

    return false;
  }


  /**
   * Replaces hostname variables.
   *
   * @param string $name Hostname
   * @param string $host Optional IMAP hostname
   *
   * @return string Hostname
   */
  public static function parse_host($name, $host = '')
  {
    if (!is_string($name)) {
      return $name;
    }

    // %n - host
    $n = preg_replace('/:\d+$/', '', $_SERVER['SERVER_NAME']);
    // %t - host name without first part, e.g. %n=mail.domain.tld, %t=domain.tld
    $t = preg_replace('/^[^\.]+\./', '', $n);
    // %d - domain name without first part
    $d = preg_replace('/^[^\.]+\./', '', $_SERVER['HTTP_HOST']);
    // %h - IMAP host
    $h = $_SESSION['storage_host'] ? $_SESSION['storage_host'] : $host;
    // %z - IMAP domain without first part, e.g. %h=imap.domain.tld, %z=domain.tld
    $z = preg_replace('/^[^\.]+\./', '', $h);
    // %s - domain name after the '@' from e-mail address provided at login screen. Returns FALSE if an invalid email is provided
    if (strpos($name, '%s') !== false) {
      $user_email = self::get_input_value('_user', self::INPUT_POST);
      $user_email = self::idn_convert($user_email, true);
      $matches    = preg_match('/(.*)@([a-z0-9\.\-\[\]\:]+)/i', $user_email, $s);
      if ($matches < 1 || filter_var($s[1] . "@" . $s[2], FILTER_VALIDATE_EMAIL) === false) {
        return false;
      }
    }

    return str_replace(array('%n', '%t', '%d', '%h', '%z', '%s'), array($n, $t, $d, $h, $z, $s[2]), $name);
  }


  /**
   * Returns remote IP address and forwarded addresses if found
   *
   * @return string Remote IP address(es)
   */
  public static function remote_ip()
  {
    $address = $_SERVER['REMOTE_ADDR'];

    // append the NGINX X-Real-IP header, if set
    if (!empty($_SERVER['HTTP_X_REAL_IP'])) {
      $remote_ip[] = 'X-Real-IP: ' . $_SERVER['HTTP_X_REAL_IP'];
    }
    // append the X-Forwarded-For header, if set
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
      $remote_ip[] = 'X-Forwarded-For: ' . $_SERVER['HTTP_X_FORWARDED_FOR'];
    }

    if (!empty($remote_ip)) {
      $address .= '(' . implode(',', $remote_ip) . ')';
    }

    return $address;
  }


  /**
   * Returns the real remote IP address
   *
   * @return string Remote IP address
   */
  public static function remote_addr()
  {
    // Check if any of the headers are set first to improve performance
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR']) || !empty($_SERVER['HTTP_X_REAL_IP'])) {
      $proxy_whitelist = rcube::get_instance()->config->get('proxy_whitelist', array());
      if (in_array($_SERVER['REMOTE_ADDR'], $proxy_whitelist)) {
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
          foreach (array_reverse(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])) as $forwarded_ip) {
            if (!in_array($forwarded_ip, $proxy_whitelist)) {
              return $forwarded_ip;
            }
          }
        }

        if (!empty($_SERVER['HTTP_X_REAL_IP'])) {
          return $_SERVER['HTTP_X_REAL_IP'];
        }
      }
    }

    if (!empty($_SERVER['REMOTE_ADDR'])) {
      return $_SERVER['REMOTE_ADDR'];
    }

    return '';
  }

  /**
   * Converti l'id en identifiant utilisable par M2
   *
   * @param string $id
   * @return string
   */
  public static function to_M2_id($id)
  {
    return str_replace(['_-P-_', '_-A-_', '_-C-_'], ['.', '@', '%'], $id);
  }

  /**
   * Remove all non-ascii and non-word chars except ., -, _
   */
  public static function asciiwords($str, $css_id = false, $replace_with = '')
  {
    $allowed = 'a-z0-9\_\-' . (!$css_id ? '\.' : '');
    return preg_replace("/[^$allowed]/i", $replace_with, $str);
  }

  /**
   * Appel la methode de log de roundcube
   * Log dans un fichier Mél
   * 
   * @param string $level voir mel_log::
   * @param string $message
   */
  public static function log($message)
  {
    global $config;

    $ip = self::_get_address_ip();
    $procid = getmypid();
    $mineqprovenance = $_SERVER["HTTP_X_MINEQPROVENANCE"] ?: 'Intranet';
    $courrielleur = isset($_GET['_courrielleur']) ? " {Courrielleur}" : " {Web}";
    $date = date('d-M-Y H:i:s O');
    $message = "[$date]: <calendar> [INFO] $ip ($mineqprovenance) PROC[$procid]$courrielleur - $message\r\n";
    error_log($message, 3, $config['log_file'] ?: '/var/log/roundcube/roundcube_mel.log');
  }

  /**
   * Hash Key validation.
   *
   * @return User user on success, False if key is invalid
   */
  public static function check_hash_key()
  {
    // Récupération des paramètres de la requête
    $calhash = self::get_input_value('_cal', self::INPUT_GET);
    if (isset($calhash)) {
      $format = 'ics';
      $calhash = urldecode($calhash);

      // Récupération des informations à partir du hash
      if (preg_match(($suff_regex = '/\.([a-z0-9]{3,5})$/i'), $calhash, $m)) {
        $format = strtolower($m[1]);
        $calhash = preg_replace($suff_regex, '', $calhash);
      }

      $ics = $format == 'ics';

      if (!strpos($calhash, ':'))
        $calhash = base64_decode($calhash);

      list($_user, $calendar_name) = explode(':', $calhash, 2);
      $calendar_name = self::to_M2_id($calendar_name);
    } else {
      // Si pas d'identifiant on retourne une erreur
      echo json_encode(["error" => "Erreur de lecture pour l'identifiant de l'agenda."]);
      exit();
    }


    // Génération de l'utilisateur Mél
    if (isset($_user)) {
      $user = new LibMelanie\Api\Mel\User();
      $user->uid = $_user;
    }

    // Récupération de la clé de la requête 
    $keyhash = self::get_input_value('_key', self::INPUT_GET);
    $keyhash = urldecode($keyhash);
    if (isset($keyhash)) {
      // On compare la clé avec la valeur des paramètres utilisateurs
      $value = $user->getCalendarPreference("appointmentkeyhash");

      if (isset($value)) {
        $value = unserialize($value);
        if (!isset($value[$calendar_name]) || $value[$calendar_name] != $keyhash) {
          $keyhash = null;
        }
      }
    }

    // Vérification de la clé
    if (!isset($keyhash)) {
      return false;
    }
    return ["user" => $user, "calendar_name" => $calendar_name];
  }

  /**
   * Generate a unique identifier for an event
   * 
   * @return string $uid
   */
  public static function generate_uid($_user)
  {
    return strtoupper(md5(time() . uniqid(rand())) . '-' . substr(md5($_user), 0, 16));
  }

  public static function getDirPath($type) {
    global $config;

    if ($config['DEV']) {
      $dir = str_replace("/public/$type", '', dirname($_SERVER['SCRIPT_FILENAME']));
    }
    else if ($config['DOCKER_DEV']) {
      $dir = str_replace("/public/$type", '', dirname($_SERVER['SCRIPT_FILENAME'])) . '/bnum';
    }
    else if ($config['DOCKER']) {
      $dir = __DIR__ . '/../../bnum';
    }
    else {
      $dir = __DIR__ . '/../..';
    }

    return $dir;
  }

  /******** PRIVATE **********/
  /**
   * Retourne l'adresse ip
   * @return string
   * @private
   */
  private static function _get_address_ip()
  {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
      $ip = $_SERVER['HTTP_CLIENT_IP'];
      $ip = "[" . $_SERVER['REMOTE_ADDR'] . "]/[$ip]";
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
      $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
      $ip = "[" . $_SERVER['REMOTE_ADDR'] . "]/[$ip]";
    } else {
      $ip = $_SERVER['REMOTE_ADDR'];
      $ip = "[$ip]/[" . $_SERVER['REMOTE_ADDR'] . "]";
    }
    return $ip;
  }
}
