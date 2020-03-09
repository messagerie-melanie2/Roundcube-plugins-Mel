<?php 
/**
 * Plugin Mél
 *
 * Driver specifique au MTES pour le plugin mel
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
use LibMelanie\Ldap\Ldap as Ldap;

class mtes_driver_mel extends driver_mel {
  /**
   * Configuration du séparateur pour les boites partagées
   * 
   * @var string
   */
  protected $BAL_SEPARATOR = '.-.';
  
  /**
   * Label utilisé dans les boites partagées pour l'arborescence des dossiers
   * 
   * @var string
   */
  protected $BALP_LABEL = 'Boite partag&AOk-e';
  
  /**
   * Dossier pour les brouillons
   * 
   * @var string
   */
  protected $MBOX_DRAFT = "Brouillons";
  
  /**
   * Dossier pour les éléments envoyés
   *  
   * @var string
   */
  protected $MBOX_SENT = "&AMk-l&AOk-ments envoy&AOk-s";
  
  /**
   * Dossier pour les indésirables
   * 
   * @var string
   */
  protected $MBOX_JUNK = "Ind&AOk-sirables";
  
  /**
   * Dossier pour la corbeille
   * 
   * @var string
   */
  protected $MBOX_TRASH = "Corbeille";

  /**
   * Retourne l'objet User associé à l'utilisateur courant
   * Permet de retourner l'instance User en fonction du driver
   * 
   * @param string $username [Optionnel] Identifiant de l'utilisateur a récupérer, sinon utilise l'utilisateur RC courant
   * @param boolean $load [Optionnel] L'utilisateur doit-il être chargé ? Oui par défaut
   *
   * @return \LibMelanie\Api\Mce\User
   */
  public function getUser($username = null, $load = true) {
    if (!isset($username)) {
      $username = rcmail::get_instance()->user->get_username();
    }
    if (!isset(self::$_users)) {
      self::$_users = [];
    }
    if (!isset(self::$_users[$username])) {
      self::$_users[$username] = new \LibMelanie\Api\Mel\User();
      self::$_users[$username]->uid = $username;
      if ($load && !self::$_users[$username]->load()) {
        self::$_users[$username] = null;
      }
    }
    return self::$_users[$username];
  }
  
  /**
   * Retourne si le username est une boite partagée ou non
   * 
   * @param string $username
   * @return boolean
   */
  public function isBalp($username) {
    return strpos($username, $this->BAL_SEPARATOR) !== false;
  }
  
  /**
   * Retourne le username et le balpname à partir d'un username complet
   * balpname sera null si username n'est pas un objet de partage
   * username sera nettoyé de la boite partagée si username est un objet de partage
   * 
   * @param string $username Username à traiter peut être un objet de partage ou non
   * @return list($username, $balpname) $username traité, $balpname si objet de partage ou null sinon
   */
  public function getBalpnameFromUsername($username) {
    $balpname = null;
    if (strpos($username, $this->BAL_SEPARATOR) !== false) {
      $susername = explode($this->BAL_SEPARATOR, $username);
      $username = $susername[0];
      if (isset($susername[1])) {
        if (strpos($susername[1], '@') !== false) {
          $sbalp = explode('@', $susername[1]);
          $balpname = $sbalp[0];
        }
        else {
          $balpname = $susername[1];
        }
      }
    }
    
    return array($username, $balpname);
  }
  
  /**
   * Retourne le MBOX par defaut pour une boite partagée donnée
   * Peut être INBOX ou autre chose si besoin
   * 
   * @param string $balpname
   * @return string $mbox par defaut
   */
  public function getMboxFromBalp($balpname) {
    if (isset($balpname)) {
      $delimiter = rcmail::get_instance()->get_storage()->delimiter;
      return $this->BALP_LABEL . $delimiter . $balpname;
    }
    else {
      return 'INBOX';
    }
  }
  
  /**
   * Est-ce que le username a des droits gestionnaire sur l'objet LDAP
   *
   * @param string $username
   * @param array $infos Entry LDAP
   * @return boolean
   */
  public function isUsernameHasGestionnaire($username, $infos) {
    if (isset($infos['mineqmelpartages']) && in_array("$username:G", $infos['mineqmelpartages'])) {
      $uid = array_pop(explode($this->BAL_SEPARATOR, $this->getUsername($infos)));
      $info = mel::get_user_infos($uid);
      if (isset($info['mineqtypeentree']) && $info['mineqtypeentree'][0] != 'BALI' && $info['mineqtypeentree'][0] != 'BALA') {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Est-ce que le username a des droits emission sur l'objet LDAP
   * 
   * @param string $username
   * @param array $infos Entry LDAP
   * @return boolean
   */
  public function isUsernameHasEmission($username, $infos) {
    if (isset($infos['mineqmelpartages'])) {
      if (in_array("$username:G", $infos['mineqmelpartages']) || in_array("$username:C", $infos['mineqmelpartages'])) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Defini si l'accés internet est activé pour l'objet LDAP
   * 
   * @param array $infos Entry LDAP
   * @return boolean true si l'accés internet est activé, false sinon
   */
  public function isInternetAccessEnable($infos) {
    return isset($infos[Ldap::GetMap('user_mel_accesinterneta', 'mineqmelaccesinterneta')]) 
        && $infos[Ldap::GetMap('user_mel_accesinterneta', 'mineqmelaccesinterneta')][0] == 1 
        && isset($infos[Ldap::GetMap('user_mel_accesinternetu', 'mineqmelaccesinternetu')]) 
        && $infos[Ldap::GetMap('user_mel_accesinternetu', 'mineqmelaccesinternetu')][0] == 1;
  }
  
  /**
   * Récupère et traite les infos de routage depuis l'objet LDAP 
   * pour retourner le hostname de connexion IMAP et/ou SMTP
   * 
   * @param array $infos Entry LDAP
   * @return string $hostname de routage, null si pas de routage trouvé
   */
  public function getRoutage($infos) {
    $hostname = null;
    if (is_array($infos)) {
      if (isset($infos['mineqmelroutage']) && count($infos['mineqmelroutage']) > 0) {
        // MANTIS 3925: mineqMelRoutage multivalué
        foreach ($infos['mineqmelroutage'] as $melroutage) {
          if (strpos($melroutage, '%') !== false) {
            $tmp = explode('@', $melroutage);
            $hostname = $tmp[1];
            break;
          }
        }
      }
    }
    else {
      $hostname = $infos->server_host;
    }
    return $hostname;
  }
  
  /**
   * Retourne si le username est bien présent dans les infos
   * 
   * @param array $infos Entry LDAP
   * @return boolean
   */
  public function issetUsername($infos) {
    return isset($infos['uid']) && isset($infos['uid'][0]);
  }
  
  /**
   * Retourne le username a partir de l'objet LDAP
   * 
   * @param array $infos Entry LDAP
   * @return string username
   */
  public function getUsername($infos) {
    return isset($infos['uid']) ? $infos['uid'][0] : null;
  }
  
  /**
   * Retourne le fullname a partir de l'objet LDAP
   * 
   * @param array $infos Entry LDAP
   * @return string fullname
   */
  public function getFullname($infos) {
    return isset($infos['cn']) ? $infos['cn'][0] : (isset($infos['mailpr']) ? $infos['mailpr'][0] : null);
  }
  
  /**
   * Positionne des headers pour un message avant de l'envoyer
   * 
   * @param array $headers Liste des headers a fournir au message
   * @return array $headers Retourne les headers completes
   */
  public function setHeadersMessageBeforeSend($headers) {
    // Positionner le HEADER pour indiquer l'origine du message (internet, intranet)
    $headers['Received'] = 'from butineur (par ' . $_SERVER["HTTP_X_MINEQPROVENANCE"] . ' [' . $_SERVER["HTTP_X_FORWARDED_FOR"] . ']) by ' . $_SERVER["HTTP_X_FORWARDED_SERVER"] . ' [' . $_SERVER["SERVER_ADDR"] . ']';
    
    return $headers;
  }
  
  /**
   * Est-ce que l'utilisateur courant a le droit d'accéder au stockage
   * 
   * @return boolean true si le stockage doit être affiché, false sinon
   */
  public function userHasAccessToStockage() {
    // Gestion du filtre LDAP
    $filter_ldap = rcmail::get_instance()->config->get('roundcube_nextcloud_filter_ldap', array());
    $hasAccess = true;
    $user_infos = LibMelanie\Ldap\Ldap::GetUserInfos(rcmail::get_instance()->get_user_name());
    
    if (isset($filter_ldap) && count($filter_ldap) > 0) {
      foreach ($filter_ldap as $key => $value) {
        if (!isset($user_infos[$key]) 
            || is_array($user_infos[$key]) && ! in_array($value, $user_infos[$key]) 
            || is_string($user_infos[$key]) && $user_infos[$key] != $value) {
          $hasAccess = false;
        }
      }
    }
    
    // Parcourir les dn autorisés et valider la connexion
    foreach (rcmail::get_instance()->config->get('roundcube_nextcloud_ldap_allowed_dn', array()) as $allowed_dn) {
      if (strpos($user_infos['dn'], $allowed_dn) !== false) {
        $hasAccess = true;
      }
    }
    // Parcourir les dn interdits et refuser la connexion
    foreach (rcmail::get_instance()->config->get('roundcube_nextcloud_ldap_forbidden_dn', array()) as $forbidden_dn) {
      if (strpos($user_infos['dn'], $forbidden_dn) !== false) {
        $hasAccess = false;
      }
    }
    
    // Si on est sur Internet, vérifier que l'utilisateur a la double auth
    if ($hasAccess 
        && !mel::is_internal() 
        && !mel_doubleauth::is_double_auth_enable()) {
      $hasAccess = false;
    }
    
    return $hasAccess;
  }
  
  /**
   * Est-ce que le mot de passe de l'utilisateur doit changer
   * Si c'est le cas la page de changement de mot de passe sera affichée après le login
   * Le titre de la page est en entrée/sortie
   * 
   * @param string $title Titre de la fenetre de changement de mot de passe
   * @return boolean Le mot de passe doit changer
   */
  public function isPasswordNeedsToChange(&$title) {
    $needs_to_change = false;
    if (!isset($_SESSION['plugin.show_password_change']) 
        && !$_SESSION['plugin.show_password_change']) {
      // Récupération des informations sur l'utilisateur courant
      $infos = LibMelanie\Ldap\Ldap::GetUserInfos(rcmail::get_instance()->get_user_name(), null, array(
          'mineqpassworddoitchanger'
      ), LibMelanie\Config\Ldap::$AUTH_LDAP);
      if (!empty($infos['mineqpassworddoitchanger'][0])) {
        $title = $infos['mineqpassworddoitchanger'][0];
        $needs_to_change = true;
        $_SESSION['plugin.show_password_change'] = true;
      }
    }
    return $needs_to_change;
  }

  /**
   * Méthode appelée à chaque action sur le backend effectuée dans le code
   * Va permettre de compléter les actions avec de nouvelles interractions avec le bakcend
   * En faisant par exemple des écritures LDAP, des appels a des scripts ou du queuing
   * 
   * @param string $actionName Nom de l'action
   * @param array $data Liste des données associées à l'action
   * 
   * @return boolean true si tout est OK, false si erreur
   */
  public function triggerAction($actionName, $data) {
    return true;
  }
}