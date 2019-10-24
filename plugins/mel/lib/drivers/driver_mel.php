<?php
/**
 * Plugin Mél
 *
 * Moteur de drivers pour le plugin mel
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

abstract class driver_mel {
  /**
   * Configuration du séparateur pour les boites partagées
   *
   * @var string
   */
  const BAL_SEPARATOR = null;
  
  /**
   * Label utilisé dans les boites partagées pour l'arborescence des dossiers
   *
   * @var string
   */
  const BALP_LABEL = null;
  
  /**
   * Dossier pour les brouillons
   *
   * @var string
   */
  const MBOX_DRAFT = null;
  
  /**
   * Dossier pour les éléments envoyés
   *
   * @var string
   */
  const MBOX_SENT = null;
  
  /**
   * Dossier pour les indésirables
   *
   * @var string
   */
  const MBOX_JUNK = null;
  
  /**
   * Dossier pour la corbeille
   *
   * @var string
   */
  const MBOX_TRASH = null;
  
  /**
   * Singleton
   *
   * @var driver_mel
   */
  private static $driver;
  
  /**
   * Return the singleton instance
   *
   * @return driver_mel
   */
  public static function get_instance() {
    if (!isset(self::$driver)) {
      $drivername = strtolower(rcmail::get_instance()->config->get('mel_driver', 'mce_driver_mel'));
      require_once $drivername . '/' . $drivername . '.php';
      self::$driver = new $drivername();
    }
    return self::$driver;
  }
  
  /**
   * Retourne si le username est une boite partagée ou non
   *
   * @param string $username
   * @return boolean
   */
  abstract public function isBalp($username);
  
  /**
   * Retourne le username et le balpname à partir d'un username complet
   * balpname sera null si username n'est pas un objet de partage
   * username sera nettoyé de la boite partagée si username est un objet de partage
   *
   * @param string $username Username à traiter peut être un objet de partage ou non
   * @return list($username, $balpname) $username traité, $balpname si objet de partage ou null sinon
   */
  abstract public function getBalpnameFromUsername($username);
  
  /**
   * Est-ce que le username a des droits gestionnaire sur l'objet LDAP
   *
   * @param string $username
   * @param array $infos Entry LDAP
   * @return boolean
   */
  abstract public function isUsernameHasGestionnaire($username, $infos);
  
  /**
   * Est-ce que le username a des droits emission sur l'objet LDAP
   *
   * @param string $username
   * @param array $infos Entry LDAP
   * @return boolean
   */
  abstract public function isUsernameHasEmission($username, $infos);
  
  /**
   * Defini si l'accés internet est activé pour l'objet LDAP
   *
   * @param array $infos Entry LDAP
   * @return boolean true si l'accés internet est activé, false sinon
   */
  abstract public function isInternetAccessEnable($infos);
  
  /**
   * Récupère et traite les infos de routage depuis l'objet LDAP 
   * pour retourner le hostname de connexion IMAP et/ou SMTP
   * 
   * @param array $infos Entry LDAP
   * @return string $hostname de routage, null si pas de routage trouvé
   */
  abstract public function getRoutage($infos);
  
  /**
   * Retourne le username a partir de l'objet LDAP
   *
   * @param array $infos Entry LDAP
   * @return string username
   */
  abstract public function getUsername($infos);
  
  /**
   * Retourne le fullname a partir de l'objet LDAP
   *
   * @param array $infos Entry LDAP
   * @return string fullname
   */
  abstract public function getFullname($infos);
  
  /**
   * Positionne des headers pour un message avant de l'envoyer
   *
   * @param array $headers Liste des headers a fournir au message
   * @return array $headers Retourne les headers completes
   */
  abstract public function setHeadersMessageBeforeSend($headers);
  
  /**
   * Retourne le label des balp dans l'arborescence de fichiers IMAP
   * Permet de redéfinir l'affichage des dossiers pour l'utilisateur
   *
   * @return string Le label ou null si pas nécessaire
   */
  public function getBalpLabel() {
    return self::BALP_LABEL;
  }
  
  /**
   * Retourne le dossier pour les brouillons
   * Peut être null, le plugin mel prendra alors la configuration Roundcube
   *
   * @return string
   */
  public function getMboxDraft() {
    return self::MBOX_DRAFT;
  }
  
  /**
   * Retourne le dossier pour les éléments envoyés
   * Peut être null, le plugin mel prendra alors la configuration Roundcube
   *
   * @return string
   */
  public function getMboxSent() {
    return self::MBOX_SENT;
  }
  
  /**
   * Retourne le dossier pour les indésirables
   * Peut être null, le plugin mel prendra alors la configuration Roundcube
   *
   * @return string
   */
  public function getMboxJunk() {
    return self::MBOX_JUNK;
  }
  
  /**
   * Retourne le dossier pour la corbeille
   * Peut être null, le plugin mel prendra alors la configuration Roundcube
   *
   * @return string
   */
  public function getMboxTrash() {
    return self::MBOX_TRASH;
  }
}
