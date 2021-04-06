<?php
/**
 * Représentation de l'action d'un module.
 */
class Module_Action
{
    /**
     * Nom de l'action
     */
    public $action_name;
    /**
     * Données de l'action.
     */
    public $action_item;
    public function __construct($action_name,$object, $func_name) {
        $this->action_name = $action_name;
        $this->action_item = new Module_Action_Item($object, $func_name);
    }

}

/**
 * Liaison un l'objet et son action.
 */
class Module_Action_Item
{
    /**
     * Objet qui contient l'action.
     */
    public $object;
    /**
     * nom de la fonction.
     */
    public $function_name;

    public function __construct($object, $func_name) {
        $this->object = $object;
        $this->function_name = $func_name;
    }
}

