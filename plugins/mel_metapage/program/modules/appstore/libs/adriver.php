<?php
include_once 'idriver.php';
abstract class ADriverBase implements idriver
{
    protected $plugin;

    public function __construct($plugin) {
        $this->plugin = $plugin;
    }

    protected function load_config($conf, $default = null)
    {
        $this->plugin->$rc->config->get($conf, $default);
    }

    protected function save_config($conf, $value)
    {
        $this->plugin->rc->user->save_prefs(array($conf => $value));
    }

    public abstract function get_all();
    public abstract function get($id);
    public abstract function set($id, $item);
    public abstract function need_save_all();
    public abstract function set_all();
}