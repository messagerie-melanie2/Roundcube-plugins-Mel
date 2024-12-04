<?php
include_once 'bnum_plugin.php';
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
class mel_metapage extends bnum_plugin
{
    public const FROM_KEY = "_is_from";
    public const FROM_VALUE = "iframe";
    private const TASKS_SETUP_MODULE = ['webconf', 'search'];

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

    private $idendity_cache;
    private $from_message_reading;

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

    public static function add_widget($name, $task, $arg)
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
        $folders = scandir(__DIR__ . "/program");

        foreach ($folders as $folder) {
            if (is_dir(__DIR__ . "/program/" . $folder) && $folder !== '.' && $folder !== '..') {
                if ($folder === 'pages') {
                    $this->init_sub_pages();
                    continue;
                } else if (isset($exception) && is_array($exception) && in_array($folder, $exception)) continue;
                else {
                    $files = scandir(__DIR__ . "/program/" . $folder);

                    foreach ($files as $file) {
                        if (strpos($file, ".php") !== false) {
                            include_once __DIR__ . '/program/' . $folder . '/' . $file;
                        }
                    }
                }
            }
        }

        if (class_exists('Program')) {
            foreach (Program::generate($this->rc, $this) as $submodule) {
                if ($this->rc->task === $submodule->program_task()) {
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
        for ($i = 0; $i < $size; ++$i) {
            if (strpos($files[$i], ".php") !== false && $files[$i] !== "page.php" && $files[$i] !== "parsed_page.php") {
                include_once __DIR__ . "/program/pages/" . $files[$i];
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

        $this->rc->output->set_env('mel_metapage_is_from_iframe', rcube_utils::get_input_value('_is_from', rcube_utils::INPUT_GPC) === 'iframe');

        $this->include_script('js/init/constants.js');
        $this->include_script('js/always_load/mel_event.js');
        // $this->include_script('js/always_load/load_module.js');
        $this->include_script('js/html.js');
        $this->rc->plugins->allowed_prefs[] = 'favorite_folders_collapsed';

        if ($this->rc->config->get('maintenance', false) && ($this->rc->action === 'index' || $this->rc->action === '') && rcube_utils::get_input_value('_is_from', rcube_utils::INPUT_GPC)  !== 'iframe' && $this->rc->task !== "login") {
            $haveMaintenance = rcube_utils::get_input_value('_maintenance', rcube_utils::INPUT_GPC);

            if ($haveMaintenance === null) {
                $this->rc->output->redirect([
                    '_task' => $this->rc->task,
                    '_action' => $this->rc->action,
                    '_maintenance' => 'true'
                ]);
                return;
            } else if ($haveMaintenance === 'true') {
                $this->add_hook("send_page", array($this, "maintenance"));
                return;
            }
        }

        if ($this->rc->task === 'loading') {
            $this->register_task("loading");
            $this->register_action('index', array($this, 'action_loading_frame'));
            return;
        }

        $this->add_hook('logout_after', array($this, 'logout_after'));
        $this->add_hook('preferences_sections_list',    [$this, 'preferences_sections_list']);
        $this->add_hook('preferences_list', array($this, 'prefs_list'));
        $this->add_hook('preferences_save',     array($this, 'prefs_save'));
        $this->add_hook('folder_update',     array($this, 'folder_update'));
        $this->add_hook('rocket.chat.sectionlist',     array($this, 'rc_section_list'));
        $this->add_hook("send_page", array($this, "appendTo"));
        $this->add_hook("message_send_error", [$this, 'message_send_error']);
        $this->add_hook("message_draftsaved", [$this, 'message_draftsaved']);
        $this->add_hook("message_part_structure", [$this, 'hook_message_part_structure']);
        $this->add_hook("message_part_before", [$this, 'hook_message_part_before']);
        $this->add_hook("calendar.on_attendees_notified", [$this, 'on_attendees_notified']);
        $this->add_hook('contact_photo', [$this, 'no_contact_found']);

        if ($this->rc->task === 'settings' && $this->rc->action === "edit-prefs") {
            if (rcube_utils::get_input_value('_section', rcube_utils::INPUT_GPC) === 'globalsearch') $this->include_script('js/actions/settings_gs.js');
            $this->include_script('js/actions/base_settings.js');
        }

        if ($this->rc->task === 'mel_settings') {
            $this->register_task('mel_settings');
            $this->add_hook('metapage.save.option',     array($this, 'hook_save_option'));
            $this->add_hook('metapage.load.option.param',     array($this, 'hook_load_option'));
            $this->add_hook('metapage.load.option',     array($this, 'hook_generate_option'));
            $this->add_hook('metapage.save.option.after', [$this, 'hook_save_option_after']);
            $this->register_action('load', array($this, 'load_option'));
            $this->register_action('save', array($this, 'save_option'));
            $this->register_action('get', array($this, 'get_setting'));
        }

        if ($this->rc->task === "mail") {
            $this->register_action('plugin.mel_metapage.toggle_favorite', array($this, 'toggle_favorite_folder'));
            $this->register_action('plugin.mel_metapage.toggle_display_folder', array($this, 'toggle_display_folder'));
            $this->register_action('plugin.mel_metapage.get_favorite_folders', [$this, 'get_display_folder']);
            $this->register_action('plugin.mel_metapage.set_folder_color', [$this, 'update_color_folder']);
            $this->register_action('plugin.mel_metapage.get_folders_color', [$this, 'get_folder_colors']);
            $this->register_action('plugin.mel_metapage.set_folder_icon', [$this, 'update_icon_folder']);
            $this->register_action('plugin.mel_metapage.get_folders_icon', [$this, 'get_folder_icons']);

            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $delay = true === $this->rc->config->get('mail_delay_forced_disabled') ? 0 : $this->rc->config->get('mail_delay', 5);
                $this->rc->output->set_env("mail_delay", $this->rc->config->get('mail_delay', 5));
                $this->rc->output->set_env("favorite_folders_collapsed", $this->rc->config->get('favorite_folders_collapsed', ''));
                $this->load_metapage_script_module('mails.js');

                unset($delay);
            }

            $this->add_hook('mel_config_suspect_url', [$this, 'check_message_is_suspect_custom']);
            $this->add_hook('mel_config_bloqued_url', [$this, 'check_message_is_bloqued_custom']);
            $this->add_hook("messages_list", [$this, 'hook_messages_list']);
            $this->add_hook('message_part_body_after', [$this, 'hook_message_part_get']);
            $this->add_hook('message_objects', [$this, 'hook_message_objects']);
            $model_mbox = $this->rc->config->get('models_mbox');
            switch ($this->rc->action) {
                case 'compose':
                    $this->include_edited_editor();
                    $this->include_script('js/init/classes.js');
                    $this->include_script('js/init/mel_metapage_utils.js');

                    if ($_COOKIE['current_model_id'] !== null) {
                        $this->rc->output->set_env("is_model", true);
                        $this->rc->output->set_env("model_id", $_COOKIE['current_model_id']);
                    }
                    $this->include_script('js/actions/mail_compose_event.js');
                    break;

                case 'preview':
                case 'show':
                    if (rcube_charset::convert(rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GPC), 'UTF7-IMAP') === $this->rc->config->get('models_mbox')) {
                        $this->rc->output->set_env("is_model", true);
                    }
                    break;

                case '':
                case 'index':
                    $favs = $this->rc->config->get('favorite_folders', []);
                    if (isset($favs[''])) unset($favs['']);

                    $this->rc->output->set_env('favorites_folders', $favs);
                    $this->rc->output->set_env('folders_colors', $this->rc->config->get('folders_colors', []));
                    $this->rc->output->set_env('folders_icons', $this->rc->config->get('folders_icons', []));
                    $this->include_stylesheet($this->local_skin_path() . '/icons_modifier.css');
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
                'id' => 'mel-comment-mail', //tb_label_popup
                'title' => 'mel_metapage.to_comment', // gets translated
                'type' => 'link',
                'label' => 'mel_metapage.to_comment', // maybe put translated version of "Labels" here?
            ), 'toolbar');
        }

        if ($this->rc->task === "portail") {
            $this->rc->output->redirect([
                '_task' => 'bureau',
            ]);
            return;
        }

        $this->rc->output->set_env("plugin.mel_metapage", true); //compose_extwin
        $this->rc->output->set_env("matomo_tracking", $this->rc->config->get("matomo_tracking", false));
        $this->rc->output->set_env("matomo_tracking_popup", $this->rc->config->get("matomo_tracking_popup", false));

        $this->rc->output->set_env("mel_official_domain",  array_merge($this->rc->config->get("mel_official_domain", []), $this->rc->config->get('mel_user_domain', [])));
        $this->rc->output->set_env("mel_suspect_url",  $this->rc->config->get("mel_suspect_url", []));

        //$this->rc->output->set_env("compose_extwin", true);
        $config = $this->rc->config->get("mel_metapage_chat_visible", true);

        if (!$this->is_app_enabled('chat')) $config = false;

        $this->rc->output->set_env("mel_metapage_chat_visible", true);
        $this->rc->output->set_env("mel_metapage_weather_enabled", $this->rc->config->get("enable_weather", false));
        $this->rc->output->set_env('mel_metapage.tab.notification_style', $this->rc->config->get('tab_title_style', 'page'));
        $this->rc->output->set_env('mel_metapage.webconf_voxify_indicatif', $this->rc->config->get('webconf_voxify_indicatif', 'FR'));
        $this->rc->output->set_env("main_nav_can_deploy", $this->rc->config->get('main_nav_can_deploy', true));
        $this->rc->output->set_env("avatar_background_color", $this->rc->config->get('avatar_error_color', null));

        
        $this->rc->output->set_env('mel_metapage_const', [
            "key" => self::FROM_KEY,
            "value" => self::FROM_VALUE
        ]);

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
            $chat_placement => $this->gettext("up", "mel_metapage"),
            $scrollbar_size => $this->gettext("auto", "mel_metapage")
        ]);

        $config[$chat_placement] =  $this->gettext("up", "mel_metapage");

        $this->rc->output->set_env("mel_metapage_mail_configs", $config);
        $this->rc->output->set_env("mel_metapage_audio_url", $this->rc->config->get("audio_event_url", 'https://audio.mtes.fr/'));

        $config = $this->rc->config->get('navigation_apps', null) ?? $this->rc->config->get('template_navigation_apps', null);
        $this->rc->output->set_env("navigation_apps", $config);

        $calendar_space = "mel-calendar-space";

        $config = $this->rc->config->get('mel_calendar_configuration', [
            $calendar_space => $this->gettext("normal", "mel_metapage"),
        ]);
        $this->rc->output->set_env("mel_metapage_calendar_configs", $config);



        $showBackIcon = 'param-show-back-icon';
        $this->rc->output->set_env("menu_last_frame_enabled", $this->rc->config->get($showBackIcon, false));

        if (rcube_utils::get_input_value('_accept_back', rcube_utils::INPUT_GET) === "true" || rcube_utils::get_input_value('_accept_back', rcube_utils::INPUT_GET) === true)
            $this->rc->output->set_env("accept_back", true);

        if ($this->rc->task !== "login" && $this->rc->task !== "logout")
            $this->include_script('js/actions/calendar_event.js');

        if ($this->rc->task === "mail" && $this->rc->action === "compose") {
            $this->rc->output->set_env("compose_option", rcube_utils::get_input_value('_option', rcube_utils::INPUT_GET));
        }

        self::add_url_spied($this->rc->config->get("web_conf"), 'webconf');

        if ((rcube_utils::get_input_value('_framed', rcube_utils::INPUT_GET) === "1"
            || rcube_utils::get_input_value('_extwin', rcube_utils::INPUT_GET) === "1") && rcube_utils::get_input_value('_is_from', rcube_utils::INPUT_GET) !== 'iframe') {
            $this->include_internal_and_external_buttons();
            $this->include_stylesheet($this->local_skin_path() . '/modal.css');
            $this->include_script('js/init/events.js');
            $this->include_script('js/init/commands.js');
            $this->include_script('js/init/classes/addons/array.js');
            $this->add_hook("startup", array($this, "send_spied_urls"));
            return;
        }

        if ($this->rc->task !== "login" && $this->rc->task !== "logout")
            $this->startup();
        else {
            $this->include_script('js/init/classes.js');
            $this->include_script('js/init/mel_metapage_utils.js');
        }
        //m2_get_account
        $this->add_hook("m2_get_account", array($this, "m2_gestion_cache"));

        if ($this->rc->task !== "login" && $this->rc->task !== "logout" && $this->rc->config->get('skin') == 'mel_elastic' && $this->rc->action !== "create_document_template" && $this->rc->action !== "get_event_html" && empty($_REQUEST['_extwin'])) {
            $courielleur = rcube_utils::get_input_value('_courrielleur', rcube_utils::INPUT_GET) ?? true;
            if ($courielleur === '') $courielleur = true;
            else if ($courielleur !== true) $courielleur = false;
            $from_cour = rcube_utils::get_input_value('_redirected_from_courrielleur', rcube_utils::INPUT_GET);
            if ($_SERVER['REQUEST_METHOD'] == 'GET' && $this->rc->task !== 'bnum' && ('' === $this->rc->action || 'index' === $this->rc->action || !!rcube_utils::get_input_value('_force_bnum', rcube_utils::INPUT_GET)) && rcube_utils::get_input_value('_is_from', rcube_utils::INPUT_GET) !== 'iframe' && $courielleur) {
                $this->rc->output->redirect([
                    '_task' => 'bnum',
                    '_action' => '',
                    '_initial_request' => $_SERVER["REQUEST_URI"],
                    '_initial_task' => $this->rc->task,
                    '_initial_action' => (!!rcube_utils::get_input_value('_force_bnum', rcube_utils::INPUT_GET) ? $this->rc->task : null)
                ]);
                exit;
            } else if (!$courielleur && !isset($from_cour)) {
                $courielleur = str_ireplace('://', '¤¤', $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] . '&_redirected_from_courrielleur=1');
                $courielleur = str_ireplace('//', '/', $courielleur);
                $courielleur = str_ireplace('¤¤', '://', $courielleur);

                if (strpos($courielleur, '&_is_from=iframe') === false) $courielleur .= '&_is_from=iframe';
                //$courielleur = str_ireplace('_courrielleur', '_redirected_from_courrielleur', $courielleur);
                $this->rc->output->header('Location: ' . $courielleur);
                exit;
            }

