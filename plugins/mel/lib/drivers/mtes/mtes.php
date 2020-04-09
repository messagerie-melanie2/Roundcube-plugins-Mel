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
   * @param boolean $fromCache [Optionnel] Récupérer l'utilisateur depuis le cache s'il existe ? Oui par défaut
   *
   * @return \LibMelanie\Api\Mce\User
   */
  public function getUser($username = null, $load = true, $fromCache = true) {
    if (!isset($username)) {
      $username = rcmail::get_instance()->user->get_username();
    }
    if (!$fromCache) {
      $user = new \LibMelanie\Api\Mel\User();
      $user->uid = $username;
      if ($load && !$user->load()) {
        $user = null;
      }
      return $user;
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
   * Retourne l'objet Group
   * Permet de retourner l'instance Group en fonction du driver
   * 
   * @param string $group_dn [Optionnel] DN du groupe a récupérer
   * @param boolean $load [Optionnel] Le groupe doit-il être chargé ? Oui par défaut
   * @param boolean $fromCache [Optionnel] Récupérer le groupe depuis le cache s'il existe ? Oui par défaut
   *
   * @return \LibMelanie\Api\Mce\Group
   */
  public function getGroup($group_dn = null, $load = true, $fromCache = true) {
    if (!$fromCache) {
      $group = new \LibMelanie\Api\Mel\Group();
      $group->dn = $group_dn;
      if ($load && !$group->load()) {
        $group = null;
      }
      return $group;
    }
    if (!isset(self::$_groups)) {
      self::$_groups = [];
    }
    if (!isset(self::$_groups[$group_dn])) {
      self::$_groups[$group_dn] = new \LibMelanie\Api\Mel\Group();
      self::$_groups[$group_dn]->dn = $group_dn;
      if ($load && !self::$_groups[$group_dn]->load()) {
        self::$_groups[$group_dn] = null;
      }
    }
    return self::$_groups[$group_dn];
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
    $user_infos = Ldap::GetUserInfos(rcmail::get_instance()->get_user_name());
    
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
        && class_exists('mel_doubleauth')
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
      $infos = Ldap::GetUserInfos(rcmail::get_instance()->get_user_name(), null, array(
          'mineqpassworddoitchanger'
      ), \LibMelanie\Config\Ldap::$AUTH_LDAP);
      if (!empty($infos['mineqpassworddoitchanger'][0])) {
        $title = $infos['mineqpassworddoitchanger'][0];
        $needs_to_change = true;
        $_SESSION['plugin.show_password_change'] = true;
      }
    }
    return $needs_to_change;
  }

  /**
   * Est-ce que le user est bien l'identifiant d'un groupe
   *
   * @param string $user Identifiant de l'objet group
   * @return boolean true si c'est un groupe, false sinon
   */
  public function userIsGroup($user) {
    return strpos($user, "mineqRDN=") === 0 && strpos($user, "ou=organisation,dc=equipement,dc=gouv,dc=fr") !== false;
  }

  /**
   * Méthode permettant de déclencher une commande unexpunge sur les serveurs de messagerie
   * Utilisé pour la restauration d'un dossier
   * 
   * @param string $mbox Identifiant de la boite concernée par la restauration
   * @param string $folder Dossier IMAP à restaurer
   * 
   * @return boolean true si la commande s'est correctement lancée
   */
  public function unexpunge($mbox, $folder, $hours) {
    $_user = $this->getUser($mbox, false);
    if ($_user->is_objectshare) {
      $_user = $_user->objectshare->mailbox;
    }
    else {
      $_user->load();
    }
    // Récupération de la configuration de la boite pour l'affichage
    $host = $this->getRoutage($mbox);
    // Ecriture du fichier unexpunge pour le serveur
    $server = explode('.', $host);
    $rep = '/var/pamela/unexpunge/' . $server[0];
    $dossier = str_replace('/', '^', $folder);

    if (isset($dossier)) {
      $nom = $rep . '/' . $mbox . '^' . $dossier;
    } else{
      $nom = $rep . '/' . $mbox;
    }

    $fic = fopen($nom, 'w');
    if (flock($fic, LOCK_EX)) {
      fputs($fic, 'recuperation:' . $hours);
      flock($fic, LOCK_UN);
    }
    else {
      return false;
    }
    fclose($fic);

    if (file_exists($nom)) {
      $res = chmod($nom, 0444);
    }
    else {
      return false;
    }
    return true;
  }
}