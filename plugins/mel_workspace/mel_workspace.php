<?php
use LibMelanie\Api\Defaut\Workspaces\Share;
/**
 * Plugin Mél Espace de travail
*
* Permet aux utilisateurs d'envoyer des suggestions depuis le menu parametres
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

class mel_workspace extends bnum_plugin
{
    /**
     * @var string
     */
    public $task = '.*';

    /**
     * @var rcmail
     */
    private $rc;

    public $workspaces;
    private $currentWorkspace;
    private $channel_enabled;
    private $tchap_channel_enabled;
    private $folders = ["init", "lib"];
    static private $listenersSet;

    /**
     * (non-PHPdoc)
     * @see rcube_plugin::init()
     */
    public function init()
    {
        $this->require_plugin('mel_helper');
        $this->setup();
        $this->include_stylesheet($this->local_skin_path().'/workspaces.css');        
        $this->include_script('js/init/classes/WSPNotifications.js');
        $this->include_script('js/init/classes/RoundriveShow.js');
        $this->include_script('js/init/classes/WorkspaceDrive.js');
        if ($this->rc->task === "workspace")
            $this->portal();
    }

    /**
     * Enregistre les différentes actions, configs et boutons.
     *
     * @return void
     */
    function setup()
    {
        $this->rc = rcmail::get_instance();
        $this->load_config();
        //$this->setup_config();
        $this->add_texts('localization/', true);
        $this->register_task("workspace");
        $this->register_action('create', array($this, 'create'));
        $this->register_action('get_uid', array($this, 'get_uid'));
        $this->register_action('check_uid', array($this, 'check_uid'));
        $this->register_action('save_objects', array($this, 'save_objects'));
        $this->register_action('epingle', array($this, 'epingle'));
        $this->register_action('get_email_from_ws', array($this, 'get_email_from_workspace'));
        $this->register_action('hashtag', array($this, 'get_hashtags'));
        $this->register_action('notify_chat', array($this, 'notify_chat'));//get_uLinks
        $this->register_action('show_links', array($this, 'get_uLinks'));
        $this->register_action('calendar', array($this, 'show_calendar'));
        $this->register_action('update_ulink', array($this, 'update_ulink'));
        $this->register_action('delete_ulink', array($this, 'delete_ulink'));
        $this->register_action('pin_ulink', array($this, 'pin_ulink'));
        $this->register_action('update_edit_date', array($this, 'update_edit_date'));
        $this->register_action('get_joined_workspace_title', [$this, 'get_joined_workspace_title']);
        $this->include_script('js/epingle.js');

        $this->add_hook('preferences_list', array($this, 'prefs_list'));
        $this->add_hook('preferences_save',  array($this, 'prefs_save'));
        $this->add_hook('get_external_ulink', array($this, 'get_workspace_ulinks_by_id'));
        $this->add_hook('save_external_ulinks', array($this, 'save_workspace_ulinks'));


        // Ajoute le bouton en fonction de la skin
        $need_button = 'taskbar';
        if (class_exists("mel_metapage")) {
          $need_button = $this->rc->plugins->get_plugin('mel_metapage')->is_app_enabled('app_workspace') ? $need_button : 'otherappsbar';
        }
    
        if ($need_button)
        {
        $this->add_button(array(
            'command' => "workspace",
            'class'	=> 'wsp button-wsp icon-mel-workplace',
            'classsel' => 'wsp button-wsp button-selected icon-mel-workplace',
            'innerclass' => 'wsp button-inner',
            'label'	=> 'my_workspaces',
            'title' => 'my_workspaces',
            'type'       => 'link',
            'domain' => "mel_workspace"
        ), $need_button);
      }

        $this->registerListeners();
    }

    /**
     * Initialise le plugin lorsque l'on est dans la tâche "workspace"
     *
     * @return void
     */
    function portal()
    {
        $this->include_js();

        $this->register_action('index', array($this, 'index'));
        $this->register_action('action', array($this, 'show_actions'));
        $this->register_action('workspace', array($this, 'show_workspace'));
        $this->register_action('archived', array($this, 'show_workspace_archived'));
        //$this->register_action('list', array($this, 'show_workspace'));
        $this->register_action('PARAM_Change_color', array($this, 'change_color'));
        $this->register_action('PARAMS_change_logo', array($this, 'change_logo'));
        $this->register_action('PARAMS_change_visibility', array($this, 'change_visibility'));
        $this->register_action('PARAMS_add_users', array($this, 'add_users'));
        $this->register_action('PARAMS_update_user_table_rights', array($this, 'update_user_table_rights'));
        $this->register_action('PARAMS_update_user_rights', array($this, 'update_user_rights'));
        $this->register_action('PARAMS_delete_user', array($this, 'delete_user'));
        $this->register_action('PARAMS_get_arianes_rooms', array($this, 'get_arianes_rooms'));
        $this->register_action('PARAMS_change_ariane_room', array($this, 'change_ariane_room'));
        $this->register_action('PARAMS_update_app', array($this, 'update_app'));
        $this->register_action('PARAMS_update_app_table', array($this, 'update_app_table'));
        $this->register_action('PARAMS_update_toolbar', array($this, 'update_toolbar'));
        $this->register_action('PARAMS_update_services', array($this, 'update_services'));
        $this->register_action('PARAMS_update_end_date', array($this, 'update_end_date_setting'));
        $this->register_action('PARAMS_change_primary', array($this, 'update_primary_parameters'));
        $this->register_action('sync_list_member', [$this, 'synchronize_list']);
        $this->register_action('delete_list', [$this, 'delete_list']);
        $this->register_action('join_user', array($this, 'join_user'));
        $this->register_action('leave_workspace', array($this, 'leave_workspace'));
        $this->register_action('delete_workspace', array($this, 'delete_workspace'));
        $this->register_action('archive_workspace', array($this, 'archive_workspace'));
        $this->register_action('refresh_html_ulinks', array($this, 'update_html_ulinks'));
        $this->register_action('refresh_documents', array($this, 'refresh_documents'));
        $this->register_action('get_date_stockage_user_updated', array($this, 'stockage_user_updated'));
        $this->register_action('toggle_nav_color', array($this, 'toggle_nav_color'));
        $this->register_action('get_wekan_admin_boards', [$this, 'get_wekan_admin_boards']);
        $this->register_action('update_wekan_board', [$this, 'update_wekan_board']);
        $this->register_action('add_survey', [$this, 'add_survey']);
        $this->register_action('delete_survey', [$this, 'delete_survey']);
        $this->register_action('check_service_async', [$this, 'check_service_action']);
        $this->register_action('create_service_async', [$this, 'create_service_action']);
        $this->register_action('change_tchap_room', [$this, 'change_tchap_room']);
        //stockage_user_updated
        //toggle_nav_color
    }

    function check_service_action()
    {
        $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
        $service = rcube_utils::get_input_value('_service', rcube_utils::INPUT_GPC);

        $return = [
            'service' => $service,
            'state' => 'valid',
            'service_state' => true
        ];

        $workspace = driver_mel::gi()->workspace();
        $workspace->uid = $id;
        $workspace->load();

        $service = $this->check_services($service, $workspace);

        if ($service === null || !$service || $service['state'] === 'invalid') {
            $return['state'] = 'invalid';
            $return['service_state'] = $service;
        }

        echo json_encode($return);

        exit;
    }

    function create_service_action()
    {
        $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
        $service = rcube_utils::get_input_value('_service', rcube_utils::INPUT_GPC);
        $state = rcube_utils::get_input_value('_state', rcube_utils::INPUT_GPC);

        if ($state === '') $state = null;
        else if ($state === 'true' || $state === 'false') $state = $state === 'true';

        $workspace = driver_mel::gi()->workspace();
        $workspace->uid = $id;
        $workspace->load();

        $need_update = $this->services_action_errors($workspace, [$service => $state]);

        $datas = false;

        if ($need_update) {
            $workspace->save();
            $workspace->load();

            $datas = [
                'env' => [],
                'update_button' => [],
                'triggers' => []
            ];

            switch ($service) {
                case self::WEKAN:
                    $datas['env']['wekan_datas'] = $this->get_object($workspace, self::WEKAN);
                    $datas['update_button'][] = [
                        'id' => 'wsp-wekan',
                        'is_class' => true,
                        'datas' => ['wekan' => $datas['env']['wekan_datas']->id]
                    ];
                    break;

                case self::TASKS:
                    $datas['triggers'][] = ['is_top' => true, 'trigger' => 'mel_metapage.tasks_updated'];
                    break;

                case self::AGENDA:
                    $datas['triggers'][] = ['is_top' => true, 'trigger' => 'mel_metapage.calendar_updated'];
                    break;
                
                default:
                    break;
            }
        }

        echo json_encode($datas);
        exit;
    }

    function registerListeners()
    {
        if (self::$listenersSet !== true)
        {
            self::$listenersSet = true;
            mel_metapage::events()->addEventListener("calendar.new_event", [$this, "on_new_event"]);
        }
    }

    public function on_new_event($event)
    {
        if (!empty($event["categories"]) && isset($event["categories"]) && strpos($event["categories"], 'ws#') !== false)
        {
            $uid = str_replace('ws#', '', $event["categories"]);
            try {
                $wsp = self::get_workspace($uid);
                
                if ($wsp !== null) self::edit_modified_date($wsp);

            } catch (\Throwable $th) {
                //throw $th;
            }

        }
    }

    /**
     * Charge les espaces de travail de l'utilisateur
     *
     * @return void
     */
    public function load_workspaces($force = false)
    {
        if (!isset($this->workspaces) || $force) $this->workspaces = driver_mel::gi()->getUser()->getSharedWorkspaces("modified", false);
    }

    public function get_joined_workspace_title()
    {
        $this->load_workspaces();
        $array = [];
        foreach ($this->workspaces as $key => $value) {
            $array[$value->uid] = $value->title;
        }

        echo json_encode($array);
        exit;
    }

    public function get_all_wsp()
    {
        $wsp = driver_mel::gi()->getUser()->getSharedWorkspaces("modified", false);
        $r = [];
        foreach ($wsp as $key => $value) {
            try {
                $r[$value->uid] = json_decode($value->objects);
            } catch (\Throwable $th) {
                $r[$value->uid] = "nothing";
            }
        }
        return $r;
    }

    /**
     * Trie les espaces de travail en fonction de leurs id.
     *
     * @param Workspace $a
     * @param Workspace $b
     * @return int
     */
    public function sort_workspaces($a, $b)
    {
        if ($a->id == $b->id) {
            return 0;
        }
        return ($a->id < $b->id) ? -1 : 1;
    }

    /**
     * Trie les utilisateurs
     *
     * @param User $a
     * @param User $b
     * @return int
     */
    public function array_sort_users($a, $b)
    {
        include_once 'lib/mel_utils.php';
        if ($a->user == $b->user) {
            return 0;
        }
        if ($a->rights === Share::RIGHT_OWNER)
            return (mel_utils::string_to_number($a->user) < mel_utils::string_to_number($b->user)) ? -3 : -2;
        else
            return (mel_utils::string_to_number($a->user) < mel_utils::string_to_number($b->user)) ? -1 : 1;
    }

    public function sort_users(&$array)
    {
        uasort($array , [$this, "array_sort_users"]);
    }

    function show_workspace_archived()
    {
        echo $this->generate_html(false, true);
        exit;
    }

    function index()
    {
        $this->rc->output->add_handlers(array(
            'epingle'    => array($this, 'show_epingle'),
        ));
        $this->rc->output->add_handlers(array(
            'joined'    => array($this, 'show_joined'),
        ));
        $this->include_script('js/workspace_frame_manager.js');
        $this->load_script_module('index', '/js/mel_lib/');
        mel_metapage::IncludeAvatar();
        $this->rc->output->set_pagetitle("Espaces de travail");
        $this->rc->output->send('mel_workspace.workspaces');
    }

    function show_epingle()
    {
        return $this->generate_html(true);
    }

    function show_joined()
    {
        return $this->generate_html();
    }

    function show_publics()
    {
        $page = rcube_utils::get_input_value('_page', rcube_utils::INPUT_GPC);
        $search = rcube_utils::get_input_value('_search', rcube_utils::INPUT_GPC) ?? false;

        $html = "";
        $workspaces;// = (driver_mel::gi()->workspace())->listPublicsWorkspaces('modified', true, 7, (($page ?? 1) - 1)*7);
        
        if ($search !== false)
            $workspaces = $this->wsp_search($search, 7, (($page ?? 1) - 1)*7);
        else
            $workspaces = (driver_mel::gi()->workspace())->listPublicsWorkspaces('modified', true, 7, (($page ?? 1) - 1)*7);

        foreach ($workspaces as $key => $value) {
            $html .= $this->create_block($value, false);
        } 

        return $html;
    }

    function wsp_search($search, $offset, $max)
    {
        $workspace = driver_mel::gi()->workspace();
        $workspace->ispublic = true;
        $workspace->title = '%'.$search.'%';

        $operators =  [
            'ispublic' => LibMelanie\Config\MappingMce::eq,
            'title' => LibMelanie\Config\MappingMce::like,
        ];

        $workspaces = $workspace->getList(null, null, $operators, 'modified', true, $offset, $max, ["workspace_title"]);

        return $workspaces;
    }

    function show_actions()
    {
        $event = rcube_utils::get_input_value('_event', rcube_utils::INPUT_GPC);

        $this->include_script('js/workspace_frame_manager.js');

        switch ($event) {
            case 'list_public':
                $this->rc->output->add_handlers(array(
                    'joined'    => array($this, 'show_publics'),
                ));
                $label = function ()
                {
                    return "Espaces de travail public";
                };
                $this->rc->output->add_handlers(array(
                    'label'    => $label,
                ));
                $title = function ()
                {
                    return "Liste des espaces de travail";
                };
                $this->rc->output->add_handlers(array(
                    'title'    => $title,
                ));
                $pagination = function() {
                    $page = rcube_utils::get_input_value('_page', rcube_utils::INPUT_GPC);
                    $config = ["class" => "pagination mel-pagination",
                    "data-count" => count((driver_mel::gi()->workspace())->listPublicsWorkspaces()),
                    "data-page" => "rcmail.command('workspaces.page', ¤page¤)"
                    ];
                    if ($page !== null)
                        $config["data-current"] = $page;
                    return html::div($config);
                };
                $this->rc->output->add_handlers(array(
                    'pagination'    => $pagination,
                ));
                $this->rc->output->set_pagetitle("Espaces publics");
                $this->rc->output->set_env("wsp_action_event", $event);
                $this->rc->output->send('mel_workspace.list_workspaces');
                break;

            case 'list_public_search':
                $this->rc->output->add_handlers(array(
                    'joined'    => array($this, 'show_publics'),
                ));
                $label = function ()
                {
                    return "Espaces de travail public";
                };
                $this->rc->output->add_handlers(array(
                    'label'    => $label,
                ));
                $title = function ()
                {
                    return "Liste des espaces de travail trouvés";
                };
                $this->rc->output->add_handlers(array(
                    'title'    => $title,
                ));
                $pagination = function() {
                    $page = rcube_utils::get_input_value('_page', rcube_utils::INPUT_GPC);
                    $config = ["class" => "pagination mel-pagination",
                    "data-count" => count($this->wsp_search(rcube_utils::get_input_value('_search', rcube_utils::INPUT_GPC), null, null)),
                    "data-page" => "rcmail.command('workspaces.page', ¤page¤)"
                    ];
                    if ($page !== null)
                        $config["data-current"] = $page;
                    return html::div($config);
                };
                $this->rc->output->add_handlers(array(
                    'pagination'    => $pagination,
                ));
                $this->rc->output->set_pagetitle("Espaces publics - Recherche");
                $this->rc->output->set_env("wsp_action_event", $event);
                $this->rc->output->set_env("wsp_action_search", rcube_utils::get_input_value('_search', rcube_utils::INPUT_GPC) ?? "");
                $this->rc->output->send('mel_workspace.list_workspaces');
                break;
            default:
                # code...
                break;
        } 
    }

    function show_workspace()
    {
        $tasks = 'tasks';
        $workspace_id = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_GPC);
        $this->currentWorkspace = driver_mel::gi()->workspace();
        $this->currentWorkspace->uid = $workspace_id;
        $this->currentWorkspace->load();

        $this->rc->output->set_env('wsp_one_admin', self::is_one_admin($this->currentWorkspace));

        $this->rc->output->add_handlers(array(
            'wsp-style'    => array($this, 'set_wsp_style'),
        ));
        $this->rc->output->add_handlers(array(
            'wsp-picture'    => array($this, 'get_picture'),
        ));
        $this->rc->output->add_handlers(array(
            'wsp-hashtag'    => array($this, 'get_hashtag'),
        ));
        $this->rc->output->add_handlers(array(
            'wsp-title'    => array($this, 'get_title'),
        ));
        $this->rc->output->add_handlers(array(
            'wsp-toolbar'    => array($this, 'get_toolbar'),
        ));
        $this->rc->output->add_handlers(array(
            'wsp-desc'    => array($this, 'get_description')//,
            //'wsp-endate' => [$this, 'get_end_date']
        ));
        $this->rc->output->add_handlers(array(
            'wsp-users-infos'    => array($this, 'get_users_info'),
        ));
        $this->rc->output->add_handlers(array(
            'wsp-services'    => array($this, 'get_services'),
        ));
        $this->rc->output->add_handlers(array(
            'other-static-pages'    => array($this, 'get_pages'),
        ));
        $this->rc->output->set_env("current_workspace_uid", $this->currentWorkspace->uid);
        $this->rc->output->set_env("current_workspace_tasklist_uid", $this->get_object($this->currentWorkspace, $tasks));
        $this->rc->output->set_env("current_workspace_back", rcube_utils::get_input_value('_last_location', rcube_utils::INPUT_GPC));
        $this->rc->output->set_env('current_workspace_is_public', $this->currentWorkspace->ispublic);

        if (!$this->currentWorkspace->ispublic) {
            $this->rc->plugins->get_plugin('calendar')->include_script('lib/js/fullcalendar.js');
            $this->rc->plugins->get_plugin('calendar')->include_script('lib/js/scheduler.js');
            $this->rc->plugins->get_plugin('calendar')->include_script('lib/js/moment_fr.js');
            $this->rc->plugins->get_plugin('calendar')->include_stylesheet('lib/js/scheduler.css');
            $this->rc->output->set_env("wsp_shares", $this->get_mails_from_workspace($this->currentWorkspace));
        }
        
        if (self::is_in_workspace($this->currentWorkspace))
            $this->rc->output->set_env("wsp_is_in", "yes");

        $services = $this->get_worskpace_services($this->currentWorkspace);
        if ($services[self::WEKAN])
        {
            $this->rc->output->set_env("wekan_base_url", $this->wekan()->wekan_url(false));
            $this->rc->output->set_env("wekan_datas", $this->get_object($this->currentWorkspace, self::WEKAN));
        }

        if ($services[self::EMAIL])
            $this->rc->output->set_env("current_workspace_email", self::get_wsp_mail($workspace_id));

        try {
            if ($services[self::CHANNEL])
            {
                $this->channel_enabled = $this->check_channel($this->get_object($this->currentWorkspace, self::CHANNEL)->id);
                $this->rc->output->set_env("current_workspace_channel", $this->get_object($this->currentWorkspace, self::CHANNEL));
            }
            if ($services[self::TCHAP_CHANNEL])
            {
                $this->tchap_channel_enabled = $this->check_tchap_channel($this->get_object($this->currentWorkspace, self::TCHAP_CHANNEL)->id);
                $this->rc->output->set_env("current_workspace_tchap_channel", $this->get_object($this->currentWorkspace, self::TCHAP_CHANNEL));
            }
        } catch (\Throwable $th) {
            //throw $th;
        }
        
        if ($services[self::CLOUD])
        {
            //$this->edit_personal_user_data($this->currentWorkspace->uid, "current_nextcloud_updated", null);
            $this->rc->output->set_env("current_nextcloud_updated", $this->get_stockage_enabled($this->currentWorkspace, driver_mel::gi()->getUser()->uid));
            $this->rc->output->set_env("wsp_waiting_nextcloud_minutes", $this->rc->config->get('waiting_nextcloud_minutes', 10));
        
            $fileId = rcube_utils::get_input_value('_fileid', rcube_utils::INPUT_GPC);

            if (isset($fileId))
                $this->rc->output->set_env("current_workspace_file", [
                    "id" => $fileId,
                    "path" => rcube_utils::get_input_value('_filepath', rcube_utils::INPUT_GPC)
                ]);

        }


        $this->include_stylesheet($this->local_skin_path().'/links.css');

        $this->include_script('js/workspace_frame_manager.js');
        //$this->load_script_module('workspace', '/js/mel_lib/');

        $this->rc->output->set_env("current_workspace_page", rcube_utils::get_input_value('_page', rcube_utils::INPUT_GPC));
        $this->rc->output->set_env("current_settings", json_decode($this->currentWorkspace->settings));
        $this->rc->output->set_env("current_objects", json_decode($this->currentWorkspacespace->objects));

        $this->rc->output->set_env("corrected_wsp", true);

        $this->setup_module();

        $this->rc->output->set_pagetitle("Espace de travail \"".$this->currentWorkspace->title."\"");
        $this->rc->output->send('mel_workspace.workspace');
    }

    function show_calendar()
    {
        $this->include_script('js/workspace_calendar_page.js');
        $this->include_script('../calendar/lib/js/fullcalendar.js');
        $this->rc->output->send('mel_workspace.calendar');
    }

    public static function get_workspace_logo($workspace) {
        $logo = $workspace->logo;
        if ($logo !== null && strpos($logo, 'mel_elastic') === false && strpos($logo, 'elastic') !== false) {
            $logo = str_replace('elastic', 'mel_elastic', $logo);
        }

        return $logo;
    }

    function get_picture()
    {
        $logo = self::get_workspace_logo($this->currentWorkspace);
        try {
            if ($logo !== null && $logo !== "false" && $logo !== "")
                $html = '<div style="background-color:'.$this->get_setting($this->currentWorkspace,"color").'" class="dwp-round wsp-picture"><img src="'.$logo.'"></div>';
            else
                $html = '<div style="background-color:'.$this->get_setting($this->currentWorkspace,"color").'" class="dwp-round wsp-picture"><span>'.substr($this->currentWorkspace->title, 0, 3)."</span></div>";
        } catch (\Throwable $th) {
            $html = '<div class="dwp-round wsp-picture"></div>';
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->get_picture] Un erreur est survenue pour la récupération de l'image de l'espace de travail ''".$this->currentWorkspace->title."'' !");
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->get_picture]".$th->getTraceAsString());
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->get_picture]".$th->getMessage());
            //throw $th;
        }

        return $html;
    }

    function get_hashtag()
    {
        $html = "";

        try {

            if (count($this->currentWorkspace->hashtags) > 0 && $this->currentWorkspace->hashtags[0] !== "")
                $html = "<span>#".$this->currentWorkspace->hashtags[0]."</span><br/>";

        } catch (\Throwable $th) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->get_hashtag] Un erreur est survenue lors de la récupération de la thématique de l'espace de travail ''".$this->currentWorkspace->title."'' !");
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->get_hashtag]".$th->getTraceAsString());
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->get_hashtag]".$th->getMessage());
        }

        return $html;
    }

    function get_title()
    {
        return html::tag("h1", ["class" => "header-wsp", "style" => "display:inline-block;"], $this->currentWorkspace->title);
    }

    function get_toolbar()
    {
        $icons_class = 'material-symbols-outlined toolbar-icons';

        $icons = [
            "back" => "arrow_back",
            "home" => "home",
            "discussion" => "forum",
            "mail" => "mail",
            "agenda" => "calendar_month",
            "documents" => "folder_open",
            "wekan" => "view_kanban",
            "tasks" => "check_box",
            "news" => "article",
            "params" => "settings",
            "links" => "link",
            "information" => "info",
            "tchap" => "forum"
        ];

        $vseparate = "<v_separate></v_separate>";

        try {
            $is_admin = self::is_admin($this->currentWorkspace, driver_mel::gi()->getUser()->uid);
            $is_in_wsp = self::is_in_workspace($this->currentWorkspace);
            $services = $this->get_worskpace_services($this->currentWorkspace);

            if ($this->channel_enabled !== null && $services[self::CHANNEL])
                $services[self::CHANNEL] = $this->channel_enabled;
            if ($this->tchap_channel_enabled !== null && $services[self::TCHAP_CHANNEL])
                $services[self::TCHAP_CHANNEL] + $this->tchap_channel_enabled;

            $wekan_board_id = "";
            $email = $services[self::EMAIL] ? self::get_wsp_mail($this->currentWorkspace->uid) ?? "" : "";

            $add_classes = "";

            if (true || count($this->get_worskpace_services($this->currentWorkspace, true)) > 5)
                $add_classes = "toolbar-btn-smaller";

            if ($services[self::WEKAN])
                $wekan_board_id = $this->get_object($this->currentWorkspace, self::WEKAN)->id;

            if ($services[self::CLOUD])
                $services[self::CLOUD] = mel_helper::stockage_active();

            $uid = $this->currentWorkspace->uid;
            $html = html::tag("button",["onclick" => "ChangeToolbar('back', this)", "class" => "$add_classes wsp-toolbar-item goback first"], '<span class="'.$icons_class.'">'.$icons["back"].'</span><span class=text-item>Quitter</span>');
            $html .= $vseparate;
            $html .= "<v_separate class=first></v_separate>";
            $html .= html::tag("button",["data-email" => $email, "data-wekan" => $wekan_board_id, "data-uid" => $uid, "onclick" => "ChangeToolbar('home', this)","class" => "$add_classes wsp-toolbar-item wsp-home active", "disabled" => "disabled", "aria-disabled" => "true"], "<span class='".$icons_class."'>".$icons["home"]."</span><span class=text-item>".$this->rc->gettext("home", "mel_workspace")."</span>");
            
            if ($is_in_wsp)
            {

                if ($services[self::AGENDA] || $services[self::EMAIL] || $services[self::CHANNEL]
                || $services[self::TASKS] || $services[self::CLOUD] || $services[self::TCHAP_CHANNEL] || $is_admin)
                    $html .= $vseparate;

                if ($services[self::EMAIL])
                {
                    $onclick = "ChangeToolbar('mail', this)";
                    $html .= html::tag("button",["data-email" => $email, "data-wekan" => $wekan_board_id, "data-uid" => $uid, "onclick" => $onclick, "class" => "$add_classes wsp-toolbar-item wsp-mail"], "<span class='".$icons_class."'>".$icons["mail"]."</span><span class=text-item>".$this->rc->gettext("mail", "mel_workspace")."</span>");
                    
                    if ($services[self::CHANNEL] || $services[self::CLOUD] || $services[self::AGENDA] || $services[self::TASKS] || $services[self::TCHAP_CHANNEL] || $is_admin)
                        $html .= $vseparate;
                }
        
                if ($services[self::AGENDA])
                {
                    $onclick = "ChangeToolbar('calendar', this)";
                    $html .= html::tag("button",["data-email" => $email, "data-wekan" => $wekan_board_id, "data-uid" => $uid, "onclick" => $onclick, "class" => "$add_classes wsp-toolbar-item wsp-agenda"], "<span class='".$icons_class."'>".$icons["agenda"]."</span><span class=text-item>".$this->rc->gettext("calendar", "mel_workspace")."</span>");
                    
                    if ($services[self::CHANNEL] || $services[self::CLOUD] || $services[self::TASKS] || $services[self::TCHAP_CHANNEL] || $is_admin)
                        $html .= $vseparate;
                }
                
                if ($services[self::CHANNEL])
                {
                    $src = "";
                    $channel_datas = $this->get_object($this->currentWorkspace, self::CHANNEL);
                    $channel_name = $channel_datas->name;

                    if (gettype($channel_datas) === "object" && $channel_datas->id !== null)
                    {
        
                        if ($this->currentWorkspace->ispublic)
                            $src="/channel/$channel_name";
                        else
                            $src="/group/$channel_name";  
            
                        $click = "ChangeToolbar('rocket', this, `$src`)";
            
                        try {
                            if ($channel_name === null)
                                $html .= html::tag("button",["data-email" => $email, "data-wekan" => $wekan_board_id, "data-uid" => $uid, "onclick" => $click,"data-isId" => true, "class" => "$add_classes wsp-toolbar-item wsp-ariane", "id"=>"ariane-".$channel_datas], "<span class='".$icons_class."'>".$icons["discussion"]."</span><span class=text-item>".$this->rc->gettext("rocketchat", "mel_workspace")."</span>");
                            else
                                $html .= html::tag("button",["data-email" => $email, "data-wekan" => $wekan_board_id, "data-uid" => $uid, "onclick" => $click,"data-isId" => false, "class" => "$add_classes wsp-toolbar-item wsp-ariane", "id"=>"ariane-".$channel_datas->name], "<span class='".$icons_class."'>".$icons["discussion"]."</span><span class=text-item>".$this->rc->gettext("rocketchat", "mel_workspace")."</span>");
                        } catch (\Throwable $th) {
                            $html .= html::tag("button",["data-email" => $email, "data-wekan" => $wekan_board_id, "data-uid" => $uid, "onclick" => $click,"style"=>"display:none","data-isId" => false, "class" => "$add_classes wsp-toolbar-item wsp-ariane", "id"=>"ariane-notexist"], "<span class=".$icons["discussion"]."></span><span class=text-item>".$this->rc->gettext("rocketchat", "mel_workspace")."</span>");
                        }
            
                        if ($services[self::TASKS] || $services[self::CLOUD] || $services[self::TCHAP_CHANNEL] || $is_admin)
                            $html .= $vseparate;
                    }
                }

                if ($services[self::TCHAP_CHANNEL])
                {

                    $channel_datas = $this->get_object($this->currentWorkspace, self::TCHAP_CHANNEL);
                    if (class_exists('tchap')) $channel_name = tchap::get_room_name($this->get_object($workspace, self::TCHAP_CHANNEL)->id);
                    $click = "ChangeToolbar('tchap', this)";

                    try {
                            $html .= html::tag("button",["data-email" => $email, "data-wekan" => $wekan_board_id, "data-uid" => $uid, "onclick" => $click,"data-isId" => true, "class" => "$add_classes wsp-toolbar-item wsp-ariane", "id"=>"tchap"], "<span class='".$icons_class."'>".$icons["tchap"]."</span><span class=text-item>".$this->rc->gettext("tchap", "mel_workspace")."</span>");
                        } catch (\Throwable $th) {
                            $html .= html::tag("button",["data-email" => $email, "data-wekan" => $wekan_board_id, "data-uid" => $uid, "onclick" => $click,"style"=>"display:none","data-isId" => false, "class" => "$add_classes wsp-toolbar-item wsp-ariane", "id"=>"tchap-notexist"], "<span class=".$icons["tchap"]."></span><span class=text-item>".$this->rc->gettext("tchap", "mel_workspace")."</span>");
                        }

                    if ($services[self::TASKS] || $services[self::CLOUD] || $is_admin)
                            $html .= $vseparate;
                }

                if ($services[self::CLOUD])
                {
                    $html .= html::tag("button",["data-email" => $email, "data-wekan" => $wekan_board_id, "data-uid" => $uid, "onclick" => "ChangeToolbar('stockage', this)" ,"class" => "$add_classes wsp-toolbar-item wsp-documents"], "<span class='".$icons_class."'>".$icons["documents"]."</span><span class=text-item>".$this->rc->gettext("documents", "mel_workspace")."</span>");

                    if ($services[self::TASKS] || ($services[self::WEKAN] && $this->get_setting($this->currentWorkspace, self::WEKAN) !== true) || $is_admin)
                        $html .= $vseparate;
                }

                if ($services[self::WEKAN] && $this->get_setting($this->currentWorkspace, self::WEKAN) !== true)
                {
                    $html .= html::tag("button",["data-email" => $email, "data-wekan" => $wekan_board_id, "data-uid" => $uid, "onclick" => "ChangeToolbar('wekan', this)" ,"class" => "$add_classes wsp-toolbar-item wsp-wekan"], "<span class='".$icons_class."'>".$icons["wekan"]."</span><span class=text-item>Kanban</span>");
                    
                    if ($services[self::TASKS] || $is_admin)
                        $html .= $vseparate;
                }
        
                if ($services[self::TASKS])
                {
                    $html .= html::tag("button",["data-email" => $email, "data-wekan" => $wekan_board_id, "data-uid" => $uid, "onclick" => "ChangeToolbar('tasklist', this)" ,"class" => "$add_classes wsp-toolbar-item wsp-tasks"], "<span class='".$icons_class."'>".$icons["tasks"]."</span><span class=text-item>".$this->rc->gettext("tasks", "mel_workspace")."</span>");
                    
                    if ($is_admin || $services[self::LINKS])
                        $html .= $vseparate;
                }
        
                if ($is_admin)
                    $html .= html::tag("button",["data-email" => $email, "data-wekan" => $wekan_board_id, "data-uid" => $uid, "onclick" => "ChangeToolbar('params', this)","class" => "$add_classes wsp-toolbar-item wsp-item-params"], "<span class='".$icons_class."'>".$icons["params"]."</span><span class=text-item>".$this->rc->gettext("params", "mel_workspace")."</span>");
                else
                {
                    $html .= $vseparate;
                    $html .= html::tag("button",["data-email" => $email, "data-wekan" => $wekan_board_id, "data-uid" => $uid, "onclick" => "ChangeToolbar('params', this)","class" => "$add_classes wsp-toolbar-item wsp-item-params"], "<span class='".$icons_class."'>".$icons["information"]."</span><span class=text-item>".$this->rc->gettext("infos", "mel_workspace")."</span>");
                }

                $html .= "<v_separate class=first></v_separate>";
                $html .= html::tag("button",["data-email" => $email, "data-wekan" => $wekan_board_id, "data-uid" => $uid, "onclick" => "ClickOnButton()","class" => "wsp-toolbar-item small-item"], "<span class=icon-mel-dots></span><span class=text-item>".$this->rc->gettext("plus", "mel_workspace")."</span>");
            }
        } catch (\Throwable $th) {
            $html = "";
            $this->log_error("get_toolbar", "des éléments de la toolbar de", $th);
        }
        
        return $html;
    }

    function get_description()
    {
        return mel_helper::wash_html($this->currentWorkspace->description);
    }

    function get_end_date()
    {

        return html::p(["id" => "wsp-end-date"]);
    }

    function get_users_info()
    {
        $icon = "icon-mel-plus plus";
        $icon_action = $icon;
        $icon_quit = "icon-mel-close plus";
        $exists = self::is_in_workspace($this->currentWorkspace);
        $admin = self::is_admin($this->currentWorkspace);
        $html = "";

        if ($exists)
        {
            $html.= html::tag("button", [
                "id" => "createthings",
                "class" => "mel-button btn btn-secondary ignoreActive hide-on-small",
                "data-popup" => "groupoptions-create",
                "aria-haspopup" => "true",
            ],
            (false && $admin ? "Créer".html::tag("span", ["class" => $icon]) : "Actions".html::tag("span", ["class" => $icon_action]))
            );
            $html.= '<a data-popup="groupoptions-wsp-plus-actions" role="button" href="#" aria-haspopup="true" aria-expanded="false" aria-owns="groupoptions-wsp-plus-actions" data-original-title="" style="text-decoration:none;" id=groupoptions-wsp-plus-a class="ignoreActive btn btn-secondary mel-button show-on-small">Plus d\'options<span class="plus icon-mel-plus "></span></a>';
        }

        if ($exists && $admin)
        {
            $html.= html::tag("button",["style" => "margin-right:15px", "class" => "hide-on-small mel-button invite-button plus", "onclick" => "rcmail.command(`workspace.add_users`)"], html::tag("span", [], $this->gettext("invite_member", "mel_workspace")).html::tag("span", ["class" => $icon]));
            $this->add_button(array(
                'command' => "workspace.add_users",
                'class'	=> 'icon-mel icon-mel-plus',
                'innerclass' => 'restore-font',
                'label'	=> 'invite_member',
                'title' => 'invite_member',
                'type'       => 'link-menuitem',
                'domain' => "mel_workspace"
            ), "groupoptions-wsp-plus-actions");
        }
        if ($exists)
        {
            $html.= html::tag("button",["class" => "mel-button quit-button plus hide-on-small", "onclick" => "rcmail.command('workspace.leave')"], html::tag("span", [], $this->gettext("quit_space", "mel_workspace")).html::tag("span", ["class" => $icon_quit]));
            $this->add_button(array(
                'command' => "workspace.leave",
                'class'	=> 'icon-mel icon-mel-close',
                'innerclass' => 'restore-font',
                'label'	=> 'quit_space',
                'title' => 'quit_space',
                'type'       => 'link-menuitem',
                'domain' => "mel_workspace"
            ), "groupoptions-wsp-plus-actions");

            if (!$admin && $this->rc->config->get('workspace_bar_color_force', "default") === "default")
            {
                $navColorActive = $this->is_color_custom($this->currentWorkspace);
                $this->add_button(array(
                    'command' => "workspace.toggle_bar_color",
                    'class'	=> 'icon-mel icon-mel-parameters-invert',
                    'innerclass' => 'restore-font',
                    'label'	=> ($navColorActive ? 'unactive_bar_color': 'active_bar_color'),
                    'title' => ($navColorActive ? 'unactive_bar_color_title': 'active_bar_color_title'),
                    'type'       => 'link-menuitem',
                    'domain' => "mel_workspace"
                ), "groupoptionscreate");
            }
        }
        else
            $html.= html::tag("button",["class" => "mel-button quit-button plus", "onclick" => "rcmail.command(`workspace.join`)"], html::tag('span', [], 'Rejoindre').html::tag('span', ['class' => $icon])); 
        
        return html::div([], $html);
    }

    private function compare_AAA($hexaColor, $otherColor = '#FFFFFF') {
        return !mel_helper::color()->color_from_hexa($hexaColor)->compare_AAA(mel_helper::color()->color_from_hexa($otherColor));
    }

    public function get_badge_text_color($wsp) {
        if ($wsp->logo === null || $wsp->logo == 'false' || $wsp->logo == false || $wsp->logo == '')
        {
            return !$this->compare_AAA($this->get_setting($wsp, "color"), '#363A5B') ? '#363A5B' : 'white';
        }
        
        return null;
    }

    function set_wsp_style()
    {
        $style = "";

        if ($this->is_color_custom($this->currentWorkspace))
        {
            $hex = $this->get_setting($this->currentWorkspace, "color");
            $color = mel_helper::color()->color_from_hexa($hex);
            $lighter = $color->lighter(20)->to_rgb();
            $darker = $color->darker(20)->to_rgb();
            $textColor = $color->need_black_text() ? "black!important" : "white";

            $hover = [1 => 10, 2 => 10];
            $focus = $hover;
            $active_focus = [ 1 => 20, 2 => 45, 3 => 28];


            $style = "<style>
            .wsp-toolbar.melw-wsp{
                background-color:$hex!important;
            }

            .wsp-toolbar v_separate
            {
                border-color:$lighter!important;
            }

            .wsp-toolbar.melw-wsp button.wsp-toolbar-item
            {
                color:$textColor;
            }

            .wsp-toolbar.melw-wsp button.wsp-toolbar-item:hover,
            .wsp-toolbar.melw-wsp button.wsp-toolbar-item.active
            {
                background: radial-gradient(circle, $darker ".$hover[1]."%, rgba(255,255,255,0) ".$hover[2]."%) !important
            }

            .wsp-toolbar.melw-wsp button.wsp-toolbar-item:focus
            {
                background: radial-gradient(circle, $lighter ".$focus[1]."%, rgba(255,255,255,0) ".$focus[2]."%) !important
            }

            .wsp-toolbar.melw-wsp button.wsp-toolbar-item.active:focus
            {
                background: radial-gradient(circle, $darker ".$active_focus[1]."%, $lighter ".$active_focus[2]."%, rgba(255,255,255,0) ".$active_focus[3]."%)
            }

            .btn.btn-block.wsp-toolbar-melw-wsp-hider
            {
                background-color: $hex!important;
                border-color: $lighter;
            }

            .btn.btn-block.wsp-toolbar-melw-wsp-hider:hover
            {
                background-color: $darker!important;
            }

            
            html.dark-mode .btn.btn-block.wsp-toolbar-melw-wsp-hider:hover
            {
                background-color: $darker!important;
            }

            html.mwsp, #layout-content.mwsp, iframe.discussion-frame.mwsp
            {
                border-color: $hex!important;
            }

            iframe.discussion-frame.mwsp{
                background-color: $hex!important;
            }
            </style>";

            $this->rc->output->set_env("current_bar_colors", $style);
        }

        return $style;

    }

    function is_color_custom($wsp, $default = true)
    {
        return $this->is_color_custom_by_uid($wsp->uid, $default);
    }

    function is_color_custom_by_uid($uid, $default = true)
    {
        $value = $default;
        $config = $this->rc->config->get('workspace_bar_color_force', "default");

        switch ($config) {
            case 'never':
                $value = false;
                break;

            case 'always':
                $value = true;
                break;
            
            default:
                $config = $this->rc->config->get('workspaces_personal_datas', []);

                if ($config[$uid] === null)
                    $value = $default;
        
                $value = $config[$uid]["bar_color"] ?? $default;   
                break;
        }

        return $value;

 
    }

    function toggle_nav_color()
    {
        $default = true;
        $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_GPC);

        $config = $this->rc->config->get('workspaces_personal_datas', []);
        
        if ($config[$uid] === null)
            $config[$uid] = [];

        $config[$uid]["bar_color"] = !($config[$uid]["bar_color"] ?? $default);

        $this->rc->user->save_prefs(array('workspaces_personal_datas' => $config));

        echo  $config[$uid]["bar_color"];
        exit;
        
    }

    const APP = "-wsp-item";
    const CHANNEL = "channel";
    const AGENDA = "calendar";
    const TASKS = "tasks";
    const EMAIL = "mail";
    const CLOUD = "doc"; 
    const GROUP = "annuaire";
    const WEKAN = "wekan";
    const LINKS = "useful-links";
    const TCHAP_CHANNEL = "tchap-channel";

    public function get_worskpace_services($workspace, $services_to_remove = false, $forceIsInWorkspace = false)
    {

        $is_in_wsp = $forceIsInWorkspace ? true : self::is_in_workspace($workspace);

        $datas = [
            self::CHANNEL => $is_in_wsp && $this->get_object($workspace, self::CHANNEL) !== null,
            self::AGENDA => $is_in_wsp && $this->get_object($workspace, self::AGENDA) === true,
            self::TASKS => $is_in_wsp && $this->get_object($workspace, self::TASKS) !== null,
            self::EMAIL => $is_in_wsp && $this->get_object($workspace, self::GROUP) === true,
            self::CLOUD => $is_in_wsp && $this->get_object($workspace, self::CLOUD) === true,
            self::WEKAN => $is_in_wsp && $this->get_object($workspace, self::WEKAN) !== null,
            self::LINKS => $is_in_wsp && $this->get_object($workspace, self::LINKS) !== null,
            self::TCHAP_CHANNEL => $is_in_wsp && $this->get_object($workspace, self::TCHAP_CHANNEL) !== null
        ];

        if ($datas[self::TASKS] && !$datas[self::WEKAN]) $datas[self::WEKAN] = true;

        if (driver_mel::gi()->getUser()->is_external) {
             $datas[self::AGENDA] = false;
             $datas[self::EMAIL] = false;
        }

        if ($services_to_remove)
        {
            $services = [];

            if ($is_in_wsp)
            {
                foreach ($datas as $key => $value) {
                    if ($value)
                        $services[] = $key;
                }
            }

            return $services;
        }
        else
            return $datas;
    }

    function get_services()
    {
        $uid = $this->currentWorkspace->uid;

        $services = $this->get_worskpace_services($this->currentWorkspace);
        $is_in_wsp = self::is_in_workspace($this->currentWorkspace);

        $icons = [
            self::AGENDA => "icon-mel-calendar",
            "arrow_left" => "icon-mel-arrow-left",
            "arrow_right" => "icon-mel-arrow-right",
            "warning" => "icon-mel-warning",
            "waiting" => "icon-mel-time",
            "arrow_close" => "icon-mel-chevron-right"
        ];

        $html_return = "";

        if (!$is_in_wsp)
        {
            return html::div([], "<center>Vous devez rejoindre l'espace pour pouvoir voir son contenu.</center>");
        }

        try {
            //Agenda ou tâches
            if ($services[self::AGENDA] || $services[self::TASKS])
            {
                if ($this->currentWorkspace->ispublic)
                {
                    $col = [
                        "left" => "",
                        "right" => ""
                    ];
            
                    //Service agenda/calendrier
                    if ($services[self::AGENDA])
                    {
                        $arrow = [
                            "left" => '<button class="btn-mel-invisible btn-arrow" style="float:right" onclick="change_date(-1)"><span class="'.$icons["arrow_left"].'"><span class="sr-only">'.$this->rc->gettext("last_day", "mel_workspace").'</span></span></button>',
                            "right" => '<button class="btn-mel-invisible btn-arrow" style="float:left" onclick="change_date(1)"><span class="'.$icons["arrow_right"].'"><span class="sr-only">'.$this->rc->gettext("next_day", "mel_workspace").'</span></span></button>'
                        ];
        
                        $header = html::div(["class" => "row"], 
                            html::div(["class" => "col-2"], 
                                html::tag("span", ["class" => $icons[self::AGENDA]." wsp-agenda-icon"])).
                            html::div(["class" => "col-6"],
                                html::tag("span", ["class" => "swp-agenda-date"])).
                            html::div(["class" => "col-4"],
                                html::div(["class" => "row"], 
                                    html::div(["class" => "col-6"], $arrow["left"]).
                                    html::div(["class" => "col-6"], $arrow["right"])
                            ))
                        );
        
                        $body = "";
                        $agenda = self::AGENDA;
                        $col["right"].= html::tag("h2", ["class"=> "reunions responsive-tab-name"], "Mes réunions");
                        $col["right"].= $this->block("wsp-block-$agenda", "wsp-block-$agenda wsp-block", $header, $body, "create_calendar(`$uid`, this)", $this->rc->gettext("create_event", "mel_workspace"));
                    }
        
                    //Service tâches
                    if($services[self::TASKS])
                    {
                        $affiche_urgence = false;
        
                        $header = html::div(["class" => "row", "style" => "justify-content: center;"],
                            html::div(["id" => "wsp-task-urgence", "class" => "col-6 tab-task mel-tab mel-tabheader ".($affiche_urgence ? "active" : ""), "style" => ($affiche_urgence ? "" : "display:none")], 
                                html::tag("span", [], "Tâches urgentes")
                            ).
                            html::div(["id" => "wsp-task-classik", "class" => "col-6 tab-task mel-tab mel-tabheader last ".(!$affiche_urgence ? "active" : ""), "style" => ($affiche_urgence ? "" : "display:none")], 
                                html::tag("span", [], "Tâches en cours")
                        ));
                        $header.=   html::div(["class" => "wsp-task-urgence nb-task tab-task mel-tab-content","style" => ($affiche_urgence ? "" : "display:none")], 
                        html::tag("span", ["class" => $icons["warning"]." roundbadge large warning"]).
                        html::tag("span", [], 
                            html::tag("span", ["class" => "danger-task"]).
                            '<span class="nb-danger-task nb font-size-large" tâches urgentes'
                        )                
                        ).           html::div(["id" => "nb-waiting-task","class" => "nb-task wsp-task-classik tab-task mel-tab-content", "style" => (!$affiche_urgence ? "" : "display:none")], 
                        html::tag("span", ["class" => $icons["waiting"]." roundbadge large clear"]).
                        html::tag("span", [], 
                            html::tag("span", ["class" => "waiting-task"]).
                            '<span class="nb-waiting-task nb font-size-large"></span> tâches en cours'
                        )
                        );
                        $body = html::div(["id" => "danger-task", "class" => "wsp-task-urgence tab-task mel-tab-content", "style" => ($affiche_urgence ? "" : "display:none;")]).
                                html::div(["id" => "waiting-task", "class" => "wsp-task-waiting tab-task mel-tab-content", "style" => (!$affiche_urgence ? "" : "display:none;")]);
        
                        $tasks = self::TASKS;
                        $col["left"].= html::tag("h2", ["class" => "tasks responsive-tab-name"], "Mes tâches").$this->block("wsp-block-$tasks", "wsp-block-$tasks wsp-block", $header, $body, "create_tasks(`$uid`, this)", $this->rc->gettext("create_task", "mel_workspace"));
                    }
                    
                    $tmp = $col["left"];
                    $col["left"] = $col["right"];
                    $col["right"] = $tmp;
        
                    if ($col["left"] === "")
                    {
                        $col["left"] = $col["right"];
                        $col["right"] = "";
                    }

                    $html_return .= html::div(["class" => "row"], 
                        html::div(["class" => ($col['right'] === '' ? 'col-md-12' : 'col-md-6')." ta-left mel-responsive-tab-content",                    
                            "data-selector-tab" => '.ta-left',
                            'data-is-default-tab' => true,
                            'data-parent-tabs' => '.wsp-services.wsp-object.wsp-home'
                        ], $col["left"]).
                        ($col["right"] === "" ? "" : html::div(["class" => "col-md-6 ta-right mel-responsive-tab-content",                         
                        "data-selector-tab" => '.ta-right',
                        'data-is-default-tab' => false,
                        'data-parent-tabs' => '.wsp-services.wsp-object.wsp-home'], $col["right"]))
                    );                
                }
                else {
                    $html_return .= html::div(['class' => 'row'], $this->rc->output->parse("mel_workspace.planning", false, false));
                    if($services[self::TASKS])
                    {
                        $affiche_urgence = false;
        
                        $header = html::div(["class" => "row", "style" => "justify-content: center;"],
                            html::div(["id" => "wsp-task-urgence", "class" => "col-6 tab-task mel-tab mel-tabheader ".($affiche_urgence ? "active" : ""), "style" => ($affiche_urgence ? "" : "display:none")], 
                                html::tag("span", [], "Tâches urgentes")
                            ).
                            html::div(["id" => "wsp-task-classik", "class" => "col-6 tab-task mel-tab mel-tabheader last ".(!$affiche_urgence ? "active" : ""), "style" => ($affiche_urgence ? "" : "display:none")], 
                                html::tag("span", [], "Tâches en cours")
                        ));
                        $header.=   html::div(["class" => "wsp-task-urgence nb-task tab-task mel-tab-content","style" => ($affiche_urgence ? "" : "display:none")], 
                        html::tag("span", ["class" => $icons["warning"]." roundbadge large warning"]).
                        html::tag("span", [], 
                            html::tag("span", ["class" => "danger-task"]).
                            '<span class="nb-danger-task nb font-size-large" tâches urgentes'
                        )                
                        ).           html::div(["id" => "nb-waiting-task","class" => "nb-task wsp-task-classik tab-task mel-tab-content", "style" => (!$affiche_urgence ? "" : "display:none")], 
                        html::tag("span", ["class" => $icons["waiting"]." roundbadge large clear"]).
                        html::tag("span", [], 
                            html::tag("span", ["class" => "waiting-task"]).
                            '<span class="nb-waiting-task nb font-size-large"></span> tâches en cours'
                        )
                        );
                        $body = html::div(["id" => "danger-task", "class" => "wsp-task-urgence tab-task mel-tab-content", "style" => ($affiche_urgence ? "" : "display:none;")]).
                                html::div(["id" => "waiting-task", "class" => "wsp-task-waiting tab-task mel-tab-content", "style" => (!$affiche_urgence ? "" : "display:none;")]);
        
                        $tasks = self::TASKS;
                        $col["left"] = $this->block("wsp-block-$tasks", "wsp-block-$tasks wsp-block", $header, $body, "create_tasks(`$uid`, this)", $this->rc->gettext("create_task", "mel_workspace"));
                        $html_return .= html::div(['class' => 'row tab-events-tasks tab-events mel-tab-content', 'style' => 'display:none'], html::div(['class' => 'col-12'], $col["left"]));
                    }
                }

            }
    
            $email = self::get_wsp_mail($uid);

            if ($services[self::EMAIL] && $email === null)
                $services[self::EMAIL] = false;

            if ($services[self::CHANNEL] && $this->channel_enabled !== null)
                $services[self::CHANNEL] = $this->channel_enabled;

            if($services[self::TCHAP_CHANNEL] && $this->channel_enabled !== null)
                $services[self::TCHAP_CHANNEL] = $this->channel_enabled;

            //Email ou discussion
            if ($services[self::EMAIL] || $services[self::CHANNEL])
            {
                if ($is_in_wsp)
                {
                    $src = $this->rc->config->get('rocket_chat_url');
                    $channel_name = $this->get_object($this->currentWorkspace, self::CHANNEL)->name;
                    
                    if ($this->currentWorkspace->ispublic)
                        $src.="channel/$channel_name?layout=embedded";
                    else
                        $src.="group/$channel_name?layout=embedded";  
        
                    $header_component = [];
                    if ($services[self::EMAIL])
                        $header_component[] = html::tag("button", ["id" => "unreads-emails", "class" => "tab-unreads mel-tab mel-tabheader ¤¤¤"], "Emails");
                    if ($services[self::CHANNEL])
                        $header_component[] = html::tag("button", ["id" => "unreads-ariane", "class" => "tab-unreads mel-tab mel-tabheader ¤¤¤"], "Discussions Ariane");
                    
                    $tmp = "";
                    $count = count($header_component);

                    for ($i=0; $i < $count; ++$i) { 
                        if ($i === $count-1)
                            $tmp .= str_replace("¤¤¤", "active".($i === $count-1 ? " last" : ""), $header_component[$i]);
                        else
                            $tmp .= str_replace("¤¤¤", ($i === $count-1 ? " last" : ""), $header_component[$i]);
                    }

                    $header_component = $tmp;
        
                    $header = 
                        html::div(["class" => "row", "style"=> "padding-bottom:15px"], 
                            $header_component
                        );
        
                    $body_component = [];
                    if ($services[self::EMAIL])
                        $body_component[] = html::div(["class" => "unreads-emails tab-unreads mel-tab-content", "style" => "¤¤¤"],
                            ""//$this->get_mails($this->currentWorkspace)
                        );

                    if ($services[self::CHANNEL]){
                        $body_component[] = html::tag("button",["title" => $this->rc->gettext("open_ariane", "mel_workspace"),"aria-expanded" => "false","onclick" => "UpdateFrameAriane()","class" => "mel-focus text-header no-style full-width unreads-ariane tab-unreads mel-tab-content wsp-ariane-header", "style" => "¤¤¤;"],
                            html::tag("span", ["style" => "position:relative"], "#$channel_name".html::tag("span", ["class" => "ariane-count notif roundbadge lightgreen"])).
                            html::tag("span", ["class" => $icons["arrow_close"]." arrow", "style" => "float:right"])
                        )
                        .html::div(["class" => "ariane-frame unreads-ariane tab-unreads mel-tab-content", "style" => ""],
                            html::tag("iframe", 
                            ["src" => $src,"id" => "wsp-disc-id", "class"=>"", "style" => "display:none;width:100%;height:500px;", "title" => "Discussions dans le canal de messagerie #$channel_name"]
                            )
                        );
                    }

                    $tmp = "";
                    $count = count($body_component);

                    for ($i=0; $i < $count; ++$i) { 
                        if ($i === $count-1)
                            $tmp .= str_replace("¤¤¤", "", $body_component[$i]);
                        else
                            $tmp .= str_replace("¤¤¤", "display:none", $body_component[$i]);
                    }

                    $body_component = $tmp;
                    $body = html::div(["class" => ""],
                        $body_component
                    );
        
                    $html_return.= 
                    html::div(                    [
                        "data-selector-tab" => '.unread-exchanges-div',
                        'data-is-default-tab' => false,
                        'data-parent-tabs' => '.wsp-services.wsp-object.wsp-home',
                        'class' => 'unread-exchanges-div mel-responsive-tab-content'
                    ],
                    html::tag("h2", ["class" => "unread-exchanges responsive-tab-name"], "Mes échanges non lus").$header.html::div(["class" => "wsp-block wsp-left"], $body));
                }
            }

            //Mes documents
            $have_surveys = $this->have_surveys($this->currentWorkspace);
            if ($services[self::CLOUD] || $services[self::LINKS] || true)
            {
                $cloudNotActive = $services[self::CLOUD] && !mel_helper::stockage_active();
                $header_component = [];

                if ($services[self::CLOUD])
                    $header_component[] = html::div(["id" => "ressources-cloud", "class" => "tab-ressources mel-tab mel-tabheader ¤¤¤"], "Mes documents");

                if ($services[self::LINKS])
                    $header_component[] = html::div(["id" => "ressources-links", "class" => "tab-ressources mel-tab mel-tabheader ¤¤¤"], "Liens utiles");

                $header_component[] = html::div(["id" => "ressources-surveys", "class" => "tab-ressources mel-tab mel-tabheader ¤¤¤"], "Sondages");

                $tmp = "";
                $count = count($header_component);

                for ($i=0; $i < $count; ++$i) { 
                    if ($i === ($have_surveys ? $count - 1 : ($cloudNotActive ? 1 : 0)))
                        $tmp .= str_replace("¤¤¤", "active".($i === $count-1 ? " last" : ""), $header_component[$i]);
                    else
                        $tmp .= str_replace("¤¤¤", ($i === $count-1 ? " last" : ""), $header_component[$i]);
                }

                $header_component = $tmp;

                $header = 
                html::div(["class" => "row", "style"=> "padding-bottom:15px"], 
                    $header_component
                );
                
                $before_body_component = [];

                if ($services[self::CLOUD])
                {
                    $cloudDisabled = ($cloudNotActive ? "disabled" : "");
                    $before_body_component[] = html::div(["class" => "ressources-cloud tab-ressources mel-tab-content", "style" => "¤¤¤;text-align: right;"],
                        html::tag("button", ["title" => "Actualiser","id" => "refresh-nc", "onclick" => "rcmail.env.wsp_roundrive_show.checkNews()", $cloudDisabled=>$cloudDisabled,"class" => "$cloudDisabled mel-button btn btn-secondary"],
                            '<span class="icofont-refresh"><p class="sr-only">Actualiser la visualisation du stockage</p></span>'
                        ).
                        html::tag("button", ["onclick" => "$('.wsp-toolbar-item.wsp-documents').click()", $cloudDisabled => $cloudDisabled, "class" => "$cloudDisabled mel-button btn btn-secondary white mel-before-remover", "style" => "    margin: 0 10px;
                    margin-top: 15px;
                "], 
                            '<span>Accéder au drive</span><span class="icon-mel-external plus"></span>'
                        )/*.
                        html::tag("button", [$cloudDisabled => $cloudDisabled, "onclick"  => "rcmail.env.wsp_roundrive_show.createFile()", "class" => "$cloudDisabled mel-button btn btn-secondary"], 
                            '<span>Créer</span><span class="icon-mel-plus plus"></span>'
                        )*/
                    );
                }

                if ($services[self::LINKS])
                {
                  $this->include_stylesheet('../mel_useful_link/skins/elastic/links.css');
                     $this->get_workspace_ulinks();
                    
                    $before_body_component[] = html::div(["class" => "ressources-links tab-ressources mel-tab-content", "style" => "¤¤¤;text-align: right;"],
                        html::tag("button", ["id" => "mulba", "class" => "mel-button btn btn-secondary"], 
                            '<span>Créer</span><span class="icon-mel-plus plus"></span>'
                        )
                    );
                }

                $before_body_component[] = html::div(["class" => "ressources-surveys tab-ressources mel-tab-content", "style" => "¤¤¤;text-align: right;"],
                    html::tag("button", ["id" => "button-create-new-survey", "class" => "mel-button btn btn-secondary", "style" => ($have_surveys ? '' : 'display:none')], 
                        '<span>Lier un sondage</span><span class="icon-mel-plus plus"></span>'
                    )
                );

                $tmp = "";
                $count = count($before_body_component);

                for ($i=0; $i < $count; ++$i) { 
                    if ($i === ($have_surveys ? $count - 1 : ($cloudNotActive ? 1 : 0)))
                        $tmp .= str_replace("¤¤¤", "", $before_body_component[$i]);
                    else
                        $tmp .= str_replace("¤¤¤", "display:none", $before_body_component[$i]);
                }

                $before_body_component = $tmp;

                $before_body = html::div([],
                $before_body_component
            );

                $body_component = [];

                if ($services[self::CLOUD]){
                    if ($cloudNotActive)
                    {
                        $body_component[] = html::div(["class" => "ressources-cloud tab-ressources mel-tab-content", "style" => "¤¤¤"],
                        //'<span class="spinner-grow"><p class="sr-only">Chargement des documents...</p></span>'
                        html::tag('center', [],
                        html::tag('span', [], $this->rc->gettext(mel_helper::why_stockage_not_active(), "mel_workspace"))).    
                        html::tag("div", 
                            [ "id" => "cloud-frame", "style" => "overflow:auto;width:100%;max-height:500px;display:none;"]
                            )
                        );
                    }
                    else {
                        $body_component[] = html::div(["class" => "ressources-cloud tab-ressources mel-tab-content", "style" => "¤¤¤"],
                        //'<span class="spinner-grow"><p class="sr-only">Chargement des documents...</p></span>'
                        html::tag('center', ["id" => "spinner-grow-center"],
                        html::tag('span', ["class" => "spinner-grow"], html::tag('p', ["class" => "sr-only"], "Chargement des documents..."))).    
                        html::tag("div", 
                            [ "id" => "cloud-frame", "style" => "overflow:auto;width:100%;max-height:500px;display:none;"]
                            )
                        );
                    }
                }


                if ($services[self::LINKS] && class_exists('mel_useful_link')) {

                    // $links = $this->rc->plugins->get_plugin('mel_useful_link')->get_workspace_link($this->currentWorkspace, $this, true);
                    $body_component[] = html::div(["class" => "ressources-links tab-ressources mel-tab-content links-items", "style" => "¤¤¤"]);
                }

                if ($have_surveys)
                {
                    $html = '';
                    $first = false;
                    foreach (mel_helper::Enumerable($this->get_object($this->currentWorkspace, self::SURVEY))->orderBy(function ($k, $v) {
                        return $v->create_date;
                    }, true) as $key => $value) {
                        $html .= html::div(['class' => 'click-master'], 
                            html::div(['class' => 'btn-group', 'style' => 'width:100%'], 
                                html::tag('button', ['id' => 'sondage-'.$value->id, 'class' => (!$first ? 'selected ' : '').'mel-focus text-header no-style full-width btn btn-secondary click-sondage click-tab'], html::tag('span', [], $value->title).html::tag('span', ['class' => (!$first ? 'icon-mel-chevron-down' : 'icon-mel-chevron-right').' float-right']))
                                .html::tag('button', ['class' => 'mel-button btn btn-secondary no-button-margin', 'onclick' => 'survey_copy(this)', 'data-slink' => $value->link], html::tag('span', ['class' => 'icon-mel-copy']))
                                .($this->can_delete_survey($this->currentWorkspace, $value) ? html::tag('button', ['class' => 'mel-button btn btn-secondary no-button-margin', 'onclick' => 'survey_edit(this)', 'data-sid' => $value->id, 'data-stitle' => $value->title, 'data-slink' => $value->link], html::tag('span', ['class' => 'icon-mel-pencil']))
                                .html::tag('button', ['class' => 'mel-button btn btn-danger no-button-margin', 'style' => 'border-bottom-right-radius:0;border-top-right-radius:5px;', 'onclick' => 'survey_delete(this)', 'data-sid' => $value->id], html::tag('span', ['class' => 'icon-mel-trash'])) : '')
                            ).
                            html::div(['class' => (!$first ? '' : 'hidden').' click-body click-sondage sondage-'.$value->id], 
                                html::tag('iframe', ['class' => 'wsp-sondage', 'data-src' => $value->link.'&_embeded=1', 'src' => $value->link.'&_embeded=1', 'style' => 'width:100%;height:450px'])
                            )
                        );

                        if (!$first) $first = true;
                    }

                    $body_component[] = html::div(["class" => "ressources-surveys tab-ressources mel-tab-content bc", "style" => "¤¤¤"], $html);
                }
                else {
                    //@Rotomeca : Temp code url wainting patches
                    $body_component[] = html::div(["class" => "ressources-surveys tab-ressources mel-tab-content bc", "style" => "¤¤¤"],
                        "<center>Créez un nouveau sondage (<a href=\"https://pegase.din.developpement-durable.gouv.fr/?_skin=mel_elastic\">ici</a>) puis liez le avec cet espace. (<a id=\"link-a-survey\" onclick=\"rcmail.command('workspace.survey.create')\" href=\"#\">ici</a>)</center>"
                     ); 
                }

                $tmp = "";
                $count = count($body_component);

                for ($i=0; $i < $count; ++$i) { 
                    if ($i === ($have_surveys ? $count - 1 : ($cloudNotActive ? 1 : 0)))
                        $tmp .= str_replace("¤¤¤", "", $body_component[$i]);
                    else
                        $tmp .= str_replace("¤¤¤", "display:none", $body_component[$i]);
                }

                $body_component = $tmp;
                $body = html::div(["class" => ""],
                    $body_component
                );

                $html_return.= html::div([
                    "data-selector-tab" => '.response-resources-div',
                    'data-is-default-tab' => false,
                    'data-parent-tabs' => '.wsp-services.wsp-object.wsp-home',
                    'class' => 'response-resources-div mel-responsive-tab-content'
                ]
                    ,
                html::tag("h2", ["class" => "resources responsive-tab-name"], "Mes ressources").$header.$before_body.html::div(["class" => "wsp-block wsp-left wsp-resources"], $body));
            }
    
    
            $this->rc->output->set_env("current_workspace_constantes", [
                "mail" => self::EMAIL,
                "agenda" => self::AGENDA,
                "tasks" => self::TASKS,
                "ariane" => self::CHANNEL
            ]);
            $this->rc->output->set_env("current_workspace_services", $services);

        } catch (\Throwable $th) {
            //throw $th;
            $this->log_error("get_services", "des services de", $th);
        }

        return $html_return;//$col["right"].$col["left"];
        // html::div(["class" => "row"],
        //     html::div(["class" => "col-md-8"], $col["left"]).
        //     html::div(["class" => "col-md-4"], $col["right"])
    }

    function get_pages()
    {
        $html = "";

        try {
            if (self::is_admin($this->currentWorkspace))
                $html = $this->setup_params_page();
            else 
                $html = $this->setup_user_page();
        } catch (\Throwable $th) {
            $this->log_error("get_pages", "des différentes pages de", $th);
        }

        return $html;
    }

    function setup_user_page()
    {
        mel_metapage::IncludeAvatar();

        $env = [];
        $html = '<div class="wsp-params wsp-object" style="margin-top:30px;display:none">';
        $shares = $this->sort_user($this->currentWorkspace->shares); 
        $nbuser = count($shares);

        $html .= "<h2>Liste des membres ($nbuser)</h2>";
        $html .= '<div class="wsp-block">';

        foreach ($shares as $key => $value) {
            $user = driver_mel::gi()->getUser($value->user); 
            $tmp = $user->name;
            
            if (!isset($user)) continue;

            if (isset($tmp) || $tmp !== '')
            {
                $html .= html::div(["class" => "row"], 
                html::div(["class" => "col-2"],
                    html::div(["class" => "dwp-round", "style" => "background-color:var(--mel-button-background-color);"],
                        html::tag("bnum-avatar", ["data-email" => $user->email, 'style' => '--avatar-border-loaded: solid 4px '.$this->get_setting($this->currentWorkspace, 'color')])//$this->rc->config->get('rocket_chat_url')."avatar/".$value->user])
                    )
                ).
                html::div(["class" => "col-10"],
                    html::tag("span", ["class" => "name"], driver_mel::gi()->getUser($value->user)->name.(self::is_admin($this->currentWorkspace, $value->user) ? html::tag("span", ["class" => "plus icofont-crown"]) : "")).
                    "<br/>".
                    html::tag("span", ["class" => "email"], driver_mel::gi()->getUser($value->user)->email ?? 'Adresse inconnue')
                )
                );
                $env[$user->email] = ['email' => $user->email, 'name' => $user->name, 'fullname' => $user->fullname, 'is_external' => $user->is_external];
            }
        }

        $html .= "</div></div>";

        $this->rc->output->set_env('current_workspace_users', $env);

        return $html;

    }

    function setup_params_page()
    {
        $uid = $this->currentWorkspace->uid;
        $user_rights = $this->currentWorkspace->shares[driver_mel::gi()->getUser()->uid]->rights;
        $html = $this->rc->output->parse("mel_workspace.params", false, false);

        if ($user_rights === "l")
            $html = str_replace("<users-rights/>", "", $html);
        else
            $html = str_replace("<users-rights/>", $this->setup_params_rights($this->currentWorkspace), $html); 

        //JJ/MM/YYYY HH:mm 
        $endDate = $this->get_setting($this->currentWorkspace, "end_date") ?? "JJ/MM/YYYY HH:mm ";

        if ($endDate === '')
            $endDate = "JJ/MM/YYYY HH:mm ";

        $html = str_replace("<end_date/>", $endDate, $html);
        $html = str_replace("<color/>", $this->get_setting($this->currentWorkspace, "color"), $html);
        $html = str_replace("<applications/>", $this->setup_params_apps($this->currentWorkspace), $html);

        if ($user_rights === Share::RIGHT_OWNER)
            $html = str_replace("<title/>", $this->currentWorkspace->title, $html);
        else
            $html = str_replace("<title/>", '', $html);

        if ($user_rights === Share::RIGHT_OWNER)
            $html = str_replace("<desc/>", ($this->currentWorkspace->description === '' ? 'Nouvelle description...' : ($this->currentWorkspace->description ?? 'Nouvelle description...')), $html);
        else
            $html = str_replace("<desc/>", '', $html);

            //$workspace->hashtags = [$datas["hashtag"]];
        $hashtag = $this->currentWorkspace->hashtags;

        if (is_array($hashtag) && count($hashtag) > 0)
        {
            $hashtag = $hashtag[0];

            if ($hashtag === '')
                $hashtag = "Nouvelle thématique...";
        }
        else if ($hashtag !== "Nouvelle thématique...")
            $hashtag = "Nouvelle thématique...";

        if ($user_rights === Share::RIGHT_OWNER)
            $html = str_replace("<current_hashtag/>", $hashtag, $html);
        else
            $html = str_replace("<current_hashtag/>", '', $html);

        if ($user_rights === Share::RIGHT_OWNER)
            $html = str_replace("<button-delete/>", '<button onclick="rcmail.command(`workspace.delete`)" class="btn btn-danger mel-button no-button-margin" style="margin-top:5px;margin-bottom:15px">Supprimer l\'espace de travail</button>', $html);
        else
            $html = str_replace("<button-delete/>", '<button onclick="rcmail.command(`workspace.leave`)" class="btn btn-danger mel-button no-button-margin" style="margin-top:5px;margin-bottom:15px">Quitter l\'espace de travail</button>', $html);
        
        if (!$this->currentWorkspace->isarchived) //<button class="btn btn-danger" style="margin-top: 5px;margin-bottom: 15px;margin-left:10px;"onclick="rcmail.command('workspace.archive', '<workspace-uid/>')">Archiver</button>
            $html = str_replace("<button-archive/>", '<button class="btn btn-danger mel-button no-button-margin" style="margin-top: 5px;margin-bottom: 15px;margin-left:10px;"onclick="rcmail.command(`workspace.archive`)">Archiver</button>', $html);
        else
            $html = str_replace("<button-archive/>", '<button class="btn btn-success mel-button no-button-margin" style="margin-top: 5px;margin-bottom: 15px;margin-left:10px;"onclick="rcmail.command(`workspace.unarchive`)">Désarchiver</button>', $html);
        
        if ($user_rights === Share::RIGHT_OWNER)
        {
            $logo = self::get_workspace_logo($this->currentWorkspace);
            $html = str_replace("<logo/>", (($logo ?? "false") == "false" ? '<span>'.substr($this->currentWorkspace->title, 0, 3)."</span>" : '<img src="'.$logo.'" />'), $html);
            $html = str_replace("<visibility/>", ($this->currentWorkspace->ispublic ? "privé" : 'public'), $html);
        }
        else
        {
            $html = str_replace("<logo/>", "", $html);
            $html = str_replace("<visibility/>", "???", $html);
        }

        if ($this->rc->config->get('workspace_bar_color_force', "default") === 'default')
        {
            $activeColor = $this->is_color_custom($this->currentWorkspace);
            $html = str_replace("<bar_color_text/>", ($activeColor ? $this->gettext('unactive_bar_color', 'mel_workspace').'<span class="plus icon-mel-minus"></span>' : $this->gettext('active_bar_color', 'mel_workspace').'<span class="plus icon-mel-plus"></span>'), $html);
            $html = str_replace("<bar_color_title/>", ($activeColor ? $this->gettext('unactive_bar_color_title', 'mel_workspace') : $this->gettext('active_bar_color_title', 'mel_workspace')), $html);
            $html = str_replace("<bar_color_visibility/>", "", $html);
        }
        else
            $html = str_replace("<bar_color_visibility/>", "display:none;", $html);

        return $html;
    }

    function get_type_config($config, $type)
    {
        foreach ($config as $key => $value) {
            if ($value["type"] === $type)
                return $value;
        }
    }

    function update_app_table()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $workspace = self::get_workspace($uid);

        echo $this->setup_params_apps($workspace);
        exit;
    }

    function setup_params_apps($workspace)
    {
        $icons=["minus" => "icon-mel-minus", "plus" => "icon-mel-plus"];
        $services = $this->get_worskpace_services($workspace);
        $config = $this->rc->config->get("workspace_services");
        $html = '<table id=table-apps class="table table-striped table-bordered">';
        $html .= "<thead><tr><td>Applications</td></tr></thead>";

        $count = 0;
        foreach ($services as $key => $value) {
            if ($key === self::LINKS || $key === self::EMAIL || $key === self::AGENDA || ($key === self::CHANNEL && !$value) || $key === self::WEKAN)
                continue;

            if ($key === self::CLOUD && 
                (!mel_helper::stockage_active() || 
                    (mel_metapage::have_0_quota() && mel_helper::stockage_active())
                )) continue;

            $info = $this->get_type_config($config, $key);
            $html.= '<tr><td>';
            $html.= '<span class="'.($value ? "text-success" : "text-secondary").' wsp-change-icon '.$info["icon"].'"></span> '.$info["name"];

            if ($value)
            {

                if ($key === self::CHANNEL)
                    $html.= html::tag("button", ["title" => ($this->channel_enabled === false ? "Vous n'avez pas accès au canal courant ! Demandez à ce que l'on vous rajoute ou changez de canal avec ce bouton !" : "Choisissez un nouveau canal !"),  "id" => "update-channel-button","class" => "mel-button param-button ".($this->channel_enabled === false ? "btn-danger btn" : "") ], "Changer de canal".html::tag("span", ["class" => "plus icon-mel-pencil"]));
                else if ($key === self::TASKS)
                    $html.= html::tag("button", ["title" => "Choisissez un nouveau tableau !",  "id" => "update-wekan-button","class" => "mel-button param-button " ], "Changer de tableau".html::tag("span", ["class" => "plus icon-mel-pencil"]));
                else if ($key === self::TCHAP_CHANNEL) {
                    $html.= '<span class="mel-message"> ('. tchap::get_room_name($this->get_object($this->currentWorkspace, self::TCHAP_CHANNEL)->id) .')</span>';
                    $html.= html::tag("button", ["title" => ($this->tchap_channel_enabled === false ? "Vous n'avez pas accès au canal courant ! Demandez à ce que l'on vous rajoute ou changez de canal avec ce bouton !" : "Choisissez un nouveau canal !"),  "id" => "update-tchap-channel-button","class" => "mel-button param-button ".($this->tchap_channel_enabled === false ? "btn-danger btn" : "") ], "Changer de canal tchap".html::tag("span", ["class" => "plus icon-mel-pencil"]));
                }
                $class = "btn btn-danger hidden mel-button no-button-margin";
                $span = $icons["minus"];    
                $func = '';           
            }
            else {
                $class = "btn btn-success mel-button no-button-margin";
                $span = $icons["plus"];   
                $func = "rcmail.command('workspace.update_app','$key')"; 
                ++$count;
            }

            

            if ($info === null)
                $class.= " disabled";

            $html.= "<button onclick=$func style=float:right; class=\"$class\" ><span class=$span></span></button>";
            $html .= "</td></tr>";
        }

        $html .= "</table>";

        return $html;

    }

    function setup_params_rights($workspace)
    {
        $icons_rights = [
            Share::RIGHT_OWNER => "icofont-crown",
            Share::RIGHT_WRITE => "icofont-pencil-alt-2"
        ];

        $options_title = [
            Share::RIGHT_OWNER => "Passer en administrateur",
            Share::RIGHT_WRITE => "Passer en utilisateur"
        ];

        $current_title = [
            Share::RIGHT_OWNER => "Administrateur",
            Share::RIGHT_WRITE => "Utilisateur"
        ];

        $icon_delete = "icon-mel-trash";
        $env = [];
        $shares = $this->sort_user($workspace->shares); 
        $nbuser = count($shares);
        $s = $nbuser > 1 ? 's' : '';

        $html = '<table id=wsp-user-rights class="table table-striped table-bordered">';
        $html .= "<thead>";
        $html .= "<tr><td>Utilisateur$s ($nbuser) </td><td class=\"mel-fit-content\">Droits d'accès</td><td class=\"mel-fit-content\">Supprimer</td></tr>";
        $html .= "</thead>";
        $share = $this->sort_user($workspace->shares);
        $current_user = driver_mel::gi()->getUser();

        foreach ($share as $key => $value) {
            $user =driver_mel::gi()->getUser($value->user);

            if (!isset($user)) continue;

            $from_list = $this->_check_if_is_in_list($workspace, $value->user);
            $html .= "<tr>";
            $html .= '<td>'.(count($from_list) > 0 ? '<span style="margin-right:5px;vertical-align: bottom;" class="material-symbols-outlined" title="'.$this->_list_to_title($from_list).'">groups</span>' : ''). $user->fullname."</td>";
            
            $html .= "<td>".$this->setup_params_value($icons_rights, $options_title, $current_title, $value->rights,$value->user)."</td>";
            if ($value->user === $current_user)
                $html += '<td></td>';
            else
                $html .= '<td><button style="float:right" onclick="rcmail.command(`workspace.remove_user`, `'.$value->user.'`)" class="btn btn-danger mel-button no-button-margin"><span class='.$icon_delete.'></span></button></td>';
            
            $html .= "</tr>";
            $env[$user->email] = ['email' => $user->email, 'name' => $user->name, 'fullname' => $user->fullname, 'is_external' => $user->is_external];
        }

        $this->rc->output->set_env('current_workspace_users', $env);
        unset($env);
        unset($from_list);

        $lists = $this->get_setting($workspace, "lists") ?? [];

        if (!is_array($lists)) $lists = get_object_vars($lists);

        if (count($lists) > 0) {
            $html .= "<thead>";
            $html .= '<tr><td>Listes</td><td class="mel-fit-content">Synchroniser</td><td class="mel-fit-content">Supprimer</td></tr>';
            $html .= "</thead>";

            foreach ($lists as $key => $value) {
                $html .= "<tr>";
                $html .= "<td>". driver_mel::gi()->getUser(null, true, false, null, $key)->fullname."</td>";
                $html .= "<td><button style=\"float:right\" onclick=\"rcmail.command(`workspace.sync_list`, `".$key."`);\" class=\"btn btn-primary mel-button no-button-margin without-text px45\"><span class=\"material-symbols-outlined\">sync</span></button></td>";
                $html .= "<td><button style=\"float:right\" onclick=\"rcmail.command(`workspace.remove_list`, `".$key."`);\" class=\"btn btn-danger mel-button no-button-margin without-text px45\"><span class=\"material-symbols-outlined\">delete</span></button></td>";
                $html .= "</tr>";
            }
        }



        $html .= "</table>";

        return $html;
    }

    function setup_params_value($icons, $titles, $current_titles, $rights, $user)
    {
        $options = json_encode($icons);
        $options = str_replace('"', "¤¤¤", $options);
        $classes = [];

        foreach ($icons as $key => $value) {
            $classes[$key] = $key;
        }

        $classes = str_replace('"', "¤¤¤", json_encode($classes));

        return '<button style="float:right" title="'.$current_titles[$rights].'"  type="button" data-option-title-current="'.str_replace('"', "¤¤¤", json_encode($current_titles)).'" data-option-title="'.str_replace('"', "¤¤¤", json_encode($titles)).'" data-rcmail=true data-onchange="rcmail.command(`workspace.update_user`, MEL_ELASTIC_UI.SELECT_VALUE_REPLACE+`:'.$user.'`)" data-options_class="'.$classes.'" data-is_icon="true" data-value="'.$rights.'" data-options="'.$options.'" class="select-button-mel mel-button no-button-margin  btn-u-r btn btn-primary '.$rights.'"><span class='.$icons["$rights"].'></span></button>';
        // $html = '<select class=" pretty-select" >';
        // foreach ($icons as $key => $value) {
        //     $html .= '<option class=icofont-home value="'.$key.'" '.($key === $rights ? "selected" : "")." ></option>";
        // }
        // $html .= "</select>";
        // return $html;
    }

    function include_js()
    {
        $count = count($this->folders);

        for ($it=0; $it < $count; ++$it) { 
            if ($this->folders[$it] === 'mel_lib') continue;
            $files = scandir(__DIR__."/js/".$this->folders[$it]);
            $size = count($files);

            for ($i=0; $i < $size; ++$i) { 
                if (strpos($files[$i], ".js") !== false)
                    $this->include_script('js/'.$this->folders[$it]."/".$files[$i]);
            }
        }

        if ($this->rc->action === "index" || $this->rc->action === "" || $this->rc->action === "action")
            $this->include_script('js/index.js');

        if ($this->rc->action === "workspace")
        {
            $this->include_script('js/checks.js');
            $this->include_script('js/workspace.js');
            $this->include_script('js/params.js');
        }
    }

    function block($id,$class, $header, $body, $onclick, $title_button, $attribs = null)
    {
        $html = $this->rc->output->parse("mel_workspace.block", false, false);
        $html = str_replace("<id/>", $id, $html);
        $html = str_replace("<class/>", $class, $html);
        $html = str_replace("<header/>", $header, $html);
        $html = str_replace("<body/>", $body, $html);
        $html = str_replace("<onclick/>", $onclick, $html);
        $html = str_replace("<title-button/>", $title_button, $html);

        if (isset($attribs) && is_array($attribs)) $attribs = mel_helper::array($attribs);

        if (isset($attribs) && !$attribs->isEmpty())
        {
            $string = '';

            foreach ($attribs as $key => $value) {
                $string .= "$key=\"$value\" ";
            }

            $attribs = $string;
        }
        else $attribs = '';

        $html = str_replace("<attribs/>", $attribs, $html);

        return $html;
    }

    /**
     * Création de l'espace de travail
     * 
     * @param string avatar POST
     * @param string title POST
     * @param string uid POST
     * @param string desc POST
     * @param string end_date POST
     * @param string hashtag POST
     * @param string visibility POST
     * @param array  users POST
     * @param string services POST
     * @param string color POST
     * @param string service_params POST
     */
    function create()
    {
        try {
            $datas = [
                "avatar" => rcube_utils::get_input_value("avatar", rcube_utils::INPUT_POST),
                "title" => rcube_utils::get_input_value("title", rcube_utils::INPUT_POST),
                "uid" => rcube_utils::get_input_value("custom_uid", rcube_utils::INPUT_POST),
                "desc" => rcube_utils::get_input_value("desc", rcube_utils::INPUT_POST),
                "end_date" => rcube_utils::get_input_value("end_date", rcube_utils::INPUT_POST),
                "hashtag" => rcube_utils::get_input_value("hashtag", rcube_utils::INPUT_POST),
                "visibility" => rcube_utils::get_input_value("visibility", rcube_utils::INPUT_POST),
                "users" => rcube_utils::get_input_value("users", rcube_utils::INPUT_POST),
                "services" => rcube_utils::get_input_value("services", rcube_utils::INPUT_POST) ?? [],
                "color" => rcube_utils::get_input_value("color", rcube_utils::INPUT_POST),
                "service_params" => rcube_utils::get_input_value("_services_params", rcube_utils::INPUT_POST),
            ];

            $retour = [
                "errored_user" => [],
                "existing_users" => []
            ];

            $user = driver_mel::gi()->getUser();
            $workspace = driver_mel::gi()->workspace([$user]);
            $workspace->uid = $datas["uid"] === null || $datas["uid"] === "" ? self::generate_uid($datas["title"], $this->rc) : $datas["uid"];//uniqid(md5(time()), true);
            $workspace->title = $datas["title"];
            $workspace->logo = $datas["avatar"];
            $workspace->description = $datas["desc"];
            $workspace->creator = $user->uid;
            $workspace->created = new DateTime('now');
            $workspace->modified = new DateTime('now');
            $workspace->ispublic = (($datas["visibility"] === "private") ? false: true);
            $workspace->hashtags = [$datas["hashtag"]];

            if ($datas["color"] === "" || $datas["color"] === null)
                $datas["color"] = "#FFFFFF";

            $this->add_setting($workspace, "color", $datas["color"]);
            $this->add_setting($workspace, "end_date", $datas["end_date"]);
            $res = $workspace->save();
            $workspace->load();
            $shares = [];
            $share = driver_mel::gi()->workspace_share([$workspace]);
            $share->user = $user->uid;
            $share->rights = Share::RIGHT_OWNER;
            $shares[] = $share;

            $count = count($datas["users"]);

            for ($i=0; $i < $count; ++$i) {
                $email = $datas["users"][$i];
                $tmp_user = driver_mel::gi()->getUser(null, true, false, null, $email);
                $user_exists = true;
                $just_created = false;

                if ($tmp_user->uid === null && !$tmp_user->is_list) {
                    if (rcmail::get_instance()->config->get('enable_external_users', false)) {
                        $user_exists = driver_mel::gi()->create_external_user($email, $workspace);
                        $just_created = true;
                    }
                    else {
                        $user_exists = false;
                    }
                    
                    if ($user_exists) {
                        $tmp_user = driver_mel::gi()->getUser(null, true, false, null, $email);
                    }
                    else {
                        $retour["errored_user"][] = $email;
                    }
                }

                if ($user_exists) {
                    foreach ($this->_add_internal_user($workspace, $tmp_user) as $added_user) {
                        if ($added_user !== $user->uid && $added_user !== null) {
                            $retour["existing_users"][] = $added_user;
                            $share = driver_mel::gi()->workspace_share([$workspace]);
                            $share->user = $added_user;
                            $share->rights = Share::RIGHT_WRITE;
                            $shares[] = $share;   
    
                            if (class_exists("mel_notification") && !$just_created) {
                                $this->_notify_user($added_user, $workspace, $added_user);
                            }           
                        }
                    }
                }
            }

            $workspace->shares = $shares;
            $datas["services"] = $this->create_services($workspace, $datas["services"], null, true, false, $datas['service_params']);
            
            $res = $workspace->save();

            $retour["workspace_uid"] = $workspace->uid;

            $retour["uncreated_services"] = $datas["services"];
            echo json_encode($retour);
            exit;
        } catch (\Throwable $th) {
            $func = "create";
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->$func] Un erreur est survenue lors de la création de l'espace de travail ''".$workspace->title."'' !");
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->$func]".$th->getTraceAsString());
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->$func]".$th->getMessage());
            echo json_encode($th);
            exit;
        }
    }

    private function _add_internal_user(&$workspace, $user) {
        if ($user->is_list) {
            $list = [];

            foreach ($user->list->members as $value) {
                $value = $value->uid;
                $list[] = $value;
                yield $value;
            }

            $lists = $this->get_setting($workspace, 'lists') ?? [];

            if (is_array($lists)) $lists[$user->mail[0]] = $list;
            else {
                $user = $user->mail[0];
                $lists->$user = $list;
            }

            $this->add_setting($workspace, 'lists', $lists);
        } 
        else yield $user->uid;
    }

    private function _notify_user($userid, $workspace, $tmp_user = null) {
        $canNotify = true;
        $user_last_login = mel_helper::last_login($userid);
        
        if (class_exists("mel_notification") && isset($user_last_login)) {
            if (mel_helper::check_date_past($user_last_login, 15)) $canNotify = false;
        } else $canNotify = false;

        if ($canNotify) {
            mel_notification::notify('workspace', driver_mel::gi()->getUser()->name.$this->gettext("mel_workspace.notification_title").'"'.$workspace->title.'"', $this->gettext("mel_workspace.click_for_open"), [
                [
                    'href' => "./?_task=workspace&_action=workspace&_uid=".$workspace->uid,
                    'text' => $this->gettext("mel_workspace.open"),
                    'title' => $this->gettext("mel_workspace.click_for_open"),
                    'command' => "event.click"
                ]
            ], $tmp_user);
        }
        else {
            mel_helper::include_mail_body();
            include_once 'lib/wsp_mail_body.php';
            $email = $this->get_worskpace_services($workspace)[self::EMAIL] ? (self::get_wsp_mail($workspace_id) ?? driver_mel::gi()->getUser()->email) : driver_mel::gi()->getUser()->email;

            $bodymail = new WspMailBody('mel_workspace.email');

            $bodymail->user_name = driver_mel::gi()->getUser()->name;
            $bodymail->user_email = driver_mel::gi()->getUser()->email;
            $bodymail->wsp_name = $workspace->title;
            $bodymail->wsp_creator = $workspace->creator;
            $bodymail->wsp_last__action_text = $workspace->created === $workspace->modified ? 'Crée le' : 'Mise à jour';
            $bodymail->wsp_last__action_date = DateTime::createFromFormat('Y-m-d H:i:s', $workspace->modified)->format('d/m/Y');
            $bodymail->logobnum = MailBody::load_image(__DIR__.'/skins/elastic/pictures/logobnum.png', 'png');
            $bodymail->bnum_base__url = 'http://mtes.fr/2';
            $bodymail->url = 'https://mel.din.developpement-durable.gouv.fr/bureau/?_task=workspace&_action=workspace&_uid='.$workspace->uid;

            $div = ['<div style="display:flex">'];
            $shares = $workspace->shares;

            $i = 0;
            foreach ($shares as $user) {
                if ($i++ < 2) {
                    $image = MailBody::load_image($this->rc->config->get('rocket_chat_url').'avatar/'.$user->user_uid);

                    if (MailBody::image_loaded()) $div[] = "<img src=\"$image\" style=\"width:36px;height:36px;border-radius:100%;margin-left:-15px;border: solid thick white;\" />";
                    else $div[] = "<div style=\"text-align: center;line-height: 25px;display:inline-block;width:36px;height:36px;border-radius:100%;background-color:#7DD0C2;margin-left:-15px;border: solid thick white;\"><span>".substr(driver_mel::gi()->getUser($user->user_uid)->name, 0, 2)."</span></div>";
                }
                else {
                    $i = count($shares) - 2;

                    if ($i > 99) $i = ">99";
                    else $i = "+$i";

                    $div[] = "<div style=\"text-align: center;line-height: 25px;display:inline-block;width:36px;height:36px;border-radius:100%;background-color:#7DD0C2;margin-left:-15px;border: solid thick white;\"><span>$i</span></div>";
                    
                    break;
                }
            }

            $div[] = '</div>';

            $bodymail->wsp_shares_rounded = implode('', $div);

            $subject = $bodymail->subject();
            $message = $bodymail->body();

            $is_html = true;
            mel_helper::send_mail($subject, $message, $email, ['email' => driver_mel::gi()->getUser($userid)->email, 'name' => driver_mel::gi()->getUser($userid)->name], $is_html);
        }
    }

    public function test_notify_mail($workspace) {
        $this->_notify_user(driver_mel::gi()->getUser()->uid, $workspace);
    }

    function create_services(&$workspace,$services, $users = null, $update_wsp = true, $fromUpdateApp = false, $default_values = null)
    {
        if ($users === null)
        {
            $map = function($value) {
                return $value->user;
            };
            $users = array_map($map, $workspace->shares);
            $tmp_users = [];

            foreach ($users as $key => $value) {
                $tmp_users[] = $value;
            }

            $users = $tmp_users;
            unset($tmp_user);
        }

        $services = $this->create_tasklist($workspace,$services, $users, $update_wsp, $default_values);
        $services = $this->create_agenda($workspace, $services, $users, $update_wsp);
        //$services = $this->create_channel($workspace, $services, $users, $default_values);
        $services = $this->create_tchap_channel($workspace, $services, $users, $default_values);
        $services = $this->create_service_group($workspace, $services, $fromUpdateApp);

        $this->create_service_links($workspace);

        return $services;
    }

    function create_service_links(&$workspace)
    {
        if ($this->get_object($workspace, self::LINKS) === null)
            $this->save_object($workspace, self::LINKS, []);
    }

    function create_service_group(&$workspace, $services, $fromUpdateApp = false)
    {
        $search = array_search(self::CLOUD, $services);
        $create_nc = $search !== false;

        if (!$create_nc && $fromUpdateApp)
            return $services;

        $this->create_group($workspace, $create_nc);

        if (!$create_nc)
            unset($services[$search]);

        return $services;
    }

    function create_tasklist(&$workspace, $services, $users, $update_wsp, $default_value)
    {
        $tasks = self::TASKS;
        if (array_search($tasks, $services) === false)
            return $services;

        include_once "../mel_moncompte/ressources/tasks.php";
        $tasklist = $this->get_object($workspace, $tasks);

        if ($tasklist !== null) //Si la liste de tâche existe déjà
        {
            $mel = new M2taskswsp($tasklist);
            if ($mel->getTaskslist() !== null)
            {
                foreach ($users as $s)
                {
                    $mel->setAcl($s, ["w"]);
                }
            }
            else {
                $this->remove_object($workspace, $tasks);
                return $this->create_tasklist($workspace, $services, $users, $update_wsp, $default_value);
            }
        }
        else {//Sinon
            $mel = new M2taskswsp($workspace->uid);

            if (!$update_wsp || $mel->createTaskslist($workspace->title))
            {
                foreach ($users as $s)
                {
                    $mel->setAcl($s, ["w"]);
                }

                if ($update_wsp)
                {
                    $taskslist = $mel->getTaskslist();
                    $this->save_object($workspace, $tasks, $taskslist->id);
                }
            }
        }

        $key = array_search($tasks, $services);

        $this->create_wekan($workspace, $services, $users, $default_value);

        if ($key !== false)
            unset($services[$key]);

        return $services;
    }

    function create_wekan(&$workspace, $services, $users, $default_value)
    {
        //Verifier si le wekan existe
        $board_id = $this->get_object($workspace, self::WEKAN);
        
        if ($board_id === null)
        {
            $object = ["id" => '', "title" => ''];
            $index = 'tasks';

            if (!isset($default_value) || !isset($default_value[$index]))
            {
                if (!isset($default_value) || $default_value === '') $default_value = [];

                $default_value[$index] = [
                    'mode' => 'default'
                ];
            }

            switch ($default_value[$index]['mode']) {
                case 'default':
                    $title = $workspace->title;
                case 'custom_name':
                    if ($default_value[$index]['mode'] === 'custom_name') $title = $default_value[$index]['value'];
                case 'create':
                    $board_id = $this->create_workspace_wekan($workspace, $title ?? $workspace->title, $workspace->ispublic === 0 ? false: true, null, [
                        $this->rc->gettext("wekan_todo", "mel_workspace"),
                        $this->rc->gettext("wekan_in_progress", "mel_workspace"),
                        $this->rc->gettext("wekan_do", "mel_workspace")
                    ], $users);
                    break;
                case 'already_exist':
                    $board_id = [
                        'board_id' => $default_value[$index]['value'],
                        'board_title' => $this->wekan()->__api()->get_board($default_value[$index]['value']),
                    ];
                    $board_id["board_title"] = ($board_id["board_title"]['httpCode'] === 200 ? json_decode($board_id["board_title"]['content'])->title : null) ?? '';
                    $object['updated'] = true;
                    break;
                
                default:
                    return;
            } 

            $object['id'] = $board_id['board_id'];
            $object['title'] = $board_id['board_title'];


            $this->save_object($workspace, self::WEKAN, $object);
        }
    }

    function create_agenda(&$workspace, $services, $users, $update_wsp)
    {
        $agenda = self::AGENDA;

        // if (array_search($agenda, $services) === false)
        //     return $services;

        mel_helper::load_helper($this->rc)->include_utilities();
        $color = $this->get_setting($workspace, "color");

        foreach ($users as $s)
            mel_utils::cal_add_category($s, "ws#".$workspace->uid, $color);

        if ($update_wsp)
            $this->save_object($workspace, $agenda, true);//!(array_search($agenda, $services) === false));

        // $key = array_search($agenda, $services);
        // unset($services[$key]);

        return $services;
    }

    function create_channel(&$workspace, $services, $users, $default_values = null)
    {
        $service = self::CHANNEL;
        mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create_channel]Services : ".json_encode($service)." => $service");
        mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create_channel]Can enter : ".($this->get_object($workspace,$service) === null && array_search($service, $services) !== false));
        
        if ($this->get_object($workspace,$service) === null && array_search($service, $services) !== false)
        {
            if (!isset($default_values)) $default_values = ['channel' => ['mode' => 'default']];
            else if (!isset($default_values['channel'])) $default_values['channel'] = ['mode' => 'default'];

            $uid = null;
            $value = null;
            $config = [];
            switch ($default_values['channel']['mode']) {
                case 'default':
                    $uid = $this->generate_channel_id_via_uid($workspace->uid);
                case 'custom_name':
                    if (!isset($uid)) $uid = $this->generate_channel_id_via_uid($default_values['channel']['value']);
                    $rocket = $this->rc->plugins->get_plugin('rocket_chat');
                    $value = $rocket->_create_channel($uid, $users,$workspace->ispublic === 0 ? false : true);
                    break;

                case 'already_exist':
                    $value['content'] = [
                        "channel" => [
                            '_id' => $default_values['channel']['value']['id'],
                            'name' => $default_values['channel']['value']['name']
                        ]
                    ];

                    $config['edited'] = true;
                    break;
                
                default:
                    return $this->create_channel($workspace, $services, $users, null);
            }
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create_channel]Valeur : ".json_encode($value));

            if (is_string($value["content"]))
            {
                $value = json_decode($value["content"]);
                $value = $value->channel;
                $config['id'] = $value->_id;
                $config['name'] = $value->name;
            }
            else {
                $value = $value["content"]["channel"];
                $config['id'] = $value["_id"];
                $config['name'] = $value["name"];
            }

            $this->save_object($workspace, self::CHANNEL, $config);
        }
        
        $key = array_search($service, $services);

        if ($key !== false)
            unset($services[$key]);

        return $services;
    }

    function create_tchap_channel(&$workspace, $services, $users, $default_values = null)
    {
        $service = self::TCHAP_CHANNEL;
        mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create_channel]Services : ".json_encode($service)." => $service");
        mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create_channel]Can enter : ".($this->get_object($workspace,$service) === null && array_search($service, $services) !== false));
        
        if ($this->get_object($workspace,$service) === null && array_search($service, $services) !== false)
        {
            $default_values_key = "tchap-channel";
            if (!isset($default_values)) $default_values = [$default_values_key => ['mode' => 'default']];
            else if (!isset($default_values[$default_values_key])) $default_values[$default_values_key] = ['mode' => 'default'];

            $uid = null;
            $value = null;
            $config = [];
            switch ($default_values[$default_values_key]['mode']) {
                case 'default':
                    $uid = $workspace->uid;
                case 'custom_name':
                    if (!isset($uid)) $uid = $default_values[$default_values_key]['value'];
                    if (class_exists('tchap')) $value = tchap::create_tchap_room($uid, $users);
                    
                    break;

                case 'already_exist':
                    $value = $default_values[$default_values_key]['value']['id'];

                    $config['edited'] = true;
                    break;
                default:
                    return $this->create_tchap_channel($workspace, $services, $users, null);
            }
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create_tchap_channel]Valeur : ".json_encode($value));

            if (is_string($value))
            {
                $config['id'] = $value;
            }
            else {
                $value = $value["content"]["channel"];
                $config['id'] = $value["_id"];
            }

            $this->save_object($workspace, self::TCHAP_CHANNEL, $config);
        }
        
        $key = array_search($service, $services);

        if ($key !== false)
            unset($services[$key]);

        return $services;
    }

    function create_favorites(&$workspace, $services)
    {

    }

    function get_uid()
    {
        $title = rcube_utils::get_input_value("_title", rcube_utils::INPUT_POST);
        echo self::generate_uid($title, $this->rc);
        exit;
    }

    function check_uid()
    {
        include_once "lib/mel_utils.php";
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        if ($uid === "" || $uid === null)
        {
            echo "ui_empty";
            exit;
        }
        $workspace = driver_mel::gi()->workspace();
        $workspace->uid = $uid;
        if (mel_utils::replace_special_char($uid) === $uid && strtolower($uid) === $uid)
        {
            if ($workspace->exists())
                echo "uid_exists";
            else 
                echo "uid_ok";
        }
        else
            echo "uid_not_ok";
        exit;
    }

    function save_object(&$workspace, $key,$object)
    {
        if ($workspace->objects === null)
        {
            $workspace->objects = [$key => $object];
        }
        else
        {
            $workspace->objects = json_decode($workspace->objects);
            $workspace->objects->$key = $object;
        }
        $workspace->objects = json_encode($workspace->objects);
    }

    function remove_object(&$workspace, $key) {
        if ($workspace->objects !== null)
        {
            $workspace->objects = json_decode($workspace->objects);

            if (isset($workspace->objects->$key)) unset($workspace->objects->$key);

            $workspace->objects = json_encode($workspace->objects);
        }
    }

    public function get_object(&$workspace, $key)
    {
        if ($workspace->objects === null)
            return null;
        else
            return json_decode($workspace->objects)->$key;
    }

    function save_objects()
    {
        try {
            $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
            $items = rcube_utils::get_input_value("_items", rcube_utils::INPUT_POST);
            $workspace = driver_mel::gi()->workspace();
            $workspace->uid = $uid;
            $workspace->load();
            foreach ($items as $key => $value) {
                $this->save_object($workspace, $key, $value);
            }
            echo json_encode($workspace->save());
        } catch (\Throwable $th) {
            //throw $th;
            echo json_encode($th);
        }
        exit;
    }



    function epingle()
    {
        try {
            $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
            
            $epingles = $this->rc->config->get('workspaces_personal_datas', []);

            if ($epingles[$uid] === null)
                $epingles[$uid]  = [];

            if ($epingles[$uid]["tak"] === null)
                $epingles[$uid]["tak"] = true;
            else
                $epingles[$uid]["tak"] = !$epingles[$uid]["tak"];
            
            $this->rc->user->save_prefs(array('workspaces_personal_datas' => $epingles));
            // $workspace = driver_mel::gi()->workspace([driver_mel::gi()->getUser()]);
            // $workspace->uid = $uid;
            // $workspace->load();
            // if ($workspace->settings === null)
            // {
            //     $settings = [];
            //     $settings["epingle"] = true;
            // }
            // else {
            //     $settings = json_decode($workspace->settings);
            //     if ($settings->epingle === true)
            //         $settings->epingle = false;
            //     else
            //         $settings->epingle = true;
            // }

            // $workspace->settings = json_encode($settings);
            // $ret = $workspace->save();
            //driver_mel::gi()->getUser()->cleanWorkspaces();
            echo json_encode(["is_epingle" => $epingles[$uid]["tak"], "success" => true]);
        } catch (\Throwable $th) {
            echo son_encode(["is_epingle" => $epingles[$uid]["tak"], "success" => false]);
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->epingle] Un erreur est survenue lors de l'epinglage de l'espace de travail '".$workspace->title."'");
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->epingle]".$th->getTraceAsString());
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->epingle]".$th->getMessage());
        }
        exit;

    }

    

    function add_setting(&$workspace,$key, $value)
    {
        if ($workspace->settings === null)
            $workspace->settings = [$key => $value];
        else {
            $workspace->settings = json_decode($workspace->settings);
            $workspace->settings->$key = $value;
        }

        $workspace->settings = json_encode($workspace->settings);
    }

    function get_setting(&$workspace, $key)
    {
        if ($workspace->settings === null)
            return null;
        else
            return json_decode($workspace->settings)->$key;
    }

    function generate_html($only_epingle = false, $only_archived = false)
    {
        $parsed = $this->rc->output->parse("mel_workspace.wsp_block", false, false);
        $html = [];
        $this->load_workspaces();
        foreach ($this->workspaces as $key => $value) {
            if (!self::is_epingle($value->uid, $this->rc) && $only_epingle)
                continue;
            else if (self::is_epingle($value->uid, $this->rc) && !$only_epingle)
                continue;

            if ($only_archived)
            {
                if (!$value->isarchived)
                    continue;
            }
            else
            {
                if ($value->isarchived)
                    continue;
            }
            
            $html[] = $this->create_block($value, $only_epingle, $parsed, true);
        } 

        $html = implode('', $html);
        return $html;
    }

    function create_block($workspace, $epingle = false, $html = null, $force_avatar_loading = false)
    {
        $username = driver_mel::gi()->getUser($workspace->creator)->name;

        $html = $html ?? $this->rc->output->parse("mel_workspace.wsp_block", false, false);
        $is_epingle = self::is_epingle($workspace->uid, $this->rc);
        $color = $this->get_setting($workspace, "color");
        $html = str_replace("<workspace-id/>", "wsp-".$workspace->uid.($epingle ? "-epingle" : "") , $html);
        $html = str_replace("<workspace-uid/>", $workspace->uid , $html);
        $html = str_replace("<workspace-public/>", $workspace->ispublic, $html);

        if ($is_epingle)
        {
            $html = str_replace("<workspace-epingle/>", "active", $html);
            $html = str_replace("<epingle-title>", "Désépingler", $html);
        }
        else
        {
            $html = str_replace("<workspace-epingle/>", "", $html);
            $html = str_replace("<epingle-title>", "Épingler", $html);
        }

        $logo = self::get_workspace_logo($workspace);
        if ($logo !== null && $logo !== false  && $logo !== "false")
            $html = str_replace("<workspace-image/>", '<div class=dwp-round style=background-color:'.$color.'><img alt="" src="'.$logo.'"></div>', $html);
        else
            $html = str_replace("<workspace-image/>", "<div class=dwp-round style=background-color:$color><span style=color:".$this->get_badge_text_color($workspace).">".substr($workspace->title, 0, 3)."</span></div>", $html);
        
        if (count($workspace->hashtags) > 0 && $workspace->hashtags[0] !== "")
            $html = str_replace("<workspace-#/>", "#".$workspace->hashtags[0], $html);
        else
            $html = str_replace("<workspace-#/>", "", $html);

        $html = str_replace("<workspace-title/>", $workspace->title, $html);
        $html = str_replace("<workspace-avancement/>", "<br/><br/><br/>", $html);

        if ($workspace->shares !== null)
        {
            $it = 0;
            $html_tmp = [];
            $rc_url = $this->rc->config->get('rocket_chat_url');
            foreach ($workspace->shares as $s)
            {
                if ($it == 2)
                {
                    $html_tmp[] ='<div class="dwp-circle dwp-user"><span>+'.(count($workspace->shares)-2).'</span></div>';
                    break;
                }
                $html_tmp[] = '<div data-user="'.$s->user.'" class="dwp-circle dwp-user" title="'.driver_mel::gi()->getUser($s->user)->name.'"><bnum-avatar style="width:100%;height:100%;" data-email="'.driver_mel::gi()->getUser($s->user)->email.'"></bnum-avatar></div>';//<img alt="'.$s->user.'" src="'.$rc_url."avatar/".$s->user.'" /></div>';
                ++$it;
            }

            $html = str_replace("<workspace-users/>", implode('', $html_tmp), $html);
        }
        else
            $html = str_replace("<workspace-users/>", "", $html);

        if ($workspace->created === $workspace->modified)
            $html = str_replace("<workspace-misc/>", "Crée par ".$username."<br/>Mise à jour : ".date("d/m/Y", strtotime($workspace->created)), $html);// $html = str_replace("<workspace-misc/>", "Crée par ".$workspace->creator, $html);
        else
        {
            $html = str_replace("<workspace-misc/>", "Crée par ".$username."<br/>Mise à jour : ".date("d/m/Y", strtotime($workspace->modified)), $html);
        }

        $html = str_replace("<workspace-task-danger/>", "<br/>", $html);
        $html = $this->get_tasks($workspace, $html);

        $services = $this->get_worskpace_services($workspace);
        $tmp_html = [];

        foreach ($services as $key => $value) {
            if ($value)
            {
                switch ($key) {
                    case self::CHANNEL:
                        $tmp_html[] = '<div class="wsp-notif-block wsp-chat-notif-block" style=display:none;><span data-channel="'.$this->get_object($workspace, self::CHANNEL)->name.'" class='.$key.'><span class="'.$key.'-notif wsp-notif roundbadge lightgreen">0</span><span class="material-symbols-outlined ariane-icon">forum</div>';
                        break;
                    
                    default:
                        $tmp_html[] = '<div class="wsp-notif-block" style=display:none;><span class='.$key.'><span class="'.$key.'-notif wsp-notif roundbadge lightgreen">0</span><span class="replacedClass"><span></span></div>';
                    break;
                }
            }
        }

        $html = str_replace("<workspace-notifications/>", implode('', $tmp_html), $html);

        return $html;
    }


    public function get_tasks($workspace, $html, $replace = "<workspace-task-all/>", &$total = 0, $hideSmall = false)
    {
        $task_id = $this->get_object($workspace, self::TASKS);
        if ($task_id !== null)
        {  
            try {
                $tasks = $this->rc->plugins->get_plugin('tasklist')->__get("driver")->list_tasks(["mask" => 0, "search" => null], $task_id);
                $total = count($tasks);

                if (true || $total !== 0)
                {
                    $completed = count(array_filter($tasks, function ($task)
                    {
                        return $task["complete"] === 1;
                    }));
                    //$taskslist = $task->get_lists()
                    $div = html::p(["class" => "wsp-tasks-all", "style" => "font-size:smaller;margin-top: -25px;".($total == null || $total === 0 ? "color:transparent;" : "")],
                        html::tag("span", ["style" => "font-size:large"], $completed).
                        " tâches réalisées sur $total"
                    );
                    $html = str_replace($replace, $div, $html);
                }
            } catch (\Throwable $th) {
                mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->get_tasks] Un erreur est survenue lors de la récupération des tâches pour l'espace de travail '".$workspace->title."'");
                mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->get_tasks]".$th->getTraceAsString());
                mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->get_tasks]".$th->getMessage());
            }
        }
        else {
            $div = html::p(["class" => "wsp-tasks-all".($hideSmall ? ' hide-small' : ''), "style" => "font-size:smaller;margin-top: -25px;color:transparent;"],
            html::tag("span", ["style" => "font-size:large"], "Aucune").
            " tâches réalisées pour l'espace."
            
            );

            $html = str_replace($replace, $div, $html);
        }
        return $html;
    }

    function change_color()
    {
        include_once "lib/mel_utils.php";
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $color = rcube_utils::get_input_value("_color", rcube_utils::INPUT_POST);
        $workspace = $this->update_setting($uid, "color", $color);
        if (isset($workspace))
        {
            foreach ($workspace->shares as $s)
            {
                mel_utils::cal_update_color($s->user, "ws#".$workspace->uid, $color);
            }

            self::edit_modified_date($workspace);
            echo "";
        }
        else
            echo "denied";
        exit;
    }

    function change_visibility()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $workspace = self::get_workspace($uid);

        if (self::is_admin($workspace))
        {
            $isPublic = !$workspace->ispublic;
            $workspace->ispublic = $isPublic;
            self::edit_modified_date($workspace, false);
            $workspace->save();

            try {
                $rocket = $this->rc->plugins->get_plugin('rocket_chat');
                $rocket->update_channel_type(
                    $this->get_object($workspace, self::CHANNEL)->id,
                    !$isPublic);
            } catch (\Throwable $th) {
                //throw $th;
            }

            echo "";
        }
        else 
            echo "denied";

        exit;
    }

    function change_logo()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $logo = rcube_utils::get_input_value("_logo", rcube_utils::INPUT_POST) ?? "false";
        $workspace = self::get_workspace($uid);

        if (self::is_admin($workspace))
        {
            $workspace->logo = $logo;
            self::edit_modified_date($workspace, false);
            $workspace->save();
            echo "";
        }
        else 
            echo "denied";
        
        exit;
    }

    function update_setting($uid, $key, $value, $check_if_user_is_admin = false)
    {
        $workspace = self::get_workspace($uid);
        if ($check_if_user_is_admin)
        {
            if (!self::is_admin($workspace))
                return null;
        }
        $this->add_setting($workspace, $key, $value);
        $workspace->save();  
        return $workspace; 
    }

    /**
     * Add users to workspace
     * 
     * @param string _uid POST
     * @param array _users POST
     */
    function add_users()
    {
        //get input
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $tmp_users = rcube_utils::get_input_value("_users", rcube_utils::INPUT_POST);
        //
        $workspace = self::get_workspace($uid);
        //get users
        $users = [];
        $noNotifUsers = [];
        $unexistingUsers = [];
        foreach ($tmp_users as $key => $value) {
            $tmp_user = driver_mel::gi()->getUser(null, true, false, null, $value);
            $user_exists = true;

            if ($tmp_user->uid === null && !$tmp_user->is_list) {
                if (rcmail::get_instance()->config->get('enable_external_users', false)) {
                    $user_exists = driver_mel::gi()->create_external_user($value, $workspace);
                }
                else {
                    $user_exists = false;
                }

                if ($user_exists) {
                    $tmp_user = driver_mel::gi()->getUser(null, true, false, null, $value);
                    $noNotifUsers[] = $value;
                }
                else {
                    $unexistingUsers[] = $value;
                }
            }

            if ($user_exists) {
                foreach ($this->_add_internal_user($workspace, $tmp_user) as $cuser) {
                    $users[] = $cuser;
                }
            }
        }

        if (count($users) === 0) {
            echo "no one was found";
            exit;
        }
        else {
            //get workspace
            if (self::is_admin($workspace)) {
                $this->_add_users($workspace, $users, null, $noNotifUsers);
                self::edit_modified_date($workspace, false);
                //save
                $workspace->save();
                //end
                echo json_encode($unexistingUsers);
            }
            else echo "denied";

            if (!rcube_utils::get_input_value("_not_exist", rcube_utils::INPUT_POST)) exit;
        }
    }

    /**
     * Add users to workspace
     * 
     * @param Workspace $workspace
     * @param array $users
     * @param boolean $noNotif
     * @param array $noNotifUsers
     * 
     * @return void
     */
    function _add_users(&$workspace, $users, $noNotif = false, $noNotifUsers = [])
    {
        //get services
        $services = $this->get_worskpace_services($workspace, true, true);
        //update share
        $shares = $workspace->shares;
        $initShares = count($shares);
        $count = count($users);
        for ($i=0; $i < $count; ++$i) { 
            if (!self::is_in_workspace($workspace, $users[$i]))
            {
                $share = driver_mel::gi()->workspace_share([$workspace]);
                $share->user = $users[$i];
                $share->rights = Share::RIGHT_WRITE;
                $shares[] = $share;   

                if (class_exists("mel_notification") && !$noNotif && !in_array($users[$i], $noNotifUsers))
                {
                    $this->_notify_user($users[$i], $workspace, $users[$i]);
                }
            }                           
        }

        if ($initShares !== count($shares))
        {
            $workspace->shares = $shares;
            //update services
            $this->create_services($workspace, $services, $users, false);

            //update channel
            try {
                if (!(array_search(self::CHANNEL, $services) === false))
                {
                    
                    $rocket = $this->rc->plugins->get_plugin('rocket_chat');
                    $rocket->add_users($users, $this->get_object($workspace, self::CHANNEL)->id, $workspace->ispublic === 0 ? true : false);
                }
                if(!(array_search(self::TCHAP_CHANNEL, $services) === false))
                {
                    if (class_exists('tchap')) $value = tchap::invite_tchap_user($this->get_object($workspace, self::TCHAP_CHANNEL)->id, $users);
                }
            } catch (\Throwable $th) {
                //throw $th;
            }

            if (!(array_search(self::WEKAN, $services) === false))
            {
                $wekan = $this->wekan();
                //Update wekan
                $board_id = $this->get_object($workspace, self::WEKAN)->id; 
                foreach ($users as $key => $value) {
                    if (!$wekan->check_if_user_exist($board_id, $value))
                    {
                        try {
                            $wekan->add_member($board_id, $value);
                        } catch (\Throwable $th) {
                            throw $th;
                        }
                    }

                }
                
            }

            if (!(array_search(self::EMAIL, $services) === false))        
                $result = driver_mel::gi()->workspace_group($workspace->uid, $this->get_mails_from_workspace($workspace), $this->get_worskpace_services($workspace)[self::CLOUD]);
        }

    }

    function get_ariane()
    {
        return $this->rc->plugins->get_plugin('rocket_chat');
    }

    function delete_services_for_user(&$workspace, $user, $services_to_delete)
    {
        foreach ($services_to_delete as $key => $value) {
            switch ($value) {
                case self::CHANNEL:
                    try {
                        $rocket = $this->rc->plugins->get_plugin('rocket_chat');
                        $rocket->kick_user($this->get_object($workspace, self::CHANNEL)->id, $user, $workspace->ispublic === 0 ? true : false);
                    } catch (\Throwable $th) {
                        //throw $th;
                    }
                    break;
                case self::TCHAP_CHANNEL:
                    try {
                        //kick du salon tchap
                        if (class_exists('tchap')) $value = tchap::kick_member($this->get_object($workspace, self::TCHAP_CHANNEL)->id, $user);
                    } catch (\Throwable $th) {
                        //throw $th;
                    }
                    break;
                case self::TASKS:
                    include_once "../mel_moncompte/ressources/tasks.php";
                    $tasklist = $this->get_object($workspace,self::TASKS);

                    if ($tasklist !== null)
                    {
                        $mel = new M2taskswsp($tasklist);
                        $mel->deleteAcl($user);
                    }
                    break;
                case self::AGENDA:
                    $this->delete_calendar_workspace($workspace, $user);
                    break;
                case self::WEKAN:
                    $wekan = $this->wekan();
                    $board_id = $this->get_object($workspace, self::WEKAN)->id; 

                    if ($wekan->check_if_user_exist($board_id, $user))
                    {
                        try {
                            $wekan->remove_user($board_id, $user);
                        } catch (\Throwable $th) {
                            throw $th;
                        }
                    }   
                    break;

                case self::EMAIL:
                    $result = driver_mel::gi()->workspace_group($workspace->uid, $this->get_mails_from_workspace($workspace), $this->get_worskpace_services($workspace, false, true)[self::CLOUD]);               
                    break;

                default:
                    break;
            }
        }
    }

    function update_user_rights()
    {
        try {
            $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
            $user = rcube_utils::get_input_value("_id", rcube_utils::INPUT_POST);
            $new_right = rcube_utils::get_input_value("_right", rcube_utils::INPUT_POST);
            $workspace = self::get_workspace($uid);
            if (self::is_admin($workspace))
            {
             
                if (self::nb_admin($workspace) === 1 && $new_right === "w")
                {
                    echo "you are the alone";
                    exit;
                }

                $workspace->shares[$user]->rights = $new_right;
                self::edit_modified_date($workspace, false);
                $workspace->save();

                $services = $this->get_worskpace_services($workspace);

                if ($services[self::CHANNEL])
                    $this->get_ariane()->update_owner($user, $this->get_object($workspace, self::CHANNEL)->id, $workspace->ispublic === 0 ? true : false, $new_right === Share::RIGHT_WRITE);

                if ($services[self::WEKAN])
                    $this->wekan()->update_user_status($this->get_object($workspace, self::WEKAN)->id, $user, !($new_right === Share::RIGHT_WRITE));

                if ($user === driver_mel::gi()->getUser()->uid)
                    echo "reload";
            }
            else 
                echo "denied";
        } catch (\Throwable $th) {
            echo "error";
        }
        exit;
    }

    function update_user_table_rights()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $user_to_delete = rcube_utils::get_input_value("_user_to_delete", rcube_utils::INPUT_POST);
        $workspace = driver_mel::gi()->workspace([driver_mel::gi()->getUser()]);
        $workspace->uid = $uid;
        $workspace->load();
        echo $this->setup_params_rights($workspace);
        exit;
    }

    function delete_user($uid = null, $user_to_delete = null, $exit = true, $forceDelete = false)
    {
        if ($uid === null)
            $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        if ($user_to_delete === null)
            $user_to_delete = rcube_utils::get_input_value("_user_to_delete", rcube_utils::INPUT_POST);
        $workspace = self::get_workspace($uid);
        if(self::is_admin($workspace) || $user_to_delete === driver_mel::gi()->getUser()->uid )
        {
            //Si il n'y a qu'un seul admin
            if (self::is_admin($workspace) && self::nb_admin($workspace) === 1 && !$forceDelete)
            {
                //Et que l'on veut se supprimer
                if ($user_to_delete === driver_mel::gi()->getUser()->uid)
                {
                    echo "you are the alone";

                    if ($exit) exit;
                    else return;
                }
            }

            $user_find = false;
            foreach ($workspace->shares as $key => $value) {
                if ($value->user === $user_to_delete)
                {                
                    $shares = $workspace->shares;
                    unset($shares[$key]);
                    $workspace->shares = $shares;
                    $this->delete_services_for_user($workspace, $user_to_delete, $this->get_worskpace_services($workspace, true, true));
                    $user_find = true;
                    break;
                }
            }

            self::edit_modified_date($workspace, false);

            if ($user_find)
            {
                $workspace->save();

                if ($exit === true) mel_notification::notify("workspace", 'Vous avez été supprimé de l\'espace de travail "'.$workspace->title.'"', '', null, $user_to_delete);
            }

            echo "";
        }
        else
            echo "denied";
        if ($exit)
            exit;
    }

    function leave_workspace()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $workspace = self::get_workspace($uid);
        $shares = $workspace->shares;
        if (count($shares) === 1)
            echo "yourealone";
        else
        {
            $nb_admin = 0;
            foreach ($shares as $key => $value) {
                if (self::is_admin($workspace, $value->user))
                    ++$nb_admin;
            }
            if ($nb_admin === 1 && self::is_admin($workspace))
                echo 'youretheone';
            else {
                $this->delete_user($uid, driver_mel::gi()->getUser()->uid, false);
                echo '';
            }
        }
        exit;
    }

    function delete_workspace()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $workspace = self::get_workspace($uid);
        if (self::is_admin($workspace))
        {
            $shares = $workspace->shares;
            foreach ($shares as $key => $value) {
                $this->delete_user($uid, $value->user, false, true);
            }
            $workspace->hashtags = [];
            $workspace->save();
            $workspace->load();

            $services = $this->get_worskpace_services($workspace, false, true);

            try {

                if ($services[self::EMAIL] || $services[self::CLOUD])
                    driver_mel::gi()->workspace_group($workspace->uid, [], false);  

                if ($services[self::WEKAN])
                {
                    $wekan = $this->get_object($workspace, self::WEKAN);
                    if ($wekan->updated !== true) $this->wekan()->delete_board($wekan->id);
                }

                if ($services[self::TASKS]) {
                    $mel = new M2taskswsp($workspace->uid);
                    $tasklist = $mel->getTaskslist();
                    $mel->deleteTaskslist();

                }

                if ($services[self::CHANNEL])
                {
                    $can = true;
                    try {
                        $can = !($this->get_object($workspace, self::CHANNEL)->edited ?? false);
                    } catch (\Throwable $th) {
                        //throw $th;
                    }

                    if ($can)
                    {
                        $rocket = $this->rc->plugins->get_plugin('rocket_chat');
                        $rocket->delete_channel($this->get_object($workspace, self::CHANNEL)->id, $workspace->ispublic === 0 ? true : false);
                    }
                }
                if ($services[self::TCHAP_CHANNEL])
                {
                    $can =true;
                    try {
                        $can = !($this->get_object($workspace, self::TCHAP_CHANNEL)->edited ?? false);
                    } catch (\Throwable $th) {
                        //throw $th;
                    }
                    if ($can)
                    {
                        if (class_exists('tchap')) $value = tchap::delete_tchap_room($this->get_object($workspace, self::TCHAP_CHANNEL)->id);
                    }
                }

            } catch (\Throwable $th) {
                throw $th;
            }

            $workspace->delete();

        }
        else
            echo "denied";
        exit;
    }

    function update_app()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $app = rcube_utils::get_input_value("_app", rcube_utils::INPUT_POST);
        $workspace = self::get_workspace($uid);
        if (self::is_admin($workspace))
        {
            //Création de l'app
            if (!$this->get_worskpace_services($workspace)[$app])
            {
                switch ($app) {
                    case self::CHANNEL:
                        $users = $workspace->shares;
                        $map = function($value) {
                            return $value->user;
                        };
                        $users = array_map($map, $workspace->shares);
                        $tmp_users = [];
                        foreach ($users as $key => $value) {
                            $tmp_users[] = $value;
                        }
                        $users = $tmp_users;
                        unset($tmp_user);
                        if (class_exists('tchap')) $value = tchap::create_tchap_room($workspace->uid, $users);
                        $rocket = $this->rc->plugins->get_plugin('rocket_chat');
                        $value = $rocket->_create_channel($workspace->uid, $users,$workspace->ispublic === 0 ? false : true);
                        if (is_string($value["content"]))
                        {
                            $value = json_decode($value["content"]);
                            $value = $value->channel;//$value["content"]["channel"];
                            $this->save_object($workspace, self::CHANNEL, ["id" => $value->_id, "name" => $value->name]);
                        }
                        else{
                            $value = $value["content"]["channel"];
                            $this->save_object($workspace, self::CHANNEL, ["id" => $value["_id"], "name" => $value["name"]]);
                        }
                        break;
                    
                    default:
                    $this->create_services($workspace, [$app], null, true, true);
                        break;
                }
            }
            else
            {
                //Suppression de l'app
                switch ($app) {
                    case self::CHANNEL:
                        $can = true;
                        try {
                            if ($this->get_object($workspace, self::CHANNEL)->edited ?? false)
                                $can = false;
                        } catch (\Throwable $th) {
                            //throw $th;
                        }

                        if ($can)
                        {
                            $rocket = $this->rc->plugins->get_plugin('rocket_chat');
                            $rocket->delete_channel($this->get_object($workspace, self::CHANNEL)->id, $workspace->ispublic === 0 ? true : false);
                        }
                        
                        break;
                    case self::TCHAP_CHANNEL:
                        $can = true;
                        try {
                            if ($this->get_object($workspace, self::TCHAP_CHANNEL)->edited ?? false)
                                $can = false;
                        } catch (\Throwable $th) {
                            //throw $th;
                        }

                        if ($can)
                        {
                            if (class_exists('tchap')) tchap::delete_tchap_room($this->get_object($workspace, self::TCHAP_CHANNEL)->id);
                        }
                        
                        break;
                    case self::AGENDA:
                        break;
                    case self::WEKAN:
                        $this->wekan()->delete_board($this->get_object($workspace, $app)->id);
                        break;
                    case self::CLOUD:
                        driver_mel::gi()->workspace_group($uid, $this->get_mails_from_workspace($workspace), false);
                        break;
                    default:
                        $shares = $workspace->shares;
                        foreach ($shares as $key => $value) {
                            $this->delete_services_for_user($workspace, $key, [$app]);
                        }
                        break;
                }
                switch ($app) {
                    case self::AGENDA:
                        $this->save_object($workspace, self::AGENDA, false);
                        break;
                    default:
                        $this->save_object($workspace, $app, null);
                        break;
                }
            }
            self::edit_modified_date($workspace, false);
            $workspace->save();
        }
        else
            echo "denied";
        exit;  
    }

    function join_user()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $workspace = self::get_workspace($uid);
        if ($workspace->ispublic === 1)
        {
            $this->_add_users($workspace, [driver_mel::gi()->getUser()->uid], true);
            self::edit_modified_date($workspace, false);
            $workspace->save();
            $admins = self::get_admins($workspace);
            foreach($admins as $admin)
            {
                if (class_exists("mel_notification"))
                {
                    mel_notification::notify('workspace', driver_mel::gi()->getUser()->name.' vient de rejoindre l\'espace "'.$workspace->title.'" !','',null,$admin);
                }
            }
            //récupérer tout les admins du workspaces
            //for each notif
        }
        else
            echo "denied";
        exit;
    }


    function update_toolbar()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $workspace = self::get_workspace($uid);
        $this->currentWorkspace = $workspace;
        echo $this->get_toolbar();
        exit;
    }

    function update_services()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $workspace = self::get_workspace($uid);
        $this->currentWorkspace = $workspace;
        echo $this->get_services();
        exit;
    }

    function archive_workspace()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $workspace = self::get_workspace($uid);
        if (self::is_admin($workspace))
        {
            $workspace->isarchived = !$workspace->isarchived;
            self::edit_modified_date($workspace, false);
            $workspace->save();
            echo "";
        }
        else
            echo "denied";
        exit;
    }

    function get_email_from_workspace()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $workspace = self::get_workspace($uid);
        $shares = $workspace->shares;
        $array = [];
        $user = driver_mel::gi()->getUser()->uid;
        foreach ($shares as $key => $value) {
            if ($value->user !== $user)
            {
                $tmp = driver_mel::gi()->getUser($value->user);

                if (isset($tmp)) $array[] = "$tmp->fullname<$tmp->email>";
            }
                
        }
        echo json_encode($array);
        exit;
    }

    function get_hashtags()
    {
        $hashtag_label = rcube_utils::get_input_value("_hashtag", rcube_utils::INPUT_GPC);
        $hashtag = driver_mel::gi()->workspace_hashtag();
        $hashtag->label = "$hashtag_label%";
        $operators = ["label" => \LibMelanie\Config\MappingMce::like];
        $hashtags_raw = $hashtag->getList(null, null, $operators, "label", true);
        $hashtags = [];

        foreach ($hashtags_raw as $key => $value) {
            $hashtags[] = $value->hashtag;
        }

        echo json_encode($hashtags);
        exit;
    }

    function notify_chat()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $text = rcube_utils::get_input_value("_text", rcube_utils::INPUT_POST);
        //$path = rcube_utils::get_input_value("_path", rcube_utils::INPUT_POST);
        $workspace = self::get_workspace($uid);

        $logo = $workspace->logo;
        if ($logo === "")
            $logo = null;
        // else
        //     $logo = $path.$logo;

        $rocket = $this->rc->plugins->get_plugin('rocket_chat');
        try {

            echo json_encode($rocket->post_message($this->get_object($workspace, self::CHANNEL)->id, $text, $workspace->title, $logo));
        } catch (\Throwable $th) {
            echo "error";
            $func = "notify_chat";
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->$func] Un erreur est survenue lors de la notification RocketChat pour l'espace de travail ''".$workspace->title."'' !");
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->$func]".$th->getTraceAsString());
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->$func]".$th->getMessage());
        }

        exit;

    }

    /**
     * Si vrai, tout va bien, si faux, le service existe mais l'élement associé, non.
     *
     * @param string $service
     * @param Workspace $workspace
     * @return boolean
     */
    function check_services($service, $workspace)
    {
        $value = true;
        $all_services = $this->get_worskpace_services($workspace, false, true);

        switch ($service) {
            case 'all':               
                $value = [
                    self::AGENDA => $this->check_services(self::AGENDA, $workspace),
                    //self::CHANNEL => $this->check_services(self::CHANNEL, $workspace),
                    self::TASKS => $this->check_services(self::TASKS, $workspace),
                    self::WEKAN => $this->check_services(self::WEKAN, $workspace),
                    self::LINKS => $this->check_services(self::LINKS, $workspace)
                ];
                break;

            case self::AGENDA:
                include_once 'lib/mel_utils.php';

                if($all_services[self::AGENDA])
                    $value = $this->check_agenda('ws#'.$workspace->uid); 
                    //mel_utils::cal_check_category('ws#'.$workspace->uid);
                else
                    $value = true;
                break;

                case self::LINKS:
                    return !($this->get_object($workspace, self::LINKS) === null);
                break;

            case self::CHANNEL:
                // if ($all_services[self::CHANNEL])
                // {
                //     try {
                //         $value = $this->check_channel($this->get_object($workspace, self::CHANNEL)->id);
                //         //$this->get_ariane()->check_if_room_exist($this->get_object($workspace, self::CHANNEL)->id);
                //     } catch (\Throwable $th) {
                //         $value = true;
                //         $func = "CheckChannel";
                //         mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->$func] Un erreur est survenue lors du check de l'espace de travail ''".$this->currentWorkspace->title."'' pour ariane !");
                //         mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->$func]".$th->getTraceAsString());
                //         mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->$func]".$th->getMessage());
                //     }
                // }
                // else
                    $value = true;
                break;

            case self::TASKS:
                if ($all_services[self::TASKS])
                {
                    // $mel = new M2tasks(null, $this->get_object($workspace,self::TASKS));
                    // $tasklist = $mel->getTaskslist();
                    
                    // $value = $tasklist !== null;
                    $value = $this->check_tasks($workspace);
                }
                else
                    $value = true;
                break;

            case self::WEKAN:
                if ($all_services[self::WEKAN])
                {
                    $board_id = $this->get_object($workspace, self::WEKAN)->id;

                    if ($board_id !== null && $this->check_wekan($board_id))
                    {

                        if ($this->wekan()->board_archived($board_id))
                        {
                            if ($this->get_setting($workspace, self::WEKAN) !== true)
                                $this->add_setting($workspace, self::WEKAN, true);
                            return true;
                        }
                        else if ($this->get_setting($workspace, self::WEKAN) === true)
                            $this->add_setting($workspace, self::WEKAN, false);

                        return $this->check_wekan_member($board_id, driver_mel::gi()->getUser()->uid) ? true : null;
                    }
                    else 
                        return false;

                }
                else
                    $value = true;
                break;

            default:
                break;
        }

        return $value;
    }

    function check_tasks($workspace)
    {
        $mel = new M2taskswsp($this->get_object($workspace, self::TASKS));
        $tasklist = $mel->getTaskslist();

        return $tasklist !== null ? ($this->check_user_task($workspace, $mel) ? true : [
            'state' => 'invalid',
            'text' => 'La liste des tâches existe mais vous n\'êtes pas dedans, nous allons vous ajouter....',
            'ok_text' => 'Vous avez été ajouter avec succès !',
            'nok_text' => 'Un problème est survenu...',
            'custom_args' => 'need_add_user'
        ] ) : false;
    }

    function check_user_task($workspace, &$tasklist = null) {
        $mel = $tasklist ?? new M2taskswsp($this->get_object($workspace, self::TASKS));

        return $mel->getAcl(driver_mel::gi()->getUser());
    }

    function check_wekan($board_id)
    {
        return $this->wekan()->board_exist($board_id);
    }

    function check_wekan_member($board_id, $user)
    {
        return $this->wekan()->check_if_user_exist($board_id, $user);
    }

    function check_channel($channel_id)
    {
        return $this->get_ariane()->check_if_room_exist($channel_id);
    }

    function check_tchap_channel($room_id)
    {
        $value = false;
        if(class_exists('tchap')) $value = tchap::check_if_room_exist($room_id);
        return $value;
    }

    function check_channel_name($channel_name)
    {
        return $this->get_ariane()->check_if_room_exist_by_name($channel_name);
    }

    function generate_channel_id_via_uid($uid)
    {
        if ($this->check_channel_name($uid))
        {
            $it = 2;
            while($this->check_channel_name("$uid-$it"))
            {
                ++$it;
            }
            
            $uid = "$uid-$it";
        }

        return $uid;
    }

    function check_agenda($category)
    {
        return mel_utils::cal_check_category($category);
    }

    function services_action_errors(&$workspace, $services = null)
    {
        try {
            $needUpdate = false;
            $services = $services ?? $this->check_services("all", $workspace);

            foreach ($services as $key => $value) {
                if ($services[$key] === null || !$services[$key])
                {
                    switch ($key) {
                        case self::AGENDA:

                            include_once 'lib/mel_utils.php';
                            mel_utils::cal_add_category(driver_mel::gi()->getUser()->uid, "ws#".$workspace->uid, $this->get_setting($workspace, "color"));
                            $needUpdate = true;

                            break;
        
                        case self::CHANNEL:      
                            // try {

                            //     if (self::is_admin($workspace))
                            //     {
                            //         $users = array_map($map, $workspace->shares);
                            //         $tmp_users = [];
                
                            //         foreach ($users as $key => $value) {
                            //             $tmp_users[] = $key;
                            //         }
                
                            //         $uid = $this->generate_channel_id_via_uid($workspace->uid);
                            //         $value = $this->get_ariane()->_create_channel($uid, $tmp_users, $workspace->ispublic === 0 ? false : true);
                                    
                            //         if (is_string($value["content"]))
                            //         {
                            //             $value = json_decode($value["content"]);
                            //             $value = $value->channel;//$value["content"]["channel"];
                            //             $this->save_object($workspace, self::CHANNEL, ["id" => $value->_id, "name" => $value->name]);
                            //         }
                            //         else {
                            //             $value = $value["content"]["channel"];
                            //             $this->save_object($workspace, self::CHANNEL, ["id" => $value["_id"], "name" => $value["name"]]);
                            //         }
        
                            //         $needUpdate = true;
                            //     }

                            // } catch (\Throwable $th) {

                            // }

                            break;
        
                        case self::TASKS:
                            if ($value === 'need_add_user')
                            {
                                $mel = new M2taskswsp($this->get_object($workspace, self::TASKS));

                                if ($mel->getTaskslist() !== null) {
                                    $mel->setAcl(driver_mel::gi()->getUser()->uid, ["w"]);
                                }

                                $needUpdate = false;
                            }
                            else {
                                $mel = new M2taskswsp($workspace->uid);
        
                                if ($mel->createTaskslist($workspace->title))
                                {
                                    $users = $workspace->shares;
                                    foreach ($users as $s)
                                    {
                                        $mel->setAcl($s->user, ["w"]);
                                    }
            
                                    $taskslist = $mel->getTaskslist();
                                    $this->save_object($workspace, self::TASKS, $taskslist->id);
                                }
                                $needUpdate = true;
                            }


                            break;

                        case self::WEKAN:

                            //Le wekan existe mais le membre non
                            if ($services[$key] === null)
                                $this->wekan()->add_member($this->get_object($workspace, self::WEKAN)->id, driver_mel::gi()->getUser()->uid, self::is_admin($workspace));
                            //Le wekan n'existe pas
                            else if ($services[$key] === false)
                            {
                                $this->save_object($workspace, self::WEKAN, null);

                                $map = function($value) {
                                    return $value->user;
                                };
                                $users = array_map($map, $workspace->shares);

                                $this->create_wekan($workspace, $services, $users, null);
                            }

                            $needUpdate = true;

                            break;

                        case self::LINKS:

                            $this->create_service_links($workspace);
                            $needUpdate = true;
                            break;
                        
                        default:
                            # code...
                            break;
                    }
                }
            }
        } catch (\Throwable $th) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->$func] Un erreur est survenue lors de la gestion de l'espace de travail ''".$workspace->title."'' !");
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->$func]".$th->getTraceAsString());
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->$func]".$th->getMessage());
        }

        return $needUpdate;
    }


    function log_error($func, $text, $th)
    {
        mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->$func] Un erreur est survenue lors de la récupération $text l'espace de travail ''".$this->currentWorkspace->title."'' !");
        mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->$func]".$th->getTraceAsString());
        mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->$func]".$th->getMessage());
    }

    public static function edit_modified_date(&$workspace, $save = true, $date = null)
    {
        $workspace->modified = $date ?? new DateTime('now');

        if ($save) $workspace->save();
    }

    public static function is_admin($workspace, $username = null)
    {
        $user = $workspace->shares[$username ?? driver_mel::gi()->getUser()->uid];
        if ($user !== null)
            return $user->rights === Share::RIGHT_OWNER;
        else
            return false;
    }

    public static function nb_admin($workspace)
    {
        $nb_admin = 0;
        $shares = $workspace->shares;
        foreach ($shares as $key => $value) {
            if (self::is_admin($workspace, $value->user))
                ++$nb_admin;
        }
        return $nb_admin;
    }

    public static function nb_users($workspace)
    {
        $shares = $workspace->shares;
        return count($shares);
    }

    public static function get_other_admin($workspace, $username = null)
    {
        $me = $username ?? driver_mel::gi()->getUser()->uid;
        $users = self::get_users($workspace);
        foreach ($users as $user) {
            if ($user !== $me && self::is_admin($user))
                return $user;
        }
        return null;
    }

    public static function get_users($workspace){
        foreach ($workspace->shares as $key => $value) {
            yield $key;
        }
    }

    public static function get_admins($workspace)
    {
        $users = self::get_users($workspace);
        foreach ($users as $user){
            if(self::is_admin($workspace, $user)){
                yield $user;
            }
        }
    }

    public static function is_in_workspace($workspace, $username = null)
    {
        return $workspace->shares[$username ?? driver_mel::gi()->getUser()->uid] !== null;
    }

    public static function generate_uid($title, $rc)
    {
        $max = 30;

        mel_helper::load_helper($rc)->include_utilities();
        $text = mel_utils::replace_determinants(mel_utils::replace_special_char(mel_utils::remove_accents(strtolower($title))), "-");
        $text = str_replace(" ", "-", $text);
        if (count($text) > $max)
        {
            $title = "";
            for ($i=0; $i < count($text); $i++) { 
                if ($i >= $max)
                    break;
                $title.= $text[$i];
            }
            $text = $title;
        }
        $it = 0;
        do {
            $workspace = driver_mel::gi()->workspace();
            $workspace->uid = $text."-".(++$it);
        } while ($workspace->exists());
        
        do {
            $workspace = driver_mel::gi()->workspace();
            $workspace->uid = $text."-".(++$it);
        } while (driver_mel::gi()->if_group_exist($workspace->uid));

        return $text."-".$it;
    }

    public static function is_epingle($uid, $rc)
    {
        $epingles = $rc->config->get('workspaces_personal_datas', []);

        if ($epingles[$uid] === null)
            return false;
        else if ($epingles[$uid]["tak"] === null)
            return false;
        else
            return $epingles[$uid]["tak"];
        // $settings = json_decode($loaded_workspace->settings);
        // if ($settings === null)
        //     return false;
        // if ($settings->epingle === true)
        //     return true;
        // return false;
    }

    public static function get_wsp_mail($wid)
    {
        $group = driver_mel::gi()->get_workspace_group($wid);

        $email = null;

        if (isset($group)) {
          $email = $group->email;
        }

        return $email;
    }

    public static function get_workspace($uid)
    {
        $workspace = driver_mel::gi()->workspace([driver_mel::gi()->getUser()]);
        $workspace->uid = $uid;
        $workspace->load();
        return $workspace;
    }

    public static function get_completed_task($task)
    {
        return $task["complete"] === 1;
    }

    public static function get_from_template($config, $html)
    {
        foreach ($config as $key => $value) {
            $html = str_replace("<$key/>", $value, $html);
        }

        return $html;
    }

    // public function create_nc($workspace)
    // {
    //     $datas = null;

    //     return $datas;
    // }

    public function check_if_workspace_have_nc($workspace)
    {
        return $this->get_object($workspace, self::CLOUD) ?? false;
    }

    // public function delete_nc(&$workspace)
    // {

    // }

    public function create_stockage_service(&$workspace)
    {
        if (!$this->check_if_workspace_have_nc($workspace))
        {
            $created = create_nc($workspace);

            if ($created["success"])
                $this->save_object($workspace, self::CLOUD, $created["datas_to_save"]);
    
            return $created["datas_to_save"];
        }
    }

    public function have_group($workspace)
    {
        return $this->get_object($workspace, self::GROUP);
    }

    public function create_group(&$workspace, $activate_drive)
    {
        $return = ["success" => "true", "why" => "everything is okay", "error_num" => 0];

        $have_group = $this->have_group($workspace) ?? false;
        $have_nc = $this->check_if_workspace_have_nc($workspace) ?? false;

        if (!$have_group || $have_nc !== $activate_drive)
        {
            //mel_logs::get_instance()->log(mel_logs::WARN, "/!\\[create_group]Have_nc => $have_nc ; activate_drive => $activate_drice");
            $result = driver_mel::gi()->workspace_group($workspace->uid, $this->get_mails_from_workspace($workspace), $activate_drive);
            $this->save_object($workspace, self::GROUP, $result);
            $this->save_object($workspace, self::CLOUD, $activate_drive);
            $this->remove_stockage_settings($workspace);
            $this->set_stockage_created($workspace, 0);
            //$this->edit_personal_user_data($workspace->uid, "current_nextcloud_updated", null);

            if (!$result)
            {
                $result["success"] = false;
                $result["why"] = "error";
                $result["error_num"] = 1;
            }
        }
        else
        {
            $result["success"] = false;
            $result["why"] = "already exist";
            $result["error_num"] = 2;
        }

        //mel_logs::get_instance()->log(mel_logs::WARN, '/!\\[create_group]result : '.$result["error_num"].' - '.$result["why"].' ('.$result["success"].')');

        return $return;

    }

    public function get_mails_from_workspace($workspace)
    {
        $mails = [];
        $users = self::get_users($workspace);
        foreach ($users as $user) {
            $tmp = driver_mel::gi()->getUser($user)->email;

            if (isset($tmp)) $mails[] = $tmp;
        }

        return $mails;
    }

    function get_mails($workspace)
    {
        $before = "edt.";
        $uid = $workspace->uid;
        $after = "@i-carre.net";

        include_once "program/search_result/search_result_mail.php";
        $input = "tommy.delphin@i-carre.net";//"tommy.delphin@i-carre.net";//$before.$uid.$after;
        $search = "ALL UNSEEN OR HEADER TO $input HEADER CC $input";
        $msgs = $this->rc->get_storage()->list_messages();
        $tmp = $this->rc->get_storage()->search(null, $search, RCUBE_CHARSET, "arrival");
        //$this->rc->storage->search(null, "HEADER TO $input", RCUBE_CHARSET, "arrival");
        $array = $tmp->get();

        $size = count($msgs);
        $return = "";

        foreach ($array as $index => $id) {
            $key = mel_metapage::search_id_in_mail($id, $msgs, $size);

            if ($key !== false)
                $return .= $this->format_mail_in_html($msgs[$key]);
        } 

        return $return;

    }

    function format_mail_in_html($mail)
    {
        $html = html::div(["class" => "row wsp-email-row", "onclick" => "showMail(".$mail->uid.")"], 
            html::tag("div", ["class" => "col-md-3 wsp-email-from"], rcube_mime::decode_header($mail->from, $mail->charset)).
            html::tag("div", ["class" => "col-md-6 wsp-email-subject"], rcube_mime::decode_header($mail->subject, $mail->charset)).
            html::tag("div", ["class" => "col-md-3 wsp-email-date"], date("d/m/Y H:i:s", strtotime($mail->date)))
        );

        return $html;
    }

    function wekan()
    {
        return mel_helper::get_rc_plugin($this->rc, "mel_wekan");
    }

    function create_workspace_wekan($workspace, $title, $isPublic, $color, $list, $users)
    {
        $wekan = $this->wekan();
        $return = [
            "board" => $wekan->create_board_with_inital_lists($title, $isPublic, $color, $list),
            "users" => []
        ];

        if ($return["board"]["httpCode"] == 200)
        {
            $current_user = driver_mel::gi()->getUser()->uid;
            $board_id = $return["board"]["board_id"] !== null ? $return["board"]["board_id"] : json_decode($return["board"]["content"])->_id;

            $return['users'] = $this->add_users_to_wekan_board($workspace, $users, $board_id, $wekan, $current_user)['users'];

            $return["board_id"] = $board_id;
            $return["board_title"] = null;//$return["board"]["board_title"] !== null ? $return["board"]["board_title"] : json_decode($return["board"]["content"])->title;
        }

        return $return;
    }

    function add_users_to_wekan_board($workspace, $users, $board_id = null, $wekan = null, $current_user = null)
    {
        if (!isset($current_user)) $current_user = driver_mel::gi()->getUser()->uid;
        if (!isset($wekan)) $wekan = $this->wekan();

        if (!isset($board_id)) $board_id = $this->get_object($workspace, self::WEKAN)->id;

        $return = ['users' => []];

        foreach ($users as $key => $value) {
            if (!$wekan->check_if_user_exist($board_id, $value))
            {
                try {
                    $return['users'][$value] = $wekan->add_member($board_id, $value, self::is_admin($workspace, $value));
                    $wekan->update_user_status($board_id, $value, self::is_admin($workspace, $value));
                } catch (\Throwable $th) {
                    //throw $th;
                }
            }
        }

        return $return;
    }

    public function get_uLinks()
    {
        $id = rcube_utils::get_input_value("_id", rcube_utils::INPUT_GPC);
        
        $this->get_workspace_ulinks(self::get_workspace($id));

        $this->rc->output->send('mel_useful_link.index');
    }

    function get_workspace_ulinks($workspace = null) {
      $workspace = $workspace ?? $this->currentWorkspace;
      $this->load_script_module_from_plugin('mel_useful_link', 'manager');

      $links_plugin = $this->rc->plugins->get_plugin('mel_useful_link');
      $links_plugin->load_config();

      $this->rc->output->set_env("external_icon_url", $this->rc->config->get('external_icon_url', []));

      $links = $links_plugin->get_workspace_link($workspace, $this, true);

      $this->rc->output->set_env("mul_items", $links);
      $this->rc->output->set_env("mul_items_key", 'ws#'.$workspace->uid);
    }

    function get_workspace_ulinks_by_id($args) {
      if (substr($args['key'], 0, 3) === "ws#") {
        $workspace_id = substr($args['key'], 3);
        $workspace = self::get_workspace($workspace_id);
        $args['links'] = $this->get_object($workspace, self::LINKS);
      }

      return $args;
    }

    function save_workspace_ulinks($args) {
      if (substr($args['key'], 0, 3) === "ws#") {
        $workspace_id = substr($args['key'], 3);
        $workspace = $this->get_workspace($workspace_id);

        $this->save_object($workspace, self::LINKS, $args['links']);
        $workspace->save();
        $args['done'] = true;

        return $args;
      }
      $args['done'] = false;
      return $args;
    }


    function refresh_documents()
    {
        $wid = rcube_utils::get_input_value("_workspace_id", rcube_utils::INPUT_GPC);
        $workspace = self::get_workspace($wid);

        if ($this->get_setting($workspace, "nc_refreshed") !== true)
        {
            $mails = $this->get_mails_from_workspace($workspace);
            $result = driver_mel::gi()->workspace_group($wid, $mails, false);
            $result2 = driver_mel::gi()->workspace_group($wid, $mails, true);

            $this->add_setting($workspace, "nc_refreshed", true);

            $workspace->save();

            echo json_encode([$result, $result2]);
        }
        else    
            echo ([true, true]);


        exit;
    }

    function get_arianes_rooms()
    {
        $uid =  rcube_utils::get_input_value("_uid", rcube_utils::INPUT_GPC);
        $wsp = self::get_workspace($uid);
        $html_ariane = "<div id=selectnewchannel>".
        mel_helper::get_rc_plugin($this->rc, "mel_metapage")->get_program("webconf")->get_ariane_rooms(" custom-select pretty-select form-control input-mel ", true, $this->currentWorkspace->ispublic == 1 ? 1 : 2).
        "</div>";
        echo $html_ariane;
        exit;
    }

    function change_ariane_room()
    {
        $name = rcube_utils::get_input_value("_name", rcube_utils::INPUT_GPC);
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_GPC);

        $name = $this->get_ariane()->room_info($name);
        $datas = ["id" => $name["content"]->room->_id, "name" => $name["content"]->room->name, "edited" => true];

        $wsp = self::get_workspace($uid);
        $this->sync_workspace_chat($wsp, $name["content"]->room);
        $this->save_object($wsp, self::CHANNEL, $datas);
        self::edit_modified_date($wsp, false);
        $wsp->save();

        echo json_encode($datas);
        exit;
    }

    function sync_workspace_chat($wsp, $room)
    {
        //p => group / c => channel
        $shares = $wsp->shares;
        $users = self::get_users($wsp);

        $rocket = $this->get_ariane();

        foreach ($users as $user) {
            $room_id = $room->_id;
            $isPrivate = $room->t === 'p';
            $rocket->add_users([$user], $room_id, $isPrivate);
            $rocket->update_owner($user, $room_id, $isPrivate, !self::is_admin($wsp, $user));
        }
    }
    
    function change_tchap_room()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_GPC);
        $room_id = rcube_utils::get_input_value("_room_uid", rcube_utils::INPUT_GP);
        $config = [];
        $config['id'] = $room_id;
        if(class_exists('tchap') && tchap::check_if_room_exist($room_id)){
            $wsp = self::get_workspace($uid);
            $this->sync_workspace_tchap($wsp, $room_id);
            $this->save_object($wsp, self::TCHAP_CHANNEL, $config);
            self::edit_modified_date($wsp, false);
            $wsp->save();
            $value = true;
        } else {
            $value = false;
        }
        //si non 
        echo json_encode($value);
        exit;
    }

    function sync_workspace_tchap($wsp, $room_id)
    {
        $users = self::get_users($wsp);
        if  (class_exists('tchap'))
        {
            foreach ($users as $user) {
                tchap::invite_tchap_user($room_id, $user);
            }
        }
    }

    function stockage_user_updated()
    {
        $uid =  rcube_utils::get_input_value("_uid", rcube_utils::INPUT_GPC);

        $wsp = self::get_workspace($uid);
        if (!$this->get_worskpace_services($wsp, false, true)[self::CLOUD])
        {
            echo 0;
            exit; 
        }
        else {

            $date = rcube_utils::get_input_value("_date", rcube_utils::INPUT_GPC);
            $user = rcube_utils::get_input_value("_user", rcube_utils::INPUT_GPC) ?? false;
            $set = rcube_utils::get_input_value("_set", rcube_utils::INPUT_GPC) ?? false;

            if (!$set)
                $this->set_stockage_created($wsp, $date, $user ? driver_mel::gi()->getUser()->uid : null);
            else
            {
                $this->set_stockage_enabled($wsp);
                $this->set_stockage_enabled($wsp, driver_mel::gi()->getUser()->uid);
            }

            echo 1;
            exit;
        }
    }

    const STOCKAGE = "stockage";
    function get_stockage_enabled($workspace, $user = null)
    {
        $stockage = $this->get_setting($workspace, self::STOCKAGE);

        if ($stockage === null)
            return false;
        
        if ($user !== null)
            return $stockage->enabled == 1 && ($stockage->$user ?? 0) == 1 ? 1 : ($stockage->$user ?? ($stockage->enabled ?? false));
        else
            return $stockage->enabled == 1 ? 1 : ($stockage->enabled ?? false);
    }

    function set_stockage_created(&$workspace, $date, $user = null)
    {
        $stockage = $this->get_setting($workspace, self::STOCKAGE);

        if ($stockage === null)
        {
            $stockage = [];
            $stockage["enabled"] = $date;
            if ($user != null)
                $stockage[$user] = $date;
        }
        else {
            if ($user !== null)
                $stockage->$user = $date;
            else
                $stockage->enabled = $date;
        }

        $this->add_setting($workspace, self::STOCKAGE, $stockage);
        self::edit_modified_date($workspace, false);
        $workspace->save();
    }

    function set_stockage_enabled(&$workspace, $user = null)
    {
        $stockage = $this->get_setting($workspace, self::STOCKAGE);
        
        if ($stockage === null)
            $stockage = ["enabled" => 1];
        else {
            if ($user !== null && $stockage->$user !== null)
                unset($stockage->$user);
            else
                $stockage->enabled = 1;
        }

        $this->add_setting($workspace, self::STOCKAGE, $stockage);
        self::edit_modified_date($workspace, false);
        $workspace->save();
    }

    function remove_stockage_settings(&$workspace)
    {
        $this->add_setting($workspace, self::STOCKAGE, null);
        self::edit_modified_date($workspace, false);
        $workspace->save();
    }

    function edit_personal_user_data($uid, $key, $value)
    {
        $datas = $this->rc->config->get('workspaces_personal_datas', []);

        if ($datas[$uid] === null)
            $datas[$uid]  = [];

        $datas[$uid][$key] = $value;

        $this->rc->user->save_prefs(array('workspaces_personal_datas' => $datas));
    }

    function get_personal_user_data($uid, $key, $defaultVal = null)
    {
        $val = null;
        $datas = $this->rc->config->get('workspaces_personal_datas', []);

        if ($datas[$uid] !== null)
            $val = $datas[$uid][$key];

        if ($val === null && $defaultVal !== null)
            $this->edit_personal_user_data($uid, $key, $defaultVal);

        return $val ?? $defaultVal;

    }

    function update_end_date_setting()
    {
        $uid =  rcube_utils::get_input_value("_uid", rcube_utils::INPUT_GPC);
        $new_date =  rcube_utils::get_input_value("_date", rcube_utils::INPUT_GPC);

        $wsp = self::get_workspace($uid);

        if (self::is_admin($wsp))
        {
            $this->add_setting($wsp, "end_date", $new_date);
            self::edit_modified_date($wsp, false);
            $wsp->save();
            echo true;
        }
        else
            echo "denied";
    
        exit;
    }

    function sort_user($users)
    {
        usort($users, function($a, $b)
        {
            if ($a->rights == $b->rights)
                return driver_mel::gi()->getUser($a->user)->name <=> driver_mel::gi()->getUser($b->user)->name;
            
            return $a->rights == Share::RIGHT_OWNER && $b->rights != $a->rights ? -1 : 1;


        });
        return $users;
    }

    public function prefs_list($args) {

        if ($args['section'] == 'general') {
          // Load localization and configuration
          $this->add_texts('localization/');
    
          $varKey = "mel-force-nav-color";
    
          // Check that configuration is not disabled
          $config = $this->rc->config->get('workspace_bar_color_force', 'default');
    
          $options = [
                $varKey => [
                    $this->gettext("never", "mel_workspace"),
                    $this->gettext("default", "mel_workspace"),
                    $this->gettext("always", "mel_workspace")
                ],
            ];
    
            // $args['blocks']['main']['options'][$text_size] = null;
        $attrib = [];
    
        $attrib['name'] = $varKey;
        $attrib['id'] = $varKey;
    
        $input = new html_select($attrib);   
        $input->add($options[$varKey], ["never", "default", "always"]);
        
    
        unset($attrib['name']);
        unset($attrib['id']);
        $attrib["for"] = $varKey;
    
        $args['blocks']['main']['options'][$varKey] = array(
            'title' => html::label($attrib, rcube::Q($this->gettext($varKey, "mel_workspace"))),
            'content' => $input->show($config),
          );
          
        }
    
        return $args;
      }

      public function prefs_save($args) {
        if ($args['section'] == 'general') {
            $varKey = "mel-force-nav-color";
    
            // Check that configuration is not disabled
            $config = $this->rc->config->get('workspace_bar_color_force', 'default');
    
            $config = rcube_utils::get_input_value($varKey, rcube_utils::INPUT_POST);
          
    
          $args['prefs']["workspace_bar_color_force"] = $config;
          
        }
    
        return $args;
      }

    function update_edit_date()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        echo self::edit_modified_date(self::get_workspace($uid));
        exit;
    }

    function update_primary_parameters()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $type = rcube_utils::get_input_value("_type", rcube_utils::INPUT_POST);
        $val = rcube_utils::get_input_value("_val", rcube_utils::INPUT_POST);

        $wsp = self::get_workspace($uid);

        if (self::is_admin($wsp))
        {

            switch ($type) {
                case 'title':
                    $wsp->title = $val;
                    break;
                case 'desc':
                    $wsp->description = $val;
                    break;
                case 'hashtag':
                    $wsp->hashtags = [$val];
                    break;
                    
                default:
                    # code...
                    break;
            } 

            $wsp->save();
            echo true;
        }
        else
            echo "denied";
    
        exit;
    }

    public function get_wekan_admin_boards()
    {
        $wsp_id = rcube_utils::get_input_value("_wsp", rcube_utils::INPUT_POST);
        $wsp = self::get_workspace($wsp_id);
        $wekan = $this->get_object($wsp, self::WEKAN)->id;
        $boards_min = [];
        
        $html = '<select id="select-update-wekan" class="input-mel mel-input form-control">';

        foreach ($this->wekan()->get_user_admin_board_generator(driver_mel::gi()->getUser()->uid) as $value) {
            if (($wsp->ispublic && $value->permission === 'public') || 
            (!$wsp->ispublic && $value->permission === 'private'))
                //$boards_min[] = ["id" => $value->id, "title" => $value->title];
                $html .= '<option value="'.$value->id.'" '.($value->id === $wekan ? 'selected' : '').'>'.$value->title.'</option>';
        }

        $html .= '</select>';

        echo $html;
        exit;
    }

    public function update_wekan_board()
    {
        $id = rcube_utils::get_input_value("_id", rcube_utils::INPUT_POST);
        $wsp_id = rcube_utils::get_input_value("_wsp", rcube_utils::INPUT_POST);

        $wsp = self::get_workspace($wsp_id);

        if (self::is_admin($wsp))
        {
            $wekan = $this->get_object($wsp, self::WEKAN);
            $wekan->id = $id;
            $this->add_users_to_wekan_board($wsp, $this->get_workspace_users($wsp, 'id'), $wekan->id);
            $wekan->updated = true;
            $this->save_object($wsp, self::WEKAN, $wekan);
            $wsp->save();
            echo true;
        }
        else echo "denied";

         exit;
    }

    private function get_workspace_users_generator($wsp, $mode) {
        $shared = $wsp->shares;
        foreach ($shared as $key => $value) {
            switch ($mode) {
                case 'all':
                    yield $value;

                case 'id':
                    yield $value->user;
                
                default:
                    throw new Exception("$mode not exist", 1);
            }
        }
    }

    private function get_workspace_users($wsp, $mode)
    {
        $shared = $wsp->shares;

        if ($mode !== 'all') {
            $tmp = [];

            foreach ($shared as $key => $value) {
                switch ($mode) {
                    case 'id':
                        $tmp[] = $value->user;
                        break;
                    
                    default:
                        throw new Exception("$mode not exist", 1);
                }
            }
            $shared = $tmp;
        }

        return $shared;
    }

    /**
     * Supprime les évènements futur lié à un espace de travail.
     *
     * @param LibMelanie\Api\Defaut\Workspace $workspace
     * @param LibMelanie\Api\Defaut\User $user
     * @return void
     */
    public function delete_calendar_workspace($workspace, $user)
    {
        $now = date(LibMelanie\Api\Defaut\Event::DB_DATE_FORMAT);
        $time = strtotime($now);
        $calendar = driver_mel::gi()->calendar([$user]);
        $events = $calendar->getRangeEvents($now);

        foreach ($events as $e) {
            if ($e->category === 'ws#'.$workspace->uid) 
            {
                if ($e->recurrence->type !== LibMelanie\Api\Defaut\Recurrence::RECURTYPE_NORECUR)
                {
                    $e->recurrence->enddate = $now;
                    
                    if (isset($e->exceptions))
                    {
                        foreach ($e->exceptions as $exception) {
                            if (strtotime($exception->start) > $time)
                            {
                                $exception->delete();
                            }
                        }
                    }
                    $e->save();
                }
                else $e->delete();
            }
        }
        
        $calendar->save();     
    }

    const SURVEY = 'survey';
    public function add_survey()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST); //Id de l'espace
        $wsp = self::get_workspace($uid); //Récupération de l'espace
        $link = rcube_utils::get_input_value("_zelda", rcube_utils::INPUT_POST); //Récupération du lien du sondage
        $title = rcube_utils::get_input_value("_title", rcube_utils::INPUT_POST);
        $survey = $this->get_object($wsp, self::SURVEY) ?? [];

        $sid = rcube_utils::get_input_value("_sid", rcube_utils::INPUT_POST);//?? $this->generate_survey_id($wsp, $survey);

        if (!isset($sid))
        {
            self::notify($wsp, 'Le sondage "'.$title.'" vient d\'être créé dans l\'espace "'.$wsp->title.'" !', 'Vous pouvez répondre en allant dans l\'espace.', 
            [
                'main' => ['href' => "./?_task=workspace&_action=workspace&_uid=".$wsp->uid,
                            'text' => $this->gettext("mel_workspace.open"),
                            'title' => $this->gettext("mel_workspace.click_for_open"),
                            'command' => "event.click"
                        ]
            ]);
            $sid = $this->generate_survey_id($wsp, $survey);
        }
        else {
            self::notify($wsp, 'Le sondage "'.$title.'" vient d\'être modifié dans l\'espace "'.$wsp->title.'" !', 'Vous pouvez répondre en allant dans l\'espace.', 
            [
                'main' => ['href' => "./?_task=workspace&_action=workspace&_uid=".$wsp->uid,
                            'text' => $this->gettext("mel_workspace.open"),
                            'title' => $this->gettext("mel_workspace.click_for_open"),
                            'command' => "event.click"
                        ]
            ]);
        }

        $datas = [
            'id' => $sid,
            'title' => $title,
            'create_date' => (new DateTime())->getTimestamp(),//date('Y-m-d h:i:s a', time()),
            'link' => $link,
            'creator' => driver_mel::gi()->getUser()->uid
        ];

        if (is_array($survey)) $survey[$sid] = $datas;
        else $survey->$sid = $datas;

        $this->save_object($wsp, self::SURVEY, $survey);
        $wsp->save();

        $tmp = $this;
        echo json_encode(mel_helper::Enumerable($survey)->fusion('can_delete', function ($k, $v) use($tmp, $wsp) {
            return $tmp->can_delete_survey($wsp, $v);
        })->toArray());
        exit;

    }

    public function delete_survey()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $wsp = self::get_workspace($uid); 
        $survey_id = rcube_utils::get_input_value("_sid", rcube_utils::INPUT_POST);
        $survey_list = $this->get_object($wsp, self::SURVEY) ?? [];

        $survey = is_array($survey_list) ? $survey_list[$survey_id] : $survey_list->$survey_id;
        $isset = isset($survey);
        $can = $this->can_delete_survey($wsp, $survey);
        if ($isset && $can) {
            self::notify($wsp, 'Le sondage "'.$survey->title.'" vient d\'être supprimé de l\'espace "'.$wsp->title.'" !', '', null);

            if (is_array($survey_list)) unset($survey_list[$survey_id]);
            else unset($survey_list->$survey_id);
            $this->save_object($wsp, self::SURVEY, $survey_list);
            $wsp->save();

            $tmp = $this;
            echo json_encode(mel_helper::Enumerable($survey_list)->fusion('can_delete', function ($k, $v) use($tmp, $wsp) {
                return $tmp->can_delete_survey($wsp, $v);
            })->toArray());
        }
        else echo 'denied';

        exit;
    }

    public function have_surveys($wsp)
    {
        $obj = $this->get_object($wsp, self::SURVEY);
        return $obj !== null && (is_array($obj) ? count($obj) > 0 :  count(get_object_vars($obj)) > 0); //count(get_object_vars($test)) > 0;
    }

    private function can_delete_survey($wsp, $survey)
    {
        $user_id = driver_mel::gi()->getUser()->uid;

        return $user_id === $survey->creator || self::is_admin($wsp, $user_id);
    }

    private function generate_survey_id($wsp, $survey_list = null)
    {
        if (!isset($survey_list)) $survey_list = $this->get_object($wsp, self::SURVEY) ?? [];

        $id = 0;
        foreach (mel_helper::Enumerable($survey_list)->orderBy(function ($k, $v) {return intval($v->id);}) as $survey) {
            if (strval($survey->id) !== strval($id)) break;
            ++$id;
        }

        return $id;
    }

    public function synchronize_list() {
        $echo = null;
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $wsp = self::get_workspace($uid); 

        if (self::is_admin($wsp)){
            $list = rcube_utils::get_input_value("_list", rcube_utils::INPUT_POST);

            $loaded_list = driver_mel::gi()->getUser(null, true, false, null, $list);
            $list_members = $loaded_list->list->members;
            $all_saved_list_data = $this->get_setting($wsp, 'lists');
            $current_saved_list_data = $all_saved_list_data->$list;
            $shared = $wsp->shares;
    
            $_POST['_users'] = [];
    
            $has_new = false;
            foreach ($list_members as $value) {
                if (!in_array($value->uid, $current_saved_list_data) || !isset($shared[$value->uid]))    
                {
                    $value->load();

                    if (!in_array($value->uid, $current_saved_list_data)) $current_saved_list_data[] = $value->uid;

                    $_POST['_users'][] = $value->email;

                    if(!$has_new) $has_new = true;
                }
            }
    
            if (count($_POST['_users']) > 0) {
                $_POST['_not_exist'] = true;
                $this->add_users();
                unset($_POST['_not_exist']);
            }
    
            $has_deleted = false;
            $valid = [];
            foreach ($current_saved_list_data as $value) {
                if (isset($list_members[$value])) $valid[] = $value;
                else {
                    $this->delete_user($uid, $value, false);

                    if (!$has_deleted) $has_deleted = true;
                }
            }

            if ($has_deleted || $has_new) {
                $all_saved_list_data->$list = $valid;
                $this->add_setting($wsp, 'lists', $all_saved_list_data);
                $wsp->save();
            }

            $echo = 'ok';
        }
        else $echo = 'denied';

        echo $echo;
        exit;

    }

    public function delete_list() {
        $echo = null;
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $wsp = self::get_workspace($uid); 

        if (self::is_admin($wsp)){
            $list = rcube_utils::get_input_value("_list", rcube_utils::INPUT_POST);
            $all_saved_list_data = $this->get_setting($wsp, 'lists');
            $current_saved_list_data = $all_saved_list_data->$list;

            for ($i=0, $len=count($current_saved_list_data); $i < $len; ++$i) { 
                $this->delete_user($uid, $current_saved_list_data[$i], false);
            }

            unset($all_saved_list_data->$list);
            $this->add_setting($wsp, 'lists', $all_saved_list_data);
            $wsp->save();

        }
        else echo 'denied';

        exit;
    }

    public static function notify($workspace, $title, $content, $action = null, $include_current = false)
    {
        $users = $workspace->shares;
        $current_user = driver_mel::gi()->getUser();

        
        try {
            foreach ($users as $user) {
                if (($user->user !== $current_user->uid || $include_current) && driver_mel::gi()->getUser($user->user) !== null)
                {
                    mel_notification::notify("workspace", $title, $content, $action, $user->user);
                }
            }
        } catch (\Throwable $th) {
            //throw $th;
        }
    }

    private function _check_if_is_in_list($wsp, $user_id) {
        $array = [];
        $lists = $this->get_setting($wsp, 'lists') ?? [];

        foreach ($lists as $key => $value) {
            if (in_array($user_id, $value)) $array[] = $key;
        }

        return $array;
    }

    private function _list_to_title($lists) {
        $txt = '';
        foreach ($lists as $key => $value) {
            $value = driver_mel::gi()->getUser(null, true, false, null, $value);
            $txt .= $value->fullname . "\n";
        }

        return $txt;
    }

  private function is_one_admin($workspace)
  {
    if (self::is_admin($workspace) && (self::nb_admin($workspace) < 2)) {
      return true;
    }
    return false;
  }
}