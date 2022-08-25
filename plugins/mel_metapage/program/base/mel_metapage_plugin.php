<?php 
include_once __DIR__.'/../consts/consts.php';
abstract class AMelMetapagePlugin extends rcube_plugin
{
    /**
     *
     * @var string
     */
    public $task = '.*';
    /**
     *
     * @var rcmail
     */
    public $rc;

    public function init() {
        $this->rc = rcmail::get_instance();
        $this->register_plugin_task();

        if ($this->must_load_config()) $this->load_config();

        $this->add_localization();
        $this->add_bnum_buttons();
        $this->init_plugin();

        if ($this->rc->task === $this->plugin_task()) $this->setup_plugin();
    }

    protected abstract function init_plugin();
    protected abstract function register_plugin_task();
    protected abstract function plugin_task();
    protected abstract function must_load_config();

    private function setup_plugin()
    {
        $this->include_env();
        $this->include_js();
        $this->include_css();
        $this->add_buttons();
        $this->add_hooks();
        $this->additionnal_setup();
    }

    protected function include_js() {}
    protected function include_css() {}
    protected function include_env() {}
    protected function add_buttons() {}
    protected function add_bnum_buttons() {}
    protected function add_localization() {}
    protected function add_hooks() {}
    protected function register_actions() {}
    protected function additionnal_setup() {} 


    public function have_plugin($args)
    {
        return true;
    }

    public function __get($function_name)
    {
        switch ($function_name) {
            case 'setup_plugin':
                return $this->setup_plugin();
            
            default:
                break;
        }
    }

}