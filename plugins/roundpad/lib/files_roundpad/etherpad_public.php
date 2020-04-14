<?php
/**
 * Plugin Roundpad
 *
 * Etherpad class
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

/**
 * Class for etherpad files
 *
 * @property string $name Name of the file
 * @property string $type Kind of file
 * @property timestamp $created Date of creation for the file
 * @property string $url Url of the file
 * @property string $owner Owner of the file
 */
class Etherpad_public extends file_roundpad
{
  /**
   * Constant type for etherpad
   */
  const TYPE_ETHERPAD = 'etherpad_public';
  /**
   * Maximum length name for an etherpad
   */
  const MAX_LENGTH_NAME = 50;

  /**
   * Etherpad constructor
   * Set type to etherpad
   * @param string $json
   */
  public function __construct($json = null) {
    parent::__construct($json);
    $this->setProperty('type', self::TYPE_ETHERPAD);
  }
  /**
   * Generate an etherpad URL based on the name
   * @param string $name
   * @return string
   */
  public static function GenerateURL($name) {
    $etherpad_url = rcmail::get_instance()->config->get('etherpad_public_url');
    $uniqid = uniqid();
    $name = urlencode(preg_replace("/[^a-zA-Z0-9_\-]+/", "", str_replace(' ', '_', trim(self::remove_accents($name)))));
    if (strlen($name . '_' . $uniqid) > self::MAX_LENGTH_NAME) {
      $name = substr($name, 0, self::MAX_LENGTH_NAME - strlen('_' . $uniqid) - 1);
    }
    return $etherpad_url . $name . '_' . $uniqid;
  }

