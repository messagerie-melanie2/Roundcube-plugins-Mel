<?php
/**
 * Classe abstraite bnum_plugin
 * Fournit des fonctionnalités de base pour les plugins Roundcube.
 */
abstract class bnum_plugin extends rcube_plugin
{
    /**
     * Chemin de base pour les modules JavaScript.
     */
    public const BASE_MODULE_PATH = '/js/lib/';

    /**
     * Nom de module par défaut.
     */
    public const BASE_MODULE_NAME = 'main';

    /**
     * Indique si le module a été chargé.
     * 
     * @var bool
     */
    private static $module_loaded = false;

    private $script_manager;

    public function __construct($api)
    {
        parent::__construct($api);
        $this->script_manager = new ScriptManager();
    }

    /**
     * Méthode abstraite d'initialisation.
     * Doit être implémentée par les classes dérivées.
     */
    abstract function init();

    /**
     * Charge un module JavaScript.
     *
     * @param string $name Nom du module (par défaut : self::BASE_MODULE_NAME).
     * @param string $path Chemin du module (par défaut : self::BASE_MODULE_PATH).
     * @param bool $save_in_memory Indique si le module doit être sauvegardé en mémoire.
     */
    protected function load_script_module($name = self::BASE_MODULE_NAME, $path = self::BASE_MODULE_PATH, $save_in_memory = false) {
        $this->load_script_module_from_plugin($this->ID, $name, $path, $save_in_memory);
    }

    /**
     * Charge un module JavaScript depuis un plugin.
     *
     * @param string $plugin Nom du plugin.
     * @param string $name Nom du module.
     * @param string $path Chemin du module.
     * @param bool $save_in_memory Indique si le module doit être sauvegardé en mémoire.
     * @param string $where Position où le script doit être ajouté (par défaut : 'docready').
     */
    protected function load_script_module_from_plugin($plugin, $name = self::BASE_MODULE_NAME, $path = self::BASE_MODULE_PATH, $save_in_memory = false, $where = 'docready') {
        $this->setup_module();

        if (!$this->script_manager->exist($name, $plugin, $path)) {
            $this->script_manager->add($name, $plugin, $path);
            // Prépare les arguments pour le script JavaScript.
            $args = "'$plugin', '$name', '$path', $save_in_memory";
            
            if ($this->api->output !== null) {
                try {
                    $this->api->output->add_script("runModule($args);", $where);
                } catch (\Throwable $th) {
                    return null;
                }
            }
        }
    }

    /**
     * Inclut le gestionnaire de cadre de script.
     */
    protected function include_script_frame_manager() {
        $this->setup_module();

        $this->include_script_from_plugin('mel_metapage', 'js/scripting_frame_manager.js');
    }

