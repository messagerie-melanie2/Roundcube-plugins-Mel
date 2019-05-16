<?php
/**
 * Plugin Mél Melanissimo
 *
 * Classe pour la gestion des appels vers le service Web Melanissimo
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

// Chargement de la librairie ORM
@include_once 'includes/libm2.php';

class ServiceWebMelanissimo {
  /**
   *
   * @var rcmail
   */
  private $rc;
  /**
   * @var integer
   */
  private $_httpCode;
  /**
   * @var string
   */
  private $_errorMessage;

  /**
   * Constructeur par défaut
   */
  function __construct($rc) {
    $this->rc = $rc;
  }

  /**
   * Getter httpCode
   * @return number
   */
  public function getHttpCode() {
    return $this->_httpCode;
  }
  /**
   * Getter errorMessage
   * @return string
   */
  public function getErrorMessage() {
    return $this->_errorMessage;
  }

  /**
   * Fonction pour tester si le service Melanissimo est actif
   *
   * @param string $COMPOSE_ID
   * @param integer $size
   * @return boolean
   */
  public function curlTestMelanissimo($COMPOSE_ID, $size) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "ServiceWebMelanissimo::curlTestMelanissimo($COMPOSE_ID, $size)");

    $COMPOSE = & $_SESSION['compose_data_' . $COMPOSE_ID];

    // Récupération du contenu du service Melanissimo
    $result = $this->_get_url($this->rc->config->get('url_service_melanissimo', '') . '/' . $size);
    if (isset($COMPOSE['melanissimo_url_connexion'])) unset($COMPOSE['melanissimo_url_connexion']);

    // Content
    $content = json_decode($result['content']);

    // Récupération des codes/erreurs
    $this->_httpCode = $result['httpCode'];
    $this->_errorMessage = isset($content->Message) ? $content->Message : "";

    // Gestion des résultats : 200 = OK
    if ($result['httpCode'] == 200) {
      $request = $content->{'requêtesPossibles'}[0];
      $COMPOSE['melanissimo_url_connexion'] = array(
              'method' => $request->{'méthode'},
              'protocole' => $request->protocole,
              'url' => str_replace('../', './', $request->url),
              'contentType' => $request->contentType,
              'min' => $request->{'paramètres'}->{'Informatif'}->{'minDuréeGarde'},
              'max' => $request->{'paramètres'}->{'Informatif'}->{'maxDuréeGarde'},
      );
      return true;
    }
    else {
      mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebMelanissimo::curlTestMelanissimo() Erreur [".$this->_httpCode."] : " . $this->_errorMessage);
      return false;
    }
  }

  /**
   * Envoi de la requête d'authentification
   *
   * @param string $COMPOSE_ID
   * @param string $from
   * @return boolean
   */
  public function curlConnectionMelanissimo($COMPOSE_ID, $from) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "ServiceWebMelanissimo::curlConnectionMelanissimo($COMPOSE_ID, $from)");

    $COMPOSE = & $_SESSION['compose_data_' . $COMPOSE_ID];

    // Récupération de l'uid en fonction de l'adresse mail
    if (strtolower($from) != strtolower($_SESSION['m2_from_identity'])) {
      $infos = LibMelanie\Ldap\Ldap::GetUserInfosFromEmail($from);
      $uid = $infos['uid'][0];
    }
    else {
      $uid = $this->rc->get_user_name();
    }

    // Génération des paramètres de connexion
    $params = array(
            "versionService" => $this->rc->config->get('version_service_melanissimo', '1.0'),
            "identifiantLdap" => $uid,
            "motDePasseLdap" => $this->rc->get_user_password(),
            "courrielExpéditeur" => $from,
    );

    // Récupération de l'url d'authentification
    $url = $this->_melanissimo_url($COMPOSE['melanissimo_url_connexion']['url']);
    // Efface les informations de la session
    if (isset($COMPOSE['melanissimo_url_message'])) unset($COMPOSE['melanissimo_url_message']);

    // Appel à l'authentification du service Web
    $result = $this->_post_url($url, $params);

    // Content
    $content = json_decode($result['content']);

    // Récupération des codes/erreurs
    $this->_httpCode = $result['httpCode'];
    $this->_errorMessage = isset($content->Message) ? $content->Message->texte : "";

    // Gestion des résultats : 300 = OK
    if ($result['httpCode'] == 300) {
      $request = $content->{'requêtesPossibles'}[0];
      $COMPOSE['melanissimo_url_message'] = array(
              'method' => $request->{'méthode'},
              'protocole' => $request->protocole,
              'url' => $request->url,
              'contentType' => $request->contentType,
      );
      return true;
    }
    else {
      mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebMelanissimo::curlConnectionMelanissimo() Erreur [".$this->_httpCode."] : " . $this->_errorMessage);
      return false;
    }
  }

  /**
   * Enregistrement du message et de la liste des pièces jointes
   *
   * @param string $COMPOSE_ID
   * @param string $from
   * @param string $mailto
   * @param string $mailcc
   * @param string $mailbcc
   * @param string $subject
   * @param string $message_body
   * @return boolean
   */
  public function curlMessageMelanissimo($COMPOSE_ID, $from, $from_string, $mailto, $mailcc, $mailbcc, $subject, $message_body) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "ServiceWebMelanissimo::curlMessageMelanissimo($COMPOSE_ID, $from)");

    $COMPOSE = & $_SESSION['compose_data_' . $COMPOSE_ID];

    $attachments = array();
    // Parcours des pièces jointes pour les lister
    if (is_array($COMPOSE['attachments'])) {
      foreach ($COMPOSE['attachments'] as $id => $a_prop) {
        $attachments[] = array(
                "empreinte" => hash_file('md5', $a_prop['path']),
                "nom" => $a_prop['name'],
                "taille" => $a_prop['size'],
        );
      }
    }

    // Génération des paramètres de message
    $params = array(
            "expéditeur" => array(
                    "libellé" => $from_string,
                    "adresse" => $from,
            ),
            "listeDestinatairesTo" => $this->_format_mail_list($mailto),
            "listeDestinatairesCc" => $this->_format_mail_list($mailcc),
            "listeDestinatairesCci" => $this->_format_mail_list($mailbcc),
            "sujet" => $subject,
            "corpsMessage" => $message_body,
            "listeFichiers" => $attachments,
    );

    // Récupération de l'url de message
    $url = $this->_melanissimo_url($COMPOSE['melanissimo_url_connexion']['url'], $COMPOSE['melanissimo_url_message']['url']);
    // Efface les informations de la session
    if (isset($COMPOSE['melanissimo_url_garde'])) unset($COMPOSE['melanissimo_url_garde']);

    // Appel à l'enregistrement du message du service Web
    $result = $this->_post_url($url, $params);

    // Content
    $content = json_decode($result['content']);

    // Récupération des codes/erreurs
    $this->_httpCode = $result['httpCode'];
    $this->_errorMessage = isset($content->Message) ? $content->Message->texte : "";

    // Gestion des résultats : 202 = OK
    if ($result['httpCode'] == 202) {
      $request = $content->{'requêtesPossibles'}[0];
      $COMPOSE['melanissimo_url_garde'] = array(
              'method' => $request->{'méthode'},
              'protocole' => $request->protocole,
              'url' => $request->url,
              'contentType' => $request->contentType,
      );
      return true;
    }
    else {
      mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebMelanissimo::curlMessageMelanissimo() Erreur [".$this->_httpCode."] : " . $this->_errorMessage);
      return false;
    }
  }

  /**
   * Enregistrement de la durée de garde du message
   *
   * @param string $COMPOSE_ID
   * @param string $nb_days
   * @return boolean
   */
  public function curlGardeMelanissimo($COMPOSE_ID, $nb_days) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "ServiceWebMelanissimo::curlGardeMelanissimo($COMPOSE_ID, $nb_days)");

    $COMPOSE = & $_SESSION['compose_data_' . $COMPOSE_ID];

    // Génération des paramètres de message
    $json = '{"duréeGarde": '.$nb_days.'}';

    // Récupération de l'url de garde
    $url = $this->_melanissimo_url($COMPOSE['melanissimo_url_connexion']['url'], $COMPOSE['melanissimo_url_message']['url'], $COMPOSE['melanissimo_url_garde']['url']);
    // Efface les informations de la session
    if (isset($COMPOSE['melanissimo_url_fichier'])) unset($COMPOSE['melanissimo_url_fichier']);

    // Appel au changement de durée de garde du service Web
    $result = $this->_post_url($url, null, $json);

    // Content
    $content = json_decode($result['content']);

    // Récupération des codes/erreurs
    $this->_httpCode = $result['httpCode'];
    $this->_errorMessage = isset($content->Message) ? $content->Message->texte : "";

    // Gestion des résultats : 202 = OK
    if ($result['httpCode'] == 202) {
      $content = json_decode($result['content']);
      $request = $content->{'requêtesPossibles'}[0];
      $COMPOSE['melanissimo_url_fichier'] = array(
              'method' => $request->{'méthode'},
              'protocole' => $request->protocole,
              'url' => str_replace('../../', './', $request->url),
              'contentType' => $request->contentType,
      );
      return true;
    }
    else {
      mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebMelanissimo::curlGardeMelanissimo() Erreur [".$this->_httpCode."] : " . $this->_errorMessage);
      return false;
    }
  }

  /**
   * Upload d'un fichier
   *
   * @param string $COMPOSE_ID
   * @param string $path
   * @param string $name
   * @return boolean
   */
  public function curlFichierMelanissimo($COMPOSE_ID, $path, $name) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "ServiceWebMelanissimo::curlFichierMelanissimo($COMPOSE_ID, $name, $contentType)");

    $COMPOSE = & $_SESSION['compose_data_' . $COMPOSE_ID];

    // Récupération de l'url de garde
    $url = $this->_melanissimo_url($COMPOSE['melanissimo_url_connexion']['url'], $COMPOSE['melanissimo_url_message']['url'], $COMPOSE['melanissimo_url_fichier']['url']);
    // Efface les informations de la session
    if (isset($COMPOSE['melanissimo_url_fichier'])) unset($COMPOSE['melanissimo_url_fichier']);
    if (isset($COMPOSE['melanissimo_url_envoi'])) unset($COMPOSE['melanissimo_url_envoi']);

    // Appel à l'upload du fichier pour le service Melanissimo
    $result = $this->_put_url($url, $path);

    // Content
    $content = json_decode($result['content']);

    // Récupération des codes/erreurs
    $this->_httpCode = $result['httpCode'];
    $this->_errorMessage = isset($content->Message) ? $content->Message->texte : "";

    // Gestion des résultats : 202, 201 = OK
    if ($result['httpCode'] == 202) {
      $content = json_decode($result['content']);
      $request = $content->{'requêtesPossibles'}[0];
      $COMPOSE['melanissimo_url_fichier'] = array(
              'method' => $request->{'méthode'},
              'protocole' => $request->protocole,
              'url' => str_replace('../../', './', $request->url),
              'contentType' => $request->contentType,
      );
      return true;
    }
    else if ($result['httpCode'] == 201) {
      $content = json_decode($result['content']);
      $request = $content->{'requêtesPossibles'}[0];
      $COMPOSE['melanissimo_url_envoi'] = array(
              'method' => $request->{'méthode'},
              'protocole' => $request->protocole,
              'url' => str_replace('../../', './', $request->url),
              'contentType' => $request->contentType,
      );
      return true;
    }
    else {
      mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebMelanissimo::curlFichierMelanissimo() Erreur [".$this->_httpCode."] : " . $this->_errorMessage);
      return false;
    }
  }

  /**
   * Instruction d'envoi du message par Melanissimo
   *
   * @param string $COMPOSE_ID
   * @return boolean
   */
  public function curlEnvoiMelanissimo($COMPOSE_ID) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "ServiceWebMelanissimo::curlEnvoiMelanissimo($COMPOSE_ID)");

    $COMPOSE = & $_SESSION['compose_data_' . $COMPOSE_ID];

    // Génération des paramètres de message
    $params = array();

    // Récupération de l'url de garde
    $url = $this->_melanissimo_url($COMPOSE['melanissimo_url_connexion']['url'], $COMPOSE['melanissimo_url_message']['url'], $COMPOSE['melanissimo_url_envoi']['url']);
    // Efface les informations de la session
    unset($COMPOSE['melanissimo_url_connexion']);
    unset($COMPOSE['melanissimo_url_message']);
    unset($COMPOSE['melanissimo_url_garde']);
    unset($COMPOSE['melanissimo_url_fichier']);
    unset($COMPOSE['melanissimo_url_envoi']);

    // Appel au changement de durée de garde du service Web
    $result = $this->_post_url($url, $params);

    // Content
    $content = json_decode($result['content']);

    // Récupération des codes/erreurs
    $this->_httpCode = $result['httpCode'];
    $this->_errorMessage = isset($content->Message) ? $content->Message->texte : "";

    // Gestion des résultats : 202, 201 = OK
    if ($result['httpCode'] == 200) {
      return true;
    }
    else {
      mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebMelanissimo::curlEnvoiMelanissimo() Erreur [".$this->_httpCode."] : " . $this->_errorMessage);
      return false;
    }
  }

  /**
   * Permet de récupérer le contenu d'une page Web
   *
   * @param string $url
   * @return array('content', 'httpCode')
   */
  private function _get_url($url) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "ServiceWebMelanissimo::_get_url($url)");
    // Options list
    $options = array(
            CURLOPT_RETURNTRANSFER => true, // return web page
            CURLOPT_HEADER => false, // don't return headers
            CURLOPT_USERAGENT => $this->rc->config->get('curl_user_agent', ''), // name of client
            CURLOPT_CONNECTTIMEOUT => 120, // time-out on connect
            CURLOPT_TIMEOUT => 1200, // time-out on response
            CURLOPT_SSL_VERIFYPEER => $this->rc->config->get('curl_ssl_verifierpeer', 0),
            CURLOPT_SSL_VERIFYHOST => $this->rc->config->get('curl_ssl_verifierhost', 0),
            CURLOPT_HTTPHEADER => array(
                'X-MineqProvenance: INTRANET',
            ),
//             CURLOPT_PROGRESSFUNCTION => array($this, '_progress'),
//             CURLOPT_NOPROGRESS => false,
    );
    // CA File
    $curl_cafile = $this->rc->config->get('curl_cainfo', null);
    if (isset($curl_cafile)) {
      $options[CURLOPT_CAINFO] = $curl_cafile;
      $options[CURLOPT_CAPATH] = $curl_cafile;
    }
    // HTTP Proxy
    $curl_proxy = $this->rc->config->get('curl_http_proxy', null);
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
      mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebMelanissimo::_get_url() Error " . curl_errno($ch) . " : " . curl_error($ch));
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

  /**
   * Permet de poster des paramètres vers une page web
   *
   * @param string $url
   * @param array $params [Optionnel]
   * @param string $json [Optionnel]
   * @return array('content', 'httpCode')
   */
  private function _post_url($url, $params = null, $json = null) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "ServiceWebMelanissimo::_post_url($url)");
    // Génération du json en fonction des paramètres
    if (isset($params)) {
      $data_string = json_encode($params);
    }
    else if (isset($json)) {
      $data_string = $json;
    }
    else {
      $data_string = "";
    }


    // Options list
    $options = array(
            CURLOPT_RETURNTRANSFER => true, // return web page
            CURLOPT_HEADER => false, // don't return headers
            CURLOPT_USERAGENT => $this->rc->config->get('curl_user_agent', ''), // name of client
            CURLOPT_CONNECTTIMEOUT => 120, // time-out on connect
            CURLOPT_TIMEOUT => 1200, // time-out on response
            CURLOPT_SSL_VERIFYPEER => $this->rc->config->get('curl_ssl_verifierpeer', 0),
            CURLOPT_SSL_VERIFYHOST => $this->rc->config->get('curl_ssl_verifierhost', 0),
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $data_string,
            CURLOPT_HTTPHEADER => array(
                    'Content-Type: application/json; charset=utf-8',
                    'Content-Length: ' . strlen($data_string),
                    'X-MineqProvenance: INTRANET'
            ),
//             CURLOPT_PROGRESSFUNCTION => array($this, '_progress'),
//             CURLOPT_NOPROGRESS => false,
    );
    // CA File
    $curl_cafile = $this->rc->config->get('curl_cainfo', null);
    if (isset($curl_cafile)) {
      $options[CURLOPT_CAINFO] = $curl_cafile;
      $options[CURLOPT_CAPATH] = $curl_cafile;
    }
    // HTTP Proxy
    $curl_proxy = $this->rc->config->get('curl_http_proxy', null);
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
      mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebMelanissimo::_post_url() Error " . curl_errno($ch) . " : " . curl_error($ch));
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

  /**
   * Permet d'envoyer un fichier binaire vers une page web
   *
   * @param string $url
   * @param array $params
   * @param string $contentType
   * @return array('content', 'httpCode')
   */
  private function _put_url($url, $path, $contentType = 'application/octet-stream') {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "ServiceWebMelanissimo::_put_url($url)");
    // Ouvre le pointeur vers le fichier
    $fp = fopen($path, 'r');

    // Options list
    $options = array(
            CURLOPT_RETURNTRANSFER => true, // return web page
            CURLOPT_HEADER => false, // don't return headers
            CURLOPT_USERAGENT => $this->rc->config->get('curl_user_agent', ''), // name of client
            CURLOPT_CONNECTTIMEOUT => 120, // time-out on connect
            CURLOPT_TIMEOUT => 1200, // time-out on response
            CURLOPT_SSL_VERIFYPEER => $this->rc->config->get('curl_ssl_verifierpeer', 0),
            CURLOPT_SSL_VERIFYHOST => $this->rc->config->get('curl_ssl_verifierhost', 0),
            CURLOPT_CUSTOMREQUEST => "PUT",
            CURLOPT_UPLOAD => 1,
            CURLOPT_HTTPHEADER => array(
                'Content-Type: ' . $contentType,
                'X-MineqProvenance: INTRANET',
            ),
            CURLOPT_INFILE => $fp,
            CURLOPT_BUFFERSIZE => 128,
            CURLOPT_INFILESIZE_LARGE => filesize($path),
//             CURLOPT_PROGRESSFUNCTION => array($this, '_progress'),
//             CURLOPT_NOPROGRESS => false,
    );
    // CA File
    $curl_cafile = $this->rc->config->get('curl_cainfo', null);
    if (isset($curl_cafile)) {
      $options[CURLOPT_CAINFO] = $curl_cafile;
      $options[CURLOPT_CAPATH] = $curl_cafile;
    }
    // HTTP Proxy
    $curl_proxy = $this->rc->config->get('curl_http_proxy', null);
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
      mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebMelanissimo::_put_url() Error " . curl_errno($ch) . " : " . curl_error($ch));
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

  /**
   * Génère l'url melanissimo en fonction de l'url passé en paramètre
   * @param string $request_uri
   * @return string
   */
  private function _melanissimo_url() {
    $melanissimo_url = $this->rc->config->get('url_service_melanissimo', '');
    $arg_list = func_get_args();
    foreach ($arg_list as $request_uri) {
      $melanissimo_url .= substr($request_uri, 1);
    }
    return $melanissimo_url;
  }

  /**
   * Formatte une liste d'adresses emails au format attendu par Melanissimo
   * @param string $mails
   * @return array
   */
  private function _format_mail_list($mails) {
    $result = array();
    $mails = explode(',', $mails);
    if ($mails !== false) {
      foreach ($mails as $mail) {
        if (preg_match('/(\S+@\S+)/', $mail, $m)) {
          list($name, $other) = explode(" <", $mail, 2);
          $address = trim($m[1], '<>');
          $result[] = array(
                  'libellé' => $name,
                  'adresse' => $address,
          );
        }
      }
    }
    return $result;
  }

  /**
   * Gestion de la progression de l'upload par curl
   * @param res $resource
   * @param int $download_size
   * @param int $downloaded
   * @param int $upload_size
   * @param int $uploaded
   */
  private function _progress($resource, $download_size, $downloaded, $upload_size, $uploaded)
  {
    $COMPOSE_ID = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
    $COMPOSE = & $_SESSION['compose_data_' . $COMPOSE_ID];

    if ($upload_size > 0) {
      $_SESSION['melanissimo_progress']['current'] = $uploaded / $upload_size  * 100;
    }
    else if ($download_size > 0) {
      $_SESSION['melanissimo_progress']['current'] = $downloaded / $download_size  * 100;
    }
  }
}