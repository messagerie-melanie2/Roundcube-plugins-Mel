<?php
/**
 * Plugin Mél
 *
 * plugin mel pour roundcube
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
// Chargement de la librairie ORM
@include_once 'includes/libm2.php';

class mel extends rcube_plugin {

  static $VERSION = "Mélanie2";

  /**
   *
   * @var string
   */
  public $task = '.*';
  /**
   *
   * @var rcmail
   */
  private $rc;
  /**
   * Tableau listant les identitées
   *
   * @var array
   */
  private $identities;
  /**
   * Stocke le _account passé en get
   *
   * @var string
   */
  private $get_account;
  /**
   * Identifiant de la bal
   *
   * @var string
   */
  private $user_bal;
  /**
   * Username complet bal@host
   *
   * @var string
   */
  private $user_name;
  /**
   * Host de l'utilisateur
   *
   * @var string
   */
  private $user_host;
  /**
   * Objet de partage, en .
   * -. si balp
   *
   * @var string
   */
  private $user_objet_share;
  /**
   * Clé pour la mise en cache
   *
   * @var string
   */
  const CACHE_KEY = "cache_m2";

  /**
   * Initialisation du plugin
   *
   * @see rcube_plugin::init()
   */
  function init() {
    $this->rc = rcmail::get_instance();
    // Mise à jour de la version
    include_once __DIR__ . '/../../version.php';
    self::$VERSION .= " " . Version::VERSION;
    // Définition des hooks
    $this->add_hook('login_after', array(
            $this,
            'login_after'
    ));
    $this->add_hook('storage_connect', array(
            $this,
            'storage_connect'
    ));
    $this->add_hook('user_create', array(
            $this,
            'user_create'
    ));
    $this->add_hook('m2_set_folder_name', array(
            $this,
            'set_folder_name'
    ));
    $this->add_hook('m2_set_cache_mailbox', array(
            $this,
            'set_cache_mailbox'
    ));
    $this->add_hook('m2_get_account', array(
            $this,
            'm2_get_account'
    ));
    $this->add_hook('render_mailboxlist', array(
            $this,
            'render_mailboxlist'
    ));
    $this->add_hook('smtp_connect', array(
            $this,
            'smtp_connect'
    ));
    $this->add_hook('message_before_send', array(
            $this,
            'message_before_send'
    ));
    $this->add_hook('identity_select', array(
            $this,
            'identity_select'
    ));
    $this->add_hook('managesieve_connect', array(
            $this,
            'managesieve_connect'
    ));
    $this->add_hook('preferences_list', array(
            $this,
            'prefs_list'
    ));
    $this->add_hook('preferences_save', array(
            $this,
            'prefs_save'
    ));
    $this->add_hook('identity_form', array(
            $this,
            'identity_form'
    ));
    $this->add_hook('identities_list', array(
            $this,
            'identities_list'
    ));
    $this->add_hook('folders_list', array(
            $this,
            'folders_list'
    ));
    // register message hook
    $this->add_hook('message_headers_output', array($this, 'mail_headers'));

    // Template
    $this->add_hook('template_object_loginform', array(
            $this,
            'login_form'
    ));
    $this->add_hook('template_object_version', array(
            $this,
            'version'
    ));

    // Command
    $this->register_action('plugin.set_current_page', array(
            $this,
            'set_current_page'
    ));
    $this->register_action('plugin.get_mbox_unread_count', array(
        $this,
        'get_unread_count'
    ));
    
    // MANTIS 0004276: Reponse avec sa bali depuis une balp, quels "Elements envoyés" utiliser
    if ($this->rc->task == 'mail') {
      $this->register_action('plugin.refresh_store_target_selection', array($this,'refresh_store_target_selection'));
    }

    // Chargement de l'account passé en Get
    $this->get_account = self::get_account();
    // Chargement de l'ui
    $this->init_ui();

    // Configurer les LOG de la librairie Mélanie2
    $debug_log = function ($message) {
      $message = "[LibM2] $message";
      if (mel_logs::is(mel_logs::DEBUG))
        mel_logs::get_instance()->log(mel_logs::DEBUG, $message);
    };
    $info_log = function ($message) {
      $message = "[LibM2] $message";
      if (mel_logs::is(mel_logs::INFO))
        mel_logs::get_instance()->log(mel_logs::INFO, $message);
    };
    $error_log = function ($message) {
      $message = "[LibM2] $message";
      if (mel_logs::is(mel_logs::ERROR))
        mel_logs::get_instance()->log(mel_logs::ERROR, $message);
    };
    LibMelanie\Log\M2Log::InitDebugLog($debug_log);
    LibMelanie\Log\M2Log::InitInfoLog($info_log);
    LibMelanie\Log\M2Log::InitErrorLog($error_log);
  }

  /**
   * Initializes plugin's UI (localization, js script)
   */
  private function init_ui() {
    if ($this->ui_initialized) {
      return;
    }
    // load localization
    $this->add_texts('localization/', true);
    $this->include_script('mel.js');
    $this->include_stylesheet($this->local_skin_path() . '/mel.css');

    // Charge la configuration
    $this->load_config();

    // MANTIS 0004276: Reponse avec sa bali depuis une balp, quels "Elements envoyés" utiliser
    if ($this->rc->task == 'mail' && $this->rc->action == 'compose') {
      $ident_bal = $this->assoc_identity_bal();
      // Ajout d'un champ hidden pour stocker l'account
      if ($this->rc->action == 'compose') {
        $hidden_account = new html_hiddenfield(array('id' => '_compose_hidden_account', 'name' => '_account'));
        $this->api->add_content($hidden_account->show($this->get_account), 'composeoptions');
      }
    }

    // Définition du host
    $http_host = $this->rc->config->get('http_host');
    if (isset($http_host)) {
      $_SERVER['HTTP_HOST'] = $http_host;
    }

    // Use infinite scroll ?
    $this->rc->output->set_env('use_infinite_scroll', $this->rc->config->get('use_infinite_scroll', true));
    
    if (!$this->rc->config->get('hide_keep_login_button', false)) {
        // Keep login
        $this->rc->output->set_env('keep_login', isset($_SESSION['_keeplogin']) ? $_SESSION['_keeplogin'] : false);
    }

    // ajouter les boites partagées
    if ($this->api->output->type == 'html') {
      // Tableau pour la conf du chargement des boites partagées
      $list_tasks = array(
              'mail' => array(
                      '',
                      'show'
              ),
              'settings' => array(
                      'plugin.managesieve',
                      'folders',
                      'plugin.mel_resources_agendas',
                      'plugin.mel_resources_contacts',
                      'plugin.mel_resources_tasks'
              )
      );

      // Définition des valeurs par défaut en session
      $_SESSION['page'] = 1;

      if (isset($list_tasks[$this->rc->task]) && in_array($this->rc->action, $list_tasks[$this->rc->task])) {
        $username = $this->get_username();
        if (strpos($username, '.-.') !== false) {
          $susername = explode('.-.', $username);
          $username = $susername[0];
          if (isset($susername[1])) {
            $sbalp = explode('@', $susername[1]);
            $balpname = $sbalp[0];
          }
        }
        // Récupération de la liste des balp de l'utilisateur
        if ($this->rc->task == 'settings' && ($this->rc->action == 'plugin.managesieve' || $this->rc->action == 'plugin.mel_resources_agendas' || $this->rc->action == 'plugin.mel_resources_contacts' || $this->rc->action == 'plugin.mel_resources_tasks')) {
          // Pour les règles sieve, on n'affiche que les boites gestionnaires
          $balp = self::get_user_balp_gestionnaire($username);
        }
        else {
          $balp = self::get_user_balp($username);
        }
        // Récupération des informations sur l'utilisateur courant
        $infos = self::get_user_infos(isset($balpname) ? $balpname : $username);
        // Affichage du nom de l'utilisateur et du menu déroulant de balp
        if ($this->rc->task == 'settings') {
          $this->api->add_content(html::tag('div', array(
                  "class" => "folderlist-header-m2-settings",
                  "id" => "folderlist-header-m2-settings"
          ), html::tag('span', array(
                  "title" => $this->gettext('mailboxchangetext')
          ), $infos['cn'][0])), 'folderlistheader-settings');
        }
        $content = "";
        if ($this->rc->task == 'mail') {
          $content_first = "";
          $content_last = "";
          $last = false;
          
          $infos = self::get_user_infos($username);
          $current_mailbox = empty($this->get_account) || urlencode($this->get_account) == $username;
          $href = $current_mailbox ? "#" : "?_task=mail&_mbox=INBOX";
          // MANTIS 3987: La gestion des BALP ne conserve pas le paramètre _courrielleur=1
          if (isset($_GET['_courrielleur'])) {
            $href .= "&_courrielleur=1";
          }
          $treetoggle = (empty($this->get_account) || urlencode($this->get_account) == $username) ? 'expanded' : 'collapsed';
          $content = html::tag('li', array(
              "id" => rcube_utils::html_identifier($username, true),
              "class" => "mailbox box liitem liborder" . ($current_mailbox ? ' current' : '')
          ), html::tag('a', array(
              "href" => $href,
              "title" => $infos['mineqmelmailemission'][0]), // TODO: Ouvrir dans un nouvel onglet ?
              html::tag('span', array(
                  "class" => "button-inner-m2"
              ), $infos['cn'][0]) .
              html::div(['class' => 'treetoggle ' . $treetoggle], ' ') .
              html::tag('span', ['class' => 'unreadcount'], '')
            )
          );
          $content_first .= $content;
          $last = $current_mailbox;
        }
        else if (!empty($this->get_account) && urlencode($this->get_account) != $username) {
          $infos = self::get_user_infos($username);
          $href = "?_task=" . $this->rc->task . "&_action=" . $this->rc->action;
          // MANTIS 3987: La gestion des BALP ne conserve pas le paramètre _courrielleur=1
          if (isset($_GET['_courrielleur'])) {
            $href .= "&_courrielleur=1";
          }
          $content .= html::tag('li', array(
              "class" => "mailbox box liitem liborder$selected"
          ), html::tag('a', array(
              "href" => $href,
              "title" => $infos['mineqmelmailemission'][0]), // TODO: Ouvrir dans un nouvel onglet ?
              html::tag('span', array(
                  "class" => "button-inner-m2"
              ), $infos['cn'][0])
            )
          );
        }
        // Récupération des préférences de l'utilisateur
        $hidden_mailboxes = $this->rc->config->get('hidden_mailboxes', array());
        $i = 0;
        if (count($balp) >= 1) {
          // trier la liste
          sort($balp);
          foreach ($balp as $b) {
            $i ++;
            if ($b['dn'] == "") {
              continue;
            }
            if ($this->rc->task == 'mail' && isset($hidden_mailboxes[$b['uid'][0]])) {
              continue;
            }
            $uid = $b['uid'][0];
            $cn = $b['cn'][0];
            if (strpos($uid, '.-.') !== false) {
              $suid = explode('.-.', $uid);
              $suid = $suid[1];
              $infos = self::get_user_infos($suid);
              if (isset($infos) && isset($infos['mineqmelroutage']) && count($infos['mineqmelroutage']) > 0) {
                // MANTIS 3925: mineqMelRoutage multivalué
                foreach ($infos['mineqmelroutage'] as $melroutage) {
                  if (strpos($melroutage, '%') !== false) {
                    $tmp = explode('@', $melroutage);
                    $uid = urlencode($uid . "@" . $tmp[1]);
                    break;
                  }
                }
                $mbox = $suid;
                $cn = $infos['cn'][0];
              }
              // Ne lister que les bal qui ont l'accès internet activé si l'accés se fait depuis Internet
              if (! $this->is_internal() && (! isset($infos['mineqmelaccesinterneta']) || $infos['mineqmelaccesinterneta'][0] != 1 || ! isset($infos['mineqmelaccesinternetu']) || $infos['mineqmelaccesinternetu'][0] != 1)) {
                continue;
              }
            }
            if ($this->rc->task == 'mail') {
              $current_mailbox = !empty($this->get_account) && urlencode($this->get_account) == $uid;
              $href = $current_mailbox ? "#" : "?_task=mail&_mbox=Boite+partag%26AOk-e%2F" . $mbox . "&_account=" . $uid;
              // MANTIS 3987: La gestion des BALP ne conserve pas le paramètre _courrielleur=1
              if (isset($_GET['_courrielleur']) && !$current_mailbox) {
                $href .= "&_courrielleur=1";
              }
              $treetoggle = $current_mailbox ? 'expanded' : 'collapsed';
              $content = html::tag('li', array(
                  "id" => rcube_utils::html_identifier($uid, true),
                  "class" => "mailbox box liitem" . ($i != count($balp) ? " liborder" : "") . ($current_mailbox ? ' current' : '')
              ), html::tag('a', array(
                  "href" => $href,
                  "title" => $b['mineqmelmailemission'][0]),
                  html::tag('span', array(
                      "class" => "button-inner-m2"
                  ), $cn) .
                  html::div(['class' => 'treetoggle ' . $treetoggle], ' ') .
                  html::tag('span', ['class' => 'unreadcount'], '')
                )
              );
              if ($last) {
                $content_last .= $content;
              }
              else {
                $content_first .= $content;
                $last = $current_mailbox;
              }
            }
            else if (empty($this->get_account) || urlencode($this->get_account) != $uid) {
              $href = "?_task=" . $this->rc->task . "&_action=" . $this->rc->action . "&_account=" . $uid;
              // MANTIS 3987: La gestion des BALP ne conserve pas le paramètre _courrielleur=1
              if (isset($_GET['_courrielleur'])) {
                $href .= "&_courrielleur=1";
              }
              $content .= html::tag('li', array(
                  "class" => "mailbox box liitem" . ($i != count($balp) ? " liborder" : "")
              ), html::tag('a', array(
                  "href" => $href,
                  "title" => $b['mineqmelmailemission'][0]), 
                  html::tag('span', array(
                    "class" => "button-inner-m2"
                  ), $cn)
                )
              );
            }
          }
        }
        // Affiche les données sur la bal
        if ($this->rc->task == 'mail') {
          // First list of mailboxes list
          $this->api->add_content(html::tag('ul', array(
                  "class" => "treelist listing folderlist sharesmailboxesul",
                  "id" => "sharesmailboxesul-first"
          ), $content_first), 'folderlistheader-first');
          // Last list of mailboxes list
          $this->api->add_content(html::tag('ul', array(
              "class" => "treelist listing folderlist sharesmailboxesul",
              "id" => "sharesmailboxesul-last"
          ), $content_last), 'folderlistheader-last');
          // Link to Settings/Folders
          $content = html::tag('li', array(
                  'class' => 'separator_above'
          ), $this->api->output->button(array(
                  'label' => 'mel.menumanageresources_mailboxes',
                  'type' => 'link',
                  'classact' => 'active',
                  'command' => 'plugin.mel_resources_bal',
                  'task' => 'settings'
          )));
          $this->api->add_content($content, 'mailboxoptions');
        }
        elseif ($this->rc->task == 'settings') {
          $this->api->add_content(html::tag('div', array(
                  "class" => "sharesmailboxeshide",
                  "id" => "sharesmailboxeslist-settings"
          ), html::tag('ul', array(
                  "class" => "sharesmailboxesul",
                  "id" => "sharesmailboxesul"
          ), $content)), 'folderlistheader-settings');
        }
        // Reset de la recherche en session
        $this->reset_session();
      }
      elseif ($this->rc->task == 'calendar') {
        // Link to Settings/Folders
        $content = html::tag('li', array(
                'class' => 'separator_above'
        ), $this->api->output->button(array(
                'label' => 'mel.menumanageresources_calendars',
                'type' => 'link',
                'classact' => 'active',
                'command' => 'plugin.mel_resources_agendas',
                'task' => 'settings'
        )));
        $this->api->add_content($content, 'calendaroptionsmenu');
      }
      elseif ($this->rc->task == 'tasks') {
        // Link to Settings/Folders
        $content = html::tag('li', array(
                'class' => 'separator_above'
        ), $this->api->output->button(array(
                'label' => 'mel.menumanageresources_taskslists',
                'type' => 'link',
                'classact' => 'active',
                'command' => 'plugin.mel_resources_tasks',
                'task' => 'settings'
        )));
        $this->api->add_content($content, 'tasklistoptionsmenu');
      }
      elseif ($this->rc->task == 'login' || $this->rc->task == 'logout') {
        $this->api->add_content(html::div(null, $this->gettext('login_footer')) . html::br() . html::div(null, $this->gettext('login from') . ucfirst($_SERVER["HTTP_X_MINEQPROVENANCE"])), 'loginfooter');
      }
      // Gestion du mot de passe trop ancien
      if ($this->rc->task == 'mail' && !$this->rc->output->get_env('ismobile') && ! isset($_SESSION['plugin.show_password_change']) && ! $_SESSION['plugin.show_password_change']) {
        // Authentification sur le serveur de recherche (pour avoir accès a plus d'attributs)
        // LibMelanie\Ldap\Ldap::Authentification($this->rc->get_user_name(), $this->rc->get_user_password());
        // Récupération des informations sur l'utilisateur courant
        $infos = LibMelanie\Ldap\Ldap::GetUserInfos($this->rc->get_user_name(), null, array(
                'mineqpassworddoitchanger'
        ), LibMelanie\Config\Ldap::$AUTH_LDAP);
        LibMelanie\Ldap\Ldap::GetInstance(LibMelanie\Config\Ldap::$AUTH_LDAP)->authenticate($infos['dn'], $this->rc->get_user_password());
        if (! empty($infos['mineqpassworddoitchanger'][0])) {
          $this->rc->output->set_env('passwordchange_title', $infos['mineqpassworddoitchanger'][0]);
          $this->rc->output->set_env('plugin.show_password_change', true);
          $_SESSION['plugin.show_password_change'] = true;
        }
      }
    }
    // Modification de l'affichage des dossiers imap
    $this->set_defaults_folders();
    $this->ui_initialized = true;
  }
  
  /**
   * Force un account différent si besoin
   * @param string $_account
   */
  public function set_account($_account) {
    $this->get_account = $_account;
  }

  /**
   * Permet de récupérer l'account courant
   */
  public static function get_account() {
    if (isset($_POST['_account']) && !empty($_POST['_account'])) {
      $_account = trim(rcube_utils::get_input_value('_account', rcube_utils::INPUT_POST));
    }
    else {
      $_account = trim(rcube_utils::get_input_value('_account', rcube_utils::INPUT_GET));
    }
    return $_account;
  }

  /**
   * Association entre les identités Roundcube et les bal Mélanie2
   * Retourne le résultat en env
   */
  private function assoc_identity_bal() {
    $result = array();
    $identities = $this->rc->user->list_identities();
    // Récupération du username depuis la session
    $username = $this->rc->user->get_username();

    $mailboxes = array_merge(array(self::get_user_infos($username)), self::get_user_balp_emission($username));

    foreach ($identities as $id) {
      foreach ($mailboxes as $mailbox) {
        if (isset($mailbox['mineqmelmailemissionpr']) && count($mailbox['mineqmelmailemissionpr']) > 0) {
          $mail = $mailbox['mineqmelmailemissionpr'][0];
        }
        else if (isset($mailbox['mineqmelmailemission']) && count($mailbox['mineqmelmailemission']) > 0) {
          $mail = $mailbox['mineqmelmailemission'][0];
        }
        else if (isset($mailbox['mail']) && count($mailbox['mail']) > 0) {
          $mail = $mailbox['mail'][0];
        }
        else {
          continue;
        }
        if (strcasecmp($mail, $id['email']) === 0) {
          $uid = $mailbox['uid'][0];
          if (strpos($uid, '.-.') !== false) {
            $suid = explode('.-.', $uid);
            $suid = $suid[1];
            $infos = self::get_user_infos($suid);
            if (isset($infos) && isset($infos['mineqmelroutage']) && count($infos['mineqmelroutage']) > 0) {
              // MANTIS 3925: mineqMelRoutage multivalué
              foreach ($infos['mineqmelroutage'] as $melroutage) {
                if (strpos($melroutage, '%') !== false) {
                  $tmp = explode('@', $melroutage);
                  $uid = urlencode($uid . "@" . $tmp[1]);
                  break;
                }
              }
            }
          }
          else {
            // MANTIS 3925: mineqMelRoutage multivalué
            foreach ($mailbox['mineqmelroutage'] as $melroutage) {
              if (strpos($melroutage, '%') !== false) {
                $tmp = explode('@', $melroutage);
                $uid = urlencode($uid . "@" . $tmp[1]);
                break;
              }
            }
          }
          $result[$id['identity_id']] = $uid;
        }
      }
    }
    $this->rc->output->set_env('identities_to_bal', $result);
  }

  /**
   * Reset de la session pour les valeurs de recherche
   * C'est a faire car sinon cela pose problème quand plusieurs boites sont ouvertes dans des onglets
   * Voir MANTIS 3541: Sortir la recherche de la session
   *
   * @link https://psi2appli.appli.i2/mantis/view.php?id=3541
   */
  private function reset_session() {
    unset($_SESSION['search']);
    unset($_SESSION['search_filter']);
  }

  /**
   * **** COMMANDS *****
   */
  /**
   * RAZ de la page courante
   */
  public function set_current_page() {
    $_SESSION['page'] = 1;
    $result = array(
            'action' => 'plugin.set_current_page'
    );
    echo json_encode($result);
    exit();
  }

  /**
   * Rafraichissement de la liste des dossiers dans la page compose
   */
  public function refresh_store_target_selection() {
    $unlock = rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_GET);

    $attrib = array(
            'name'      => '_store_target',
            'maxlength' => '30',
            'style'     => 'max-width:12em',
            'tabindex'  => '4',
    );
    $select = $this->rc->folder_selector(array_merge($attrib, array(
            'noselection'   => '- ' . $this->rc->gettext('dontsave') . ' -',
            'folder_filter' => 'mail',
            'folder_rights' => 'w',
    )));

    $result = array(
            'action' => 'plugin.refresh_store_target_selection',
            'select_html' => $select->show($this->rc->config->get('sent_mbox'), $attrib),
            'unlock' => $unlock,
    );
    echo json_encode($result);
    exit;
  }

  /**
   * ****** Version *****
   */
  /**
   * Supprimer la liste des serveurs
   */
  public function version($args) {
    $args['content'] = self::$VERSION;
    return $args;
  }

  /**
   * *** HOOKS *****
   */
  /**
   * Sets defaults for new user.
   */
  public function user_create($args) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "mel::user_create()");
    $infos = self::get_user_infos($args['user']);
    if (isset($infos) && isset($infos['mineqmelroutage']) && count($infos['mineqmelroutage']) > 0) {
      // MANTIS 3925: mineqMelRoutage multivalué
      foreach ($infos['mineqmelroutage'] as $melroutage) {
        if (strpos($melroutage, '%') !== false) {
          $tmp = explode('@', $melroutage);
          $args['host'] = $tmp[1];
          break;
        }
      }
    }
    $args['user_name'] = $infos['cn'][0];
    $args['user_email'] = $infos['mineqmelmailemission'][0];
    if (mel_logs::is(mel_logs::INFO))
      mel_logs::get_instance()->log(mel_logs::INFO, "[user_create] Création de l'utilisateur '" . $args['user_name'] . "@" . $args['host'] . "' dans la base de données Roundcube");
      // Vérifier que si l'on doit créer les conteneurs
      // MANTIS 0003682: Créer les carnets d'adresses, calendriers et lists de tâches par défaut à la création
    $user = new LibMelanie\Api\Melanie2\User();
    $user->uid = $args['user'];
    // Test du calendrier
    $calendar = new LibMelanie\Api\Melanie2\Calendar($user);
    $calendar->id = $args['user'];
    if (! $calendar->load()) {
      // Le calendrier ne se charge pas, il faut le créer
      $calendar->name = $args['user_name'];
      $calendar->owner = $args['user'];
      // Création de l'agenda
      if ($calendar->save()) {
        // Création du default calendar
        $pref = new LibMelanie\Api\Melanie2\UserPrefs($user);
        $pref->scope = LibMelanie\Config\ConfigMelanie::CALENDAR_PREF_SCOPE;
        $pref->name = LibMelanie\Config\ConfigMelanie::CALENDAR_PREF_DEFAULT_NAME;
        $pref->value = $args['user'];
        $pref->save();
        unset($pref);
        // Création du display_cals (utile pour que pacome fonctionne)
        $pref = new LibMelanie\Api\Melanie2\UserPrefs($user);
        $pref->scope = LibMelanie\Config\ConfigMelanie::CALENDAR_PREF_SCOPE;
        $pref->name = 'display_cals';
        $pref->value = 'a:0:{}';
        $pref->save();
      }
    }
    // Test du carnet d'adresses
    $addressbook = new LibMelanie\Api\Melanie2\Addressbook($user);
    $addressbook->id = $args['user'];
    if (! $addressbook->load()) {
      // Le carnet ne se charge pas, il faut le créer
      $addressbook->name = $args['user_name'];
      $addressbook->owner = $args['user'];
      // Création du carnet d'adresses
      if ($addressbook->save()) {
        // Création du default addressbook
        $pref = new LibMelanie\Api\Melanie2\UserPrefs($user);
        $pref->scope = LibMelanie\Config\ConfigMelanie::ADDRESSBOOK_PREF_SCOPE;
        $pref->name = LibMelanie\Config\ConfigMelanie::ADDRESSBOOK_PREF_DEFAULT_NAME;
        $pref->value = $args['user'];
        $pref->save();
      }
    }
    // Test de la liste de tâches
    $taskslist = new LibMelanie\Api\Melanie2\Taskslist($user);
    $taskslist->id = $args['user'];
    if (! $taskslist->load()) {
      // la liste de tâches ne se charge pas, il faut la créer
      $taskslist->name = $args['user_name'];
      $taskslist->owner = $args['user'];
      // Création de la liste de tâches
      if ($taskslist->save()) {
        // Création du default taskslist
        $pref = new LibMelanie\Api\Melanie2\UserPrefs($user);
        $pref->scope = LibMelanie\Config\ConfigMelanie::TASKSLIST_PREF_SCOPE;
        $pref->name = LibMelanie\Config\ConfigMelanie::TASKSLIST_PREF_DEFAULT_NAME;
        $pref->value = $args['user'];
        $pref->save();
      }
    }
    return $args;
  }

  /**
   * Select the good identity
   * Lors de l'écriture d'un mail, l'identité liée à la boite mail est sélectionnée
   */
  public function identity_select($args) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "mel::identity_select()");
      // Gestion de l'identité par défaut en fonction de l'account
    if ($this->rc->task == "mail" && $this->rc->action == "compose") {
      // Parcour les identités pour définir celle par défaut
      foreach ($args['identities'] as $key => $identity) {
        if ($identity['uid'] == $this->get_share_objet()) {
          $args['selected'] = $key;
          break;
        }
      }
    }
    return $args;
  }

  /**
   * Connect to sieve server
   * Utilise les identifiants de la balp si nécessaire
   */
  public function managesieve_connect($args) {
    // Chargement de l'account passé en Get
    $this->get_account = self::get_account();
    /* PAMELA - Gestion des boites partagées */
    if (! empty($this->get_account)) {
      if (mel_logs::is(mel_logs::DEBUG))
        mel_logs::get_instance()->log(mel_logs::DEBUG, "mel::managesieve_connect()");
      $args['user'] = $this->get_user_bal();
      // Ajouter également l'host pour les règles sieve
      $args['host'] = $this->get_host();
    }
    return $args;
  }

  /**
   * Connect to smtp
   * Utilise les identifiants de la balp si nécessaire
   */
  public function smtp_connect($args) {
    if (! empty($_SESSION['m2_from_identity'])) {
      if (mel_logs::is(mel_logs::DEBUG))
        mel_logs::get_instance()->log(mel_logs::DEBUG, "mel::smtp_connect()");
      $infos = LibMelanie\Ldap\LDAPMelanie::GetInformationsFromMail($_SESSION['m2_from_identity']);
      $args['smtp_user'] = $infos['uid'][0];
    }
    return $args;
  }

  /**
   * Connect to smtp
   * Stock l'identité utilisé avant que le message soit envoyé
   * Utilisé pour la connexion smtp
   */
  public function message_before_send($args) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "mel::message_before_send()");
    $_SESSION['m2_from_identity'] = $args['from'];
    // Parcour les identités pour réécrire le from avec le realname
    $identities = $this->rc->user->list_identities();
    $headers = array();
    foreach ($identities as $identity) {
      if ($args['from'] == $identity['email'] && isset($args['message']->_headers['From'])) {
        // Si on retrouve l'identité on met à jour le From des headers pour formatter avec le realname
        $headers['From'] = '"' . $identity['realname'] . '" <' . $identity['email'] . '>';
        break;
      }
    }
    // Positionner le HEADER pour indiquer l'origine du message (internet, intranet)
    $headers['Received'] = 'from butineur (par ' . $_SERVER["HTTP_X_MINEQPROVENANCE"] . ' [' . $_SERVER["HTTP_X_FORWARDED_FOR"] . ']) by ' . $_SERVER["HTTP_X_FORWARDED_SERVER"] . ' [' . $_SERVER["SERVER_ADDR"] . ']';
    $args['message']->headers($headers, true);
    return $args;
  }

  /**
   * After login user
   * Gestion des identités
   */
  public function login_after($args) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "mel::login_after()");
    if (isset($_GET['_goto_task'])) {
      $args['_task'] = trim(rcube_utils::get_input_value('_goto_task', rcube_utils::INPUT_GET));
    }
    // Gestion des identities de l'utilisateur
    $rc_identities = $this->rc->user->list_identities();
    $m2_identities = $this->m2_list_identities();
    $update_identities = array();
    $insert_identities = array();
    $delete_identities = array();
    // Parcour les identités
    foreach ($rc_identities as $rc_i) {
      if (isset($m2_identities[strtolower($rc_i['email'])])) {
        $m2_i = $m2_identities[strtolower($rc_i['email'])];
        if ($rc_i['email'] != $m2_i['email'] || $rc_i['realname'] != $m2_i['realname'] || $rc_i['uid'] != $m2_i['uid']) {
          $rc_i['email'] = $m2_i['email'];
          // Test si le nom n'a pas été modifié par l'utilisateur
          if ($this->m2_identity_shortname($rc_i['realname']) == $rc_i['name'])
            $rc_i['name'] = $m2_i['name'];
          $rc_i['realname'] = $m2_i['realname'];
          $rc_i['uid'] = $m2_i['uid'];
          $update_identities[$rc_i['identity_id']] = $m2_i;
        }
        // Vide le tableau pour lister ensuite les identities à créer
        unset($m2_identities[strtolower($rc_i['email'])]);
      }
      else {
        $delete_identities[] = $rc_i['identity_id'];
      }
    }
    $insert_identities = $m2_identities;
    // Insertion des identités
    foreach ($insert_identities as $insert_i) {
      $this->rc->user->insert_identity($insert_i);
    }
    // Mise à jour des identités
    foreach ($update_identities as $iid => $update_i) {
      $this->rc->user->update_identity($iid, $update_i);
    }
    // Suppression des identités
    foreach ($delete_identities as $delete_iid) {
      $this->rc->user->delete_identity($delete_iid);
    }
    return $args;
  }

  /**
   * Connect to IMAP server
   * Utilise les identifiants de la balp si nécessaire
   */
  public function storage_connect($args) {
    if ($args['driver'] == 'imap') {
      if (mel_logs::is(mel_logs::DEBUG))
        mel_logs::get_instance()->log(mel_logs::DEBUG, "mel::storage_connect()");
        /* PAMELA - Gestion des boites partagées */
      if (! empty($this->get_account)) {
        $args['user'] = $this->get_share_objet();
        $args['host'] = $this->get_host();
      }
      else {
        // MANTIS 3187: Erreur lorsque l'on charge la page de roundcube après être allé sur une boite partagée
        if (strpos($_SESSION['mbox'], "Boite partag&AOk-e/") === 0) {
          $_SESSION['mbox'] = 'INBOX';
        }
      }
      // Utiliser les proxy imap ?
      if ($this->rc->config->get('use_imap_proxy', false)) {
        $args['host'] = $this->rc->config->get('imap_proxy', null);
      }
    }
    return $args;
  }

  /**
   * ** IMAP ***
   */
  /**
   * Gestion de l'affichage des boites mails
   * Hook pour la gestion des boites partagées
   *
   * @param array $args
   * @return array
   */
  public function render_mailboxlist($args) {
    if (! empty($this->get_account)) {
      if (mel_logs::is(mel_logs::DEBUG))
        mel_logs::get_instance()->log(mel_logs::DEBUG, "mel::render_mailboxlist()");
      $username = $this->get_username();
      if (strpos($username, '.-.') !== false) {
        // On est sur une balp
        $balp_label = 'Boite partag&AOk-e';
        $balp_name = $this->get_user_bal();
        $list = $args['list'];
        foreach ($list as $key => $value) {
          if ($key == 'INBOX') {
            $list[$key]['id'] = $balp_label . $this->rc->get_storage()->delimiter . $balp_name;
            $list[$key]['name'] = 'INBOX';
            $list[$key]['class'] = 'INBOX';
          }
          else if ($key == $balp_label) {
            if (isset($value['folders'][$balp_name])) {
              $folders = $value['folders'][$balp_name]['folders'];
              $list = array_merge($list, $value['folders'][$balp_name]['folders']);
              unset($list[$key]);
            }
          }
          elseif ($key != 'Corbeille') {
            unset($list[$key]);
          }
        }
        $args['list'] = $list;
      }
    }
    return $args;
  }

  /**
   * Réécriture du nom de dossier
   * Utilisé pour les boites partagées
   *
   * @param array $args
   * @return array
   */
  public function set_folder_name($args) {
    if (! empty($this->get_account)) {
      if (mel_logs::is(mel_logs::DEBUG))
        mel_logs::get_instance()->log(mel_logs::DEBUG, "mel::set_folder_name()");
      $username = $this->get_username();
      if (($args['folder'] == 'INBOX') && strpos($username, '.-.') !== false) {
        // On est sur une balp
        $balp_label = 'Boite partag&AOk-e';
        $balp_name = $this->get_user_bal();
        $args['folder'] = $balp_label . $this->rc->get_storage()->delimiter . strtolower($balp_name);
        // Change le mailbox d'environnement
        $mbox = $this->rc->output->get_env('mailbox');
        if ($mbox == 'INBOX') {
          $this->rc->output->set_env('mailbox', $args['folder']);
        }
      }
    }
    return $args;
  }

  /**
   * Définition du nom de boite pour le cache,
   * Utilise l'account passé en paramètre pour différencier les comptes
   * Passage en md5 pour le stockage
   *
   * @param array $args
   * @return array
   */
  public function set_cache_mailbox($args) {
    if (! empty($this->get_account) && strpos($args['mailbox'], '##cache##m2#') !== 0) {
      if (mel_logs::is(mel_logs::DEBUG))
        mel_logs::get_instance()->log(mel_logs::DEBUG, "mel::set_cache_mailbox()");
      $args['mailbox'] = '##cache##m2#' . $this->get_account . '##' . $args['mailbox'];
    }
    return $args;
  }

  /**
   * Retoune le compte passé dans l'url
   *
   * @return string Account
   */
  public function m2_get_account() {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "mel::m2_get_account()");
    return array(
            "account" => $this->get_account
    );
  }

  /**
   * Handler for user preferences form (preferences_list hook)
   */
  function prefs_list($args) {
    if ($args['section'] != 'mailbox') {
      return $args;
    }

    // Load localization and configuration
    $this->add_texts('localization/');

    // Check that configuration is not disabled
    $dont_override = ( array ) $this->rc->config->get('dont_override', array());

    $key = 'mel_use_infinite_scroll';
    if (! in_array($key, $dont_override)) {
      $config_key = 'use_infinite_scroll';
      $field_id = "_" . $key;
      $is_checked = $this->rc->config->get($config_key, true);
      $input = new html_checkbox(array(
              'name' => $field_id,
              'id' => $field_id,
              'value' => 1
      ));
      $content = $input->show($is_checked);

      $args['blocks']['main']['options'][$key] = array(
              'title' => html::label($field_id, rcube::Q($this->gettext($key))),
              'content' => $content
      );
    }
    return $args;
  }

  /**
   * Handler for user preferences save (preferences_save hook)
   */
  public function prefs_save($args) {
    if ($args['section'] != 'mailbox') {
      return $args;
    }

    // Check that configuration is not disabled
    $dont_override = ( array ) $this->rc->config->get('dont_override', array());

    $key = 'mel_use_infinite_scroll';
    if (! in_array($key, $dont_override)) {
      $config_key = 'use_infinite_scroll';
      $args['prefs'][$config_key] = rcube_utils::get_input_value('_' . $key, rcube_utils::INPUT_POST) ? true : false;
    }
    return $args;
  }

  /**
   * Handler for user identity edit form
   */
  public function identity_form($args) {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "mel::identity_form() args : " . var_export($args, true));
    $realname = $args['form']['addressing']['content']['email'];
    $uid = $args['form']['addressing']['content']['email'];
    $realname['label'] = $this->gettext('realname');
    $uid['label'] = $this->gettext('uid');
    $args['form']['addressing']['content']['name']['label'] = $this->gettext('name identity');
    $args['form']['addressing']['content'] = array_slice($args['form']['addressing']['content'], 0, 1, true) + array(
            'realname' => $realname
    ) + array(
            'uid' => $uid
    ) + array_slice($args['form']['addressing']['content'], 1, count($args['form']['addressing']['content']) - 1, true);

    return $args;
  }

  /**
   * Handler for user identities list
   */
  public function identities_list($args) {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "mel::identities_list() args : " . var_export($args, true));
    $args['cols'][0] = 'name';
    return $args;
  }

  /**
   * Modification de la liste des dossiers
   * MANTIS 3934: Mauvaise présentation des dossiers
   *
   * @param array $args
   * @return array
   */
  public function folders_list($args) {
    if (! empty($this->get_account) && isset($args['list']['Corbeille'])) {
      $corbeille = $args['list']['Corbeille'];
      unset($args['list']['Corbeille']);
      $args['list']['Corbeille'] = $corbeille;
    }
    return $args;
  }
  
  /**
   * Change From message header
   */
  function mail_headers($args) {
    if (isset($args['output']['from']) 
        && $args['output']['from']['html']) {
      $args['output']['from']['value'] = $this->rcmail_address_string($args['output']['from']['raw'], null, true, "/images/addcontact.png");
    }
        
    return $args;
  }
  
  /**
   * Decode address string and re-format it as HTML links
   */
  private function rcmail_address_string($input, $max=null, $linked=false, $addicon=null, $default_charset=null, $title=null)
  {
    global $PRINT_MODE;
    
    $a_parts = rcube_mime::decode_address_list($input, null, true, $default_charset);
    
    if (!count($a_parts)) {
      return $input;
    }
    
    $c   = count($a_parts);
    $j   = 0;
    $out = '';
    $allvalues  = array();
    $show_email = $this->rc->config->get('message_show_email');
    
    if ($addicon && !isset($_SESSION['writeable_abook'])) {
      $_SESSION['writeable_abook'] = $this->rc->get_address_sources(true) ? true : false;
    }
    
    foreach ($a_parts as $part) {
      $j++;
      
      $name   = $part['name'];
      $mailto = $part['mailto'];
      $string = $part['string'];
      $valid  = rcube_utils::check_email($mailto, false);
      
      // IDNA ASCII to Unicode
      if ($name == $mailto)
        $name = rcube_utils::idn_to_utf8($name);
        if ($string == $mailto)
          $string = rcube_utils::idn_to_utf8($string);
          $mailto = rcube_utils::idn_to_utf8($mailto);
          
          if ($PRINT_MODE) {
            $address = sprintf('%s &lt;%s&gt;', rcube::Q($name), rcube::Q($mailto));
          }
          else if ($valid) {
            if ($linked) {
              $attrs = array(
                  'href'    => 'mailto:' . $mailto,
                  'class'   => 'rcmContactAddress',
                  'onclick' => sprintf("return %s.command('compose','%s',this)",
                    rcmail_output::JS_OBJECT_NAME, rcube::JQ(format_email_recipient($mailto, $name))),
              );
              
              $attrs['title'] = $mailto;
              if (!$name) {
                $name = explode('@', $mailto, 2);
                $name = ucfirst(str_replace('.', ' ', $name[0])) . ' (' . $name[1] . ')';
              }
              $content =  html::tag('span', 'name', $name) . html::tag('span', 'mailto', $mailto);
              
              $address = html::a($attrs, $content);
            }
            else {
              $address = html::span(array('title' => $mailto, 'class' => "rcmContactAddress"),
                rcube::Q($name ?: $mailto));
            }
            
            if ($addicon && $_SESSION['writeable_abook']) {
              $address .= html::a(array(
                  'href'    => "#add",
                  'title'   => $this->rc->gettext('addtoaddressbook'),
                  'class'   => 'rcmaddcontact',
                  'onclick' => sprintf("return %s.command('add-contact','%s',this)",
                    rcmail_output::JS_OBJECT_NAME, rcube::JQ($string)),
              ),
                html::img(array(
                    'src'   => $this->rc->output->abs_url($addicon, true),
                    'alt'   => "Add contact",
                    'class' => 'noselect',
                )));
            }
          }
          else {
            $address = $name ? rcube::Q($name) : '';
            if ($mailto) {
              $address = trim($address . ' ' . rcube::Q($name ? sprintf('<%s>', $mailto) : $mailto));
            }
          }
          
          $address = html::span('adr', $address);
          $allvalues[] = $address;
          
          if (!$moreadrs) {
            $out .= ($out ? ', ' : '') . $address;
          }
          
          if ($max && $j == $max && $c > $j) {
            if ($linked) {
              $moreadrs = $c - $j;
            }
            else {
              $out .= '...';
              break;
            }
          }
    }
    
    if ($moreadrs) {
      $label = rcube::Q($this->rc->gettext(array('name' => 'andnmore', 'vars' => array('nr' => $moreadrs))));
      
      if ($PRINT_MODE) {
        $out .= ' ' . html::a(array(
            'href'    => '#more',
            'class'   => 'morelink',
            'onclick' => '$(this).hide().next().show()',
        ), $label)
        . html::span(array('style' => 'display:none'), join(', ', $allvalues));
      }
      else {
        $out .= ' ' . html::a(array(
            'href'    => '#more',
            'class'   => 'morelink',
            'onclick' => sprintf("return %s.show_popup_dialog('%s','%s')",
              rcmail_output::JS_OBJECT_NAME,
              rcube::JQ(join(', ', $allvalues)),
              rcube::JQ($title))
        ), $label);
      }
    }
    
    return $out;
  }
  
  /**
   * Récupérer le nombre de mails non lus de l'utilisateur
   */
  public function get_unread_count() {
    $mbox = rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GET);
    if (!isset($mbox)) {
      $mbox = 'INBOX';
    }
    // Récupérer le nombre de mails non lus pour l'INBOX
    $unseen_count = $this->rc->storage->count($mbox, 'UNSEEN', true);
    // Gestion de l'account
    $account = mel::get_account();
    if (!isset($account) || empty($account)) {
      $account = $this->rc->get_user_name();
    }
    // send output
    header("Content-Type: application/json; charset=" . RCUBE_CHARSET);
    // Return the result to the ajax command
    echo json_encode(['unseen_count' => $unseen_count, '_account' => $account, '_mbox' => $mbox]);
    exit;
  }

  /**
   * *** LOGIN ****
   */
  /**
   * Supprimer la liste des serveurs
   */
  public function login_form($args) {
    $is_courrielleur = trim(rcube_utils::get_input_value('_courrielleur', rcube_utils::INPUT_GET));
    if (isset($is_courrielleur) && $is_courrielleur >= 1) {
      // Usage avec le courrielleur
      $task = trim(rcube_utils::get_input_value('_task', rcube_utils::INPUT_GET));
      if ($task != 'login') {
        header('Location: ?_task=login&_courrielleur=' . $is_courrielleur);
        exit();
      }

      $args['content'] = html::tag('h1', null, $this->gettext('You are disconnect from Roundcube')) . html::p(null, $this->gettext('You can close and reopen the tab')) . html::a(array(
              'href' => '?_task=login&_courrielleur=' . $is_courrielleur
      ), $this->gettext('Or you can clic here to relogin'));
    }
    else {
      if (mel_logs::is(mel_logs::DEBUG))
        mel_logs::get_instance()->log(mel_logs::DEBUG, "mel::login_form()");
      if (isset($_POST['_user']))
        $username = trim(rcube_utils::get_input_value('_user', rcube_utils::INPUT_POST));
      else
        $username = "";

      // save original url
      $url = rcube_utils::get_input_value('_url', rcube_utils::INPUT_POST);
      if (empty($url) && !preg_match('/_(task|action)=logout/', $_SERVER['QUERY_STRING']))
        $url = $_SERVER['QUERY_STRING'];

      $input_task = new html_hiddenfield(array(
              'name' => '_task',
              'value' => 'login'
      ));
      $input_action = new html_hiddenfield(array(
              'name' => '_action',
              'value' => 'login'
      ));
      $input_timezone = new html_hiddenfield(array(
              'name' => '_timezone',
              'id' => 'rcmlogintz',
              'value' => '_default_'
      ));
      $input_url = new html_hiddenfield(array(
              'name' => '_url',
              'id' => 'rcmloginurl',
              'value' => $url
      ));
      $input_login = new html_inputfield(array(
              'name' => '_user',
              'id' => 'rcmloginuser',
              'size' => '40',
              'autocapitalize' => 'off',
              'autocomplete' => 'on'
      ));
      $input_password = new html_passwordfield(array(
              'name' => '_pass',
              'id' => 'rcmloginpwd',
              'size' => '40',
              'autocapitalize' => 'off',
              'autocomplete' => 'off'
      ));
      if (!$this->rc->config->get('hide_keep_login_button', false)) {
          $checkbox_keeplogin = new html_checkbox(array(
              'name' => '_keeplogin',
              'id' => 'rcmloginkeep',
              'value' => 'keeplogin',
              'title' => $this->gettext('computer_private_title')
          ));
      }

      $keeplogin = "";
      $class_tr = "";
      $login_div = "";
      // Si le cookie est présent on modifie l'interface
      if (isset($_COOKIE['roundcube_login']) && !$this->rc->config->get('hide_keep_login_button', false)) {
        $login = explode('###', $_COOKIE['roundcube_login']);
        if ($username == "") {
          $username = $login[0];
        }
        if (isset($login[1])) {
          $cn = $login[1];
        }
        else {
          $cn = $username;
        }
        $keeplogin = "keeplogin";
        $class_tr = "hidden_login_input";
        $login_div = html::div(array(
                'class' => 'login_div'
        ), html::div(array(
                'class' => 'img'
        ), " ") . html::div(array(
                'class' => 'name'
        ), $cn) . html::a(array(
                'id' => 'rcmchangeuserbutton',
                'href' => '#'
        ), $this->gettext('change_user')));
      }
      else if (isset($_POST['_keeplogin']) && !$this->rc->config->get('hide_keep_login_button', false)) {
        $keeplogin = "keeplogin";
      }
      
      if ($this->rc->output->get_env('ismobile')) {
        if ($this->rc->config->get('hide_keep_login_button', false)) {
            $keeplogin_html = '';
        }
        else {
            $keeplogin_html = html::div(array(
                'class' => $class_tr
            ), $checkbox_keeplogin->show($keeplogin) . html::label(array(
                'for' => 'rcmloginkeep'
            ), $this->gettext('device_private')));
        }
        $args['content'] = $input_task->show() . $input_action->show() . $input_timezone->show() . $input_url->show() . $login_div . html::div(array(
                'id' => 'formlogintable'
        ), html::div(array(
                'class' => $class_tr
        ), html::label(array(
                'for' => 'rcmloginuser'
        ), $this->rc->gettext('username'))) . html::div(array(
                'class' => $class_tr
        ), $input_login->show($username)) . html::div(null, html::label(array(
                'for' => 'rcmloginpwd'
        ), $this->rc->gettext('password'))) . html::div(null, $input_password->show()) . $keeplogin_html) . html::p(array(
                'class' => 'formbuttons'
        ), html::tag('input', array(
                'id' => 'rcmloginsubmit',
                'class' => 'button mainaction',
                'type' => 'submit',
                'value' => $this->rc->gettext('login')
        )));
      }
      else {
        $table = new html_table(array(
                'id' => 'formlogintable'
        ));
        $table->add_row(array(
                'class' => $class_tr
        ));
        $table->add(array(
                'class' => 'title'
        ), html::label(array(
                'for' => 'rcmloginuser'
        ), $this->rc->gettext('username')));
        $table->add(array(
                'class' => 'input'
        ), $input_login->show($username));
        $table->add_row();
        $table->add(array(
                'class' => 'title'
        ), html::label(array(
                'for' => 'rcmloginpwd'
        ), $this->rc->gettext('password')));
        $table->add(array(
                'class' => 'input'
        ), $input_password->show());
        $table->add_row(array(
                'class' => $class_tr
        ));
        if (!$this->rc->config->get('hide_keep_login_button', false)) {
            $table->add(array(
                'class' => 'input'
            ), $checkbox_keeplogin->show($keeplogin));
            $table->add(array(
                'class' => 'title'
            ), html::label(array(
                'for' => 'rcmloginkeep'
            ), $this->gettext('computer_private')));
        }

        $args['content'] = $input_task->show() . $input_action->show() . $input_timezone->show() . $input_url->show() . $login_div . $table->show() . html::p(array(
                'class' => 'formbuttons'
        ), html::tag('input', array(
                'id' => 'rcmloginsubmit',
                'class' => 'button mainaction',
                'type' => 'submit',
                'value' => $this->rc->gettext('login')
        )));
        if ($this->is_internal()) {
          $args['content'] .= html::div(array(), html::a(array(
                  "href" => "./changepassword/index.php"
          ), $this->gettext('no bal')));
        }
      }
    }

    return $args;
  }

  /**
   * ****** Cache data **********
   */
  /**
   * Récupère les informations LDAP de l'utilisateur depuis le cache
   *
   * @param string $username
   * @return array
   */
  public static function get_user_infos($username) {
    $cache = self::InitM2Cache();
    if (! isset($cache['users_infos'][$username])) {
      $cache = self::set_user_infos($username);
    }
    return $cache['users_infos'][$username];
  }
  /**
   * Génére le cache session en fonction des données LDAP
   *
   * @param string $username
   */
  private static function set_user_infos($username) {
    $cache = self::InitM2Cache();
    if (! isset($cache['users_infos'])) {
      $cache['users_infos'] = array();
    }
    if (strpos($username, '@') === false) {
      $cache['users_infos'][$username] = LibMelanie\Ldap\Ldap::GetUserInfos($username);
    }
    else {
      $cache['users_infos'][$username] = LibMelanie\Ldap\Ldap::GetUserInfosFromEmail($username);
    }    
    self::SetM2Cache($cache);
    return $cache;
  }
  /**
   * Récupère la liste des balp de l'utilisateur depuis le cache
   *
   * @param string $username
   * @return array Liste des balp de l'utilisateur
   */
  public static function get_user_balp($username) {
    $cache = self::InitM2Cache();
    if (! isset($cache['users_balp'][$username])) {
      $cache = self::set_user_balp($username);
    }
    return $cache['users_balp'][$username];
  }
  /**
   * Récupère la liste des balp avec des droits d'emission de l'utilisateur depuis le cache
   *
   * @param string $username
   * @return array Liste des balp de l'utilisateur
   */
  public static function get_user_balp_emission($username) {
    $cache = self::InitM2Cache();
    if (! isset($cache['users_balp'][$username])) {
      $cache = self::set_user_balp($username);
    }
    $balp_emission = array();
    if (is_array($cache['users_balp'][$username])) {
      foreach ($cache['users_balp'][$username] as $balp) {
        if (isset($balp['mineqmelpartages'])) {
          if (in_array("$username:G", $balp['mineqmelpartages']) || in_array("$username:C", $balp['mineqmelpartages'])) {
            $balp_emission[] = $balp;
          }
        }
      }
    }
    return $balp_emission;
  }
  /**
   * Récupère la liste des balp avec des droits gestionnaire de l'utilisateur depuis le cache
   *
   * @param string $username
   * @return array Liste des balp de l'utilisateur
   */
  public static function get_user_balp_gestionnaire($username) {
    $cache = self::InitM2Cache();
    if (! isset($cache['users_balp'][$username])) {
      $cache = self::set_user_balp($username);
    }
    if (! isset($cache['users_balp_gestionnaire'])) {
      $cache['users_balp_gestionnaire'] = array();
    }
    if (isset($cache['users_balp_gestionnaire'][$username])) {
      $balp_gestionnaire = $cache['users_balp_gestionnaire'][$username];
    }
    else {
      $balp_gestionnaire = array();
      if (is_array($cache['users_balp'][$username])) {
        foreach ($cache['users_balp'][$username] as $balp) {
          if (isset($balp['mineqmelpartages']) && in_array("$username:G", $balp['mineqmelpartages'])) {
            $uid = array_pop(explode('.-.', $balp['uid'][0]));
            $info = self::get_user_infos($uid);
            if (isset($info['mineqtypeentree']) && $info['mineqtypeentree'][0] != 'BALI' && $info['mineqtypeentree'][0] != 'BALA') {
              $balp_gestionnaire[] = $balp;
            }
          }
        }
      }
      $cache['users_balp_gestionnaire'][$username] = $balp_gestionnaire;
      self::SetM2Cache($cache);
    }
    return $balp_gestionnaire;
  }
  /**
   * Génére le cache session en fonction des données LDAP
   *
   * @param string $username
   */
  private static function set_user_balp($username) {
    $cache = self::InitM2Cache();
    if (! isset($cache['users_balp'])) {
      $cache['users_balp'] = array();
    }
    $cache['users_balp'][$username] = LibMelanie\Ldap\Ldap::GetUserBalPartagees($username);
    self::SetM2Cache($cache);
    return $cache;
  }
  /**
   * Initialisation du cache M2
   */
  public static function InitM2Cache() {
    if (! isset($_SESSION[self::CACHE_KEY])) {
      $_SESSION[self::CACHE_KEY] = array();
    }
    return $_SESSION[self::CACHE_KEY];
  }
  /**
   * Positionne le cache M2 en session
   *
   * @param array $cache
   */
  public static function SetM2Cache($cache) {
    $_SESSION[self::CACHE_KEY] = $cache;
  }

  /**
   * Récupère le username en fonction du compte dans l'url ou de la session
   *
   * @return string
   */
  public function get_username() {
    if (! isset($this->user_name))
      $this->set_user_properties();

    return $this->user_name;
  }
  /**
   * Récupère l'uid de la boite, sans l'objet de partage si c'est une boite partagée
   *
   * @return string
   */
  public function get_user_bal() {
    if (! isset($this->user_bal))
      $this->set_user_properties();

    return $this->user_bal;
  }
  /**
   * Récupère l'uid de l'objet de partage
   *
   * @return string
   */
  public function get_share_objet() {
    if (! isset($this->user_objet_share))
      $this->set_user_properties();

    return $this->user_objet_share;
  }
  /**
   * Récupère l'host de l'utilisateur
   *
   * @return string
   */
  public function get_host() {
    if (! isset($this->user_host))
      $this->set_user_properties();

    return $this->user_host;
  }
  /**
   * ****** PRIVATE *********
   */
  /**
   * Définition des propriétées de l'utilisateur
   */
  private function set_user_properties() {
    if (! empty($this->get_account)) {
      // Récupération du username depuis l'url
      $this->user_name = urldecode($this->get_account);
      $inf = explode('@', $this->user_name);
      $this->user_objet_share = $inf[0];
      $this->user_host = $inf[1];
      if (strpos($this->user_objet_share, '.-.') !== false) {
        $inf = explode('.-.', $this->user_objet_share);
        $this->user_bal = $inf[1];
      }
      else {
        $this->user_bal = $this->user_objet_share;
      }
    }
    else {
      // Récupération du username depuis la session
      $this->user_name = $this->rc->get_user_name();
      $this->user_objet_share = $this->rc->user->get_username('local');
      $this->user_host = $this->rc->user->get_username('host');
      $this->user_bal = $this->user_objet_share;
    }
  }
  /**
   * Permet de récupérer toutes les identités de l'utilisateur depuis le LDAP
   *
   * @return array
   */
  private function m2_list_identities() {
    // Récupération du username depuis la session
    $username = $this->rc->user->get_username();
    // Récupération des informations des boites en émissions
    $infos = self::get_user_balp_emission($username);
    $identities = array();
    unset($infos['count']);
    foreach ($infos as $i) {
      // MANTIS 3702: Utiliser mineqMelmailEmissionPR pour determiner l'adresse d'emission
      if (isset($i['mineqmelmailemissionpr'])) {
        $mails = $i['mineqmelmailemissionpr'];
        // MANTIS 3334: Gestion des adresses mail multiple pour les identités
        if ($i['mineqmelmailemission']['count'] > $mails['count']) {
          unset($mails['count']);
          unset($i['mineqmelmailemission']['count']);
          $mails = array_merge($mails, $i['mineqmelmailemission']);
        }
      }
      else {
        $mails = $i['mineqmelmailemission'];
      }
      unset($mails['count']);
      foreach ($mails as $email) {
        $identity = array();
        $identity['name'] = $this->m2_identity_shortname($i['cn'][0]);
        $identity['realname'] = $i['cn'][0];
        $identity['email'] = $email;
        $identity['uid'] = $i['uid'][0];
        $identities[strtolower($email)] = $identity;
      }
    }
    // Récupération des informations des boites personnelles
    $infos = LibMelanie\Ldap\LDAPMelanie::GetInformations($username);
    // MANTIS 3702: Utiliser mineqMelmailEmissionPR pour determiner l'adresse d'emission
    if (isset($infos['mineqmelmailemissionpr'])) {
      $mails = $infos['mineqmelmailemissionpr'];
      // MANTIS 3334: Gestion des adresses mail multiple pour les identités
      if ($infos['mineqmelmailemission']['count'] > $mails['count']) {
        unset($mails['count']);
        unset($infos['mineqmelmailemission']['count']);
        $mails = array_merge($mails, $infos['mineqmelmailemission']);
      }
    }
    else {
      $mails = $infos['mineqmelmailemission'];
    }
    unset($mails['count']);
    foreach ($mails as $email) {
      $identity = array();
      $cn = $infos['cn'][0];
      $identity['name'] = $cn;
      $identity['realname'] = $infos['cn'][0];
      $identity['email'] = $email;
      $identity['uid'] = $infos['uid'][0];
      $identity['standard'] = '1';
      $identities[strtolower($email)] = $identity;
    }
    // retourne la liste des identities
    return $identities;
  }
  /**
   * Génération du nom court de l'identité en fonction du nom
   *
   * @param string $name
   * @return string
   */
  private function m2_identity_shortname($name) {
    if (strpos($name, ' emis par ') !== false) {
      $name = explode(' emis par ', $name);
      $name = $name[0] . " (partagée)";
    }
    elseif (strpos($name, ' - ') !== false) {
      $name = explode(' - ', $name);
      $name = $name[0];
    }
    return $name;
  }

  /**
   * Modification des folders par défaut dans les préférences
   */
  private function set_defaults_folders() {
    global $CONFIG;
    /* PAMELA - Gestion des boites partagées */
    if (! empty($this->get_account) && strpos($this->get_share_objet(), '.-.') !== false) {
      $draft_mbox = "Boite partag&AOk-e/" . $this->get_user_bal() . "/Brouillons";
      $sent_mbox = "Boite partag&AOk-e/" . $this->get_user_bal() . "/&AMk-l&AOk-ments envoy&AOk-s";
      $junk_mbox = "Boite partag&AOk-e/" . $this->get_user_bal() . "/Ind&AOk-sirables";
      $trash_mbox = "Corbeille";

      $CONFIG['drafts_mbox'] = $draft_mbox;
      $CONFIG['sent_mbox'] = $sent_mbox;
      $CONFIG['junk_mbox'] = $junk_mbox;
      $CONFIG['trash_mbox'] = $trash_mbox;
      $this->rc->config->set('default_folders', array(
              $draft_mbox,
              $sent_mbox,
              $junk_mbox,
              $trash_mbox
      ));
    }
    else {
      $draft_mbox = "Brouillons";
      $sent_mbox = "&AMk-l&AOk-ments envoy&AOk-s";
      $junk_mbox = "Ind&AOk-sirables";
      $trash_mbox = "Corbeille";

      $CONFIG['drafts_mbox'] = $draft_mbox;
      $CONFIG['sent_mbox'] = $sent_mbox;
      $CONFIG['junk_mbox'] = $junk_mbox;
      $CONFIG['trash_mbox'] = $trash_mbox;
      $this->rc->config->set('default_folders', array(
              $draft_mbox,
              $sent_mbox,
              $junk_mbox,
              $trash_mbox
      ));
    }
  }
  /**
   * Défini si on est dans une instance interne ou extene de l'application
   * Permet la selection de la bonne url
   */
  private function is_internal() {
    return (! isset($_SERVER["HTTP_X_MINEQPROVENANCE"]) || strcasecmp($_SERVER["HTTP_X_MINEQPROVENANCE"], "intranet") === 0);
  }
  /**
   * Retourne l'adresse ip
   * @return string
   * @private
   */
  private function _get_address_ip() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
      $ip = $_SERVER['HTTP_CLIENT_IP'];
      $ip = "[".$_SERVER['REMOTE_ADDR']."]/[$ip]";
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
      $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
      $ip = "[".$_SERVER['REMOTE_ADDR']."]/[$ip]";
    } else {
      $ip = $_SERVER['REMOTE_ADDR'];
      $ip = "[$ip]/[".$_SERVER['REMOTE_ADDR']."]";
    }
    return $ip;
  }
}
