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
   * Label utilisé dans les boites partagées pour l'arborescence des dossiers
   *
   * @var string
   */
  protected $BALP_LABEL = null;
  
  /**
   * Dossier pour les brouillons
   *
   * @var string
   */
  protected $MBOX_DRAFT = null;
  
  /**
   * Dossier pour les éléments envoyés
   *
   * @var string
   */
  protected $MBOX_SENT = null;
  
  /**
   * Dossier pour les indésirables
   *
   * @var string
   */
  protected $MBOX_JUNK = null;
  
  /**
   * Dossier pour la corbeille
   *
   * @var string
   */
  protected $MBOX_TRASH = null;
  
  /**
   * Singleton
   *
   * @var driver_mel
   */
  private static $driver;

  /**
   * Singleton for the users
   * 
   * @var \LibMelanie\Api\Mce\User[]
   */
  protected static $_users;
  
  /**
   * Singleton for the groups
   * 
   * @var \LibMelanie\Api\Mce\Group[]
   */
  protected static $_groups;

  /**
   * Return the singleton instance
   *
   * @return driver_mel
   */
  public static function get_instance() {
    if (!isset(self::$driver)) {
      $drivername = strtolower(rcmail::get_instance()->config->get('mel_driver', 'mce'));
      require_once $drivername . '/' . $drivername . '.php';
      $drivername = $drivername . '_driver_mel';
      self::$driver = new $drivername();
    }
    return self::$driver;
  }

  /**
   * get_instance short
   *
   * @return driver_mel
   */
  public static function gi() {
    return self::get_instance();
  }
  
  /**
   * Retourne l'objet User associé à l'utilisateur courant
   * Permet de retourner l'instance User en fonction du driver
   * 
   * @param string $username [Optionnel] Identifiant de l'utilisateur a récupérer, sinon utilise l'utilisateur RC courant
   * @param boolean $load [Optionnel] L'utilisateur doit-il être chargé ? Oui par défaut
   * @param boolean $fromCache [Optionnel] Récupérer l'utilisateur depuis le cache s'il existe ? Oui par défaut
   *
   * @return \LibMelanie\Api\Mce\User
   */
  abstract public function getUser($username = null, $load = true, $fromCache = true);

  /**
   * Retourne l'objet Group
   * Permet de retourner l'instance Group en fonction du driver
   * 
   * @param string $group_dn [Optionnel] DN du groupe a récupérer
   * @param boolean $load [Optionnel] Le groupe doit-il être chargé ? Oui par défaut
   * @param boolean $fromCache [Optionnel] Récupérer le groupe depuis le cache s'il existe ? Oui par défaut
   *
   * @return \LibMelanie\Api\Mce\Group
   */
  abstract public function getGroup($group_dn = null, $load = true, $fromCache = true);
  
  /**
   * Retourne le MBOX par defaut pour une boite partagée donnée
   * Peut être INBOX ou autre chose si besoin
   *
   * @param string $balpname
   * @return string $mbox par defaut
   */
  abstract public function getMboxFromBalp($balpname);
  
  /**
   * Récupère et traite les infos de routage depuis l'objet LDAP 
   * pour retourner le hostname de connexion IMAP et/ou SMTP
   * 
   * @param array $infos Entry LDAP
   * @return string $hostname de routage, null si pas de routage trouvé
   */
  abstract public function getRoutage($infos);
  
  /**
   * Positionne des headers pour un message avant de l'envoyer
   *
   * @param array $headers Liste des headers a fournir au message
   * @return array $headers Retourne les headers completes
   */
  abstract public function setHeadersMessageBeforeSend($headers);
  
  /**
   * Est-ce que l'utilisateur courant a le droit d'accéder au stockage
   *
   * @return boolean true si le stockage doit être affiché, false sinon
   */
  abstract public function userHasAccessToStockage();
  
  /**
   * Est-ce que le mot de passe de l'utilisateur doit changer
   * Si c'est le cas la page de changement de mot de passe sera affichée après le login
   * Le titre de la page est en entrée/sortie
   *
   * @param string $title Titre de la fenetre de changement de mot de passe
   * @return boolean Le mot de passe doit changer
   */
  abstract public function isPasswordNeedsToChange(&$title);

  /**
   * Est-ce que le user est bien l'identifiant d'un groupe
   *
   * @param string $user Identifiant de l'objet group
   * @return boolean true si c'est un groupe, false sinon
   */
  abstract public function userIsGroup($user);

  /**
   * Méthode permettant de déclencher une commande unexpunge sur les serveurs de messagerie
   * Utilisé pour la restauration d'un dossier
   * 
   * @param string $mbox Identifiant de la boite concernée par la restauration
   * @param string $folder Dossier IMAP à restaurer
   */
  abstract public function unexpunge($mbox, $folder, $hours);

  /**
   * Converti un identifiant Roundcube en MCE
   * Permet de remplacer tous les caractères spéciaux 
   *     '.', '@', '%'
   * par '_-P-_', '_-A-_', '_-C-_'
   * 
   * @param string $rcId Identifiant au format Roundcube
   * 
   * @return string Identifiant au format MCE
   */
  public function rcToMceId($rcId) {
    return str_replace(['_-P-_', '_-A-_', '_-C-_'], ['.', '@', '%'], $rcId);
  }

  /**
   * Converti un identifiant MCE en Roundcube
   * Permet de remplacer tous les caractères spéciaux 
   *     '.', '@', '%'
   * par '_-P-_', '_-A-_', '_-C-_'
   * 
   * @param string $mceId Identifiant au format MCE
   * 
   * @return string Identifiant au format Roundcube
   */
  public function mceToRcId($mceId) {
    return str_replace(['.', '@', '%'], ['_-P-_', '_-A-_', '_-C-_'], $mceId);
  }
  
  /**
   * Retourne le label des balp dans l'arborescence de fichiers IMAP
   * Permet de redéfinir l'affichage des dossiers pour l'utilisateur
   *
   * @return string Le label ou null si pas nécessaire
   */
  public function getBalpLabel() {
    return $this->BALP_LABEL;
  }
  
  /**
   * Retourne le dossier pour les brouillons
   * Peut être null, le plugin mel prendra alors la configuration Roundcube
   *
   * @return string
   */
  public function getMboxDraft() {
    return $this->MBOX_DRAFT;
  }
  
  /**
   * Retourne le dossier pour les éléments envoyés
   * Peut être null, le plugin mel prendra alors la configuration Roundcube
   *
   * @return string
   */
  public function getMboxSent() {
    return $this->MBOX_SENT;
  }
  
  /**
   * Retourne le dossier pour les indésirables
   * Peut être null, le plugin mel prendra alors la configuration Roundcube
   *
   * @return string
   */
  public function getMboxJunk() {
    return $this->MBOX_JUNK;
  }
  
  /**
   * Retourne le dossier pour la corbeille
   * Peut être null, le plugin mel prendra alors la configuration Roundcube
   *
   * @return string
   */
  public function getMboxTrash() {
    return $this->MBOX_TRASH;
  }
}