            try {
                if ($this->rc->task === 'bnum' || $this->rc->task === 'search') {
                    if (in_array($this->rc->task, self::TASKS_SETUP_MODULE)) $this->setup_module();
                    else $this->load_js_modules_actions();

                    if ($this->rc->task === 'bnum') {
                        $this->load_metapage_script_module('bnum.js');
                        $this->include_script_frame_manager();
    
                        include_once __DIR__."/program/classes/metrics.php";
                        (new MetricsConfigData($this))->send_to_env();
                    }
                }
            } catch (\Throwable $th) {
                //throw $th;
            }

            if (isset($from_cour)) $this->rc->output->set_env("_courielleur", $from_cour);

            unset($courielleur);
            unset($from_cour);

            // if ('GET' == $_SERVER['REQUEST_METHOD']) {
            //     $this->rc->output->set_env('loading_picture_mode',  $this->rc->config->get('picture-mode', true));
            // }

            $this->rc->output->set_env("plugin.mel_metapage", true);
            $this->rc->output->set_env("username", $this->rc->user->get_username());
            //$this->include_depedencies();

            $this->mm_include_plugin();
            //$this->rc->get_storage();
            /*if ($this->rc->task === "webconf" && $this->visio_enabled())
                $this->register_task("webconf");
            else*/ if ($this->rc->task === 'search')
                $this->register_task("search");
            else if ($this->rc->task === "chat")
                $this->register_task("chat");
            else if ($this->rc->task === "questionswebconf") {
                $this->register_task("questionswebconf");
                $this->register_action('index', array($this, 'redirectToWebconf'));
                $this->register_action('loading', array($this, 'loadingFrame'));
            } else if ($this->rc->task === "questionswebconf")
                $this->register_task("questionswebconf");
            else if ($this->rc->task === "custom_page")
                $this->register_task("custom_page");
            else if ($this->rc->task === "rotomecatest")
                $this->register_task("rotomecatest");
            else if ($this->rc->task === "bnum")
                $this->register_task("bnum");
            else
                $this->register_task("mel_metapage");

            if ($this->rc->action === "chat" || $this->rc->task === "chat") {
                $this->include_script('js/actions/ariane.js');
                $this->register_action('logout', array($this, 'chat_logout'));
            }

            if ($this->rc->task === "calendar") {
                $this->rc->output->set_env("calendar_custom_dialog", true);

                if ($this->rc->action === '' || $this->rc->action === 'index') {
                    $this->load_script_module('main', '/js/lib/calendar/');
                }
            }

            if ($this->rc->task === "rotomecatest") {
                $this->setup_module();
                $this->register_action('index', array($this, 'debug_and_test'));
            }

            if ($this->rc->task === "bnum") {
                $this->include_script('js/secondary-nav.js');
                $this->register_action('index', array($this, 'bnum_page'));
            } else {
                $this->set_plugin_env_exist();
            }

            //$this->rc->output->set_env('navigation_apps', $this->rc->config->get('navigation_apps', null));

            if (class_exists('mel_nextcloud')) {
                //$this->rc->plugins->get_plugin('mel_helper')->include_js_debug();
                $this->rc->output->set_env("is_stockage_active", mel_helper::stockage_active());
                $this->rc->output->set_env("have_0_quota", self::have_0_quota());
                $this->rc->output->set_env("why_is_not_active", [
                    "consts" => [
                        "ST_NO_DOUBLE_AUTH" => mel_helper::ST_NO_DOUBLE_AUTH,
                        "ST_NO_RIGHTS" => mel_helper::ST_NO_RIGHTS,
                        "ST_ACTIVE" => mel_helper::ST_ACTIVE
                    ],
                    "value" => mel_helper::why_stockage_not_active()
                ]);
            }

            if (class_exists('rocket_chat')) {
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
            $this->register_action('calendar_load_events', [$this, 'calendar_load_events']);
            $this->register_action('save_user_pref_domain', array($this, 'save_user_pref_domain'));
            $this->add_hook('refresh', array($this, 'refresh'));
            $this->add_hook("startup", array($this, "send_spied_urls"));
            //$this->add_hook('contacts_autocomplete_after', [$this, 'contacts_autocomplete_after']);
            if ($this->rc->task === 'settings' && rcube_utils::get_input_value('_open_section', rcube_utils::INPUT_GET) !== null) $this->add_hook('ready', array($this, 'open_section'));
            
            $this->rc->output->set_env("webconf.base_url", $this->rc->config->get("web_conf"));

            $user = driver_mel::gi()->getUser();
            $user->load();
            $this->rc->output->set_env('current_user', [
                'name' => $user->firstname,
                'lastname' => $user->lastname,
                'full' => $user->fullname,
                'email' => $user->email
            ]);

            //            $this->include_script('js/actions/startup.js');
            if (rcube_utils::get_input_value(self::FROM_KEY, rcube_utils::INPUT_GET) !== self::FROM_VALUE) {
                $this->include_script('js/actions/startup.js');
            } else {
                // $this->include_script('js/actions/startup.js');
                $this->rc->output->set_env("melframed", true);
                try {
                    $this->rc->output->set_env("mmp_modal", $this->rc->output->parse("mel_metapage.mel_modal", false, false));
                } catch (\Throwable $th) {
                    //throw $th;
                }
            }

            $this->add_hook("send_page", array($this, "generate_html")); //$this->rc->output->add_header($this->rc->output->parse("mel_metapage.barup", false, false));
        } else if (
            $this->rc->task == 'logout'
            || $this->rc->task == 'login'
        ) {
            // Include javascript files
            $this->include_script('js/actions/logout.js');
            $this->include_script('js/actions/login.js');

            $tmp_maint_text = $this->get_maintenance_text();
            if ($tmp_maint_text !== '') $this->rc->output->set_env("maintenance_text", $tmp_maint_text);

            $this->rc->output->add_handlers(array(
                'login_doc_message'    => [$this, '_login_doc_message'],
            ));
        } else if ($this->rc->action === "create_document_template") {
            $this->add_texts('localization/', true);
            $this->load_config();
            $this->register_task("mel_metapage");
            $this->register_action('create_document_template', array($this, 'get_create_document_template'));
        } else if ($this->rc->action === "get_event_html") {
            $this->add_texts('localization/', true);
            $this->load_config();
            $this->register_task("mel_metapage");
            $this->register_action('get_event_html', array($this, 'get_event_html'));
        } else if ($this->rc->action === "get_create_workspace") {
            $this->add_texts('localization/', true);
            $this->load_config();
            $this->register_task("mel_metapage");
            $this->register_action('get_create_workspace', array($this, 'create_workspace_html'));
        }

        else if ($this->rc->task === 'mail') {
            $this->include_internal_and_external_buttons();
        }

        if ($this->rc->task === "calendar" || ($this->rc->task === "mel_metapage" && $this->rc->action === "dialog-ui")) {
            $this->add_hook("send_page", array($this, "parasite_calendar"));
        }

        if ($this->rc->task === "settings" && $this->rc->action === "plugin.mel_suggestion_box") {
            $this->include_script('js/actions/settings_events.js');
            $this->rc->output->set_env("customUid", rcube_utils::get_input_value('_uid', rcube_utils::INPUT_GET));
        }

        if ($this->task === 'settings' && $this->action === 'edit-folder') {
            $this->settings_edit_folder_bnum_action();
            $this->add_hook('folder_form', [$this, 'folder_form']);
        }

        if ($this->rc->task === 'mel_metapage') {
            $this->register_action('avatar', [$this, 'avatar_url']);
            $this->register_actions([
                'webcomponent_scroll_count' => [$this, 'infiniteScrollCount'],
                'webcomponent_scroll_data' => [$this, 'infiniteScrollData']
            ]);
        }

