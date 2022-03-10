<?php

abstract class Program{
    
    protected $rc;
    protected $plugin;
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

    abstract public function init();

    protected function send($html, $plugin = "mel_metapage")
    {
        $this->rc->output->send("$plugin.$html");
    }

    protected function include_js($path)
    {
        $this->plugin->include_script("js/program/$path");
    }

    protected function set_env_var($key, $item)
    {
        $this->rc->output->set_env($key, $item);
    }

    protected function include_css($path, $local = false)
    {
        if ($local)
            $this->plugin->include_stylesheet(__DIR__."/css/$path");
        else
            $this->plugin->include_stylesheet($this->plugin->local_skin_path()."/$path");
    }

    protected function register_action($action, $callback)
    {
        $this->plugin->register_action($action, $callback);
    }

    protected function get_config($key, $default = null)
    {
        if ($default === null)
            return $this->config->get($key);
        else
            return $this->config->get($key, $default);
    }

    protected function save_config($key, $value)
    {
        return $this->rc->user->save_prefs(array($key => $value));
    }

    protected function add_handler($name, $callback)
    {
        $this->rc->output->add_handlers(array(
            $name    => $callback,
        ));
    }

    protected function get_input($arg, $type = rcube_utils::INPUT_GPC)
    {
        return rcube_utils::get_input_value($arg, $type);
    }

    protected function get_input_post($arg)
    {
        return rcube_utils::get_input_value($arg, rcube_utils::INPUT_POST);
    }

    protected function parse($html, $plugin = "mel_metapage", $exit = false, $write = false)
    {
        return $this->rc->output->parse("$plugin.$html", $exit, $write);
    }

    protected function get_plugin($name)
    {
        return $this->rc->plugins->get_plugin($name);
    }

}