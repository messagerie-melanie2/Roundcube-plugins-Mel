<?php
/**
 * Plugin Mél Moncompte
 * 
 * plugin mel_moncompte pour roundcube
 * 
 * Permet de gérer ses informations de compte Mél
 * D'afficher et partager ses ressources Mél (boites mail, agendas, contacts, tâches)
 * D'afficher les statistiques de synchronisation
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

// Chargement de la librairie ORM
@include_once 'includes/libm2.php';

// Chargement des classes externes
include_once 'ressources/calendar.php';
include_once 'ressources/contacts.php';
include_once 'ressources/mailbox.php';
include_once 'ressources/tasks.php';
include_once 'moncompte/moncompte.php';
include_once 'statistiques/mobile.php';

class mel_moncompte extends rcube_plugin {
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
   * Mapping for old actions used by Courrielleur
   * @var array
   */
  private $old_actions_mapping = [
      'plugin.melanie2_moncompte'           => 'plugin.mel_moncompte',
      'plugin.melanie2_resources_bal'       => 'plugin.mel_resources_bal',
      'plugin.melanie2_resources_agendas'   => 'plugin.mel_resources_agendas',
      'plugin.melanie2_resources_contacts'  => 'plugin.mel_resources_contacts',
      'plugin.melanie2_resources_tasks'     => 'plugin.mel_resources_tasks',
  ];

  /**
   * Initialisation du plugin
   *
   * @see rcube_plugin::init()
   */
  public function init() {
    $this->rc = rcmail::get_instance();

    // Restauration calendrier
    $sql_n = rcube_utils::get_input_value('joursvg', rcube_utils::INPUT_GET);

    if (isset($sql_n)) {
      LibMelanie\Config\ConfigSQL::setCurrentBackend($sql_n);
    }

    // Chargement de l'ui
    $this->init_ui();
  }

  /**
   * Initializes plugin's UI (localization, js script)
   */
  private function init_ui() {
    if ($this->ui_initialized) {
      return;
    }
    // Redirect old actions to new one
    if (isset($this->old_actions_mapping[$this->rc->action])) {
      $this->rc->output->redirect(['action' => $this->old_actions_mapping[$this->rc->action]]);
    }
    // Chargement de la conf
    $this->load_config();

    // load localization
    $this->add_texts('localization/', true);
    $this->include_script('moncompte.js');

    if ($this->api->output->type == 'html') {
      // Link to Settings/Mon compte
      $content = html::tag('li', ['id' => 'useroptionsitemmoncompte'],
      $this->api->output->button(array(
            'label'    => 'mel_moncompte.moncompte',
            'type'     => 'link',
            'classact' => 'active',
            'command'  => 'plugin.mel_moncompte',
            'task'     => 'settings',
      )));
      $this->api->add_content($content, 'useroptionsitems');
    }

    if ($this->rc->config->get('enable_moncompte', true)) {
        // Ajout des boutons
        if ($this->rc->config->get('ismobile', false)) {
            $this->include_stylesheet('skins/mel_larry_mobile/mel.css');
            $this->api->add_content(
                    html::tag('a',
                            array(
                                            "id" => "rcmbtn210",
                                            "class" => "button-mel_moncompte ui-link ui-btn ui-corner-all ui-icon-briefcase ui-btn-icon-left",
                                            "data-ajax" => "false",
                                            "href" => "./?_task=settings&_action=plugin.mel_moncompte",
                                            "style" => "position: relative;"),
                            html::tag('span', array("class" => "button-inner"),
                                    $this->gettext('moncompte'))),
                    'taskbar_mobile');
                                    
                                    $this->add_hook('settings_actions', array($this, 'settings_actions'));
        }
        else {
            $this->include_stylesheet($this->local_skin_path() . '/mel.css');
            $this->api->add_content(
                    html::tag('a',
                            array(
                                            "id" => "rcmbtn210",
                                            "class" => "button-mel_moncompte hidden",
                                            "href" => "./?_task=settings&_action=plugin.mel_moncompte",
                                            "style" => "position: relative;"),
                            html::tag('span', array("class" => "button-inner"),
                                    $this->gettext('moncompte'))),
                    'taskbar');
        }
    }
    else {
        if ($this->rc->config->get('ismobile', false)) {
            $this->include_stylesheet('skins/mel_larry_mobile/mel.css');
        }
        else {
            $this->include_stylesheet($this->local_skin_path() . '/mel.css');
        }
    }

    if ($this->rc->task == 'settings') {
      // bloquer les refresh
      $this->rc->output->set_env('refresh_interval', 0);
      
      // Ajouter la configuration dans l'environnement
      $this->rc->output->set_env('enable_moncompte',            $this->rc->config->get('enable_moncompte', true));
      $this->rc->output->set_env('enable_mesressources',        $this->rc->config->get('enable_mesressources', true));
      $this->rc->output->set_env('enable_mesressources_mail',   $this->rc->config->get('enable_mesressources_mail', true));
      $this->rc->output->set_env('enable_mesressources_cal',    $this->rc->config->get('enable_mesressources_cal', true));
      $this->rc->output->set_env('enable_mesressources_addr',   $this->rc->config->get('enable_mesressources_addr', true));
      $this->rc->output->set_env('enable_mesressources_task',   $this->rc->config->get('enable_mesressources_task', true));
      $this->rc->output->set_env('enable_messtatistiques',      $this->rc->config->get('enable_messtatistiques', true));
      $this->rc->output->set_env('enable_messtatistiques_mobile', $this->rc->config->get('enable_messtatistiques_mobile', true));

      // http post actions
      $this->register_action('plugin.hide_resource_roundcube',  array($this,'hide_resource_roundcube'));
      $this->register_action('plugin.show_resource_roundcube',  array($this,'show_resource_roundcube'));
      $this->register_action('plugin.sort_resource_roundcube',  array($this,'sort_resource_roundcube'));
      $this->register_action('plugin.synchro_on_mobile',        array($this,'synchro_on_mobile'));
      $this->register_action('plugin.no_synchro_on_mobile',     array($this,'no_synchro_on_mobile'));
      $this->register_action('plugin.invitation',               array($this,'invitation'));
      $this->register_action('plugin.no_invitation',            array($this,'no_invitation'));
      $this->register_action('plugin.set_default_resource',     array($this,'set_default_resource'));
      $this->register_action('plugin.ressources_calendar_agendas_tri_alpha', [$this, 'ressources_calendar_agendas_tri_alpha']);

      // register actions
      $this->register_action('plugin.mel_resources_bal', array($this,'resources_bal_init'));
      $this->register_action('plugin.mel_resources_agendas', array($this,'resources_agendas_init'));
      $this->register_action('plugin.mel_resources_contacts', array($this,'resources_contacts_init'));
      $this->register_action('plugin.mel_resources_tasks', array($this,'resources_tasks_init'));
      
      $this->register_action('plugin.melanie2_resources_bal', array($this,'resources_bal_init'));
      $this->register_action('plugin.melanie2_resources_agendas', array($this,'resources_agendas_init'));
      $this->register_action('plugin.melanie2_resources_contacts', array($this,'resources_contacts_init'));
      $this->register_action('plugin.melanie2_resources_tasks', array($this,'resources_tasks_init'));

      $this->register_action('plugin.mel_moncompte', array(new Moncompte($this),'init'));
      $this->register_action('plugin.melanie2_moncompte', array(new Moncompte($this),'init'));

      $this->register_action('plugin.mel_statistics_mobile', array(new Mobile_Stats($this),'init'));
      $this->register_action('plugin.statistics.zpush_command', array(new Mobile_Stats($this),"zpush_command"));

      $this->register_action('plugin.mel_mailbox_acl', array(new M2mailbox($this->rc->user->get_username()),'acl_template'));

      $this->register_action('plugin.mel_calendar_acl', array(new M2calendar($this->get_user_bal()),'acl_template'));
      $this->register_action('plugin.mel_calendar_acl_group', array(new M2calendargroup($this->get_user_bal()),'acl_template'));

      $this->register_action('plugin.mel_contacts_acl', array(new M2contacts($this->get_user_bal()),'acl_template'));
      $this->register_action('plugin.mel_contacts_acl_group', array(new M2contactsgroup($this->get_user_bal()),'acl_template'));

      $this->register_action('plugin.mel_tasks_acl', array(new M2tasks($this->get_user_bal()),'acl_template'));
      $this->register_action('plugin.mel_tasks_acl_group', array(new M2tasksgroup($this->get_user_bal()),'acl_template'));

      // add / delete ressources
      $this->register_action('plugin.mel_add_resource', array($this,'add_resource'));
      $this->register_action('plugin.mel_delete_resource', array($this,'delete_resource'));

      // Gestion des listes
      include_once 'moncompte/Gestionnairelistes.php';
      $this->register_action('plugin.listes_membres', array('Gestionnairelistes','readListeMembers'));
      $this->register_action('plugin.listes_add_externe', array('Gestionnairelistes','addExterneMember'));
      $this->register_action('plugin.listes_remove', array('Gestionnairelistes','RemoveMember'));
      $this->register_action('plugin.listes_remove_all', array('Gestionnairelistes','RemoveAllMembers'));
      $this->register_action('plugin.listes_export', array('Gestionnairelistes','ExportMembers'));
      $this->register_action('plugin.listes_upload_csv', array('Gestionnairelistes','uploadCSVMembers'));
    }

    if (in_array($this->rc->task, ['bnum', 'chat', 'webconf'])) {
      include_once "moncompte/Gestionnaireabsence.php";
      $this->register_action('plugin.abs.get_dates', array('Gestionnaireabsence','get_ponctual_dates'));
      $this->register_action('plugin.abs.set_dates', array('Gestionnaireabsence','set_quick_ponctual_dates'));
    }

    $this->ui_initialized = true;
  }

  /**
   * Adds Mon compte section in Settings
   */
  function settings_actions($args)
  {
      $args['actions'][] = array(
              'action' => 'plugin.mel_moncompte',
              'class'  => 'mel moncompte',
              'label'  => 'moncompte',
              'domain' => 'mel_moncompte',
              'title'  => 'managemoncompte',
      );

    return $args;
  }

  /**
   * ****** ACTIONS ******
   */
  /**
   * Initialisation du menu ressources pour les Bal
   * Affichage du template et gestion de la sélection
   */
  public function resources_bal_init() {
    $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
    if (isset($id)) {
      $id = driver_mel::gi()->rcToMceId($id);
      // Récupère l'utilisateur
      $user = driver_mel::gi()->getUser($id, false);
      if ($user->is_objectshare) {
        // Si on est dans un objet de partage
        // Ce n'est pas normal donc on recupère le user associé
        $user = driver_mel::gi()->getUser($user->objectshare->mailbox_uid);
      }
      else {
        $user->load();
      }
      // Utilisateur courant
      $currentUser = $this->rc->get_user_name();
      $shared = false;
      if ($currentUser == $user->uid || $user->shares[$currentUser]->type == LibMelanie\Api\Defaut\Users\Share::TYPE_ADMIN) {
        // Si on est gestionnaire
        $acl = $this->gettext('gestionnaire');
        // Les boites individuelles et applicatives ne sont pas des vrais partages, le repartage est donc bloqué. A voir si on passe ça en Driver
        $shared = $currentUser == $user->uid || (!$user->is_individuelle && !$user->is_applicative);
        // hack tordu pour GN, j'ignore comment mieux gérer finement l'affichage ou non d'un tableau
        if ($user->is_individuelle && !$user->is_objectshare && !$this->rc->config->get('enable_mesressources_bal_share', true)) {
            $shared = false;
        }
      }
      else {
        // Si pas gestionnaire on cherche le bon droit a afficher
        switch ($user->shares[$currentUser]->type) {
          case LibMelanie\Api\Defaut\Users\Share::TYPE_SEND:
            $acl = $this->gettext('send');
            break;
          case LibMelanie\Api\Defaut\Users\Share::TYPE_WRITE:
            $acl = $this->gettext('write');
            break;
          default:
          case LibMelanie\Api\Defaut\Users\Share::TYPE_READ:
            $acl = $this->gettext('read_only');
            break;
        }
      }
      $this->rc->output->set_env("resource_id", $id);
      $this->rc->output->set_env("resource_name", $user->fullname);
      $this->rc->output->set_env("resource_type", $user->type);
      $this->rc->output->set_env("resource_shared", !$shared);
      $this->rc->output->set_env("resource_acl", $acl);
      if ($shared) {
        $this->rc->output->add_handler('usersaclframe', array(new M2mailbox($this->rc->user->get_username()),'acl_frame'));
        $this->rc->output->add_handler('restore_bal', array(new M2mailbox($this->rc->user->get_username()),'restore_bal'));
        $this->rc->output->add_handler('get_restorable_directories', array(new M2mailbox($this->rc->user->get_username()),'get_restorable_directories'));
        $this->rc->output->add_handler('get_available_size', array(new M2mailbox($this->rc->user->get_username()),'get_available_size'));
        $this->rc->output->add_handler('restore_bal_expl', array($this ,'restore_bal_expl'));

        if (isset($_POST['restore_dir'])) {
          M2mailbox::restore_dir();
        }
        if (isset($_POST['folder']) && isset($_POST['date'])) {
          M2mailbox::unexpunge();
        }
      }

      $this->rc->output->send('mel_moncompte.m2_resource_mailbox');
    }
    else {
      // register UI objects
      $this->rc->output->add_handlers(
          array(
              'mel_resources_elements_list' => array(new M2mailbox($this->rc->user->get_username()), 'resources_elements_list'),
              'mel_resources_type_frame'    => array($this, 'mel_resources_type_frame'),
          )
      );
      $this->rc->output->set_env("resources_action", "bal");
      $this->rc->output->include_script('list.js');
      $this->rc->output->set_pagetitle($this->gettext('resources'));
      $this->rc->output->send('mel_moncompte.resources_elements');
    }
  }

  public function restore_bal_expl() {
    return $this->gettext('restore_bal_expl');
  }

  /**
   * Initialisation du menu ressources pour les Agendas
   * Affichage du template et gestion de la sélection
   */
  public function resources_agendas_init() {
    try {
      $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
      if (isset($id)) {
        $id = driver_mel::gi()->rcToMceId($id);
        // Instancie les objets Mél
        $user = driver_mel::gi()->getUser($this->get_user_bal());
        $calendar = driver_mel::gi()->calendar([$user]);
        $calendar->id = $id;
        if ($calendar->load()) {
          // Chargement des preferences de l'utilisateur
          $value = $user->getCalendarPreference('synchro_mobile');
          $synchro_mobile = isset($value) ? unserialize($value) : [];
          $no_invitation = $this->rc->config->get('no_invitation_calendars', []);

          $default_calendar = $user->getDefaultCalendar();
          $acl = ($calendar->asRight(LibMelanie\Config\ConfigMelanie::WRITE) ? $this->gettext('read_write') : ($calendar->asRight(LibMelanie\Config\ConfigMelanie::READ) ? $this->gettext('read_only') : ($calendar->asRight(LibMelanie\Config\ConfigMelanie::FREEBUSY) ? $this->gettext('show') : $this->gettext('none'))));
          $shared = $user->uid != $calendar->owner || !$calendar->asRight(LibMelanie\Config\ConfigMelanie::WRITE);
          $name_editable = ($user->uid === $calendar->owner && $id !== $user->uid) ? true : false;
          $is_default = $default_calendar->id == $calendar->id;
          $this->rc->output->set_env("resource_id", $id);
          $this->rc->output->set_env("resource_name", $shared ? "(" . $calendar->owner . ") " . $calendar->name : $calendar->name);
          $this->rc->output->set_env("resource_shared", $shared);
          $this->rc->output->set_env("resource_acl", $acl);
          $this->rc->output->set_env("resource_owner", $calendar->owner);
          $this->rc->output->set_env("resource_default", $default_calendar->id == $calendar->id);
          $this->rc->output->set_env("resource_invitation", !isset($no_invitation[$calendar->id]));
          $this->rc->output->set_env("resource_color", $this->rc->config->get('color_calendars', null)[$id]);
          $this->rc->output->set_env("resource_name_editable", $name_editable);
          $this->rc->output->set_env("resource_showalarms", $this->rc->config->get('alarm_calendars', null)[$id]);

          if ($acl === $this->gettext('read_only') || M2calendar::is_external($calendar->id)) {
            $this->rc->output->set_env("show_invitations", false);
          }

          if (count($synchro_mobile) == 0) {
            // Si on n'a pas de ressource définie, utilise celle par défaut
            $this->rc->output->set_env("resource_synchro_mobile", $is_default);
            // C'est la ressource par defaut
            if ($is_default)
              $this->rc->output->set_env("resource_synchro_mobile_default", true);
              // Sinon on precise qu'on a aucune ressoure de définie
            else
              $this->rc->output->set_env("resource_synchro_mobile_not_set", true);
          }
          else {
            if (count($synchro_mobile) == 1 && in_array($id, $synchro_mobile) && $is_default) {
              // Si la seule ressource définie est celle par défaut
              $this->rc->output->set_env("resource_synchro_mobile_default", true);
            }
            $this->rc->output->set_env("resource_synchro_mobile", in_array($id, $synchro_mobile));
          }
          if (! $shared) {
            $this->rc->output->add_handler('usersaclframe', array(new M2calendar($this->get_user_bal()),'acl_frame'));
            $this->rc->output->add_handler('groupsaclframe', array(new M2calendargroup($this->get_user_bal()),'acl_frame'));
          }

          $this->rc->output->add_handler('restore_cal', array(new M2calendar($this->get_user_bal()),'restore_cal'));

          $this->rc->output->send('mel_moncompte.m2_resource_calendar');
        }
        else {
          $this->rc->output->send();
        }
      }
      else {
        $account = rcube_utils::get_input_value('_account', rcube_utils::INPUT_GET);

        // register UI objects
        $this->rc->output->add_handlers(
            array(
                'mel_resources_elements_list' => array(new M2calendar($this->get_user_bal()),'resources_elements_list'),
                'mel_resources_type_frame'    => array($this,'mel_resources_type_frame'),
            )
        );
        $config = [
                      'command' => 'rcs-agenda-tri-alpha',
            'class' => 'alpha-sort-icon'.($account === null ? '' : ' disabled'),
            'innerclass' => 'inner',
            'id' => 'rcs-agenda-tri-alpha',//tb_label_popup
            'title' => 'mel_moncompte.sort_title', // gets translated
            'type' => 'link',
            'data-type' => 'link',
            'label' => 'mel_moncompte.sort', // maybe put translated version of "Labels" here?
            // 'wrapper'    => 'li',
        ];

        if (isset($account)) $config['disabled'] = 'disabled';

        $this->add_button($config, 'rcs_moncompte_header');
        $this->rc->output->set_env("account", $account);
        $this->rc->output->set_env("resources_action", "agendas");
        $this->rc->output->include_script('list.js');
        $this->include_script('events.js');
        $this->rc->output->set_pagetitle($this->gettext('resources'));
        $this->rc->output->send('mel_moncompte.resources_elements');
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] mel_moncompte::resources_agendas_init() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
  }

  public function ressources_calendar_agendas_tri_alpha() {
    mel_helper::load_helper($this->rc)->include_utilities();
    $user = driver_mel::gi()->getUser();
    $calendars = $user->getSharedCalendars();

    $calendars = mel_helper::Enumerable($calendars)->orderBy(function ($key, $value) {
      return strtoupper(mel_utils::remove_accents($value->name));
    });

    $sort = [];
    $it = 1;
    foreach ($calendars as $calendar) {
      if ($calendar->id !== $user->uid) $sort[(++$it)+($calendar->owner === $user->uid ? 2000 : 3000)] = driver_mel::gi()->mceToRcId($calendar->id);
    }

    $this->rc->user->save_prefs(['sort_agendas' => $sort]);

    echo 'reload';
    exit; 
  }

  /**
   * Initialisation du menu ressources pour les Contacts
   * Affichage du template et gestion de la sélection
   */
  public function resources_contacts_init() {
    try {
      $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
      if (isset($id)) {
        $id = driver_mel::gi()->rcToMceId($id);
        // Instancie les objets Mél
        $user = driver_mel::gi()->getUser($this->get_user_bal());
        $addressbook = driver_mel::gi()->addressbook([$user]);
        $addressbook->id = $id;
        if ($addressbook->load()) {
          // Chargement des preferences de l'utilisateur
          $value = $user->getAddressbookPreference('synchro_mobile');
          $synchro_mobile = isset($value) ? unserialize($value) : [];

          $default_addressbook = $user->getDefaultAddressbook();
          $acl = ($addressbook->asRight(LibMelanie\Config\ConfigMelanie::WRITE) ? $this->gettext('read_write') : ($addressbook->asRight(LibMelanie\Config\ConfigMelanie::READ) ? $this->gettext('read_only') : ($addressbook->asRight(LibMelanie\Config\ConfigMelanie::FREEBUSY) ? $this->gettext('show') : $this->gettext('none'))));
          $shared = $user->uid != $addressbook->owner;
          $is_default = $default_addressbook->id == $addressbook->id;
          $this->rc->output->set_env("resource_id", $id);
          $this->rc->output->set_env("resource_name", $shared ? "(" . $addressbook->owner . ") " . $addressbook->name : $addressbook->name);
          $this->rc->output->set_env("resource_shared", $shared);
          $this->rc->output->set_env("resource_acl", $acl);
          $this->rc->output->set_env("resource_owner", $addressbook->owner);
          $this->rc->output->set_env("resource_default", $is_default);
          if (count($synchro_mobile) == 0) {
            // Si on n'a pas de ressource définie, utilise celle par défaut
            $this->rc->output->set_env("resource_synchro_mobile", $is_default);
            // C'est la ressource par defaut
            if ($is_default)
              $this->rc->output->set_env("resource_synchro_mobile_default", true);
              // Sinon on precise qu'on a aucune ressoure de définie
            else
              $this->rc->output->set_env("resource_synchro_mobile_not_set", true);
          }
          else {
            if (count($synchro_mobile) == 1 && in_array($id, $synchro_mobile) && $is_default) {
              // Si la seule ressource définie est celle par défaut
              $this->rc->output->set_env("resource_synchro_mobile_default", true);
            }
            $this->rc->output->set_env("resource_synchro_mobile", in_array($id, $synchro_mobile));
          }
          if (! $shared) {
            $this->rc->output->add_handler('usersaclframe', array(new M2contacts($this->get_user_bal()),'acl_frame'));
            $this->rc->output->add_handler('groupsaclframe', array(new M2contactsgroup($this->get_user_bal()),'acl_frame'));
          }

          $this->rc->output->add_handler('restore_contacts', array(new M2contacts($this->get_user_bal()),'restore_contacts'));

          $this->rc->output->send('mel_moncompte.m2_resource_contacts');
        }
        else {
          $this->rc->output->send();
        }
      }
      else {
        // register UI objects
        $this->rc->output->add_handlers(
            array(
                'mel_resources_elements_list' => array(new M2contacts($this->get_user_bal()), 'resources_elements_list'),
                'mel_resources_type_frame'    => array($this, 'mel_resources_type_frame'),
            )
        );
        $this->rc->output->set_env("account", rcube_utils::get_input_value('_account', rcube_utils::INPUT_GET));
        $this->rc->output->set_env("resources_action", "contacts");
        $this->rc->output->include_script('list.js');
        $this->rc->output->set_pagetitle($this->gettext('resources'));
        $this->rc->output->send('mel_moncompte.resources_elements');
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] mel_moncompte::resources_contacts_init() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
  }
  /**
   * Initialisation du menu ressources pour les Tâches
   * Affichage du template et gestion de la sélection
   */
  public function resources_tasks_init() {
    try {
      $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
      if (isset($id)) {
        $id = driver_mel::gi()->rcToMceId($id);
        // Instancie les objets Mél
        $user = driver_mel::gi()->getUser($this->get_user_bal());
        $taskslist = driver_mel::gi()->taskslist([$user]);
        $taskslist->id = $id;
        if ($taskslist->load()) {
          // Chargement des preferences de l'utilisateur
          $value = $user->getTaskslistPreference('synchro_mobile');
          $synchro_mobile = isset($value) ? unserialize($value) : [];

          $default_taskslist = $user->getDefaultTaskslist();
          $acl = ($taskslist->asRight(LibMelanie\Config\ConfigMelanie::WRITE) ? $this->gettext('read_write') : ($taskslist->asRight(LibMelanie\Config\ConfigMelanie::READ) ? $this->gettext('read_only') : ($taskslist->asRight(LibMelanie\Config\ConfigMelanie::FREEBUSY) ? $this->gettext('show') : $this->gettext('none'))));
          $shared = $user->uid != $taskslist->owner;
          $is_default = $default_taskslist->id == $taskslist->id;
          $this->rc->output->set_env("resource_id", $id);
          $this->rc->output->set_env("resource_name", $shared ? "(" . $taskslist->owner . ") " . $taskslist->name : $taskslist->name);
          $this->rc->output->set_env("resource_shared", $shared);
          $this->rc->output->set_env("resource_acl", $acl);
          $this->rc->output->set_env("resource_owner", $taskslist->owner);
          $this->rc->output->set_env("resource_default", $is_default);
          if (count($synchro_mobile) == 0) {
            // Si on n'a pas de ressource définie, utilise celle par défaut
            $this->rc->output->set_env("resource_synchro_mobile", $is_default);
            // C'est la ressource par defaut
            if ($is_default)
              $this->rc->output->set_env("resource_synchro_mobile_default", true);
              // Sinon on precise qu'on a aucune ressoure de définie
            else
              $this->rc->output->set_env("resource_synchro_mobile_not_set", true);
          }
          else {
            if (count($synchro_mobile) == 1 && in_array($id, $synchro_mobile) && $is_default) {
              // Si la seule ressource définie est celle par défaut
              $this->rc->output->set_env("resource_synchro_mobile_default", true);
            }
            $this->rc->output->set_env("resource_synchro_mobile", in_array($id, $synchro_mobile));
          }
          if (! $shared) {
            $this->rc->output->add_handler('usersaclframe', array(new M2tasks($this->get_user_bal()),'acl_frame'));
            $this->rc->output->add_handler('groupsaclframe', array(new M2tasksgroup($this->get_user_bal()),'acl_frame'));
          }
          $this->rc->output->send('mel_moncompte.m2_resource_tasks');
        }
        else {
          $this->rc->output->send();
        }
      }
      else {
        // register UI objects
        $this->rc->output->add_handlers(
            array(
                'mel_resources_elements_list'   => array(new M2tasks($this->get_user_bal()), 'resources_elements_list'),
                'mel_resources_type_frame'      => array($this, 'mel_resources_type_frame'),
                
            )
        );
        $this->rc->output->set_env("account", rcube_utils::get_input_value('_account', rcube_utils::INPUT_GET));
        $this->rc->output->set_env("resources_action", "tasks");
        $this->rc->output->include_script('list.js');
        $this->rc->output->set_pagetitle($this->gettext('resources'));
        $this->rc->output->send('mel_moncompte.resources_elements');
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] mel_moncompte::resources_tasks_init() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
  }
  /**
   * Initialisation de la frame pour les ressources
   *
   * @param array $attrib
   * @return string
   */
  public function mel_resources_type_frame($attrib) {
    if (! $attrib['id']) {
      $attrib['id'] = 'rcmsharemeltypeframe';
    }

    $attrib['name'] = $attrib['id'];

    $this->rc->output->set_env('contentframe', $attrib['name']);
    $this->rc->output->set_env('blankpage', $attrib['src'] ? $this->rc->output->abs_url($attrib['src']) : 'program/resources/blank.gif');

    return $this->rc->output->frame($attrib);
  }
  /**
   * Création d'une nouvelle ressource Agendas/Contacts/Taches
   */
  public function add_resource() {
    $name = rcube_utils::get_input_value('_name', rcube_utils::INPUT_POST);
    $type = rcube_utils::get_input_value('_type', rcube_utils::INPUT_POST);
    $ret = false;

    if ($type == 'agendas') {
      $calendar = new M2calendar($this->get_user_bal(), md5($name . time() . $this->get_user_bal()));
      $ret = $calendar->createCalendar($name);
    }
    else if ($type == 'contacts') {
      $contacts = new M2contacts($this->get_user_bal(), md5($name . time() . $this->get_user_bal()));
      $ret = $contacts->createAddressbook($name);
    }
    else if ($type == 'tasks') {
      $tasks = new M2tasks($this->get_user_bal(), md5($name . time() . $this->get_user_bal()));
      $ret = $tasks->createTaskslist($name);
    }
    if ($ret) {
      $this->rc->output->show_message('mel_moncompte.add_resource_ok_' . $type, 'confirm');
      $this->rc->output->command('plugin.mel_add_resource_success', json_encode(array()));
    }
    else {
      $this->rc->output->show_message('mel_moncompte.add_resource_nok_' . $type, 'error');
    }
    return $ret;
  }
  /**
   * Suppression de la ressource sélectionnée Agenda/Contacts/Tâches
   */
  public function delete_resource() {
    $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_POST);
    $type = rcube_utils::get_input_value('_type', rcube_utils::INPUT_POST);

    $ret = false;

    if ($type == 'agendas') {
      $calendar = new M2calendar($this->get_user_bal(), $id);
      $ret = $calendar->deleteCalendar();
    }
    else if ($type == 'contacts') {
      $contacts = new M2contacts($this->get_user_bal(), $id);
      $ret = $contacts->deleteAddressbook();
    }
    else if ($type == 'tasks') {
      $tasks = new M2tasks($this->get_user_bal(), $id);
      $ret = $tasks->deleteTaskslist();
    }
    if ($ret) {
      $this->rc->output->show_message('mel_moncompte.delete_resource_ok_' . $type, 'confirm');
      $this->rc->output->command('plugin.mel_delete_resource_success', json_encode(array()));
    }
    else {
      $this->rc->output->show_message('mel_moncompte.delete_resource_nok_' . $type, 'error');
    }
    return $ret;
  }
  /**
   * Masquer la ressource dans roundcube
   */
  public function hide_resource_roundcube() {
    $mbox = rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_POST);
    $type = rcube_utils::get_input_value('_type', rcube_utils::INPUT_POST);

    if (isset($mbox) && isset($type)) {
      $conf_name = 'hidden_' . $type . 's';
      // MANTIS 0006340: Ajouter une prop CalDAV {DAV}hidden quand un calendrier est masqué
      if ($type == 'calendar') {
        $calendars_prop = $this->_get_caldav_properties();
        if (!isset($calendars_prop[$mbox])) {
          $calendars_prop[$mbox] = [];
        }
        $calendars_prop[$mbox]['{DAV:}hidden'] = true;
        $this->_set_caldav_properties($calendars_prop);
      }
      // Récupération des préférences de l'utilisateur
      $hidden = $this->rc->config->get($conf_name, array());
      $hidden[$mbox] = 1;
      if ($this->rc->user->save_prefs(array($conf_name => $hidden)))
        $this->rc->output->show_message('mel_moncompte.hide_resource_confirm', 'confirmation');
      else
        $this->rc->output->show_message('mel_moncompte.modify_error', 'error');
    }
    else {
      $this->rc->output->show_message('mel_moncompte.modify_error', 'error');
    }
  }
  /**
   * Afficher la ressource dans roundcube
   */
  public function show_resource_roundcube() {
    $mbox = rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_POST);
    $type = rcube_utils::get_input_value('_type', rcube_utils::INPUT_POST);

    if (isset($mbox) && isset($type)) {
      $conf_name = 'hidden_' . $type . 's';
      // MANTIS 0006340: Ajouter une prop CalDAV {DAV}hidden quand un calendrier est masqué
      if ($type == 'calendar') {
        $calendars_prop = $this->_get_caldav_properties();
        if (isset($calendars_prop[$mbox]) && isset($calendars_prop[$mbox]['{DAV:}hidden'])) {
          unset($calendars_prop[$mbox]['{DAV:}hidden']);
          $this->_set_caldav_properties($calendars_prop);
        }
      }
      // Récupération des préférences de l'utilisateur
      $hidden = $this->rc->config->get($conf_name, array());
      unset($hidden[$mbox]);
      if ($this->rc->user->save_prefs(array($conf_name => $hidden)))
        $this->rc->output->show_message('mel_moncompte.show_resource_confirm', 'confirmation');
      else
        $this->rc->output->show_message('mel_moncompte.modify_error', 'error');
    }
    else {
      $this->rc->output->show_message('mel_moncompte.modify_error', 'error');
    }
  }

  /**
   * Utiliser le calendrier dans les invitations
   */
  public function invitation() {
    $mbox = rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_POST);

    if (isset($mbox)) {
      $conf_name = 'no_invitation_calendars';
      // Récupération des préférences de l'utilisateur
      $no_invitation = $this->rc->config->get($conf_name, []);
      unset($no_invitation[$mbox]);
      if ($this->rc->user->save_prefs(array($conf_name => $no_invitation)))
        $this->rc->output->show_message('mel_moncompte.invitation_confirm', 'confirmation');
      else
        $this->rc->output->show_message('mel_moncompte.modify_error', 'error');
    }
    else {
      $this->rc->output->show_message('mel_moncompte.modify_error', 'error');
    }
  }

  /**
   * Ne pas utiliser le calendrier dans les invitations
   */
  public function no_invitation() {
    $mbox = rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_POST);

    if (isset($mbox)) {
      $conf_name = 'no_invitation_calendars';
      // Récupération des préférences de l'utilisateur
      $no_invitation = $this->rc->config->get($conf_name, []);
      $no_invitation[$mbox] = 1;
      if ($this->rc->user->save_prefs(array($conf_name => $no_invitation)))
        $this->rc->output->show_message('mel_moncompte.no_invitation_confirm', 'confirmation');
      else
        $this->rc->output->show_message('mel_moncompte.modify_error', 'error');
    }
    else {
      $this->rc->output->show_message('mel_moncompte.modify_error', 'error');
    }
  }

  /**
   * Récupère les caldav properties de l'utilisateur courant
   * 
   * @return array
   */
  private function _get_caldav_properties() {
    // Récupération des prefs supplémentaires
    $pref = driver_mel::gi()->userprefs([driver_mel::gi()->getUser()]);
    $pref->scope = \LibMelanie\Config\ConfigMelanie::CALENDAR_PREF_SCOPE;
    $pref->name = "caldav_properties";
    $calendars_prop = [];
    if ($pref->load()) {
      $calendars_prop = unserialize($pref->value);
    }
    return $calendars_prop;
  }

  /**
   * Enregistre les caldav properties pour l'utilisateur courant
   * 
   * @param array $calendars_prop
   * 
   * @return null|boolean
   */
  private function _set_caldav_properties($calendars_prop) {
    // Récupération des prefs supplémentaires
    $pref = driver_mel::gi()->userprefs([driver_mel::gi()->getUser()]);
    $pref->scope = \LibMelanie\Config\ConfigMelanie::CALENDAR_PREF_SCOPE;
    $pref->name = "caldav_properties";
    $pref->value = serialize($calendars_prop);
    return $pref->save();
  }

  /**
   * Trier la ressource pour l'affichage dans Roundcube
   */
  public function sort_resource_roundcube() {
    $items = rcube_utils::get_input_value('_items', rcube_utils::INPUT_POST);
    $type = rcube_utils::get_input_value('_type', rcube_utils::INPUT_POST);

    if (isset($items) && isset($type)) {
      $conf_name = 'sort_' . $type;
      if ($this->rc->user->save_prefs(array($conf_name => json_decode($items, true)))) {
        $this->rc->output->show_message('mel_moncompte.sort_resource_confirm', 'confirmation');
        $this->rc->output->command('mel_resources_reload_page', 'sort');
      }
      else {
        $this->rc->output->show_message('mel_moncompte.modify_error', 'error');
      }
    }
    else {
      $this->rc->output->show_message('mel_moncompte.modify_error', 'error');
    }
  }
  /**
   * Afficher la ressource dans roundcube
   */
  public function no_synchro_on_mobile() {
    try {
      $mbox = rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_POST);
      $type = rcube_utils::get_input_value('_type', rcube_utils::INPUT_POST);
      if (isset($mbox) && isset($type)) {
        // Instancie les objets Mél
        $user = driver_mel::gi()->getUser($this->get_user_bal());
        if ($type == 'calendar') {
          $value = $user->getCalendarPreference('synchro_mobile');
        }
        elseif ($type == 'contact') {
          $value = $user->getAddressbookPreference('synchro_mobile');
        }
        else {
          $value = $user->getTaskslistPreference('synchro_mobile');
        }
        if (isset($value)) {
          $value = unserialize($value);
          if ($value === false) {
            $value = [];
          }
          foreach ($value as $key => $val) {
            if ($val == $mbox) {
              unset($value[$key]);
            }
            else {
              // Vérifier que l'on a bien les droits sur l'agenda
              if ($type == 'calendar') {
                $sync = driver_mel::gi()->calendar([$user]);
              }
              elseif ($type == 'contact') {
                $sync = driver_mel::gi()->addressbook([$user]);
              }
              else {
                $sync = driver_mel::gi()->taskslist([$user]);
              }
              $sync->id = $val;
              if (!$sync->load()) {
                unset($value[$key]);
              }
            }
          }
          if ($type == 'calendar') {
            $ret = $user->saveCalendarPreference('synchro_mobile', serialize($value));
          }
          elseif ($type == 'contact') {
            $ret = $user->saveAddressbookPreference('synchro_mobile', serialize($value));
          }
          else {
            $ret = $user->saveTaskslistPreference('synchro_mobile', serialize($value));
          }
          if ($ret) {
            $this->rc->output->show_message('mel_moncompte.no_synchro_mobile_confirm', 'confirmation');
          }
          else {
            $this->rc->output->show_message('mel_moncompte.modify_error', 'error');
          }
        }
        else {
          $this->rc->output->show_message('mel_moncompte.modify_error', 'error');
        }
      }
      else {
        $this->rc->output->show_message('mel_moncompte.modify_error', 'error');
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] mel_moncompte::no_synchro_on_mobile() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] mel_moncompte::no_synchro_on_mobile() Exception: " . $ex->getMessage());
      return false;
    }
  }
  /**
   * Afficher la ressource dans roundcube
   */
  public function synchro_on_mobile() {
    try {
      $mbox = rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_POST);
      $type = rcube_utils::get_input_value('_type', rcube_utils::INPUT_POST);

      if (isset($mbox) && isset($type)) {
        // Instancie les objets Mél
        $user = driver_mel::gi()->getUser($this->get_user_bal());
        if ($type == 'calendar') {
          $value = $user->getCalendarPreference('synchro_mobile');
        }
        elseif ($type == 'contact') {
          $value = $user->getAddressbookPreference('synchro_mobile');
        }
        else {
          $value = $user->getTaskslistPreference('synchro_mobile');
        }
        if (isset($value)) {
          $value = unserialize($value);
          if ($value === false) {
            $value = [];
          }
        }
        else {
          $value = array();
        }
        if (count($value) === 0) {
          if ($type == 'calendar') {
            $default = $user->getDefaultCalendar();
          }
          elseif ($type == 'contact') {
            $default = $user->getDefaultAddressbook();
          }
          else {
            $default = $user->getDefaultTaskslist();
          }
          if (isset($default)) {
            $value[] = $default->id;
          }
        }
        else {
          foreach ($value as $key => $val) {
            // Vérifier que l'on a bien les droits sur l'agenda
            if ($type == 'calendar') {
              $sync = driver_mel::gi()->calendar([$user]);
            }
            elseif ($type == 'contact') {
              $sync = driver_mel::gi()->addressbook([$user]);
            }
            else {
              $sync = driver_mel::gi()->taskslist([$user]);
            }
            $sync->id = $val;
            if (!$sync->load()) {
              unset($value[$key]);
            }
          }
        }
        if (!in_array($mbox, $value)) {
          $value[] = $mbox;
        }
        if ($type == 'calendar') {
          $ret = $user->saveCalendarPreference('synchro_mobile', serialize($value));
        }
        elseif ($type == 'contact') {
          $ret = $user->saveAddressbookPreference('synchro_mobile', serialize($value));
        }
        else {
          $ret = $user->saveTaskslistPreference('synchro_mobile', serialize($value));
        }
        if ($ret) {
          $this->rc->output->show_message('mel_moncompte.synchro_mobile_confirm', 'confirmation');
        }
        else {
          $this->rc->output->show_message('mel_moncompte.modify_error', 'error');
        }
      }
      else {
        $this->rc->output->show_message('mel_moncompte.modify_error', 'error');
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] mel_moncompte::synchro_on_mobile() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] mel_moncompte::synchro_on_mobile() Exception: " . $ex->getMessage());
      return false;
    }
  }
  /**
   * Définir la ressource par défaut
   */
  public function set_default_resource() {
    try {
      $mbox = rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_POST);
      $type = rcube_utils::get_input_value('_type', rcube_utils::INPUT_POST);

      if (isset($mbox) && isset($type)) {
        // Instancie les objets Mél
        $user = driver_mel::gi()->getUser($this->get_user_bal());
        if ($type == 'calendar') {
          $ret = $user->setDefaultCalendar($mbox);
        }
        elseif ($type == 'contact') {
          $ret = $user->setDefaultAddressbook($mbox);
        }
        else {
          $ret = $user->setDefaultTaskslist($mbox);
        }
        if ($ret) {
          $this->rc->output->show_message('mel_moncompte.set_default_confirm', 'confirmation');
        }
        else {
          $this->rc->output->show_message('mel_moncompte.modify_error', 'error');
        }
      }
      else {
        $this->rc->output->show_message('mel_moncompte.modify_error', 'error');
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] mel_moncompte::set_default_resource() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] mel_moncompte::set_default_resource() Exception: " . $ex->getMessage());
      return false;
    }
  }

  /**
   * ****** PRIVATE *********
   */
  /**
   * Récupère le username en fonction du compte dans l'url ou de la session
   *
   * @return string
   */
  private function get_username() {
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
  private function get_user_bal() {
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
  private function get_share_objet() {
    if (!isset($this->user_objet_share)) {
      $this->set_user_properties();
    }
    return $this->user_objet_share;
  }
  /**
   * Récupère l'host de l'utilisateur
   *
   * @return string
   */
  private function get_host() {
    if (!isset($this->user_host)) {
      $this->set_user_properties();
    }
    return $this->user_host;
  }
  /**
   * Définition des propriétées de l'utilisateur
   *
   *
   * récupère les infos de la bal via les drivers
   *
   * la bal concerné est celle passé en $_GET dans l'url (pemret de switcher sur les bal partagées)
   *
   * 3 attributs à récupérer et définir
   * user_object_share === uid <= identifiant de la bal (donné à getUser(): peut donc etre le radical du mail (mte) ou le mail entier (gn)
   * user_host === host imap <= adresse serveur imap de la bal
   * user_bal === uid de la balp associé (idem supra, peut etre le radical du mail ou ce dernier en entier)
   *
   * @return void
   */
  private function set_user_properties() {
    // Chargement de l'account passé en Get
    $this->get_account = mel::get_account();
    if (!empty($this->get_account)) {
      // Récupération du username depuis l'url
      $this->user_name = urldecode($this->get_account);
      // sam: usage du driver
      list($user_object_share, $user_host, $user_bal) = driver_mel::gi()->getShareUserBalpHostFromMail($this->user_name);
      $this->user_objet_share = $user_object_share;
      $this->user_host = $user_host;
      $this->user_bal = $user_bal;
      $user = driver_mel::gi()->getUser($this->user_objet_share, false);
      if ($user->is_objectshare) {
        $this->user_bal = $user->objectshare->mailbox_uid;
      }
      else {
        $this->user_bal = $this->user_objet_share;
      }
      // est-ce qu'il a les droits gestionnaire
      $bal = driver_mel::gi()->getUser($this->user_bal);
      if ($this->user_bal != $this->rc->get_user_name()
          && (!isset($bal->shares[$this->rc->get_user_name()]) 
            || $bal->shares[$this->rc->get_user_name()]->type != \LibMelanie\Api\Defaut\Users\Share::TYPE_ADMIN)) {
        // Récupération du username depuis la session
        $this->user_name = $this->rc->get_user_name();
        // sam: usage driver
        list($user_object_share, $user_host, $user_bal) = driver_mel::gi()->getShareUserBalpHostFromSession();
        $this->user_objet_share = $user_object_share;
        $this->user_host = $user_host;
        $this->user_bal = $user_bal;
      }
    }
    else {
      // Récupération du username depuis la session
      $this->user_name = $this->rc->get_user_name();
      // sam:usage driver
      list($user_object_share, $user_host, $user_bal) = driver_mel::gi()->getShareUserBalpHostFromSession();
      $this->user_objet_share = $user_object_share;
      $this->user_host = $user_host;
      $this->user_bal = $user_bal;
    }
  }
}
