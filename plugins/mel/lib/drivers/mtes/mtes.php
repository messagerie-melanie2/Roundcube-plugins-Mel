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

include_once __DIR__ . '/../mce/mce.php';

class mtes_driver_mel extends mce_driver_mel {
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
   * Namespace for the objets
   */
  protected static $_objectsNS = "\\LibMelanie\\Api\\Mel\\";

  /**
   * Retourne l'objet Group
   * Permet de retourner l'instance Group en fonction du driver
   * 
   * @param string $group_dn [Optionnel] DN du groupe a récupérer
   * @param boolean $load [Optionnel] Le groupe doit-il être chargé ? Oui par défaut
   * @param boolean $fromCache [Optionnel] Récupérer le groupe depuis le cache s'il existe ? Oui par défaut
   *
   * @return \LibMelanie\Api\Defaut\Group
   */
  public function getGroup($group_dn = null, $load = true, $fromCache = true) {
    if (!$fromCache) {
      $group = $this->group();
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
      self::$_groups[$group_dn] = $this->group();
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
      $infos->load('server_host');
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
    $user = driver_mel::gi()->getUser();
    $user->load(array_keys($filter_ldap));
    
    if (isset($filter_ldap) && count($filter_ldap) > 0) {
      foreach ($filter_ldap as $key => $value) {
        if (!isset($user->$key) 
            || is_array($user->$key) && !in_array($value, $user->$key) 
            || is_string($user->$key) && $user->$key != $value) {
          $hasAccess = false;
        }
      }
    }
    // Parcourir les dn autorisés et valider la connexion
    foreach (rcmail::get_instance()->config->get('roundcube_nextcloud_ldap_allowed_dn', array()) as $allowed_dn) {
      if (strpos($user->dn, $allowed_dn) !== false) {
        $hasAccess = true;
      }
    }
    // Parcourir les dn interdits et refuser la connexion
    foreach (rcmail::get_instance()->config->get('roundcube_nextcloud_ldap_forbidden_dn', array()) as $forbidden_dn) {
      if (strpos($user->dn, $forbidden_dn) !== false) {
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
    // Récupération de la configuration de la boite pour l'affichage
    $host = $this->getRoutage($_user);
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

  /**
   * Méthode permettant de personnaliser l'affichage des contacts
   * 
   * @param array $args Tableau utilisé pour l'affichage du formulaire des contacts
   * 
   * @return array $args personnalisé
   */
  public function contact_form($args) {
    $args['head_fields']['category'] = ['category'];
    $args['head_fields']['type'] = ['type'];
    if (isset($args['form']['head'])) {
      $args['form']['head']['content']['category'] = array('type' => 'text');
      $args['form']['head']['content']['type'] = array('type' => 'text');
    }
    // N'ajouter les informations sur Internet que si la double auth est activé (sinon sur intranet)
    else if (mel::is_internal() || !class_exists('mel_doubleauth') || mel_doubleauth::is_double_auth_enable()) {
      $plugin = rcmail::get_instance()->plugins->get_plugin('mel_contacts');
      // Add members list
      $args['form']['members'] = [
          'name'    => $plugin->gettext('members'),
          'content' => [
              'members' => array('type' => 'text', 'label' => false),
          ],
      ];
      // Add owner list
      $args['form']['owner'] = [
        'name'    => $plugin->gettext('owners'),
        'content' => [
            'owner' => array('type' => 'html', 'label' => false, 'render_func' => [$this, 'renderOwner']),
        ],
      ];
      // Add share list
      $args['form']['share'] = [
        'name'    => $plugin->gettext('shares'),
        'content' => [
            'share' => array('type' => 'text', 'label' => false, 'render_func' => [$this, 'renderShare']),
        ],
      ];
      if (isset($args['record']['email'])) {
        // Search in LDAP
        $user = $this->user();
        $user->email = $args['record']['email'];
        $lists = $user->getListsIsMember('dn', 'email');
        if (is_array($lists)) {
          $args['record']['list'] = [];
          foreach ($lists as $list) {
            $args['record']['list'][] = [
              'dn' => $list->dn,
              'mail' => $list->email,
            ];
          }
          // Sort lists
          usort($args['record']['list'], function($a, $b) {
            return strcmp($a['mail'], $b['mail']);
          });
          // Add share list
          $args['form']['list'] = [
            'name'    => $plugin->gettext('lists'),
            'content' => [
                'list' => array('type' => 'text', 'label' => false, 'render_func' => [$this, 'renderList']),
            ],
          ];
        }
      }
      if (is_array($args['record']['share'])) {
        foreach ($args['record']['share'] as $k => $share) {
          if (strpos($share, ':G') === false) {
            unset($args['record']['share'][$k]);
          }
        }
      }
      else if (isset($args['record']['share']) && strpos($args['record']['share'], ':G') === false) {
        unset($args['record']['share']);
      }
      
      // Order share
      if (is_array($args['record']['share'])) {
        sort($args['record']['share']);
      }
      // Add room number
      if (isset($args['form']['contact'])) {
        $args['form']['contact']['content']['room'] = array('type' => 'text', 'label' => $plugin->gettext('room'));
      }
    }
    return $args;
  }

  /**
   * Render owner field
   */
  public function renderOwner($val, $col) {
    $user = $this->user();
    $user->dn = $val;
    if ($user->load(['fullname'])) {
      return html::a(['target' => '_blank', 'href' => rcmail::get_instance()->url(['task' => 'addressbook', 'action' => 'show', '_source' => 'amande', '_cid' => base64_encode($val)])], $user->fullname);
    }
    return null;
  }

  /**
   * Render share field
   */
  public function renderShare($val, $col) {
    $share = explode(':', $val, 2);
    $user = $this->getUser($share[0], false);
    if ($user->load(['dn', 'fullname'])) {
      return html::a(['target' => '_blank', 'href' => rcmail::get_instance()->url(['task' => 'addressbook', 'action' => 'show', '_source' => 'amande', '_cid' => base64_encode($user->dn)])], $user->fullname);
    }
    return null;
  }
  
  /**
   * Render list field
   */
  public function renderList($val, $col) {
    return html::a(['target' => '_blank', 'href' => rcmail::get_instance()->url(['task' => 'addressbook', 'action' => 'show', '_source' => 'amande', '_cid' => base64_encode($val['dn'])])], $val['mail']);
  }
}