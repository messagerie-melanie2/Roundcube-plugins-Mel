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

class mtes_driver_mel extends mce_driver_mel
{
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
   * Dossier pour l'utilisation des fichiers pour le unexpunge
   */
  protected static $_unexpungeFolder = '/var/pamela/unexpunge/';

  /**
   * Liste des valeurs pour un groupe de workspace
   */
  const WS_GROUP = [
    'rdn'               => '%%workspace%%',
    'dn'                => 'mineqRDN=%%workspace%%,ou=Groupes,ou=BNUM,ou=applications,ou=ressources,dc=equipement,dc=gouv,dc=fr',
    'service'           => 'BNUM/Groupes',
    'email'             => 'edt.%%workspace%%@%%domain%%',
    'reponse'           => 'edt.%%workspace%%@%%domain%%',
    'name'              => 'Liste edt %%workspace%%',
    'lastname'          => '%%workspace%%',
    'fullname'          => 'Liste edt %%workspace%% - BNUM/Groupes',
    'server_routage'    => 'edt.%%workspace%%%%%domain%%@tous.melanie2.i2',
    'restrictions'      => '00+ LDAP:(&(mail=edt.%%workspace%%@%%domain%%)(mineqMelMembres=%s))',
    'gestion'           => 'AUTO/BNUM',
  ];

  /**
   * Liste des valeurs pour un utilisateur externe
   */
  const EXTERNAL_USER = [
    'dn'                => 'uid=%%uid%%,ou=Utilisateurs,ou=BNUM,ou=applications,ou=ressources,dc=equipement,dc=gouv,dc=fr',
    'fullname'          => '%%lastname%% %%firstname%% - BNUM/Externes',
    'service'           => 'BNUM/Externes',
    'name'              => '%%lastname%% %%firstname%%',
    'lastname'          => '%%lastname%%',
    'firstname'         => '%%firstname%%',
    'uid'               => '%%uid%%',
  ];

  /**
   * Liste des domaines internes pour ne pas créer d'utilisateur externe
   */
  const INTERNAL_DOMAINS = [
    'developpement-durable.gouv.fr',
    'i-carre.net',
    'equipement.gouv.fr',
    'agriculture.gouv.fr',
    'educagri.fr',
  ];

  /**
   * Domaine par défaut à utiliser dans les groupes
   * 
   */
  const GROUP_DEFAULT_DOMAIN = 'i-carre.net';

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
  public function getGroup($group_dn = null, $load = true, $fromCache = true, $itemName = null)
  {
    if (!$fromCache) {
      $group = $this->group([null, $itemName]);
      $group->dn = $group_dn;
      if ($load && !$group->load()) {
        $group = null;
      }
      return $group;
    }
    if (!isset(self::$_groups)) {
      self::$_groups = [];
    }
    $keyCache = $group_dn . (isset($itemName) ? $itemName : '');
    if (!isset(self::$_groups[$keyCache])) {
      self::$_groups[$keyCache] = $this->group([null, $itemName]);
      self::$_groups[$keyCache]->dn = $group_dn;
      if ($load && !self::$_groups[$keyCache]->load()) {
        self::$_groups[$keyCache] = null;
      }
    }
    return self::$_groups[$keyCache];
  }

  /**
   * Retourne le MBOX par defaut pour une boite partagée donnée
   * Peut être INBOX ou autre chose si besoin
   * 
   * @param string $balpname
   * @return string $mbox par defaut
   */
  public function getMboxFromBalp($balpname)
  {
    if (isset($balpname)) {
      $delimiter = rcmail::get_instance()->get_storage()->delimiter;
      return $this->BALP_LABEL . $delimiter . $balpname;
    } else {
      return 'INBOX';
    }
  }

