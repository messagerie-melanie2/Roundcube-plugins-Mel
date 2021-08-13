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

    protected function set_env_var($key, $item)
    {
        $this->rc->output->set_env($key, $item);
    }

    protected function register_action($action, $callback)
    {
        $this->plugin->register_action($action, $callback);
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

    protected function parse($html, $plugin, $exit = false, $write = false)
    {
        return $this->rc->output->parse("$plugin.$html", $exit, $write);
    }

    protected function get_plugin($name)
    {
        return $this->rc->plugins->get_plugin($name);
    }

    protected function get_helper()
    {
        return $this->rc->plugins->get_plugin("mel_helper");
    }

    protected function get_config($key)
    {
        return $this->config->get($key);
    }

}