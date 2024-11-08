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
require_once 'lib/drivers/driver_mel.php';

class mel extends rcube_plugin
{

  static $VERSION = "Mél";

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
   * Stocke le _account passé en get
   *
   * @var string
   */
  public $get_account;
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
  function init()
  {
    $this->rc = rcmail::get_instance();
    // Mise à jour de la version
    include_once __DIR__ . '/../../version.php';
    self::$VERSION .= " " . Version::VERSION;
    // Définition des hooks
    $this->add_hook('login_after',          array($this, 'login_after'));
    $this->add_hook('user_create',          array($this, 'user_create'));
    $this->add_hook('m2_get_account',       array($this, 'm2_get_account'));
    $this->add_hook('smtp_connect',         array($this, 'smtp_connect'));
    $this->add_hook('preferences_list',     array($this, 'prefs_list'));
    $this->add_hook('preferences_save',     array($this, 'prefs_save'));
    $this->add_hook('identity_form',        array($this, 'identity_form'));
    $this->add_hook('identities_list',      array($this, 'identities_list'));
    $this->add_hook('identity_update',      array($this, 'identity_update'));
    $this->add_hook('message_before_send',  array($this, 'message_before_send'));
    $this->add_hook('imap_search_before', [$this, 'imap_search_before']);

    // Template
    $this->add_hook('template_object_loginform',  array($this, 'login_form'));
    $this->add_hook('template_object_version',    array($this, 'version'));

    // Command
    $this->register_action('plugin.set_current_page',       array($this, 'set_current_page'));

    // Chargement de l'account passé en Get
    if ($this->rc->task != 'mail') {
      $this->get_account = self::get_account();
    }
    // Chargement de l'ui
    $this->init_ui();

    // Require mel_helper
    $this->require_plugin('mel_helper');

    // Configurer les LOG de la librairie Mél
    $trace_log = function ($message) {
      $message = "[LibM2] $message";
      if (mel_logs::is(mel_logs::TRACE))
        mel_logs::get_instance()->log(mel_logs::TRACE, $message);
    };
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
    LibMelanie\Log\M2Log::InitTraceLog($trace_log);
    LibMelanie\Log\M2Log::InitDebugLog($debug_log);
    LibMelanie\Log\M2Log::InitInfoLog($info_log);
    LibMelanie\Log\M2Log::InitErrorLog($error_log);
  }