    /**
     * Charge une page JavaScript.
     *
     * @param string $name Nom de la page.
     * @return $this
     */
    protected function load_js_page($name) {
        $this->setup_module();

        // Ajoute un script pour charger la page via MelHtml.
        $this->api->output->add_script("
        if (!rcmail.env.page) rcmail.env.page = {};
        (async () => {
            if (!MelHtml) var {MelHtml} = await loadJsModule('mel_metapage', 'MelHtml.js', '/js/lib/html/JsHtml/');
            const {page} = await MelHtml.load_page('$name', '$this->ID');

            rcmail.env.page['$name'] = page;
        })();

        ", 'docready');

        return $this;
    }

    /**
     * Ajoute un script JavaScript.
     *
     * @param string $script Contenu du script.
     * @param string $where Position où le script doit être ajouté (par défaut : 'head').
     */
    protected function add_script($script, $where = 'head') {
        if ($this->api->output !== null) {
            try {
                $this->api->output->add_script($script, $where);
            } catch (\Throwable $th) {
                return null;
            }
        }
    }

    /**
     * Interrompt une fonctionnalité initiale en ajoutant un écouteur d'événement.
     *
     * @param string $key Clé de l'événement.
     */
    protected function break_initial_fonctionality($key) {
        $this->add_script("rcmail.addEventListener('$key', function break_fonctionality () {return {break:true}; });");
    }

    /**
     * Configure le module en incluant les scripts nécessaires.
     */
    protected function setup_module() {
        if (!self::$module_loaded) {
            $this->include_script_from_plugin('mel_metapage', 'js/always_load/load_module.js', 'head');
            self::$module_loaded = true;
        }
    }

    /**
     * Enregistre un gestionnaire pour une action de requête client spécifique.
     *
     * Le callback sera exécuté lors d'une requête comme /?_task=mail&_action=plugin.myaction
     *
     * @param string $action Nom de l'action (doit être unique).
     * @param callback $callback Fonction de rappel sous forme de chaîne de caractères
     *                           ou tableau avec référence d'objet et nom de méthode.
     * @param ?string $current_task (optionnel) Tâche liée à l'action (par défaut, celle en cours).
     */
    protected function force_register_action($action, $callback, $current_task = null)
    {
        $this->api->register_action($action, $this->ID, $callback, $current_task ?? $this->get_current_task());
    }

    /**
     * Enregistre plusieurs actions.
     *
     * @param array $array Tableau associatif des actions et de leurs callbacks.
     */
    protected function register_actions($array) {
        foreach ($array as $key => $action) {
            $this->register_action($key, $action);
        }
    }

    /**
     * Retourne l'instance de rcmail.
     *
     * @return rcmail
     */
    protected function rc() {
        return rcmail::get_instance();
    }

    /**
     * Retourne l'instance de stockage.
     *
     * @return rcube_storage
     */
    protected function storage() {
        return $this->rc()->get_storage();
    }

    /**
     * Retourne la tâche en cours.
     *
     * @return string
     */
    protected function get_current_task() {
        return $this->rc()->task;
    }

    /**
     * Retourne l'action en cours.
     *
     * @return string
     */
    protected function get_current_action() {
        return $this->rc()->action;
    }

    /**
     * Vérifie si l'action en cours est l'action par défaut (index).
     *
     * @return bool
     */
    protected function is_index_action() {
        return $this->get_current_action() === '' || $this->get_current_action() === 'index';
    }

    /**
     * Récupère une valeur d'entrée.
     *
     * @param string $arg Nom de l'argument.
     * @param int $type Type d'entrée (par défaut : rcube_utils::INPUT_GPC).
     * @return mixed
     */
    protected function get_input($arg, $type = rcube_utils::INPUT_GPC)
    {
        return rcube_utils::get_input_value($arg, $type);
    }

    /**
     * Récupère une valeur d'entrée POST.
     *
     * @param string $arg Nom de l'argument.
     * @return mixed
     */
    protected function get_input_post($arg)
    {
        return rcube_utils::get_input_value($arg, rcube_utils::INPUT_POST);
    }

    /**
     * Récupère une valeur de configuration.
     *
     * @param string $key Clé de configuration.
     * @param mixed $default_value Valeur par défaut si la clé n'existe pas.
     * @return mixed
     */
    protected function get_config($key, $default_value = null) {
        return $this->rc()->config->get($key, $default_value);
    }

    /**
     * Inclut une feuille de style CSS.
     *
     * @param string $path Chemin de la feuille de style.
     * @param bool $local Indique si le chemin est local.
     */
    protected function include_css($path, $local = false)
    {
        if ($local)
            $this->include_stylesheet(__DIR__."/css/$path");
        else
            $this->include_stylesheet($this->local_skin_path()."/$path");
    }

    /**
     * Exécute un hook.
     *
     * @param string $hook Nom du hook.
     * @param array $args Arguments du hook.
     */
    protected function exec_hook($hook, $args = []) {
        return $this->rc()->plugins->exec_hook($hook, $args);
    }

    /**
     * Ajoute un gestionnaire d'événements.
     *
     * @param string $name Nom de l'événement.
     * @param callback $callback Fonction de rappel.
     */
    protected function add_handler($name, $callback)
    {
        $this->rc()->output->add_handlers(array(
            $name    => $callback,
        ));
    }

    /**
     * Redirige vers une tâche et une action spécifiques.
     *
     * @param string $task Tâche cible.
     * @param string|null $action Action cible.
     * @param array|null $params Paramètres supplémentaires pour la redirection.
     */
    protected function redirect($task, $action = null, $params = null) {
        $args = [
            '_task' => $task
        ];

        if (isset($action)) $args['_action'] = $action;

        if (isset($params) && count($params) > 0) {
            foreach ($params as $key => $value) {
                $args[$key] = $value;
            }
        }
 
        $this->rc()->output->redirect($args);
    }

    /**
     * Vérifie si la tâche en cours est 'bnum'.
     *
     * @return bool
     */
    protected function is_bnum_task() {
        return $this->get_current_task() === 'bnum';
    }

    /**
     * Récupère un utilisateur.
     *
     * @param string|null $uid Identifiant de l'utilisateur.
     */
    protected function get_user($uid = null) {
        return driver_mel::gi()->getUser($uid);
    }

    /**
     * Récupère un utilisateur à partir de son adresse e-mail.
     *
     * @param string $email Adresse e-mail de l'utilisateur.
     */
    protected function get_user_from_email($email) {
        return  driver_mel::gi()->getUser(null, true, false, null, $email);
    }

    /**
     * Indique au footer que le footer doit être caché.
     */
    protected function ignore_footer() {
        mel_elastic::IgnoreFooter();
    }

    /**
     * Envoie une réponse et termine l'exécution.
     *
     * @param mixed $item Contenu de la réponse.
     * @param array $headers En-têtes HTTP à inclure dans la réponse.
     */
    protected function sendExit($item, $headers = []) {
        if (count($headers) > 0) {
            foreach ($headers as $header) {
                header($header);
            }
        }

        echo $item;
        exit;
    }

    /**
     * Envoie une réponse JSON et termine l'exécution.
     *
     * @param mixed $item Données à encoder en JSON.
     * @param array $headers En-têtes HTTP à inclure dans la réponse.
     */
    protected function sendEncodedExit($item, $headers = ['Content-Type: application/json']) {
        $this->sendExit(json_encode($item), $headers);
    }
    
    /**
     * Inclut un composant Web.
     *
     * @return ?WebComponnents
     */
    protected function include_web_component() : ?WebComponnents {
        include_once __DIR__.'../mel_elastic/program/webcomponents.php';
     
        if (class_exists('WebComponnents')) return WebComponnents::Instance();
        else return null;
    } 

    /**
     * Inclut un composant.
     *
     * @param string $name Nom du composant.
     * @param string $path Chemin du composant.
     * @param string $plugin Nom du plugin.
     */
    public function include_component($name, $path = (self::BASE_MODULE_PATH.'html/JsHtml/CustomAttributes') , $plugin = 'mel_metapage') {
        if ($path[0] === '/') $path = substr($path, 1);

        $this->include_script_from_plugin($plugin, "$path/$name/scriptType:module", 'head');
    }

    /**
     * Inclut un module.
     *
     * @param string $name Nom du module.
     * @param string $path Chemin du module.
     * @param string $position Position où le script doit être ajouté.
     */
    public function include_module($name, $path = 'js/lib', $position = 'head') {
        $this->include_script_from_plugin($this->ID, "$path/$name/scriptType:module", $position);
    }

    /**
     * Inclut un module de programme.
     *
     * @param string $name Nom du module.
     * @param string|null $path Chemin du module.
     */
    public function include_module_program($name, $path = null ) {
        $path = $path === null ? '' : "/$path";
        $this->include_module($name, "js/lib/program$path");
    }

    /**
     * Inclut un module d'action.
     *
     * @param string $name Nom du module.
     * @param string|null $path Chemin du module.
     */
    public function include_module_action($name, $path = null ) {
        $path = $path === null ? '' : "/$path";
        $this->include_module($name, "js/lib/program/actions$path");
    }

    /**
     * Inclut un module d'addon.
     *
     * @param string $name Nom du module.
     * @param string|null $path Chemin du module.
     */
    public function include_module_addon($name, $path = null ) {
        $path = $path === null ? '' : "/$path";
        $this->include_module($name, "js/lib/program/addons$path");
    }

    /**
     * Inclut un script depuis un plugin.
     *
     * @param string $plugin Nom du plugin.
     * @param string $fn Nom du fichier.
     * @param string $pos Position où le script doit être ajouté.
     */
    public function include_script_from_plugin($plugin, $fn, $pos = 'head_bottom')
    {
        if (!$this->script_manager->exist($fn, $plugin)) {
            $this->script_manager->add($fn, $plugin);
        
            $ID = rcmail::get_instance()->plugins->get_plugin($plugin)->ID;
            if (is_object($this->api->output) && $this->api->output->type == 'html') {
                $src = $this->resource_url_from_plugin($fn, "plugins/$ID");
                $this->rc()->output->include_script($src, $pos, false);
            }
        }
    }

    /**
     * Génère l'URL de la ressource à partir du plugin.
     *
     * @param string $fn Nom du fichier.
     * @param string $id Identifiant du plugin.
     * @return string
     */
    private function resource_url_from_plugin($fn, $id)
    {
        // pattern "skins/[a-z0-9-_]+/plugins/$this->ID/" used to identify plugin resources loaded from the core skin folder
        if ($fn[0] != '/' && !preg_match("#^(https?://|skins/[a-z0-9-_]+/plugins/$id/)#i", $fn)) {
            return $id . '/' . $fn;
        }
        else {
            return $fn;
        }
    }

    /**
     * Méthode générique pour inclure des composants.
     *
     * @param string $what Type de composant à inclure.
     */
    public function ____METHODS____($what, ...$args) {
        switch ($what) {
            case 'include_component':
                $this->include_component(...$args);
                break;
            
            default:
                # code...
                break;
        }
    }
}

class ScriptManager {
    private $scripts = [];

    public function __construct() {}

    private function _toKey(string $script, ?string $plugin = null, ?string $path = null) : string {
        $key = $script;

        if ($plugin !== null) {
            $key .= "[$plugin]";
        }

        if ($path !== null) {
            $key .= "[$path]";
        }

        return $key;
    }

    public function add(string $script, ?string $plugin = null, ?string $path = null) : bool {
        $returnValue = false;
        $key = $this->_toKey($script, $plugin, $path);

        if (!in_array($key, $this->scripts)) {
            $this->scripts[] = $key;
            $returnValue = true;
        }

        return $returnValue;
    }

    public function exist(string $script, ?string $plugin = null, ?string $path = null) : bool {
        return in_array($this->_toKey($script, $plugin, $path), $this->scripts);
    }
}