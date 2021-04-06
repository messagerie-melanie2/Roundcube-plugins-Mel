<?php
class MenuItem
{
    public $name;
    public $action;
    function __construct($name, $action) {
        $this->name = $name;
        $this->action = $action;
    }
}