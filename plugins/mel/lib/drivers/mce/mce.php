<?php 
/**
 * Plugin Mél
 *
 * Driver specifique a la MCE pour le plugin mel
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

class mce_driver_mel extends driver_mel {
  /**
   * Configuration du séparateur pour les boites partagées
   *
   * @var string
   */
  protected $BAL_SEPARATOR = '+';

  /**
   * Retourne l'objet User associé à l'utilisateur courant
   * Permet de retourner l'instance User en fonction du driver
   * 
   * @param string $username [Optionnel]
   *
   * @return \LibMelanie\Api\Mce\User
   */
  public function getCurrentUser($username = null) {
    if (!isset(self::$current_user)) {
      self::$current_user = new \LibMelanie\Api\Mce\User();
      self::$current_user->uid = isset($username) ? $username : rcmail::get_instance()->user->get_username();
      self::$current_user->load();
    }
    return self::$current_user;
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
        $sbalp = explode('@', $susername[1]);
        $balpname = $sbalp[0];
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
    return 'INBOX';
  }
  
  /**
   * Est-ce que le username a des droits gestionnaire sur l'objet LDAP
   *
   * @param string $username
   * @param array $infos Entry LDAP
   * @return boolean
   */
  public function isUsernameHasGestionnaire($username, $infos) {
    if (isset($infos['mcedelegation']) && in_array("$username:", $infos['mcedelegation'])) {
        return true;
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
    if (isset($infos['mcedelegation']) && in_array("$username:", $infos['mcedelegation'])) {
      return true;
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
    return true;
  }
  
  /**
   * Récupère et traite les infos de routage depuis l'objet LDAP 
   * pour retourner le hostname de connexion IMAP et/ou SMTP
   * 
   * @param array $infos Entry LDAP
   * @return string $hostname de routage, null si pas de routage trouvé
   */
  public function getRoutage($infos) {
    $hostname = rcmail::get_instance()->config->get('default_host');
    if (!isset($hostname) 
        || is_array($hostname)) {
      $hostname = isset($infos['mailhost']) ? $infos['mailhost'][0] : null;
    }
    else {
      $a_host = parse_url($hostname);
      if (isset($a_host['host'])) {
        $hostname = $a_host['host'];
      }
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
    return isset($infos['uid']);
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
    return $infos[rcmail::get_instance()->config->get('default_object_name_ldap_field', 'cn')][0] ?: $infos['mail'][0];
  }
  
  /**
   * Positionne des headers pour un message avant de l'envoyer
   *
   * @param array $headers Liste des headers a fournir au message
   * @return array $headers Retourne les headers completes
   */
  public function setHeadersMessageBeforeSend($headers) {
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
    if (isset($filter_ldap) && count($filter_ldap) > 0) {
      $user_infos = LibMelanie\Ldap\Ldap::GetUserInfos(rcmail::get_instance()->get_user_name());
      
      foreach ($filter_ldap as $key => $value) {
        if (!isset($user_infos[$key])
            || is_array($user_infos[$key]) && ! in_array($value, $user_infos[$key])
            || is_string($user_infos[$key]) && $user_infos[$key] != $value) {
              $hasAccess = false;
            }
      }
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
    return false;
  }
}