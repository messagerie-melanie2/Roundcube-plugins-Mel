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
   * Namespace for the objets
   */
  protected static $_objectsNS = "\\LibMelanie\\Api\\Mce\\";

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
   * @return \LibMelanie\Api\Mce\User
   */
  public function &getUser($username = null, $load = true, $fromCache = true, $dn = null, $email = null, $itemName = null) {
    if (!isset($username) && !isset($dn) && !isset($email)) {
      $username = rcmail::get_instance()->user->get_username();
    }
    if (!$fromCache) {
      $user = $this->user([null, $itemName]);
      if (isset($username)) {   $user->uid = $username; }
      else if (isset($dn)) {    $user->dn = $dn; }
      else if (isset($email)) { $user->email = $email; }
      if ($load && !$user->load()) {
        $user = null;
      }
      return $user;
    }
    if (!isset(self::$_users)) {
      self::$_users = [];
    }
    $keyCache = $username . (isset($itemName) ? $itemName : '');
    if (!isset(self::$_users[$keyCache])) {
      $users = \mel::getCache('users');
      if (isset($users) && isset($users[$keyCache]) && $users[$keyCache]->issetObjectMelanie()) {
        self::$_users[$keyCache] = $users[$keyCache];
        self::$_users[$keyCache]->registerCache('mce_driver_mel', [$this, 'onUserChange']);
      }
      else {
        self::$_users[$keyCache] = $this->user([null, $itemName]);
        self::$_users[$keyCache]->uid = $username;
        if ($load && !self::$_users[$keyCache]->load()) {
          self::$_users[$keyCache] = null;
        }
        else {
          self::$_users[$keyCache]->registerCache('mce_driver_mel', [$this, 'onUserChange']);
        }
      }
    }
    return self::$_users[$keyCache];
  }

  /**
   * Enregistrer les donnés en cache quand un utilisateur change
   */
  public function onUserChange() {
    \mel::setCache('users', self::$_users);
  }

  /**
   * Retourne l'objet Group
   * Permet de retourner l'instance Group en fonction du driver
   * 
   * @param string $group_dn [Optionnel] DN du groupe a récupérer
   * @param boolean $load [Optionnel] Le groupe doit-il être chargé ? Oui par défaut
   * @param boolean $fromCache [Optionnel] Récupérer le groupe depuis le cache s'il existe ? Oui par défaut
   * @param string $itemName [Optionnel] Nom de l'objet associé dans la configuration LDAP
   *
   * @return \LibMelanie\Api\Mce\Group
   */
  public function getGroup($group_dn = null, $load = true, $fromCache = true, $itemName = null) {
    return null;
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
      if (is_array($infos)) {
        $hostname = isset($infos['mailhost']) ? $infos['mailhost'][0] : null;
      }
      else {
        $hostname = $infos->server_host;
      }
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
      $user = driver_mel::gi()->getUser();
      $user->load(array_keys($filter_ldap));

      foreach ($filter_ldap as $key => $value) {
        if (!isset($user->$key) 
            || is_array($user->$key) && !in_array($value, $user->$key) 
            || is_string($user->$key) && $user->$key != $value) {
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

  /**
   * Est-ce que le user est bien l'identifiant d'un groupe
   *
   * @param string $user Identifiant de l'objet group
   * @return boolean true si c'est un groupe, false sinon
   */
  public function userIsGroup($user) {
    return false;
  }

  /**
   * Méthode permettant de déclencher une commande unexpunge sur les serveurs de messagerie
   * Utilisé pour la restauration d'un dossier
   * 
   * @param string $mbox Identifiant de la boite concernée par la restauration
   * @param string $folder Dossier IMAP à restaurer
   */
  public function unexpunge($mbox, $folder, $hours) {
    return false;
  }

  /**
   * Méthode permettant de personnaliser l'affichage des contacts
   * 
   * @param array $args Tableau utilisé pour l'affichage du formulaire des contacts
   * 
   * @return array $args personnalisé
   */
  public function contact_form($args) {
    // Ajout du Type et de la Category d'un contact
    $args['head_fields']['category'] = ['category'];
    $args['head_fields']['type'] = ['type'];
    if (isset($args['form']['head'])) {
      $args['form']['head']['content']['category'] = array('type' => 'text');
      $args['form']['head']['content']['type'] = array('type' => 'text');
    }
    return $args;
  }

  /**
   * Méthode de création/modification d'un groupe associé à un workspace
   * 
   * @param string $workspace_id Identifiant du workspace
   * @param array $members Liste des membres du groupe
   * @param boolean $mdrive Est-ce que l'accès au stockage est activé ou non
   * 
   * @return boolean
   */
  public function workspace_group($workspace_id, $members = [], $mdrive = true) {
    return false;
  }
}