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
  const BAL_SEPARATOR = '+';
  
  /**
   * Retourne si le username est une boite partagée ou non
   *
   * @param string $username
   * @return boolean
   */
  public function isBalp($username) {
    return strpos($username, self::BAL_SEPARATOR) !== false;
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
    if (strpos($username, self::BAL_SEPARATOR) !== false) {
      $susername = explode(self::BAL_SEPARATOR, $username);
      $username = $susername[0];
      if (isset($susername[1])) {
        $sbalp = explode('@', $susername[1]);
        $balpname = $sbalp[0];
      }
    }
    
    return array($username, $balpname);
  }
  
  /**
   * Est-ce que le username a des droits gestionnaire sur l'objet LDAP
   *
   * @param string $username
   * @param array $infos Entry LDAP
   * @return boolean
   */
  public function isUsernameHasGestionnaire($username, $infos) {
    if (isset($infos['partages']) && in_array("$username:G", $infos['partages'])) {
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
    if (isset($infos['partages'])) {
      if (in_array("$username:G", $infos['partages']) || in_array("$username:C", $infos['partages'])) {
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
    $hostname = isset($infos['mailhost']) ? $infos['mailhost'][0] : null;
    
    return $hostname;
  }
  
  /**
   * Retourne le username a partir de l'objet LDAP
   *
   * @param array $infos Entry LDAP
   * @return string username
   */
  public function getUsername($infos) {
    return $infos['uid'][0];
  }
  
  /**
   * Retourne le fullname a partir de l'objet LDAP
   *
   * @param array $infos Entry LDAP
   * @return string fullname
   */
  public function getFullname($infos) {
    return $infos[$this->rc->config->get('default_object_name_ldap_field', 'cn')][0] ?: $infos['mail'][0];
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
}