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
   * @var \LibMelanie\Api\Defaut\User[]
   */
  protected static $_users;
  
  /**
   * Singleton for the groups
   * 
   * @var \LibMelanie\Api\Defaut\Group[]
   */
  protected static $_groups;

  /**
   * Namespace for the objets
   */
  protected static $_objectsNS = "\\LibMelanie\\Api\\Mce\\";

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
   * Generate an object from the ORM with the right Namespace
   * 
   * @param string $objectName Object name (add sub namespace if needed, ex : Event, Users\Type)
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return staticClass object of the choosen type
   */
  protected function object($objectName, $params = []) {
    $class = new \ReflectionClass(static::$_objectsNS . $objectName);
    return $class->newInstanceArgs($params);
  }

  /**
   * Generate user object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\User
   */
  public function user($params = []) {
    return $this->object('User', $params);
  }

  /**
   * Generate userprefs object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\UserPrefs
   */
  public function userprefs($params = []) {
    return $this->object('UserPrefs', $params);
  }

  /**
   * Generate member object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Member
   */
  public function member($params = []) {
    return $this->object('Member', $params);
  }

  /**
   * Generate users_outofoffice object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Users\Outofoffice
   */
  public function users_outofoffice($params = []) {
    return $this->object('Users\\Outofoffice', $params);
  }

  /**
   * Generate users_type object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Users\Type
   */
  public function users_type($params = []) {
    return $this->object('Users\\Type', $params);
  }

  /**
   * Generate users_share object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Users\Share
   */
  public function users_share($params = []) {
    return $this->object('Users\\Share', $params);
  }

  /**
   * Generate group object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Group
   */
  public function group($params = []) {
    return $this->object('Group', $params);
  }

  /**
   * Generate share object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Share
   */
  public function share($params = []) {
    return $this->object('Share', $params);
  }

  /**
   * Generate calendar object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Calendar
   */
  public function calendar($params = []) {
    return $this->object('Calendar', $params);
  }

  /**
   * Generate event object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Event
   */
  public function event($params = []) {
    return $this->object('Event', $params);
  }

  /**
   * Generate event object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Exception
   */
  public function exception($params = []) {
    return $this->object('Exception', $params);
  }

  /**
   * Generate organizer object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Organizer
   */
  public function organizer($params = []) {
    return $this->object('Organizer', $params);
  }

  /**
   * Generate attendee object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Attendee
   */
  public function attendee($params = []) {
    return $this->object('Attendee', $params);
  }

  /**
   * Generate attachment object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Attachment
   */
  public function attachment($params = []) {
    return $this->object('Attachment', $params);
  }

  /**
   * Generate recurrence object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Recurrence
   */
  public function recurrence($params = []) {
    return $this->object('Recurrence', $params);
  }

  /**
   * Generate addressbook object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Addressbook
   */
  public function addressbook($params = []) {
    return $this->object('Addressbook', $params);
  }

  /**
   * Generate contact object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Contact
   */
  public function contact($params = []) {
    return $this->object('Contact', $params);
  }

  /**
   * Generate taskslist object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Taskslist
   */
  public function taskslist($params = []) {
    return $this->object('Taskslist', $params);
  }

  /**
   * Generate task object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Task
   */
  public function task($params = []) {
    return $this->object('Task', $params);
  }

  /**
   * Generate workspace object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Workspace
   */
  public function workspace($params = []) {
    return $this->object('Workspace', $params);
  }

  /**
   * Generate workspace share object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Workspaces\Share
   */
  public function workspace_share($params = []) {
    return $this->object('Workspaces\\Share', $params);
  }

  /**
   * Generate workspace hashtag object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Workspaces\Share
   */
  public function workspace_hashtag($params = []) {
    return $this->object('Workspaces\\Hashtag', $params);
  }

  /**
   * Generate news object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\News\News
   */
  public function news($params = []) {
    return $this->object('News\\News', $params);
  }

  /**
   * Generate rss object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\News\Rss
   */
  public function rss($params = []) {
    return $this->object('News\\Rss', $params);
  }

  /**
   * Generate newsshare object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\News\NewsShare
   */
  public function newsshare($params = []) {
    return $this->object('News\\NewsShare', $params);
  }

  /**
   * Generate notification object from the ORM with the right Namespace
   * 
   * @param array $params [Optionnal] parameters of the constructor
   * 
   * @return \LibMelanie\Api\Defaut\Notification
   */
  public function notification($params = []) {
    return $this->object('Notification', $params);
  }

  /**
   * Return the object share delimiter from ObjectShare ORM object
   * 
   * @return string DELIMITER
   */
  public function objectShareDelimiter() {
    return constant(static::$_objectsNS . 'ObjectShare::DELIMITER');
  }

  /**
   * Est-ce que le host est en ssl pour la connexion IMAP ?
   * 
   * @return boolean
   */
  public function isSsl($host = null) {
    $isSsl = false;
    $config = rcmail::get_instance()->config->get('default_host', null);
    if (isset($host) && is_array($config)) {
      if (in_array($host, $config)) {
        $isSsl = false;
      }
      else if (in_array('ssl://'.$host, $config)) {
        $isSsl = true;
      }
    }
    else if (is_array($config) && strpos($config[0], 'ssl://') === 0) {
      $isSsl = true;
    }
    else if (is_string($config) && strpos($config, 'ssl://') === 0) {
      $isSsl = true;
    }
    return $isSsl;
  }
  
  /**
   * Retourne l'objet User associé à l'utilisateur courant
   * Permet de retourner l'instance User en fonction du driver
   * 
   * @param string $username [Optionnel] Identifiant de l'utilisateur a récupérer, sinon utilise l'utilisateur RC courant
   * @param boolean $load [Optionnel] L'utilisateur doit-il être chargé ? Oui par défaut
   * @param boolean $fromCache [Optionnel] Récupérer l'utilisateur depuis le cache s'il existe ? Oui par défaut
   * @param string $dn [Optionnel] DN de l'utilisateur a récupérer
   * @param string $email [Optionnel] Email de l'utilisateur a récupérer
   * @param string $itemName [Optionnel] Nom de l'objet associé dans la configuration LDAP
   *
   * @return \LibMelanie\Api\Defaut\User
   */
  abstract public function &getUser($username = null, $load = true, $fromCache = true, $dn = null, $email = null, $itemName = null);

  /**
   * Retourne l'objet Group
   * Permet de retourner l'instance Group en fonction du driver
   * 
   * @param string $group_dn [Optionnel] DN du groupe a récupérer
   * @param boolean $load [Optionnel] Le groupe doit-il être chargé ? Oui par défaut
   * @param boolean $fromCache [Optionnel] Récupérer le groupe depuis le cache s'il existe ? Oui par défaut
   * @param string $itemName [Optionnel] Nom de l'objet associé dans la configuration LDAP
   *
   * @return \LibMelanie\Api\Defaut\Group
   */
  abstract public function getGroup($group_dn = null, $load = true, $fromCache = true, $itemName = null);
  
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
   * @param string $function Nom de la fonction pour personnaliser les retours
   * 
   * @return string $hostname de routage, null si pas de routage trouvé
   */
  abstract public function getRoutage($infos, $function = '');
  
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
   * Méthode permettant de personnaliser l'affichage des contacts
   * 
   * @param array $args Tableau utilisé pour l'affichage du formulaire des contacts
   * 
   * @return array $args personnalisé
   */
  abstract public function contact_form($args);

  /**
   * Méthode de création/modification d'un groupe associé à un workspace
   * 
   * @param string $workspace_id Identifiant du workspace
   * @param array $members Liste des membres du groupe
   * @param boolean $mdrive Est-ce que l'accès au stockage est activé ou non
   * 
   * @return boolean
   */
  abstract public function workspace_group($workspace_id, $members = [], $mdrive = true);

  /**
   * Méthode pour vérifier si groupe existe déjà 
   * 
   * @param string $workspace_id Identifiant du workspace
   * 
   * @return boolean
   */
  abstract public function if_group_exist($workspace_id);

  /**
   * Méthode de récupération d'un groupe associé à un workspace
   * 
   * @param string $workspace_id Identifiant du workspace
   * 
   * @return null|\LibMelanie\Api\Defaut\Group
   */
  abstract public function get_workspace_group($workspace_id);

  /**
   * Création d'un utilisateur externe s'il n'est pas trouvé dans l'annuaire 
   * et que son domaine n'est pas un domaine interne
   * 
   * @param string $email Email de l'utilisateur externe
   * @param \LibMelanie\Api\Defaut\Workspace $workspace Espace de travail
   * 
   * @return boolean true si l'utilisateur a été créé, false sinon
   */
  abstract public function create_external_user($email, $workspace);

  /**
   * Lister les localités disponibles pour les ressources
   * 
   * @return LibMelanie\Api\Defaut\Resources\Locality[] Liste des localités 
   */
  abstract public function resources_localities();

  /**
   * Lister les ressources par uid ou email
   * 
   * @param string[] $uids Liste des uids des ressources
   * @param string[] $emails Liste des emails des ressources
   * 
   * @return LibMelanie\Api\Defaut\Resource[] Liste des ressources
   */
  abstract public function resources($uids = null, $emails = null);

  /**
   * Lister les ressources Flex Office disponibles pour une localité
   * 
   * @param string $locality_uid Identifiant de la localité
   * 
   * @return LibMelanie\Api\Defaut\Resource[] Liste des ressources Flex Office
   */
  abstract public function resources_flex_office($locality_uid);

  /**
   * Lister les ressources Salle disponibles pour une localité
   * 
   * @param string $locality_uid Identifiant de la localité
   * 
   * @return LibMelanie\Api\Defaut\Resource[] Liste des ressources Flex Office
   */
  abstract public function resources_salle($locality_uid);

  /**
   * Lister les ressources Véhicule disponibles pour une localité
   * 
   * @param string $locality_uid Identifiant de la localité
   * 
   * @return LibMelanie\Api\Defaut\Resource[] Liste des ressources Flex Office
   */
  abstract public function resources_vehicule($locality_uid);

  /**
   * Lister les ressources Matériel disponibles pour une localité
   * 
   * @param string $locality_uid Identifiant de la localité
   * 
   * @return LibMelanie\Api\Defaut\Resource[] Liste des ressources Flex Office
   */
  abstract public function resources_materiel($locality_uid);

  /**
   * Génération d'un uuid au format v4
   * 
   * @return string $uuid
   */
  protected function uuidv4() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
  
      // 32 bits for "time_low"
      mt_rand(0, 0xffff), mt_rand(0, 0xffff),
  
      // 16 bits for "time_mid"
      mt_rand(0, 0xffff),
  
      // 16 bits for "time_hi_and_version",
      // four most significant bits holds version number 4
      mt_rand(0, 0x0fff) | 0x4000,
  
      // 16 bits, 8 bits for "clk_seq_hi_res",
      // 8 bits for "clk_seq_low",
      // two most significant bits holds zero and one for variant DCE1.1
      mt_rand(0, 0x3fff) | 0x8000,
  
      // 48 bits for "node"
      mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
  }

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
   * Retourne l'identité associé au dossier IMAP (pour les BALP par exemple)
   * 
   * @param string $mbox
   * @return array Identité
   */
  public function getIdentityFromMbox($mbox) {
    if (strpos($mbox, $this->BALP_LABEL) === 0) {
      $delimiter = rcmail::get_instance()->get_storage()->delimiter;
      foreach (rcmail::get_instance()->user->list_identities() as $id) {
        $uid = $id['uid'];
        if (strpos($uid, $this->objectShareDelimiter()) !== false) {
          $uid = explode($this->objectShareDelimiter(), $uid, 2)[1];
        }
        if (strpos($mbox, $this->BALP_LABEL . $delimiter . $uid) === 0) {
          $identity = $id;
          break;
        }
      }
    }
    if (!isset($identity)) {
      $identity = rcmail::get_instance()->user->list_emails(true);
    }
    return $identity;
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

  /**
   * Retourne
   * user_object_share === uid <= identifiant de la bal (donné à getUser(): peut donc etre le radical du mail (mte) ou le mail entier (gn)
   * user_host === host imap <= adresse serveur imap de la bal
   * user_bal === uid de la balp associé (idem supra, peut etre le radical du mail ou ce dernier en entier)
   *
   *
   * @param string $mail Mail à traiter peut être un objet de partage ou non, ou un mailroutingaddress
   * @return array(($user_objet_share, $user_host, $user_bal)
   */
  public function getShareUserBalpHostFromMail($mail) {
    $user_objet_share=$user_host=$user_bal=null;
    // Split sur @ pour les comptes de boites partagées <username>@<hostname>
    $inf = explode('@', $mail, 2);
    // Le username est encodé pour éviter les problèmes avec @
    $user_objet_share = $user_bal = $inf[0]?urldecode($inf[0]):null;
    // Récupération du host
    $user_host = $inf[1] ?: null;
    return [$user_objet_share, $user_host, $user_bal];
  }


  /**
   * Retourne les valeurs depuis la session
   * user_object_share === uid <= identifiant de la bal (donné à getUser(): peut donc etre le radical du mail (mte) ou le mail entier (gn)
   * user_host === host imap <= adresse serveur imap de la bal
   * user_bal === uid de la balp associé (idem supra, peut etre le radical du mail ou ce dernier en entier)
   *
   * @return array ($user_objet_share, $user_host, $user_bal)
   */
  public function getShareUserBalpHostFromSession() {
    $user_objet_share=$user_host=$user_bal=null;
    $rc = rcmail::get_instance();
    $user_objet_share = $user_bal = $rc->user->get_username('local');
    $user_host = $rc->user->get_username('host');
    return [$user_objet_share, $user_host, $user_bal];
  }

  /**
   *  Récupère un couple login/password pour jouer une authentification externe de type basic
   * @return array [login,password] for authentification type basic
   */
  public function getBasicAuth() {
    $rc = rcmail::get_instance();
    return [$rc->user->get_username(),$rc->get_user_password()];
  }
}
