<?php 
class mel_rocket_chat extends bnum_plugin {
    /**
     *
     * @var string
     */
    public $task = '.*';

    function init() {
        if ($this->rc()->task === 'chat') {
            $this->setup();
        }
    }

    function setup() {
        $this->load_script_module();
    }
}