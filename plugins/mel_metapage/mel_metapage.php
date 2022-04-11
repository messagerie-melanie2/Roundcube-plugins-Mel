<?php
/**
 * Plugin Mél Métapage
 *
 * Méta Page
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
class mel_metapage extends rcube_plugin
{
    public const FROM_KEY = "_is_from";
    public const FROM_VALUE = "iframe";

    /**
     * Contient l'instance de rcmail
     * @var rcmail
     */
    public $rc;
    /**
     * Contient la task associé au plugin
     * @var string
     */
    public $task = '.*';

    public const SPIED_TASK_DRIVE = "drive";
    public const SPIED_TASK_CHAT = "chat";
    public const SPIED_TASK_KANBAN = "kanban";
    public const SPIED_TASK_SONDAGE = "sondage";
    private static $urls_spies;
    private static $widgets;

    public static function add_url_spied($url, $task)
    {
        if (self::$urls_spies === null) self::$urls_spies = [];

        self::$urls_spies[$url] = $task;
    }

    public static function get_urls_spied()
    {
        if (self::$urls_spies === null) self::$urls_spies = [];

        return self::$urls_spies;
    }

    public static function add_widget($name ,$task, $arg)
    {
        if (self::$widgets === null) self::$widgets = [];

        self::$widgets[$name] = "/_task=$task&_action=mel_widget&_is_from=iframe" . ($arg === null ? '' : "&_arg=$arg");
    }

    public static function get_widgets()
    {
        if (self::$widgets === null) self::$widgets = [];

        return self::$widgets;
    }

    public static function can_add_widget()
    {
        $task = rcmail::get_instance()->task;

        return false && ($task === 'bureau' ||  $task === 'settings');
    }

    function init()
    {
        $this->setup();

        $dir = __DIR__;
        $files = scandir(__DIR__."/program/pages");
        $size = count($files);
        for ($i=0; $i < $size; ++$i) { 
            if (strpos($files[$i], ".php") !== false && $files[$i] !== "page.php" && $files[$i] !== "parsed_page.php")
            {
                include_once "program/pages/".$files[$i];
                $classname = str_replace(".php", "", ucfirst($files[$i]));
                $object = new $classname($this->rc, $this);

                if (method_exists($object, "call"))
                    $object->call();

                if ($this->rc->task === "custom_page")
                    $object->init();

            }
        }

        if ($this->rc->task === "webconf")
        {
            include_once "program/webconf/webconf.php";
            $conf = new Webconf($this->rc, $this);
            $conf->init();
        }
        else if ($this->rc->task === "chat")
            $this->register_action('index', array($this, 'ariane'));


    }

    protected function before_page()
    {
        $this->rc->output->include_script('list.js');
    }

    function setup()
    {
        // Récupération de l'instance de rcmail
        $this->rc = rcmail::get_instance();
        $this->add_texts('localization/', true);
        $this->load_config();
 
        if ($this->rc->config->get('maintenance', false) && ($this->rc->action === 'index' || $this->rc->action === '') && rcube_utils::get_input_value('_is_from', rcube_utils::INPUT_GPC)  !== 'iframe' && $this->rc->task !== "login")
        {
            $haveMaintenance = rcube_utils::get_input_value('_maintenance', rcube_utils::INPUT_GPC);

            if ($haveMaintenance === null)
            {
                $this->rc->output->redirect([
                    '_task' => $this->rc->task,
                    '_action' => $this->rc->action,
                    '_maintenance' => 'true'
                ]);
                return;
            }
            else if ($haveMaintenance === 'true')
            {
                $this->add_hook("send_page", array($this, "maintenance"));
                return;
            }
        }

        $this->add_hook('preferences_list', array($this, 'prefs_list'));
        $this->add_hook('preferences_save',     array($this, 'prefs_save'));
        $this->add_hook("send_page", array($this, "appendTo"));
        $this->add_hook("message_send_error", [$this, 'message_send_error']);

        if ($this->rc->task === "mail" && $this->rc->action === "compose")
        {
            $this->include_edited_editor();
            $this->include_script('js/init/classes.js');
            $this->include_script('js/init/constants.js');
        }

        if ($this->rc->task === "portail")
        {
            $this->rc->output->redirect([
                '_task' => 'bureau',
            ]);
            return;
        }

        $this->rc->output->set_env("plugin.mel_metapage", true);//compose_extwin
        //$this->rc->output->set_env("compose_extwin", true);
        $this->rc->output->set_env("mel_metapage_chat_visible", $this->rc->config->get("mel_metapage_chat_visible", true));
        $this->rc->output->set_env("mel_metapage_weather_enabled", $this->rc->config->get("enable_weather", false));

        $icon = "mel-icon-size";
        $folder_space = "mel-folder-space";
        $message_space = "mel-message-space";
        $mel_column = "mel-3-columns";
        $chat_placement = "mel-chat-placement";
  
        // Check that configuration is not disabled
        $config = $this->rc->config->get('mel_mail_configuration', [
            $icon => $this->gettext("normal", "mel_metapage"),
            $folder_space => $this->gettext("normal", "mel_metapage"),
            $message_space => $this->gettext("normal", "mel_metapage"),
            $mel_column => $this->gettext("yes", "mel_metapage"),
            $chat_placement => $this->gettext("down", "mel_metapage")
        ]);

        $this->rc->output->set_env("mel_metapage_mail_configs", $config);

        $calendar_space = "mel-calendar-space";

        $config = $this->rc->config->get('mel_calendar_configuration', [
            $calendar_space => $this->gettext("normal", "mel_metapage"),
        ]);
        $this->rc->output->set_env("mel_metapage_calendar_configs", $config);

        $this->rc->output->set_env('mel_metapage_const', [
            "key" => self::FROM_KEY,
            "value" => self::FROM_VALUE    
        ]);

        if (rcube_utils::get_input_value('_accept_back', rcube_utils::INPUT_GET) === "true" || rcube_utils::get_input_value('_accept_back', rcube_utils::INPUT_GET) === true)
            $this->rc->output->set_env("accept_back", true);

        if ($this->rc->task !== "login" && $this->rc->task !== "logout")
            $this->include_script('js/actions/calendar_event.js');

        if ($this->rc->task === "mail" && $this->rc->action === "compose")
        {
            $this->rc->output->set_env("compose_option", rcube_utils::get_input_value('_option', rcube_utils::INPUT_GET));
        }

        self::add_url_spied($this->rc->config->get("web_conf"), 'webconf');

        if (rcube_utils::get_input_value('_framed', rcube_utils::INPUT_GET) === "1"
        || rcube_utils::get_input_value('_extwin', rcube_utils::INPUT_GET) === "1")
        {
            $this->include_stylesheet($this->local_skin_path().'/modal.css');
            $this->include_script('js/init/events.js');
            $this->include_script('js/init/classes/addons/array.js');
            $this->add_hook("startup", array($this, "send_spied_urls"));
            return;
        }

        if ($this->rc->task !== "login" && $this->rc->task !== "logout")
            $this->startup();
        else
        {
            $this->include_script('js/init/classes.js');
            $this->include_script('js/init/constants.js');
        }

        $this->require_plugin('mel_helper');
        //m2_get_account
        $this->add_hook("m2_get_account", array($this, "m2_gestion_cache"));
        
        if ($this->rc->task !== "login" && $this->rc->task !== "logout" && $this->rc->config->get('skin') == 'mel_elastic' && $this->rc->action !=="create_document_template" && $this->rc->action !== "get_event_html" && empty($_REQUEST['_extwin']))
        {

            $this->rc->output->set_env("plugin.mel_metapage", true);
            $this->rc->output->set_env("username", $this->rc->user->get_username());
            //$this->include_depedencies();

            $this->mm_include_plugin();
            $this->rc->get_storage();
            if ($this->rc->task === "webconf")
                $this->register_task("webconf");
            else if ($this->rc->task === "chat")
                $this->register_task("chat");
            else if ($this->rc->task === "questionswebconf")
            {
                $this->register_task("questionswebconf");
                $this->register_action('index', array($this, 'redirectToWebconf'));
                $this->register_action('loading', array($this, 'loadingFrame'));
            }
            else if ($this->rc->task === "questionswebconf")
                $this->register_task("questionswebconf");
            else if ($this->rc->task === "custom_page")
                $this->register_task("custom_page");
            else
                $this->register_task("mel_metapage");               

            if ($this->rc->action === "chat" || $this->rc->task === "chat")
            {
                $this->include_script('js/actions/ariane.js');
                $this->register_action('logout', array($this, 'chat_logout'));
            }

            if ($this->rc->task === "calendar")
            {
                $this->rc->output->set_env("calendar_custom_dialog", true);
            }

            if (class_exists('mel_nextcloud'))
            {
                //$this->rc->plugins->get_plugin('mel_helper')->include_js_debug();
                $this->rc->output->set_env("is_stockage_active", mel_helper::stockage_active());
                $this->rc->output->set_env("why_is_not_active", [
                    "consts" => [
                        "ST_NO_DOUBLE_AUTH" => mel_helper::ST_NO_DOUBLE_AUTH,
                        "ST_NO_RIGHTS" => mel_helper::ST_NO_RIGHTS,
                        "ST_ACTIVE" => mel_helper::ST_ACTIVE
                    ],
                    "value" => mel_helper::why_stockage_not_active()
                ]);
            }
            
            $this->register_action('search_mail', array($this, 'search_mail'));
            $this->register_action('get_unread_mail_count', array($this, 'get_unread_mail_count'));
            $this->register_action('get_wsp_unread_mails_count', [$this, 'get_wsp_unread_mails_count']);
            $this->register_action('search_contact', array($this, 'search_contact'));
            $this->register_action('contact', array($this, 'display_contact'));
            $this->register_action('chat', array($this, 'ariane'));
            $this->register_action('dialog-ui', array($this, 'create_calendar_event'));
            $this->register_action('create_document_template', array($this, 'get_create_document_template'));
            $this->register_action('get_event_html', array($this, 'get_event_html'));
            $this->register_action('get_create_workspace', array($this, 'create_workspace_html'));
            $this->register_action('check_users', array($this, 'check_users'));
            $this->register_action('weather', array($this, 'weather'));
            $this->register_action('modal', array($this, 'get_modal'));
            $this->register_action('check_maintenance', array($this, 'check_maintenance'));
            $this->register_action('toggleChat', array($this, 'toggleChat'));
            $this->add_hook('refresh', array($this, 'refresh'));
            $this->add_hook("startup", array($this, "send_spied_urls"));
            if ($this->rc->task === 'settings' && rcube_utils::get_input_value('_open_section', rcube_utils::INPUT_GET) !== null) $this->add_hook('ready', array($this, 'open_section'));
            $this->rc->output->set_env("webconf.base_url", $this->rc->config->get("web_conf"));

            if (rcube_utils::get_input_value(self::FROM_KEY, rcube_utils::INPUT_GET) !== self::FROM_VALUE)
            {
                $this->include_script('js/actions/startup.js');
                // $this->rc->output->add_handlers(array(
                //     'searchform'          => array($this->rc->output, 'search_form'),
                //     "addressbooks" => [$this, 'override_rcmail_addressbook_list'],
                //     "addresslist" => [$this, 'override_rcmail_contacts_list']
                // ));
                // $this->rc->output->add_gui_object('contactslist', "contacts-table");
                // $this->rc->output->add_gui_object('addressbookslist', "directorylist");

                // $this->rc->output->include_script('list.js');
            }
            else
            {
                $this->rc->output->set_env("melframed", true);
                try {
                    $this->rc->output->set_env("mmp_modal",$this->rc->output->parse("mel_metapage.mel_modal", false, false));
                } catch (\Throwable $th) {
                    //throw $th;
                }
            }
            
            $this->add_hook("send_page", array($this, "generate_html"));//$this->rc->output->add_header($this->rc->output->parse("mel_metapage.barup", false, false));
        }
        else if ($this->rc->task == 'logout' 
                || $this->rc->task == 'login') {
            // Include javascript files
            $this->include_script('js/actions/logout.js');
            $this->include_script('js/actions/login.js');

            $tmp_maint_text = $this->get_maintenance_text();
            if ($tmp_maint_text !== '') $this->rc->output->set_env("maintenance_text", $tmp_maint_text);
        }
        else if ($this->rc->action === "create_document_template")
        {
            $this->add_texts('localization/', true);
            $this->load_config();
            $this->register_task("mel_metapage");
            $this->register_action('create_document_template', array($this, 'get_create_document_template'));
        }
        else if ($this->rc->action === "get_event_html")
        {
            $this->add_texts('localization/', true);
            $this->load_config();
            $this->register_task("mel_metapage");
            $this->register_action('get_event_html', array($this, 'get_event_html'));
        }
        else if ($this->rc->action === "get_create_workspace")
        {
            $this->add_texts('localization/', true);
            $this->load_config();
            $this->register_task("mel_metapage");
            $this->register_action('get_create_workspace', array($this, 'create_workspace_html'));
        }

        if ($this->rc->task === "calendar" || ($this->rc->task === "mel_metapage" && $this->rc->action === "dialog-ui"))
        {
            $this->add_hook("send_page", array($this, "parasite_calendar"));
        }
    }

    /**
     * Fonction js appelé au refresh de roundcube.
     */
    function refresh()
    {
        $this->rc->output->command('mel_metapage_fn.refresh');
    }

    /**
     * Action à faire avant tout. 
     */
    function startup()
    {
        $this->include_script('js/init/rcmail_updater.js');
        $this->get__init_js_from_folder("updates");
        $this->get__init_js_from_folder("classes");
        $this->include_script('js/init/classes.js');
        $this->include_script('js/init/constants.js');
        $this->include_script('js/init/events.js');
        $this->include_script('js/init/commands.js');
        $this->load_config_js();
    }

    function get__init_js_from_folder($folder)
    {
        $files = scandir(__DIR__."/js/init/$folder");
        $size = count($files);
        for ($i=0; $i < $size; ++$i) {
            if (strpos($files[$i], ".min.js") !== false)
                continue;
            else if (strpos($files[$i], ".js") !== false)
                $this->include_script("js/init/$folder/".$files[$i]);
            else if ($files[$i] === "." || $files[$i] === ".." || strpos($files[$i], ".") !== false)
                continue;
            else {
                $folderFiles = scandir(__DIR__."/js/init/$folder/".$files[$i]);
                $folderSize = count($folderFiles);
                for ($j=0; $j < $folderSize; ++$j) { 
                    if(strpos($folderFiles[$j], ".js") !== false && strpos($folderFiles[$j], ".min.js") === false)
                        $this->include_script("js/init/$folder/".$files[$i]."/".$folderFiles[$j]);
                }
            }
        }
    }

    public function send_spied_urls()
    {
        $this->rc->output->set_env("urls_spies", self::get_urls_spied());
    }

    public function m2_gestion_cache()
    {
        if ($this->rc->task === "mail" && rcube_utils::get_input_value('_nocache', rcube_utils::INPUT_GPC) == "true")
        {
            mel_helper::clear_folders_cache($this->rc);
        }
    }

    public function include_edited_editor()
    {
        $this->include_script('js/actions/editor-dark-mode.js');
        return $this;
    }

    function mm_include_plugin()
    {
        $this->add_button(array(
            'command' => 'last_frame',
            'href' => '?_task=last_frame',
            'class'	=> 'disabled icon-mel-last-frame menu-last-frame',
            'classsel' => 'icon-mel-last-frame menu-last-frame menu-last-frame-selected',
            'innerclass' => 'inner',
            'label'	=> 'mel_metapage.last_frame_opened',
            'title' => 'Retour à la page précédente',
            'type'       => 'link',
        ), "taskbar");

        $this->add_button(array(
            'command' => 'more_options',
            'href' => '',
            'class'	=> 'icon-mel-dots more-options',
            'classsel' => 'icon-mel-dots more-options',
            'innerclass' => 'inner',
            'label'	=> 'mel_metapage.my_apps',
            'title' => 'Toutes mes applications',
            'type'       => 'link',
        ), "taskbar");

        $this->add_button(array(
            'command' => "new-mail-from",
            // 'href' => './?_task=mail&_action=compose',
            'class'	=> 'compose mel-new-compose options rcm-active',
            'classsel' => 'compose mel-new-compose options rcm-active',
            'innerclass' => 'inner',
            'label'	=> 'mel_metapage.new-mail-from',
            'title' => '',
            'type'       => 'link-menuitem',
        ), "messagemenu");

        $this->add_button(array(
            'command' => "mel-compose",
            'href' => './?_task=mail&_action=compose',
            'class'	=> 'compose options',
            'classsel' => 'compose options',
            'innerclass' => 'inner',
            'label'	=> 'compose',
            'title' => '',
            'type'       => 'link',
        ), "listcontrols");

        $this->add_button(array(
            'command' => "event-compose",
            // 'href' => './?_task=mail&_action=compose',
            'class'	=> 'compose mel-event-compose options',
            'classsel' => 'compose mel-event-compose options',
            'innerclass' => 'inner',
            'label'	=> 'mel_metapage.event-compose',
            'title' => '',
            'type'       => 'link-menuitem',
        ), "events-options-containers");

        $this->add_button(array(
            'command' => "event-self-invitation",
            // 'href' => './?_task=mail&_action=compose',
            'class'	=> 'export mel-event-self-invitation options',
            'classsel' => 'export mel-event-self-invitation options',
            'innerclass' => 'inner',
            'label'	=> 'mel_metapage.event-self-invitation',
            'title' => '',
            'type'       => 'link-menuitem',
        ), "events-options-containers");

        $this->add_button(array(
            'command' => "event-self-copy",
            // 'href' => './?_task=mail&_action=compose',
            'class'	=> 'copy mel-event-copy options',
            'classsel' => 'copy mel-event-copy options',
            'innerclass' => 'inner',
            'label'	=> 'mel_metapage.copy_w_p',
            'title' => '',
            'type'       => 'link-menuitem',
        ), "events-options-containers");

        $this->add_button(array(
            'command' => "mail-force-refresh",
            // 'href' => './?_task=mail&_action=compose',
            'class'	=> 'refresh mel-event-compose options',
            'classsel' => 'refresh mel-event-compose options',
            'innerclass' => 'inner',
            'label'	=> 'mel_metapage.force-refresh',
            'title' => '',
            'type'       => 'link-menuitem',
        ), "mailboxoptions");

        //listcontrols
        $this->include_depedencies();
        $this->include_css();
        $this->include_js();
        $this->setup_env_js_vars();
    }

    function check_maintenance()
    {
        echo $this->rc->config->get('maintenance', false);
        exit;
    }

    /**
     * Html du plugin.
     */
    function generate_html($args)
    {
        if (strpos($args["content"],'<html lang="fr" class="iframe') !== false)
        {
            $args["content"] = $this->from_iframe($args["content"]);
            return $args;
        }
        if (strpos($args["content"],'<body class="iframe') !== false || strpos($args["content"],'<framed_item>') !== false)
        {
            $args["content"] = $this->from_iframe($args["content"]);
            return $args;
        }
        if (rcube_utils::get_input_value(self::FROM_KEY, rcube_utils::INPUT_GET) === self::FROM_VALUE)
        {
            $args["content"] = $this->from_iframe($args["content"]);
            $args["content"] = $this->add_html($args["content"]);
        }
        else {
            $tmp = explode('<div id="layout">', $args["content"]);
            // $args["content"] = '';
            $args["content"] = $tmp[0].$this->rc->output->parse("mel_metapage.mel_modal", false, false).'<div id="layout"><header role="banner">'.$this->rc->output->parse("mel_metapage.barup", false, false).$tmp[1];
            // $tmp = explode("</header>", $args["content"]);
            // $args["content"] = $tmp[0].'</header><main role="main">'.$tmp[1];
            // $tmp = explode("</body>", $args["content"]);
            // $args["content"] = $tmp[0].'</main></body>'.$tmp[1];

            if (strpos($args["content"],'<user/>') !== false)
                $args["content"] = str_replace("<user/>", $this->rc->output->parse("mel_metapage.user", false, false), $args["content"]);

            $args["content"] = $this->add_html($args["content"]);
        }
        return $args;
    }

    function appendTo($args)
    {
        if (strpos($args["content"], '<div id="layout">') === false)
            return $args;

        $tmp = explode('<div id="layout">', $args["content"]);
        $args["content"] = $tmp[0].'<div id="layout">'.$this->rc->output->parse("mel_metapage.custom_options", false, false).$tmp[1];
        return $args;
    }

    function maintenance($args)
    {
        $args["content"] =$this->rc->output->parse("mel_metapage.maintenance", false, false);
        return $args;
    }


    function parasite_calendar($args)
    {
        $content = $args["content"];
        $pos = strpos($content,'<div id="eventedit"');
        if ($pos !== false)
        {
            include_once "../calendar/calendar_ui.php";
            $size = strlen($content);
            $textToReplace = "";
            $final_start = false;
            $tmp = "";
            $final_div = 0;
            for ($i=$pos; $i < $size; ++$i) { 
                if ($final_div >= 2)
                    break;
                $textToReplace.=$content[$i];
                if (!$final_start && strpos($textToReplace,'<div id="edit-localchanges-warning"') !== false)
                {
                    $final_start = true;
                }
                if ($final_start)
                {
                    $tmp.=$content[$i];
                    if (strpos($tmp,'</div>') !== false)
                    {
                        $tmp = "";
                        ++$final_div;
                    }
                }
            }
            if ($textToReplace !== "")
            {
                $ui = new calendar_ui($this);
                $ui->init_templates();
                $w = function ()
                {
                    $wsp = $this->rc->plugins->get_plugin("mel_workspace");
                    $wsp->load_workspaces();
                    $workpaces = $wsp->workspaces;
                    $html = '<select id=wsp-event-all-cal-mm class="form-control input-mel">';
                    $html .= "<option value=\"#none\">Aucun</option>";
                    foreach ($workpaces as $key => $value) {
                        $html .= '<option value="'.$value->uid.'">'.$value->title.'</option>';
                    }
                    $html .= "</select>";
                    return $html;
                };
                $categories = function()
                {
                    $values = driver_mel::gi()->getUser($username)->getDefaultPreference("categories");
                    $values = (isset($values) ? explode("|" ,$values) : []);

                    $html = '<select id=categories-event-all-cal-mm class="form-control input-mel">';
                    $html .= "<option value=\"#none\">".$this->rc->gettext("nothing", "mel_metapage")."</option>";
                    foreach ($values as $key => $value) {
                        if ($value[0] === "w" && $value[1] === "s" && $value[2] === "#")
                            continue;
                        $html .= '<option value="'.$value.'">'.$value.'</option>';
                    }
                    $html .= "</select>";
                    return $html;
                };
                $this->rc->output->add_handlers(array(
                    'event-wsp'    => $w,
                    'categories-wsp'    => $categories,
                ));
                $args["content"] = str_replace($textToReplace, $this->rc->output->parse("mel_metapage.event_modal", false, false), $content);
                
                // $textes = [
                //     'roleorganizer',
                //     'rolerequired',
                //     'roleoptional',
                //     'rolechair',
                //     'rolenonparticipant'
                // ];
                // foreach ($textes as $key => $value) {
                //     $args["content"] = str_replace("calendar.$value", $this->gettext($value), $args["content"]);
                // }

            
            }
//<div id="edit-localchanges-warning"
        }
        return $args;
    }

    /**
     * Ajoute le html à la page.
     */
    function add_html($content){
        if (strpos($content, "<adressbook-options/>") !== false)
        {
            $content = str_replace('<adressbook-options/>', "", $content);
            $var = '<ul id="directorylist"';
            $tmp = explode($var, $content);
            $size = strlen($tmp[1]);
            $index = -1;
            $text = "";
            for ($i=0; $i < $size; ++$i) { 
                if (strpos($text, "</ul></div>") !== false)
                {
                    $index = $i-6;
                    unset($text);
                    break;
                }
                if ($tmp[1][$i] == ' ' || $tmp[1][$i] == PHP_EOL || $tmp[1][$i] == "\t")
                    continue;
                $text .= $tmp[1][$i];
            }
            $temp = substr_replace($tmp[1], $this->rc->output->parse("mel_metapage.contact_option", false, false), $index, 0);
            $temp = str_replace('[|¤¤¤|]', $this->gettext("contacts_organization"), $temp);
            $temp = str_replace('<adressbook-options/>', "", $temp);
            return $tmp[0].$var.$temp;
        }
        else
            return $content;
    }

    /**
     * Retire le menu si la page vient d'un iframe.
     */
    function from_iframe($contents)
    {
        return str_replace('<div id="layout-menu"', '<div id="layout-menu" data-edited=true style="display:none;"', $contents);
    }

    function loadingFrame()
    {
        $this->rc->output->set_pagetitle("Chargement...");
        $this->rc->output->send("mel_metapage.loading");
    }

    function redirectToWebconf()
    {
        $this->rc->output->redirect(["task" => "webconf"]);
    }

    /**
     * Affiche un contact.
     */
    function display_contact()
    {   
        $id = rcube_utils::get_input_value('_cid', rcube_utils::INPUT_GET);
        $source = rcube_utils::get_input_value('_source', rcube_utils::INPUT_GET);
        $url = "?_task=addressbook&_framed=1&_cid=".$id."&_action=show&_source=".$source;
        $this->rc->output->set_env("contact_url", $url);
        $this->include_script('js/actions/set_iframe_contact.js');
        $this->rc->output->send("mel_metapage.contact");
    }

    function check_users()
    {
        $users = rcube_utils::get_input_value("_users", rcube_utils::INPUT_POST);
        $unexisting_users = [];
        $added_users = [];
        foreach ($users as $key => $value) {
            $tmp = driver_mel::gi()->getUser(null, true, false, null, $value);
            if ($tmp->uid === null)
                $unexisting_users[] = $value;
            else{
                $added_users[] = [
                    "name" => $tmp->name,
                    "uid" => $tmp->uid,
                    "email" => $value
                ];
            }
        }
        echo json_encode(["unexist" => $unexisting_users, "added" => $added_users]);
        exit;
        //driver_mel::gi()->getUser(null, true, false, null, $datas["users"][$i])->uid
    }

    function ariane()
    {
        
        $chat_action = rcube_utils::get_input_value('_params', rcube_utils::INPUT_GET);

        if ($chat_action !== null)
            $this->rc->output->set_env('chat_go_action', $chat_action);

        $this->rc->output->send("mel_metapage.ariane");
    }

    function create_workspace_html()
    {
        echo $this->rc->output->parse("mel_metapage.create_workspace", false, false);
        exit;
    }

    /**
     * Récupère le css utile pour ce plugin.
     */
    function include_css()
    {
        // Ajout du css
        $this->include_stylesheet($this->local_skin_path().'/barup.css');
        $this->include_stylesheet($this->local_skin_path().'/modal.css');
        $this->include_stylesheet($this->local_skin_path().'/global.css');
        $this->include_stylesheet($this->local_skin_path().'/user.css');
    }

    function load_config_js()
    {

        //$this->include_script('js/search.js');
        $files = scandir(__DIR__."/js/configs");
        $size = count($files);
        for ($i=0; $i < $size; ++$i) { 
            if (strpos($files[$i], ".js") !== false)
            $this->include_script('js/configs/'.$files[$i]);
        }        
    }

    /**
     * Récupère le js utile pour ce plugin.
     */
    function include_js()
    {
        //$this->include_script('js/search.js');
        $files = scandir(__DIR__."/js");
        $size = count($files);
        for ($i=0; $i < $size; ++$i) { 
            if (strpos($files[$i], ".js") !== false)
            $this->include_script('js/'.$files[$i]);
        }
        //if ($this->rc->task === "calendar" || ($this->rc->task === "mel_metapage" && $this->rc->action === "dialog-ui"))

        if ($this->rc->task === "tasks")
            $this->include_script('js/actions/task_event.js');
        else if ($this->rc->task === "mail")
            $this->include_script('js/actions/mail_search.js');
        else if ($this->rc->task === "addressbook")
            $this->include_script('js/actions/contacts_search.js');
        //$this->rc->output->include_script('treelist.js');
    }

    /**
     * Récupère les dépendances utile pour ce plugin.
     */
    function include_depedencies()
    {
        //$this->include_script('../calendar/calendar_ui.js');
    }

    /**
     * Met en place les variables pour le js.
     */
    function setup_env_js_vars()
    {
        include_once "program/search/search.php";
        include_once "program/search/search_config.php";
        $tmp = [];
        $it = 0;
        foreach ($this->rc->config->get("search") as $key => $value) {
            $tmp[$it++] = (new SearchConfig($value))->get()->url();//$value->url();
        }
        $this->rc->output->set_env('mm_search_config', $tmp);
        $this->rc->output->set_env('mel_metapage_ariane_button_config', $this->rc->config->get("pop_up_ariane"));
        $this->rc->output->set_env('REPLACED_SEARCH', ASearch::REPLACED_SEARCH);
        $this->rc->output->set_env('mel_metapage_templates_doc', $this->rc->config->get('documents_types'));
        $this->rc->output->set_env('mel_metapage_templates_services', $this->rc->config->get('workspace_services'));

        $icons_files = scandir(__DIR__."/skins/elastic/pictures/dwp_icons");
        if ($icons_files !== false)
        {
            $icons= [];
            foreach ($icons_files as $key => $value) {
                if ($value === "." || $value === "..")
                    continue;
                $icons[] = ["name" => $value, "path" => "plugins/mel_metapage/skins/elastic/pictures/dwp_icons/".$value];
            }
            $this->rc->output->set_env('mel_metapage_workspace_logos', $icons);
        }
        foreach ($this->rc->user->list_emails() as $identity) {
            $emails[] = strtolower($identity['email']);
        }

        $this->rc->output->set_env('mel_metapage_user_emails', $emails);

        if ($this->rc->task === "mail")
            $this->rc->output->set_env('mailboxes_display', $this->rc->config->get('mailboxes_display', 'default'));
        

        //$this->rc->output->set_env('currentTask', $this->rc->task);
    }

    /**
     * Récupère le nombre de mails non lu.
     */
    public function get_unread_mail_count()
    {
        // $msgs = $this->rc->storage->list_messages();
        // $size = count($msgs);
        // $retour = 0;
        // for ($i=0; $i < $size; ++$i) { 
        //     if (/*count($msgs[$i]) == 0 || */$msgs[$i]->flags["SEEN"] === null || !$msgs[$i]->flags["SEEN"] )
        //         ++$retour;
        // }
        $value;
        $mbox_name = 'INBOX';

        $value = $this->rc->storage->count($mbox_name, 'UNSEEN', true);
        if (!is_array($_SESSION['unseen_count'])) {
            $_SESSION['unseen_count'] = array();
        }
    
        $_SESSION['unseen_count'][$mbox_name] = $count;
    

        echo $value;
        exit;
    }

    public function get_wsp_unread_mails_count()
    {
        $wsp = $this->rc->plugins->get_plugin("mel_workspace");
        $wsp->load_workspaces();
        $workpaces = $wsp->workspaces;

        $datas = [];

        $msgs = $this->rc->storage->list_messages();
        $msize = count($msgs);

        $search = "ALL UNSEEN ";
        $or = "";
        $lines = "";

        $first = true;
        $annuaire_exists = false;
        //$annuaires = [];
        foreach ($workpaces as $key => $value) {

            try {
                $mail = mel_workspace::get_wsp_mail($value->uid);

                $annuaire_exists = $wsp->get_object($value, mel_workspace::GROUP);
                //$annuaires[$value->uid] = $annuaire_exists;
                if ($annuaire_exists)
                {
                    if ($mail === null) continue;
                    
                    $lines .= "OR OR HEADER TO $mail HEADER CC $mail HEADER BCC $mail ";// HEADER BCC $before".$value->uid."$after ";
                    if ($first)
                        $first = false;
                    else
                        $or .= "OR ";
                }
            } catch (\Throwable $th) {
                //$annuaires[$value->uid] = $th->getMessage();
            }
        }

        $search .= $or.$lines;

        $input = rcube_utils::get_input_value('_q', rcube_utils::INPUT_GET);
        if ($input !== null && $input !== "")
            $search = $input;

        if ($search !== "ALL UNSEEN ")
        {

            $tmp = $this->rc->storage->search(null, $search, RCUBE_CHARSET, "arrival")->get();

            foreach ($tmp as $key => $value) {
            $result = $this->mail_where($value, $msgs, $msize);

            if ($result !== false)
            {
                $result = $msgs[$result];
                    $edts = $this->get_wsp_uids_by_to($result->to);

                    foreach ($edts as $index => $uid) {
                        if ($datas[$uid] === null)
                            $datas[$uid] = [];
                        
                        $datas[$uid][] = [
                            "from" => rcube_mime::decode_header($result->from, $result->charset),
                            "subject" => rcube_mime::decode_header($result->subject, $result->charset),
                            "date" => date("d/m/Y H:i:s", strtotime($result->date)),
                            "uid" => $result->uid
                        ];
                    }
            }
            }
        }

    echo json_encode(["datas" => $datas, "search" => $search, "get" => $tmp/*, "annuaires" => $annuaires*/]);
        exit;
    }

    function get_wsp_uids_by_to($to)
    {
        $to = explode(",", $to);

        $wsps = [];

        foreach ($to as $index => $mail) {
            if (strpos($mail, "edt.") !== false)
            {
                $espace = explode("@i-carre.net",explode("edt.", $mail)[1])[0];
                $wsps[] = $espace;
            }
        }

        return $wsps;


    } 

    /**
     * Recherche un texte dans les mails.
     */
    public function search_mail($input = null)
    {
        $called = !isset($input);
        include_once "program/search_result/search_result_mail.php";
        $input = $input ?? rcube_utils::get_input_value('_q', rcube_utils::INPUT_GET);
        $msgs = $this->rc->storage->list_messages();
        $tmp = $this->rc->storage->search(null, "OR HEADER FROM ".$input." HEADER SUBJECT ".$input, RCUBE_CHARSET, "arrival");
        $array = $tmp->get();
        $size = count($array);
        $index = null;
        $retour = [];
        $it = 0;
        for ($i=$size; $i >= 0; --$i) { 
            $index = $this->mail_where($array[$i], $msgs);
            if ($index !== false)
                $retour[$it++] = $msgs[$index];
            if (count($retour) >= 5)
                break;
        }

        $datas = SearchResultMail::create_from_array($retour)->get_array($this->gettext("mails"));
        if ($called)
        {
            echo rcube_output::json_serialize($datas);
            exit;
        }
        else return $datas;

    }

    function mail_where($id, $array, $size = null)
    {
        return self::search_id_in_mail($id, $array, $size);
    }

    /**
     * Recherche un id parmis les mails.
     */
    public static function search_id_in_mail($id, $array, $size = null)
    {
        if ($size === null)
            $size = count($array);
        for ($i=0; $i < $size; ++$i) { 
            if ($array[$i]->uid == $id)
                return $i;
        }
        return false;

    }

    /**
     * Recherche un texte dans les contacts.
     */
    public function search_contact($search = null, $fields = null)
    {
        $called = !isset($search);
        include_once "program/search_result/search_result_contact.php";
        $search = $search ?? rcube_utils::get_input_value('_q', rcube_utils::INPUT_GET);
        $fields = $fields ?? explode(',', rcube_utils::get_input_value('_headers', rcube_utils::INPUT_GET));
        $sources = $this->rc->get_address_sources();
        $search_set = array();
        $records    = array();
        $sort_col   = $this->rc->config->get('addressbook_sort_col', 'name');
        $afields = $this->rc->config->get('contactlist_fields');
        $mode = (int) $this->rc->config->get('addressbook_search_mode');
        $mode |= rcube_addressbook::SEARCH_GROUPS;
        $retour = new SearchResults();
        foreach ($sources as $s) {
            $source = $this->rc->get_address_book($s['id']);
            //$source->table_cols[count($source->table_cols)] = "phone";
            // check if search fields are supported....
            if (is_array($fields)) {
                $cols = $source->coltypes[0] ? array_flip($source->coltypes) : $source->coltypes;
                $supported = 0;
    
                // foreach ($fields as $f) {
                //     if (array_key_exists($f, $cols)) {
                //         $supported ++;
                //     }
                // }
    
                // // in advanced search we require all fields (AND operator)
                // // in quick search we require at least one field (OR operator)
                // if (($adv && $supported < count($fields)) || (!$adv && !$supported)) {
                //     continue;
                // }
            }
    
            // reset page
            $source->set_page(1);
            $source->set_pagesize(5);
    
            // get contacts count
            $result = $source->search($fields, $search, $mode, false);
    
            if (!$result->count) {
                continue;
            }
    
            // get records
            $result = $source->list_records($afields);
    
            while ($row = $result->next()) {
                $row['sourceid'] = $s['id'];
                $retour->add(new SearchResultContact($row, $search, $this->rc));
                if ($retour->count() >= 5)
                    break;
                // $key = rcube_addressbook::compose_contact_key($row, $sort_col);
                // $records[$key] = $row;
            }
    
            unset($result);
            // $search_set[$s['id']] = $source->get_search_set();
        }
        $datas = $retour->get_array($this->gettext('contacts'));
        if ($called)
        {
            echo rcube_output::json_serialize($datas);
            exit;
        }
        else return $datas;

    }


    function get_create_document_template()
    {
        $this->rc->output->add_handlers(array(
            'document_type'    => array($this, 'get_docs_types'),
        ));
        echo $this->rc->output->parse("mel_metapage.create_document", false, false);
        exit;
        //$this->rc->output->send("mel_metapage.create_document");
    }

    function get_event_html()
    {
        $w = function ()
        {
            $wsp = $this->rc->plugins->get_plugin("mel_workspace");
            $wsp->load_workspaces();
            $workpaces = $wsp->workspaces;
            $html = '<select class="form-control input-mel">';
            $html .= "<option value=none>Aucun</option>";
            foreach ($workpaces as $key => $value) {
                $html .= '<option value="'.$value->uid.'">'.$value->title.'</option>';
            }
            $html .= "</select>";
            return $html;
        };
        $this->rc->output->add_handlers(array(
            'event-wsp'    => $w,
        ));
        echo $this->rc->output->parse("mel_metapage.event_body", false, false);
        exit;
    }

    
    function get_docs_types()
    {
        $templates = $this->rc->config->get('documents_types');
        $html = "";
        $size = count($templates);
        for ($i=0; $i < $size; ++$i) { 
            $html.= '<button class="btn btn-mel-block btn-secondary btn-mel" onclick="m_mp_UpdateCreateDocument({ext:`'+$templates[$i]['defautl_ext']+'`, type:`'+$templates[$i]['type']+'`})"><span class="'+$this->get_document_class_icon($templates[$i]["icon"])+'"></span>'+ $templates[$i]["name"] +'</button>';
        }
        return html::div([], $html);
    }

    function get_document_class_icon($icon)
    {
        switch ($icon) {
            case 'txt':
                return "icofont-file-document";         
            default:
                return $icon;
        }
    }


    function create_calendar_event()
    {

        $calendar = $this->rc->plugins->get_plugin('calendar');
        $calendar->add_texts('localization/', true);
        $calendar->ui->init();
        $calendar->ui->addJS();
        $calendar->ui->init_templates();
        $calendar->ui->calendar_list(array(), true); 
        if (rcube_utils::get_input_value('_framed', rcube_utils::INPUT_GET) == true)
        {
            $event = [];
            if (rcube_utils::get_input_value('_category', rcube_utils::INPUT_GET) !== null)
                $event["categories"] = [rcube_utils::get_input_value('_category', rcube_utils::INPUT_GET)];
            if (rcube_utils::get_input_value('_calendar_blocked', rcube_utils::INPUT_GET) !== null)//_calendar_blocked
                $event["calendar_blocked"] = rcube_utils::get_input_value('_calendar_blocked', rcube_utils::INPUT_GET);
            // if (rcube_utils::get_input_value('_startDate', rcube_utils::INPUT_GET) !== null)
            //     $event["start"] = [rcube_utils::get_input_value('_startDate', rcube_utils::INPUT_GET)];
            // else
            //     $event["start"] = ["now"];
            // if (rcube_utils::get_input_value('_endDate', rcube_utils::INPUT_GET) !== null)
            //     $event["end"] = [rcube_utils::get_input_value('_endDate', rcube_utils::INPUT_GET)];
            // else
            //     $event["end"] = ["start+1h"];

        }
        else
            $event = rcube_utils::get_input_value("_event", rcube_utils::INPUT_POST);

        $this->include_script('../mel_workspace/js/setup_event.js');

        $event["attendees"] = [
            ["email" => driver_mel::gi()->getUser()->email, "name" => $user->fullname, "role" => "ORGANIZER"]
        ];
        $settings = $calendar->__get("settings");
        
        foreach ($this->rc->user->list_emails() as $rec) {

            if (!$identity)
                $identity = $rec;

            $identity['emails'][] = $rec['email'];
            $settings['identities'][$rec['identity_id']] = $rec['email'];
        }

        $identity['emails'][] = $this->rc->user->get_username();
        $settings['identity'] = array('name' => $identity['name'], 'email' => strtolower($identity['email']), 'emails' => ';' . strtolower(join(';', $identity['emails'])));
        $driver = $calendar->__get("driver");
        $this->rc->output->set_env('calendar_settings', $settings);
        $this->rc->output->set_env('identities-selector', $calendar->ui->identity_select(array(
            'id'         => 'edit-identities-list',
            'aria-label' => $this->gettext('roleorganizer'),
            'class'      => 'form-control custom-select',
        )));

        if (rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GET) !== null)
        {
            $calendar = $this->rc->plugins->get_plugin("calendar");
            $calendar->mail_message2event();
        }
        else {

            $user = driver_mel::gi()->getUser();
            $event["calendar"] = driver_mel::gi()->mceToRcId($user->uid);
            $this->rc->output->set_env('event_prop', $event);
            //$this->include_script('../calendar/calendar_ui.js');
            $this->rc->output->send('calendar.dialog');
        }
    }


    // public function display_event()
    // {
    //     $source = rcube_utils::get_input_value('_source', rcube_utils::INPUT_GET);
    //     $idEvent = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GET);
    //     $this->rc->user->save_prefs(array("calendar_datas"),
    //         ["source" => $source, ]
    //     )
    // }
    public function override_rcmail_contacts_list($attrib = array())
    {
        $attrib += array('id' => 'rcmAddressList');
    
        // set client env

        $this->rc->output->set_env('pagecount', 0);
        $this->rc->output->set_env('current_page', 0);

    
        return $this->rc->table_output($attrib, array(), array('name'), 'ID');
    }

    public function override_rcmail_addressbook_list($attrib = array())
    {
        $attrib += array('id' => 'rcmdirectorylist');
    
        $out = '';
        $line_templ = html::tag('li', array(
            'id' => 'rcmli%s', 'class' => '%s'),
            html::a(array('href' => '#list',
                'rel' => '%s',
                'onclick' => "return ".rcmail_output::JS_OBJECT_NAME.".command('list-addresses','%s',this)"), '%s'));
    
        foreach ($this->rc->get_address_sources(false, true) as $j => $source) {
            $id = strval(strlen($source['id']) ? $source['id'] : $j);
            $js_id = rcube::JQ($id);
    
            // set class name(s)
            $class_name = 'addressbook';
            if ($source['class_name'])
                $class_name .= ' ' . $source['class_name'];
    
            $out .= sprintf($line_templ,
                rcube_utils::html_identifier($id,true),
                $class_name,
                $source['id'],
                $js_id, ($source['name'] ?: $id));
        }
    
        return html::tag('ul', $attrib, $out, html::$common_attrib);
    }

    public function weather()
    {
        $proxy = $this->rc->config->get('weather_proxy');

        $lat = rcube_utils::get_input_value("_lat", rcube_utils::INPUT_POST);
        $lng =  rcube_utils::get_input_value("_lng", rcube_utils::INPUT_POST);

        $url = "https://www.prevision-meteo.ch/services/json/lat=".$lat."lng=$lng";

        $json = mel_helper::load_helper($this->rc)->fetch("", false, 0)->_get_url($url, null, null, [CURLOPT_PROXY => $proxy]);

        if ($json["httpCode"] !== 200)
        {
            $url = "https://www.prevision-meteo.ch/services/json/lat=".round($lat)."lng=".round($lng);
            $json = mel_helper::load_helper($this->rc)->fetch("", false, 0)->_get_url($url, null, null, [CURLOPT_PROXY => $proxy]);
        }

        echo json_encode([$url, $json]);
        exit;
    }

    function get_modal()
    {
        echo $this->rc->output->parse("mel_metapage.mel_modal", false, false);
        exit;
    }

    public function chat_logout()
    {
        $rc = $this->rc->plugins->get_plugin("rocket_chat");

        if (!$rc->me())
        {
            $rc->logout();
            echo "unloggued";
        }
        else
            echo "loggued";
        exit;
    }

    public function get_program($program_name)
    {
        $program = null;

        switch ($program_name) {
            case 'webconf':
                include_once "program/webconf/webconf.php";
                $program = new Webconf($this->rc, $this);            
                break;
            
            default:
                # code...
                break;
        }

        return $program;
    }

  /**
   * Handler for user preferences form (preferences_list hook)
   */
  public function prefs_list($args) {

    if ($args['section'] == 'general') {
      // Load localization and configuration
      $this->add_texts('localization/');

      $icon = "mel-icon-size";
      $folder_space = "mel-folder-space";
      $message_space = "mel-message-space";
      $mel_column = "mel-3-columns";
      $chat_placement = "mel-chat-placement";

      // Check that configuration is not disabled
      $config = $this->rc->config->get('mel_mail_configuration', [
          $icon => $this->gettext("normal", "mel_metapage"),
          $folder_space => $this->gettext("normal", "mel_metapage"),
          $message_space => $this->gettext("normal", "mel_metapage"),
          $mel_column => $this->gettext("yes", "mel_metapage"),
          $chat_placement => $this->gettext("down", "mel_metapage")
      ]);

      $options = [
            $icon => [
                $this->gettext("smaller", "mel_metapage"),
                $this->gettext("normal", "mel_metapage")
            ],
            $folder_space => [
                $this->gettext("smaller", "mel_metapage"),
                $this->gettext("normal", "mel_metapage"),
                $this->gettext("larger", "mel_metapage")
            ],
            $message_space => [
                $this->gettext("smaller", "mel_metapage"),
                $this->gettext("normal", "mel_metapage"),
                $this->gettext("larger", "mel_metapage")
            ],
            $mel_column => [
                $this->gettext("yes", "mel_metapage"),
                $this->gettext("no", "mel_metapage")
            ],
            $chat_placement => [
                $this->gettext("up", "mel_metapage"),
                $this->gettext("down", "mel_metapage")
            ]
        ];

        if ($config[$chat_placement] === null || $config[$chat_placement] === "")
            $config[$chat_placement] = $this->gettext("down", "mel_metapage");

        foreach ($config as $key => $value) {
            $args['blocks']['main']['options'][$key] = $this->create_pref_select($key, $value, $options[$key], ($key === $mel_column ? ["style" => "display:none;"] : null));
        }
      
    }
    else if($args['section'] == 'calendar'){
        $this->add_texts('localization/');

        $calendar_space = "mel-calendar-space";

        $config = $this->rc->config->get('mel_calendar_configuration', [
            $calendar_space => $this->gettext("normal", "mel_metapage"),
        ]);

        $options = [
            $calendar_space => [
                $this->gettext("without_spaces", "mel_metapage"),
                $this->gettext("smaller", "mel_metapage"),
                $this->gettext("normal", "mel_metapage"),
                $this->gettext("larger", "mel_metapage")
            ]
        ];

        foreach ($config as $key => $value) {
            $args['blocks']['view']['options'][$key] = $this->create_pref_select($key, $value, $options[$key]);
        }
    }
    // else if ($args['section'] == 'compose') {
    //     unset($args['blocks']['main']['options']['compose_extwin']);
    // }

    return $args;
  }

  function create_pref_select($field_id, $current, $options, $attrib = null)
  {

    if ($attrib === null)
        $attrib = [];

    $attrib['name'] = $field_id;
    $attrib['id'] = $field_id;

    $input = new html_select($attrib);

    foreach ($options as $key => $value) {
        $input->add($value);
    }

    unset($attrib['name']);
    unset($attrib['id']);
    $attrib["for"] = $field_id;

    return array(
        'title' => html::label($attrib, rcube::Q($this->gettext($field_id))),
        'content' => $input->show($current),
      );

  }

    /**
   * Handler for user preferences save (preferences_save hook)
   */
  public function prefs_save($args) {
    if ($args['section'] == 'general') {

        $this->add_texts('localization/');

        $icon = "mel-icon-size";
        $folder_space = "mel-folder-space";
        $message_space = "mel-message-space";
        $mel_column = "mel-3-columns";
        $chat_placement = "mel-chat-placement";
        
      // Check that configuration is not disabled
        $config = $this->rc->config->get('mel_mail_configuration', [
            $icon => $this->gettext("normal", "mel_metapage"),
            $folder_space => $this->gettext("normal", "mel_metapage"),
            $message_space => $this->gettext("normal", "mel_metapage"),
            $mel_column => $this->gettext("yes", "mel_metapage"),
            $chat_placement => $this->gettext("down", "mel_metapage")
        ]);

        if ($config[$chat_placement] === null || $config[$chat_placement] === "")
            $config[$chat_placement] = $this->gettext("down", "mel_metapage");

      foreach ($config as $key => $value) {
        $config[$key] = rcube_utils::get_input_value($key, rcube_utils::INPUT_POST);
      }

      $args['prefs']["mel_mail_configuration"] = $config;
      
      $this->rc->output->set_env("mel_metapage_mail_configs", $config);
    }
    else if($args['section'] == 'calendar'){
        $this->add_texts('localization/');

        $calendar_space = "mel-calendar-space";

        $config = $this->rc->config->get('mel_calendar_configuration', [
            $calendar_space => $this->gettext("normal", "mel_metapage"),
        ]);

        foreach ($config as $key => $value) {
            $config[$key] = rcube_utils::get_input_value($key, rcube_utils::INPUT_POST);
          }
    
          $args['prefs']["mel_calendar_configuration"] = $config;
          
          $this->rc->output->set_env("mel_metapage_calendar_configs", $config);
    }


    return $args;
  }

  function toggleChat()
  {
    $config = !$this->rc->config->get('mel_metapage_chat_visible', true);
    $this->rc->user->save_prefs(array('mel_metapage_chat_visible' => $config));

    echo json_encode($config);
    exit;
  }

  public static function events()
  {
      include_once 'program/eventSystem.php';
      return mel_event_system::Instance();
  }

  public function open_section($args)
  {
      $section = rcube_utils::get_input_value('_open_section', rcube_utils::INPUT_GET);
      $this->include_script('js/actions/settings_events.js');
      $this->rc->output->set_env("open_section", $section);
  }

  public function get_maintenance_text($during = false)
  {
        $text = "";
        $datas = $this->rc->config->get('maintenance_datas', null);
        
        if ($datas !== null && $datas['show'] === true)
        {
            if (!$during)
                $text = "Une maintenance aura lieu le ".$datas["day"]." durant ".$datas["when"]." ".$datas["before-howmany"]." ".$datas["howmany"].".";
            else
                $text = "Durée de la maintenance ".$datas["before-howmany"]." ".$datas["howmany"].".";
        }
//<h2 style="text-align: center;/*! text-decoration: blink; */color: #F71E1E;/*! text-decoration: underline; */">Une maintenance aura lieu le 09/12/2021 durant l'après-midi pendant environs moins d'une heure
//.</h2>
        return $text;
  }

  public function message_send_error($args)
  {
    $this->rc->output->command('plugin.message_send_error', $args);
    //$this->rc->output->add_script('parent.rcmail.env["message_send_error.value"] = '.json_encode($args));
    return $args;
  }

}