  /**
   * Initializes plugin's UI (localization, js script)
   */
  private function init_ui()
  {
    if ($this->ui_initialized) {
      return;
    }
    // load localization
    $this->add_texts('localization/', true);
    $this->include_script('mel.js');
    $this->include_stylesheet($this->local_skin_path() . '/mel.css');

    // Charge la configuration
    $this->load_config();

    // MANTIS 0006003: Problème pour convertir un mail en événement dans une ouverture par double clic
    if ($this->rc->task == 'mail' && $this->rc->action == 'show') {
      $this->rc->output->include_script('treelist.js');
    }

    // Définition du host
    $http_host = $this->rc->config->get('http_host');
    if (isset($http_host)) {
      $_SERVER['HTTP_HOST'] = $http_host;
    }

    // Default task
    $default_task = $this->rc->config->get('default_task', 'bureau');
    if ($default_task == 'portail') {
      // Problème avec le passage portail Mél web vers Bureau
      $default_task = 'bureau';
    }
    $this->rc->output->set_env('default_task', $default_task);

    // Use infinite scroll ?
    $this->rc->output->set_env('use_infinite_scroll', $this->rc->config->get('use_infinite_scroll', true));

    if (!$this->rc->config->get('hide_keep_login_button', false)) {
      // Keep login
      $this->rc->output->set_env('keep_login', isset($_SESSION['_keeplogin']) ? $_SESSION['_keeplogin'] : false);
    }

    // ajouter les boites partagées
    if ($this->api->output->type == 'html') {
      if ((!isset($_GET['_is_from']) || $_GET['_is_from'] != 'iframe')
        && !isset($_GET['_extwin'])
        && !isset($_GET['_framed'])
        && $this->rc->task != 'login'
        && $this->rc->task != 'logout'
      ) {
        if (driver_mel::gi()->getUser()->load(['lastname', 'firstname', 'email', 'service'])) {
          $this->rc->output->set_env('firstname', driver_mel::gi()->getUser()->firstname);
          $this->rc->output->set_env('lastname', driver_mel::gi()->getUser()->lastname);
          $this->rc->output->set_env('email', driver_mel::gi()->getUser()->email);
          $this->rc->output->set_env('service', self::format_service(driver_mel::gi()->getUser()->service));
        }
      }
      if ($this->rc->task == 'mail') {
        // 0005830: Bouton pour créer directement un dossier dans l'interface Courriel
        $content = html::tag('li', array(
          'role' => 'menuitem'
        ), $this->api->output->button(array(
          'label' => 'mel.menumanage_create_mailbox_folder',
          'type' => 'link',
          'class' => "create",
          'classact' => 'create active',
          'command' => 'window-edit-folder'
        )));
        $this->api->add_content($content, 'mailboxoptions');
        // Link to Settings/Folders
        $button_array = [
          'label' => 'mel.menumanageresources_mailboxes',
          'type' => 'link',
          "class" => "settings active",
          'classact' => 'settings active',
          'command' => 'plugin.mel_resources_bal'
        ];
        if ($this->rc->plugins->get_plugin('mel_metapage') !== null)
          $button_array["command"] = "mel_metapage_manage_mail_box";
        else
          $button_array["task"] = "settings";

        $content = html::tag('li', array(
          'role' => 'menuitem'
        ), $this->api->output->button($button_array));
        $this->api->add_content($content, 'mailboxoptions');

        if (in_array($this->rc->action, ['', 'index'])) {
          $container = 'messagelistfiltersmenu';
          $filters = ['all', 'unread', 'followed', 'labels', 'priority', 'attachment', 'noresponses'];
          //Filtres rapides
          foreach ($filters as $value) {
            $config = array(
              'name' => "quick-filter-$value",
              'class' => "quick-filter quick-filter-$value btn btn-secondary mel-button no-button-margin no-margin-button bckg true hoverable",
              'innerclass' => 'inner',
              'id' => "quick-filter-$value",//tb_label_popup
              'title' => "title-$value", // gets translated
              'type' => 'button-menuitem',
              'label' => "label-$value", // maybe put translated version of "Labels" here?
              'domain' => 'mel',
              'data-action' => $this->gettext("filter-data-action-$value")
            );

            switch ($value) {
              case 'all':
                $config['data-filter-start-enabled'] = true;
                $config['data-filter-default-filter'] = true;
                $config['data-filter-can-be-multiple'] = 'false';
                break;
              case 'labels':
                $config['data-filter-custom-action'] = 'trigger:quick-filter.labels';
                $config['data-filter-can-be-multiple'] = true;
                break;

              case 'priority':
                $config['data-filter-custom-action'] = 'trigger:quick-filter.priority';
                $config['data-filter-can-be-multiple'] = true;
                break;

              default:
              $config['data-filter-can-be-multiple'] = true;
                break;
            }

            $this->add_button($config, $container);
          }

          $this->include_script('mel_filters.js');
        }


      } else if ($this->rc->task == 'calendar') {
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
        $user = driver_mel::gi()->getUser();
        $user->load(['phonenumber', 'mobilephone', 'street', 'postalcode', 'locality']);

        $this->rc->output->set_env('user_appointment_pref', $user->getCalendarPreference("appointment_properties"));
        $this->rc->output->set_env('user_phone', isset($user->mobilephone) ? $user->mobilephone : $user->phonenumber);
        $this->rc->output->set_env('user_address', isset($user->street) ? $user->street . ' ' . $user->postalcode . ' ' . $user->locality : null);
      } else if ($this->rc->task == 'tasks') {
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
      } elseif ($this->rc->task == 'login' || $this->rc->task == 'logout') {
        $this->api->add_content(html::div(null, $this->gettext('login_footer')) . html::br() . html::div(null, $this->gettext('login from') . ucfirst($_SERVER["HTTP_X_MINEQPROVENANCE"])), 'loginfooter');
      }
      // Gestion du mot de passe trop ancien
      $passwordchange_title = '';
      if (
        !isset($_SESSION['plugin.show_password_change'])
        && $this->rc->task != 'login'
        && $this->rc->task != 'logout'
        && $this->rc->task != 'bnum'
        && $_GET['_is_from'] == 'iframe'
        && !$this->rc->output->get_env('ismobile')
        && driver_mel::get_instance()->isPasswordNeedsToChange($passwordchange_title)
      ) {
        $this->rc->output->set_env('passwordchange_title', $passwordchange_title);
        $this->rc->output->set_env('plugin.show_password_change', true);
      }
    }
    $this->ui_initialized = true;
  }

