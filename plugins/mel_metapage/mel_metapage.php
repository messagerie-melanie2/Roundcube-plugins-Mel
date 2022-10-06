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

    public static function can_add_widget($exception = [])
    {
        $task = rcmail::get_instance()->task;

        return false && ($task === 'bureau' ||  $task === 'settings');
    }

    function init_sub_modules($exception = null)
    {
        $dir = __DIR__;
        $folders = scandir(__DIR__."/program");

        foreach ($folders as $folder) {
           if (is_dir(__DIR__."/program/".$folder) && $folder !== '.' && $folder !== '..')
           {
                if ($folder === 'pages') 
                {
                    $this->init_sub_pages();
                    continue;
                }
                else if (isset($exception) && is_array($exception) && in_array($folder, $exception)) continue;
                else {
                    $files = scandir(__DIR__."/program/".$folder);

                    foreach ($files as $file) {
                        if (strpos($file, ".php") !== false)
                        {
                            include_once __DIR__.'/program/'.$folder.'/'.$file;
                        }
                    }
                }
           }
        }

        if (class_exists('Program'))
        {
            foreach (Program::generate($this->rc, $this) as $submodule) {
                if ($this->rc->task === $submodule->program_task())
                {
                    $submodule->init();
                }

                $submodule->public();
            }
        }
    }

    function init_sub_pages()
    {
        $dir = __DIR__;
        $files = scandir("$dir/program/pages");
        $size = count($files);
        for ($i=0; $i < $size; ++$i) { 
            if (strpos($files[$i], ".php") !== false && $files[$i] !== "page.php" && $files[$i] !== "parsed_page.php")
            {
                include_once __DIR__."/program/pages/".$files[$i];
                $classname = str_replace(".php", "", ucfirst($files[$i]));
                $object = new $classname($this->rc, $this);

                if (method_exists($object, "call"))
                    $object->call();

                if ($this->rc->task === "custom_page")
                    $object->init();

            }
        }
    }

    function init()
    {
        try {
            $this->setup();
        } catch (\Throwable $th) {
            //throw $th;
        }
        $this->init_sub_modules();

        if ($this->rc->task === "chat") $this->register_action('index', array($this, 'ariane'));
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
        $this->require_plugin('mel_helper');
 
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

        $this->add_hook('preferences_sections_list',    [$this, 'preferences_sections_list']);
        $this->add_hook('preferences_list', array($this, 'prefs_list'));
        $this->add_hook('preferences_save',     array($this, 'prefs_save'));
        $this->add_hook("send_page", array($this, "appendTo"));
        $this->add_hook("message_send_error", [$this, 'message_send_error']);
        $this->add_hook("message_draftsaved", [$this, 'message_draftsaved']);
        $this->add_hook("calendar.on_attendees_notified", [$this, 'on_attendees_notified']);

        if ($this->rc->task === 'settings' && $this->rc->action === "edit-prefs" &&  rcube_utils::get_input_value('_section', rcube_utils::INPUT_GPC) === 'globalsearch')
        {
            $this->include_script('js/actions/settings_gs.js');
        }

        if ($this->rc->task === "mail" )
        {
            $this->add_hook('mel_config_suspect_url', [$this,'check_message_is_suspect_custom']);
            $this->add_hook('mel_config_bloqued_url', [$this,'check_message_is_bloqued_custom']);
            // $this->add_hook("messages_list", [$this, 'hook_messages_list']);
            $this->add_hook('message_part_body_after', [$this, 'hook_message_part_get']);
            $this->add_hook('message_objects', [$this, 'hook_message_objects']);
            $model_mbox = $this->rc->config->get('models_mbox');
            switch ($this->rc->action) {
                case 'compose':
                    $this->include_edited_editor();
                    $this->include_script('js/init/classes.js');
                    $this->include_script('js/init/constants.js');

                    if ($_COOKIE['current_model_id'] !== null)
                    {
                        $this->rc->output->set_env("is_model", true);
                        $this->rc->output->set_env("model_id", $_COOKIE['current_model_id']);
                        $this->include_script('js/actions/mail_compose_event.js');
                    }
                    break;

                case 'preview':
                case 'show':
                    if (rcube_charset::convert(rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GPC), 'UTF7-IMAP') === $this->rc->config->get('models_mbox'))
                    {
                        $this->rc->output->set_env("is_model", true);
                    }
                    break;
                
                default:
                    $this->rc->output->set_env("model_mbox", $model_mbox);
                    break;
            }

            $model_mbox = driver_mel::gi()->getUser()->getObjectsSharedEmission();
            $model_mbox = json_encode($model_mbox);
            $this->rc->output->set_env("all_mailboxes", json_decode($model_mbox));

            $this->add_button(array(
                'command' => 'mel-comment-mail',
                'class' => 'ct-cm',
                'innerclass' => 'inner',
                'id' => 'mel-comment-mail',//tb_label_popup
                'title' => 'mel_metapage.to_comment', // gets translated
                'type' => 'link',
                'label' => 'mel_metapage.to_comment', // maybe put translated version of "Labels" here?
            ), 'toolbar');
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
        $config = $this->rc->config->get("mel_metapage_chat_visible", true);

        if (!$this->is_app_enabled('chat')) $config = false;

        $this->rc->output->set_env("mel_metapage_chat_visible", $config);
        $this->rc->output->set_env("mel_metapage_weather_enabled", $this->rc->config->get("enable_weather", false));
        $this->rc->output->set_env('mel_metapage.tab.notification_style', $this->rc->config->get('tab_title_style', 'page'));
        $this->rc->output->set_env('mel_metapage.webconf_voxify_indicatif', $this->rc->config->get('webconf_voxify_indicatif', 'FR'));

        $icon = "mel-icon-size";
        $folder_space = "mel-folder-space";
        $message_space = "mel-message-space";
        $mel_column = "mel-3-columns";
        $chat_placement = "mel-chat-placement";
        $scrollbar_size = 'mel-scrollbar-size';
  
        // Check that configuration is not disabled
        $config = $this->rc->config->get('mel_mail_configuration', [
            $icon => $this->gettext("normal", "mel_metapage"),
            $folder_space => $this->gettext("normal", "mel_metapage"),
            $message_space => $this->gettext("normal", "mel_metapage"),
            $mel_column => $this->gettext("yes", "mel_metapage"),
            $chat_placement => $this->gettext("down", "mel_metapage"),
            $scrollbar_size => $this->gettext("auto", "mel_metapage")
        ]);

        $this->rc->output->set_env("mel_metapage_mail_configs", $config);
        $this->rc->output->set_env("mel_metapage_audio_url", $this->rc->config->get("audio_event_url", 'https://audio.mtes.fr/'));

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
            else if ($this->rc->task === 'search')
                $this->register_task("search");
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

            //$this->rc->output->set_env('navigation_apps', $this->rc->config->get('navigation_apps', null));

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

            if (class_exists('rocket_chat'))
            {
                $startup = 'chat_startup';
                $startup_config = $this->rc->config->get($startup, false);
                $this->rc->output->set_env("launch_chat_frame_at_startup", $startup_config);
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
            $this->register_action('get_have_cerbere', array($this, 'get_have_cerbere'));
            $this->register_action('comment_mail', array($this, 'comment_mail'));
            $this->add_hook('refresh', array($this, 'refresh'));
            $this->add_hook("startup", array($this, "send_spied_urls"));
            //$this->add_hook('contacts_autocomplete_after', [$this, 'contacts_autocomplete_after']);
            if ($this->rc->task === 'settings' && rcube_utils::get_input_value('_open_section', rcube_utils::INPUT_GET) !== null) $this->add_hook('ready', array($this, 'open_section'));
            $this->rc->output->set_env("webconf.base_url", $this->rc->config->get("web_conf"));
            $this->rc->output->set_env('current_user', [
                'name' => driver_mel::gi()->getUser()->firstname,
                'lastname' => driver_mel::gi()->getUser()->lastname,
                'full' => driver_mel::gi()->getUser()->fullname
            ]);

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
        if ($this->rc->task === "mail" && (rcube_utils::get_input_value('_nocache', rcube_utils::INPUT_GPC) == "true"/* || 
        $this->rc->action === 'search')*/))
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

        // MANTIS 0006453: Simplifier le déplacement de mails dans un autre dossier IMAP
        if ($this->rc->task == 'mail')
        {
            $this->add_button(array(
                'command'       => 'move',
                'class'	        => 'move disabled',
                'classact'      => 'move',
                'classsel'      => 'move',
                'label'	        => 'move',
                'title'         => 'moveto',
                'innerclass'    => 'inner',
                'aria-haspopup' => 'true',
                'type'          => 'link',
            ), "toolbar");
        }

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
                if (!$final_start && strpos($textToReplace,'<div id="edit-internallocalchanges-warning"') !== false)
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
                    $html .= "<option value=\"#none\">".$this->gettext('none')."</option>";
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
        $this->rc->output->set_pagetitle($this->gettext('loading'));
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
        $this->include_script('js/init/constants.js');
        $this->include_script('js/init/commands.js');
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
        {
            $this->include_script('js/actions/mail_search.js');
        }
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
    public function search_mail($input = null, $folder = null)
    {
        $called = !isset($input);

        include_once "program/search_result/search_result_mail.php";

        $input = $input ?? rcube_utils::get_input_value('_q', rcube_utils::INPUT_GET);
        $folder = ($folder ?? rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GET)) ?? 'INBOX';

        $isInbox = $folder === 'INBOX';
        $this->rc->storage->set_folder($folder);

        $folders;

        $max_size_page = $this->rc->config->get('search_mail_max', 9999);

        if ($isInbox) 
        {
            $search_on_all_bali_folders = 'search_on_all_bali_folders';
            $search_on_all_bali_folders_config = $this->rc->config->get($search_on_all_bali_folders, true);
            $folders = $this->rc->storage->list_folders_subscribed('', '*', 'mail');

            if (!$search_on_all_bali_folders_config)
            {
                $folders_datas = $this->rc->config->get('global_search_bali_folders_configs', []);

                foreach ($folders as $index => $_folder) {
                    $_folder = rcube_charset::convert($_folder, 'UTF7-IMAP');
                    $_folder = str_replace('INBOX', 'Courrier entrant', $_folder);
                    
                    if (!($folders_datas[$_folder] ?? true)) unset($folders[$index]);
                }
            }

            $max_size_page *= count($folders);
            if ($max_size_page > 9999) $max_size_page = 9999;
        }
        else 
        {
            $search_on_all_bal = 'search_on_all_bal';
            $search_on_all_bal_config = $this->rc->config->get($search_on_all_bal, true);

            if (!$search_on_all_bal_config)
            {
                $balps = $this->rc->config->get('global_search_balp_configs', []);

                $current_balp_id = driver_mel::gi()->getUser()->uid.'.-.'.explode('/', $folder)[1];

                if (!($balps[$current_balp_id] ?? true))
                {
                    echo json_encode([]);
                    exit;
                }
            }

            $folders = $folder;
        }

        $this->rc->storage->set_pagesize($max_size_page);

        $search = $this->rc->storage->search($folders, "OR HEADER FROM ".$input." HEADER SUBJECT ".$input, RCUBE_CHARSET, "arrival");
        $msgs = $this->rc->storage->list_messages($folder);

        foreach ($msgs as $key => $value) {
            $retour[] = $value;
        }

        // $msgs = $this->rc->storage->list_messages();
        // $tmp = $this->rc->storage->search(null, "OR HEADER FROM ".$input." HEADER SUBJECT ".$input, RCUBE_CHARSET, "arrival");
        // $array = $tmp->get();
        // $size = count($array);
        // $index = null;
        // $retour = [];
        // $it = 0;
        // for ($i=$size; $i >= 0; --$i) { 
        //     $index = $this->mail_where($array[$i], $msgs);
        //     if ($index !== false)
        //         $retour[$it++] = $msgs[$index];
        //     // if (count($retour) >= 5)
        //     //     break;
        // }
        $datas = SearchResultMail::create_from_array($retour, $this)->get_array($this->gettext("mails")."/$folder");
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
            // $source->set_pagesize(5);
    
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
                // if ($retour->count() >= 5)
                //     break;
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
            $html .= "<option value=none>".$this->gettext('none')."</option>";
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

    public function preferences_sections_list($p)
    {
        $dir = __DIR__;
        if (is_dir("$dir/program/search_page") && file_exists("$dir/program/search_page/search.php"))
        {
            $p['list']['globalsearch'] = [
                'id'      => 'globalsearch',
                'section' => $this->gettext('globalsearch', 'mel_metapage'),
            ];
        }
         
        if (is_dir("$dir/program/webconf") && file_exists("$dir/program/webconf/webconf.php"))
        {
            $p['list']['visio'] = [
                'id'      => 'visio',
                'section' => $this->gettext('visio', 'mel_metapage'),
            ];
        }

        if (class_exists("rocket_chat"))
        {
            $p['list']['chat'] = [
                'id'      => 'chat',
                'section' => $this->gettext('chat', 'mel_metapage'),
            ];
        }

        if (!class_exists('mel_notification'))
        {
            $p['list']['notifications'] = [
                'id'      => 'notifications',
                'section' => $this->gettext('notifications'),
            ];
        }

        $p['list']['navigation'] = [
            'id'      => 'navigation',
            'section' => $this->gettext('main_nav', 'mel_metapage'),
        ];

        return $p;
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
            $scrollbar_size = 'mel-scrollbar-size';

            // Check that configuration is not disabled
            $config = $this->rc->config->get('mel_mail_configuration', [
                $icon => $this->gettext("normal", "mel_metapage"),
                $folder_space => $this->gettext("normal", "mel_metapage"),
                $message_space => $this->gettext("normal", "mel_metapage"),
                $mel_column => $this->gettext("yes", "mel_metapage"),
                $chat_placement => $this->gettext("down", "mel_metapage"),
                $scrollbar_size => $this->gettext("auto", "mel_metapage")
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
                ],
                $scrollbar_size => [
                    $this->gettext('auto', 'mel_metapage'),
                    $this->gettext("default", 'mel_metapage'),
                    $this->gettext("normal", "mel_metapage"),
                    $this->gettext("large", "mel_metapage")
                ]
            ];

            if ($config[$chat_placement] === null || $config[$chat_placement] === "")
                $config[$chat_placement] = $this->gettext("down", "mel_metapage");

            if ($config[$scrollbar_size] === null || $config[$scrollbar_size] === "")
                $config[$scrollbar_size] = $this->gettext("auto", "mel_metapage");

            foreach ($config as $key => $value) {
                if ($key === $chat_placement) continue;
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
        else if ($args['section'] == 'globalsearch')
        {
            $this->add_texts('localization/');
            mel_helper::settings(true);

            //Max search mail
            $search_mail_max = 'search_mail_max';
            $search_mail_max_config = $this->rc->config->get($search_mail_max, 9999);
            $search_input = (new setting_option_value_input(0, setting_option_value_input::INFINITY))->html($search_mail_max, $search_mail_max_config, ['name' => $search_mail_max], $this);//new html_inputfield(['name' => $search_mail_max, 'id' => $search_mail_max]);

            $args['blocks']['general']['options'][$search_mail_max] = $search_input;/*[
                'title'   => html::label($search_mail_max, rcube::Q($this->gettext($search_mail_max))),
                'content' => $search_input->show($search_mail_max_config),
            ];*/

            //Search on all bal
            $search_on_all_bal = 'search_on_all_bal';
            $search_on_all_bal_config = $this->rc->config->get($search_on_all_bal, true);
            $search_check = new html_checkbox(['name' => $search_on_all_bal, 'id' => $search_on_all_bal, 'value' => 1]);

            $args['blocks']['general']['options'][$search_on_all_bal] = [
                'title'   => html::label($search_on_all_bal, rcube::Q($this->gettext($search_on_all_bal))),
                'content' => $search_check->show($search_on_all_bal_config ? 1 : 0),
            ];

            $args['blocks']['general']['options']['balp_settings'] = [
                'content' => $this->create_balp_selection($this->rc->config->get('global_search_balp_configs', []))->show(['style' => ($search_on_all_bal_config ? 'display:none' : '')]),
            ];

            //Search on all bali
            $search_on_all_bali_folders = 'search_on_all_bali_folders';
            $search_on_all_bali_folders_config = $this->rc->config->get($search_on_all_bali_folders, true);
            $search_check = new html_checkbox(['name' => $search_on_all_bali_folders, 'id' => $search_on_all_bali_folders, 'value' => 1]);

            $args['blocks']['general']['options'][$search_on_all_bali_folders] = [
                'title'   => html::label($search_on_all_bali_folders, rcube::Q($this->gettext($search_on_all_bali_folders))),
                'content' => $search_check->show($search_on_all_bali_folders_config ? 1 : 0),
            ];

            $args['blocks']['general']['options']['bali_settings'] = [
                'content' => $this->create_bali_folders_selection($this->rc->config->get('global_search_bali_folders_configs', []))->show(['style' => ($search_on_all_bali_folders_config ? 'display:none' : '')]),
            ];
            
        }
        else if ($args['section'] == 'chat')
        {
            $this->add_texts('localization/');
            $startup = 'chat_startup';
            $startup_config = $this->rc->config->get($startup, false);

            $startup_check = new html_checkbox(['name' => $startup, 'id' => $startup, 'value' => 1]);
            $args['blocks']['general']['options'][$askOnEnd] = [
                'title'   => html::label($startup, rcube::Q($this->gettext($startup))),
                'content' => $startup_check->show($startup_config ? 1 : 0),
            ];

            $icon = "mel-icon-size";
            $folder_space = "mel-folder-space";
            $message_space = "mel-message-space";
            $mel_column = "mel-3-columns";
            $chat_placement = "mel-chat-placement";
            $scrollbar_size = 'mel-scrollbar-size';

            // Check that configuration is not disabled
            $config = $this->rc->config->get('mel_mail_configuration', [
                $icon => $this->gettext("normal", "mel_metapage"),
                $folder_space => $this->gettext("normal", "mel_metapage"),
                $message_space => $this->gettext("normal", "mel_metapage"),
                $mel_column => $this->gettext("yes", "mel_metapage"),
                $chat_placement => $this->gettext("down", "mel_metapage"),
                $scrollbar_size => $this->gettext("auto", "mel_metapage")
            ]);

            if ($config[$chat_placement] === null || $config[$chat_placement] === "") $config[$chat_placement] = $this->gettext("down", "mel_metapage");
            if ($config[$scrollbar_size] === null || $config[$scrollbar_size] === "") $config[$scrollbar_size] = $this->gettext("auto", "mel_metapage");

            $options = [
                $chat_placement => [
                    $this->gettext("up", "mel_metapage"),
                    $this->gettext("down", "mel_metapage")
                ]
            ];

            foreach ($config as $key => $value) {
                if ($options[$key] !== null)
                {
                    $args['blocks']['main']['options'][$key] = $this->create_pref_select($key, $value, $options[$key], ($key === $mel_column ? ["style" => "display:none;"] : null));
                }
            }
        }
        else if ($args['section'] == 'notifications')
        {
            $this->add_texts('localization/');
            $tab_title_style = 'tab_title_style';
            $value = $this->rc->config->get($tab_title_style, 'page');

            $options = ['all', 'page', 'nothing'];
            $texts = [];

            foreach ($options as $txt) {
                $texts[] = $this->gettext("notif-$txt");
            }

            $args['blocks']['main_nav']['name'] = 'Navigation principale';
            $args['blocks']['main_nav']['options'][$tab_title_style] = $this->create_pref_select_more($tab_title_style, $value, $texts, $options, ['title' => str_replace('<all/>', $this->gettext("notif-all"), str_replace('<page/>', $this->gettext("notif-page"), $this->gettext('tab_title_style_help')))]);
            
        }
        else if ($args['section'] == 'navigation')
        {
            mel_helper::html_helper();
            $this->add_texts('localization/');
            $config = mel_helper::Enumerable($this->rc->config->get('navigation_apps', []));

            $main = $config->where(function ($k, $v) {
                return !isset($v['link']);
            });

            $args['blocks']['main_nav']['name'] = 'Applications par défauts';

            foreach ($main as $key => $value) {
                $key = $value->get_key();
                $value = $value->get_value();
                $check = new html_checkbox(['name' => $key, 'id' => $key, 'value' => 1]);
                $args['blocks']['main_nav']['options'][$key] = [
                    'title'   => html::label($key, rcube::Q($this->gettext($key, 'mel_metapage'))),
                    'content' => $check->show($value['enabled'] ? 1 : 0),
                ];
            }

            // $args['blocks']['others']['name'] = 'Autres applications';
            // $table = new html_mel_table(6);
            // $table->edit($i, 0, 'Nom');
            // $table->edit($i, 1, 'Lien');
            // $table->edit($i, 2, 'Aperçu de l\'icône');
            // $table->edit($i, 3, 'Icône');
            // $table->edit($i, 4, 'Activé');
            // $table->edit($i, 5, 'Supprimé');
            // $i = 1;
            // foreach ($others as $key => $value) {
            //     $key = $value->get_key();
            //     $value = $value->get_value();
            //     $check = new html_checkbox(['name' => "$key.check", 'id' => "$key-check", 'value' => 1]);
            //     $table->addRow();
            //     $table->edit($i, 0, '<input class="form-control input-mel mel-input" value="'.$key.'" placeholder="Nom de l\'application" />');
            //     $table->edit($i, 1, '<input class="form-control input-mel mel-input" value="'.$value['link'].'" placeholder="Lien de l\'application" />');
            //     $table->edit($i, 2, '<span class="'.$value['icon'].'"></span>');
            //     $table->edit($i, 3, '<input class="form-control input-mel mel-input" value="'.$value['icon'].'" placeholder="Icon de l\'application" />');
            //     $table->edit($i, 4, $check->show($value['enabled'] ? 1 : 0));
            //     $table->edit($i, 5, html::tag('button', [], 'DEL'));
            // }

            // $args['blocks']['others']['options']["table"] = ['content' => $table->show()];
            // $args['blocks']['others']['options']["add"] = ['content' => html::tag('button', [], 'ADD')];
        }

        return $args;
    }

    function create_bali_folders_selection($config)
    {
        if (!isset($config)) $config = [];

        $storage = $this->rc->storage;

        if (!isset($storage)) $storage = $this->rc->get_storage();

        $folders = $storage->list_folders_subscribed('', '*', 'mail');
        $table = new html_table(['id' => 'bali-select', 'cols' => 2]);

        // Add headers
        foreach (['folders', 'search-in-this-folder'] as $name) {
            $table->add_header(['class' => $name], $this->gettext($name));
        }

        foreach ($folders as $folder_name) {
            $folder_name = rcube_charset::convert($folder_name, 'UTF7-IMAP');
            $folder_name = str_replace('INBOX', 'Courrier entrant', $folder_name);
            $table->add([], $folder_name);
            $checkbox = new html_checkbox(['name' => "bali_folders_$folder_name", 'value' => 1]);
            $table->add([], $checkbox->show(($config[$folder_name] ?? true) ? 1 : 0));
        }

        return $table;
    }

  function create_balp_selection($config)
  {
    $mails = $this->rc->plugins->get_plugin('mel_sharedmailboxes')->get_user_sharedmailboxes_list();
    $table = new html_table(['id' => 'balp-select', 'cols' => 2]);

    // Add headers
    foreach (['balp', 'search-in-this-balp'] as $name) {
        $table->add_header(['class' => $name], $this->gettext($name));
    }

    foreach ($mails as $key => $mail) {
        $folder_name = $mail->mailbox->fullname;
        $table->add([], $folder_name);
        $checkbox = new html_checkbox(['name' => "balp_folders_$key", 'value' => 1]);
        $table->add([], $checkbox->show(($config[$key] ?? true) ? 1 : 0));
    }

    return $table;
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

  function create_pref_select_more($field_id, $current, $names, $values = null, $attrib = null)
  {

    if ($attrib === null)
        $attrib = [];

    $attrib['name'] = $field_id;
    $attrib['id'] = $field_id;

    $input = new html_select($attrib);


    $input->add($names, $values);

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
        $scrollbar_size = 'mel-scrollbar-size';
        
      // Check that configuration is not disabled
        $config = $this->rc->config->get('mel_mail_configuration', [
            $icon => $this->gettext("normal", "mel_metapage"),
            $folder_space => $this->gettext("normal", "mel_metapage"),
            $message_space => $this->gettext("normal", "mel_metapage"),
            $mel_column => $this->gettext("yes", "mel_metapage"),
            $chat_placement => $this->gettext("down", "mel_metapage"),
            $scrollbar_size => $this->gettext("auto", "mel_metapage")
        ]);

        if ($config[$chat_placement] === null || $config[$chat_placement] === "")
            $config[$chat_placement] = $this->gettext("down", "mel_metapage");

        if ($config[$scrollbar_size] === null || $config[$scrollbar_size] === "")
            $config[$scrollbar_size] = $this->gettext("auto", "mel_metapage");

        $chat = $config[$chat_placement];

      foreach ($config as $key => $value) {
        $config[$key] = rcube_utils::get_input_value($key, rcube_utils::INPUT_POST);
      }

      $config[$chat_placement] = $chat;
      

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
    else if ($args['section'] == 'globalsearch')
    {
        $op_search_mail_max = 'search_mail_max';
        $op_search_on_all_bal = 'search_on_all_bal';
        $op_search_on_all_bali_folders = 'search_on_all_bali_folders';
        $op_table_balp = 'global_search_balp_configs';
        $op_table_bali = 'global_search_bali_folders_configs';

        $config_search_mail_max = $this->rc->config->get($op_search_mail_max, 9999);
        $config_search_on_all_balp = $this->rc->config->get($op_search_on_all_bal, true);
        $config_search_on_all_bali_folders = $this->rc->config->get($op_search_on_all_bali_folders, true);
        $config_balp = $this->rc->config->get('global_search_balp_configs', []);
        $config_bali = $this->rc->config->get('global_search_bali_folders_configs', []);

        $config_search_mail_max = intval(rcube_utils::get_input_value($op_search_mail_max, rcube_utils::INPUT_POST) ?? $config_search_mail_max);
        $args['prefs'][$op_search_mail_max] = $config_search_mail_max;

        $config_search_on_all_balp = rcube_utils::get_input_value($op_search_on_all_bal, rcube_utils::INPUT_POST) === '1';
        $args['prefs'][$op_search_on_all_bal] = $config_search_on_all_balp;

        $config_search_on_all_bali_folders = rcube_utils::get_input_value($op_search_on_all_bali_folders, rcube_utils::INPUT_POST) === '1';
        $args['prefs'][$op_search_on_all_bali_folders] = $config_search_on_all_bali_folders;

        if (!$config_search_on_all_balp)
        {
            $balps = $this->rc->plugins->get_plugin('mel_sharedmailboxes')->get_user_sharedmailboxes_list();
            $args['prefs'][$op_table_balp] = $this->_save_pref_update_config($config_balp, $balps, 'balp_folders_');
        }

        if (!$config_search_on_all_bali_folders)
        {
            $storage = $this->rc->storage;

            if (!isset($storage)) $storage = $this->rc->get_storage();
    
            $bali_folders = $storage->list_folders_subscribed('', '*', 'mail');
            $args['prefs'][$op_table_bali] = $this->_save_pref_update_config($config_bali, $bali_folders, 'bali_folders_');
        }
    }
    else if ($args['section'] == 'chat')
    {
        $this->add_texts('localization/');
        $startup = 'chat_startup';
        $startup_config = $this->rc->config->get($startup, false);
        $startup_config = rcube_utils::get_input_value($startup, rcube_utils::INPUT_POST) === '1';
        $args['prefs'][$startup] = $startup_config;

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

        $config[$chat_placement] = rcube_utils::get_input_value($chat_placement, rcube_utils::INPUT_POST);

        $args['prefs']["mel_mail_configuration"] = $config;
      
        $this->rc->output->set_env("mel_metapage_mail_configs", $config);
    }
    else if ($args['section'] == 'notifications')
    {
        $this->add_texts('localization/');
        $tab_title_style = 'tab_title_style';
        $value = $this->rc->config->get($tab_title_style, 'page');
        $value = rcube_utils::get_input_value($tab_title_style, rcube_utils::INPUT_POST);
        $args['prefs']["tab_title_style"] = $value;
        $this->rc->output->set_env('mel_metapage.tab.notification_style', $value);
    }
    else if ($args['section'] == 'navigation')
    {
        mel_helper::html_helper();
        $this->add_texts('localization/');

        $config = $this->rc->config->get('navigation_apps', []);

        foreach ($config as $key => $value) {
            $input = rcube_utils::get_input_value($key, rcube_utils::INPUT_POST);

            if (isset($input)) $config[$key]['enabled'] = $input === '1';
            else $config[$key]['enabled']  = false;
        }

        $args['prefs']["navigation_apps"] = $config;
    }


    return $args;
  }

  function _save_pref_update_config($config, $datas, $prefix)
  {
    $folders = [];
    foreach ($datas as $key => $data) {
        $folder_name = is_string($data) ? rcube_charset::convert($data, 'UTF7-IMAP') : $key;
        $folder_name = str_replace('INBOX', 'Courrier entrant', $folder_name);
        $val = rcube_utils::get_input_value($prefix.str_replace(' ', '_', str_replace('.', '_', $folder_name)), rcube_utils::INPUT_POST) === '1';
        $config[$folder_name] = $val;
        $folders[] = $folder_name;
    }

    foreach ($config as $folder => $value) {
        if (!in_array($folder, $folders)) unset($config[$folder]);
    }

    return $config;
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

  public function message_draftsaved($args)
  {
    if ($args['folder'] === $this->rc->config->get('models_mbox'))
    {
        $args['message'] = $this->gettext('model_saved', 'mel_metapage');
    }

    return $args;
  }

    public function hook_message_objects($args)
    {
        $message = $this->rc->storage->get_body($args['message']->uid);

        if (isset($message))
        {
            if ($this->check_message_is_bloqued($message, $args['message']))
                $args['content'][] = '<div class="alert alert-danger boxdanger"><center>Ce message a été bloqué par le Bnum car il contient des liens dangereux.</center></div>';
            else if ($this->check_message_is_suspect($message, $args['message']))
                $args['content'][] = '<div class="alert alert-warning boxwarning">Ce message contient des liens potentiellement dangereux, cliquez sur ces liens seulement si vous êtes sûr de ce que vous faites !</div>';
        }

        return $args;
    }

  public function hook_message_part_get($args)
  {
    
    if ($this->check_message_is_bloqued($args['body'], $args['object']->headers)){
        $args['body'] = '';//"Ce message est bloqué par le Bnum car il contient des liens de phishing !";
    }

    return $args;
  }

  public function hook_messages_list($args)
  {
    // $config = $this->rc->config->get('mel_suspect_url', []);
    // $config_bloqued = $this->rc->config->get('mel_bloqued_url', []);

    // $plugin = $this->rc->plugins->exec_hook('mel_config_suspect_url', ['config' => $config]);
    // $config = $plugin['config'] ?? $config;
    // $plugin = $this->rc->plugins->exec_hook('mel_config_bloqued_url', ['config' => $config_bloqued]);
    // $config_bloqued = $plugin['config'] ?? $config_bloqued;
    

    // foreach ($args['messages'] as $key => $message) {
    //     $message = $this->rc->storage->get_body($message->uid);

    //     if (isset($message))
    //     {
    //         if ($this->check_message_is_bloqued($message, $args['messages'][$key], $config_bloqued)){
    //             $args['messages'][$key]->list_flags['extra_flags']['BLOQUED'] = true;
    //         }
    //         else if ($this->check_message_is_suspect($message, $args['messages'][$key], $config))
    //         {
    //             $args['messages'][$key]->list_flags['extra_flags']['SUSPECT'] = true;
    //         }
    //     }
    // }

    return $args;
  }

  public function check_message_is_suspect_custom($args)
  {
    $args['config'] = array_merge($args['config'], $this->_check_message_is_custom(true));
    return $args;
  }

  public function check_message_is_bloqued_custom($args)
  {
    $args['config'] = array_merge($args['config'], $this->_check_message_is_custom(false));
    return $args;
  }


  private function _check_message_is_custom($isSuspect)
  {
    $array = [];
    $custom = $this->rc->config->get('mel_custom_suspected_url', []);

    foreach ($custom as $url => $datas) {
        if ($isSuspect && $datas['bloqued'] === false) $array[] = $url;
        else if (!$isSuspect && $datas['bloqued'] === true) $array[] = $url;
    }

    return $array;
  }


  /**
   * Vérifie si un message contient une url frauduleuse ou non.
   *
   * @param [*] $message Message à vérifier
   * @param [Array<string>] $config Configuration qui contient la liste des urls à bloquer
   * @return bool Vrai si le message est pas ok, faux sinon.
   */
  private function check_message_is_suspect($message, $rcube_message_header = null, $config = null)
  {
      if (!isset($config)) 
      {
        $config = $this->rc->config->get('mel_suspect_url', []);
        $plugin = $this->rc->plugins->exec_hook('mel_config_suspect_url', ['config' => $config]);
        $config = $plugin['config'] ?? $config;
      }

      $is_suspect = mel_helper::Enumerable($config)->any(function ($k, $v) use($message) {
        if (strpos($message, $v) === false && !mel_helper::parse_url($v)->not_have_path_and_check_base_url($message))
        {
            if (strpos($v, 'http') !== false) $v = str_replace('http', 'https', $v);
            else {
                $v = str_replace('https', 'http', $v);
            }

            return strpos($message, $v) !== false;
        }

        return true;
      });

        if (!$is_suspect)
        {
            $plugin = $this->rc->plugins->exec_hook('mel_check_suspect_url', 
                [
                    'config' => $config,
                    'is_suspect' => $is_suspect,
                    'message' => $message,
                    'header' => $rcube_message_header
                ]);

            if (isset($plugin) && isset($plugin['is_suspect'])) $is_suspect = $plugin['is_suspect'];
        }

      return $is_suspect;
  }

    /**
     * Vérifie si un message contient une url frauduleuse ou non.
     *
     * @param [*] $message Message à vérifier
     * @param [Array<string>] $config Configuration qui contient la liste des urls à bloquer
     * @return bool Vrai si le message est pas ok, faux sinon.
     */
    private function check_message_is_bloqued($message, $rcube_message_header = null, $config = null)
    {
        if (!isset($config)) 
        {
            $config = $this->rc->config->get('mel_bloqued_url', []);
            $plugin = $this->rc->plugins->exec_hook('mel_config_bloqued_url', ['config' => $config]);
            $config = $plugin['config'] ?? $config;
        }

        $is_bloqued = mel_helper::Enumerable($config)->any(function ($k, $v) use($message) {
            if (strpos($message, $v) === false)
            {
                if (strpos($v, 'http') !== false) $v = str_replace('http', 'https', $v);
                else $v = str_replace('https', 'http', $v);

                return strpos($message, $v) !== false;
            }

            return true;
        });

        if (!$is_bloqued)
        {
            $plugin = $this->rc->plugins->exec_hook('mel_check_bloqued_url', 
            [
                'config' => $config,
                'is_bloqued' => $is_bloqued,
                'message' => $message,
                'header' => $rcube_message_header
            ]);

            if (isset($plugin) && isset($plugin['is_bloqued'])) $is_bloqued = $plugin['is_bloqued'];
        }

        return $is_bloqued;
    }


    function contacts_autocomplete_after($args)
    {
        $args['contacts'] = mel_helper::Enumerable($args['contacts'])->removeTwins(function ($k, $v){
            if (strpos($v['name'], '<') !== false) return strtolower($v['name']);
            else return $v;
        })->toArray();
        return $args;
    }

    function is_app_enabled($app, $load_config = false) {
        if ($app === 'chat') $app = 'app_chat';

        if ($load_config) $this->load_config();

        $rcmail = $this->rc ?? rcmail::get_instance();
        $item = $rcmail->config->get('navigation_apps', null);

        if (isset($item)) return $item[$app]['enabled'] ?? true;
        
        return true;
    }

    public static function user_have_cerbere($user)
    {
        $user = mel_helper::load_user_cerbere($user);
        return $user !== null && $user >= 1;
    }

    public function get_have_cerbere()
    {
        echo self::user_have_cerbere(driver_mel::gi()->getUser());
        exit;
    }

    public function comment_mail()
    {
        $folder = rcube_utils::get_input_value('_folder', rcube_utils::INPUT_POST) ?? 'INBOX';
        $message_uid = intval(rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST));
        $comment = rcube_utils::get_input_value('_comment', rcube_utils::INPUT_POST);
        $user_mail = rcube_utils::get_input_value('_user', rcube_utils::INPUT_POST) ?? null;

        $this->rc->storage->set_folder($folder);

        $headers_old = $this->rc->storage->get_message_headers($message_uid, $folder);
        $test = $this->rc->storage->get_raw_body($message_uid);
        if (strpos($test, 'X-Suivimel') !== false)
        {
            $test = explode('X-Suivimel', $test);
            $suivi = explode("\n", str_replace(': ', '', $test[1]))[0];
            $suivi = 'Le '.date('d/m/Y H:i').', '.driver_mel::gi()->getUser(null, true, false, null, $user_mail)->name." a ajouté :¤¤$comment"."¤¤".rcube_mime::decode_header($suivi);
            $test = $test[0].'X-Suivimel: '.Mail_mimePart::encodeHeader('X-Suivimel', $suivi, RCUBE_CHARSET).$test[1];
        }
        else 
        {
            $test = explode('Subject: ', $test);
            $added = false;
            $val = '';
            foreach ($test as $key => $value) {
                if ($value !== $test[0] && $value[(strlen($value) - 1)] === "\n" && !$added) 
                {
                    $val .= 'X-Suivimel: '.Mail_mimePart::encodeHeader('X-Suivimel', "Le ".date('d/m/Y H:i').', '.driver_mel::gi()->getUser(null, true, false, null, $user_mail)->name." a ajouté :¤¤$comment", RCUBE_CHARSET)."\nSubject: ".$value;
                    $added = true;
                }
                else $val .= 'Subject: '.$value;
            }
            $test = $val;

            if ($added === false)
            {
                $test = false;
            }

            //$test = $test[0].'X-Suivimel: '.Mail_mimePart::encodeHeader('X-Suivimel', "Le ".date('d/m/Y H:i').', '.driver_mel::gi()->getUser(null, true, false, null, $user_mail)->name." a ajouté :¤¤$comment", RCUBE_CHARSET)."\nSubject:".$test[1];
        }

        $datas = $this->rc->imap->save_message($folder, $test, '', false, [], $headers_old->date);

        if ($datas !== false)
        {
            $message = new rcube_message($message_uid, $folder);

            foreach ($message->headers->flags as $flag => $value) {
                $this->rc->imap->set_flag($datas, strtoupper($flag), $folder);
            }

            $this->rc->imap->set_flag($datas, "~commente", $folder);
            $this->rc->imap->set_flag($datas, 'SEEN', $folder);
            $this->rc->storage->delete_message($message_uid, $folder);

            echo $datas;
        }
        else echo 'false';

        exit;
    }

    public function on_attendees_notified($args)
    {
        $orga = $args['orga'];
        $attendees = $args['attendees'];
        $message = $args['message'];
        $event = $args['event'];
        $folder = $this->rc->config->get('sent_mbox');
        //balpartagee.test-pne-messagerie

        $to = '';

        foreach ($attendees as $value) {
            $to .= format_email_recipient(rcube_utils::idn_to_ascii($value['email']), $value['name']).', ';
        }

        $to = substr_replace($to, '', -2);

        $headers = $message->headers();
        $headers['To'] = $to;
        $message->headers($headers, true);
        $msg = $message->getMessage();

        if (strpos($orga['email'], '.-.') !== false)
        {
            $tmp = explode('@', explode('.-.', $orga['email'])[1])[0];

            $datas = $this->rc->imap->save_message("Boite partag&AOk-e/$tmp/$folder", $msg);

            if ($datas === false){
                $tmp2 = explode('.', $tmp);
                $tmp = '';
                $it = 0;
                while ($datas === false && $it < count($tmp2)) {
                    $tmp .= $tmp2[$it++];
                    $datas = $this->rc->imap->save_message("Boite partag&AOk-e/$tmp/$folder", $msg);
                    $tmp .= '.';
                }

                if ($datas !== false) $folder = "Boite partag&AOk-e/$tmp/$folder";
            }
        }
        else  $datas = $this->rc->imap->save_message($folder, $msg);

        if ($datas !== false)
        {
            $this->rc->imap->set_flag($datas, "~rdvtraite", $folder);
            $this->rc->imap->set_flag($datas, 'SEEN', $folder);
        }

    }

}