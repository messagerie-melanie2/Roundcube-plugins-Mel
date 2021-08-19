<?php
abstract class amel_lib
{
    protected $plugin;
    protected $rc;
    protected $config;
    protected $task;
    protected $action;

    public function __construct($rc, $plugin) {
        $this->rc = $rc;
        $this->plugin = $plugin;
        $this->config = $this->rc->config;
        $this->task = $this->rc->task;
        $this->action = $this->rc->action;
    }  

    /**
     * Ajoute une variable d'environnement à rcmail.
     *
     * @param string $key - Clé qui permettra de récupérer la valeur.
     * @param any $item - Objet à envoyer.
     * @return void
     */
    protected function set_env_var($key, $item)
    {
        $this->rc->output->set_env($key, $item);
    }

    /**
     * Enregistre une action.
     *
     * @param string $action - Nom de l'action.
     * @param callback $callback - Fonction qui sera appelée.
     * @return void
     */
    protected function register_action($action, $callback)
    {
        $this->plugin->register_action($action, $callback);
    }

    /**
     * Ajoute des handlers.
     *
     * @param string $name - Nom du handler.
     * @param callback $callback - Fonction qui sera appelée.
     * @return void
     */
    protected function add_handler($name, $callback)
    {
        $this->rc->output->add_handlers(array(
            $name    => $callback,
        ));
    }

    /**
     * Récupère les données d'un input.
     *
     * @param string $arg - Clé
     * @param integer $type - Comment on récupère les données ? <see>rcube_utils</see>
     * @return any
     */
    protected function get_input($arg, $type = rcube_utils::INPUT_GPC)
    {
        return rcube_utils::get_input_value($arg, $type);
    }

    /**
     * Parse un template html.
     *
     * @param string $html - Nom du fichier html (sans l'extention).
     * @param string $plugin - Nom du plugin.
     * @param boolean $exit
     * @param boolean $write
     * @return string
     */
    protected function parse($html, $plugin, $exit = false, $write = false)
    {
        return $this->rc->output->parse("$plugin.$html", $exit, $write);
    }

    /**
     * Récupère un plugin.
     *
     * @param string $name - Nom du plugin.
     * @return rcube_plugin
     */
    protected function get_plugin($name)
    {
        return $this->rc->plugins->get_plugin($name);
    }

    /**
     * Récupère un objet de type mel_helper.
     *
     * @return mel_helper
     */
    protected function get_helper()
    {
        return $this->rc->plugins->get_plugin("mel_helper");
    }

    /**
     * Récupère une donnée en config.
     *
     * @param string $key - Clé
     * @return any
     */
    protected function get_config($key)
    {
        return $this->config->get($key);
    }

}