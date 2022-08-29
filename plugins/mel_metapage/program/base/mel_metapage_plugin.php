<?php 
include_once __DIR__.'/../consts/consts.php';
include_once __DIR__.'/../interfaces/imodule.php';
/**
 * Classe de base pour les plugins qui veulent être un module du bnum
 */
abstract class AMelMetapagePlugin extends rcube_plugin implements iModuleHooks
{

    public const BASE_PLUGIN = 'mel_metapage';

    /**
     *
     * @var string
     */
    public $task = '.*';
    /**
     *
     * @var rcmail
     */
    public $rc;

    public function init() {
        $this->rc = rcmail::get_instance();

        if ($this->must_load_config()) $this->load_config();

        $this->add_localization();
        $this->add_bnum_buttons();
        $this->init_plugin();

        if ($this->rc->task === $this->plugin_task()) $this->setup_plugin();
    }

    /**
     * Actions à faire lorsque l'on est dans la tâche du module.
     *
     * @return void
     */
    private function setup_plugin()
    {
        $this->include_env();
        $this->include_js();
        $this->include_css();
        $this->add_buttons();
        $this->add_hooks();
        $this->additionnal_setup();
    }

    /**
     * Connecteur qui appellera la fonction 'page_index' et qui est lié à mel_metapage
     *
     * @param [type] $args
     * @return void
     */
    public abstract function connector_index($args);
    /**
     * Envoie la page 'index'
     *
     * @param array $args
     * @return void
     */
    public abstract function page_index($args = []);
    /**
     * Initialise le plugin
     *
     * @return void
     */
    protected abstract function init_plugin();

    /**
     * Enregistre le module
     *
     * @return void
     */
    public abstract function register_module($args = []);

    /**
     * Renvoie la nom de la tâche du plugin
     *
     * @return string
     */
    protected abstract function plugin_task();
    /**
     * Indique si la configuration doit être chargée
     *
     * @return bool
     */
    protected abstract function must_load_config();

    /**
     * Inclut le javascript de la tâche
     *
     * @return void
     */
    protected function include_js() {}
    /**
     * Inclut le css de la tâche
     *
     * @return void
     */
    protected function include_css() {}
    /**
     * Inclut les variables d'environnements de la tâche
     *
     * @return void
     */
    protected function include_env() {}
    /**
     * Ajoute les boutons de la tâche
     *
     * @return void
     */
    protected function add_buttons() {}
    /**
     * Ajoute les boutons du plugin
     *
     * @return void
     */
    protected function add_bnum_buttons() {}
    /**
     * Initialise les hooks
     *
     * @return void
     */
    protected function add_hooks() {}
    /**
     * Enregistre les actions non prévu par le bnum
     *
     * @return void
     */
    protected function register_actions() {}
    /**
     * Autres actions
     *
     * @return void
     */
    protected function additionnal_setup() {} 
    
    /**
     * Ajoute la localisation du plugin
     *
     * @return void
     */
    protected function add_localization() {
        $this->add_texts('localization/', true);
    }

    /**
     * Si le plugin lié éxiste
     *
     * @param [type] $args
     * @return bool
     */
    public function have_plugin($args = false)
    {
        return [Consts::RETURN => true];
    }

    function register_task($task)
    {
        $this->rc->plugins->get_plugin(self::BASE_PLUGIN)->register_task($task);
    }

    /**
     * Accède aux fonctions privés
     *
     * @param [type] $function_name
     * @return any
     */
    public function __get($function_name)
    {
        switch ($function_name) {
            case 'setup_plugin':
                return $this->setup_plugin();
            
            default:
                break;
        }
    }

}