<?php
include_once __DIR__.'/../consts/drive.php';
include_once __DIR__.'/../interfaces/idrive.php';
include_once __DIR__.'/../program.php';

class Chat extends Program implements iChatActions
{
    public function __construct($rc, $plugin) {
        parent::__construct($rc, $plugin);
    }  

    public function init()
    {
        $this->register_module();
    }

    function program_task()
    {
        return ConstDrive::TASK_NAME;
    }

    function have_plugin($args = false)
    {
        $args = $this->trigger_hook(ConstDrive::HOOK_HAVE_PLUGIN, $args);
        return $args;
    }

    function register_module($args = [])
    {
        $arg = $this->trigger_hook(ConstDrive::HOOK_REGISTER_MODULE, $args);
        return $arg;
    }
}