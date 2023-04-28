<?php
abstract class bnum_plugin extends rcube_plugin
{
    private static $module_loaded = false;

    abstract function init();

    protected function load_script_module($name = null) {
        $this->setup_module();
        $args = "'$this->ID'";

        if (isset($name)) $args .= ", '$name'";

        $this->api->output->add_script("runModule($args)", 'docready');
    }

    private function setup_module() {
        if (!self::$module_loaded) {
            $this->include_script_from_plugin('mel_metpage', 'js/always_load/load_module.js');
            self::$module_loaded = true;
        }
    }

    public function include_script_from_plugin($plugin, $fn)
    {
        $ID = rcmail::get_instance()->plugins->get_plugin($plugin)->ID;
        if (is_object($this->output) && $this->output->type == 'html') {
            $src = $this->resource_url_from_plugin($fn, $ID);
            $this->output->include_script($src, 'head_bottom', false);
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
}