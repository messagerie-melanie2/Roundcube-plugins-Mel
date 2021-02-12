<?php
class Module_Action
{
    public $action_name;
    public $action_item;
    public function __construct($action_name,$object, $func_name) {
        $this->action_name = $action_name;
        $this->action_item = new Module_Action_Item($object, $func_name);
    }

}

class Module_Action_Item
{
    public $object;
    public $function_name;

    public function __construct($object, $func_name) {
        $this->object = $object;
        $this->function_name = $func_name;
    }
}

