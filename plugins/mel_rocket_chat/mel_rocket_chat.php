<?php 
include_once 'module/module_connector.php';
class mel_rocket_chat extends bnum_plugin {
    /**
     *
     * @var string
     */
    public $task = '.*';

    private $module;

    function init() {
        if ($this->rc()->task === 'bnum' || $this->rc()->task === 'chat') {
            if ($this->rc()->action === '' || $this->rc()->action === 'index') $this->setup();
        }

        $this->module = new ChatModuleConnector();
    }

    function setup() {
        $this->load_exts()->load_script_module();
    }

    function load_exts() {
        $files = scandir(__DIR__."/js/lib/extensions");
        $len = count($files);
        for ($i=0; $i < $len; ++$i) { 
            if (strpos($files[$i], ".js") !== false) {
                $this->load_script_module($files[$i], '/js/lib/extensions/');
            }
        }
        return $this;
    }
}