        $this->add_hook('folder_form', [$this, 'folder_form']);
        $this->add_hook('folder_create', [$this, 'folder_create']);
    }

    private function settings_edit_folder_bnum_action()
    {
        $this->rc->output->add_handlers(array(
            'bnumfolderperso'    => '_edit_folder_hack',
        ));
    }

    private function _edit_folder_hack($attrib)
    {
        $html = html::div(
            array('class' => 'bnumfolderperso'),
            html::div(['id' => 'folder-edit-custom-color']),
            html::div(['id' => 'folder-edit-custom-icon'])
        );

        return $html;
    }

    function folder_form($args)
    {
        $args['form']['props']['fieldsets']['color'] = [
            'name' => 'Couleur du dossier',
            'content' => [
                'color' => [
                    'label' => 'Couleur du dossier',
                    'value' => '<input type="color" title="Laissez pour avoir la couleur par défaut !" name="_color" id="folder-edit-color" value="">'
                ]
            ]
        ];

        return $args;
    }

    function folder_create($args)
    {
        $color = rcube_utils::get_input_value('_color', rcube_utils::INPUT_POST);

        if ($color === '#000000' || $color === '#000' || $color === '#0' || $color === '') $color = null;

        $_POST['_color'] = $color;
        $_POST['_folder'] = $args['record']['name'];
        $_POST['_color_break'] = true;

        $this->update_color_folder();

        return $args;
    }

    function load_js_modules_actions()
    {
        $save_in_memory = true;
        //$not_save_in_memory = true;
        $this->load_metapage_script_module('notes.js', $save_in_memory);
        $this->load_metapage_script_module('calendar.js');
    }

    protected function load_metapage_script_module($name, $save_in_memory = false)
    {
        return $this->load_script_module($name, '/js/lib/metapages_actions/', $save_in_memory);
    }

    /**
     * Fonction js appelé au refresh de roundcube.
     */
    public function refresh()
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
        $this->include_script('js/init/mel_metapage_utils.js');
        $this->include_script('js/init/events.js');
        $this->include_script('js/init/commands.js');
        $this->load_config_js();
    }

    function get__init_js_from_folder($folder)
    {
        $files = scandir(__DIR__ . "/js/init/$folder");
        $size = count($files);
        for ($i = 0; $i < $size; ++$i) {
            if (strpos($files[$i], ".min.js") !== false)
                continue;
            else if (strpos($files[$i], ".js") !== false)
                $this->include_script("js/init/$folder/" . $files[$i]);
            else if ($files[$i] === "." || $files[$i] === ".." || strpos($files[$i], ".") !== false)
                continue;
            else {
                $folderFiles = scandir(__DIR__ . "/js/init/$folder/" . $files[$i]);
                $folderSize = count($folderFiles);
                for ($j = 0; $j < $folderSize; ++$j) {
                    if (strpos($folderFiles[$j], ".js") !== false && strpos($folderFiles[$j], ".min.js") === false)
                        $this->include_script("js/init/$folder/" . $files[$i] . "/" . $folderFiles[$j]);
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
        $this->rc->action === 'search')*/)) {
            mel_helper::clear_folders_cache($this->rc);
        }
    }

    public function include_edited_editor()
    {
        $this->include_script('js/actions/editor-dark-mode.js');
        return $this;
    }

    private function include_internal_and_external_buttons()
    {
        $this->add_button(array(
            'command' => "new-mail-from",
            // 'href' => './?_task=mail&_action=compose',
            'class'    => 'compose mel-new-compose options rcm-active',
            'classsel' => 'compose mel-new-compose options rcm-active',
            'innerclass' => 'inner',
            'label'    => 'mel_metapage.new-mail-from',
            'title' => 'Composer un email',
            'type'       => 'link-menuitem',
        ), "messagemenu");
    }

    function mm_include_plugin()
    {
        $this->include_internal_and_external_buttons();
        $this->add_button(array(
            'command' => 'last_frame',
            'href' => '?_task=last_frame',
            'class'    => 'disabled icon-mel-last-frame menu-last-frame',
            'classsel' => 'icon-mel-last-frame menu-last-frame menu-last-frame-selected',
            'innerclass' => 'inner',
            'label'    => 'mel_metapage.last_frame_opened',
            'title' => 'Retour à la page précédente',
            'type'       => 'link',
        ), "taskbar");

        $this->add_button(array(
            'command' => 'more_options',
            'href' => '',
            'class'    => 'icon-mel-dots more-options',
            'classsel' => 'icon-mel-dots more-options',
            'innerclass' => 'inner',
            'label'    => 'mel_metapage.my_apps',
            'title' => 'Toutes mes applications',
            'type'       => 'link',
        ), "taskbar");



        $this->add_button(array(
            'command' => "mel-compose",
            'href' => './?_task=mail&_action=compose',
            'class'    => 'compose options',
            'classsel' => 'compose options',
            'innerclass' => 'inner',
            'label'    => 'compose',
            'title' => 'Composer un email',
            'type'       => 'link',
        ), "listcontrols");

        $this->add_button(array(
            'command' => "event-compose",
            // 'href' => './?_task=mail&_action=compose',
            'class'    => 'compose mel-event-compose options',
            'classsel' => 'compose mel-event-compose options',
            'innerclass' => 'inner',
            'label'    => 'mel_metapage.event-compose',
            'title' => 'Composer un email',
            'type'       => 'link-menuitem',
        ), "events-options-containers");

        $this->add_button(array(
            'command' => "event-self-invitation",
            // 'href' => './?_task=mail&_action=compose',
            'class'    => 'export mel-event-self-invitation options',
            'classsel' => 'export mel-event-self-invitation options',
            'innerclass' => 'inner',
            'label'    => 'mel_metapage.event-self-invitation',
            'title' => '',
            'type'       => 'link-menuitem',
        ), "events-options-containers");

        $this->add_button(array(
            'command' => "event-self-copy",
            // 'href' => './?_task=mail&_action=compose',
            'class'    => 'copy mel-event-copy options',
            'classsel' => 'copy mel-event-copy options',
            'innerclass' => 'inner',
            'label'    => 'mel_metapage.copy_w_p',
            'title' => '',
            'type'       => 'link-menuitem',
        ), "events-options-containers");

        $this->add_button(array(
            'command' => "mail-force-refresh",
            // 'href' => './?_task=mail&_action=compose',
            'class'    => 'refresh mel-event-compose options active',
            'classsel' => 'refresh mel-event-compose options active',
            'innerclass' => 'inner',
            'label'    => 'mel_metapage.force-refresh',
            'title' => '',
            'type'       => 'link-menuitem',
        ), "mailboxoptions");

        $this->add_button(array(
            'command'    => 'custom_taskbar',
            'class'      => 'icon-mel-custom_taskbar li-bottom-icon',
            'classsel'   => 'icon-mel-custom_taskbar button-selected',
            'innerclass' => 'button-inner',
            'label'      => 'mel_metapage.custom_taskbar',
            'type'       => 'link'
        ), "settingsotherappsbar");

        // MANTIS 0006453: Simplifier le déplacement de mails dans un autre dossier IMAP
        if ($this->rc->task == 'mail') {
            $this->add_button(array(
                'command'       => 'move',
                'class'            => 'move disabled simplified',
                'classact'      => 'move simplified',
                'classsel'      => 'move simplified',
                'label'            => 'move',
                'title'         => 'moveto',
                'innerclass'    => 'inner',
                'aria-haspopup' => 'true',
                'type'          => 'link',
            ), "toolbar");

            $this->add_button(array(
                'command'       => 'set-favorite-folder',
                'class'            => 'favorite folder-to disabled',
                'classact'      => 'favorite folder-to active',
                'classsel'      => 'favorite folder-to active',
                'label'            => 'set-to-favorite',
                'title'         => 'set-to-favorite',
                'innerclass'    => 'inner',
                'type'          => 'link-menuitem',
            ), "mailboxoptions");

            $this->add_button(array(
                'command'       => 'update-color-folder',
                'class'            => 'color-folder disabled',
                'classact'      => 'color-folder active',
                'classsel'      => 'color-folder active',
                'label'            => 'mel_metapage.update-color-folder',
                'title'         => 'mel_metapage.update-color-folder',
                'innerclass'    => 'inner',
                'type'          => 'link-menuitem',
            ), "mailboxoptions");

            $this->add_button(array(
                'command'       => 'cancel-color-folder',
                'class'            => 'cancel-color-folder disabled',
                'classact'      => 'cancel-color-folder active',
                'classsel'      => 'cancel-color-folder active',
                'label'            => 'mel_metapage.cancel-color-folder',
                'title'         => 'mel_metapage.cancel-color-folder',
                'innerclass'    => 'inner',
                'type'          => 'link-menuitem',
            ), "mailboxoptions");

            $this->add_button(array(
                'command'       => 'update-icon-folder',
                'class'            => 'icon-folder disabled',
                'classact'      => 'icon-folder active',
                'classsel'      => 'icon-folder active',
                'label'            => 'mel_metapage.update-icon-folder',
                'title'         => 'mel_metapage.update-icon-folder',
                'innerclass'    => 'inner',
                'type'          => 'link-menuitem',
            ), "mailboxoptions");
        }

        //listcontrols
        $this->include_depedencies();
        $this->include_metapage_css();
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
        if ($this->get_current_task() === 'logout' || $this->get_current_task() === 'login') return $args;

        if (strpos($args["content"], '<html lang="fr" class="iframe') !== false) {
            $args["content"] = $this->from_iframe($args["content"]);
            return $args;
        }
        if (strpos($args["content"], '<body class="iframe') !== false || strpos($args["content"], '<framed_item>') !== false) {
            $args["content"] = $this->from_iframe($args["content"]);
            return $args;
        }
        if (rcube_utils::get_input_value(self::FROM_KEY, rcube_utils::INPUT_GET) === self::FROM_VALUE) {
            $args["content"] = $this->from_iframe($args["content"]);
            $args["content"] = $this->add_html($args["content"]);
        } else {
            $tmp = explode('<div id="layout">', $args["content"]);
            // $args["content"] = '';
            $args["content"] = $tmp[0] . $this->rc->output->parse("mel_metapage.mel_modal", false, false) . '<div id="layout"><header role="banner">' . $this->rc->output->parse("mel_metapage.barup", false, false) . $tmp[1];
            // $tmp = explode("</header>", $args["content"]);
            // $args["content"] = $tmp[0].'</header><main role="main">'.$tmp[1];
            // $tmp = explode("</body>", $args["content"]);
            // $args["content"] = $tmp[0].'</main></body>'.$tmp[1];

            if (strpos($args["content"], '<user/>') !== false)
                $args["content"] = str_replace("<user/>", $this->rc->output->parse("mel_metapage.user", false, false), $args["content"]);

            if (strpos($args["content"], '<option/>') !== false)
                $args["content"] = str_replace("<option/>", $this->rc->output->parse("mel_metapage.option", false, false), $args["content"]);

            $args["content"] = $this->add_html($args["content"]);
        }
        return $args;
    }

    function appendTo($args)
    {
        if (strpos($args['content'], '/scriptType:module"') !== false){
            $args["content"] = str_replace('/scriptType:module"', '?v='.Version::VERSION.'.'.Version::BUILD.'" type="module"', $args["content"]);
        }

        if (strpos($args['content'], '﻿') !== false) $args['content'] = str_replace('﻿', '', $args['content']);

        if (strpos($args["content"], '<div id="layout">') === false)
            return $args;

        $tmp = explode('<div id="layout">', $args["content"]);
        $args["content"] = $tmp[0] . '<div id="layout">' . $this->rc->output->parse("mel_metapage.custom_options", false, false) . $tmp[1];

        return $args;
    }

    function maintenance($args)
    {
        $args["content"] = $this->rc->output->parse("mel_metapage.maintenance", false, false);
        return $args;
    }


    function parasite_calendar($args)
    {
        $content = $args["content"];
        $pos = strpos($content, '<div id="eventedit"');
        if ($pos !== false) {
            require_once(__DIR__ . "/../calendar/lib/calendar_ui.php");
            $size = strlen($content);
            $textToReplace = "";
            $final_start = false;
            $tmp = "";
            $final_div = 0;
            for ($i = $pos; $i < $size; ++$i) {
                if ($final_div >= 2)
                    break;
                $textToReplace .= $content[$i];
                if (!$final_start && strpos($textToReplace, '<div id="edit-internallocalchanges-warning"') !== false) {
                    $final_start = true;
                }
                if ($final_start) {
                    $tmp .= $content[$i];
                    if (strpos($tmp, '</div>') !== false) {
                        $tmp = "";
                        ++$final_div;
                    }
                }
            }
            if ($textToReplace !== "") {
                $ui = new calendar_ui($this);
                $ui->init_templates();
                $w = function () {
                    // Metapage sans workspace
                    if (class_exists("mel_workspace")) {
                        // $wsp = $this->rc->plugins->get_plugin("mel_workspace");
                        // $wsp->load_workspaces();
                        $workspaces = mel_helper::Enumerable(mel_workspace::LoadWorkspaces())->orderBy(function ($k, $v) {
                            return $v->title;
                        });
                    } else {
                        $workspaces = [];
                    }

                    $html = '<select id=wsp-event-all-cal-mm class="form-control input-mel">';
                    $html .= "<option value=\"#none\">" . $this->gettext('none') . "</option>";
                    foreach ($workspaces as $key => $value) {
                        $html .= '<option value="' . $value->uid . '">' . $value->title . '</option>';
                    }
                    $html .= "</select>";
                    return $html;
                };
                $categories = function () {
                    $values = driver_mel::gi()->getUser($username)->getDefaultPreference("categories");
                    $values = (isset($values) ? explode("|", $values) : []);
                    sort($values);

                    $html = '<select id=categories-event-all-cal-mm class="form-control input-mel">';
                    $html .= "<option value=\"#none\">" . $this->rc->gettext("nothing", "mel_metapage") . "</option>";
                    foreach ($values as $key => $value) {
                        if ($value[0] === "w" && $value[1] === "s" && $value[2] === "#")
                            continue;
                        $html .= '<option value="' . $value . '">' . $value . '</option>';
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
    function add_html($content)
    {
        if (strpos($content, "<adressbook-options/>") !== false) {
            $content = str_replace('<adressbook-options/>', "", $content);
            $var = '<ul id="directorylist"';
            $tmp = explode($var, $content);
            $size = strlen($tmp[1]);
            $index = -1;
            $text = "";
            for ($i = 0; $i < $size; ++$i) {
                if (strpos($text, "</ul></div>") !== false) {
                    $index = $i - 6;
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
            return $tmp[0] . $var . $temp;
        } else
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
        $url = "?_task=addressbook&_framed=1&_cid=" . $id . "&_action=show&_source=" . $source;
        $this->rc->output->set_env("contact_url", $url);
        $this->include_script('js/init/mel_metapage_utils.js');
        $this->include_script('js/init/commands.js');
        $this->include_script('js/actions/set_iframe_contact.js');
        $this->rc->output->send("mel_metapage.contact");
    }

    /**
     * Vérification si les utilisateurs existent dans l'annuaire
     * 
     * @return json ["unexist", "externs", "added"]
     */
    function check_users()
    {
        $users = rcube_utils::get_input_value("_users", rcube_utils::INPUT_POST);
        $unexisting_users = [];
        $externs_users = [];
        $added_users = [];
        foreach ($users as $key => $value) {
            $value = trim($value, ',');
            $tmp = driver_mel::gi()->getUser(null, true, false, null, $value);

            if ($tmp->uid === null && !$tmp->is_list) {
                if (rcmail::get_instance()->config->get('enable_external_users', false)) {
                    $externs_users[] = [
                        "name"  => $this->gettext('external_user_name'),
                        "uid"   => $value,
                        "email" => $value,
                        "title" => $this->gettext('external_user_title'),
                    ];
                } else {
                    $unexisting_users[] = $value;
                }
            } else {
                $added_users[] = [
                    "name" => $tmp->name,
                    "uid" => ($tmp->is_list ? $value : $tmp->uid),
                    "email" => $value
                ];
            }
        }
        echo json_encode(["unexist" => $unexisting_users, "externs" => $externs_users, "added" => $added_users]);
        exit;
    }

    function ariane()
    {

        $chat_action = rcube_utils::get_input_value('_params', rcube_utils::INPUT_GET);

        if ($chat_action !== null)
            $this->rc->output->set_env('chat_go_action', $chat_action);

        $this->rc->output->send("mel_metapage.ariane");
    }

    public static function stockage_is_active()
    {
        return mel_helper::load_helper(rcmail::get_instance())->why_stockage_not_active() === 'active';
    }

    public static function have_0_quota($user = null)
    {
        $user = $user ?? driver_mel::gi()->getUser();
        $user->load(['mdrive_quota']);
        return isset($user->mdrive_quota) && $user->mdrive_quota == 0;
    }

    function create_workspace_html()
    {
        $parsed = $this->rc->output->parse("mel_metapage.create_workspace", false, false);
        echo $parsed;
        exit;
    }

    /**
     * Récupère le css utile pour ce plugin.
     */
    function include_metapage_css()
    {
        // Ajout du css
        $this->include_stylesheet($this->local_skin_path() . '/barup.css');
        $this->include_stylesheet($this->local_skin_path() . '/modal.css');
        $this->include_stylesheet($this->local_skin_path() . '/global.css');
        $this->include_stylesheet($this->local_skin_path() . '/user.css');
        $this->include_stylesheet($this->local_skin_path() . '/option.css');
    }

    function load_config_js()
    {

        //$this->include_script('js/search.js');
        $files = scandir(__DIR__ . "/js/configs");
        $size = count($files);
        for ($i = 0; $i < $size; ++$i) {
            if (strpos($files[$i], ".js") !== false)
                $this->include_script('js/configs/' . $files[$i]);
        }
    }

    /**
     * Récupère le js utile pour ce plugin.
     */
    function include_js()
    {
        //$this->include_script('js/search.js');
        $files = scandir(__DIR__ . "/js");
        $size = count($files);
        for ($i = 0; $i < $size; ++$i) {
            if (strpos($files[$i], ".js") !== false && strpos($files[$i], "html.js") === false)
                $this->include_script('js/' . $files[$i]);
        }
        //if ($this->rc->task === "calendar" || ($this->rc->task === "mel_metapage" && $this->rc->action === "dialog-ui"))

        if ($this->rc->task === "tasks")
            $this->include_script('js/actions/task_event.js');
        else if ($this->rc->task === "mail") {
            $this->include_script('js/actions/mail_search.js');
        } else if ($this->rc->task === "addressbook")
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
            $tmp[$it++] = (new SearchConfig($value))->get()->url(); //$value->url();
        }
        $this->rc->output->set_env('mm_search_config', $tmp);
        $this->rc->output->set_env('mel_metapage_ariane_button_config', $this->rc->config->get("pop_up_ariane"));
        $this->rc->output->set_env('REPLACED_SEARCH', ASearch::REPLACED_SEARCH);
        $this->rc->output->set_env('mel_metapage_templates_doc', $this->rc->config->get('documents_types'));
        $this->rc->output->set_env('mel_metapage_templates_models', $this->rc->config->get('documents_models'));
        $this->rc->output->set_env('mel_metapage_templates_services', $this->rc->config->get('workspace_services'));

        $icons_files = scandir(__DIR__ . "/skins/mel_elastic/pictures/dwp_icons");
        if ($icons_files !== false) {
            $icons = [];
            foreach ($icons_files as $key => $value) {
                if ($value === "." || $value === "..")
                    continue;
                $icons[] = ["name" => $value, "path" => "plugins/mel_metapage/skins/mel_elastic/pictures/dwp_icons/" . $value];
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
        $value;
        $mbox_name = 'INBOX';

        $value = $this->rc->get_storage()->count($mbox_name, 'UNSEEN', true);
        if (!is_array($_SESSION['unseen_count'])) {
            $_SESSION['unseen_count'] = array();
        }

        $_SESSION['unseen_count'][$mbox_name] = $count;


        echo $value;
        exit;
    }

    public function get_wsp_unread_mails_count()
    {
        // Metapage sans workspace
        if (class_exists("mel_workspace")) {
            // $wsp = $this->rc->plugins->get_plugin("mel_workspace");
            // $wsp->load_workspaces();
            $workspaces = mel_workspace::LoadWorkspaces();//$wsp->workspaces;
        } else {
            $workspaces = [];
        }

        $datas = [];

        $msgs = $this->rc->get_storage()->list_messages();
        $msize = count($msgs);

        $search = "ALL UNSEEN ";
        $or = "";
        $lines = "";

        $first = true;
        $annuaire_exists = false;
        //$annuaires = [];
        foreach ($workspaces as $value) {

            try {
                $mail = mel_workspace::get_wsp_mail($value->uid);

                $annuaire_exists = $wsp->get_object($value, mel_workspace::GROUP);
                //$annuaires[$value->uid] = $annuaire_exists;
                if ($annuaire_exists) {
                    if ($mail === null) continue;

                    $lines .= "OR OR HEADER TO $mail HEADER CC $mail HEADER BCC $mail "; // HEADER BCC $before".$value->uid."$after ";
                    if ($first)
                        $first = false;
                    else
                        $or .= "OR ";
                }
            } catch (\Throwable $th) {
                //$annuaires[$value->uid] = $th->getMessage();
            }
        }

        $search .= $or . $lines;

        $input = rcube_utils::get_input_value('_q', rcube_utils::INPUT_GET);
        if ($input !== null && $input !== "")
            $search = $input;

        if ($search !== "ALL UNSEEN ") {

            $tmp = $this->rc->get_storage()->search(null, $search, RCUBE_CHARSET, "arrival")->get();

            foreach ($tmp as $key => $value) {
                $result = $this->mail_where($value, $msgs, $msize);

                if ($result !== false) {
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
            if (strpos($mail, "edt.") !== false) {
                $espace = explode("@i-carre.net", explode("edt.", $mail)[1])[0];
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
        $this->rc->get_storage()->set_folder($folder);

        $folders;

        $max_size_page = $this->rc->config->get('search_mail_max', 9999);

        if ($isInbox) {
            $search_on_all_bali_folders = 'search_on_all_bali_folders';
            $search_on_all_bali_folders_config = $this->rc->config->get($search_on_all_bali_folders, true);
            $folders = $this->rc->get_storage()->list_folders_subscribed('', '*', 'mail');

            if (!$search_on_all_bali_folders_config) {
                $folders_datas = $this->rc->config->get('global_search_bali_folders_configs', []);

                foreach ($folders as $index => $_folder) {
                    $_folder = rcube_charset::convert($_folder, 'UTF7-IMAP');
                    $_folder = str_replace('INBOX', 'Courrier entrant', $_folder);

                    if (!($folders_datas[$_folder] ?? true)) unset($folders[$index]);
                }
            }

            $max_size_page *= count($folders);
            if ($max_size_page > 9999) $max_size_page = 9999;
        } else {
            $search_on_all_bal = 'search_on_all_bal';
            $search_on_all_bal_config = $this->rc->config->get($search_on_all_bal, true);

            if (!$search_on_all_bal_config) {
                $balps = $this->rc->config->get('global_search_balp_configs', []);

                $current_balp_id = driver_mel::gi()->getUser()->uid . '.-.' . explode('/', $folder)[1];

                if (!($balps[$current_balp_id] ?? true)) {
                    echo json_encode([]);
                    exit;
                }
            }

            $folders = $folder;
        }

        $this->rc->get_storage()->set_pagesize($max_size_page);

        $search = $this->rc->get_storage()->search($folders, "OR HEADER FROM " . $input . " HEADER SUBJECT " . $input, RCUBE_CHARSET, "arrival");
        $msgs = $this->rc->get_storage()->list_messages($folder);

        foreach ($msgs as $key => $value) {
            $retour[] = $value;
        }

        $datas = SearchResultMail::create_from_array($retour, $this)->get_array($this->gettext("mails") . "/$folder");
        if ($called) {
            echo rcube_output::json_serialize($datas);
            exit;
        } else return $datas;
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
        for ($i = 0; $i < $size; ++$i) {
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
        if ($called) {
            echo rcube_output::json_serialize($datas);
            exit;
        } else return $datas;
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
        $w = function () {
            // Metapage sans workspace
            if (class_exists("mel_workspace")) {
                // $wsp = $this->rc->plugins->get_plugin("mel_workspace");
                // $wsp->load_workspaces();
                $workspaces = mel_workspace::LoadWorkspaces();//$wsp->workspaces;
            } else {
                $workspaces = [];
            }

            $html = '<select class="form-control input-mel">';
            $html .= "<option value=none>" . $this->gettext('none') . "</option>";
            foreach ($workspaces as $key => $value) {
                $html .= '<option value="' . $value->uid . '">' . $value->title . '</option>';
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
        for ($i = 0; $i < $size; ++$i) {
            $html .= '<button class="btn btn-mel-block btn-secondary btn-mel" onclick="m_mp_UpdateCreateDocument({ext:`' + $templates[$i]['defautl_ext'] + '`, type:`' + $templates[$i]['type'] + '`})"><span class="' + $this->get_document_class_icon($templates[$i]["icon"]) + '"></span>' + $templates[$i]["name"] + '</button>';
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
        if (rcube_utils::get_input_value('_framed', rcube_utils::INPUT_GET) == true) {
            $event = [];
            if (rcube_utils::get_input_value('_category', rcube_utils::INPUT_GET) !== null)
                $event["categories"] = [rcube_utils::get_input_value('_category', rcube_utils::INPUT_GET)];
            if (rcube_utils::get_input_value('_calendar_blocked', rcube_utils::INPUT_GET) !== null) //_calendar_blocked
                $event["calendar_blocked"] = rcube_utils::get_input_value('_calendar_blocked', rcube_utils::INPUT_GET);
            // if (rcube_utils::get_input_value('_startDate', rcube_utils::INPUT_GET) !== null)
            //     $event["start"] = [rcube_utils::get_input_value('_startDate', rcube_utils::INPUT_GET)];
            // else
            //     $event["start"] = ["now"];
            // if (rcube_utils::get_input_value('_endDate', rcube_utils::INPUT_GET) !== null)
            //     $event["end"] = [rcube_utils::get_input_value('_endDate', rcube_utils::INPUT_GET)];
            // else
            //     $event["end"] = ["start+1h"];

        } else
            $event = rcube_utils::get_input_value("_event", rcube_utils::INPUT_POST);

        // $this->include_script('../mel_workspace/js/setup_event.js');
        $this->load_script_module('edit_event', '/js/lib/calendar/event/');

        // $event["attendees"] = [
        //     ["email" => driver_mel::gi()->getUser()->email, "name" => $user->fullname, "role" => "ORGANIZER"]
        // ];
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

        $this->rc->output->set_env('calendar_categories', $calendar->__get('driver')->list_categories());

        if (rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GET) !== null) {
            $calendar = $this->rc->plugins->get_plugin("calendar");
            $calendar->mail_message2event();
        } else {

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
        $line_templ = html::tag(
            'li',
            array(
                'id' => 'rcmli%s',
                'class' => '%s'
            ),
            html::a(array(
                'href' => '#list',
                'rel' => '%s',
                'onclick' => "return " . rcmail_output::JS_OBJECT_NAME . ".command('list-addresses','%s',this)"
            ), '%s')
        );

        foreach ($this->rc->get_address_sources(false, true) as $j => $source) {
            $id = strval(strlen($source['id']) ? $source['id'] : $j);
            $js_id = rcube::JQ($id);

            // set class name(s)
            $class_name = 'addressbook';
            if ($source['class_name'])
                $class_name .= ' ' . $source['class_name'];

            $out .= sprintf(
                $line_templ,
                rcube_utils::html_identifier($id, true),
                $class_name,
                $source['id'],
                $js_id,
                ($source['name'] ?: $id)
            );
        }

        return html::tag('ul', $attrib, $out, html::$common_attrib);
    }

    public function weather()
    {
        $proxy = $this->rc->config->get('weather_proxy');

        $lat = rcube_utils::get_input_value("_lat", rcube_utils::INPUT_POST);
        $lng =  rcube_utils::get_input_value("_lng", rcube_utils::INPUT_POST);

        $url = "https://www.prevision-meteo.ch/services/json/lat=" . $lat . "lng=$lng";

        $json = mel_helper::load_helper($this->rc)->fetch("", false, 0)->_get_url($url, null, null, [CURLOPT_PROXY => $proxy]);

        if ($json["httpCode"] !== 200) {
            $url = "https://www.prevision-meteo.ch/services/json/lat=" . round($lat) . "lng=" . round($lng);
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

        if (!$rc->me()) {
            $rc->logout();
            echo "unloggued";
        } else
            echo "loggued";
        exit;
    }

    public function get_program($program_name)
    {
        $program = null;

        switch ($program_name) {
            case 'webconf':
                if ($this->visio_enabled()) {
                    include_once "program/webconf/webconf.php";
                    $program = new Webconf($this->rc, $this);
                }
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
        // if (is_dir("$dir/program/search_page") && file_exists("$dir/program/search_page/search.php"))
        // {
        //     $p['list']['globalsearch'] = [
        //         'id'      => 'globalsearch',
        //         'section' => $this->gettext('globalsearch', 'mel_metapage'),
        //     ];
        // }

        if ($this->visio_enabled() && is_dir("$dir/program/webconf") && file_exists("$dir/program/webconf/webconf.php")) {
            $p['list']['visio'] = [
                'id'      => 'visio',
                'section' => $this->gettext('visio', 'mel_metapage'),
            ];
        }

        if (!class_exists("rocket_chat")) {
            $p['list']['chat'] = [
                'id'      => 'chat',
                'section' => $this->gettext('tchap', 'mel_metapage'),
            ];
        } else {
            $p['list']['mel_chat_ui'] = [
                'id'      => 'mel_chat_ui',
                'section' => 'Paramètres visuels',
            ];
        }

        if (!class_exists('mel_notification')) {
            $p['list']['notifications'] = [
                'id'      => 'notifications',
                'section' => $this->gettext('notifications'),
            ];
        }

        $p['list']['navigation'] = [
            'id'      => 'navigation',
            'section' => $this->gettext('main_nav', 'mel_metapage'),
        ];

        if (count($this->rc->config->get('experimental-settings', [])) > 0) {
            $p['list']['bnum-experimental'] = [
                'id'      => 'bnum-experimental',
                'section' => $this->gettext('experimental'),
            ];
        }

        return $p;
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
     * Handler for user preferences form (preferences_list hook)
     */
    public function prefs_list($args)
    {
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
                // $chat_placement => [
                //     $this->gettext("up", "mel_metapage"),
                //     $this->gettext("down", "mel_metapage")
                // ],
                $scrollbar_size => [
                    //$this->gettext('auto', 'mel_metapage'),
                    $this->gettext("default", 'mel_metapage'),
                    $this->gettext("normal", "mel_metapage"),
                    $this->gettext("large", "mel_metapage")
                ]
            ];

            // if ($config[$chat_placement] === null || $config[$chat_placement] === "")
            //     $config[$chat_placement] = $this->gettext("down", "mel_metapage");

            if ($config[$scrollbar_size] === null || $config[$scrollbar_size] === "" || $config[$scrollbar_size] === $this->gettext('auto', 'mel_metapage'))
                $config[$scrollbar_size] = $this->gettext("default", "mel_metapage");

            foreach ($config as $key => $value) {
                if ($key === $chat_placement) continue;
                $args['blocks']['main']['options'][$key] = $this->create_pref_select($key, $value, $options[$key], ($key === $mel_column ? ["style" => "display:none;"] : null));
            }

            $avatar_color_key =  'avatar_error_color';
            $config = $this->rc->config->get($avatar_color_key, $this->getRandomColorWithContrast($this->get_user()->email, true)['background']);
            $args['blocks']['main']['options'][$avatar_color_key] =  [
                'title'   => html::label($avatar_color_key, rcube::Q($this->gettext($avatar_color_key))),
                'content' => "<input name=$avatar_color_key type=\"color\" value=\"$config\"/>",
            ];

        } else if ($args['section'] == 'calendar') {
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
        } else if ($args['section'] == 'globalsearch') {
            $this->add_texts('localization/');
            mel_helper::settings(true);

            //Max search mail
            $search_mail_max = 'search_mail_max';
            $search_mail_max_config = $this->rc->config->get($search_mail_max, 9999);
            $search_input = (new setting_option_value_input(0, setting_option_value_input::INFINITY))->html($search_mail_max, $search_mail_max_config, ['name' => $search_mail_max], $this); //new html_inputfield(['name' => $search_mail_max, 'id' => $search_mail_max]);

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
        } else if (($args['section'] == 'chat' && !class_exists('rocket_chat')) || $args['section'] == 'mel_chat_ui') {
            $this->add_texts('localization/');
            $startup = 'chat_startup';
            $startup_config = $this->rc->config->get($startup, true);

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
                $chat_placement => $this->gettext("up", "mel_metapage"),
                $scrollbar_size => $this->gettext("default", "mel_metapage")
            ]);

            //if ($config[$chat_placement] === null || $config[$chat_placement] === "") $config[$chat_placement] = $this->gettext("down", "mel_metapage");
            if ($config[$scrollbar_size] === null || $config[$scrollbar_size] === "" || $config[$scrollbar_size] === $this->gettext('auto', 'mel_metapage')) $config[$scrollbar_size] = $this->gettext("default", "mel_metapage");

            $options = [
                // $chat_placement => [
                //     $this->gettext("up", "mel_metapage"),
                //     $this->gettext("down", "mel_metapage")
                // ]
            ];

            foreach ($config as $key => $value) {
                if ($options[$key] !== null) {
                    $args['blocks']['main']['options'][$key] = $this->create_pref_select($key, $value, $options[$key], ($key === $mel_column ? ["style" => "display:none;"] : null));
                }
            }
        } else if ($args['section'] == 'notifications') {
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
        } else if ($args['section'] == 'navigation') {
            mel_helper::html_helper();
            $this->add_texts('localization/');
            $templates = $this->rc->config->get('template_navigation_apps', []); //mel_helper::Enumerable($this->rc->config->get('navigation_apps', []));
            $config = $this->rc->config->get('navigation_apps', []);

            $plugin = $this->rc->plugins->exec_hook('mel_metapage.navigation.apps', ['apps' => $templates]);

            if (isset($plugin['apps'])) $templates = $plugin['apps'];

            $args['blocks']['main_nav']['name'] = 'Applications par défauts';

            foreach ($templates as $key => $value) {
                //$key = $value->get_key();
                //$value = $value->get_value();
                $check = new html_checkbox(['name' => $key, 'id' => $key, 'value' => 1]);
                $args['blocks']['main_nav']['options'][$key] = [
                    'title'   => html::label($key, rcube::Q($this->gettext($key, 'mel_metapage'))),
                    'content' => $check->show(($config[$key]['enabled'] ?? $value['enabled']) ? 1 : 0),
                ];
            }

            $args['blocks']['second_nav']['name'] = 'Autre options';

            $showBackIcon = 'param-show-back-icon';
            $haveBackIcon = $settings = $this->rc->config->get($showBackIcon, false);
            $check = new html_checkbox(['name' => $showBackIcon, 'id' => $showBackIcon, 'value' => 1]);
            $args['blocks']['second_nav']['options'][$showBackIcon] = [
                'title'   => html::label($showBackIcon, rcube::Q($this->gettext($showBackIcon))),
                'content' => $check->show($haveBackIcon ? 1 : 0),
            ];

            $mainNavDeploy = 'main_nav_can_deploy';
            $mainNavDeployConfig = $this->rc->config->get($mainNavDeploy, true);
            $check = new html_checkbox(['name' => $mainNavDeploy, 'id' => $mainNavDeploy, 'value' => 1]);
            $args['blocks']['second_nav']['options'][$mainNavDeploy] = [
                'title'   => html::label($mainNavDeploy, rcube::Q($this->gettext($mainNavDeploy))),
                'content' => $check->show($mainNavDeployConfig ? 1 : 0),
            ];
        } else if ($args['section'] == 'bnum-experimental') {
            $settings = $this->rc->config->get('experimental-settings', []);

            $args['blocks']['general']['name'] = 'Gérer des paramètres expérimentaux';

            foreach ($settings as $id => $datas) {
                switch ($datas['style']) {
                    case 'checkbox':
                        $check = new html_checkbox(['name' => $id, 'id' => $id, 'value' => 1]);
                        $args['blocks']['general']['options'][$id] = [
                            'title'   => html::label($startup, rcube::Q($this->gettext($datas['name']))),
                            'content' => $check->show($this->rc->config->get($datas['config'], $datas['default']) ? 1 : 0),
                        ];
                        break;

                    default:
                        break;
                }
            }
        } else if ($args['section'] == 'compose') {
            $force_disabled = $this->rc->config->get('mail_delay_forced_disabled');

            if (!$force_disabled) {
                $delay = $this->rc->config->get('mail_delay', 5);
                $delay_max = $this->rc->config->get('mail_max_delay', 10);
                $options = range(0, $delay_max);
                $delay_key = 'delay';

                $select  = new html_select(['name' => $delay_key, 'id' => $delay_key]);
                $select->add($options);

                unset($options);

                $args['blocks']['main']['options'][$delay_key] = [
                    'title'   => html::label($startup, rcube::Q($this->gettext($delay_key, 'mel_metapage'))),
                    'content' => $select->show([$delay])
                ];
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
                $chat_placement => $this->gettext("up", "mel_metapage"),
                $scrollbar_size => $this->gettext("default", "mel_metapage")
            ]);

            if ($config[$chat_placement] === null || $config[$chat_placement] === "")
                $config[$chat_placement] = $this->gettext("up", "mel_metapage");

            if ($config[$scrollbar_size] === null || $config[$scrollbar_size] === "" || $config[$scrollbar_size] === $this->gettext('auto', 'mel_metapage'))
                $config[$scrollbar_size] = $this->gettext("default", "mel_metapage");

            $chat = $config[$chat_placement];

            foreach ($config as $key => $value) {
                $config[$key] = rcube_utils::get_input_value($key, rcube_utils::INPUT_POST);
            }

            $config[$chat_placement] = $chat;


            $args['prefs']["mel_mail_configuration"] = $config;

            $this->rc->output->set_env("mel_metapage_mail_configs", $config);

            $avatar_color_key =  'avatar_error_color';
            $config = rcube_utils::get_input_value($avatar_color_key, rcube_utils::INPUT_POST);

            if ($avatar_color_key)  $args['prefs'][$avatar_color_key] = $config;
            $this->rc->output->set_env("avatar_background_color", $config);
        } else if ($args['section'] == 'calendar') {
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
            
        } else if ($args['section'] == 'globalsearch') {
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

            if (!$config_search_on_all_balp) {
                $balps = $this->rc->plugins->get_plugin('mel_sharedmailboxes')->get_user_sharedmailboxes_list();
                $args['prefs'][$op_table_balp] = $this->_save_pref_update_config($config_balp, $balps, 'balp_folders_');
            }

            if (!$config_search_on_all_bali_folders) {
                $storage = $this->rc->storage;

                if (!isset($storage)) $storage = $this->rc->get_storage();

                $bali_folders = $storage->list_folders_subscribed('', '*', 'mail');
                $args['prefs'][$op_table_bali] = $this->_save_pref_update_config($config_bali, $bali_folders, 'bali_folders_');
            }
        } else if ($args['section'] == 'chat' || $args['section'] == 'mel_chat_ui') {
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
                $chat_placement => $this->gettext("up", "mel_metapage")
            ]);

            if ($config[$chat_placement] === null || $config[$chat_placement] === "")
                $config[$chat_placement] = $this->gettext("up", "mel_metapage");

            $config[$chat_placement] = rcube_utils::get_input_value($chat_placement, rcube_utils::INPUT_POST);

            $args['prefs']["mel_mail_configuration"] = $config;

            $this->rc->output->set_env("mel_metapage_mail_configs", $config);
        } else if ($args['section'] == 'notifications') {
            $this->add_texts('localization/');
            $tab_title_style = 'tab_title_style';
            $value = $this->rc->config->get($tab_title_style, 'page');
            $value = rcube_utils::get_input_value($tab_title_style, rcube_utils::INPUT_POST);
            $args['prefs']["tab_title_style"] = $value;
            $this->rc->output->set_env('mel_metapage.tab.notification_style', $value);
        } else if ($args['section'] == 'navigation') {
            mel_helper::html_helper();
            $this->add_texts('localization/');

            $config = $this->rc->config->get('template_navigation_apps', []);

            foreach ($config as $key => $value) {
                $input = rcube_utils::get_input_value($key, rcube_utils::INPUT_POST);

                if (isset($input)) $config[$key]['enabled'] = $input === '1';
                else $config[$key]['enabled']  = false;
            }

            $args['prefs']["navigation_apps"] = $config;
            $this->rc->output->set_env("navigation_apps", $config);

            $showBackIcon = 'param-show-back-icon';
            $haveBackIcon = $this->rc->config->get($showBackIcon, false);
            $haveBackIcon = rcube_utils::get_input_value($showBackIcon, rcube_utils::INPUT_POST) ?? false;
            $haveBackIcon = '1' === $haveBackIcon;
            $args['prefs'][$showBackIcon] = $haveBackIcon;
            $this->rc->output->set_env("menu_last_frame_enabled", $haveBackIcon);

            $mainNavParam = 'main_nav_can_deploy';
            $mainNavValue = $this->rc->config->get($mainNavParam, false);
            $mainNavValue = rcube_utils::get_input_value($mainNavParam, rcube_utils::INPUT_POST) ?? false;
            $mainNavValue = '1' === $mainNavValue;
            $args['prefs'][$mainNavParam] = $mainNavValue;
            $this->rc->output->set_env("main_nav_can_deploy", $mainNavValue);
        } else if ($args['section'] == 'bnum-experimental') {
            $settings = $this->rc->config->get('experimental-settings', []);

            foreach ($settings as $id => $datas) {
                switch ($datas['style']) {
                    case 'checkbox':
                        $input = rcube_utils::get_input_value($id, rcube_utils::INPUT_POST);
                        $args['prefs'][$datas['config']] = ($input ?? false) === '1';
                        $this->rc->output->set_env($datas['config'], $args['prefs'][$datas['config']]);
                        break;

                    default:
                        # code...
                        break;
                }
            }
        } else if ($args['section'] == 'compose') {
            $force_disabled = $this->rc->config->get('mail_delay_forced_disabled');

            if (!$force_disabled) {
                $delay = $this->rc->config->get('mail_delay', 5);
                $delay_max = $this->rc->config->get('mail_max_delay', 10);
                $delay_key = 'delay';

                $delay = +rcube_utils::get_input_value($delay_key, rcube_utils::INPUT_POST);

                if ($delay > $delay_max) $delay = $delay_max;

                $args['prefs']['mail_delay'] = $delay;

                $this->rc->output->set_env('mail_delay', $delay);
            }
        }


        return $args;
    }

    function _save_pref_update_config($config, $datas, $prefix)
    {
        $folders = [];
        foreach ($datas as $key => $data) {
            $folder_name = is_string($data) ? rcube_charset::convert($data, 'UTF7-IMAP') : $key;
            $folder_name = str_replace('INBOX', 'Courrier entrant', $folder_name);
            $val = rcube_utils::get_input_value($prefix . str_replace(' ', '_', str_replace('.', '_', $folder_name)), rcube_utils::INPUT_POST) === '1';
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
        $this->rc->user->save_prefs(array('mel_metapage_chat_visible' => true));

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

        if ($datas !== null && $datas['show'] === true) {
            if (!$during)
                $text = "Une maintenance aura lieu le " . $datas["day"] . " durant " . $datas["when"] . " " . $datas["before-howmany"] . " " . $datas["howmany"] . ".";
            else
                $text = "Durée de la maintenance " . $datas["before-howmany"] . " " . $datas["howmany"] . ".";
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
        if ($args['folder'] === $this->rc->config->get('models_mbox')) {
            $args['message'] = $this->gettext('model_saved', 'mel_metapage');
        }

        return $args;
    }

    public function hook_message_objects($args)
    {
        $message = $this->rc->get_storage()->get_body($args['message']->uid);

        if (isset($message)) {
            if ($this->check_message_is_bloqued($message, $args['message']))
                $args['content'][] = '<div class="alert alert-danger boxdanger"><center>Ce message a été bloqué par le Bnum car il contient des liens dangereux.</center></div>';
            else if ($this->check_message_is_suspect($message, $args['message']))
                $args['content'][] = '<div class="alert alert-warning boxwarning">Ce message contient des liens potentiellement dangereux, cliquez sur ces liens seulement si vous êtes sûr de ce que vous faites !</div>';
        }

        return $args;
    }

    public function hook_message_part_get($args)
    {

        if ($this->check_message_is_bloqued($args['body'], $args['object']->headers)) {
            $args['body'] = ''; //"Ce message est bloqué par le Bnum car il contient des liens de phishing !";
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

        if ($this->rc->config->get('mel_messages_list_clear_headers', "full") == "full") {
            return $args;
        }

        // Traitement des entêtes pour améliorer la lisibilité des boites
        foreach ($args['messages'] as $message) {

            $a_parts = rcube_mime::decode_address_list($message->from, null, true, $message->charset);
            $service = '';
            $sender = '';

            if (!count($a_parts)) {
                return null;
            }

            $part = array_pop($a_parts);

            // Gestion du emis par
            if (strpos($part['name'], ' emis par ') !== false) {
                $tmp = explode(' emis par ', $part['name'], 2);
                $sender = $tmp[1];
                $part['name'] = $tmp[0];

                // Service pour le emis par
                if (strpos($sender, ' - ') !== false) {
                    $tmp = explode(' - ', $sender, 2);
                    $service = $tmp[1];
                    $sender = $tmp[0];
                }

                // Description pour le emis par
                if (strpos($sender, '(') !== false) {
                    $sender = explode('(', $sender, 2)[0];
                }
            }


            // Gestion du service
            if (strpos($part['name'], ' - ') !== false) {
                $tmp = explode(' - ', $part['name'], 2);
                $part['name'] = $tmp[0];

                if (strpos($part['name'], '/') === false) {
                    $service = $tmp[1];
                }
            }

            // Gestion de la description
            if (strpos($part['name'], '(') !== false) {
                $part['name'] = explode('(', $part['name'], 2)[0];
            }

            // Gestion des externes
            $name = trim($part['name']);
            $extern = false;

            if (strpos($name, '> ') === 0) {
                $name = substr($name, 2);
                $extern = true;
            }

            if (in_array($name, $this->rc->config->get('mel_use_domain_list', [
                'no-reply',
                'noreply',
                'support',
                'notifications'
            ]))) {
                $part['name'] = ($extern ? '> ' : '') . ucwords(explode('@', $part['mailto'])[1]);
            }
            else if (strpos($part['mailto'], $name . '@') === 0) {
                $part['name'] = ucwords(str_replace('.', ' ', $part['name']));
            }

            $message->title = $part['string'];

            // Gestion du emis par
            if (!empty($sender)) {
                $part['name'] .= ' emis par ' . trim($sender);
            }

            if ($this->rc->config->get('mel_messages_list_clear_headers', "full") == "service" 
                    && !empty($service)) {
                $message->from = $part['name'] . ' - ' . $service . " <" . $part['mailto'] . ">";
            }
            else {
                $message->from = $part['name'] . " <" . $part['mailto'] . ">";
            }
            
        }

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
        if (!isset($config)) {
            $config = $this->rc->config->get('mel_suspect_url', []);
            $plugin = $this->rc->plugins->exec_hook('mel_config_suspect_url', ['config' => $config]);
            $config = $plugin['config'] ?? $config;
        }

        $is_suspect = mel_helper::Enumerable($config)->any(function ($k, $v) use ($message) {
            if (strpos($message, $v) === false && !mel_helper::parse_url($v)->not_have_path_and_check_base_url($message)) {
                if (strpos($v, 'http') !== false) $v = str_replace('http', 'https', $v);
                else {
                    $v = str_replace('https', 'http', $v);
                }

                return strpos($message, $v) !== false;
            }

            return true;
        });

        if (!$is_suspect) {
            $plugin = $this->rc->plugins->exec_hook(
                'mel_check_suspect_url',
                [
                    'config' => $config,
                    'is_suspect' => $is_suspect,
                    'message' => $message,
                    'header' => $rcube_message_header
                ]
            );

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
        if (!isset($config)) {
            $config = $this->rc->config->get('mel_bloqued_url', []);
            $plugin = $this->rc->plugins->exec_hook('mel_config_bloqued_url', ['config' => $config]);
            $config = $plugin['config'] ?? $config;
        }

        $is_bloqued = mel_helper::Enumerable($config)->any(function ($k, $v) use ($message) {
            $message = htmlspecialchars_decode($message);
            if (strpos($message, $v) === false) {
                if (strpos($v, 'http') !== false) $v = str_replace('http', 'https', $v);
                else $v = str_replace('https', 'http', $v);

                return strpos($message, $v) !== false;
            }

            return true;
        });

        if (!$is_bloqued) {
            $plugin = $this->rc->plugins->exec_hook(
                'mel_check_bloqued_url',
                [
                    'config' => $config,
                    'is_bloqued' => $is_bloqued,
                    'message' => $message,
                    'header' => $rcube_message_header
                ]
            );

            if (isset($plugin) && isset($plugin['is_bloqued'])) $is_bloqued = $plugin['is_bloqued'];
        }

        return $is_bloqued;
    }


    function contacts_autocomplete_after($args)
    {
        $args['contacts'] = mel_helper::Enumerable($args['contacts'])->removeTwins(function ($k, $v) {
            if (strpos($v['name'], '<') !== false) return strtolower($v['name']);
            else return $v;
        })->toArray();
        return $args;
    }

    function is_app_enabled($app, $load_config = false)
    {
        if ($app === 'chat') $app = 'app_chat';

        if ($load_config) $this->load_config();

        $rcmail = $this->rc ?? rcmail::get_instance();
        $item = $rcmail->config->get('navigation_apps', null);

        if (isset($item)) return $item[$app]['enabled'] ?? $rcmail->config->get('template_navigation_apps', null)[$app]['enabled'] ?? true;

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

        $this->rc->get_storage()->set_folder($folder);

        $headers_old = $this->rc->get_storage()->get_message_headers($message_uid, $folder);
        $test = $this->rc->get_storage()->get_raw_body($message_uid);
        if (strpos($test, 'X-Suivimel') !== false) {
            $test = explode('X-Suivimel', $test);
            $suivi = explode("\n", str_replace(': ', '', $test[1]))[0];
            $suivi = 'Le ' . date('d/m/Y H:i') . ', ' . driver_mel::gi()->getUser(null, true, false, null, $user_mail)->name . " a ajouté :¤¤$comment" . "¤¤" . rcube_mime::decode_header($suivi);
            $test = $test[0] . 'X-Suivimel: ' . Mail_mimePart::encodeHeader('X-Suivimel', $suivi, RCUBE_CHARSET) . $test[1];
        } else {
            // $test = explode('Subject: ', $test);
            // $added = false;
            // $val = '';
            // foreach ($test as $key => $value) {
            //     if ($value !== $test[0] && $value[(strlen($value) - 1)] === "\n" && !$added) 
            //     {
            //         $val .= 'X-Suivimel: '.Mail_mimePart::encodeHeader('X-Suivimel', "Le ".date('d/m/Y H:i').', '.driver_mel::gi()->getUser(null, true, false, null, $user_mail)->name." a ajouté :¤¤$comment", RCUBE_CHARSET)."\nSubject: ".$value;
            //         $added = true;
            //     }
            //     else $val .= $value;
            // }
            // $test = $val;

            // if ($added === false)
            // {
            //     $test = false;
            // }
            $test = str_replace('Subject: ', 'X-Suivimel: ' . Mail_mimePart::encodeHeader('X-Suivimel', "Le " . date('d/m/Y H:i') . ', ' . driver_mel::gi()->getUser(null, true, false, null, $user_mail)->name . " a ajouté :¤¤$comment", RCUBE_CHARSET) . "\nSubject: ", $test);
        }

        $datas = $this->rc->imap->save_message($folder, $test, '', false, [], $headers_old->date);

        if ($datas !== false) {
            $message = new rcube_message($message_uid, $folder);

            foreach ($message->headers->flags as $flag => $value) {
                $this->rc->imap->set_flag($datas, strtoupper($flag), $folder);
            }

            $this->rc->imap->set_flag($datas, "~commente", $folder);
            $this->rc->imap->set_flag($datas, 'SEEN', $folder);
            $this->rc->get_storage()->delete_message($message_uid, $folder);

            echo $datas;
        } else echo 'false';

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
            $to .= format_email_recipient(rcube_utils::idn_to_ascii($value['email']), $value['name']) . ', ';
        }

        $to = substr_replace($to, '', -2);

        $headers = $message->headers();
        $headers['To'] = $to;
        $message->headers($headers, true);
        $msg = $message->getMessage();

        if (strpos($orga['email'], '.-.') !== false) {
            $tmp = explode('@', explode('.-.', $orga['email'])[1])[0];

            $datas = $this->rc->imap->save_message("Boite partag&AOk-e/$tmp/$folder", $msg);

            if ($datas === false) {
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
        } else {
            if (!isset($this->rc->imap)) {
                $this->rc->storage_init();
            }

            if (isset($this->rc->imap)) {
                $datas = $this->rc->imap->save_message($folder, $msg);
            }
        }

        if ($datas !== false) {
            $this->rc->imap->set_flag($datas, "~rdvtraite", $folder);
            $this->rc->imap->set_flag($datas, 'SEEN', $folder);
        }
    }

    public function debug_and_test()
    {
        //$this->include_script('js/program/webconf_video_manager.js');
        self::IncludeLoader();
        $this->include_script('js/actions/test.js');
        $this->rc->output->send('mel_metapage.test');
    }

    public function action_loading_frame()
    {
        $this->rc->output->send('mel_metapage.loader');
    }

    public function calendar_load_events()
    {

        echo json_encode(
            $this->_calendar_load_events(
                $this->input_timestamp('start', rcube_utils::INPUT_GET),
                $this->input_timestamp('end', rcube_utils::INPUT_GET),
                rcube_utils::get_input_value('q', rcube_utils::INPUT_GET),
                rcube_utils::get_input_value('source', rcube_utils::INPUT_GET),
                rcube_utils::get_input_value('last', rcube_utils::INPUT_GET),
                rcube_utils::get_input_value('force', rcube_utils::INPUT_GET) ?? 'random',
                true
            )
        );
        exit;
    }

    private function _calendar_load_events($start, $end, $querry, $calid, $last, $force = 'random', $encode = false)
    {
        if (class_exists('calendar')) {

            if ($force === 'true') $force = true;
            else if ($force === 'false') $force = false;

            if ($force === 'random') {
                if (rand(0, 10) == 10) return $this->_calendar_load_events($start, $end, $querry, $calid, true);
            }
        }

        $calendar = $this->rc->plugins->get_plugin('calendar');
        $events = $calendar->__get('driver')->load_events(
            $start,
            $end,
            $querry,
            $calid,
            1,
            $force !== true ? $last : null
        );

        if ($encode) {
            $events = $calendar->encode($events, !empty($querry));
        }

        return [
            'forced' => $force,
            'events' => $events,
            'encoded' => $encode,
            'cal' => $calid
        ];
    }

    protected function input_timestamp($name, $type)
    {
        $ts = rcube_utils::get_input_value($name, $type);

        if ($ts && (!is_numeric($ts) || strpos($ts, 'T'))) {
            $ts = new DateTime($ts, $this->timezone);
            $ts = $ts->getTimestamp();
        }

        return $ts;
    }

    public function bnum_page()
    {
        $request = rcube_utils::get_input_value('_initial_request', rcube_utils::INPUT_GET) ?: null;
        $init_task = rcube_utils::get_input_value('_initial_task', rcube_utils::INPUT_GET) ?: null;
        $init_action = rcube_utils::get_input_value('_initial_action', rcube_utils::INPUT_GET) ?: null;
        if (isset($request)) {
            $this->rc->output->set_env("bnum.redirect", $request);
        }

        if (isset($init_task)) {
            $this->rc->output->set_env("bnum.init_task", $init_task);
        }

        if (isset($init_action)) {
            $this->rc->output->set_env("bnum.init_action", $init_action);
        }

        $this->set_plugin_env_exist();
        $this->include_web_component()->Avatar();

        $this->rc->output->set_env("frames.multi_frame_enabled", $this->get_config('multi_frame_enabled', false));
        $this->rc->output->set_env("frames.max_multi_frame", $this->get_config('max_multi_frame', 3));

        $this->rc->output->add_header('<link rel="manifest" href="manifest.json" />');

        if (empty($_SESSION['user_id'])) {
            $this->rc->output->redirect([
                '_task' => 'logout',
                '_action' => '',
            ]);
        } else $this->rc->output->send('mel_metapage.empty');
    }

    private function set_plugin_env_exist()
    {

        if (class_exists('mel_workspace')) {
            $this->rc->output->set_env("plugin_list_workspace", true);
        }

        if (class_exists('calendar')) {
            $this->rc->output->set_env("plugin_list_agenda", true);
        }

        if (class_exists('tasklist')) {
            $this->rc->output->set_env("plugin_list_tache", true);
        }

        if (class_exists('mel_nextcloud')) {
            $this->rc->output->set_env("plugin_list_document", true);
        }

        if (class_exists('mel_sondage')) {
            $this->rc->output->set_env("plugin_list_sondage", true);
        }

        if (class_exists('rocket_chat')) {
            $this->rc->output->set_env("plugin_list_chat", true);
        }


        if (class_exists('mel_notification')) {
            $this->rc->output->set_env("plugin_list_notifications", true);
        }

        if (class_exists('mel_help')) {
            $this->rc->output->set_env("plugin_list_help", true);
        }

        if (class_exists('mel_visio')) {
            $this->rc->output->set_env("plugin_list_visio", true);
        }
    }

    public function visio_enabled()
    {
        return $this->rc->config->get('visio_enabled', false);
    }

    public function get_folder_email_from_id($id)
    {
        // Récupération de la boite a restaurer
        $mbox = driver_mel::gi()->getUser($id);
        $folders = [];
        $imap = $this->rc->get_storage();

        // Si c'est la boite de l'utilisateur connecté
        if ($id == $this->rc->get_user_name()) {
            $host = $this->rc->user->get_username('domain');
        } else {
            // Récupération de la configuration de la boite pour l'affichage
            $host = driver_mel::gi()->getRoutage($mbox, 'restore_bal');
        }
        if (driver_mel::gi()->isSsl($host)) {
            $res = $imap->connect($host, $id, $this->rc->get_user_password(), 993, 'ssl');
        } else {
            $res = $imap->connect($host, $id, $this->rc->get_user_password(), $this->rc->config->get('default_port', 143));
        }

        // Récupération des folders
        if ($res) {
            $folders = $imap->list_folders_direct();
        }

        return $folders;
    }

    public function refactor_email_folders_from_id($id, $folders)
    {
        //Initialisation
        $len;
        $order;
        $maxOrder;
        $init = $folders;
        $balp_label = driver_mel::gi()->getBalpLabel();
        $delimiter = $_SESSION['imap_delimiter'];
        $bal = explode('.-.', $id)[1] ?? $id;
        $folders = mel_helper::Enumerable($folders)->where(function ($k, $v) use ($balp_label) {
            return strpos($v, $balp_label) !== false;
        });
        $have_balp_labels = $folders->any();

        //Actions
        if (!$have_balp_labels) {
            $folders = mel_helper::Enumerable($init);
        }

        unset($init);
        $tmp = null;
        $folders = $folders->select(function ($key, $value) use ($tmp, $balp_label, $delimiter, $bal, $len, $order, &$maxOrder) {
            if (!isset($maxOrder)) $maxOrder = 0;

            if ($value === $balp_label . $delimiter . $bal || $value === 'INBOX') {
                $key = $value;
                $value = 'Courrier entrant';
                $order = 0;
            } else {
                $tmp = $value;
                $value = str_ireplace($balp_label . $delimiter . $bal . $delimiter, '', $value);

                if (strpos($value, $delimiter) === false) {
                    $key = $value;
                    $order = $maxOrder + 1;
                } else {
                    if (strpos($value, 'INBOX' . $delimiter) !== false) $order = 0;
                    else $order = $maxOrder + 1;

                    $value = explode($delimiter, $value);
                    $len = count($value);
                    $key = $value[$len - 1];
                    if ($len - 1 === 1) $len = "| $key";
                    else $len = implode(mel_helper::Enumerable(range(1, $len - 2))->select(function ($k, $v) {
                        return '=';
                    })->toArray()) . "> | $key";

                    $value = $len;
                    unset($len);
                }

                $key = $tmp;
            }

            if (strpos($value, '&nbsp;') !== false) {
                $value = explode(';', $value);
                $len = count($value) - 1;
                $value[$len] = rcube_charset::convert($value[$len], 'UTF7-IMAP');
                $value = implode(';', $value);
            } else $value = rcube_charset::convert($value, 'UTF7-IMAP');

            if ($maxOrder < $order) $maxOrder = $order;

            return ['key' => $key, 'value' => $value, 'order' => $order];
        })->orderBy(function ($key, $value) {
            return $value['order'];
        });

        //Retour
        $folders = $folders->toDictionnary(function ($key, $value) {
            return $value['key'];
        }, function ($key, $value) {
            return $value['value'];
        });
        return $folders;
    }

    public function get_user_identity_from_uid($uid = null)
    {
        $uid = $uid ?? driver_mel::gi()->getUser()->uid;

        if (!isset($this->idendity_cache) || !isset($this->idendity_cache[$uid])) {
            $identities = $this->rc->user->list_identities();
            if (isset($identities)) {
                $selected = mel_helper::Enumerable($identities)->where(function ($k, $v) use ($uid) {
                    return $v['uid'] === $uid;
                })->firstOrDefault($identities[0]);
                $this->idendity_cache = array_merge($this->idendity_cache ?? [], [$uid => $selected]);
            } else return null;
        }

        return $this->idendity_cache[$uid];
    }

    public function load_option()
    {
        $parameters_default_values = [];
        $load_html = true;
        $option = rcube_utils::get_input_value('_option', rcube_utils::INPUT_GET);

        $plugin = $this->api->exec_hook('metapage.load.option.before', ['option' => $option]);

        if (isset($plugin)) {
            if (isset($plugin['option'])) {
                if ('load_mode_php' === $plugin['option']) $load_html = false;
                else $option = $plugin['option'];
            }
        }

        $html = '';

        if ($load_html) {
            $html = $this->rc->output->parse("mel_metapage.options/$option", false, false);

            if (preg_match_all('/name="([^"]*?)"/', $html, $matches)) {
                foreach ($matches[1] as $param) {
                    $param = str_replace('"', '', $param);
                    $param = str_replace('name=', '', $param);
                    $default_value = $this->rc->config->get($param);
                    $plugin = $this->api->exec_hook('metapage.load.option.param', ['option' => $option, 'param' => $param, 'default' => $default_value]);

                    if (isset($plugin)) {
                        if (isset($plugin['param'])) $param = $plugin['param'];
                        if (isset($plugin['default'])) $default_value = $plugin['default'];
                    }

                    $parameters_default_values[$param] = $default_value;
                }

                unset($default_value);
            }
        }

        $plugin = $this->api->exec_hook('metapage.load.option', ['option' => $option, 'html' => $html, 'default_values' => $parameters_default_values]);

        if (isset($plugin)) {
            if (isset($plugin['html'])) $html = $plugin['html'];
            if (isset($plugin['default_values'])) $parameters_default_values = $plugin['default_values'];
        }

        echo json_encode([
            'settings' => $parameters_default_values,
            'html' => $html
        ]);
        exit;
    }

    public function hook_load_option($args)
    {
        $option = $args['option'];
        $param = $args['param'];
        $default_value = $args['default'];

        switch ($param) {
            case 'mailboxes_display':
                $default_value = $default_value ?? 'default';
                break;

            case 'compose_extwin':
                $default_value = $default_value === 'true' || $default_value === true || $default_value === 1;
                break;

            default:
                $const_mel_options = [
                    "mel-icon-size",
                    "mel-folder-space",
                    "mel-message-space",
                    "mel-3-columns",
                    // "mel-chat-placement",
                    'mel-scrollbar-size'
                ];

                if (in_array($param, $const_mel_options)) {
                    $icon = "mel-icon-size";
                    $folder_space = "mel-folder-space";
                    $message_space = "mel-message-space";
                    $mel_column = "mel-3-columns";
                    // $chat_placement = "mel-chat-placement";
                    $scrollbar_size = 'mel-scrollbar-size';

                    $config = $this->rc->config->get('mel_mail_configuration', [
                        $icon => $this->gettext("normal", "mel_metapage"),
                        $folder_space => $this->gettext("normal", "mel_metapage"),
                        $message_space => $this->gettext("normal", "mel_metapage"),
                        $mel_column => $this->gettext("yes", "mel_metapage"),
                        $chat_placement => $this->gettext("up", "mel_metapage"),
                        $scrollbar_size => $this->gettext("default", "mel_metapage")
                    ]);

                    if ($config[$chat_placement] === null || $config[$chat_placement] === "") $config[$chat_placement] = $this->gettext("up", "mel_metapage");

                    $default_value = $config[$param];
                }
                break;
        }



        $args['param'] = $param;
        $args['default'] = $default_value;

        return $args;
    }

    public function save_option()
    {
        $option = rcube_utils::get_input_value('_option_name', rcube_utils::INPUT_POST);
        $value = rcube_utils::get_input_value('_option_value', rcube_utils::INPUT_POST);

        $plugin = $this->api->exec_hook('metapage.save.option', ['option' => $option, 'value' => $value]);

        if (isset($plugin)) {
            if (isset($plugin['option'])) $option = $plugin['option'];
            if (isset($plugin['value'])) $value = $plugin['value'];
        }

        $this->rc()->user->save_prefs([$option => $value]);

        $plugin = $this->api->exec_hook('metapage.save.option.after', ['option' => $option, 'value' => $value]);
        if (isset($plugin)) {
            if (isset($plugin['value'])) $value = $plugin['value'];
        }

        echo json_encode($value);
        exit;
    }

    public function hook_save_option($args)
    {
        $option = $args['option'];
        $value = $args['value'];

        switch ($option) {
            case 'compose_extwin':
                $value = $value === 'true' || $value === true || $value === 1 ? 1 : 0;
                break;

            case 'mail_delay':
                $value = +$value;
                break;

            case 'main_nav_can_deploy':
                $value = 'true' == $value;
                break;
            default:
                $const_mel_options = [
                    "mel-icon-size",
                    "mel-folder-space",
                    "mel-message-space",
                    "mel-3-columns",
                    "mel-chat-placement",
                    'mel-scrollbar-size'
                ];

                if (in_array($option, $const_mel_options)) {
                    $icon = "mel-icon-size";
                    $folder_space = "mel-folder-space";
                    $message_space = "mel-message-space";
                    $mel_column = "mel-3-columns";
                    $chat_placement = "mel-chat-placement";
                    $scrollbar_size = 'mel-scrollbar-size';

                    $config = $this->rc->config->get('mel_mail_configuration', [
                        $icon => $this->gettext("normal", "mel_metapage"),
                        $folder_space => $this->gettext("normal", "mel_metapage"),
                        $message_space => $this->gettext("normal", "mel_metapage"),
                        $mel_column => $this->gettext("yes", "mel_metapage"),
                        $chat_placement => $this->gettext("down", "mel_metapage"),
                        $scrollbar_size => $this->gettext("default", "mel_metapage")
                    ]);

                    if ($config[$chat_placement] === null || $config[$chat_placement] === "") $config[$chat_placement] = $this->gettext("down", "mel_metapage");

                    $config[$option] = $value;

                    $option = 'mel_mail_configuration';
                    $value = $config;
                }
                break;
        }

        $args['option'] = $option;
        $args['value'] = $value;



        return $args;
    }

    public function hook_save_option_after($args)
    {
        $option = $args['option'];
        $value = $args['value'];

        if (false !== strpos($option, 'calendar_')) {
            $value = $this->rc->plugins->get_plugin('calendar')->load_settings();
        }

        $args['value'] = $value;

        return $args;
    }

    public function hook_generate_option($args)
    {
        $option = $args['option'];
        $html = $args['html'];
        $default_values = $args['default_values'];

        switch ($option) {
            case 'calendar':
                $pattern = '/%%(.*?)%%/';

                preg_match_all($pattern, $html, $matches);

                foreach ($matches[1] as $match) {
                    $name = substr($match, 6, strlen($match) - 7);

                    switch ($name) {
                        case 'calendar_work_start':
                            $time_format = $this->rc->config->get('calendar_time_format', null);
                            $time_format = $this->rc->config->get('time_format', libcalendaring::to_php_date_format($time_format));
                            $work_start = $default_values['calendar_work_start'] ?? $this->rc->config->get('calendar_work_start', 6);
                            $work_end   = $default_values['calendar_work_end'] ?? $this->rc->config->get('calendar_work_end', 18);

                            $select_hours = new html_select(['id' => 'rcmfd_firsthour', 'data-command' => 'redraw_aganda']);
                            for ($h = 0; $h < 24; ++$h) {
                                $select_hours->add(date($time_format, mktime($h, 0, 0)), $h);
                            }
                            $content = html::div(
                                'input-group',
                                $select_hours->show((int)$work_start, ['name' => 'calendar_work_start', 'id' => 'rcmfd_workstart', 'class' => 'form-control custom-select', 'onchange' => 'save_option("calendar_work_start", this.value, this)'])
                                    . html::span('input-group-append input-group-prepend', html::span('input-group-text', ' &mdash; '))
                                    . $select_hours->show((int)$work_end, ['name' => 'calendar_work_end', 'id' => 'rcmfd_workstart', 'class' => 'form-control custom-select', 'onchange' => 'save_option("calendar_work_start", this.value, this)'])
                            );
                            $html = str_replace('%%' . $match . '%%', $content, $html);
                            break;

                        case ('calendar_first_hour'):
                            $select_hours = new html_select(['id' => 'rcmfd_firsthour', 'data-command' => 'redraw_aganda', 'name' => 'calendar_first_hour', 'class' => 'form-control custom-select', 'onchange' => 'save_option("calendar_first_hour", this.value, this)']);
                            for ($h = 0; $h < 24; ++$h) {
                                $select_hours->add(date('H:i', mktime($h, 0, 0)), $h);
                            }
                            $html = str_replace('%%' . $match . '%%', $select_hours->show(), $html);
                            break;


                        default:
                            break;
                    }
                }
                break;


            case 'mail':
                $delay_is_disabled = $this->rc->config->get('mail_delay_forced_disabled', false);

                if ($delay_is_disabled) {
                    unset($delay_is_disabled);
                    $html = str_replace('<delay_enabled/>', 'style="display:none;', $html);
                    $html = str_replace('<delay/>', '', $html);
                    $html = str_replace('<delay_start/>', '', $html);
                } else {
                    unset($delay_is_disabled);
                    $delay = $this->rc->config->get('mail_delay', 5);
                    $delay_max = $this->rc->config->get('mail_max_delay', 10);
                    $html = str_replace('<delay_enabled/>', '', $html);
                    $html = str_replace('<delay_start/>', $delay, $html);

                    $select = new html_inputfield(['type' => "range", 'name' => 'speed-delay', 'data-no-action' => true, 'class' => 'col-7 form-control input-mel', 'id' => 'speed-delay']);

                    $html = str_replace('<delay/>', $select->show($delay, ['data-min' => 0, 'data-max' => $delay_max]), $html);

                    unset($delay);
                    unset($delay_max);
                    unset($select);
                }

                break;

            default:
                break;
        }

        $args['option'] = $option;
        $args['html'] = $html;
        $args['default_values'] = $default_values;

        return $args;
    }
    public function logout_after($args)
    {
        foreach ($_COOKIE as $key => $value) {
            if (
                strpos($key, 'id') !== false || strpos($key, 'ses') !== false || strpos($key, 'login') !== false ||
                (class_exists('mel_wekan') && strpos($key, $this->rc->config->get('wekan_storage_end')) !== false)
            ) {
                if ('roundcube_login' !== $key) {
                    unset($_COOKIE[$key]);
                    setcookie($key, '', -1, '/');
                }
            }
        }

        session_destroy();
        return $args;
    }


    public function get_setting()
    {
        $option = rcube_utils::get_input_value('_option', rcube_utils::INPUT_GET);
        $default = rcube_utils::get_input_value('_default_value', rcube_utils::INPUT_GET);

        echo json_encode($this->rc->config->get($option, $default));
        exit;
    }

    public function get_picture_mode()
    {
        return $this->rc->config->get('picture-mode', true);
    }

    public function hook_message_part_structure($args)
    {
        $this->from_message_reading = $args['object']->headers->get('from');

        return $args;
    }

    public function hook_message_part_before($args)
    {
        if (isset($this->from_message_reading)) {
            if (strpos($this->from_message_reading, '<')) {
                $this->from_message_reading = explode('<', $this->from_message_reading)[1];
                $this->from_message_reading = explode('>', $this->from_message_reading)[0];
            }

            if (in_array($this->from_message_reading, $this->rc->config->get('trusted_mails', []))) $args['safe'] = true;
            $this->from_message_reading = null;
        }

        return $args;
    }

    public function rc_section_list($args)
    {
        $args['sections'][] = ["id" => "mel_chat_ui", "section" => "Paramètres Bnum"];

        return $args;
    }

    public function save_user_pref_domain()
    {
        $domain = rcube_utils::get_input_value('_domain', rcube_utils::INPUT_POST);
        $user_domain = $this->rc->config->get('mel_user_domain', []);
        $user_domain[] = $domain;
        $this->rc->user->save_prefs(['mel_user_domain' => $user_domain]);
    }

    public function toggle_favorite_folder()
    {
        $folder = rcube_utils::get_input_value('_folder', rcube_utils::INPUT_POST);
        $state = rcube_utils::get_input_value('_state', rcube_utils::INPUT_POST);
        $state = $state === 'true' || $state === true || $state === 1;

        $prefs = $this->rc->config->get('favorite_folders', []);

        if ($state) $prefs[$folder] = ['selected' => true];
        else unset($prefs[$folder]);

        if (isset($prefs[''])) unset($prefs['']);

        $this->rc->user->save_prefs(['favorite_folders' => $prefs]);

        echo json_encode($prefs);
        exit;
    }

    public function toggle_display_folder()
    {
        $folder = rcube_utils::get_input_value('_folder', rcube_utils::INPUT_POST);
        $state = rcube_utils::get_input_value('_state', rcube_utils::INPUT_POST);
        $state = $state === 'true' || $state === true || $state === 1;

        $prefs = $this->rc->config->get('favorite_folders', []);

        if (isset($prefs[$folder])) $prefs[$folder]['expended'] = $state;
        else $prefs[$folder] = ['expended' => false, 'selected' => $state];

        if (!$prefs[$folder]['expended'] && !$prefs[$folder]['selected']) unset($prefs[$folder]);

        echo json_encode($prefs);
        exit;
    }

    public function get_display_folder()
    {
        echo json_encode($this->rc->config->get('favorite_folders', []));
        exit;
    }

    public function folder_update($args)
    {
        $old = $args['record']['oldname'];
        $new = $args['record']['name'];
        $this->_update_folders_pref($old, $new);
        $this->_update_folder_color_on_rename($old, $new);
        return $args;
    }

    function _update_folders_pref($old, $new)
    {
        $prefs = $this->rc->config->get('favorite_folders', []);

        if (isset($prefs[$old])) {
            $prefs[$new] = $prefs[$old];
            unset($prefs[$old]);
        }

        $this->rc->user->save_prefs(['favorite_folders' => $prefs]);
    }

    function _update_folder_color_on_rename($old, $new)
    {
        $prefs = $this->rc->config->get('folders_colors', []);

        if (isset($prefs[$old])) {
            $prefs[$new] = $prefs[$old];
            unset($prefs[$old]);
        }

        $this->rc->user->save_prefs(['folders_colors' => $prefs]);
    }

    public function update_color_folder()
    {
        $folder = rcube_utils::get_input_value('_folder', rcube_utils::INPUT_POST);
        $color = rcube_utils::get_input_value('_color', rcube_utils::INPUT_POST) ?? null;

        if ('' === $color) $color = null;

        $prefs = $this->rc->config->get('folders_colors', []);

        if (isset($color)) $prefs[$folder] = $color;
        else unset($prefs[$folder]);

        $this->rc->user->save_prefs(['folders_colors' => $prefs]);

        if (rcube_utils::get_input_value('_color_break', rcube_utils::INPUT_POST) === null) {
            echo json_encode($prefs);
            exit;
        }
    }

    public function update_icon_folder()
    {
        $folder = rcube_utils::get_input_value('_folder', rcube_utils::INPUT_POST);
        $icon = rcube_utils::get_input_value('_icon', rcube_utils::INPUT_POST) ?? null;

        if (in_array($icon, ['', 'default'])) $icon = null;

        $prefs = $this->rc->config->get('folders_icons', []);

        if (isset($icon)) $prefs[$folder] = $icon;
        else unset($prefs[$folder]);

        $this->rc->user->save_prefs(['folders_icons' => $prefs]);

        echo json_encode($prefs);
        exit;
    }

    public function get_folder_colors()
    {
        $prefs = $this->rc->config->get('folders_colors', []);

        echo json_encode($prefs);
        exit;
    }

    public function get_folder_icons()
    {
        $prefs = $this->rc->config->get('folders_icons', []);

        echo json_encode($prefs);
        exit;
    }

    public function _login_doc_message()
    {
        $url =  $this->rc->config->get('login_doc_url');
        $txt = $this->gettext('login_da');
        return html::div([], $txt.' '.html::a(['href'=>$url], $url).'.');
    }  

    public function infiniteScrollCount() {
        $namespace = rcube_utils::get_input_value('_for', rcube_utils::INPUT_POST);

        $data = $this->rc->plugins->exec_hook('webcomponents.scroll.count', ['namespace' => $namespace, 'count' => 0]);

        echo json_encode($data['count'] ?? 0);
        exit;
    }

    public function infiniteScrollData() {
        $page = rcube_utils::get_input_value('_page', rcube_utils::INPUT_POST);
        $namespace = rcube_utils::get_input_value('_for', rcube_utils::INPUT_POST);

        $data = $this->rc->plugins->exec_hook('webcomponents.scroll.data', ['page' => $page, 'namespace' => $namespace, 'html' => '']);

        echo json_encode($data['html'] ?? '');
        exit;
    }

    public function avatar_url() {
        $data = null;
        $redirect = false;
        $email = rcube_utils::get_input_value('_email', rcube_utils::INPUT_GET);
        $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GET);

        if (!isset($email)){
            $email = driver_mel::gi()->getUser($id)->email;
            $_GET['_email'] = $email;
        }

        $img = $this->storage()->get_cache("no_avatar_$email");

        if ($img && (new DateTime($img))->add(DateInterval::createFromDateString('30 day')) <= new DateTime()) {
            $img = null;
            $this->storage()->clear_cache("no_avatar_$email");
        }

        if ($img || rcube_utils::get_input_value('_no_data', rcube_utils::INPUT_GET)) {
            
            if (!$img) $this->storage()->update_cache("no_avatar_$email", date("Y-m-d H:i:s"));
            $img = $this->_generate_no_picture();
            
            $this->rc->output->future_expire_header(86400*30);
            header("Content-Type: image/png"); 
  
            imagepng($img); 
            exit;
        }
        
        $plugin = $this->exec_hook('app.avatar', [
            'email' => $email,
            'data' => null,
        ]);

        // redirect to url provided by a plugin
        if (!empty($plugin['url'])) { 
            $data = $plugin['url'];//$this->rc()->output->redirect($plugin['url']);
            $redirect = true;
        }
        else if (!isset($plugin) && !isset($plugin['data'])) $data = $plugin['data'];
        else {
            // $data = [
            // '_task' => 'addressbook',
            // '_action' => 'photo',
            // '_email' => $email,
            // '_error' => 1
            // ];
            // $redirect = true;
            $action = new rcmail_action_contacts_photo;
            return $action->run();
        }

        if ($redirect) $this->rc()->output->redirect($data);
        else {
            if ($data) {
                $this->rc->output->future_expire_header(86400*30);
                $this->rc()->output->sendExit($data, ['Content-Type: ' . rcube_mime::image_content_type($data)]);
            }
    
            if (!empty($_GET['_error'])) {
                $this->rc()->output->sendExit('', ['HTTP/1.0 204 Photo not found']);
            }
    
            $this->rc()->output->sendExit(base64_decode(rcmail_output::BLANK_GIF), ['Content-Type: image/gif']);
        }
    }

    public function _generate_no_picture() {
        $image = imagecreate(200, 200);

        $email = rcube_utils::get_input_value('_email', rcube_utils::INPUT_GET);

        $color = rcube_utils::get_input_value('_background', rcube_utils::INPUT_GET) ?? ($this->get_user()->email === $email ?  $this->rc->config->get('avatar_error_color', null) : null);

        if ($color) {
            if (strpos($color, '#') !== 0) $color = "#$color";

            $text = $this->getContrastingColor($color);
        }

        $colors = $color ? $this->getColor($color, $text) : $this->getRandomColorWithContrast($email);

        unset($color);
        unset($text);

        // Set the background color of image 
        $background_color = imagecolorallocate($image, $colors['background'][0], $colors['background'][1], $colors['background'][2]); 
        imagefill($image, 200, 200, $background_color);

        // Set the text color of image 
        $text_color = imagecolorallocate($image, $colors['text'][0], $colors['text'][1], $colors['text'][2]); 

        $tmp=imagefttext($image, 120, 0, 50, 160, $text_color, __DIR__.'/skins/mel_elastic/roboto.ttf', strtoupper(substr($email, 0, 1)));
        //imagestring($image, 2, 20, 20, substr($email, 0, 1), $text_color);

        return $image;
    }

    function getContrastingColor($bgColor) {
        // Convertir la couleur hexadécimale en RGB
        $r = hexdec(substr($bgColor, 1, 2));
        $g = hexdec(substr($bgColor, 3, 2));
        $b = hexdec(substr($bgColor, 5, 2));
    
        // Calculer la luminosité
        $luminance = (($r * 299) + ($g * 587) + ($b * 114)) / 1000;
    
        // Si la couleur de fond est claire, choisir une couleur de texte sombre, et vice versa
        return $luminance > 186 ? '#000000' : '#FFFFFF'; // Texte noir pour fond clair, blanc pour fond sombre
    }
    
    function getRandomColorWithContrast($name, $toHexa = false) {
        $bgColor = $this->stringToColorCode($name);
        $textColor = $this->getContrastingColor($bgColor);
        
        if (!$toHexa) return $this->getColor($bgColor, $textColor);
        else return [
            'background' => $bgColor,
            'text' => $textColor,
        ];
    }

    function getColor($bgColor, $textColor) {
        $r = hexdec(substr($bgColor, 1, 2));
        $g = hexdec(substr($bgColor, 3, 2));
        $b = hexdec(substr($bgColor, 5, 2));

        $r2 = hexdec(substr($textColor, 1, 2));
        $g2 = hexdec(substr($textColor, 3, 2));
        $b2 = hexdec(substr($textColor, 5, 2));

        return [
            'background' => [$r, $g, $b],
            'text' => [$r2, $g2, $b2],
        ];
    }

    function stringToColorCode($str) {
        return "#".substr(md5($str), 0, 6);
        // $val = 0;
        // foreach (str_split($str) as $value) {
        //     $value = ord(strtolower($value));

        //     if ($value < 0) $value = -$value;
        //     $val += $value;
        // }

        // $val = dechex($val * 11);

        // if (strlen($val) < 6) $val .= ((10**(6-strlen($val)))/10);

        // return "#$val";
      }
      
    
    public function no_contact_found($args) {
        if ((is_null($args['record']) || is_null($args['data'])) && $this->get_current_action() === 'avatar') {
            // $args['url'] = [
            //     '_task' => 'mel_metapage',
            //     '_action' => 'avatar',
            //     '_email' => $args['email'],
            //     '_no_data' => true
            //     ];
            $_GET['_no_data'] = true;
            $this->avatar_url();

        }

        return $args;
    }

    public static function IncludeAvatar() {
        rcmail::get_instance()->plugins->get_plugin('mel_metapage')->include_component('avatar.js');
    } 

    public static function IncludeLoader() {
        rcmail::get_instance()->plugins->get_plugin('mel_metapage')->include_component('bootstrap-loader.js');
    } 
}
