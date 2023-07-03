<?php
abstract class bnum_plugin extends rcube_plugin
{
    public const BASE_MODULE_PATH = '/js/lib/';
    public const BASE_MODULE_NAME = 'main';
    private static $module_loaded = false;

    abstract function init();

    protected function load_script_module($name = self::BASE_MODULE_NAME, $path = self::BASE_MODULE_PATH, $save_in_memory = false) {
        $this->setup_module();

        $args = "'$this->ID', '$name', '$path', $save_in_memory";
        
        $this->api->output->add_script("runModule($args)", 'docready');
    }

    protected function setup_module() {
        if (!self::$module_loaded) {
            $this->include_script_from_plugin('mel_metapage', 'js/always_load/load_module.js');
            self::$module_loaded = true;
        }
    }

    public function include_script_from_plugin($plugin, $fn)
    {
        $ID = rcmail::get_instance()->plugins->get_plugin($plugin)->ID;
        if (is_object($this->api->output) && $this->api->output->type == 'html') {
            $src = $this->resource_url_from_plugin($fn, $ID);
            $this->api->include_script($src, 'head_bottom', false);
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

    protected function rc() {
        return rcmail::get_instance();
    }

    protected function storage() {
        return $this->rc()->get_storage();
    }

    protected function is_from_iframe() {
        return rcube_utils::get_input_value('_is_from', rcube_utils::INPUT_GET) !== 'iframe';
    }

    protected function change_location($url) {
        $this->rc->output->header('Location: ' . $url);
    }
}