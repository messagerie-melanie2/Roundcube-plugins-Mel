<?php

abstract class Program{
    
    private static $CLASSES_TO_LOAD;

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

    abstract public function program_task(); 
    abstract public function init();

    public function public() {}

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

    protected function add_hook($name, $callback)
    {
        $this->plugin->add_hook($name, $callback);
    }

    protected function trigger_hook($name, $args = [])
    {
        return $this->plugin->api->exec_hook($name, $args);
    }

    protected function add_parameters($onLoad, $onSave)
    {
        $this->add_hook('preferences_list', $onLoad);
        $this->add_hook('preferences_save', $onSave);
    }

    protected function create_pref_select($field_id, $current, $names, $values = null, $attrib = null)
    {
  
      if ($attrib === null)
          $attrib = [];
  
      $attrib['name'] = $field_id;
      $attrib['id'] = $field_id;
  
      $input = new html_select($attrib);
  
    //   foreach ($options as $key => $value) {
    //       $input->add();
    //   }
    $input->add($names, $values);
  
      unset($attrib['name']);
      unset($attrib['id']);
      $attrib["for"] = $field_id;
  
      return array(
          'title' => html::label($attrib, rcube::Q($this->plugin->gettext($field_id))),
          'content' => $input->show($current),
        );
    }

    public function need_plugin() {
        return false;
    }
  
    

    public static function load_classes($rc, $plugin)
    {   
        $loaded = [];
        foreach (self::generate($rc, $plugin) as $value) {
            $loaded[] = $value;
        }

        return $loaded;
    }

    public static function generate($rc, $plugin)
    {
        if (self::$CLASSES_TO_LOAD === null) self::$CLASSES_TO_LOAD = [];

        foreach (self::$CLASSES_TO_LOAD as $classname) {
            yield new $classname($rc, $plugin);
        }
    }

    public static function add_class_to_load($classname)
    {
        if (self::$CLASSES_TO_LOAD === null) self::$CLASSES_TO_LOAD = [$classname];
        else self::$CLASSES_TO_LOAD[] = $classname;
    }

}