  /**
   * Récupère et traite les infos de routage depuis l'objet LDAP 
   * pour retourner le hostname de connexion IMAP et/ou SMTP
   * 
   * @param array $infos Entry LDAP
   * @param string $function Nom de la fonction pour personnaliser les retours
   * 
   * @return string $hostname de routage, null si pas de routage trouvé
   */
  public function getRoutage($infos, $function = '')
  {
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
    } else {
      if ($infos->is_objectshare) {
        $infos = $infos->objectshare->mailbox;
      }
      $infos->load(['server_host']);
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
  public function setHeadersMessageBeforeSend($headers)
  {
    // Positionner le HEADER pour indiquer l'origine du message (internet, intranet)
    $headers['Received'] = 'from butineur (par ' . $_SERVER["HTTP_X_MINEQPROVENANCE"] . ' [' . $_SERVER["HTTP_X_FORWARDED_FOR"] . ']) by ' . $_SERVER["HTTP_X_FORWARDED_SERVER"] . ' [' . $_SERVER["SERVER_ADDR"] . ']';

    return $headers;
  }

  /**
   * Est-ce que l'utilisateur courant a le droit d'accéder au stockage
   * 
   * @return boolean true si le stockage doit être affiché, false sinon
   */
  public function userHasAccessToStockage()
  {
    // Gestion du filtre LDAP
    $filter_ldap = rcmail::get_instance()->config->get('roundcube_nextcloud_filter_ldap', array());
    $hasAccess = false;
    $user = driver_mel::gi()->getUser();
    $user->load(array_keys($filter_ldap));

    if (isset($filter_ldap) && count($filter_ldap) > 0) {
      foreach ($filter_ldap as $key => $value) {
        if (
          isset($user->$key)
          && (is_array($user->$key) && in_array($value, $user->$key)
            || is_string($user->$key) && $user->$key == $value)
        ) {
          // Le filtre est valide, l'utilisateur a accès au stockage
          $hasAccess = true;
        }
      }
    }
    // Si le filtre n'est pas trouvé, on check par dn
    if (!$hasAccess) {
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
    }
    // Si on est sur Internet, vérifier que l'utilisateur a la double auth
    // ou une auth Cerbère suffisante (carte agent, double auth, etc)
    if (
      $hasAccess
      && !mel::is_auth_strong()
      && class_exists('mel_doubleauth')
      && !mel_doubleauth::is_double_auth_enable()
      && !mel_doubleauth::date_grace_enabled()
    ) {
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
  public function isPasswordNeedsToChange(&$title)
  {
    if (!isset($_SESSION['plugin.show_password_change'])) {
      // Récupération des informations sur l'utilisateur courant
      $infos = Ldap::GetUserInfos(rcmail::get_instance()->get_user_name(), null, array(
        'mineqpassworddoitchanger'
      ), \LibMelanie\Config\Ldap::$AUTH_LDAP);
      if (!empty($infos['mineqpassworddoitchanger'][0])) {
        $title = $infos['mineqpassworddoitchanger'][0];
        $_SESSION['plugin.show_password_change'] = true;
        $_SESSION['plugin.password_change_title'] = $title;
      } else {
        $_SESSION['plugin.show_password_change'] = false;
        unset($_SESSION['plugin.password_change_title']);
      }
    } else if ($_SESSION['plugin.show_password_change'] && isset($_SESSION['plugin.password_change_title'])) {
      $title = $_SESSION['plugin.password_change_title'];
    }
    return $_SESSION['plugin.show_password_change'];
  }

  /**
   * Est-ce que le user est bien l'identifiant d'un groupe
   *
   * @param string $user Identifiant de l'objet group
   * @return boolean true si c'est un groupe, false sinon
   */
  public function userIsGroup($user)
  {
    return strpos($user, "mineqRDN=") === 0 && strpos($user, "ou=organisation,dc=equipement,dc=gouv,dc=fr") !== false;
  }
  /**
   * Méthode permettant de personnaliser l'affichage des contacts
   * 
   * @param array $args Tableau utilisé pour l'affichage du formulaire des contacts
   * 
   * @return array $args personnalisé
   */
  public function contact_form($args)
  {
    $args['head_fields']['category'] = ['category'];
    $args['head_fields']['type'] = ['type'];
    if (isset($args['form']['head'])) {
      $args['form']['head']['content']['category'] = array('type' => 'text');
      $args['form']['head']['content']['type'] = array('type' => 'text');
    }
    // N'ajouter les informations sur Internet que si la double auth est activé (sinon sur intranet)
    else if (mel::is_internal() 
        || mel::is_auth_strong()
        || !class_exists('mel_doubleauth') 
        || mel_doubleauth::is_double_auth_enable()) {
      $plugin = rcmail::get_instance()->plugins->get_plugin('mel_contacts');
      // Add fonction
      $args['form']['function'] = [
        'name'    => $plugin->gettext('function'),
        'content' => [
          'jobtitle'      => array('type' => 'text', 'label' => $plugin->gettext('jobtitle')),
          'jobs'          => array('type' => 'text', 'label' => $plugin->gettext('jobs')),
          'assignments'   => array('type' => 'text', 'label' => $plugin->gettext('assignments')),
        ],
      ];
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
        $lists = [0];
        if (is_array($lists)) {
          $args['record']['list'] = [];
          foreach ($lists as $list) {
            $args['record']['list'][] = [
              'dn' => $list->dn,
              'mail' => $list->email,
            ];
          }
          // Sort lists
          usort($args['record']['list'], function ($a, $b) {
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
      } else if (isset($args['record']['share']) && strpos($args['record']['share'], ':G') === false) {
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
    if (!isset($args['form']['head'])) {
      $plugin = rcmail::get_instance()->plugins->get_plugin('mel_contacts');
      // Gestion de l'url sympa
      if (isset($args['record']['info']) && $args['record']['info'] == 'GESTION: auto/sympa') {
        $args['form']['sympa'] = [
          'name'    => $plugin->gettext('sympaUrl'),
          'content' => [
            'sympa' => array('type' => 'html', 'label' => false, 'render_func' => [$this, 'renderSympa']),
          ],
        ];
        $conf = rcmail::get_instance()->config->get('contacts_robots_sympa', null);
        if (isset($conf)) {
          $split = explode('@', $args['record']['email'], 2);
          $url = isset($conf[$split[1]]) ? $conf[$split[1]] : $conf['default'];
          $provenance = mel::is_internal() ? 'intranet' : 'internet';
          if (!isset($url['provenance']) || $url['provenance'] == $provenance) {
            $split[1] = substr($split[1], 0, strpos($split[1], '.'));
            $args['record']['sympa'] = str_replace(['%l', '%h'], $split, $url['href']);
          }
        }
      }
      if (isset($args['form']['contact']['content']['phone']) && (rcube_utils::get_input_value('_action', rcube_utils::INPUT_GET) == "show" || is_null(rcube_utils::get_input_value('_action', rcube_utils::INPUT_GET)))) {
        $args['form']['contact']['content']['phone']['render_func'] =  [$this, 'renderPhone'];
      }
    }
    return $args;
  }

  /**
   * Render owner field
   */
  public function renderOwner($val, $col)
  {
    $user = $this->user();
    $user->dn = $val;
    if ($user->load(['fullname'])) {
      return html::a(['target' => '_blank', 'href' => rcmail::get_instance()->url(['task' => 'addressbook', 'action' => 'show', '_source' => 'amande', '_cid' => base64_encode($val)])], $user->fullname);
    }
    return null;
  }

  /**
   * Render sympa field
   */
  public function renderSympa($val, $col)
  {
    return html::label([], rcmail::get_instance()->plugins->get_plugin('mel_contacts')->gettext('sympaUrllabel'))
      . html::br()
      . html::a(['target' => '_blank', 'href' => $val], $val);
  }

  /**
   * Render share field
   */
  public function renderShare($val, $col)
  {
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
  public function renderList($val, $col)
  {
    return html::a(['target' => '_blank', 'href' => rcmail::get_instance()->url(['task' => 'addressbook', 'action' => 'show', '_source' => 'amande', '_cid' => base64_encode($val['dn'])])], $val['mail']);
  }

  /**
   * Render phone field with href 
   */
  public function renderPhone($val, $col)
  {
    return html::a(
      [
        'href'    => 'tel:' . $val
      ],
      rcube::Q($val)
    );
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
  public function workspace_group($workspace_id, $members = [], $mdrive = true)
  {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[driver_mel] mtes::workspace_group($workspace_id, $mdrive)");
    $group = $this->group([null, 'webmail.workspace']);

    // Calculer le domain
    $domain = substr(strstr($this->getUser()->email, '@'), 1);

    // On test si le groupe existe déjà
    $group->dn = str_replace(['%%workspace%%', '%%domain%%'], [$workspace_id, $domain], self::WS_GROUP['dn']);
    if (!$group->load(['fullname', 'email', 'members', 'members_email', 'mdrive'])) {
      // Ajout des attributs
      foreach (self::WS_GROUP as $key => $value) {
        $group->$key = str_replace(['%%workspace%%', '%%domain%%'], [$workspace_id, self::GROUP_DEFAULT_DOMAIN], $value);
      }
      // Attributs particuliers
      $email_list = [$group->email];
      $group->unique_identifier = $this->uuidv4();

      // MANTIS 0006539: Règles sur les adresses mail des listes associées aux espaces de travail compatibles avec les domaines départementaux
      if ($domain != self::GROUP_DEFAULT_DOMAIN) {
        $group->reponse = str_replace(['%%workspace%%', '%%domain%%'], [$workspace_id, $domain], self::WS_GROUP['reponse']);
        $group->email = str_replace(['%%workspace%%', '%%domain%%'], [$workspace_id, $domain], self::WS_GROUP['email']);
        $email_list[] = $group->email;
      }

      // Récupération des emails
      $group->email_list = $email_list;
    }

    // Gestion du MDrive
    $group->mdrive = $mdrive;

    // Gérer les membres
    $membersList = [];
    $membersEmail = [];
    foreach ($members as $member) {
      if (isset($member)) {
        $user = $this->getUser(null, true, false, null, $member);
        if (isset($user)) {
          $membersList[] = $user;
        }
        $membersEmail[] = $member;
      }
    }
    $group->members_email = $membersEmail;
    $group->members = $membersList;

    // Sauvegarde
    $ret = $group->save();
    // Gestion des erreurs
    if (is_null($ret)) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[driver_mel] mtes::workspace_group($workspace_id) save error : " . \LibMelanie\Ldap\Ldap::GetInstance(\LibMelanie\Config\Ldap::$MASTER_LDAP)->getError());
    }
    return !is_null($ret);
  }

  /**
   * Méthode pour vérifier si groupe existe déjà 
   * 
   * @param string $workspace_id Identifiant du workspace
   * 
   * @return boolean
   */
  public function if_group_exist($workspace_id)
  {
    $group = $this->group([null, 'webmail.workspace']);

    // On test si le groupe existe déjà
    $group->dn = str_replace(['%%workspace%%'], [$workspace_id], self::WS_GROUP['dn']);

    return $group->load();
  }


  /**
   * Méthode de récupération d'un groupe associé à un workspace
   * 
   * @param string $workspace_id Identifiant du workspace
   * 
   * @return null|\LibMelanie\Api\Defaut\Group
   */
  public function get_workspace_group($workspace_id)
  {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[driver_mel] mtes::get_workspace_group($workspace_id)");
    $group = $this->group([null, 'webmail.workspace']);

    // Calculer le domain
    $domain = substr(strstr($this->getUser()->email, '@'), 1);

    // On test si le groupe existe
    $group->dn = str_replace(['%%workspace%%', '%%domain%%'], [$workspace_id, $domain], self::WS_GROUP['dn']);
    if ($group->load(['fullname', 'email', 'members', 'members_email', 'mdrive'])) {
      return $group;
    } else {
      return null;
    }
  }

  /**
   * Création d'un utilisateur externe s'il n'est pas trouvé dans l'annuaire 
   * et que son domaine n'est pas un domaine interne
   * 
   * @param string $email Email de l'utilisateur externe
   * @param \LibMelanie\Api\Defaut\Workspace $workspace Espace de travail
   * 
   * @return boolean true si l'utilisateur a été créé, false sinon
   */
  public function create_external_user($email, $workspace) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[driver_mel] mtes::create_external_user($email)");

    if (!$this->valid_external_domain($email)) {
      // Si le domaine est interne on ne fait rien
      mel_logs::get_instance()->log(mel_logs::ERROR, "[driver_mel] mtes::create_external_user($email) : Domaine interne");
      return false;
    }

    $user = $this->user([null, 'webmail.external.users']);

    $user->email = $email;
    $user->email_list = [$email];

    if ($user->load()) {
      // Si l'utilisateur existe on ne fait rien
      mel_logs::get_instance()->log(mel_logs::ERROR, "[driver_mel] mtes::create_external_user($email) : Utilisateur déjà existant");
      return false;
    }
    else {
      // Calcul des nom/prénom à partir de l'adresse email (à confirmer plus tard)
      list($firstname, $lastname) = array_values($this->get_names_from_email($email));

      // Calcul de l'uid à partir de l'adresse email
      $uid = $this->get_uid_from_email($email);

      // Ajout des attributs
      foreach (self::EXTERNAL_USER as $key => $value) {
        $user->$key = str_replace(
          ['%%firstname%%', '%%lastname%%', '%%email%%', '%%uid%%'], 
          [$firstname, $lastname, $email, $uid], $value);
      }

      // UUIDv4
      $user->uuid = $this->uuidv4();

      $ret = $user->save();

      if (!is_null($ret)) {
        // L'utilisateur externe a bien été créé
        // Générer une clé unique pour l'utilisateur
        $key = $this->getRandomKey();
        if ($user->saveDefaultPreference('external_key', $key) && $user->saveDefaultPreference('external_key_validity', time())) {
          // La clé a bien été enregistrée
          mel_logs::get_instance()->log(mel_logs::INFO, "[driver_mel] mtes::create_external_user($email) : Utilisateur externe créé avec succès");

          // TODO: Envoyer un mail de bienvenue à l'utilisateur
          mel_helper::include_mail_body();

          $hash = [
            'email' => $email,
            'key'   => $key,
          ];

          $rcmail = rcmail::get_instance();

          $bodymail = new MailBody('mel.email_external_welcome', [
            'user.url'              => $this->url('public/welcome/?_h=' . base64_encode(serialize($hash))),
            'user.name'             => driver_mel::gi()->getUser()->name,
            'user.email'            => driver_mel::gi()->getUser()->email,
            'wsp.url'               => $rcmail->url(['task' => 'workspace', 'action' => 'workspace', '_uid' => $workspace->uid], true, true),
            'wsp.name'              => $workspace->title,
            'wsp.creator'           => driver_mel::gi()->getUser($workspace->creator)->name,
            'wsp.last_action.text'  => $workspace->created === $workspace->modified ? 'Crée le' : 'Mise à jour',
            'wsp.last_action.date'  => DateTime::createFromFormat('Y-m-d H:i:s', $workspace->modified)->format('d/m/Y'),
            'bnum.base_url'         => 'http://mtes.fr/2',
            'documentation.url'     => 'https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/espaces-de-travail',
            'logobnum'              => MailBody::load_image(__DIR__ . '/../../../../mel_workspace/skins/elastic/pictures/logobnum.png', 'png'),
          ]);

          return \LibMelanie\Mail\Mail::Send('bnum', $email, $bodymail->subject(), $bodymail->body());
        }
        else {
          // Erreur lors de l'enregistrement de la clé
          mel_logs::get_instance()->log(mel_logs::ERROR, "[driver_mel] mtes::create_external_user($email) : Erreur lors de l'enregistrement de la clé");
          $user->delete();
          return false;
        }
      }
      return !is_null($ret);
    }
  }

  /**
   * Récupérer l'url complète à partir de l'url relative
   * 
   * @param string $url Url relative
   * @param boolean $absolute Est-ce que l'url doit être absolue
   * 
   * @return string Url complète
   */
  protected function url($url, $absolute = true) {
    $base_path = '';
    if (!empty($_SERVER['REDIRECT_SCRIPT_URL'])) {
        $base_path = $_SERVER['REDIRECT_SCRIPT_URL'];
    }
    else if (!empty($_SERVER['SCRIPT_NAME'])) {
        $base_path = $_SERVER['SCRIPT_NAME'];
    }
    $base_path = preg_replace('![^/]+$!', '', $base_path);

    // add base path to this Roundcube installation
    $prefix = $base_path ?: '/';

    // prepend protocol://hostname:port
    if ($absolute) {
      $prefix = rcube_utils::resolve_url($prefix);
    }

    return $prefix . $url;
  }

  /**
   * Générer un UUID v4
   * 
   * @return string UUID généré
   */
  protected function uuidv4() {
    $data = random_bytes(16);
  
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // set version to 0100
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // set bits 6-7 to 10
      
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
  }

  /**
   * Générer une clé unique pour un utilisateur externe
   * 
   * @return string Clé générée
   */
  protected function getRandomKey() {
    return bin2hex(random_bytes(32));
  }

  /**
   * Valider si le domaine de l'email est externe
   * 
   * @param string $email Email à valider
   * 
   * @return boolean true si le domaine est externe, false sinon
   */
  protected function valid_external_domain($email) {
    foreach (self::INTERNAL_DOMAINS as $domain) {
      if (strpos($email, "@$domain") !== false) {
        // C'est un domaine interne
        return false;
      }
    }
    // C'est un domaine externe
    return true;
  }

  /**
   * Récupérer les noms à partir de l'email
   * 
   * @param string $email Email à traiter
   * 
   * @return array Tableau associatif avec les clés 'firstname' et 'lastname'
   */
  protected function get_names_from_email($email) {
    $names = explode('@', strtolower($email), 2);
    if (strpos($names[0], '.') === false) {
      $lastname = strtoupper($names[0]);
      $fistname = ' ';
    }
    else {
      $names = explode('.', $names[0]);
      $lastname = strtoupper($names[1]);
      $fistname = ucfirst($names[0]);
    }
    
    return [
      'firstname' => $fistname,
      'lastname'  => $lastname,
    ];
  }

  /**
   * Générer un uid à partir de l'email
   * 
   * @param string $email Email à traiter
   * 
   * @return string uid généré
   */
  protected function get_uid_from_email($email) {
    $uid = preg_replace("/[^a-z0-9\.-]/", '.', strtolower($email));

    if (strlen($uid) > 34) {
      $uid = substr($uid, 0, 34);
    }

    return $uid . ".ext";
  }

  /**
   * Lister les localités disponibles pour les ressources
   * 
   * @return LibMelanie\Api\Defaut\Resources\Locality[] Liste des localités 
   */
  public function resources_localities() {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[driver_mel] mtes::resources_localities()");

    return (new LibMelanie\Api\Mel\Resources\Locality())->listAllLocalities();
  }

  /**
   * Lister les ressources par uid ou email
   * 
   * @param string[] $uids Liste des uids des ressources
   * @param string[] $emails Liste des emails des ressources
   * 
   * @return LibMelanie\Api\Defaut\Resource[] Liste des ressources
   */
  public function resources($uids = null, $emails = null) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[driver_mel] mtes::resources()");

    return (new LibMelanie\Api\Mel\Resources\Locality())->listResources(null, $uids, $emails);
  }

  /**
   * Lister les ressources Flex Office disponibles pour une localité
   * 
   * @param string $locality_uid Identifiant de la localité
   * 
   * @return LibMelanie\Api\Defaut\Resource[] Liste des ressources Flex Office
   */
  public function resources_flex_office($locality_uid) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[driver_mel] mtes::resources_flex_office($locality_uid)");

    $locality = new LibMelanie\Api\Mel\Resources\Locality();
    $locality->uid = $locality_uid;

    if ($locality->load()) {
      return $locality->listResources(LibMelanie\Api\Mel\Resource::TYPE_FLEX_OFFICE);
    }
    else {
      return [];
    }
  }

  /**
   * Lister les ressources Salle disponibles pour une localité
   * 
   * @param string $locality_uid Identifiant de la localité
   * 
   * @return LibMelanie\Api\Defaut\Resource[] Liste des ressources Flex Office
   */
  public function resources_salle($locality_uid) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[driver_mel] mtes::resources_salle($locality_uid)");

    $locality = new LibMelanie\Api\Mel\Resources\Locality();
    $locality->uid = $locality_uid;

    if ($locality->load()) {
      return $locality->listResources(LibMelanie\Api\Mel\Resource::TYPE_SALLE);
    }
    else {
      return [];
    }
  }

  /**
   * Lister les ressources Véhicule disponibles pour une localité
   * 
   * @param string $locality_uid Identifiant de la localité
   * 
   * @return LibMelanie\Api\Defaut\Resource[] Liste des ressources Flex Office
   */
  public function resources_vehicule($locality_uid) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[driver_mel] mtes::resources_vehicule($locality_uid)");

    $locality = new LibMelanie\Api\Mel\Resources\Locality();
    $locality->uid = $locality_uid;

    if ($locality->load()) {
      return $locality->listResources(LibMelanie\Api\Mel\Resource::TYPE_VEHICULE);
    }
    else {
      return [];
    }
  }

  /**
   * Lister les ressources Matériel disponibles pour une localité
   * 
   * @param string $locality_uid Identifiant de la localité
   * 
   * @return LibMelanie\Api\Defaut\Resource[] Liste des ressources Flex Office
   */
  public function resources_materiel($locality_uid) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[driver_mel] mtes::resources_materiel($locality_uid)");

    $locality = new LibMelanie\Api\Mel\Resources\Locality();
    $locality->uid = $locality_uid;

    if ($locality->load()) {
      return $locality->listResources(LibMelanie\Api\Mel\Resource::TYPE_MATERIEL);
    }
    else {
      return [];
    }
  }
}
