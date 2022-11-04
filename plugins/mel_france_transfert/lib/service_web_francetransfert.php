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
   * Format des dates
   * Les dates doivent être au format suivant : AAAA-MM-JJThh:mi:ss
   * Les dates doivent être envoyées en heure locale française (CET). 
   */
  const DATE_FORMAT = 'Y-m-d\TH:i:s';

  /**
   * Format des heures
   * Les heures doivent être au format : hh:mm
   * Les heures doivent être en h24.
   */
  const HOUR_FORMAT = 'H:i';

  /**
   * cleAPI : clé d’API fournie au préalable par l’équipe France transfert
   */
  const API_KEY_HEADER = 'cleAPI';

  /**
   * API-FT01 – Initialisation d’un pli
   */
  const URL_INIT_PLI = '/api-public/initPli';

  /**
   * API-FT02 – Envoi des fichiers d’un pli
   */
  const URL_ENVOI_FICHIER = '/api-public/chargementPli';

  /**
   * API-FT03 – Récupération du statut d’un pli
   */
  const URL_STATUT_PLI = '/api-public/statutPli';

  /**
   * API-FT04 – Récupération des métadonnées d’un pli
   */
  const URL_PLI_META_DONNEES = '/api/donneesPli';

  /**
   * API-FT05 – Récupération des plis d’un utilisateur
   */
  const URL_LIST_PLIS = '/api/mesPlis';

  /**
   * API-FT06 – Téléchargement d’un pli
   */
  const URL_TELECHARGER_PLI = '/api/telechargerPli';

  /**
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
   * @param integer $nb_days
   * @param string $language
   * @param string $from
   * @param string $mailto
   * @param string $mailcc
   * @param string $mailbcc
   * @param string $subject
   * @param string $message_body
   * 
   * @return boolean
   */
  public function initPli($COMPOSE_ID, $nb_days, $language = 'fr_FR', $from, $mailto, $mailcc, $mailbcc, $subject, $message_body) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "ServiceWebFranceTransfert::initPli($COMPOSE_ID, $from)");

    $COMPOSE =& $_SESSION['compose_data_' . $COMPOSE_ID];
    $COMPOSE['ft_action'] = 'Initialisation du pli sur France Transfert';

    $fichiers = [];

    // Calcul de la date
    $date = new \DateTime();
    $date->add(new \DateInterval("P$nb_days"."D"));

    // Parcours des pièces jointes pour les lister
    if (is_array($COMPOSE['attachments'])) {
      foreach ($COMPOSE['attachments'] as $id => $a_prop) {
        $fichiers[] = [
          "idFichier"     => $id,
          "nomFichier"    => $a_prop['name'],
          "tailleFichier" => $a_prop['size'],
        ];
      }
    }

    // Paramètres de la requête
    $params = [
      "typePli"               => $this->rc->config->get('francetransfert_type_pli', 'COU'),
      "courrielExpediteur"    => $from,
      "destinataires"         => $this->_format_mail_list(implode(',' , [$mailto, $mailcc, $mailbcc])),
      "objet"                 => $subject,
      "message"               => $message_body,
      "preferences"           => [
        "dateValidite"              => $date->format(self::DATE_FORMAT),
        "langueCourriel"            => $language,
        "protectionArchive"         => false,
        "envoiMdpDestinataires"     => true,
      ],
      "fichiers"              => $fichiers,
    ];

    // Récupération de l'url de message
    $url = $this->rc->config->get('francetransfert_api_url') . self::URL_INIT_PLI;

    // Appel à l'enregistrement du message du service Web
    $result = $this->_post_url($url, $params);

    // Content
    $content = json_decode($result['content']);

    // Récupération des codes/erreurs
    $this->_httpCode = $result['httpCode'];

    // Gestion des résultats : 201 = OK
    if ($this->_httpCode == 201) {
      // Actualiser l'action
      $COMPOSE['ft_action'] = 'Pli initialisé sur France Transfert';

      //
      //     "idPli": "9210fa47-366b-49bc-a50b-e561b72a0889",
      //     "statutPli": {
      //         "codeStatutPli": "000-INI",
      //         "libelleStatutPli": "Initialisé"
      //     }
      //
      $COMPOSE['ft_pli'] = $content;
      return true;
    }
    else if ($this->_httpCode == 403) {
      $this->_errorMessage = 'Erreur d’authentification sur le service France Transfert (erreur interne)';
      mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebFranceTransfert::curlMessageFranceTransfert() Erreur [".$this->_httpCode."] : " . $this->_errorMessage);
      return false;
    }
    else { // En théorie on a httpcode = 422
      // Gestion des erreurs
      if (isset($content->erreurs)) {
        $errors = [];
        foreach ($content->erreurs as $erreur) {
          $errors[] = "Erreur $erreur[numErreur] sur '$erreur[codeChamp]' : $erreur[libelleErreur]";
        }
        $this->_errorMessage = implode(' / ', $errors);
      }
      mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebFranceTransfert::curlMessageFranceTransfert() Erreur [".$this->_httpCode."] : " . $this->_errorMessage);
      return false;
    }
  }

  /**
   * Upload d'un fichier
   *
   * @param string $COMPOSE_ID
   * @param string $from
   * @param string $id
   * @param string $path
   * @param string $name
   * 
   * @return boolean
   */
  public function sendFile($COMPOSE_ID, $from, $id, $path, $name) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "ServiceWebFranceTransfert::sendFile($COMPOSE_ID, $name)");

    $COMPOSE =& $_SESSION['compose_data_' . $COMPOSE_ID];
    $COMPOSE['ft_action'] = "Envoi du fichier '$name' vers France Transfert";
    $COMPOSE['ft_value'] = 0;

    if (isset($COMPOSE['ft_pli']['idPli'])) {
      $idPli = $COMPOSE['ft_pli']['idPli'];
    }
    else {
      return false;
    }

    // Récupération de l'url
    $url = $this->rc->config->get('francetransfert_api_url') . self::URL_ENVOI_FICHIER;

    $file_size = filesize($path);
    
    $chunk_size = $this->rc->config->get('francetransfert_chunk_size', 5242880); // chunk in bytes
    $total_chunk_size = 0;
    $chunk_number = 1;
    $total_chunks_number = intdiv($file_size, $chunk_size)  + ($file_size % $chunk_size > 0 ? 1 : 0);
    
    $handle = fopen($path, "rb");
    
    while ($total_chunk_size < $file_size) {
      // Génération de la boundary
      $boundary = '-----=' . md5(uniqid(mt_rand()));
  
      $contents = fread($handle, $chunk_size);
      $current_chunk_size = strlen($contents);

      $parts = $this->getChunkParts($boundary, $idPli, $from, $chunk_number, $current_chunk_size, $file_size, $id, $name, $total_chunks_number);
      $parts[] = $boundary;
      $parts[] = 'Content-Disposition: form-data; name="file"; filename="' . $name . '"';
      $parts[] = 'Content-Type: application/octet-stream';
      $parts[] = '';
      $parts[] = $contents;
      $parts[] = $boundary . '--';
      $parts = implode("\r\n", $parts);

      // Appel à l'enregistrement du message du service Web
      $result = $this->_post_url($url, $parts, null, true, $boundary);

      // Content
      $content = json_decode($result['content']);

      // Récupération des codes/erreurs
      $this->_httpCode = $result['httpCode'];

      // Gestion des résultats : 201 = OK
      if ($this->_httpCode == 201) {
        // Actualiser la value
        $COMPOSE['ft_value'] = intdiv($file_size * 100, $total_chunk_size);
      }
      else if ($this->_httpCode == 403) {
        $this->_errorMessage = 'Erreur d’authentification sur le service France Transfert (erreur interne)';
        mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebFranceTransfert::sendFile() Erreur [".$this->_httpCode."] : " . $this->_errorMessage);
        fclose($handle);
        return false;
      }
      else { // En théorie on a httpcode = 422
        // Gestion des erreurs
        if (isset($content->erreurs)) {
          $errors = [];
          foreach ($content->erreurs as $erreur) {
            $errors[] = "Erreur $erreur[numErreur] sur '$erreur[codeChamp]' : $erreur[libelleErreur]";
          }
          $this->_errorMessage = implode(' / ', $errors);
        }
        mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebFranceTransfert::sendFile() Erreur [".$this->_httpCode."] : " . $this->_errorMessage);
        fclose($handle);
        return false;
      }
  
      $total_chunk_size += $current_chunk_size;
      fseek($handle, $total_chunk_size);

      $chunk_number++;
    }
    
    fclose($handle);

    $COMPOSE['ft_action'] = "Fichier '$name' envoyé vers France Transfert";
    $COMPOSE['ft_value'] = null;
    return true;
  }

  /**
   * Récupération du multipart associé au morceau de fichier en cours
   * 
   * @param string $boundary
   * @param string $idPli
   * @param string $from
   * @param integer $chunkNum
   * @param integer $chunkSize
   * @param integer $fileSize
   * @param string $idFile
   * @param string $nameFile
   * @param integer $numberChunks
   * 
   * @return array 
   */
  protected function getChunkParts($boundary, $idPli, $from, $chunkNum, $chunkSize, $fileSize, $idFile, $nameFile, $numberChunks) {
    return [
      // idPli
      $boundary,
      'Content-Disposition: form-data; name="idPli"',
      '',
      $idPli,

      // courrielExpediteur
      $boundary,
      'Content-Disposition: form-data; name="courrielExpediteur"',
      '',
      $from,

      // numMorceauFichier
      $boundary,
      'Content-Disposition: form-data; name="numMorceauFichier"',
      '',
      $chunkNum,

      // tailleMorceauFichier
      $boundary,
      'Content-Disposition: form-data; name="tailleMorceauFichier"',
      '',
      $chunkSize,

      // tailleFichier
      $boundary,
      'Content-Disposition: form-data; name="tailleFichier"',
      '',
      $fileSize,

      // idFichier
      $boundary,
      'Content-Disposition: form-data; name="idFichier"',
      '',
      $idFile,

      // nomFichier
      $boundary,
      'Content-Disposition: form-data; name="nomFichier"',
      '',
      $nameFile,

      // totalMorceauxFichier
      $boundary,
      'Content-Disposition: form-data; name="totalMorceauxFichier"',
      '',
      $numberChunks,
    ];
  }

  /**
   * Récupération du statut du pli
   * 
   * @param string $COMPOSE_ID
   * @param string $from
   * 
   * @return boolean
   */
  public function getStatus($COMPOSE_ID, $from) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "ServiceWebFranceTransfert::getStatus($COMPOSE_ID)");

    $COMPOSE =& $_SESSION['compose_data_' . $COMPOSE_ID];

    if (isset($COMPOSE['ft_pli']['idPli'])) {
      $idPli = $COMPOSE['ft_pli']['idPli'];
    }
    else {
      return false;
    }

    // Récupération de l'url
    $url = $this->rc->config->get('francetransfert_api_url') . self::URL_STATUT_PLI;

    // Gestion des paramètres
    $params = [
      'idPli' => $idPli,
      'courrielExpediteur' => $from,
    ];

    $result = $this->_get_url($url, $params);

    // Content
    $content = json_decode($result['content']);

    // Récupération des codes/erreurs
    $this->_httpCode = $result['httpCode'];

    // Gestion des résultats : 201 = OK
    if ($this->_httpCode == 201) {
      // Actualiser l'action
      $COMPOSE['ft_action'] = $content["statutPli"]["libelleStatutPli"];

      //
      //         "idPli": "9210fa47-366b-49bc-a50b-e561b72a0889",
      //         "statutPli": {
      //             "codeStatutPli": "023-APT",
      //             "libelleStatutPli": "Analyse du pli terminée"
      //         }
      //
      $COMPOSE['ft_pli'] = $content;
      return true;
    }
    else if ($this->_httpCode == 403) {
      $this->_errorMessage = 'Erreur d’authentification sur le service France Transfert (erreur interne)';
      mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebFranceTransfert::getStatus() Erreur [".$this->_httpCode."] : " . $this->_errorMessage);
      return false;
    }
    else { // En théorie on a httpcode = 422
      // Gestion des erreurs
      if (isset($content->erreurs)) {
        $errors = [];
        foreach ($content->erreurs as $erreur) {
          $errors[] = "Erreur $erreur[numErreur] sur '$erreur[codeChamp]' : $erreur[libelleErreur]";
        }
        $this->_errorMessage = implode(' / ', $errors);
      }
      mel_logs::get_instance()->log(mel_logs::ERROR, "ServiceWebFranceTransfert::getStatus() Erreur [".$this->_httpCode."] : " . $this->_errorMessage);
      return false;
    }
  }

  /**
   * Permet de récupérer le contenu d'une page Web
   *
   * @param string $url
   * @param array $params
   * @return array('content', 'httpCode')
   */
  private function _get_url($url, $params = null) {
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
            self::API_KEY_HEADER . ': ' . $this->rc->config->get('francetransfert_api_key', ''),
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

    // Gestion des paramètres
    if (isset($params)) {
      $_p = [];
      foreach ($params as $key => $param) {
        $_p[] = "$key=$param";
      }
      $url .= '?' . implode('&', $_p);
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
   * @param boolean $multipart
   * @param string $boundary
   * 
   * @return array('content', 'httpCode')
   */
  private function _post_url($url, $params = null, $json = null, $multipart = false, $boundary = null) {
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
    ];

    // Gestion d'un envoi multipart
    if ($multipart) {
      $options[CURLOPT_HTTPHEADER] = [
        'Content-Type: multipart/form-data; boundary=' . $boundary,
        'Content-Length: ' . strlen($data_string),
        self::API_KEY_HEADER . ': ' . $this->rc->config->get('francetransfert_api_key', ''),
      ];
    }
    else {
      $options[CURLOPT_HTTPHEADER] = [
        'Content-Type: application/json; charset=utf-8',
        'Content-Length: ' . strlen($data_string),
        self::API_KEY_HEADER . ': ' . $this->rc->config->get('francetransfert_api_key', ''),
      ];
    }

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