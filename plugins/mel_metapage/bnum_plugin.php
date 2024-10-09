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

    protected function load_script_module_from_plugin($plugin, $name = self::BASE_MODULE_NAME, $path = self::BASE_MODULE_PATH, $save_in_memory = false,  $where = 'docready') {
        $this->setup_module();

        $args = "'$plugin', '$name', '$path', $save_in_memory";
        
        if ($this->api->output !== null) {
            try {
                $this->api->output->add_script("runModule($args)", $where);
            } catch (\Throwable $th) {
                return null;
            }
        }
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

    public function include_component($name, $path = (self::BASE_MODULE_PATH.'html/JsHtml/CustomAttributes') , $plugin = 'mel_metapage') {
        // $this->setup_module();

        // $args = "'$plugin', '$name', '$path', false";

        // if ($this->api->output !== null) {
        //     try {
        //         $this->api->output->add_script("(() => {loadJsModule($args);})();", 'head');
        //     } catch (\Throwable $th) {
        //         return null;
        //     }
        // }
        if ($path[0] === '/') $path = substr($path, 1);

        $this->include_script_from_plugin($plugin, "$path/$name/scriptType:module", 'head');
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

    protected function include_css($path, $local = false)
    {
        if ($local)
            $this->include_stylesheet(__DIR__."/css/$path");
        else
            $this->include_stylesheet($this->local_skin_path()."/$path");
    }

    protected function exec_hook($hook, $args = []) {
        return $this->rc()->plugins->exec_hook($hook, $args);
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

}