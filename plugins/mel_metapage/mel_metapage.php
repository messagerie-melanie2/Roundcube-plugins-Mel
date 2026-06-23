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

    /**
     * 
     * @var rcube_plugin plugin courant
     */
    private static $plugin;

    /**
     * Ajoute une URL surveillée avec la tâche associée.
     *
     * Initialise la liste des URLs surveillées si elle n'existe pas encore.
     *
     * @param string $url   L'URL à surveiller.
     * @param string $task  La tâche associée à cette URL.
     * 
     * @return void
     */
    public static function add_url_spied($url, $task)
    {
        if (self::$urls_spies === null) self::$urls_spies = [];

        self::$urls_spies[$url] = $task;
    }

    /**
     * Retourne la liste des URLs surveillées.
     *
     * Initialise la liste à un tableau vide si elle n'est pas encore définie.
     *
     * @return array Liste des URLs surveillées.
     */
    public static function get_urls_spied()
    {
        if (self::$urls_spies === null) self::$urls_spies = [];

        return self::$urls_spies;
    }

    /**
     * Retourne la liste des widgets enregistrés.
     *
     * Initialise la liste à un tableau vide si elle n'est pas encore définie.
     *
     * @return array Liste des widgets.
     */
    public static function add_widget($name, $task, $arg)
    {
        if (self::$widgets === null) self::$widgets = [];

        self::$widgets[$name] = "/_task=$task&_action=mel_widget&_is_from=iframe" . ($arg === null ? '' : "&_arg=$arg");
    }

    /**
 * Retourne la liste des widgets enregistrés.
 *
 * Initialise la liste à un tableau vide si elle n'est pas encore définie.
 *
 * @return array Liste des widgets.
 */
    public static function get_widgets()
    {
        if (self::$widgets === null) self::$widgets = [];

        return self::$widgets;
    }

    /**
     * Indique si un widget peut être ajouté selon la tâche en cours.
     *
     * @param array $exception Liste optionnelle des exceptions (non utilisée actuellement).
     * @return bool Retourne true si la tâche est 'bureau' ou 'settings', sinon false.
     */
    public static function can_add_widget($exception = [])
    {
        $task = rcmail::get_instance()->task;

        return false && ($task === 'bureau' ||  $task === 'settings');
    }

    /**
     * Initialise les sous-modules présents dans les sous-dossiers du dossier "program".
     *
     * Parcourt tous les dossiers sous "program" :
     * - Si le dossier est "pages", appelle la méthode init_sub_pages().
     * - Si le dossier est dans la liste des exceptions (paramètre $exception), il est ignoré.
     * - Sinon, inclut tous les fichiers PHP présents dans ce dossier.
     *
     * Ensuite, si la classe "Program" existe :
     * - Récupère tous les sous-modules via Program::generate().
     * - Pour chaque sous-module, si la tâche courante correspond à la tâche du sous-module, appelle sa méthode init().
     * - Appelle systématiquement la méthode public() de chaque sous-module.
     *
     * @param array|null $exception Liste optionnelle des noms de dossiers à exclure de l'initialisation.
     */
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

    /**
     * Initialise les sous-pages en incluant et instanciant les classes des fichiers PHP
     * situés dans le répertoire "program/pages", excepté "page.php" et "parsed_page.php".
     * 
     * Pour chaque fichier inclus :
     * - Instancie la classe correspondante (nom basé sur le nom du fichier, avec première lettre en majuscule).
     * - Appelle la méthode `call()` si elle existe.
     * - Si la tâche courante est "custom_page", appelle également la méthode `init()`.
     */
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
        // Enregistre l’instance pour les méthodes statiques
        self::$plugin = $this;

        try {
            $this->setup();
        } catch (\Throwable $th) {
            //throw $th;
        }
        $this->init_sub_modules();

        if ($this->rc->task === "chat") $this->register_action('index', array($this, 'ariane'));
    }

    /**
     * Méthode appelée avant le rendu de la page.
     *
     * Permet d’inclure des scripts JavaScript nécessaires, ici 'list.js'.
     */
    protected function before_page()
    {
        $this->rc->output->include_script('list.js');
    }

    /**
     * Initialise le bnum (fourre-tout)
     */
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
                $this->add_hook(class_exists('mel_elastic') ? 'before_send_page' :  'send_page', array($this, "maintenance"));
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
        $this->add_hook(class_exists('mel_elastic') ? 'before_send_page' :  'send_page', array($this, "appendTo"));
        $this->add_hook("message_send_error", [$this, 'message_send_error']);
        $this->add_hook("message_draftsaved", [$this, 'message_draftsaved']);
        $this->add_hook("message_part_structure", [$this, 'hook_message_part_structure']);
        $this->add_hook("message_part_before", [$this, 'hook_message_part_before']);
        $this->add_hook("calendar.on_attendees_notified", [$this, 'on_attendees_notified']);
        $this->add_hook('contact_photo', [$this, 'no_contact_found']);
        $this->add_hook('plugin.mel_doubleauth.init', [$this, 'hook_double_auth_init']);

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
                    $current_mbox_name = rcube_charset::convert(rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GPC), 'UTF7-IMAP');

                    //On vérifie si on est sur une boite partagée
                    if (strpos($current_mbox_name, 'Boite partagée') !== false) {
                        $current_mbox_name = end(explode('/',$current_mbox_name));
                    }
                    if ($current_mbox_name === $this->rc->config->get('models_mbox')) {
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

                        include_once __DIR__ . "/program/classes/metrics.php";
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
            else*/
            if ($this->rc->task === 'search')
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
                'email' => $user->email,
                'dn' => $user->dn
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

            $this->add_hook(class_exists('mel_elastic') ? 'before_send_page' :  'send_page', array($this, "generate_html")); //$this->rc->output->add_header($this->rc->output->parse("mel_metapage.barup", false, false));
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
        } else if ($this->rc->task === 'mail') {
            $this->include_internal_and_external_buttons();
        }

        if ($this->rc->task === "calendar" || ($this->rc->task === "mel_metapage" && $this->rc->action === "dialog-ui")) {
            $this->add_hook(class_exists('mel_elastic') ? 'before_send_page' :  'send_page', array($this, "parasite_calendar"));
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

    /**
     * Enregistre le gestionnaire personnalisé pour l’édition des dossiers.
     *
     * Associe le tag 'bnumfolderperso' à la méthode '_edit_folder_hack' afin
     * d’intercepter et personnaliser l’affichage de cette section dans l’interface.
     */
    private function settings_edit_folder_bnum_action()
    {
        $this->rc->output->add_handlers(array(
            'bnumfolderperso'    => '_edit_folder_hack',
        ));
    }

    /**
     * Génère le HTML d’une section personnalisée pour l’édition d’un dossier.
     *
     * Produit un conteneur `<div>` avec deux sous-divisions pour gérer
     * la couleur personnalisée et l’icône personnalisée du dossier.
     *
     * @param array $attrib Attributs additionnels (non utilisés dans la fonction).
     * @return string Le code HTML généré.
     */
    private function _edit_folder_hack($attrib)
    {
        $html = html::div(
            array('class' => 'bnumfolderperso'),
            html::div(['id' => 'folder-edit-custom-color']),
            html::div(['id' => 'folder-edit-custom-icon'])
        );

        return $html;
    }

    /**
     * Ajoute un champ de sélection de couleur dans le formulaire de dossier.
     *
     * Modifie les arguments pour insérer un fieldset avec un champ input de type color
     * permettant à l'utilisateur de choisir la couleur du dossier.
     *
     * @param array $args Arguments du formulaire de dossier.
     * @return array Arguments modifiés avec le champ couleur ajouté.
     */
    function folder_form($args)
    {
        $prefs = $this->rc->config->get('folders_colors', []);
        $color = $prefs[$args['name']] ?? '';
        $args['form']['props']['fieldsets']['color'] = [
            'name' => 'Couleur du dossier',
            'content' => [
                'color' => [
                    'label' => 'Couleur du dossier',
                    'value' => "<input type=\"color\" title=\"Laissez pour avoir la couleur par défaut !\" name=\"_color\" id=\"folder-edit-color\" value=\"$color\">"
                ]
            ]
        ];

        return $args;
    }

    /**
     * Initialise la couleur d’un dossier lors de sa création.
     *
     * Récupère la couleur depuis la requête POST et la normalise
     * (valeurs noires ou vides sont converties en null).
     * Met à jour ensuite la couleur du dossier via update_color_folder().
     *
     * @param array $args Données du dossier à créer (doit contenir ['record']['name']).
     * @return array Retourne les arguments modifiés.
     */
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

    /**
     * Charge les modules JavaScript d’actions spécifiques aux métapages.
     *
     * Charge notamment les scripts pour les notes et le calendrier,
     * en conservant le module notes.js en mémoire.
     *
     * @return void
     */
    function load_js_modules_actions()
    {
        $save_in_memory = true;
        //$not_save_in_memory = true;
        $this->load_metapage_script_module('notes.js', $save_in_memory);
        $this->load_metapage_script_module('calendar.js');
    }

    /**
     * Charge un module de script spécifique aux métapages depuis le répertoire dédié.
     *
     * Appelle la méthode load_script_module en spécifiant le chemin vers les scripts
     * de métapages.
     *
     * @param string $name Nom du module script à charger
     * @param bool $save_in_memory Optionnel. Si vrai, conserve le script en mémoire. Par défaut false.
     * @return mixed Résultat retourné par load_script_module
     */
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

    /**
     * Inclut tous les fichiers JavaScript non minifiés présents dans un dossier donné
     * et ses sous-dossiers (un seul niveau de profondeur).
     *
     * Parcourt les fichiers du dossier `js/init/$folder` et inclut :
     * - tous les fichiers `.js` sauf ceux contenant `.min.js`
     * - les fichiers `.js` dans les sous-dossiers directs (pas plus profonds)
     *
     * @param string $folder Nom du dossier à parcourir sous `js/init/`
     * @return void
     */
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

    /**
     * Envoie les URLs surveillées (spied URLs) à l’environnement JavaScript.
     *
     * Récupère les URLs espionnées via la méthode statique `get_urls_spied()`
     * et les transmet au front-end via `set_env` sous la clé "urls_spies".
     *
     * @return void
     */
    public function send_spied_urls()
    {
        $this->rc->output->set_env("urls_spies", self::get_urls_spied());
    }

    /**
     * Gère le cache des dossiers lors de la tâche "mail".
     *
     * Si la tâche courante est "mail" et que le paramètre '_nocache' est passé à "true",
     * cette méthode déclenche la suppression du cache des dossiers via `mel_helper::clear_folders_cache`.
     *
     * @return void
     */
    public function m2_gestion_cache()
    {
        if ($this->rc->task === "mail" && (rcube_utils::get_input_value('_nocache', rcube_utils::INPUT_GPC) == "true"/* || 
        $this->rc->action === 'search')*/)) {
            mel_helper::clear_folders_cache($this->rc);
        }
    }

    /**
     * Inclut le script JavaScript pour le mode sombre de l’éditeur.
     *
     * @return $this Retourne l’instance courante pour permettre le chaînage des appels.
     */
    public function include_edited_editor()
    {
        $this->include_script('js/actions/editor-dark-mode.js');
        return $this;
    }

    /**
     * Ajoute un bouton personnalisé "Composer un email" dans le menu des messages.
     *
     * Le bouton utilise la commande "new-mail-from" et possède plusieurs classes CSS pour le style et le comportement.
     * Il est ajouté à la barre d'outils ou menu identifié par "messagemenu".
     *
     * @return void
     */
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

    /**
     * Initialise et ajoute plusieurs boutons personnalisés dans l'interface utilisateur.
     *
     * Cette méthode ajoute des boutons dans différentes barres d'outils et menus, 
     * tels que la barre des tâches, la barre d'outils des messages, le menu des événements, etc.
     * Chaque bouton est configuré avec des commandes, classes CSS, labels et titres pour l'affichage.
     * 
     * Des boutons spécifiques à la gestion des mails (déplacement, favoris, couleurs, icônes) 
     * sont ajoutés uniquement si la tâche courante est "mail".
     * 
     * En fin d'exécution, plusieurs dépendances CSS et JS spécifiques sont incluses pour garantir 
     * le bon fonctionnement et l'apparence des boutons ajoutés.
     *
     * @return void
     */
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
            'title' => 'mel_metapage.compose-mail',
            'type'       => 'link',
        ), "listcontrols");

        $this->add_button(array(
            'command' => "event-compose",
            // 'href' => './?_task=mail&_action=compose',
            'class'    => 'compose mel-event-compose options',
            'classsel' => 'compose mel-event-compose options',
            'innerclass' => 'inner',
            'label'    => 'mel_metapage.event-compose',
            'title' => 'mel_metapage.compose-mail',
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
            'data-command' => 'custom_taskbar',
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

    /**
     * Affiche l’état du mode maintenance et termine l’exécution.
     *
     * Récupère la valeur de la configuration 'maintenance' (false par défaut) et l'affiche.
     * Utilisé pour vérifier rapidement si le système est en maintenance.
     *
     * @return void
     */
    function check_maintenance()
    {
        echo $this->rc->config->get('maintenance', false);
        exit;
    }

    /**
     * Modifie le contenu HTML en fonction de la tâche courante et de certains marqueurs spécifiques.
     *
     * - Ne modifie rien si la tâche est "login" ou "logout".
     * - Si le contenu contient des indicateurs d’affichage en iframe, le contenu est traité par from_iframe().
     * - Si un paramètre GET spécifique est présent, applique from_iframe() puis ajoute du HTML via add_html().
     * - Sinon, injecte des fragments de template (modal, barup, user, option) dans le contenu HTML.
     *
     * @param array $args Tableau contenant la clé "content" avec le code HTML à modifier.
     * @return array Le même tableau $args avec le contenu HTML modifié.
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

    /**
     * Modifie le contenu HTML reçu pour y injecter des éléments personnalisés.
     *
     * - Ajoute une version (version + build) en paramètre dans les balises script de type module.
     * - Supprime les caractères BOM invisibles s'ils sont présents.
     * - Injecte le contenu du template "mel_metapage.custom_options" juste après la div avec l'id "layout".
     *
     * @param array $args Tableau contenant une clé 'content' avec le code HTML à modifier.
     * @return array Le même tableau $args avec le contenu modifié.
     */
    function appendTo($args)
    {
        if (strpos($args['content'], '/scriptType:module"') !== false) {
            $args["content"] = str_replace('/scriptType:module"', '?v=' . Version::VERSION . '.' . Version::BUILD . '" type="module"', $args["content"]);
        }

        if (strpos($args['content'], '﻿') !== false) $args['content'] = str_replace('﻿', '', $args['content']);

        if (strpos($args["content"], '<div id="layout">') === false)
            return $args;

        $tmp = explode('<div id="layout">', $args["content"]);
        $args["content"] = $tmp[0] . '<div id="layout">' . $this->rc->output->parse("mel_metapage.custom_options", false, false) . $tmp[1];

        return $args;
    }

    /**
     * Remplace le contenu donné par la vue "mel_metapage.maintenance".
     *
     * @param array $args Tableau d'arguments contenant une clé "content".
     * @return array Tableau $args avec la clé "content" mise à jour.
     */
    function maintenance($args)
    {
        $args["content"] = $this->rc->output->parse("mel_metapage.maintenance", false, false);
        return $args;
    }

    /**
     * Modifie le contenu HTML d'un calendrier pour injecter des sélecteurs personnalisés
     * dans la fenêtre d'édition d'événements.
     *
     * Cette fonction cherche la div avec l'id "eventedit" dans le contenu HTML,
     * extrait une portion spécifique du contenu correspondant à la zone d'édition,
     * puis remplace cette portion par un template personnalisé incluant :
     * - Un sélecteur de workspace (si la classe "mel_workspace" existe),
     * - Un sélecteur de catégories récupérées depuis les préférences utilisateur.
     *
     * Elle ajoute également des handlers pour générer dynamiquement ces sélecteurs
     * dans la vue.
     *
     * @param array $args Tableau associatif contenant la clé "content" avec le HTML à modifier.
     * @return array Tableau $args modifié avec le contenu HTML mis à jour.
     */
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

    /**
     * Définit le titre de la page sur "loading" puis envoie la vue "mel_metapage.loading".
     *
     * @return void
     */
    function loadingFrame()
    {
        $this->rc->output->set_pagetitle($this->gettext('loading'));
        $this->rc->output->send("mel_metapage.loading");
    }

    /**
     * Redirige l'utilisateur vers la tâche "webconf".
     *
     * @return void
     */
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

    /**
     * TODO deprecated
     */
    function ariane()
    {

        $chat_action = rcube_utils::get_input_value('_params', rcube_utils::INPUT_GET);

        if ($chat_action !== null)
            $this->rc->output->set_env('chat_go_action', $chat_action);

        $this->rc->output->send("mel_metapage.ariane");
    }

    /**
     * Indique si le stockage est actif.
     *
     * Utilise le helper mel_helper pour vérifier l'état du stockage via la méthode why_stockage_not_active().
     * Retourne true si le stockage est actif, false sinon.
     *
     * @return bool True si le stockage est actif, false autrement.
     */
    public static function stockage_is_active()
    {
        return mel_helper::load_helper(rcmail::get_instance())->why_stockage_not_active() === 'active';
    }

    /**
     * Vérifie si l'utilisateur possède une quota de stockage à zéro.
     *
     * Charge la propriété `mdrive_quota` de l'utilisateur spécifié (ou de l'utilisateur courant
     * si aucun utilisateur n'est fourni) et retourne true si la quota est définie et égale à 0.
     *
     * @param object|null $user L'objet utilisateur à vérifier. Si null, utilise l'utilisateur courant.
     * @return bool True si la quota de l'utilisateur est à zéro, false sinon.
     */
    public static function have_0_quota($user = null)
    {
        $user = $user ?? driver_mel::gi()->getUser();
        $user->load(['mdrive_quota']);
        return isset($user->mdrive_quota) && $user->mdrive_quota == 0;
    }

    /**
     * Génère et affiche le HTML pour la création d’un workspace.
     * 
     * Utilise le moteur de templates pour parser le template
     * "mel_metapage.create_workspace" sans affichage direct.
     * Affiche ensuite le contenu généré et termine l'exécution.
     *
     * @return void
     */
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
        $this->include_stylesheet($this->local_skin_path() . '/annuaire_part.css');
    }

    /**
     * Inclut tous les fichiers JavaScript présents dans le dossier 'js/configs'.
     *
     * Parcourt le répertoire 'js/configs' situé dans le même dossier que cette classe,
     * puis inclut tous les fichiers dont l'extension est '.js' via la méthode `include_script`.
     */
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
        if ($this->get_current_action() === 'edit-prefs' && $this->get_current_task() === 'settings') return;

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

    /**
     * Récupère les mails non lus pour chaque workspace et retourne un tableau JSON des détails.
     * 
     * - Charge les workspaces via la classe `mel_workspace` si disponible.
     * - Construit une requête IMAP de recherche combinant tous les mails non lus (UNSEEN)
     *   qui ont pour destinataire (TO, CC ou BCC) une adresse liée à un workspace.
     * - Si un paramètre de recherche `_q` est fourni en GET, il remplace la requête par défaut.
     * - Recherche dans la boîte via la méthode `search` du stockage et récupère les messages correspondants.
     * - Pour chaque message trouvé, identifie les workspaces cibles via la méthode `get_wsp_uids_by_to`.
     * - Construit un tableau contenant les mails groupés par workspace, avec les champs : 
     *   `from`, `subject`, `date` (formaté) et `uid`.
     * - Envoie le résultat JSON contenant les données des mails par workspace, la requête de recherche utilisée,
     *   et les résultats bruts retournés par la recherche.
     * - Termine l'exécution du script après l'affichage.
     * 
     * @return void Affiche directement un JSON des mails non lus par workspace et termine l'exécution.
     */
    public function get_wsp_unread_mails_count()
    {
        // Metapage sans workspace
        if (class_exists("mel_workspace")) {
            // $wsp = $this->rc->plugins->get_plugin("mel_workspace");
            // $wsp->load_workspaces();
            $workspaces = mel_workspace::LoadWorkspaces(); //$wsp->workspaces;
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

    /**
     * Extrait les identifiants de workspace à partir d'une liste d'adresses email.
     *
     * Analyse la chaîne `$to`, qui contient une ou plusieurs adresses email séparées par des virgules,
     * et retourne un tableau des identifiants extraits des adresses contenant le préfixe "edt."
     * suivi d'un espace de travail avant le domaine "@i-carre.net".
     *
     * Par exemple, pour une adresse "user.edt.workspace@i-carre.net",
     * la fonction retournera "workspace" dans le tableau résultant.
     *
     * @param string $to Chaîne d'adresses email séparées par des virgules.
     * @return array Tableau des identifiants workspace extraits des adresses email.
     */
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
     * Effectue une recherche de mails dans un dossier spécifié ou dans plusieurs dossiers.
     *
     * Si aucun paramètre n'est fourni, récupère les valeurs depuis les requêtes GET :
     * - `_q` pour la chaîne de recherche,
     * - `_mbox` pour le dossier (par défaut 'INBOX').
     *
     * Pour la boîte de réception (INBOX), la recherche peut s'étendre à plusieurs dossiers 
     * selon la configuration `search_on_all_bali_folders` et les dossiers abonnés.
     * Sinon, pour d'autres dossiers, la recherche est conditionnée par la configuration
     * `search_on_all_bal` et les droits sur les dossiers partagés.
     *
     * Le nombre maximal de résultats est limité par la configuration `search_mail_max` (par défaut 9999).
     * Les messages trouvés sont formatés via la classe `SearchResultMail`.
     *
     * @param string|null $input Terme(s) de recherche, ou null pour récupération depuis la requête GET.
     * @param string|null $folder Dossier de recherche, ou null pour récupération depuis la requête GET (par défaut 'INBOX').
     *
     * @return array|null Retourne un tableau de résultats formatés si $input est fourni,
     *                    sinon affiche directement les résultats en JSON et termine l'exécution.
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

    /**
     * Recherche la position d'un message dans un tableau par son identifiant UID.
     *
     * Cette fonction est un alias vers `search_id_in_mail` et retourne l'index
     * de l'élément dans `$array` dont la propriété `uid` correspond à `$id`.
     *
     * @param int|string $id L'UID du message à rechercher.
     * @param array $array Tableau d'objets mail avec une propriété `uid`.
     * @param int|null $size Nombre d'éléments à parcourir dans `$array`. Si null, utilise la taille totale.
     *
     * @return int|false L'index de l'élément trouvé ou false si non trouvé.
     */
    function mail_where($id, $array, $size = null)
    {
        return self::search_id_in_mail($id, $array, $size);
    }

    /**
     * Recherche l'index d'un message dans un tableau d'objets mail par son UID.
     *
     * Parcourt le tableau `$array` d'objets mail (ayant une propriété `uid`) jusqu'à `$size`
     * éléments (par défaut la taille totale du tableau) pour trouver l'objet dont
     * la propriété `uid` correspond à l'identifiant `$id`.
     *
     * @param int|string $id L'identifiant unique (UID) du message à rechercher.
     * @param array $array Tableau d'objets mail devant contenir une propriété `uid`.
     * @param int|null $size Nombre d'éléments à parcourir dans `$array`. Si null, utilise la taille totale.
     * 
     * @return int|false L'index dans le tableau si trouvé, sinon false.
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
     * Recherche des contacts dans les sources d'adresses configurées.
     *
     * Si aucun paramètre n'est passé, récupère la requête de recherche (`_q`) et les champs (`_headers`)
     * depuis les paramètres GET. Cherche dans toutes les sources d'adresses disponibles en fonction
     * des champs spécifiés, en incluant la recherche dans les groupes.
     *
     * Retourne soit un tableau des résultats formatés, soit affiche directement le JSON des résultats
     * et termine l'exécution si aucun argument n'a été passé (appel direct via requête HTTP).
     *
     * @param string|null $search Terme(s) de recherche (optionnel, sinon récupéré depuis GET)
     * @param array|null $fields Liste des champs à rechercher (optionnel, sinon récupérés depuis GET)
     * 
     * @return array|null Tableau des résultats de recherche formatés, ou null si sortie JSON directe.
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

    /**
     * Prépare et affiche le template de création de document.
     *
     * Enregistre un handler 'document_type' lié à la méthode `get_docs_types` pour fournir
     * les types de documents dans le template. Puis génère le rendu du template
     * "mel_metapage.create_document" et l'affiche immédiatement.
     * Termine l'exécution du script après l'affichage.
     *
     * @return void
     */
    function get_create_document_template()
    {
        $this->rc->output->add_handlers(array(
            'document_type'    => array($this, 'get_docs_types'),
        ));
        echo $this->rc->output->parse("mel_metapage.create_document", false, false);
        exit;
        //$this->rc->output->send("mel_metapage.create_document");
    }

    /**
     * Génère et affiche un sélecteur HTML des workspaces disponibles.
     *
     * Si la classe `mel_workspace` existe, récupère la liste des workspaces via `mel_workspace::LoadWorkspaces()`.
     * Puis construit un élément `<select>` HTML avec une option "none" par défaut
     * suivi des options représentant chaque workspace (avec `uid` en valeur et `title` en texte).
     *
     * Ajoute ce sélecteur comme handler `event-wsp` dans la sortie, puis affiche
     * le template "mel_metapage.event_body" qui peut utiliser ce handler.
     * Termine l'exécution immédiatement après.
     *
     * @return void
     */
    function get_event_html()
    {
        $w = function () {
            // Metapage sans workspace
            if (class_exists("mel_workspace")) {
                // $wsp = $this->rc->plugins->get_plugin("mel_workspace");
                // $wsp->load_workspaces();
                $workspaces = mel_workspace::LoadWorkspaces(); //$wsp->workspaces;
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

    /**
     * Génère un bloc HTML contenant des boutons pour chaque type de document configuré.
     *
     * Chaque bouton appelle une fonction JavaScript `m_mp_UpdateCreateDocument`
     * avec les informations sur l'extension par défaut et le type du document.
     * L'icône du bouton est définie par la classe CSS retournée par `get_document_class_icon`.
     *
     * @return string HTML contenant les boutons des types de documents.
     */
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

    /**
     * Retourne la classe CSS d'icône correspondant au type de document donné.
     *
     * @param string $icon Le type d'icône ou l'extension du document.
     * 
     * @return string La classe CSS de l'icône associée.
     */
    function get_document_class_icon($icon)
    {
        switch ($icon) {
            case 'txt':
                return "icofont-file-document";
            default:
                return $icon;
        }
    }

    /**
     * Prépare et affiche le formulaire de création/modification d'un événement calendrier.
     *
     * Cette méthode initialise le plugin calendar, charge les textes de localisation,
     * les scripts nécessaires à l'interface utilisateur, et prépare les données
     * d'un événement à partir des paramètres GET ou POST.
     *
     * Elle configure également les identités utilisateur, les catégories de calendrier,
     * et transmet ces données à l'interface via les variables d'environnement de sortie.
     *
     * Si un paramètre '_mbox' est présent dans la requête GET, la méthode
     * déclenche la conversion d'un message mail en événement.
     * Sinon, elle prépare la fenêtre modale d'édition d'événement.
     *
     * @return void
     */
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

    /**
     * Génère la liste HTML personnalisée des contacts.
     *
     * Cette méthode initialise les variables d'environnement pour la pagination
     * (nombre de pages et page courante) et appelle ensuite la méthode `table_output`
     * pour produire le tableau HTML des contacts.
     *
     * @param array $attrib Attributs HTML optionnels à appliquer à la balise contenant la liste.
     *                      Par défaut, l'attribut 'id' est défini sur 'rcmAddressList'.
     *
     * @return string HTML généré par `table_output` affichant la liste des contacts.
     */
    public function override_rcmail_contacts_list($attrib = array())
    {
        $attrib += array('id' => 'rcmAddressList');

        // set client env

        $this->rc->output->set_env('pagecount', 0);
        $this->rc->output->set_env('current_page', 0);


        return $this->rc->table_output($attrib, array(), array('name'), 'ID');
    }

    /**
     * Génère la liste HTML personnalisée des carnets d'adresses disponibles.
     *
     * Cette méthode construit un élément `<ul>` contenant des `<li>` pour chaque
     * source d'adresse récupérée via `get_address_sources()`. Chaque entrée
     * inclut un lien déclenchant une commande JavaScript pour afficher la liste
     * des adresses du carnet sélectionné.
     *
     * @param array $attrib Attributs HTML optionnels à appliquer à la balise `<ul>`.
     *                      Par défaut, l'attribut 'id' est défini sur 'rcmdirectorylist'.
     *
     * @return string HTML de la liste `<ul>` contenant les carnets d'adresses.
     */
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

    /**
     * Récupère les données météo à partir des coordonnées fournies via POST.
     *
     * Utilise le service JSON de prevision-meteo.ch pour obtenir la météo
     * en fonction de la latitude (_lat) et longitude (_lng) reçues en POST.
     * Si la requête initiale échoue (code HTTP différent de 200), elle retente
     * avec les coordonnées arrondies.
     * Utilise un proxy HTTP configuré via la clé 'weather_proxy' dans la config.
     *
     * Affiche un JSON contenant l'URL appelée et la réponse de l'API.
     * Termine le script après exécution.
     *
     * @return void
     */
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

    /**
     * Affiche et renvoie le contenu du modal 'mel_metapage.mel_modal'.
     *
     * Utilise la méthode de rendu de l'objet output pour parser un template
     * spécifique et affiche directement le résultat avant de terminer le script.
     *
     * @return void
     */
    function get_modal()
    {
        echo $this->rc->output->parse("mel_metapage.mel_modal", false, false);
        exit;
    }

    /**
     * Déconnecte l'utilisateur du plugin Rocket Chat si connecté.
     *
     * Vérifie si l'utilisateur est connecté via Rocket Chat. Si non connecté,
     * il effectue la déconnexion et affiche "unloggued". Sinon, affiche "loggued".
     *
     * Cette méthode termine le script après exécution.
     *
     * @return void
     */
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

    /**
     * Retourne une instance d’un programme spécifique selon son nom.
     *
     * Actuellement, seule la clé 'webconf' est supportée. Si la visioconférence
     * est activée, la classe correspondante est incluse et instanciée.
     * 
     * @param string $program_name Nom du programme à récupérer.
     * @return object|null Instance du programme demandé ou null si non disponible.
     */
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

    /**
     * Ajoute des sections personnalisées à la liste des préférences affichées dans l’interface utilisateur.
     *
     * Cette méthode modifie la liste `$p['list']` en y ajoutant des sections spécifiques selon
     * la disponibilité de certains plugins ou fonctionnalités, telles que la visioconférence,
     * le chat, les notifications, la navigation principale, et les paramètres expérimentaux.
     * 
     * Certaines sections sont ajoutées conditionnellement en fonction de la présence de classes
     * ou de fichiers spécifiques, ou en fonction de la configuration.
     *
     * @param array $p Tableau contenant la liste des sections de préférences existantes.
     * @return array Le tableau `$p` mis à jour avec les sections supplémentaires.
     */
    public function preferences_sections_list($p)
    {
        $dir = __DIR__;

        if ($this->visio_enabled() && is_dir("$dir/program/webconf") && file_exists("$dir/program/webconf/webconf.php")) {
            $p['list']['visio'] = [
                'id'      => 'visio',
                'section' => $this->gettext('visio', 'mel_metapage'),
            ];
        }

        if (class_exists("rocket_chat")) {
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

    /**
     * Génère un tableau HTML listant les dossiers BALI avec cases à cocher pour la recherche.
     *
     * Récupère la liste des dossiers mail abonnés (subscribed) via le stockage IMAP,
     * crée un tableau avec deux colonnes : le nom du dossier et une case à cocher indiquant
     * si la recherche doit inclure ce dossier. Le nom "INBOX" est remplacé par "Courrier entrant".
     * La sélection des cases à cocher est déterminée par la configuration passée en paramètre.
     *
     * @param array|null $config Configuration associant les noms de dossiers à un booléen indiquant
     *                          si la case doit être cochée (true) ou non (false). Par défaut, toutes cochées.
     * @return html_table Objet html_table représentant le tableau des dossiers avec cases à cocher.
     */
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

    /**
     * Génère un tableau HTML listant les boîtes aux lettres partagées (BALP) avec cases à cocher.
     *
     * Récupère la liste des BALP partagées pour l'utilisateur, puis crée un tableau HTML à deux colonnes :
     * - Le nom complet de la boîte aux lettres.
     * - Une case à cocher indiquant si la BALP est sélectionnée pour la recherche.
     *
     * Les cases à cocher sont initialisées selon la configuration fournie.
     *
     * @param array $config Configuration indiquant quelles BALP sont activées (clé = index BALP, valeur booléenne).
     * @return html_table Objet html_table représentant le tableau généré.
     */
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

    /**
     * Crée un élément HTML de type select avec label pour un champ de préférence.
     *
     * Initialise un select HTML avec un identifiant et un nom spécifiés, ajoute les options
     * fournies, puis génère un tableau contenant le label associé et le contenu HTML du select.
     * Les options sont ajoutées uniquement avec leurs libellés (valeurs numériques implicites).
     *
     * @param string $field_id Identifiant et nom du champ select.
     * @param mixed $current Valeur actuellement sélectionnée.
     * @param array $options Liste des options (libellés) à ajouter au select.
     * @param array|null $attrib Attributs additionnels HTML pour le select (optionnel).
     * @return array Tableau associatif avec les clés 'title' (label HTML) et 'content' (select HTML).
     */
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
     * Crée un élément HTML de type select avec label pour un champ de préférence.
     *
     * Initialise un select HTML avec un identifiant et un nom spécifiés, ajoute les options
     * fournies, puis génère un tableau contenant le label associé et le contenu HTML du select.
     *
     * @param string $field_id Identifiant et nom du champ select.
     * @param mixed $current Valeur actuellement sélectionnée.
     * @param array $names Liste des noms (libellés) des options.
     * @param array|null $values Liste des valeurs des options (optionnel).
     * @param array|null $attrib Attributs additionnels HTML pour le select (optionnel).
     * @return array Tableau associatif avec les clés 'title' (label HTML) et 'content' (select HTML).
     */
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

            $user = driver_mel::gi()->getUser();
            foreach ($config as $key => $value) {
                if ($key === $chat_placement || ($user->is_external && $key !== $scrollbar_size)) continue;
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

            $templates = mel_helper::Enumerable($templates);

            if (!class_exists('mel_parapheur')) $templates = $templates->where(function ($key) {
                return $key !== 'app_parapheur';
            });

            if (!class_exists('rizomo')) $templates = $templates->where(function ($key) {
                return $key !== 'app_rizomo';
            });

            if (!class_exists('mel_rocket_chat')) $templates = $templates->where(function ($key) {
                return $key !== 'app_chat';
            });

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

    /**
     * Met à jour la configuration des préférences à partir des données POST.
     *
     * Parcourt les données fournies, convertit les noms de dossiers en UTF7-IMAP,
     * remplace "INBOX" par "Courrier entrant", récupère la valeur booléenne correspondante
     * dans les données POST selon le préfixe donné, puis met à jour la configuration.
     * Supprime les entrées de configuration qui ne sont plus présentes dans les données.
     *
     * @param array $config Configuration initiale à mettre à jour.
     * @param array $datas Données de référence pour déterminer les dossiers.
     * @param string $prefix Préfixe utilisé pour extraire les valeurs dans les données POST.
     * @return array Configuration mise à jour.
     */
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

    /**
     * Inverse la visibilité du chat et sauvegarde la préférence utilisateur.
     *
     * Récupère la visibilité actuelle du chat dans la configuration, inverse cette valeur,
     * sauvegarde la nouvelle préférence pour l'utilisateur, puis renvoie le nouvel état en JSON.
     *
     * @return void
     */
    function toggleChat()
    {
        $config = !$this->rc->config->get('mel_metapage_chat_visible', true);
        $this->rc->user->save_prefs(array('mel_metapage_chat_visible' => true));

        echo json_encode($config);
        exit;
    }

    /**
     * Retourne l'instance du système d'événements.
     *
     * Charge la classe du système d'événements si nécessaire, puis renvoie son instance singleton.
     *
     * @return mel_event_system Instance du système d'événements.
     */
    public static function events()
    {
        include_once 'program/eventSystem.php';
        return mel_event_system::Instance();
    }

    /**
     * Ouvre une section spécifique dans l’interface utilisateur.
     *
     * Récupère la section à ouvrir depuis les paramètres GET, inclut un script JS,
     * puis transmet la section à ouvrir à l’environnement de sortie.
     *
     * @param array $args Arguments passés au hook (non utilisés).
     * @return void
     */
    public function open_section($args)
    {
        $section = rcube_utils::get_input_value('_open_section', rcube_utils::INPUT_GET);
        $this->include_script('js/actions/settings_events.js');
        $this->rc->output->set_env("open_section", $section);
    }

    /**
     * Retourne un message décrivant la période de maintenance prévue.
     *
     * Le message varie selon que la maintenance est en cours ou à venir.
     *
     * @param bool $during Indique si la maintenance est en cours (true) ou à venir (false).
     * @return string Message décrivant la maintenance, ou chaîne vide si aucune maintenance prévue.
     */
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

    /**
     * Gère l’erreur lors de l’envoi d’un message.
     *
     * Envoie une commande JavaScript au client via l’interface pour notifier l’erreur.
     *
     * @param array $args Données relatives à l’erreur d’envoi du message.
     * @return array Les mêmes données passées en argument.
     */
    public function message_send_error($args)
    {
        $this->rc->output->command('plugin.message_send_error', $args);
        //$this->rc->output->add_script('parent.rcmail.env["message_send_error.value"] = '.json_encode($args));
        return $args;
    }

    /**
     * Modifie le message de confirmation lors de la sauvegarde d’un brouillon.
     *
     * Si le brouillon est sauvegardé dans la boîte aux lettres définie par la config 'models_mbox',
     * le message de confirmation est remplacé par une chaîne localisée 'model_saved' du plugin 'mel_metapage'.
     *
     * @param array $args Tableau contenant au moins :
     *                    - 'folder' : nom de la boîte aux lettres où le brouillon est sauvegardé.
     *                    - 'message' : message de confirmation original.
     * @return array Le tableau $args modifié avec un message de confirmation personnalisé.
     */
    public function message_draftsaved($args)
    {
        if ($args['folder'] === $this->rc->config->get('models_mbox')) {
            $args['message'] = $this->gettext('model_saved', 'mel_metapage');
        }

        return $args;
    }

    /**
     * Hook appelé lors de la récupération des objets d’un message.
     *
     * Cette méthode analyse le corps du message pour détecter des liens bloqués ou suspects.
     * - Si des liens bloqués sont détectés, un message d’alerte rouge est ajouté au contenu.
     * - Si des liens suspects sont détectés, un message d’alerte jaune est ajouté au contenu.
     *
     * @param array $args Tableau contenant au moins :
     *                    - 'message' : l’objet message avec son UID.
     *                    - 'content' : tableau des parties HTML/textuelles à afficher.
     * @return array Le tableau $args modifié avec les alertes ajoutées dans 'content' si nécessaire.
     */
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

    /**
     * Hook appelé lors de la récupération du contenu d'une partie d'un message.
     *
     * Cette méthode vérifie si le message contient des liens bloqués (phishing).
     * Si c'est le cas, elle vide le corps du message afin d'empêcher l'affichage de contenu potentiellement dangereux.
     *
     * @param array $args Tableau contenant les clés :
     *                    - 'body' : le contenu HTML ou texte de la partie du message.
     *                    - 'object' : l'objet message complet avec notamment les en-têtes dans 'headers'.
     * @return array Le tableau $args potentiellement modifié, avec 'body' vidé si le message est bloqué.
     */
    public function hook_message_part_get($args)
    {

        if ($this->check_message_is_bloqued($args['body'], $args['object']->headers)) {
            $args['body'] = ''; //"Ce message est bloqué par le Bnum car il contient des liens de phishing !";
        }

        return $args;
    }

    /**
     * Hook pour modifier la liste des messages avant affichage.
     *
     * Cette méthode nettoie et reformate les entêtes "From" des messages pour améliorer la lisibilité
     * dans la liste des messages. Elle gère notamment les cas où le nom contient des informations de type
     * "emis par", des services, ou des descriptions entre parenthèses.
     * 
     * Elle ajuste aussi le champ `title` du message avec le nom complet décodé.
     *
     * Le comportement dépend de la configuration `mel_messages_list_clear_headers` qui peut être :
     * - "full" : retourne les arguments sans modification.
     * - "service" : affiche le nom avec le service associé.
     * - autre : affiche juste le nom.
     *
     * Certaines parties de code concernant la détection des messages suspects ou bloqués sont commentées.
     *
     * @param array $args Tableau contenant la liste des messages sous la clé 'messages'.
     * @return array Tableau modifié avec les messages dont les entêtes "From" sont nettoyés et reformattés.
     */
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
            } else if (strpos($part['mailto'], $name . '@') === 0) {
                $part['name'] = ucwords(str_replace('.', ' ', $part['name']));
            }

            $message->title = $part['string'];

            // Gestion du emis par
            if (!empty($sender)) {
                $part['name'] .= ' emis par ' . trim($sender);
            }

            if (
                $this->rc->config->get('mel_messages_list_clear_headers', "full") == "service"
                && !empty($service)
            ) {
                $message->from = $part['name'] . ' - ' . $service . " <" . $part['mailto'] . ">";
            } else {
                $message->from = $part['name'] . " <" . $part['mailto'] . ">";
            }
        }

        return $args;
    }

    /**
     * Ajoute à la configuration les URLs personnalisées marquées comme non bloquées (suspectes).
     *
     * Appelle la méthode interne `_check_message_is_custom` avec l’argument `true` pour récupérer
     * les URLs configurées comme suspectes mais non bloquées, et les fusionne avec la configuration existante.
     *
     * @param array $args Tableau d’arguments contenant au moins la clé 'config' (tableau).
     * @return array Arguments mis à jour avec les URLs suspectes ajoutées à 'config'.
     */
    public function check_message_is_suspect_custom($args)
    {
        $args['config'] = array_merge($args['config'], $this->_check_message_is_custom(true));
        return $args;
    }

    /**
     * Ajoute à la configuration les URLs personnalisées bloquées.
     *
     * Utilise la méthode interne `_check_message_is_custom` en passant `false` pour récupérer
     * les URLs dont le flag 'bloqued' est à true.
     *
     * @param array $args Tableau d'arguments contenant au moins la clé 'config' (tableau).
     * @return array Arguments mis à jour avec les URLs bloquées ajoutées à 'config'.
     */
    public function check_message_is_bloqued_custom($args)
    {
        $args['config'] = array_merge($args['config'], $this->_check_message_is_custom(false));
        return $args;
    }

    /**
     * Vérifie les URLs personnalisées suspectes ou bloquées selon l’état suspect du message.
     *
     * Parcourt la configuration 'mel_custom_suspected_url' pour retourner les URLs correspondant
     * à l’état suspect ($isSuspect) et leur statut bloqué.
     *
     * @param bool $isSuspect Indique si le message est suspect ou non.
     * @return array Liste des URLs correspondant aux critères (suspect ou bloquées).
     */
    private function _check_message_is_custom($isSuspect)
    {
        $array = [];
        // Mise à jour du code pour remplacer la config par le hook BDD
        $plugin = $this->rc->plugins->exec_hook('mel_urls_suspects_get_all', ['urls' => []]);
        $custom = $plugin['urls'] ?? [];

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
            // Mise à jour du code pour remplacer la config par le hook BDD
            $plugin = $this->rc->plugins->exec_hook('mel_urls_suspects_get_all', ['urls' => []]);
            $config = [];
            
            if (isset($plugin['urls']) && is_array($plugin['urls'])) {
                foreach ($plugin['urls'] as $url => $datas) {
                    if ($datas['bloqued'] === false) {
                        $config[] = $url;
                    }
                }
            }
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
            // Mise à jour du code pour remplacer la config par le hook BDD
            $plugin = $this->rc->plugins->exec_hook('mel_urls_suspects_get_all', ['urls' => []]);
            $config = [];
            
            if (isset($plugin['urls']) && is_array($plugin['urls'])) {
                foreach ($plugin['urls'] as $url => $datas) {
                    if ($datas['bloqued'] === true) {
                        $config[] = $url;
                    }
                }
            }
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

    /**
     * Filtre les contacts pour enlever les doublons dans la liste d'autocomplétion.
     *
     * Utilise une fonction personnalisée pour détecter les doublons en se basant sur le champ 'name'.
     * Si le nom contient un '<', la comparaison se fait sur la version en minuscules du nom complet,
     * sinon la valeur entière est utilisée pour la comparaison.
     *
     * @param array $args Tableau contenant au moins la clé 'contacts' avec la liste des contacts.
     * @return array Retourne le tableau $args avec la liste des contacts filtrée sans doublons.
     */
    function contacts_autocomplete_after($args)
    {
        $args['contacts'] = mel_helper::Enumerable($args['contacts'])->removeTwins(function ($k, $v) {
            if (strpos($v['name'], '<') !== false) return strtolower($v['name']);
            else return $v;
        })->toArray();
        return $args;
    }

    /**
     * Vérifie si une application est activée dans la configuration.
     *
     * @param string $app Nom de l'application à vérifier. Si 'chat', sera converti en 'app_chat'.
     * @param bool $load_config Indique si la configuration doit être chargée avant la vérification.
     * @return bool Retourne true si l'application est activée, false sinon.
     */
    function is_app_enabled($app, $load_config = false)
    {
        if ($app === 'chat') $app = 'app_chat';

        if ($load_config) $this->load_config();

        $rcmail = $this->rc ?? rcmail::get_instance();
        $item = $rcmail->config->get('navigation_apps', null);

        if (isset($item)) return $item[$app]['enabled'] ?? $rcmail->config->get('template_navigation_apps', null)[$app]['enabled'] ?? true;

        return true;
    }

    /**
     * Vérifie si un utilisateur dispose de Cerbère.
     *
     * Charge les informations Cerbère de l'utilisateur via mel_helper::load_user_cerbere,
     * puis retourne vrai si l'utilisateur a un niveau Cerbère >= 1, sinon faux.
     *
     * @param mixed $user Utilisateur (objet ou identifiant) à vérifier.
     * @return bool True si l'utilisateur a Cerbère, false sinon.
     */
    public static function user_have_cerbere($user)
    {
        $user = mel_helper::load_user_cerbere($user);
        return $user !== null && $user >= 1;
    }

    /**
     * Affiche si l'utilisateur courant dispose de Cerbère (fonctionnalité/permission).
     *
     * Récupère l'utilisateur courant via driver_mel et affiche le résultat
     * de la méthode statique `user_have_cerbere` appliquée à cet utilisateur.
     * Termine ensuite le script avec un exit.
     *
     * @return void
     */
    public function get_have_cerbere()
    {
        echo self::user_have_cerbere(driver_mel::gi()->getUser());
        exit;
    }

    /**
     * Ajoute un commentaire à un e-mail en modifiant son en-tête personnalisé `X-Suivimel`
     * et, si fourni, met à jour le sujet. Le message est ensuite réenregistré et l’original supprimé.
     *
     * Fonctionnement :
     * - Récupère l'e-mail brut via son UID dans un dossier donné.
     * - Insère ou modifie l'en-tête `X-Suivimel` avec le commentaire de l'utilisateur.
     * - Met à jour le sujet si nécessaire.
     * - Réenregistre le message avec ses en-têtes et drapeaux d'origine.
     * - Marque le nouveau message comme `~commente` et `SEEN`.
     * - Supprime l'ancien message.
     *
     * @return void Affiche l'identifiant du nouveau message si réussi, ou "false" sinon, puis termine le script avec `exit`.
     *
     * @global string $_POST['_folder']   Dossier du message (par défaut : "INBOX")
     * @global int    $_POST['_uid']      UID du message à commenter
     * @global string $_POST['_comment']  Commentaire à insérer
     * @global string $_POST['_subject']  Nouveau sujet (optionnel)
     * @global string $_POST['_user']     Adresse e-mail de l'utilisateur commentateur
     */
    public function comment_mail()
    {
        $folder = rcube_utils::get_input_value('_folder', rcube_utils::INPUT_POST) ?? 'INBOX';
        $message_uid = intval(rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST));
        $comment = rcube_utils::get_input_value('_comment', rcube_utils::INPUT_POST);
        $subject = rcube_utils::get_input_value('_subject', rcube_utils::INPUT_POST);
        $user_mail = rcube_utils::get_input_value('_user', rcube_utils::INPUT_POST) ?? null;

        $this->rc->get_storage()->set_folder($folder);

        $headers_old = $this->rc->get_storage()->get_message_headers($message_uid, $folder);
        $mail_raw = $this->rc->get_storage()->get_raw_body($message_uid);
        if (strpos($mail_raw, 'X-Suivimel') !== false) {
            $mail_raw = explode('X-Suivimel', $mail_raw);
            $suivi = explode("\n", str_replace(': ', '', $mail_raw[1]))[0];
            $suivi = 'Le ' . date('d/m/Y H:i') . ', ' . driver_mel::gi()->getUser(null, true, false, null, $user_mail)->name . " a ajouté :¤¤$comment" . "¤¤" . rcube_mime::decode_header($suivi);
            $mail_raw = $mail_raw[0] . 'X-Suivimel: ' . Mail_mimePart::encodeHeader('X-Suivimel', $suivi, RCUBE_CHARSET) . $mail_raw[1];
        } else {
            $mail_raw = str_replace('Subject: ', 'X-Suivimel: ' . Mail_mimePart::encodeHeader('X-Suivimel', "Le " . date('d/m/Y H:i') . ', ' . driver_mel::gi()->getUser(null, true, false, null, $user_mail)->name . " a ajouté :¤¤$comment", RCUBE_CHARSET) . "\nSubject: ", $mail_raw);
        }

        if ($subject) $mail_raw = preg_replace(
            '/^Subject:.*(?:\r?\n[ \t].*)*/mi', // Expression régulière pour trouver la ligne commençant par "Subject: "
            'Subject: ' . Mail_mimePart::encodeHeader('Subject', $subject, 'utf-8'), // Remplacement par la nouvelle valeur de $subject
            $mail_raw
        );

        $datas = $this->rc->storage->save_message($folder, $mail_raw, '', false, [], $headers_old->date);

        if ($datas !== false) {
            $message = new rcube_message($message_uid, $folder);

            foreach ($message->headers->flags as $flag => $value) {
                $this->rc->storage->set_flag($datas, strtoupper($flag), $folder);
            }

            $this->rc->storage->set_flag($datas, "~commente", $folder);
            $this->rc->storage->set_flag($datas, 'SEEN', $folder);
            $this->rc->get_storage()->delete_message($message_uid, $folder);

            echo $datas;
        } else echo 'false';

        exit;
    }

    /**
     * Gère l'enregistrement du message de notification d'un événement envoyé aux participants.
     *
     * Cette méthode est appelée lorsque les participants à un événement ont été notifiés.
     * Elle reformate les en-têtes du message, puis l'enregistre dans le dossier "Envoyés"
     * de l'organisateur, que ce soit une boîte personnelle ou une boîte partagée.
     *
     * @param array $args Tableau associatif contenant :
     * - 'orga'     : array Informations sur l'organisateur (doit contenir 'email')
     * - 'attendees': array Liste des participants, chacun avec 'email' et 'name'
     * - 'message'  : rcube_message Objet message contenant le contenu à enregistrer
     * - 'event'    : array Données de l'événement (non utilisées directement ici)
     *
     * @return void
     */
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

            $datas = $this->rc->storage->save_message("Boite partag&AOk-e/$tmp/$folder", $msg);

            if ($datas === false) {
                $tmp2 = explode('.', $tmp);
                $tmp = '';
                $it = 0;
                while ($datas === false && $it < count($tmp2)) {
                    $tmp .= $tmp2[$it++];
                    $datas = $this->rc->storage->save_message("Boite partag&AOk-e/$tmp/$folder", $msg);
                    $tmp .= '.';
                }

                if ($datas !== false) $folder = "Boite partag&AOk-e/$tmp/$folder";
            }
        } else {
            if (!isset($this->rc->storage)) {
                $this->rc->storage_init();
            }

            if (isset($this->rc->storage)) {
                $datas = $this->rc->storage->save_message($folder, $msg);
            }
        }

        if ($datas !== false) {
            $this->rc->storage->set_flag($datas, "~rdvtraite", $folder);
            $this->rc->storage->set_flag($datas, 'SEEN', $folder);
        }
    }

    /**
     * Méthode de test et de débogage.
     *
     * Cette méthode est utilisée pour charger des scripts de test et afficher une page dédiée au débogage.
     * - Charge le système de gestion de dépendances avec `IncludeLoader()`.
     * - Inclut le script `test.js` situé dans `js/actions`.
     * - Rend la vue `mel_metapage.test` pour affichage dans l'interface.
     *
     * @note Cette méthode est probablement destinée à un usage en environnement de développement uniquement.
     *
     * @return void
     */
    public function debug_and_test()
    {
        //$this->include_script('js/program/webconf_video_manager.js');
        self::IncludeLoader();
        $this->include_module('test.js', 'js/actions');
        $this->rc->output->send('mel_metapage.test');
    }

    /**
     * Affiche le gabarit de chargement (loading frame).
     *
     * Cette méthode rend le template `mel_metapage.loader` à l'aide de l'objet `output`.
     * Utilisée pour afficher une animation ou un écran de chargement temporaire dans l'interface utilisateur.
     *
     * @return void
     */
    public function action_loading_frame()
    {
        $this->rc->output->send('mel_metapage.loader');
    }

    /**
     * Point d'entrée public pour charger les événements du calendrier.
     *
     * Cette méthode récupère les paramètres depuis la requête GET :
     * - start : timestamp de début
     * - end : timestamp de fin
     * - q : terme de recherche (optionnel)
     * - source : identifiant du calendrier (optionnel)
     * - last : identifiant de dernière récupération (optionnel)
     * - force : détermine si le rechargement doit être forcé ('true', 'false', ou 'random')
     *
     * Elle utilise la méthode interne `_calendar_load_events` pour récupérer les événements,
     * les encode en JSON, puis les renvoie comme réponse HTTP.
     *
     * @return void
     */
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

    /**
     * Charge les événements d'un calendrier sur une période donnée, avec options de forçage et d'encodage.
     *
     * Cette méthode interagit avec le plugin `calendar` (s'il est disponible) pour récupérer les événements
     * entre deux timestamps, avec prise en charge du filtrage par requête, identifiant de calendrier,
     * forçage de rechargement ou d'utilisation du cache, et option d'encodage du résultat.
     *
     * @param int         $start   Timestamp de début de la période.
     * @param int         $end     Timestamp de fin de la période.
     * @param string|null $querry  Terme de recherche pour filtrer les événements.
     * @param string|null $calid   Identifiant du calendrier à interroger.
     * @param mixed       $last    Valeur de cache ou de référence pour la récupération différentielle.
     * @param string|bool $force   Contrôle du forçage : 'true', 'false', 'random' ou booléen.
     *                             Si 'random', une chance sur 11 d'imposer le forçage.
     * @param bool        $encode  Si vrai, encode les événements avec la méthode du plugin.
     *
     * @return array {
     *     @type mixed  $forced  Indique si le chargement a été forcé.
     *     @type mixed  $events  Liste des événements récupérés.
     *     @type bool   $encoded Indique si les événements ont été encodés.
     *     @type string $cal     Identifiant du calendrier interrogé.
     * }
     */
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

    /**
     * Récupère une valeur d'entrée (GET, POST, etc.) et la convertit en timestamp Unix si nécessaire.
     *
     * Cette méthode utilise `rcube_utils::get_input_value()` pour extraire une valeur
     * (par exemple une date ou un datetime) à partir d'une source d'entrée spécifiée,
     * et tente de la convertir en timestamp Unix.
     *
     * Si la valeur contient le caractère 'T' (comme dans les formats ISO 8601), ou
     * si ce n’est pas un entier numérique, elle est convertie en objet `DateTime`
     * selon le fuseau horaire courant, puis transformée en timestamp.
     *
     * @param string $name Nom du paramètre à récupérer.
     * @param int    $type Type d’entrée (ex. : `rcube_utils::INPUT_POST`, `rcube_utils::INPUT_GET`).
     *
     * @return int|null Timestamp Unix correspondant à la valeur, ou `null` si aucun ou invalide.
     */
    protected function input_timestamp($name, $type)
    {
        $ts = rcube_utils::get_input_value($name, $type);

        if ($ts && (!is_numeric($ts) || strpos($ts, 'T'))) {
            $ts = new DateTime($ts, $this->timezone);
            $ts = $ts->getTimestamp();
        }

        return $ts;
    }

    /**
     * Initialise et affiche la page Bnum (page principale de l'environnement MEL).
     *
     * Cette méthode prépare l'environnement JavaScript côté client avec certaines
     * valeurs nécessaires à la navigation, telles que :
     * - Une éventuelle redirection (`bnum.redirect`)
     * - Le task et action initiaux (`bnum.init_task`, `bnum.init_action`)
     * - L'état d'activation de certains plugins (via `set_plugin_env_exist()`)
     * - Les options de multi-fenêtrage (`frames.multi_frame_enabled`, `frames.max_multi_frame`)
     *
     * Elle ajoute également un lien vers le fichier `manifest.json` pour le support
     * des Progressive Web Apps (PWA).
     *
     * Si l'utilisateur n'est pas authentifié (`user_id` non présent en session),
     * la méthode redirige vers la page de déconnexion.
     * Sinon, elle affiche la vue `mel_metapage.empty`.
     *
     * @return void
     */
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

    /**
     * Définit dans l'environnement client les plugins disponibles.
     *
     * Cette méthode vérifie la présence de certaines classes correspondant à des plugins
     * (tels que mel_workspace, calendar, tasklist, etc.) et définit des variables d'environnement
     * (`set_env`) côté client pour indiquer leur disponibilité. Cela permet à l'interface utilisateur
     * de s'adapter dynamiquement en fonction des plugins réellement activés.
     *
     * Variables d'environnement définies (si la classe correspondante existe) :
     * - plugin_list_workspace
     * - plugin_list_agenda
     * - plugin_list_tache
     * - plugin_list_document
     * - plugin_list_sondage
     * - plugin_list_chat
     * - plugin_list_notifications
     * - plugin_list_help
     * - plugin_list_visio
     *
     * @return void
     */
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

    /**
     * Vérifie si la fonctionnalité de visioconférence est activée.
     *
     * @return bool True si la visioconférence est activée, false sinon.
     */
    public function visio_enabled()
    {
        return $this->rc->config->get('visio_enabled', false);
    }

    /**
     * Récupère la liste des dossiers email d'un utilisateur à partir de son identifiant.
     *
     * Se connecte au serveur IMAP correspondant à l'utilisateur (en SSL ou non)
     * et récupère directement la liste des dossiers.
     *
     * @param string $id Identifiant de l'utilisateur (login).
     * @return array Liste des dossiers email récupérés, ou tableau vide en cas d'échec.
     */
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

    /**
     * Refactore la liste des dossiers email en fonction d'un ID donné.
     * 
     * Transforme, trie et formate les noms des dossiers en fonction du label BALP et du délimiteur IMAP.
     *
     * @param string $id Identifiant utilisé pour filtrer et transformer les dossiers.
     * @param array $folders Liste initiale des dossiers email.
     * 
     * @return array Liste des dossiers refactorés, clé = nom original, valeur = nom formaté.
     */
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

    /**
     * Récupère l'identité utilisateur correspondant à un UID donné.
     *
     * Si aucun UID n'est fourni, utilise celui de l'utilisateur courant.
     * Utilise un cache local pour éviter les appels répétés.
     *
     * @param string|null $uid UID de l'utilisateur (optionnel)
     * @return array|null Identité utilisateur ou null si non trouvée
     */
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

    /**
     * Charge les paramètres et le HTML d'une option spécifique.
     *
     * Récupère l'option via GET, exécute des hooks pour modifier le comportement,
     * charge le template HTML correspondant et prépare les valeurs par défaut des paramètres.
     * Renvoie un JSON contenant le HTML et les valeurs par défaut.
     *
     * @return void
     */
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

    /**
     * Modifie dynamiquement la valeur par défaut d'une option utilisateur.
     *
     * Utilisé pour injecter des valeurs spécifiques selon le paramètre demandé.
     *
     * @param array $args Données contenant l'option, le paramètre et la valeur par défaut
     * @return array Arguments avec la valeur par défaut potentiellement ajustée
     */
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

    /**
     * Enregistre une préférence utilisateur via une requête POST.
     *
     * Utilise les hooks `metapage.save.option` et `metapage.save.option.after`
     * pour permettre des ajustements avant et après la sauvegarde.
     *
     * @return void Répond en JSON avec la valeur enregistrée
     */
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

    /**
     * Prétraite une option avant sa sauvegarde utilisateur.
     *
     * Convertit ou regroupe certaines options en fonction de leur type ou nom.
     * Utilisé via le hook `metapage.save.option`.
     *
     * @param array $args Contient 'option' (nom) et 'value' (valeur)
     * @return array Les arguments éventuellement modifiés
     */
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

    /**
     * Post-traite une option après sa sauvegarde.
     *
     * Recharge les paramètres du plugin calendrier si l'option concerne le calendrier.
     * Utilisé via le hook `metapage.save.option.after`.
     *
     * @param array $args Contient 'option' (nom) et 'value' (valeur)
     * @return array Les arguments modifiés si nécessaire
     */
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

    /**
     * Hook de génération dynamique d'options personnalisées pour l'interface utilisateur.
     *
     * Cette méthode est appelée par un hook pour générer dynamiquement des blocs HTML
     * selon l'option fournie dans `$args['option']`. Elle remplace des marqueurs (`%%...%%`)
     * dans le HTML fourni par des éléments interactifs (select, slider, etc.).
     *
     * ### Options supportées :
     * - `calendar` : Gère des sélecteurs d'heures pour les paramètres liés au calendrier
     *   comme `calendar_work_start`, `calendar_work_end`, `calendar_first_hour`.
     * - `mail` : Gère l'affichage du délai d'envoi d'e-mail (`mail_delay`) via un input de type `range`.
     *
     * @param array $args Tableau contenant :
     *   - string $option          Type d'option à générer (ex: "calendar", "mail")
     *   - string $html            HTML contenant des marqueurs personnalisés à remplacer
     *   - array  $default_values  Valeurs par défaut à utiliser si la config est vide
     *
     * @return array Le tableau `$args` modifié, avec le HTML mis à jour et les valeurs traitées
     */
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

    /**
     * Nettoie les cookies sensibles après la déconnexion.
     *
     * Supprime les cookies liés à l'identité, à la session ou au login, sauf `roundcube_login`.
     * Détruit également la session PHP.
     *
     * @param array $args Paramètres du hook logout
     * @return array Arguments inchangés
     */
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

    /**
     * Récupère une valeur de configuration utilisateur.
     *
     * Lit une option via GET et renvoie sa valeur (ou une valeur par défaut) au format JSON.
     *
     * @return void
     */
    public function get_setting()
    {
        $option = rcube_utils::get_input_value('_option', rcube_utils::INPUT_GET);
        $default = rcube_utils::get_input_value('_default_value', rcube_utils::INPUT_GET);

        echo json_encode($this->rc->config->get($option, $default));
        exit;
    }

    /**
     * Retourne l'état du mode image.
     *
     * @return bool True si activé, false sinon (défaut : true)
     */
    public function get_picture_mode()
    {
        return $this->rc->config->get('picture-mode', true);
    }

    /**
     * Capture l'expéditeur d'un message lors du traitement de sa structure.
     *
     * Stocke l'en-tête "From" pour un usage ultérieur.
     *
     * @param array $args Données du message en cours d'analyse
     * @return array Arguments inchangés
     */
    public function hook_message_part_structure($args)
    {
        $this->from_message_reading = $args['object']->headers->get('from');

        return $args;
    }

    /**
     * Marque un message comme sûr si l'expéditeur est de confiance.
     *
     * Utilise l'adresse extraite précédemment et la compare à la liste `trusted_mails`.
     *
     * @param array $args Données du message en cours d'affichage
     * @return array Arguments éventuellement modifiés (flag 'safe')
     */
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

    /**
     * Hook appelé lors de l'initialisation de la double authentification.
     *
     * Ce hook permet d'inclure le script JavaScript nécessaire au chargement du module
     * de double authentification dans l'interface utilisateur.
     *
     * @param array $args Les arguments du hook ('rcmail', 'plugin')
     * @return void
     */
    public function hook_double_auth_init($args) {
        $this->include_script('js/always_load/load_module.js');
    }

    public function rc_section_list($args)
    {
        $args['sections'][] = ["id" => "mel_chat_ui", "section" => "Paramètres Bnum"];

        return $args;
    }

    /**
     * Sauvegarde un domaine utilisateur dans les préférences.
     *
     * Récupère le domaine depuis la requête POST et l'ajoute à la liste
     * des domaines stockés dans la préférence `mel_user_domain`.
     *
     * @return void
     */
    public function save_user_pref_domain()
    {
        $domain = rcube_utils::get_input_value('_domain', rcube_utils::INPUT_POST);
        $user_domain = $this->rc->config->get('mel_user_domain', []);
        $user_domain[] = $domain;
        $this->rc->user->save_prefs(['mel_user_domain' => $user_domain]);
    }

    /**
     * Active ou désactive un dossier comme favori dans les préférences utilisateur.
     *
     * Met à jour la préférence `favorite_folders` selon l'état reçu en POST.
     *
     * @return void
     */
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

    /**
     * Modifie l'état d'affichage (déplié ou non) d'un dossier dans les préférences utilisateur.
     *
     * Met à jour la préférence `favorite_folders` avec la clé `expended`.
     *
     * @return void
     */
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

    /**
     * Retourne la configuration des dossiers favoris depuis les préférences utilisateur.
     *
     * @return void
     */
    public function get_display_folder()
    {
        echo json_encode($this->rc->config->get('favorite_folders', []));
        exit;
    }

    /**
     * Gère la mise à jour des préférences utilisateur lors du renommage d'un dossier.
     *
     * Met à jour les préférences liées aux dossiers favoris et à leurs couleurs.
     *
     * @param array $args Données contenant l'ancien et le nouveau nom du dossier.
     * @return array Arguments éventuellement modifiés.
     */
    public function folder_update($args)
    {
        $old = $args['record']['oldname'];
        $new = $args['record']['name'];
        $this->_update_folders_pref($old, $new);
        $this->_update_folder_color_on_rename($old, $new);
        return $args;
    }

    /**
     * mets à jour les dossiers favoris dans les préférences utilisateur.
     *
     * @param string $old Ancien nom du dossier.
     * @param string $new Nouveau nom du dossier.
     * @return void
     */
    function _update_folders_pref($old, $new)
    {
        $prefs = $this->rc->config->get('favorite_folders', []);

        if (isset($prefs[$old])) {
            $prefs[$new] = $prefs[$old];
            unset($prefs[$old]);
        }

        $this->rc->user->save_prefs(['favorite_folders' => $prefs]);
    }

    /**
     * Met à jour la couleur d’un dossier lors de son renommage.
     *
     * Transfère la couleur de l’ancien nom de dossier vers le nouveau.
     *
     * @param string $old Ancien nom du dossier
     * @param string $new Nouveau nom du dossier
     * @return void
     */
    function _update_folder_color_on_rename($old, $new)
    {
        $prefs = $this->rc->config->get('folders_colors', []);

        if (isset($prefs[$old])) {
            $prefs[$new] = $prefs[$old];
            unset($prefs[$old]);
        }

        $this->rc->user->save_prefs(['folders_colors' => $prefs]);
    }

    /**
     * Met à jour la couleur d’un dossier dans les préférences utilisateur.
     *
     * Si la couleur est vide, elle est supprimée. Renvoie les préférences mises à jour si _color_break n’est pas défini.
     *
     * @return void
     */
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

    /**
     * Met à jour l'icône d'un dossier.
     *
     * Enregistre ou supprime une icône personnalisée pour un dossier donné.
     *
     * @return void
     */
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

    /**
     * Récupère les couleurs des dossiers utilisateur.
     *
     * Retourne les préférences de couleurs des dossiers au format JSON.
     *
     * @return void
     */
    public function get_folder_colors()
    {
        $prefs = $this->rc->config->get('folders_colors', []);

        echo json_encode($prefs);
        exit;
    }

    /**
     * Récupère les icônes personnalisées des dossiers.
     *
     * Affiche les préférences d'icônes des dossiers au format JSON.
     *
     * @return void
     */
    public function get_folder_icons()
    {
        $prefs = $this->rc->config->get('folders_icons', []);

        echo json_encode($prefs);
        exit;
    }

    /**
     * Génère un message HTML contenant un texte et un lien vers la documentation de connexion.
     *
     * @return string HTML formaté du message avec lien.
     */
    public function _login_doc_message()
    {
        $url =  $this->rc->config->get('login_doc_url');
        $txt = $this->gettext('login_da');
        return html::div([], $txt . ' ' . html::a(['href' => $url], $url) . '.');
    }

    /**
     * Récupère et retourne le nombre d'éléments pour un scroll infini via un hook.
     *
     * @return void Affiche en JSON le nombre d'éléments puis termine l'exécution.
     */
    public function infiniteScrollCount()
    {
        $namespace = rcube_utils::get_input_value('_for', rcube_utils::INPUT_POST);

        $data = $this->rc->plugins->exec_hook('webcomponents.scroll.count', ['namespace' => $namespace, 'count' => 0]);

        echo json_encode($data['count'] ?? 0);
        exit;
    }

    /**
     * Récupère et retourne les données HTML d'une page spécifique pour un scroll infini via un hook.
     *
     * @return void Affiche en JSON le contenu HTML puis termine l'exécution.
     */
    public function infiniteScrollData()
    {
        $page = rcube_utils::get_input_value('_page', rcube_utils::INPUT_POST);
        $namespace = rcube_utils::get_input_value('_for', rcube_utils::INPUT_POST);

        $data = $this->rc->plugins->exec_hook('webcomponents.scroll.data', ['page' => $page, 'namespace' => $namespace, 'html' => '']);

        echo json_encode($data['html'] ?? '');
        exit;
    }

    /**
     * Gère la récupération et l'affichage de l'avatar d'un utilisateur.
     *  
     * - Renvoie une image par défaut si aucun avatar n'est disponible ou expiré.
     * - Utilise un hook pour récupérer une URL ou données d'avatar personnalisées.
     * - Redirige vers l'URL fournie par un plugin ou affiche l'image retournée.
     * - En cas d'erreur, renvoie un code HTTP 204 ou une image GIF vide.
     *
     * @return void Sort directement la réponse HTTP et termine l'exécution.
     */
    public function avatar_url()
    {
        $data = null;
        $redirect = false;
        $email = rcube_utils::get_input_value('_email', rcube_utils::INPUT_GET);
        $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GET);

        if (!isset($email)) {
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

            $this->rc->output->future_expire_header(86400 * 30);
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
            $data = $plugin['url']; //$this->rc()->output->redirect($plugin['url']);
            $redirect = true;
        } else if (!isset($plugin) && !isset($plugin['data'])) $data = $plugin['data'];
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
                $this->rc->output->future_expire_header(86400 * 30);
                $this->rc()->output->sendExit($data, ['Content-Type: ' . rcube_mime::image_content_type($data)]);
            }

            if (!empty($_GET['_error'])) {
                $this->rc()->output->sendExit('', ['HTTP/1.0 204 Photo not found']);
            }

            $this->rc()->output->sendExit(base64_decode(rcmail_output::BLANK_GIF), ['Content-Type: image/gif']);
        }
    }

    /**
     * Génère une image d'avatar par défaut avec la première lettre de l'email.
     *
     * - Utilise une couleur de fond basée sur un paramètre ou la configuration.
     * - Calcule une couleur de texte contrastante pour une bonne lisibilité.
     * - Dessine la première lettre majuscule de l'email au centre de l'image.
     *
     * @return resource Image GD créée.
     */
    public function _generate_no_picture()
    {
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

        $tmp = imagefttext($image, 120, 0, 50, 160, $text_color, __DIR__ . '/skins/mel_elastic/roboto.ttf', strtoupper(substr($email, 0, 1)));
        //imagestring($image, 2, 20, 20, substr($email, 0, 1), $text_color);

        return $image;
    }

    /**
     * Retourne une couleur de texte contrastante (noir ou blanc)
     * selon la luminosité d'une couleur de fond donnée en hexadécimal.
     *
     * @param string $bgColor Couleur de fond au format hexadécimal (#RRGGBB)
     * @return string Couleur de texte contrastante ('#000000' ou '#FFFFFF')
     */
    function getContrastingColor($bgColor)
    {
        // Convertir la couleur hexadécimale en RGB
        $r = hexdec(substr($bgColor, 1, 2));
        $g = hexdec(substr($bgColor, 3, 2));
        $b = hexdec(substr($bgColor, 5, 2));

        // Calculer la luminosité
        $luminance = (($r * 299) + ($g * 587) + ($b * 114)) / 1000;

        // Si la couleur de fond est claire, choisir une couleur de texte sombre, et vice versa
        return $luminance > 186 ? '#000000' : '#FFFFFF'; // Texte noir pour fond clair, blanc pour fond sombre
    }

    /**
     * Génère une couleur de fond basée sur une chaîne, 
     * et retourne une couleur de texte contrastante.
     *
     * @param string $name Chaîne pour générer la couleur de fond
     * @param bool $toHexa Si true, retourne les couleurs en format hexadécimal
     * @return array|string Couleurs (fond et texte) au format demandé
     */
    function getRandomColorWithContrast($name, $toHexa = false)
    {
        $bgColor = $this->stringToColorCode($name);
        $textColor = $this->getContrastingColor($bgColor);

        if (!$toHexa) return $this->getColor($bgColor, $textColor);
        else return [
            'background' => $bgColor,
            'text' => $textColor,
        ];
    }

    /**
     * Convertit deux couleurs hexadécimales en tableaux RGB.
     *
     * @param string $bgColor  Couleur de fond au format hex (ex: "#RRGGBB")
     * @param string $textColor Couleur de texte au format hex (ex: "#RRGGBB")
     * @return array Tableau associatif avec clés 'background' et 'text',
     *               chacune contenant un tableau RGB [R, G, B]
     */
    function getColor($bgColor, $textColor)
    {
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

    /**
     * Génère un code couleur hexadécimal (#RRGGBB) à partir d'une chaîne.
     *
     * @param string $str Chaîne d'entrée pour générer la couleur
     * @return string Code couleur hexadécimal
     */
    function stringToColorCode($str)
    {
        return "#" . substr(md5($str), 0, 6);
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

    /**
     * Gère le cas où aucun contact n'est trouvé lors d'une requête d'avatar.
     * Si l'action courante est 'avatar' et qu'aucun enregistrement ou donnée n'est trouvé,
     * force l'affichage d'un avatar par défaut en appelant la méthode avatar_url().
     *
     * @param array $args Données de contexte, incluant 'record', 'data', 'email' et autres.
     * @return array Arguments éventuellement modifiés.
     */
    public function no_contact_found($args)
    {
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

    /**
     * Inclut le composant JavaScript d'avatar dans la page.
     */
    public static function IncludeAvatar()
    {
        rcmail::get_instance()->plugins->get_plugin('mel_metapage')->include_component('avatar.js');
    }

    /**
     * Inclut le composant JavaScript 'bootstrap-loader.js' via le plugin mel_metapage.
     */
    public static function IncludeLoader()
    {
        rcmail::get_instance()->plugins->get_plugin('mel_metapage')->include_component('bootstrap-loader.js');
    }

    /**
     * Récupère le bouton de sondage configuré dans les préférences.
     *
     * @return string HTML du bouton de sondage ou chaîne vide si non configuré.
     */
    public static function GetSurveyButton() : string {

        if (!self::$plugin) {
        return '';
        }

        $html = '';
        $rc = rcmail::get_instance();

        // Vérification si le bouton doit être activé
        $surveyRaw = $rc->config->get('survey', false);
        if ($surveyRaw === false) return '';

        $defaults = (array) $rc->config->get('survey_defaults', []);
        $surveyConfig = ($surveyRaw === true) ? $defaults : $surveyRaw;

        // Filtre par dates
        if (!self::isInDateWindow($surveyConfig)) {
            return '';
        }

        // Affiche-t-on le bouton sur cette page ?
        if ($surveyConfig !== false && self::shouldDisplaySurvey($surveyConfig)) {

            // URL simplifiée vers la skin du plugin
            $skinDir = basename(self::$plugin->local_skin_path());
            $pluginSkinUrl = self::$plugin->url('skins/' . $skinDir);

            // Texte sur 2 lignes
            $full = (string) ($surveyConfig['text'] ?? '');
            list($first, $rest) = array_pad(explode('<br>', $full, 2), 2, '');

            $first = trim($first);
            $rest  = trim($rest);

           $textTwoLinesHtml = $rest !== ''
                ? '<span class="survey-line1">' . htmlspecialchars($first, ENT_QUOTES, 'UTF-8') . '</span><br>'
                . '<span class="survey-line2">' . htmlspecialchars($rest, ENT_QUOTES, 'UTF-8') . '</span>'
                : '<span class="survey-line1">' . htmlspecialchars($first, ENT_QUOTES, 'UTF-8') . '</span>';

            // Gestion de l'image
            $showPicture = !empty($surveyConfig['show_picture']);  // true => on veut l'image
            $file = trim((string) ($surveyConfig['picture'] ?? '')); // chemin relatif dans /pictures/

            // uniquement chemin relatif .svg
            if ($file !== '' && !preg_match('~^[a-z0-9/_-]+\.svg$~i', $file)) {
                $file = '';
            }

            // Contenu
            if ($showPicture && $file !== '') {
                $iconPath = $pluginSkinUrl . '/pictures/' . ltrim($file, '/');
                $content  = html::div(['class' => 'survey-content'],
                    // texte
                    '<span class="survey-text">'.$textTwoLinesHtml.'</span>'.
                    // puis l’image à droite si activée
                    html::img([
                        'src'   => $iconPath,
                        'alt'   => $surveyConfig['text'] ?? '',
                        'class' => 'survey-icon'
                    ])
                );
            } else {
                // Texte seul
                $content = html::div(['class' => 'survey-content'],
                    '<span class="survey-text">'.$textTwoLinesHtml.'</span>'
                );
            }

            // Classes du lien
            $classes = 'mel-button survey-button bottom-right';
            if ($showPicture && $file !== '') {
                $classes .= ' show-icon';
            }

            // Lien final
            $html .= html::a([
                'href'        => $surveyConfig['url'],
                'class'       => $classes,
                'target'      => '_blank',
                'rel'         => 'noopener noreferrer',
                'title'       => ($surveyConfig['text'] ?? '').' - Ouvrir le sondage dans un nouvel onglet',
                'aria-label'  => $surveyConfig['text'] ?? '',
            ], $content);
        }

        return $html;
    }

    /**
     * Détermine si le bouton de sondage doit être affiché sur la page courante
     * 
     * @param array $surveyConfig Configuration du sondage
     * @return bool True si le bouton doit être affiché
     */
    protected static function shouldDisplaySurvey($surveyConfig) : bool {
        // Page par défaut si aucune configuration n'est définie
        if (!isset($surveyConfig['pages']) || empty($surveyConfig['pages'])) {
            return true;
        }
        
        // Récupérer l'URL courante
        $currentUrl = $_SERVER['REQUEST_URI'] ?? '';
        
        // Vérifier si l'URL correspond à l'une des regex configurées
        foreach ($surveyConfig['pages'] as $pattern) {
            if (preg_match('#' . $pattern . '#', $currentUrl)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Retourne true si "maintenant" est entre visible_from et visible_until (inclus)
     * Format de date accepté: 'd/m/Y'
     */
    protected static function isInDateWindow(array $cfg): bool {
        // Si aucune borne -> toujours visible
        $fromStr = trim((string)($cfg['visible_from']  ?? ''));
        $untilStr= trim((string)($cfg['visible_until'] ?? ''));

        if ($fromStr === '' && $untilStr === '') {
            return true;
        }

        // Timezone (prend celle de Roundcube si dispo, sinon Europe/Paris)
        $rc = rcmail::get_instance();
        $tzName = $rc->config->get('timezone', 'Europe/Paris');
        try { $tz = new DateTimeZone($tzName); } catch (Exception $e) { $tz = new DateTimeZone('Europe/Paris'); }

        $now = new DateTimeImmutable('now', $tz);

        // Parse dates (debut = 00:00:00, fin = 23:59:59)
        $from  = self::parseConfigDate($fromStr, $tz, true); // début de journée
        $until = self::parseConfigDate($untilStr, $tz, false); // fin de journée

        if ($from && $now < $from)   return false;
        if ($until && $now > $until) return false;
        return true;
    }

    /**
     * Parse une date config au format strict 'd/m/Y'.
     * $startOfDay=true => 00:00:00 ; false => 23:59:59
     */
    protected static function parseConfigDate(string $s, DateTimeZone $tz, bool $startOfDay): ?DateTimeImmutable {
        $s = trim($s);
        if ($s === '') return null;

        // Vérif stricte du format dd/mm/yyyy (avec zéros ou non)
        if (!preg_match('~^\d{1,2}/\d{1,2}/\d{4}$~', $s)) {
            return null; // format non conforme
        }

        // Parse strict
        $dt = DateTimeImmutable::createFromFormat('d/m/Y', $s, $tz);
        $errors = DateTimeImmutable::getLastErrors();
        if (!$dt || !empty($errors['warning_count']) || !empty($errors['error_count'])) {
            return null; // date invalide (ex: 31/02/2025)
        }

        // Normalise au début/fin de journée
        $time = $startOfDay ? '00:00:00' : '23:59:59';
        return DateTimeImmutable::createFromFormat('d/m/Y H:i:s', $dt->format('d/m/Y') . ' ' . $time, $tz);
    }
}