  /**
   * Force un account différent si besoin
   * @param string $_account
   */
  public function set_account($_account)
  {
    $this->get_account = $_account;
    $this->set_user_properties();
  }

  /**
   * Permet de récupérer l'account courant
   */
  public static function get_account()
  {
    if (isset($_POST['_account']) && !empty($_POST['_account'])) {
      $_account = trim(rcube_utils::get_input_value('_account', rcube_utils::INPUT_POST));
    } else {
      $_account = trim(rcube_utils::get_input_value('_account', rcube_utils::INPUT_GET));
    }
    return $_account;
  }

  /**
   * **** COMMANDS *****
   */
  /**
   * RAZ de la page courante
   */
  public function set_current_page()
  {
    $_SESSION['page'] = 1;
    $result = array(
      'action' => 'plugin.set_current_page'
    );
    echo json_encode($result);
    exit();
  }

  /**
   * ****** Version *****
   */
  /**
   * Supprimer la liste des serveurs
   */
  public function version($args)
  {
    $args['content'] = self::$VERSION;
    return $args;
  }

  /**
   * *** HOOKS *****
   */
  /**
   * Sets defaults for new user.
   */
  public function user_create($args)
  {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "mel::user_create()");

    $user = driver_mel::gi()->getUser($args['user']);
    // Récupération du hostname
    $hostname = driver_mel::get_instance()->getRoutage($user, 'user_create');
    if (isset($hostname)) {
      $args['host'] = $hostname;
    }

    // Default user name
    $args['user_name'] = $user->fullname;
    $args['user_email'] = $user->email_send;
    if (mel_logs::is(mel_logs::INFO))
      mel_logs::get_instance()->log(mel_logs::INFO, "[user_create] Création de l'utilisateur '" . $args['user_name'] . "@" . $args['host'] . "' dans la base de données Roundcube");

