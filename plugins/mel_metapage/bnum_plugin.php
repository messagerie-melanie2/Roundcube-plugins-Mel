<?php
abstract class bnum_plugin extends rcube_plugin
{
    public const BASE_MODULE_PATH = '/js/lib/';
    public const BASE_MODULE_NAME = 'main';
    private static $module_loaded = false;

    abstract function init();

    protected function load_script_module($name = self::BASE_MODULE_NAME, $path = self::BASE_MODULE_PATH, $save_in_memory = false) {
        $this->load_script_module_from_plugin($this->ID, $name, $path, $save_in_memory);
    }

    protected function load_script_module_from_plugin($plugin, $name = self::BASE_MODULE_NAME, $path = self::BASE_MODULE_PATH, $save_in_memory = false, $where = 'docready') {
        $this->setup_module();

        $args = "'$plugin', '$name', '$path', $save_in_memory";
        
        if ($this->api->output !== null) {
            try {
                $this->api->output->add_script("(() => {runModule($args);})();", $where);
            } catch (\Throwable $th) {
                return null;
            }
        }
    }

    protected function include_component($name, $path = (self::BASE_MODULE_PATH.'html/JsHtml/CustomAttributes/') , $plugin = 'mel_metapage') {
        $this->setup_module();

        $args = "'$plugin', '$name', '$path', false";

        if ($this->api->output !== null) {
            try {
                $this->api->output->add_script("(() => {loadJsModule($args);})();", 'head');
            } catch (\Throwable $th) {
                return null;
            }
        }
    }

    protected function include_script_frame_manager() {
        $this->setup_module();

        $this->include_script_from_plugin('mel_metapage', 'js/scripting_frame_manager.js');
    }

    protected function load_js_page($name) {
        $this->setup_module();

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

    protected function add_script($script, $where = 'head') {
        if ($this->api->output !== null) {
            try {
                $this->api->output->add_script($script, $where);
            } catch (\Throwable $th) {
                return null;
            }
        }
    }

    protected function break_initial_fonctionality($key) {
        $this->add_script("rcmail.addEventListener('$key', function break_fonctionality () {return {break:true}; });");
    }

    protected function setup_module() {
        if (!self::$module_loaded) {
            $this->include_script_from_plugin('mel_metapage', 'js/always_load/load_module.js', 'head');
            self::$module_loaded = true;
        }
    }

    public function include_script_from_plugin($plugin, $fn, $pos = 'head_bottom')
    {
        $ID = rcmail::get_instance()->plugins->get_plugin($plugin)->ID;
        if (is_object($this->api->output) && $this->api->output->type == 'html') {
            $src = $this->resource_url_from_plugin($fn, "plugins/$ID");
            $this->rc()->output->include_script($src, $pos, false);
        }
    }

    /**
     * Make the given file name link into the plugin directory
     *
     * @param string $fn Filename
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
     * Register a handler for a specific client-request action
     *
     * The callback will be executed upon a request like /?_task=mail&_action=plugin.myaction
     *
     * @param string $action   Action name (should be unique)
     * @param mixed  $callback Callback function as string
     *                         or array with object reference and method name
     */
    protected function force_register_action($action, $callback)
    {
        $this->api->register_action($action, $this->ID, $callback, $this->get_current_task());
    }

    protected function rc() {
        return rcmail::get_instance();
    }

    protected function storage() {
        return $this->rc()->get_storage();
    }

    protected function get_current_task() {
        return $this->rc()->task;
    }

    protected function get_current_action() {
        return $this->rc()->action;
    }

    protected function is_index_action() {
        return $this->get_current_action() === '' || $this->get_current_action() === 'index';
    }

    protected function get_input($arg, $type = rcube_utils::INPUT_GPC)
    {
        return rcube_utils::get_input_value($arg, $type);
    }

    protected function get_input_post($arg)
    {
        return rcube_utils::get_input_value($arg, rcube_utils::INPUT_POST);
    }

    protected function get_config($key, $default_value = null) {
        return $this->rc()->config->get($key, $default_value);
    }

    protected function include_css($path, $local = false)
    {
        if ($local)
            $this->include_stylesheet(__DIR__."/css/$path");
        else
            $this->include_stylesheet($this->local_skin_path()."/$path");
    }

    protected function add_handler($name, $callback)
    {
        $this->rc()->output->add_handlers(array(
            $name    => $callback,
        ));
    }

    protected function is_bnum_task() {
        return $this->get_current_task() === 'bnum';
    }

    protected function get_user($uid = null) {
        return driver_mel::gi()->getUser($uid);
    }

    protected function get_user_from_email($email) {
        return  driver_mel::gi()->getUser(null, true, false, null, $email);
    }

    protected function include_web_component() {
        return WebComponnents::Instance();
    } 

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

class WebComponnents {
    private $plugin;
    private static $_instance;

    private function __construct() {
        $this->plugin = rcmail::get_instance()->plugins->get_plugin('mel_metapage');
    }

    private function _include_component($name, $path = (bnum_plugin::BASE_MODULE_PATH.'html/JsHtml/CustomAttributes/') , $plugin = 'mel_metapage') {
        return $this->plugin->____METHODS____('include_component', $name, $path, $plugin);
    }

    public function Tabs() {
        $this->_include_component('tab_web_element');
    }

    public static function Instance() {
        if (!isset(self::$_instance)) self::$_instance = new WebComponnents();

        return self::$_instance;
    }
}