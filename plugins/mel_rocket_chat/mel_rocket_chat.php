<?php 
class mel_rocket_chat extends bnum_plugin {
    /**
     *
     * @var string
     */
    public $task = '.*';

    function init() {
        if ($this->rc()->task === 'bnum' || $this->rc()->task === 'chat') {
            if ($this->rc()->action === '' || $this->rc()->action === 'index') $this->setup();
        }
    }

    function setup() {
        $this->load_exts()->load_script_module();
    }

    function load_exts() {
        $files = scandir(__DIR__."/js/extensions");
        $len = count($files);
        for ($i=0; $i < $len; ++$i) { 
            if (strpos($files[$i], ".js") !== false) {
                $this->load_script_module($files[$i], '/js/extensions/');
            }
        }
        return $this;
    }
}