  /**
   * Create PAD on Etherpad using api key
   * 
   * @return boolean
   */
  public static function CreatePad($name) {
    mel_logs::get_instance()->log(mel_logs::INFO, "[Roundpad] Etherpad::CreatePad($name)");

    $etherpad_api_url = rcmail::get_instance()->config->get('etherpad_public_api_url');
    $etherpad_api_key = rcmail::get_instance()->config->get('etherpad_public_api_key');
    $url = $etherpad_api_url . '/createPad?apikey=' . $etherpad_api_key .  '&padID=' . urlencode($name);

    // Récupération du contenu du service Melanissimo
    $result = self::_get_url($url);

    // Content
    $content = json_decode($result['content']);

    if ($content->code === 0) {
      return true;
    }
    else {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Roundpad] Etherpad::CreatePad($name) Error : " . $content->message);
      return false;
    }
  }

  /**
   * Delete PAD on Etherpad using api key
   * 
   * @return boolean
   */
  public static function DeletePad($name) {
    mel_logs::get_instance()->log(mel_logs::INFO, "[Roundpad] Etherpad::DeletePad($name)");

    $etherpad_api_url = rcmail::get_instance()->config->get('etherpad_public_api_url');
    $etherpad_api_key = rcmail::get_instance()->config->get('etherpad_public_api_key');
    $url = $etherpad_api_url . '/deletePad?apikey=' . $etherpad_api_key .  '&padID=' . urlencode($name);

    // Récupération du contenu du service Melanissimo
    $result = self::_get_url($url);

    // Content
    $content = json_decode($result['content']);

    if ($content->code === 0) {
      return true;
    }
    else {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Roundpad] Etherpad::DeletePad($name) Error : " . $content->message);
      return false;
    }
  }

    /**
   * Permet de récupérer le contenu d'une page Web
   *
   * @param string $url
   * @return array('content', 'httpCode')
   */
  private static function _get_url($url) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[Roundpad] Etherpad::_get_url($url)");

    $rcmail = rcmail::get_instance();
    // Options list
    $options = array(
            CURLOPT_RETURNTRANSFER => true, // return web page
            CURLOPT_HEADER => false, // don't return headers
            CURLOPT_USERAGENT => $rcmail->config->get('roundpad_curl_user_agent', 'Roundcube'), // name of client
            CURLOPT_CONNECTTIMEOUT => 120, // time-out on connect
            CURLOPT_TIMEOUT => 1200, // time-out on response
            CURLOPT_SSL_VERIFYPEER => $rcmail->config->get('roundpad_curl_ssl_verifierpeer', 0),
            CURLOPT_SSL_VERIFYHOST => $rcmail->config->get('roundpad_curl_ssl_verifierhost', 0),
    );
    // CA File
    $curl_cafile = $rcmail->config->get('roundpad_curl_cainfo', null);
    if (isset($curl_cafile)) {
      $options[CURLOPT_CAINFO] = $curl_cafile;
      $options[CURLOPT_CAPATH] = $curl_cafile;
    }
    // HTTP Proxy
    $curl_proxy = $rcmail->config->get('roundpad_curl_http_proxy', null);
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
    if ($content === false) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Roundpad] Etherpad::_get_url() Error " . curl_errno($ch) . " : " . curl_error($ch));
    }
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

  private static function remove_accents($string) {
    if ( !preg_match('/[\x80-\xff]/', $string) )
        return $string;

    $chars = array(
      // Decompositions for Latin-1 Supplement
      chr(195).chr(128) => 'A', chr(195).chr(129) => 'A',
      chr(195).chr(130) => 'A', chr(195).chr(131) => 'A',
      chr(195).chr(132) => 'A', chr(195).chr(133) => 'A',
      chr(195).chr(135) => 'C', chr(195).chr(136) => 'E',
      chr(195).chr(137) => 'E', chr(195).chr(138) => 'E',
      chr(195).chr(139) => 'E', chr(195).chr(140) => 'I',
      chr(195).chr(141) => 'I', chr(195).chr(142) => 'I',
      chr(195).chr(143) => 'I', chr(195).chr(145) => 'N',
      chr(195).chr(146) => 'O', chr(195).chr(147) => 'O',
      chr(195).chr(148) => 'O', chr(195).chr(149) => 'O',
      chr(195).chr(150) => 'O', chr(195).chr(153) => 'U',
      chr(195).chr(154) => 'U', chr(195).chr(155) => 'U',
      chr(195).chr(156) => 'U', chr(195).chr(157) => 'Y',
      chr(195).chr(159) => 's', chr(195).chr(160) => 'a',
      chr(195).chr(161) => 'a', chr(195).chr(162) => 'a',
      chr(195).chr(163) => 'a', chr(195).chr(164) => 'a',
      chr(195).chr(165) => 'a', chr(195).chr(167) => 'c',
      chr(195).chr(168) => 'e', chr(195).chr(169) => 'e',
      chr(195).chr(170) => 'e', chr(195).chr(171) => 'e',
      chr(195).chr(172) => 'i', chr(195).chr(173) => 'i',
      chr(195).chr(174) => 'i', chr(195).chr(175) => 'i',
      chr(195).chr(177) => 'n', chr(195).chr(178) => 'o',
      chr(195).chr(179) => 'o', chr(195).chr(180) => 'o',
      chr(195).chr(181) => 'o', chr(195).chr(182) => 'o',
      chr(195).chr(182) => 'o', chr(195).chr(185) => 'u',
      chr(195).chr(186) => 'u', chr(195).chr(187) => 'u',
      chr(195).chr(188) => 'u', chr(195).chr(189) => 'y',
      chr(195).chr(191) => 'y',
      // Decompositions for Latin Extended-A
      chr(196).chr(128) => 'A', chr(196).chr(129) => 'a',
      chr(196).chr(130) => 'A', chr(196).chr(131) => 'a',
      chr(196).chr(132) => 'A', chr(196).chr(133) => 'a',
      chr(196).chr(134) => 'C', chr(196).chr(135) => 'c',
      chr(196).chr(136) => 'C', chr(196).chr(137) => 'c',
      chr(196).chr(138) => 'C', chr(196).chr(139) => 'c',
      chr(196).chr(140) => 'C', chr(196).chr(141) => 'c',
      chr(196).chr(142) => 'D', chr(196).chr(143) => 'd',
      chr(196).chr(144) => 'D', chr(196).chr(145) => 'd',
      chr(196).chr(146) => 'E', chr(196).chr(147) => 'e',
      chr(196).chr(148) => 'E', chr(196).chr(149) => 'e',
      chr(196).chr(150) => 'E', chr(196).chr(151) => 'e',
      chr(196).chr(152) => 'E', chr(196).chr(153) => 'e',
      chr(196).chr(154) => 'E', chr(196).chr(155) => 'e',
      chr(196).chr(156) => 'G', chr(196).chr(157) => 'g',
      chr(196).chr(158) => 'G', chr(196).chr(159) => 'g',
      chr(196).chr(160) => 'G', chr(196).chr(161) => 'g',
      chr(196).chr(162) => 'G', chr(196).chr(163) => 'g',
      chr(196).chr(164) => 'H', chr(196).chr(165) => 'h',
      chr(196).chr(166) => 'H', chr(196).chr(167) => 'h',
      chr(196).chr(168) => 'I', chr(196).chr(169) => 'i',
      chr(196).chr(170) => 'I', chr(196).chr(171) => 'i',
      chr(196).chr(172) => 'I', chr(196).chr(173) => 'i',
      chr(196).chr(174) => 'I', chr(196).chr(175) => 'i',
      chr(196).chr(176) => 'I', chr(196).chr(177) => 'i',
      chr(196).chr(178) => 'IJ',chr(196).chr(179) => 'ij',
      chr(196).chr(180) => 'J', chr(196).chr(181) => 'j',
      chr(196).chr(182) => 'K', chr(196).chr(183) => 'k',
      chr(196).chr(184) => 'k', chr(196).chr(185) => 'L',
      chr(196).chr(186) => 'l', chr(196).chr(187) => 'L',
      chr(196).chr(188) => 'l', chr(196).chr(189) => 'L',
      chr(196).chr(190) => 'l', chr(196).chr(191) => 'L',
      chr(197).chr(128) => 'l', chr(197).chr(129) => 'L',
      chr(197).chr(130) => 'l', chr(197).chr(131) => 'N',
      chr(197).chr(132) => 'n', chr(197).chr(133) => 'N',
      chr(197).chr(134) => 'n', chr(197).chr(135) => 'N',
      chr(197).chr(136) => 'n', chr(197).chr(137) => 'N',
      chr(197).chr(138) => 'n', chr(197).chr(139) => 'N',
      chr(197).chr(140) => 'O', chr(197).chr(141) => 'o',
      chr(197).chr(142) => 'O', chr(197).chr(143) => 'o',
      chr(197).chr(144) => 'O', chr(197).chr(145) => 'o',
      chr(197).chr(146) => 'OE',chr(197).chr(147) => 'oe',
      chr(197).chr(148) => 'R',chr(197).chr(149) => 'r',
      chr(197).chr(150) => 'R',chr(197).chr(151) => 'r',
      chr(197).chr(152) => 'R',chr(197).chr(153) => 'r',
      chr(197).chr(154) => 'S',chr(197).chr(155) => 's',
      chr(197).chr(156) => 'S',chr(197).chr(157) => 's',
      chr(197).chr(158) => 'S',chr(197).chr(159) => 's',
      chr(197).chr(160) => 'S', chr(197).chr(161) => 's',
      chr(197).chr(162) => 'T', chr(197).chr(163) => 't',
      chr(197).chr(164) => 'T', chr(197).chr(165) => 't',
      chr(197).chr(166) => 'T', chr(197).chr(167) => 't',
      chr(197).chr(168) => 'U', chr(197).chr(169) => 'u',
      chr(197).chr(170) => 'U', chr(197).chr(171) => 'u',
      chr(197).chr(172) => 'U', chr(197).chr(173) => 'u',
      chr(197).chr(174) => 'U', chr(197).chr(175) => 'u',
      chr(197).chr(176) => 'U', chr(197).chr(177) => 'u',
      chr(197).chr(178) => 'U', chr(197).chr(179) => 'u',
      chr(197).chr(180) => 'W', chr(197).chr(181) => 'w',
      chr(197).chr(182) => 'Y', chr(197).chr(183) => 'y',
      chr(197).chr(184) => 'Y', chr(197).chr(185) => 'Z',
      chr(197).chr(186) => 'z', chr(197).chr(187) => 'Z',
      chr(197).chr(188) => 'z', chr(197).chr(189) => 'Z',
      chr(197).chr(190) => 'z', chr(197).chr(191) => 's'
    );

    $string = strtr($string, $chars);

    return $string;
  }
}