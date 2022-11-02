<?php
/**
 * Plugin Mél France Transfert
 *
 * Classe pour la gestion des appels vers le service Web France Transfert
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

class ServiceWebFranceTransfert {
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
   * Initialisation du Pli pour France Transfert
   * 
   * @param string $COMPOSE_ID
   * @param string $from
   * @param string $mailto
   * @param string $mailcc
   * @param string $mailbcc
   * @param string $subject
   * @param string $message_body
   * 
   * @return boolean
   */
  public function curlInitPli($COMPOSE_ID, $from, $from_string, $mailto, $mailcc, $mailbcc, $subject, $message_body) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "ServiceWebFranceTransfert::curlInitPli($COMPOSE_ID, $from)");

    $COMPOSE = & $_SESSION['compose_data_' . $COMPOSE_ID];

    $fichiers = [];
    // Parcours des pièces jointes pour les lister
    if (is_array($COMPOSE['attachments'])) {
      foreach ($COMPOSE['attachments'] as $id => $a_prop) {
        $fichiers[] = [
            "idFichier"     => $this->getIdFichier($a_prop),
            "nomFichier"    => $a_prop['name'],
            "tailleFichier" => $a_prop['size'],
        ];
      }
    }

    $params = [
        "typePli"               => $this->rc->config->get('francetransfert_type_pli', 'LIE'),
        "courrielExpediteur"    => $from,
        "destinataires"         => $this->_format_mail_list(array_merge($mailto, $mailcc, $mailbcc)),
        "objet"                 => $subject,
        "message"               => $message_body,
        "preferences"           => [
            "dateValidite"              => "", // TODO: A calculer
            "motDePasse"                => "", // TODO: A calculer
            "langueCourriel"            => "fr-FR",
            "protectionArchive"         => false,
            "envoiMdpDestinataires"     => true,
        ],
        "fichiers"              => $fichiers,
    ];
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
  public function curlMessageFranceTransfert($COMPOSE_ID, $from, $from_string, $mailto, $mailcc, $mailbcc, $subject, $message_body) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "ServiceWebFranceTransfert::curlMessageFranceTransfert($COMPOSE_ID, $from)");

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
      mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebFranceTransfert::curlMessageFranceTransfert() Erreur [".$this->_httpCode."] : " . $this->_errorMessage);
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
  public function curlFichierFranceTransfert($COMPOSE_ID, $path, $name) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "ServiceWebFranceTransfert::curlFichierFranceTransfert($COMPOSE_ID, $name)");

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
      mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebFranceTransfert::curlFichierFranceTransfert() Erreur [".$this->_httpCode."] : " . $this->_errorMessage);
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
      mel_logs::get_instance()->log(mel_logs::DEBUG, "ServiceWebFranceTransfert::_get_url($url)");

    // Options list
    $options = array(
        CURLOPT_RETURNTRANSFER  => true, // return web page
        CURLOPT_HEADER          => false, // don't return headers
        CURLOPT_USERAGENT       => $this->rc->config->get('curl_user_agent', ''), // name of client
        CURLOPT_CONNECTTIMEOUT  => $this->rc->config->get('curl_connecttimeout', 120), // time-out on connect
        CURLOPT_TIMEOUT         => $this->rc->config->get('curl_timeout', 1200), // time-out on response
        CURLOPT_SSL_VERIFYPEER  => $this->rc->config->get('curl_ssl_verifierpeer', 0),
        CURLOPT_SSL_VERIFYHOST  => $this->rc->config->get('curl_ssl_verifierhost', 0),
        CURLOPT_HTTPHEADER      => [
            'X-MineqProvenance: INTRANET',
        ],
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
      mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebFranceTransfert::_get_url() Error " . curl_errno($ch) . " : " . curl_error($ch));
    }

    // Get the HTTP Code
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    // Close connection
    curl_close($ch);

    // Return the content
    return [
        'httpCode' => $httpcode,
        'content' => $content
    ];
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
      mel_logs::get_instance()->log(mel_logs::DEBUG, "ServiceWebFranceTransfert::_post_url($url)");
    
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
    $options = [
        CURLOPT_RETURNTRANSFER  => true, // return web page
        CURLOPT_HEADER          => false, // don't return headers
        CURLOPT_USERAGENT       => $this->rc->config->get('curl_user_agent', ''), // name of client
        CURLOPT_CONNECTTIMEOUT  => $this->rc->config->get('curl_connecttimeout', 120), // time-out on connect
        CURLOPT_TIMEOUT         => $this->rc->config->get('curl_timeout', 1200), // time-out on response
        CURLOPT_SSL_VERIFYPEER  => $this->rc->config->get('curl_ssl_verifierpeer', 0),
        CURLOPT_SSL_VERIFYHOST  => $this->rc->config->get('curl_ssl_verifierhost', 0),
        CURLOPT_POST            => true,
        CURLOPT_POSTFIELDS      => $data_string,
        CURLOPT_HTTPHEADER      => [
                'Content-Type: application/json; charset=utf-8',
                'Content-Length: ' . strlen($data_string),
        ],
    ];

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
      mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebFranceTransfert::_post_url() Error " . curl_errno($ch) . " : " . curl_error($ch));
    }

    // Get the HTTP Code
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    // Close connection
    curl_close($ch);

    // Return the content
    return [
        'httpCode' => $httpcode,
        'content' => $content
    ];
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
      mel_logs::get_instance()->log(mel_logs::DEBUG, "ServiceWebFranceTransfert::_put_url($url)");

    // Ouvre le pointeur vers le fichier
    $fp = fopen($path, 'r');

    // Options list
    $options = [
        CURLOPT_RETURNTRANSFER      => true, // return web page
        CURLOPT_HEADER              => false, // don't return headers
        CURLOPT_USERAGENT           => $this->rc->config->get('curl_user_agent', ''), // name of client
        CURLOPT_CONNECTTIMEOUT      => $this->rc->config->get('curl_connecttimeout', 120), // time-out on connect
        CURLOPT_TIMEOUT             => $this->rc->config->get('curl_timeout', 1200), // time-out on response
        CURLOPT_SSL_VERIFYPEER      => $this->rc->config->get('curl_ssl_verifierpeer', 0),
        CURLOPT_SSL_VERIFYHOST      => $this->rc->config->get('curl_ssl_verifierhost', 0),
        CURLOPT_CUSTOMREQUEST       => "PUT",
        CURLOPT_UPLOAD              => 1,
        CURLOPT_HTTPHEADER          => [
            'Content-Type: ' . $contentType,
        ],
        CURLOPT_INFILE              => $fp,
        CURLOPT_BUFFERSIZE          => 128,
        CURLOPT_INFILESIZE_LARGE => filesize($path),
    ];

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
      mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebFranceTransfert::_put_url() Error " . curl_errno($ch) . " : " . curl_error($ch));
    }

    // Get the HTTP Code
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    // Close connection
    curl_close($ch);

    // Return the content
    return [
        'httpCode' => $httpcode,
        'content' => $content
    ];
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
   * Formatte une liste d'adresses emails au format attendu par France Transfert
   * 
   * @param string $mails
   * 
   * @return array
   */
  protected function _format_mail_list($mails) {
    $result = array();
    $mails = explode(',', $mails);
    if ($mails !== false) {
      foreach ($mails as $mail) {
        if (preg_match('/(\S+@\S+)/', $mail, $m)) {
          $address = trim($m[1], '<>');
          $result[] = $address;
        }
      }
    }
    return $result;
  }

  /**
   * Retourne un id de fichier en suivant les recommandations FT
   * 
   * L’identifiant unique de fichier idFichier peut être généré en concaténant : 
   * 
   * 	la taille en octets du fichier
   * 	un tiret « –  » 
   * 	le nom du fichier sans « . » 
   * 
   * Exemple : 684952-fichiertxt
   * 
   * @param array $fichier
   * 
   * @return string
   */
  protected function getIdFichier($fichier) {
    return $fichier['size'] . "-" . str_replace('.', '', $fichier['name']);
  }
}