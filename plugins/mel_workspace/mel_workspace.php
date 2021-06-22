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

class mel_workspace extends rcube_plugin
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
    private $folders = ["init", "lib"];

    /**
     * (non-PHPdoc)
     * @see rcube_plugin::init()
     */
    public function init()
    {
        $this->setup();
        $this->include_stylesheet($this->local_skin_path().'/workspaces.css');
        $this->include_script('js/init/classes/WSPNotifications.js');
        if ($this->rc->task === "workspace")
            $this->portal();
    }

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
        $this->register_action('notify_chat', array($this, 'notify_chat'));
        $this->include_script('js/epingle.js');

        // Ajoute le bouton en fonction de la skin
        $this->add_button(array(
            'command' => "workspace",
            'class'	=> 'button-wsp icon-mel-workplace',
            'classsel' => 'button-wsp button-selected icon-mel-workplace',
            'innerclass' => 'button-inner',
            'label'	=> 'my_workspaces',
            'title' => 'my_workspaces',
            'type'       => 'link',
            'domain' => "mel_workspace"
        ), "taskbar");
    }

    function portal()
    {
        $this->include_css();
        $this->include_js();
        $this->register_action('index', array($this, 'index'));
        $this->register_action('action', array($this, 'show_actions'));
        $this->register_action('workspace', array($this, 'show_workspace'));
        $this->register_action('archived', array($this, 'show_workspace_archived'));
        //$this->register_action('list', array($this, 'show_workspace'));
        $this->register_action('PARAM_Change_color', array($this, 'change_color'));
        $this->register_action('PARAMS_add_users', array($this, 'add_users'));
        $this->register_action('PARAMS_update_user_table_rights', array($this, 'update_user_table_rights'));
        $this->register_action('PARAMS_update_user_rights', array($this, 'update_user_rights'));
        $this->register_action('PARAMS_delete_user', array($this, 'delete_user'));
        $this->register_action('PARAMS_update_app', array($this, 'update_app'));
        $this->register_action('PARAMS_update_app_table', array($this, 'update_app_table'));
        $this->register_action('PARAMS_update_toolbar', array($this, 'update_toolbar'));
        $this->register_action('PARAMS_update_services', array($this, 'update_services'));
        $this->register_action('join_user', array($this, 'join_user'));
        $this->register_action('leave_workspace', array($this, 'leave_workspace'));
        $this->register_action('delete_workspace', array($this, 'delete_workspace'));
        $this->register_action('archive_workspace', array($this, 'archive_workspace'));
        //archive_workspace
        //add_users
    }

    public function load_workspaces()
    {
        $this->workspaces = driver_mel::gi()->getUser()->getSharedWorkspaces("modified", false);
        // if (count($this->workspaces) > 0)
        //     uasort($this->workspaces , [$this, "sort_workspaces"]);
        // foreach ($this->workspaces as $key => $value) {
        //     $this->workspaces[$key]->delete();
        // }
        // driver_mel::gi()->getUser()->saveDefaultPreference("categories", null);
        // driver_mel::gi()->getUser()->saveDefaultPreference("category_colors", null);
    }

    public function sort_workspaces($a, $b)
    {
        if ($a->id == $b->id) {
            return 0;
        }
        return ($a->id < $b->id) ? -1 : 1;
    }

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
        $this->rc->output->set_pagetitle("Mes espaces de travail");
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
        $html = "";
        $workspaces = (driver_mel::gi()->workspace())->listPublicsWorkspaces('modified', true, 7, (($page ?? 1) - 1)*7);
        foreach ($workspaces as $key => $value) {
            $html .= $this->create_block($value, false);
        } 
        return $html;
    }

    function show_actions()
    {
        $event = rcube_utils::get_input_value('_event', rcube_utils::INPUT_GPC);
        switch ($event) {
            case 'list_public':
                $this->rc->output->add_handlers(array(
                    'joined'    => array($this, 'show_publics'),
                ));
                $label = function ()
                {
                    return "Liste des espaces de travail public";
                };
                $this->rc->output->add_handlers(array(
                    'label'    => $label,
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
        
        if ($this->services_action_errors($this->currentWorkspace))
        {
            $this->currentWorkspace->save();        
            $this->currentWorkspace->load();
        }

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
            'wsp-desc'    => array($this, 'get_description'),
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
        
        if (self::is_in_workspace($this->currentWorkspace))
            $this->rc->output->set_env("wsp_is_in", "yes");

        $this->rc->output->set_pagetitle("Espace de travail \"".$this->currentWorkspace->title."\"");
        $this->rc->output->send('mel_workspace.workspace');
    }

    function get_picture()
    {
        
        try {
            if ($this->currentWorkspace->logo !== null && $this->currentWorkspace->logo !== "false" && $this->currentWorkspace->logo !== "")
                $html = '<div style="background-color:'.$this->get_setting($this->currentWorkspace,"color").'" class="dwp-round wsp-picture"><img src="'.$this->currentWorkspace->logo.'"></div>';
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
        return html::tag("span", ["class" => "header-wsp"], $this->currentWorkspace->title);
    }

    function get_toolbar()
    {
        $icons = [
            "back" => "icon-mel-undo mel-return",
            "home" => "icon-mel-home
            ",
            "discussion" => "icon-mel-message",
            "mail" => "icon-mel-mail",
            "agenda" => "icon-mel-calendar",
            "documents" => "icon-mel-folder",
            "tasks" => "icon-mel-task",
            "news" => "icofont-rss-feed",
            "params" => "icon-mel-parameters"
        ];

        $vseparate = "<v_separate></v_separate>";

        try {
            $is_admin = self::is_admin($this->currentWorkspace, driver_mel::gi()->getUser()->uid);
            $is_in_wsp = self::is_in_workspace($this->currentWorkspace);
            $services = $this->get_worskpace_services($this->currentWorkspace);
            $uid = $this->currentWorkspace->uid;
            $html = html::tag("button",["onclick" => "ChangeToolbar('back', this)", "class" => " wsp-toolbar-item goback first"], '<span class="'.$icons["back"].'"></span><span class=text-item>'.$this->rc->gettext("back").'</span>');
            $html .= $vseparate;
            $html .= html::tag("button",["onclick" => "ChangeToolbar('home', this)","class" => "wsp-toolbar-item wsp-home active", "disabled" => "disabled", "aria-disabled" => true], "<span class=".$icons["home"]."></span><span class=text-item>".$this->rc->gettext("home", "mel_workspace")."</span>");
            
            if ($is_in_wsp)
            {

                if ($services[self::AGENDA] || $services[self::CHANNEL]
                || $services[self::TASKS] || $is_admin)
                    $html .= $vseparate;
        
                if ($services[self::AGENDA])
                {
                    $onclick = "ChangeToolbar('calendar', this)";
                    $html .= html::tag("button",["onclick" => $onclick, "class" => "wsp-toolbar-item wsp-agenda"], "<span class=".$icons["agenda"]."></span><span class=text-item>".$this->rc->gettext("calendar", "mel_workspace")."</span>");
                    
                    if ($services[self::CHANNEL] || $services[self::TASKS] || $is_admin)
                        $html .= $vseparate;
                }
                
                if ($services[self::CHANNEL])
                {
                    $src = "";
                    $channel_datas = $this->get_object($this->currentWorkspace, self::CHANNEL);
                    $channel_name = $channel_datas->name;
        
                    if ($this->currentWorkspace->ispublic)
                        $src="/channel/$channel_name";
                    else
                        $src="/group/$channel_name";  
        
                    $click = "ChangeToolbar('rocket', this, `$src`)";
        
                    try {
                        if ($channel_datas->name === null)
                            $html .= html::tag("button",["onclick" => $click,"data-isId" => true, "class" => "wsp-toolbar-item wsp-ariane", "id"=>"ariane-".$channel_datas], "<span class=".$icons["discussion"]."></span><span class=text-item>".$this->rc->gettext("rocketchat", "mel_workspace")."</span>");
                        else
                            $html .= html::tag("button",["onclick" => $click,"data-isId" => false, "class" => "wsp-toolbar-item wsp-ariane", "id"=>"ariane-".$channel_datas->name], "<span class=".$icons["discussion"]."></span><span class=text-item>".$this->rc->gettext("rocketchat", "mel_workspace")."</span>");
                    } catch (\Throwable $th) {
                        $html .= html::tag("button",["onclick" => $click,"style"=>"display:none","data-isId" => false, "class" => "wsp-toolbar-item wsp-ariane", "id"=>"ariane-notexist"], "<span class=".$icons["discussion"]."></span><span class=text-item>".$this->rc->gettext("rocketchat", "mel_workspace")."</span>");
                    }
        
                    if ($services[self::TASKS] || $is_admin)
                        $html .= $vseparate;
                }
        
                if ($services[self::TASKS])
                {
                    $html .= html::tag("button",["onclick" => "ChangeToolbar('tasklist', this)" ,"class" => "wsp-toolbar-item wsp-tasks"], "<span class=".$icons["tasks"]."></span><span class=text-item>".$this->rc->gettext("tasks", "mel_workspace")."</span>");
                    
                    if ($is_admin)
                        $html .= $vseparate;
                }
        
                if ($is_admin)
                    $html .= html::tag("button",["onclick" => "ChangeToolbar('params', this)","class" => "wsp-toolbar-item wsp-item-params"], "<span class=".$icons["params"]."></span><span class=text-item>".$this->rc->gettext("params", "mel_workspace")."</span>");
            
            }
        } catch (\Throwable $th) {
            $html = "";
            $this->log_error("get_toolbar", "des éléments de la toolbar de", $th);
        }
        
        return $html;
    }

    function get_description()
    {
        return $this->currentWorkspace->description;
    }

    function get_users_info()
    {
        $icon = "icon-mel-plus plus";
        $icon_quit = "icon-mel-close plus";
        $exists = self::is_in_workspace($this->currentWorkspace);
        $admin = self::is_admin($this->currentWorkspace);
        $html = "";

        if ($exists && $admin)
            $html.= html::tag("button",["style" => "margin-right:15px", "class" => "mel-button invite-button plus", "onclick" => "rcmail.command(`workspace.add_users`)"], html::tag("span", [], "Inviter un membre").html::tag("span", ["class" => $icon]));
        if ($exists)
            $html.= html::tag("button",["class" => "mel-button quit-button plus", "onclick" => "rcmail.command('workspace.leave')"], html::tag("span", [], "Quitter l'espace de travail").html::tag("span", ["class" => $icon_quit]));
        else
            $html.= html::tag("button",["class" => "mel-button quit-button plus", "onclick" => "rcmail.command(`workspace.join`)"], html::tag("span", [], ($this->currentWorkspace->ispublic === 0 ? "Rejoindre" : "Suivre")).html::tag("span", ["class" => $icon])); 
        
        return html::div([], $html);
    }

    const APP = "-wsp-item";
    const CHANNEL = "channel";
    const AGENDA = "calendar";
    const TASKS = "tasks";
    const EMAIL = "unknown1";
    const CLOUD = "doc"; 
    public function get_worskpace_services($workspace, $services_to_remove = false)
    {
        $datas = [
            self::CHANNEL => $this->get_object($workspace, self::CHANNEL) !== null,
            self::AGENDA => $this->get_object($workspace, self::AGENDA) === true,
            self::TASKS => $this->get_object($workspace, self::TASKS) !== null,
            self::EMAIL => false,
            self::CLOUD => false,
        ];
        if ($services_to_remove)
        {
            $services = [];
            foreach ($datas as $key => $value) {
                $services[] = $key;
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

        try {
            if ($services[self::AGENDA] || $services[self::TASKS])
            {
                $col = [
                    "left" => "",
                    "right" => ""
                ];
        
                //Service agenda/calendrier
                if ($services[self::AGENDA])
                {
                    $arrow = [
                        "left" => '<button class="btn-mel-invisible btn-arrow" style="float:right" onclick="change_date(-1)"><span class="'.$icons["arrow_left"].'"></span></button>',
                        "right" => '<button class="btn-mel-invisible btn-arrow" style="float:left" onclick="change_date(1)"><span class="'.$icons["arrow_right"].'"></span></button>'
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
                    $col["right"].= html::tag("h1", [], "Mes réunions");
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
                        html::div(["id" => "wsp-task-classik", "class" => "col-6 tab-task mel-tab mel-tabheader last ".(!$affiche_urgence ? "active" : "")], 
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
                    $col["left"].= html::tag("h1", [], "Mes tâches").$this->block("wsp-block-$tasks", "wsp-block-$tasks wsp-block", $header, $body, "create_tasks(`$uid`, this)", $this->rc->gettext("create_task", "mel_workspace"));
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
                    html::div(["class" => "col-md-6"], $col["left"]).
                    ($col["right"] === "" ? "" : html::div(["class" => "col-md-6"], $col["right"]))
                );
            }
    
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
                        $header_component[] = html::div(["id" => "unreads-emails", "class" => "col-6 tab-unreads mel-tab mel-tabheader ¤¤¤"], "Emails");
                    if ($services[self::CHANNEL])
                        $header_component[] = html::div(["id" => "unreads-ariane", "class" => "col-6 tab-unreads mel-tab mel-tabheader ¤¤¤"], "Discussions Ariane");
                    
                    $tmp = "";
                    $count = count($header_component);

                    for ($i=0; $i < $count; ++$i) { 
                        if ($i === 0)
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
                            ""
                        );

                    if ($services[self::CHANNEL]){
                        $body_component[] = html::tag("button",["title" => $this->rc->gettext("open_ariane", "mel_workspace"),"onclick" => "UpdateFrameAriane()","class" => "mel-focus no-style full-width unreads-ariane tab-unreads mel-tab-content wsp-ariane-header", "style" => "¤¤¤;font-size:x-large;"],
                            html::tag("span", ["style" => "position:relative"], "#$channel_name".html::tag("span", ["class" => "ariane-count notif roundbadge lightgreen"])).
                            html::tag("span", ["class" => $icons["arrow_close"]." arrow", "style" => "float:right"])
                        );
                        $body_component[] = html::div(["class" => "unreads-ariane tab-unreads mel-tab-content", "style" => "¤¤¤"],
                            html::tag("iframe", 
                            ["src" => $src, "style" => "width:100%;height:500px;display:none;"]
                            )
                        );
                    }

                    $tmp = "";
                    $count = count($body_component);

                    for ($i=0; $i < $count; ++$i) { 
                        if ($i === 0)
                            $tmp .= str_replace("¤¤¤", "", $body_component[$i]);
                        else
                            $tmp .= str_replace("¤¤¤", "display:none", $body_component[$i]);
                    }

                    $body_component = $tmp;
                    $body = html::div(["class" => ""],
                        $body_component
                    );
        
                    $html_return.= html::tag("h1", [], "Mes échanges non lus").$header.html::div(["class" => "wsp-block wsp-left"], $body);
                }
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
            $html = $this->setup_params_page();
        } catch (\Throwable $th) {
            $this->log_error("get_pages", "des différentes pages de", $th);
        }

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
        $html = str_replace("<color/>", $this->get_setting($this->currentWorkspace, "color"), $html);
        $html = str_replace("<applications/>", $this->setup_params_apps($this->currentWorkspace), $html);
        if ($user_rights === Share::RIGHT_OWNER)
            $html = str_replace("<button-delete/>", '<button onclick="rcmail.command(`workspace.delete`)" class="btn btn-danger" style="margin-top:5px;margin-bottom:15px">Supprimer l\'espace de travail</button>', $html);
        else
            $html = str_replace("<button-delete/>", '<button onclick="rcmail.command(`workspace.leave`)" class="btn btn-danger" style="margin-top:5px;margin-bottom:15px">Quitter l\'espace de travail</button>', $html);
        if (!$this->currentWorkspace->isarchived) //<button class="btn btn-danger" style="margin-top: 5px;margin-bottom: 15px;margin-left:10px;"onclick="rcmail.command('workspace.archive', '<workspace-uid/>')">Archiver</button>
            $html = str_replace("<button-archive/>", '<button class="btn btn-danger" style="margin-top: 5px;margin-bottom: 15px;margin-left:10px;"onclick="rcmail.command(`workspace.archive`)">Archiver</button>', $html);
        else
            $html = str_replace("<button-archive/>", '<button class="btn btn-success" style="margin-top: 5px;margin-bottom: 15px;margin-left:10px;"onclick="rcmail.command(`workspace.unarchive`)">Désarchiver</button>', $html);
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
        foreach ($services as $key => $value) {
            if ($key === self::EMAIL || $key === self::CLOUD || $key === self::AGENDA)
                continue;
            $info = $this->get_type_config($config, $key);
            $html.= '<tr><td>';
            $html.= '<span class="'.($value ? "text-success" : "text-secondary").' wsp-change-icon '.$info["icon"].'"></span> '.$info["name"];
            if ($value)
            {
                $class = "btn btn-danger";
                $span = $icons["minus"];               
            }
            else {
                $class = "btn btn-success";
                $span = $icons["plus"];    
            }
            $func = "rcmail.command('workspace.update_app','$key')";
            if ($info === null || $key === self::CLOUD)
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

        $icon_delete = "icon-mel-trash";

        $html = '<table id=wsp-user-rights class="table table-striped table-bordered">';
        $html .= "<thead>";
        $html .= '<tr><td>Utilisateur</td><td class="mel-fit-content">Droits d\'accès</td><td class="mel-fit-content">Supprimer</td></tr>';
        $html .= "</thead>";
        $share = $workspace->shares;
        $this->sort_users($share);
        $current_user = driver_mel::gi()->getUser();
        foreach ($share as $key => $value) {
            $html .= "<tr>";
            $html .= "<td>".$value->user."</td>";
            $html .= "<td>".$this->setup_params_value($icons_rights, $value->rights,$value->user)."</td>";
            if ($value->user === $current_user)
                $html += '<td></td>';
            else
                $html .= '<td><button style="float:right" onclick="rcmail.command(`workspace.remove_user`, `'.$value->user.'`)" class="btn btn-danger"><span class='.$icon_delete.'></span></button></td>';
            $html .= "</tr>";
        }
        $html .= "</table>";
        return $html;
    }

    function setup_params_value($icons, $rights, $user)
    {
        $options = json_encode($icons);
        $options = str_replace('"', "¤¤¤", $options);
        $classes = [];
        foreach ($icons as $key => $value) {
            $classes[$key] = $key;
        }
        $classes = str_replace('"', "¤¤¤", json_encode($classes));
        return '<button style="float:right"  type="button" data-rcmail=true data-onchange="rcmail.command(`workspace.update_user`, MEL_ELASTIC_UI.SELECT_VALUE_REPLACE+`:'.$user.'`)" data-options_class="'.$classes.'" data-is_icon="true" data-value="'.$rights.'" data-options="'.$options.'" class="select-button-mel btn-u-r btn btn-primary '.$rights.'"><span class='.$icons["$rights"].'></span></button>';
        // $html = '<select class=" pretty-select" >';
        // foreach ($icons as $key => $value) {
        //     $html .= '<option class=icofont-home value="'.$key.'" '.($key === $rights ? "selected" : "")." ></option>";
        // }
        // $html .= "</select>";
        // return $html;
    }
        /**
     * Récupère le css utile pour ce plugin.
     */
    function include_css()
    {
        // Ajout du css
        $this->include_stylesheet($this->local_skin_path().'/workspaces.css');
    }

    function include_js()
    {
        $count = count($this->folders);
        for ($it=0; $it < $count; ++$it) { 
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
            $this->include_script('js/workspace.js');
            $this->include_script('js/params.js');
        }
    }

    function block($id,$class, $header, $body, $onclick, $title_button)
    {
        $html = $this->rc->output->parse("mel_workspace.block", false, false);
        $html = str_replace("<id/>", $id, $html);
        $html = str_replace("<class/>", $class, $html);
        $html = str_replace("<header/>", $header, $html);
        $html = str_replace("<body/>", $body, $html);
        $html = str_replace("<onclick/>", $onclick, $html);
        $html = str_replace("<title-button/>", $title_button, $html);
        return $html;
    }

    function create()
    {
        //rcube_utils::INPUT_POST custom_uid
        //mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create] Récupération des inputs....");
        $datas = [
            "avatar" => rcube_utils::get_input_value("avatar", rcube_utils::INPUT_POST),
            "title" => rcube_utils::get_input_value("title", rcube_utils::INPUT_POST),
            "uid" => rcube_utils::get_input_value("custom_uid", rcube_utils::INPUT_POST),
            "desc" => rcube_utils::get_input_value("desc", rcube_utils::INPUT_POST),
            "end_date" => rcube_utils::get_input_value("end_date", rcube_utils::INPUT_POST),
            "hashtag" => rcube_utils::get_input_value("hashtag", rcube_utils::INPUT_POST),
            "visibility" => rcube_utils::get_input_value("visibility", rcube_utils::INPUT_POST),
            "users" => rcube_utils::get_input_value("users", rcube_utils::INPUT_POST),
            "services" => rcube_utils::get_input_value("services", rcube_utils::INPUT_POST),
            "color" => rcube_utils::get_input_value("color", rcube_utils::INPUT_POST),
        ];
        //mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create] Inputs ok");
        //mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create] Inputs : ".json_encode($datas));

        $retour = [
            "errored_user" => [],
            "existing_users" => []
        ];

        $user = driver_mel::gi()->getUser();
        $workspace = driver_mel::gi()->workspace([$user]);
        //mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create] Création d'un espace...");
        $workspace->uid = $datas["uid"] === null || $datas["uid"] === "" ? self::generate_uid($datas["title"]) : $datas["uid"];//uniqid(md5(time()), true);
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
        //mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create] Première sauvegarde...");
        $res = $workspace->save();
        //mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create] Premier chargement...");
        $workspace->load();
        //mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create] Ajout des utilisateurs...");
        $shares = [];
        $share = driver_mel::gi()->workspace_share([$workspace]);
        $share->user = $user->uid;
        $share->rights = Share::RIGHT_OWNER;
        $shares[] = $share;

        $count = count($datas["users"]);
        for ($i=0; $i < $count; ++$i) { 
            $tmp_user = driver_mel::gi()->getUser(null, true, false, null, $datas["users"][$i])->uid;
            if ($tmp_user === null)
                $retour["errored_user"][] = $datas["users"][$i];
            else {
                $retour["existing_users"][] = $tmp_user;
                $share = driver_mel::gi()->workspace_share([$workspace]);
                $share->user = $tmp_user;
                $share->rights = Share::RIGHT_WRITE;
                $shares[] = $share;                
            }
        }

        $workspace->shares = $shares;

        //mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create] Création des services...");
        $datas["services"] = $this->create_services($workspace,$datas["services"]);
        //mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create] Sauvegarde...");
        $res = $workspace->save();

        $retour["workspace_uid"] = $workspace->uid;

        $retour["uncreated_services"] = $datas["services"];
        //mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create] Retour...");
        echo json_encode($retour);
        exit;
    }

    function create_services(&$workspace,$services, $users = null, $update_wsp = true)
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

        $services = $this->create_tasklist($workspace,$services, $users, $update_wsp);
        $services = $this->create_agenda($workspace, $services, $users, $update_wsp);
        $services = $this->create_channel($workspace, $services, $users);

        return $services;
    }

    function create_tasklist(&$workspace,$services, $users, $update_wsp)
    {
        $tasks = self::TASKS;
        if (array_search($tasks, $services) === false)
            return $services;
        include_once "../mel_moncompte/ressources/tasks.php";
        $tasklist = $this->get_object($workspace,$tasks);
        if ($tasklist !== null) //Si la liste de tâche existe déjà
        {
            $mel = new M2tasks(null, $tasklist);
            if ($mel != null)
            {
                foreach ($users as $s)
                {
                    $mel->setAcl($s, ["w"]);
                }
            }
        }
        else {//Sinon
            $mel = new M2tasks(driver_mel::gi()->getUser()->uid, $workspace->uid);
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
        unset($services[$key]);
        return $services;
    }

    function create_agenda(&$workspace, $services, $users, $update_wsp)
    {
        $agenda = self::AGENDA;

        // if (array_search($agenda, $services) === false)
        //     return $services;

        include_once "lib/mel_utils.php";
        $color = $this->get_setting($workspace, "color");

        foreach ($users as $s)
            mel_utils::cal_add_category($s, "ws#".$workspace->uid, $color);

        if ($update_wsp)
            $this->save_object($workspace, $agenda, true);//!(array_search($agenda, $services) === false));

        // $key = array_search($agenda, $services);
        // unset($services[$key]);

        return $services;
    }

    function create_channel(&$workspace, $services, $users)
    {
        $service = self::CHANNEL;
        mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create_channel]Services : ".json_encode($service)." => $service");
        mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create_channel]Can enter : ".($this->get_object($workspace,$service) === null && array_search($service, $services) !== false));
        
        if ($this->get_object($workspace,$service) === null && array_search($service, $services) !== false)
        {
            $uid = $this->generate_channel_id_via_uid($workspace->uid);
            $rocket = $this->rc->plugins->get_plugin('rocket_chat');
            $value = $rocket->_create_channel($uid, $users,$workspace->ispublic === 0 ? false : true);
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create_channel]Valeur : ".json_encode($value));

            if (is_string($value["content"]))
            {
                $value = json_decode($value["content"]);
                $value = $value->channel;//$value["content"]["channel"];
                $this->save_object($workspace, self::CHANNEL, ["id" => $value->_id, "name" => $value->name]);
            }
            else {
                $value = $value["content"]["channel"];
                $this->save_object($workspace, self::CHANNEL, ["id" => $value["_id"], "name" => $value["name"]]);
            }

        }
        
        $key = array_search($service, $services);
        unset($services[$key]);
        return $services;
    }

    function create_favorites(&$workspace, $services)
    {

    }

    function get_uid()
    {
        $title = rcube_utils::get_input_value("_title", rcube_utils::INPUT_POST);
        echo self::generate_uid($title);
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

    function get_object(&$workspace, $key)
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
            $workspace = driver_mel::gi()->workspace([driver_mel::gi()->getUser()]);
            $workspace->uid = $uid;
            $workspace->load();
            if ($workspace->settings === null)
            {
                $settings = [];
                $settings["epingle"] = true;
            }
            else {
                $settings = json_decode($workspace->settings);
                if ($settings->epingle === true)
                    $settings->epingle = false;
                else
                    $settings->epingle = true;
            }

            $workspace->settings = json_encode($settings);
            $ret = $workspace->save();
            //driver_mel::gi()->getUser()->cleanWorkspaces();
            echo json_encode(["is_epingle" => json_decode($workspace->settings)->epingle, "success" => true]);
        } catch (\Throwable $th) {
            echo son_encode(["is_epingle" => json_decode($workspace->settings)->epingle, "success" => false]);
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
        $html = "";
        $this->load_workspaces();
        foreach ($this->workspaces as $key => $value) {
            if (!self::is_epingle($value) && $only_epingle)
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
            
            $html .= $this->create_block($value, $only_epingle);
        } 
        return $html;
    }

    function create_block($workspace, $epingle = false)
    {
        $html = $this->rc->output->parse("mel_workspace.wsp_block", false, false);
        $is_epingle = self::is_epingle($workspace);
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

        if ($workspace->logo !== null && $workspace->logo !== false  && $workspace->logo !== "false")
            $html = str_replace("<workspace-image/>", '<div class=dwp-round style=background-color:'.$color.'><img src="'.$workspace->logo.'"></div>', $html);
        else
            $html = str_replace("<workspace-image/>", "<div class=dwp-round style=background-color:$color><span>".substr($workspace->title, 0, 3)."</span></div>", $html);
        
            if (count($workspace->hashtags) > 0 && $workspace->hashtags[0] !== "")
            $html = str_replace("<workspace-#/>", "#".$workspace->hashtags[0], $html);
        else
            $html = str_replace("<workspace-#/>", "", $html);

        $html = str_replace("<workspace-title/>", $workspace->title, $html);
        $html = str_replace("<workspace-avancement/>", "<br/><br/><br/>", $html);

        if ($workspace->shares !== null)
        {
            //"https://ariane.din.developpement-durable.gouv.fr/avatar/$uid"
            $it = 0;
            $html_tmp = "";

            foreach ($workspace->shares as $s)
            {
                if ($it == 2)
                {
                    $html_tmp.='<div class="dwp-circle dwp-user"><span>+'.(count($workspace->shares)-2).'</span></div>';
                    break;
                }
                $html_tmp.= '<div data-user="'.$s->user.'" class="dwp-circle dwp-user"><img src="'.$this->rc->config->get('rocket_chat_url')."avatar/".$s->user.'" /></div>';
                ++$it;
            }

            $html = str_replace("<workspace-users/>", $html_tmp, $html);
        }
        else
            $html = str_replace("<workspace-users/>", "", $html);

        if ($workspace->created === $workspace->modified)
            $html = str_replace("<workspace-misc/>", "Crée par ".$workspace->creator."<br/>Mise à jour : ".$workspace->created, $html);// $html = str_replace("<workspace-misc/>", "Crée par ".$workspace->creator, $html);
        else
        {
            $html = str_replace("<workspace-misc/>", "Crée par ".$workspace->creator."<br/>Mise à jour : ".$workspace->modified, $html);
        }

        $html = str_replace("<workspace-task-danger/>", "<br/>", $html);
        $html = $this->get_tasks($workspace, $html);

        $services = $this->get_worskpace_services($workspace);
        $tmp_html = "";

        foreach ($services as $key => $value) {
            if ($value)
            {
                switch ($key) {
                    case self::CHANNEL:
                        break;
                    
                    default:
                        $tmp_html .= '<div class="wsp-notif-block" style=display:none;><span class='.$key.'><span class="'.$key.'-notif wsp-notif roundbadge lightgreen">0</span><span class="replacedClass"><span></span></div>';
                    break;
                }
            }
        }

        $html = str_replace("<workspace-notifications/>", $tmp_html, $html);

        return $html;
    }


    public function get_tasks($workspace, $html, $replace = "<workspace-task-all/>", &$total = 0)
    {
        $task_id = $this->get_object($workspace, self::TASKS);
        if ($task_id !== null)
        {  
            try {
                $tasks = $this->rc->plugins->get_plugin('tasklist')->__get("driver")->list_tasks(["mask" => 0, "search" => null], $task_id);
                $total = count($tasks);

                if ($total !== 0)
                {
                    $completed = count(array_filter($tasks, function ($task)
                    {
                        return $task["complete"] === 1;
                    }));
                    //$taskslist = $task->get_lists()
                    $div = html::p(["class" => "wsp-tasks-all", "style" => "font-size:smaller;margin-top: -25px;"],
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

    function add_users()
    {
        //get input
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $users = rcube_utils::get_input_value("_users", rcube_utils::INPUT_POST);
        //get users
        $count = count($users);
        $tmp_users = $users;
        $users = [];
        foreach ($tmp_users as $key => $value) {
            $tmp_user = driver_mel::gi()->getUser(null, true, false, null, $value)->uid;
            if ($tmp_user !== null)
                $users[] = $tmp_user;
        }
        if (count($users) === 0)
        {
            echo "no one was found";
            exit;
        }
        else {
            //get workspace
            $workspace = self::get_workspace($uid);
            if (self::is_admin($workspace))
            {
                $this->_add_users($workspace, $users);
                //save
                $workspace->save();
                //end
                echo "";
            }
            else
                echo "denied";
            exit;
        }
    }

    function _add_users(&$workspace, $users)
    {
        //get services
        $services = $this->get_worskpace_services($workspace, true);
        //update share
        $shares = $workspace->shares;
        $count = count($users);
        for ($i=0; $i < $count; ++$i) { 
            $share = driver_mel::gi()->workspace_share([$workspace]);
            $share->user = $users[$i];
            $share->rights = Share::RIGHT_WRITE;
            $shares[] = $share;                              
        }
        $workspace->shares = $shares;
        //update services
        $this->create_services($workspace, $exists, $users, false);
        //update channel
        if (!(array_search(self::CHANNEL, $exists) === false))
        {
            $rocket = $this->rc->plugins->get_plugin('rocket_chat');
            if ($workspace->uid === "apitech-1")
                $rocket->add_users($users, $this->get_object($workspace, self::CHANNEL), $workspace->ispublic === 0 ? true : false);
            else
                $rocket->add_users($users, $this->get_object($workspace, self::CHANNEL)->id, $workspace->ispublic === 0 ? true : false);
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
                    $rocket = $this->rc->plugins->get_plugin('rocket_chat');
                    $rocket->kick_user($this->get_object($workspace, self::CHANNEL)->id, $users, $workspace->ispublic === 0 ? true : false);
                    break;
                case self::TASKS:
                    include_once "../mel_moncompte/ressources/tasks.php";
                    $tasklist = $this->get_object($workspace,self::TASKS);
                    if ($tasklist !== null)
                    {
                        $mel = new M2tasks(null, $tasklist);
                        $tasklist = $mel->getTaskslist();
                        if ($user === $tasklist->owner)
                        {
                            if (self::nb_admin($workspace) > 1)
                            {
                                //$tasklist->owner = self::get_other_admin($workspace, $user);
                                $mel->deleteAcl($user);
                            }
                            else
                            {
                                $mel->deleteTaskslist();
                                $this->save_object($workspace, self::TASKS, null);
                            }
                        }
                        else
                            $mel->deleteAcl($user);
                    }
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
                $workspace->shares[$user]->rights = $new_right;
                $workspace->save();
                $this->get_ariane()->update_owner($user, $this->get_object($workspace, self::CHANNEL)->id, $workspace->ispublic === 0 ? true : false, $new_right === Share::RIGHT_WRITE);
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

    function delete_user($uid = null, $user_to_delete = null, $exit = true)
    {
        if ($uid === null)
            $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        if ($user_to_delete === null)
            $user_to_delete = rcube_utils::get_input_value("_user_to_delete", rcube_utils::INPUT_POST);
        $workspace = self::get_workspace($uid);
        if(self::is_admin($workspace) || $user_to_delete === driver_mel::gi()->getUser()->uid)
        {
            $user_find = false;
            foreach ($workspace->shares as $key => $value) {
                if ($value->user === $user_to_delete)
                {
                    $shares = $workspace->shares;
                    unset($shares[$key]);
                    $workspace->shares = $shares;
                    $user_find = true;
                    $this->delete_services_for_user($workspace, $user_to_delete, $this->get_worskpace_services($workspace, true));
                    break;
                }
            }
            if ($user_find)
                $workspace->save();
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
                $this->delete_user($uid, $value->user, false);
            }
            $workspace->hashtags = [];
            $workspace->save();
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
                    $this->create_services($workspace, [$app]);
                        break;
                }
            }
            else
            {
                switch ($app) {
                    case self::CHANNEL:
                        $rocket = $this->rc->plugins->get_plugin('rocket_chat');
                        $rocket->delete_channel($this->get_object($workspace, self::CHANNEL)->id, $workspace->ispublic === 0 ? true : false);
                        break;
                    case self::AGENDA:
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
            $this->_add_users($workspace, [driver_mel::gi()->getUser()->uid]);
            $workspace->save();
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
                $array[] = driver_mel::gi()->getUser($value->user)->email;
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
        $all_services = $this->get_worskpace_services($workspace);

        switch ($service) {
            case 'all':               
                $value = [
                    self::AGENDA => $this->check_services(self::AGENDA, $workspace),
                    self::CHANNEL => $this->check_services(self::CHANNEL, $workspace),
                    self::TASKS => $this->check_services(self::TASKS, $workspace)
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

            case self::CHANNEL:
                if ($all_services[self::CHANNEL])
                {
                    try {
                        $value = $this->check_channel($this->get_object($workspace, self::CHANNEL)->id);
                        //$this->get_ariane()->check_if_room_exist($this->get_object($workspace, self::CHANNEL)->id);
                    } catch (\Throwable $th) {
                        $value = false;
                    }
                }
                else
                    $value = true;
                break;

            case self::TASKS:
                if ($all_services[self::TASKS])
                {
                    // $mel = new M2tasks(null, $this->get_object($workspace,self::TASKS));
                    // $tasklist = $mel->getTaskslist();
                    
                    // $value = $tasklist !== null;
                    $value = $this->check_tasks($this->get_object($workspace,self::TASKS));
                }
                else
                    $value = true;
                break;

            default:
                break;
        }

        return $value;
    }

    function check_tasks($task_id)
    {
        $mel = new M2tasks(null, $task_id);
        $tasklist = $mel->getTaskslist();
        
        return $tasklist !== null;
    }

    function check_channel($channel_id)
    {
        return $this->get_ariane()->check_if_room_exist($channel_id);
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

    function services_action_errors(&$workspace)
    {
        try {
            $needUpdate = false;
            $services = $this->check_services("all", $workspace);

            foreach ($services as $key => $value) {
                if (!$services[$key])
                {
                    switch ($key) {
                        case self::AGENDA:
                            include_once 'lib/mel_utils.php';
                            mel_utils::cal_add_category(driver_mel::gi()->getUser()->uid, "ws#".$workspace->uid, $this->get_setting($workspace, "color"));
                            $needUpdate = true;
                            break;
        
                        case self::CHANNEL:      
                            $users = array_map($map, $workspace->shares);
                            $tmp_users = [];
        
                            foreach ($users as $key => $value) {
                                $tmp_users[] = $key;
                            }
        
                            $uid = $this->generate_channel_id_via_uid($workspace->uid);
                            $value = $this->get_ariane()->_create_channel($uid, $tmp_users, $workspace->ispublic === 0 ? false : true);
                            
                            if (is_string($value["content"]))
                            {
                                $value = json_decode($value["content"]);
                                $value = $value->channel;//$value["content"]["channel"];
                                $this->save_object($workspace, self::CHANNEL, ["id" => $value->_id, "name" => $value->name]);
                            }
                            else {
                                $value = $value["content"]["channel"];
                                $this->save_object($workspace, self::CHANNEL, ["id" => $value["_id"], "name" => $value["name"]]);
                            }
                            $needUpdate = true;
                            break;
        
                        case self::TASKS:
                            $mel = new M2tasks(driver_mel::gi()->getUser()->uid, $workspace->uid);
        
                            if ($mel->createTaskslist($workspace->title))
                            {
                                foreach ($users as $s)
                                {
                                    $mel->setAcl($s, ["w"]);
                                }
        
                                $taskslist = $mel->getTaskslist();
                                $this->save_object($workspace, self::TASKS, $taskslist->id);
                            }
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

    public static function get_other_admin($workspace, $username = null)
    {
        $me = $username ?? driver_mel::gi()->getUser()->uid;
        foreach ($workspace->shares as $key => $value) {
            if ($key !== $me && self::is_admin($key))
                return $key;
        }
        return null;
    }

    public static function is_in_workspace($workspace, $username = null)
    {
        return $workspace->shares[$username ?? driver_mel::gi()->getUser()->uid] !== null;
    }

    public static function generate_uid($title)
    {
        $max = 35;

        include_once "lib/mel_utils.php";
        $text = mel_utils::replace_determinants(mel_utils::remove_accents(mel_utils::replace_special_char(strtolower($title))), "-");
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
        return $text."-".$it;
    }

    public static function is_epingle($loaded_workspace)
    {
        $settings = json_decode($loaded_workspace->settings);
        if ($settings === null)
            return false;
        if ($settings->epingle === true)
            return true;
        return false;
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
}