    // Test du calendrier
    $calendar = $user->getDefaultCalendar();
    if (!isset($calendar)) {
      $user->createDefaultCalendar($this->rc->config->get('default_calendar_name', null));
    }
    // Test du carnet d'adresses
    $addressbook = $user->getDefaultAddressbook();
    if (!isset($addressbook)) {
      $user->createDefaultAddressbook($this->rc->config->get('default_addressbook_name', null));
    }
    // Test de la liste de tâches
    $taskslist = $user->getDefaultTaskslist();
    if (!isset($taskslist)) {
      $user->createDefaultTaskslist($this->rc->config->get('default_taskslist_name', null));
    }
    return $args;
  }

  /**
   * Connect to smtp
   * Utilise les identifiants de la balp si nécessaire
   */
  public function smtp_connect($args)
  {
    if (!empty($_SESSION['m2_from_identity'])) {
      if (mel_logs::is(mel_logs::DEBUG))
        mel_logs::get_instance()->log(mel_logs::DEBUG, "mel::smtp_connect()");
      if (!empty($_SESSION['m2_uid_identity'])) {
        $args['smtp_user'] = $_SESSION['m2_uid_identity'];
      } else {
        $user = driver_mel::gi()->user();
        $user->email = $_SESSION['m2_from_identity'];
        if ($user->load(['uid'])) {
          $args['smtp_user'] = $user->uid;
        }
      }
    }
    return $args;
  }

  /**
   * After login user
   * Gestion des identités
   */
  public function login_after($args)
  {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "mel::login_after()");

    if (isset($_GET['_goto_task'])) {
      $args['_task'] = trim(rcube_utils::get_input_value('_goto_task', rcube_utils::INPUT_GET));
    } else if ($args['_task'] == 'mail') {
      $args['_task'] = $this->rc->config->get('default_task', 'bureau');
      if ($args['_task'] == 'portail') {
        // Problème avec le passage portail Mél web vers Bureau
        $args['_task'] = 'bureau';
      }
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
        if ($rc_i['standard'] != $m2_i['standard'] || $rc_i['email'] != $m2_i['email'] || $rc_i['realname'] != $m2_i['realname'] || $rc_i['uid'] != $m2_i['uid']) {
          $rc_i['email'] = $m2_i['email'];
          $rc_i['standard'] = $m2_i['standard'];
          // Test si le nom n'a pas été modifié par l'utilisateur
          if ($this->m2_identity_shortname($rc_i['realname']) == $rc_i['name'])
            $rc_i['name'] = $m2_i['name'];
          $rc_i['realname'] = $m2_i['realname'];
          $rc_i['uid'] = $m2_i['uid'];
          $update_identities[$rc_i['identity_id']] = $m2_i;
        }
        else if (empty(trim($rc_i['name']))) {
          $update_identities[$rc_i['identity_id']] = ['name' => $m2_i['name']];
        }
        // Vide le tableau pour lister ensuite les identities à créer
        unset($m2_identities[strtolower($rc_i['email'])]);
      } else {
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
   * ** IMAP ***
   */

  /**
   * Retoune le compte passé dans l'url
   *
   * @return string Account
   */
  public function m2_get_account($args = [])
  {
    if (mel_logs::is(mel_logs::DEBUG)) {
      mel_logs::get_instance()->log(mel_logs::DEBUG, "mel::m2_get_account()");
    }

    if (!isset($this->get_account) && $this->rc->task == 'mail' && $this->rc->action == '') {
      if (mel_logs::is(mel_logs::DEBUG)) {
        mel_logs::get_instance()->log(mel_logs::DEBUG, "mel::m2_get_account() cache problem folder");
      }
    }
    else if (!isset($this->get_account) && isset($args['folder']) && strpos($args['folder'], driver_mel::gi()->getBalpLabel()) === 0) {
      $bal = driver_mel::gi()->user();
      $bal->uid = str_replace(driver_mel::gi()->getBalpLabel() . $_SESSION['imap_delimiter'], '', $args['folder']);
      $bal->load();
      $uid = driver_mel::gi()->getUser()->uid . driver_mel::gi()->objectShareDelimiter() . $bal->uid;
      $this->set_account(urlencode($uid) . '@' . driver_mel::gi()->getRoutage($bal, 'm2_get_account'));
    }


    return array(
      "account" => $this->get_account
    );
  }

  public function imap_search_before($args)
  {

    if (is_array($args['folder'])) {
      $isBalp = false;
      $bal = driver_mel::gi()->user();
      foreach ($args['folder'] as $key => $value) {
        if (strpos($value, driver_mel::gi()->getBalpLabel()) === 0) {
          $bal->uid = str_replace(driver_mel::gi()->getBalpLabel() . $_SESSION['imap_delimiter'], '', $value);
          if ($bal->load()) {
            $isBalp = true;
            $hostname = driver_mel::gi()->getRoutage($bal, 'imap_search_before');
            $uid = driver_mel::gi()->getUser()->uid . driver_mel::gi()->objectShareDelimiter() . $bal->uid;
            $this->rc->storage->connect(
              $hostname,
              $uid,
              $this->rc->decrypt($_SESSION['password']),
              $_SESSION['storage_port'],
              $_SESSION['storage_ssl']
            );
            break;
          }
        }
      }

      if ($isBalp) {
        foreach ($args['folder'] as $key => $value) {
          if (strpos($value, driver_mel::gi()->getBalpLabel()) !== 0) {
            unset($args['folder'][$key]);
          }
        }
      }
    }

    return $args;
  }

  /**
   * Handler for user preferences form (preferences_list hook)
   */
  function prefs_list($args)
  {
    if ($args['section'] == 'general') {
      // Load localization and configuration
      $this->add_texts('localization/');

      // Check that configuration is not disabled
      $dont_override = (array)$this->rc->config->get('dont_override', array());

      $key = 'mel_default_task';
      if (!in_array($key, $dont_override)) {
        $config_key = 'default_task';
        $field_id = "_" . $key;
        $value = $this->rc->config->get($config_key, 'mail');
        $input = new html_select(array(
          'name' => $field_id,
          'id' => $field_id,
        ));
        $list_tasks = $this->rc->config->get('list_tasks', ['mail', 'addressbook', 'settings']);
        foreach ($list_tasks as $task) {
          $input->add($this->gettext($task), $task);
        }

        $args['blocks']['main']['options'][$key] = array(
          'title' => html::label($field_id, rcube::Q($this->gettext($key))),
          'content' => $input->show($value),
        );
      }
    }
    return $args;
  }

  /**
   * Handler for user preferences save (preferences_save hook)
   */
  public function prefs_save($args)
  {
    if ($args['section'] == 'general') {
      // Check that configuration is not disabled
      $dont_override = (array) $this->rc->config->get('dont_override', array());
      $key = 'mel_default_task';
      if (!in_array($key, $dont_override)) {
        $config_key = 'default_task';
        $args['prefs'][$config_key] = rcube_utils::get_input_value('_' . $key, rcube_utils::INPUT_POST);
      }
    } else if ($args['section'] == 'mailbox') {
      // Check that configuration is not disabled
      $dont_override = (array) $this->rc->config->get('dont_override', array());
      $key = 'mel_use_infinite_scroll';
      if (!in_array($key, $dont_override)) {
        $config_key = 'use_infinite_scroll';
        $args['prefs'][$config_key] = rcube_utils::get_input_value('_' . $key, rcube_utils::INPUT_POST) ? true : false;
      }
    }
    return $args;
  }

  /**
   * Handler for user identity edit form
   */
  public function identity_form($args)
  {
    if (mel_logs::is(mel_logs::TRACE)) {
      mel_logs::get_instance()->log(mel_logs::TRACE, "mel::identity_form() args : " . var_export($args, true));
    }
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
  public function identities_list($args)
  {
    if (mel_logs::is(mel_logs::TRACE)) {
      mel_logs::get_instance()->log(mel_logs::TRACE, "mel::identities_list() args : " . var_export($args, true));
    }
    $args['cols'][0] = 'name';
    return $args;
  }

  /**
   * Handler for user identity update
   */
  public function identity_update($args)
  {
    if (mel_logs::is(mel_logs::TRACE)) {
      mel_logs::get_instance()->log(mel_logs::TRACE, "mel::identity_update() args : " . var_export($args, true));
    }
    $args['record']['standard'] = strtolower(driver_mel::gi()->getUser()->email_send) == strtolower($args['record']['email']) ? 1 : 0;
    return $args;
  }

  /**
   * Ajout des headers dans le message via le driver mel
   */
  public function message_before_send($args)
  {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::gi()->l(mel_logs::DEBUG, "mel::message_before_send()");

    $headers = driver_mel::gi()->setHeadersMessageBeforeSend([]);
    if (count($headers)) {
      $args['message']->headers($headers, true);
    }

    return $args;
  }

  /**
   * *** LOGIN ****
   */
  /**
   * Supprimer la liste des serveurs
   */
  public function login_form($args)
  {
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
    } else {
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
      $input_class = (($this->rc->config->get('skin') == 'mel_elastic' || $this->rc->config->get('skin') == 'elastic') ? "form-control" : "");
      $input_login = new html_inputfield(array(
        'name' => '_user',
        'id' => 'rcmloginuser',
        'size' => '40',
        'autocapitalize' => 'off',
        'autocomplete' => 'on',
        "class" => $input_class
      ));
      $input_password = new html_passwordfield(array(
        'name' => '_pass',
        'id' => 'rcmloginpwd',
        'size' => '40',
        'autocapitalize' => 'off',
        'autocomplete' => 'off',
        'class' => $input_class
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
        } else {
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
      } else if (isset($_POST['_keeplogin']) && !$this->rc->config->get('hide_keep_login_button', false)) {
        $keeplogin = "keeplogin";
      }

      if ($this->rc->output->get_env('ismobile')) {
        if ($this->rc->config->get('hide_keep_login_button', false)) {
          $keeplogin_html = '';
        } else {
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
        ), html::tag('button', array(
          'id' => 'rcmloginsubmit',
          'class' => 'button mainaction',
          'type' => 'submit',
          'value' => $this->rc->gettext('login')
        ), $this->rc->gettext('login')));
      } else {
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
        ), html::tag('button', array(
          'id' => 'rcmloginsubmit',
          'class' => 'button mainaction',
          'type' => 'submit',
          'value' => $this->rc->gettext('login')
        ), $this->rc->gettext('login')));
        // Mot de passe oublié pour les externes
        if ($this->rc->config->get('enable_external_users', false)) {
          $args['content'] .= html::div(array('id' => 'bali-reset-password'), html::a(array(
            "href" => "./public/forgotten/"
          ), $this->gettext('password forgotten')));
        }
        else if ($this->rc->config->get('show_no_bal_message', true) && mel::is_internal()) {
          $args['content'] .= html::div(array('id' => 'bali-reset-password'), html::a(array(
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
   * Initialisation du cache en session
   */
  protected static function _InitSessionCache()
  {
    if (!isset($_SESSION[self::CACHE_KEY])) {
      $_SESSION[self::CACHE_KEY] = array();
    }
    return $_SESSION[self::CACHE_KEY];
  }

  /**
   * Positionne le cache en session
   *
   * @param array $cache
   */
  protected static function _SetSessionCache($cache)
  {
    $_SESSION[self::CACHE_KEY] = $cache;
  }

  /**
   * Positionne en cache la valeur
   * 
   * @param string $key Identifiant du cache
   * @param string|array $value Valeur a stocker en cache
   * @param boolean $reset RAZ du timer de cache (defaut false)
   * @param int $duration [Optionnel] Durée du cache pour cette clé
   */
  public static function setCache($key, &$value, $reset = false, $duration = null)
  {
    $cache = self::_InitSessionCache();
    if (!isset($duration)) {
      $default_duration = rcmail::get_instance()->config->get("cache_default-duration", 300);
      $duration = rcmail::get_instance()->config->get("cache_$key-duration", $default_duration);
    }
    if (!$reset && isset($cache[$key])) {
      $cache[$key]['value'] = serialize($value);
    } else {
      $cache[$key] = [
        'expire'  => time() + $duration,
        'value' => serialize($value),
      ];
    }
    self::_SetSessionCache($cache);
  }

  /**
   * Le cache est-il toujours positionné ?
   * 
   * @param string $key Identifiant du cache
   * 
   * @return boolean
   */
  public static function issetCache($key)
  {
    $cache = self::_InitSessionCache();
    if (isset($cache[$key]) && isset($cache[$key]['expire']) && $cache[$key]['expire'] > time()) {
      return true;
    } else if (isset($cache[$key])) {
      unset($cache[$key]);
      self::_SetSessionCache($cache);
    }
    return false;
  }

  /**
   * Récupère la valeur en cache
   * 
   * @param $key Identifiant du cache
   * 
   * @return mixed $value, null si non trouvée
   */
  public static function &getCache($key)
  {
    $cache = self::_InitSessionCache();
    if (isset($cache[$key]) && isset($cache[$key]['expire']) && $cache[$key]['expire'] > time()) {
      $ret = unserialize($cache[$key]['value']);
      if ($ret !== false) {
        return $ret;
      }
    } else if (isset($cache[$key])) {
      unset($cache[$key]);
      self::_SetSessionCache($cache);
    }
    return null;
  }

  /**
   * Supprime la valeur en cache
   * 
   * @param $key Identifiant du cache
   */
  public static function unsetCache($key)
  {
    $cache = self::_InitSessionCache();
    if (isset($cache[$key])) {
      unset($cache[$key]);
      self::_SetSessionCache($cache);
    }
  }

  /**
   * Récupère le username en fonction du compte dans l'url ou de la session
   *
   * @return string
   */
  public function get_username()
  {
    if (!isset($this->user_name)) {
      $this->set_user_properties();
    }
    return $this->user_name;
  }
  /**
   * Récupère l'uid de la boite, sans l'objet de partage si c'est une boite partagée
   *
   * @return string
   */
  public function get_user_bal()
  {
    if (!isset($this->user_bal)) {
      $this->set_user_properties();
    }
    return $this->user_bal;
  }
  /**
   * Récupère l'uid de l'objet de partage
   *
   * @return string
   */
  public function get_share_objet()
  {
    if (!isset($this->user_objet_share)) {
      $this->set_user_properties();
    }
    return $this->user_objet_share;
  }
  /**
   * Positionne l'uid de l'objet de partage
   *
   * @param string $share_objet
   * @return string
   */
  public function set_share_objet($share_objet)
  {
    $this->user_objet_share = $share_objet;
  }
  /**
   * Récupère l'host de l'utilisateur
   *
   * @return string
   */
  public function get_host()
  {
    if (!isset($this->user_host)) {
      $this->set_user_properties();
    }
    return $this->user_host;
  }
  /**
   * Force le host de l'utilisateur
   *
   * @param string $host
   * @return string
   */
  public function set_host($host)
  {
    $this->user_host = $host;
  }
  /**
   * ****** PRIVATE *********
   */
  /**
   * Définition des propriétées de l'utilisateur
   */
  private function set_user_properties()
  {
    if (!empty($this->get_account) && $this->get_account != $this->rc->get_user_name()) {
      // Récupération du username depuis l'url
      $this->user_name = urldecode($this->get_account);
      list($user_object_share, $user_host, $user_bal) = driver_mel::gi()->getShareUserBalpHostFromMail($this->user_name);
      $this->user_objet_share = $user_object_share;
      $this->user_host = $user_host;
      $this->user_bal = $user_bal;
      $user = driver_mel::gi()->getUser($this->user_objet_share, false);
      if ($user->is_objectshare) {
        $this->user_bal = $user->objectshare->mailbox_uid;
      } else {
        $this->user_bal = $this->user_objet_share;
      }
    } else {
      // Récupération du username depuis la session
      list($user_object_share, $user_host, $user_bal) = driver_mel::gi()->getShareUserBalpHostFromSession();
      $this->user_name = $this->rc->get_user_name();
      $this->user_objet_share = $user_object_share;
      $this->user_host = $user_host;
      $this->user_bal = $user_bal;
    }
  }
  /**
   * Permet de récupérer toutes les identités de l'utilisateur depuis le LDAP
   *
   * @return array
   */
  private function m2_list_identities()
  {
    $user = driver_mel::gi()->getUser();
    $_objects = $user->getObjectsSharedEmission();
    $identities = [];
    foreach ($_objects as $_object) {
      // Si on a un mail principal
      if (isset($_object->email_send) && !empty($_object->email_send)) {
        $mails = [$_object->email_send];
        // Si on a une liste de mail en plus du principal
        if (isset($_object->email_send_list) && count($_object->email_send_list) > 1) {
          array_merge($mails, $_object->email_send_list);
        }
      }
      // Sinon on utilise la liste
      else if (isset($_object->email_send_list) && !empty($_object->email_send_list)) {
        $mails = $_object->email_send_list;
      }
      foreach ($mails as $email) {
        $identity = [];
        $identity['name'] = $this->m2_identity_shortname($_object->fullname);
        $identity['realname'] = $_object->fullname;
        $identity['email'] = strtolower($email);
        $identity['uid'] = $_object->uid;
        $identity['standard'] = 0;
        $identities[strtolower($email)] = $identity;
      }
    }
    // Récuperation des information de l'utilisateur
    // Si on a un mail principal
    if (isset($user->email_send) && !empty($user->email_send)) {
      $mails = [$user->email_send];
      // Si on a une liste de mail en plus du principal
      if (isset($user->email_send_list) && count($user->email_send_list) > 1) {
        $mails = array_unique(array_merge($mails, $user->email_send_list));
      }
    }
    // Sinon on utilise la liste
    else if (isset($user->email_send_list) && !empty($user->email_send_list)) {
      $mails = $user->email_send_list;
    }
    foreach ($mails as $email) {
      $identity = [];
      $identity['name'] = $user->fullname;
      $identity['realname'] = $user->fullname;
      $identity['email'] = strtolower($email);
      $identity['uid'] = $user->uid;
      $identity['standard'] = $email == $user->email_send ? 1 : 0;
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
  private function m2_identity_shortname($name)
  {
    if (strpos($name, ' emis par ') !== false) {
      $name = explode(' emis par ', $name);
      $name = $name[0] . " (partagée)";
    } elseif (strpos($name, ' - ') !== false) {
      $name = explode(' - ', $name);
      $name = $name[0];
    }
    return $name;
  }

  /**
   * Définit si on est dans une instance interne ou externe de l'application
   * Permet la selection de la bonne url
   * 
   * @return boolean
   */
  public static function is_internal()
  {
    if (isset($_GET['internet'])) {
      return false;
    }

    return rcmail::get_instance()->config->get('is_internal', false);
  }

  /**
   * Définit si on est dans une situation où l'auth est assez forte
   * Permet de ne pas déclencher la double auth, ou d'accéder à stockage via internet
   * 
   * @return boolean
   */
  public static function is_auth_strong()
  {
    $eidas = $_SESSION['eidas'];
    //$cookie_eidas = explode('###', $_COOKIE['eidas'])[1];

    return mel::is_internal() // Connexion intranet
      || $eidas == "eidas2" // Cerbère 2FA (MelOTP, Yubikey, clé U2F)
      || $eidas == "eidas3"; // Cerbère Certif (logiciel RGS1, carte à puce RGS3)
  }

  /**
   * Retourne l'adresse ip
   * @return string
   * @private
   */
  private function _get_address_ip()
  {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
      $ip = $_SERVER['HTTP_CLIENT_IP'];
      $ip = "[" . $_SERVER['REMOTE_ADDR'] . "]/[$ip]";
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
      $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
      $ip = "[" . $_SERVER['REMOTE_ADDR'] . "]/[$ip]";
    } else {
      $ip = $_SERVER['REMOTE_ADDR'];
      $ip = "[$ip]/[" . $_SERVER['REMOTE_ADDR'] . "]";
    }
    return $ip;
  }

  /**
   * Format l'affichage du service pour la barre d'utilisateur
   * @return string
   * @private
   */
  private function format_service($service)
  {
    if (strstr($service, '/')) {
      $split_service = explode('/', $service);
      $service = implode('/', array_slice($split_service, -3, 3, true));
    }
    return $service;
  }
}
