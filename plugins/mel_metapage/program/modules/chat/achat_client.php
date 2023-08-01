<?php
include_once 'ichat_module.php';
include_once __DIR__.'/../..//program.php';
abstract class AChatClient extends Program implements iChatClient {
    protected $is_setup;

    public function __construct($plugin = null) {
        parent::__construct(rcmail::get_instance(), ($plugin ?? rcmail::get_instance()->plugins->get_plugin('rocket_chat')));
        $this->is_setup = false;
        $this->init();
    } 

    public function program_task() {}
    public function init() {
        $this->setup_hooks();
    }

    public function setup_hooks($force = false) {
        if ((in_array($this->rc->task, $this->test_start_tasks_setup_hook()) || $force) && !$this->is_setup) {
            $hooks = $this->hooks();
            for ($i=0, $len=count($hooks); $i < $len; ++$i) { 
                $hook = $hooks[$i];
                $this->add_hook('chat.'.$hook, [$this, $hook.'_action']);
            }
            $this->is_setup = true;
        }
    }

    protected abstract function hooks() : array;
    protected abstract function test_start_tasks_setup_hook() : array;

    protected function execute_connector($hook_args, $connector) {
        $connector = str_replace('_action', '_connector', $connector);
        $connector = explode('::', $connector)[1];
        $hook_args['echo'] = call_user_func([$this, $connector], ...$hook_args['datas']);
        return $hook_args;
    }
}